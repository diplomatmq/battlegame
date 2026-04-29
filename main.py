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

# --- Настройка логирования ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Конфигурация ---
DATABASE_URL = os.getenv("DATABASE_URL")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
WEBHOOK_URL = os.getenv("WEBHOOK_URL")
WEB_APP_BASE_URL = os.getenv("WEB_APP_BASE_URL", WEBHOOK_URL)

# --- FastAPI & Socket.io ---
fastapi_app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = socketio.ASGIApp(sio, fastapi_app)

bot = Bot(token=TELEGRAM_TOKEN) if TELEGRAM_TOKEN else None
dp = Dispatcher() if TELEGRAM_TOKEN else None
pool = None

async def get_db_pool():
    global pool
    if pool is None and DATABASE_URL:
        pool = await asyncpg.create_pool(DATABASE_URL)
    return pool

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
        rooms_to_remove = []
        for room_id, battle in active_battles.items():
            battle.update()
            state = battle.get_state()
            await sio.emit("battle_state", {"state": state}, room=room_id)
            
            if battle.game_over:
                await sio.emit("battle_over", {"outcome": battle.winner}, room=room_id)
                rooms_to_remove.append(room_id)
        
        for rid in rooms_to_remove:
            del active_battles[rid]
            
        # Maintain ~20 FPS
        sleep_time = max(0, 0.05 - (time.time() - start_time))
        await asyncio.sleep(sleep_time)

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

@fastapi_app.post("/bot/{token}")
async def telegram_webhook(token: str, request: Request):
    if dp and token == TELEGRAM_TOKEN:
        update = types.Update(**await request.json())
        await dp.feed_update(bot, update)
    return {"ok": True}

@fastapi_app.get("/{path:path}")
async def static_proxy(path: str):
    if not path: path = "index.html"
    if os.path.exists(path): return FileResponse(path)
    return FileResponse("index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
