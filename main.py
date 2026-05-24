import os
import random
import time
import asyncio
import logging
from typing import Dict, Optional, Any, List
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import socketio
from pydantic import BaseModel
import asyncpg
from aiogram import Bot, Dispatcher, types
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

# --- Настройка логирования ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Конфигурация ---
DATABASE_URL = os.getenv("DATABASE_URL")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
WEBHOOK_URL = os.getenv("WEBHOOK_URL")

# --- FastAPI & Socket.io ---
fastapi_app = FastAPI()

# Add CORS middleware to FastAPI
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    allow_eio3=True,
    logger=True,
    engineio_logger=True
)
app = socketio.ASGIApp(sio, fastapi_app, socketio_path='/socket.io')

bot = Bot(token=TELEGRAM_TOKEN) if TELEGRAM_TOKEN else None
dp = Dispatcher() if TELEGRAM_TOKEN else None
pool = None

async def get_db_pool():
    global pool
    if pool is None and DATABASE_URL:
        pool = await asyncpg.create_pool(DATABASE_URL)
    return pool

# --- Модели данных ---
class SyncUserRequest(BaseModel):
    telegram_id: str
    username: Optional[str] = None
    character_id: Optional[str] = None
    faction: Optional[str] = None

class CharacterRequest(BaseModel):
    telegram_id: str
    character_id: str
    faction: Optional[str] = "human"

class TelegramRequest(BaseModel):
    chatId: int
    text: str

# --- База данных (утилиты) ---
async def register_player(telegram_id: str, username: str):
    pool = await get_db_pool()
    if not pool: return None
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """INSERT INTO players (telegram_id, username)
                   VALUES ($1, $2)
                   ON CONFLICT (telegram_id)
                   DO UPDATE SET username = CASE
                     WHEN EXCLUDED.username IS NULL OR EXCLUDED.username = '' THEN players.username
                     ELSE EXCLUDED.username
                   END
                   RETURNING id""",
                str(telegram_id), username
            )
            return row['id']
    except Exception as e:
        logger.error(f"DB register_player error: {e}")
        return None

async def add_user_character(user_id: int, character_id: str, faction: str):
    pool = await get_db_pool()
    if not pool: return
    try:
        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO user_characters (user_id, character_id, faction) VALUES ($1, $2, $3)",
                user_id, character_id, faction
            )
    except Exception as e:
        logger.error(f"DB add_user_character error: {e}")

async def ensure_user_character_for_user_id(user_id: int, character_id: str, faction: str):
    pool = await get_db_pool()
    if not pool: return {"created": False, "updated": False}
    try:
        async with pool.acquire() as conn:
            existing = await conn.fetchrow(
                "SELECT id, character_id FROM user_characters WHERE user_id = $1 ORDER BY id DESC LIMIT 1",
                user_id
            )
            if not existing:
                await add_user_character(user_id, character_id, faction)
                return {"created": True, "updated": False}
            
            if existing['character_id'] != character_id:
                await conn.execute(
                    "UPDATE user_characters SET character_id = $1, faction = $2 WHERE id = $3",
                    character_id, faction, existing['id']
                )
                return {"created": False, "updated": True}
            
            return {"created": False, "updated": False}
    except Exception as e:
        logger.error(f"DB ensure_user_character_for_user_id error: {e}")
        return {"created": False, "updated": False}

async def ensure_user_character_by_telegram_id(telegram_id: str, character_id: str, faction: str):
    pool = await get_db_pool()
    if not pool: return None
    try:
        async with pool.acquire() as conn:
            user_res = await conn.fetchrow('SELECT id FROM players WHERE telegram_id = $1 LIMIT 1', str(telegram_id))
            if not user_res: return None
            return await ensure_user_character_for_user_id(user_res['id'], character_id, faction)
    except Exception as e:
        logger.error(f"DB ensure_user_character_by_telegram_id error: {e}")
        return None

# --- API Роуты ---

@fastapi_app.post("/api/sync-user")
async def sync_user(req: SyncUserRequest):
    telegram_id = str(req.telegram_id)
    username = req.username or f"player_{telegram_id}"
    character_id = req.character_id
    faction = req.faction or "human"
    
    try:
        await register_player(telegram_id, username)
        sync_result = {"created": False, "updated": False}
        if character_id:
            res = await ensure_user_character_by_telegram_id(telegram_id, character_id, faction)
            if res: sync_result = res
            
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            profile = await conn.fetchrow(
                """SELECT p.username, uc.character_id
                   FROM players p
                   LEFT JOIN user_characters uc ON uc.user_id = p.id
                   WHERE p.telegram_id = $1
                   ORDER BY uc.created_at DESC NULLS LAST
                   LIMIT 1""",
                telegram_id
            )
            
            row = profile if profile else None
            return {
                "ok": True,
                "id": telegram_id,
                "username": row['username'] if row and row['username'] else username,
                "charId": row['character_id'] if row else None,
                "sync": sync_result
            }
    except Exception as e:
        logger.error(f"API /api/sync-user error: {e}")
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e)})

@fastapi_app.get("/api/user/{user_id}")
async def get_user_info(user_id: str, username: Optional[str] = None, charId: Optional[str] = None):
    try:
        avatar = None
        # Try to get avatar from Telegram
        if bot:
            try:
                chat = await bot.get_chat(user_id)
                if not username and chat:
                    username = chat.username or chat.first_name
                
                photos = await bot.get_user_profile_photos(user_id, limit=1)
                if photos and photos.total_count > 0:
                    file_id = photos.photos[0][0].file_id
                    file = await bot.get_file(file_id)
                    if file and file.file_path:
                        avatar = f"https://api.telegram.org/file/bot{TELEGRAM_TOKEN}/{file.file_path}"
            except Exception as e:
                logger.warn(f"Telegram API error for user {user_id}: {e}")

        await register_player(str(user_id), username or f"player_{user_id}")
        
        if charId:
            await ensure_user_character_by_telegram_id(str(user_id), charId, "human")
            
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            char_res = await conn.fetchrow(
                """SELECT p.username, uc.character_id 
                   FROM players p 
                   LEFT JOIN user_characters uc ON p.id = uc.user_id 
                   WHERE p.telegram_id = $1 
                   ORDER BY uc.created_at DESC NULLS LAST LIMIT 1""",
                str(user_id)
            )
            if char_res:
                if not username: username = char_res['username']
                charId = char_res['character_id']
                
        return {"ok": True, "id": user_id, "username": username, "avatar": avatar, "charId": charId}
    except Exception as e:
        logger.error(f"API /api/user/{user_id} error: {e}")
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e)})

@fastapi_app.post("/api/character")
async def save_character(req: CharacterRequest):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            user_res = await conn.fetchrow('SELECT id FROM players WHERE telegram_id = $1', str(req.telegram_id))
            if not user_res:
                return JSONResponse(status_code=404, content={"ok": False, "error": "User not found"})
            
            sync = await ensure_user_character_for_user_id(user_res['id'], req.character_id, req.faction or "human")
            return {"ok": True, "sync": sync}
    except Exception as e:
        logger.error(f"API /api/character error: {e}")
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e)})

@fastapi_app.post("/telegram")
async def send_telegram_msg(req: TelegramRequest):
    if not bot: return {"ok": False, "error": "Bot not initialized"}
    try:
        await bot.send_message(req.chatId, req.text)
        return {"ok": True}
    except Exception as e:
        logger.error(f"API /telegram error: {e}")
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e)})

# --- Server-Side Battle Engine ---
class ServerFighter:
    def __init__(self, side: str, profile: Dict):
        self.side = side # 'host' or 'guest'
        self.x = 200 if side == 'host' else 700
        self.y = 480
        self.hp = float(profile.get('maxHp', 1000))
        self.max_hp = self.hp
        self.atk = float(profile.get('atk', 1.0))
        self.def_ = float(profile.get('def', 1.0))
        self.spd = float(profile.get('spd', 1.0))
        self.char_type = profile.get('charType', 'knight')
        self.state = "idle"
        self.state_timer = 0
        self.attack_cd = 0
        self.hit_timer = 0
        
        # Class-specific config
        self.range = 80
        if self.char_type in ["mage", "jade_mage", "necromancer"]:
            self.range = 250
        elif self.char_type == "scarlet_assassin":
            self.range = 60
            self.spd *= 1.4

    def serialize(self):
        # Client expects: "idle", "moving", "attacking", "death", "victory"
        # Map server state to client state
        client_state = self.state
        if self.hp <= 0:
            client_state = "death"
            
        return {
            "x": self.x,
            "y": self.y,
            "hp": self.hp,
            "fighterState": client_state,
            "hitTimer": self.hit_timer,
            "charType": self.char_type,
            "color": "#fff" # Default color, client will override if needed
        }

class BattleInstance:
    def __init__(self, room_id: str, host_sid: str, guest_sid: str, host_p: Dict, guest_p: Dict):
        self.room_id = room_id
        self.host_sid = host_sid
        self.guest_sid = guest_sid
        self.f1 = ServerFighter('host', host_p)
        self.f2 = ServerFighter('guest', guest_p)
        self.game_over = False
        self.winner = None

    def update(self):
        if self.game_over: return
        
        fighters = [self.f1, self.f2]
        # random.shuffle(fighters) # Randomize update order to prevent host advantage

        for f in fighters:
            if f.hp <= 0: continue
            
            opp = self.f2 if f == self.f1 else self.f1
            dist = abs(f.x - opp.x)
            
            if f.hit_timer > 0: f.hit_timer -= 1
            if f.state_timer > 0: f.state_timer -= 1
            if f.attack_cd > 0: f.attack_cd -= 1
            
            if f.state == "idle":
                if f.attack_cd <= 0:
                    f.state = "moving"
                else:
                    # Drift around starting position
                    target_idle = 200 if f.side == 'host' else 700
                    f.x += (target_idle - f.x) * 0.05
            
            elif f.state == "moving":
                # Move towards opponent
                direction = 1 if opp.x > f.x else -1
                target_x = opp.x - (f.range * 0.7 * direction)
                
                # Move speed based on spd stat
                move_step = 6 * f.spd # Slightly faster
                if abs(f.x - target_x) < move_step:
                    f.x = target_x
                else:
                    f.x += direction * move_step
                
                if dist < f.range:
                    f.state = "attacking"
                    f.state_timer = 25 # Animation duration
                    f.attack_cd = max(30, 85 - (f.spd * 6))
                    
                    # Deal damage (Server Authority)
                    base_dmg = 45 * f.atk # Reduced base damage to avoid instant death
                    if f.char_type == "scarlet_assassin": base_dmg *= 0.7 
                    
                    reduction = (opp.def_ - 1) * 3
                    final_dmg = max(10, base_dmg - reduction)
                    
                    opp.hp -= final_dmg
                    opp.hit_timer = 15
                    logger.info(f"Battle {self.room_id}: {f.side} hit {opp.side} for {final_dmg}. HP left: {opp.hp}")
            
            elif f.state == "attacking":
                if f.state_timer <= 0:
                    f.state = "idle"

        if self.f1.hp <= 0 or self.f2.hp <= 0:
            self.game_over = True
            if self.f1.hp <= 0 and self.f2.hp <= 0:
                self.winner = "draw"
            else:
                self.winner = "host" if self.f2.hp <= 0 else "guest"
            logger.info(f"Battle {self.room_id} over. Winner: {self.winner}")

    def get_state(self):
        return {
            "host": self.f1.serialize(),
            "guest": self.f2.serialize(),
            "gameOver": self.game_over
        }

active_battles: Dict[str, BattleInstance] = {}

async def battle_loop():
    while True:
        start_time = time.time()
        # The server no longer runs the simulation. 
        # Clients are synced via the shared seed and report their own outcomes.
        # We can still check for timed-out rooms here if needed.
        
        # Maintain a lower heartbeat frequency
        await asyncio.sleep(1.0)

@fastapi_app.on_event("startup")
async def startup_event():
    await get_db_pool()
    asyncio.create_task(battle_loop())
    if bot and WEBHOOK_URL:
        await bot.set_webhook(f"{WEBHOOK_URL.rstrip('/')}/bot/{TELEGRAM_TOKEN}")

# --- Rest of handlers (Play, Connect, Sync) ---
waiting_player = None # Store as (sid, profile)
@sio.event
async def play(sid, profile):
    global waiting_player
    if waiting_player and waiting_player[0] != sid:
        host_sid, host_profile = waiting_player
        waiting_player = None
        room_id = f"battle_{int(time.time())}"
        await sio.enter_room(host_sid, room_id)
        await sio.enter_room(sid, room_id)
        
        # Generate a shared seed for deterministic client-side simulation
        seed = random.randint(1, 1000000)
        
        # In real app, fetch profiles from DB. For now use what client sent.
        # We keep the BattleInstance only to track game state if needed, 
        # but the clients will run the heavy simulation locally using the seed.
        active_battles[room_id] = BattleInstance(room_id, host_sid, sid, host_profile, profile)
        
        # Send opponent's profile and the shared seed to each player
        await sio.emit("startGame", {"roomId": room_id, "isHost": True, "profile": profile, "seed": seed}, room=host_sid)
        await sio.emit("startGame", {"roomId": room_id, "isHost": False, "profile": host_profile, "seed": seed}, room=sid)
    else:
        waiting_player = (sid, profile)
        await sio.emit("waiting", room=sid)

@sio.event
async def battle_state(sid, data):
    room_id = data.get("roomId")
    state = data.get("state")
    if room_id:
        # Relay state to other players in the room except sender
        await sio.emit("battle_state", {"state": state}, room=room_id, skip_sid=sid)

@sio.event
async def battle_over(sid, data):
    room_id = data.get("roomId")
    outcome = data.get("outcome")
    if room_id:
        # Broadcast outcome to everyone in the room
        await sio.emit("battle_over", {"outcome": outcome}, room=room_id)
        # Clean up battle instance after a short delay
        async def cleanup():
            await asyncio.sleep(2.0)
            if room_id in active_battles:
                del active_battles[room_id]
        asyncio.create_task(cleanup())

@sio.event
async def disconnect(sid):
    global waiting_player
    if waiting_player and waiting_player[0] == sid:
        waiting_player = None
    
    # Notify opponent if in a battle
    for room_id, battle in list(active_battles.items()):
        if sid == battle.host_sid or sid == battle.guest_sid:
            await sio.emit("opponent_left", room=room_id)
            if room_id in active_battles:
                del active_battles[room_id]
            break

@fastapi_app.post("/bot/{token}")
async def telegram_webhook(token: str, request: Request):
    if dp and token == TELEGRAM_TOKEN:
        update = types.Update(**await request.json())
        await dp.feed_update(bot, update)
    return {"ok": True}

@fastapi_app.get("/health")
async def health_check():
    return {"status": "ok", "socketio": socketio.__version__ if hasattr(socketio, "__version__") else "unknown"}

# Mount static files correctly
fastapi_app.mount("/dist", StaticFiles(directory="dist"), name="dist")
fastapi_app.mount("/src", StaticFiles(directory="src"), name="src")

@fastapi_app.get("/{path:path}")
async def static_proxy(path: str):
    if not path or path == "/": path = "index.html"
    
    # Check if file exists in root
    if os.path.exists(path) and os.path.isfile(path):
        return FileResponse(path)
    
    # Fallback to index.html for SPA routing
    return FileResponse("index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
