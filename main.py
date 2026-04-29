import os
import random
import time
import asyncio
import logging
from typing import Dict, Optional, Any
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

# --- Конфигурация из переменных окружения ---
DATABASE_URL = os.getenv("DATABASE_URL")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
WEBHOOK_URL = os.getenv("WEBHOOK_URL")
WEB_APP_BASE_URL = os.getenv("WEB_APP_BASE_URL", WEBHOOK_URL)

# --- FastAPI & Socket.io setup ---
fastapi_app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*', logger=True, engineio_logger=True)
# Railway and Railpack look for 'app' by default
app = socketio.ASGIApp(sio, fastapi_app)

# --- Telegram Bot setup (aiogram) ---
bot = Bot(token=TELEGRAM_TOKEN) if TELEGRAM_TOKEN else None
dp = Dispatcher() if TELEGRAM_TOKEN else None

# --- Database Pool ---
pool = None

async def get_db_pool():
    global pool
    if pool is None and DATABASE_URL:
        pool = await asyncpg.create_pool(DATABASE_URL)
    return pool

@fastapi_app.on_event("startup")
async def startup_event():
    await get_db_pool()
    if bot and WEBHOOK_URL:
        webhook_path = f"/bot/{TELEGRAM_TOKEN}"
        url = f"{WEBHOOK_URL.rstrip('/')}{webhook_path}"
        await bot.set_webhook(url)
        logger.info(f"Telegram webhook set to: {url}")

@fastapi_app.on_event("shutdown")
async def shutdown_event():
    if pool:
        await pool.close()

# --- Telegram Webhook Endpoint ---
@fastapi_app.post(f"/bot/{{token}}")
async def telegram_webhook(token: str, request: Request):
    if token != TELEGRAM_TOKEN:
        return JSONResponse({"error": "Unauthorized"}, status_code=403)
    
    update = await request.json()
    # Обработка обновлений через aiogram
    if dp:
        telegram_update = types.Update(**update)
        await dp.feed_update(bot, telegram_update)
    return {"ok": True}

# --- Bot Handlers ---
if dp:
    @dp.message()
    async def start_handler(message: types.Message):
        if message.text == "/start":
            user_id = message.from_user.id
            username = message.from_user.username or message.from_user.first_name
            
            # Регистрация в БД (аналог Node.js logic)
            db = await get_db_pool()
            if db:
                await db.execute(
                    """INSERT INTO players (telegram_id, username)
                       VALUES ($1, $2)
                       ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username""",
                    str(user_id), username
                )
                
                char_res = await db.fetchrow(
                    "SELECT character_id FROM user_characters uc JOIN players p ON p.id = uc.user_id WHERE p.telegram_id = $1 LIMIT 1",
                    str(user_id)
                )
                target_page = "menu.html" if char_res else "character.html"
            else:
                target_page = "character.html"

            url = f"{WEB_APP_BASE_URL.rstrip('/')}/index.html?page={target_page}&tg={user_id}"
            
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="Играть", web_app=WebAppInfo(url=url))]
            ])
            
            await message.answer("Добро пожаловать в Battle Realm! Нажми 'Играть', чтобы войти в игру.", reply_markup=kb)

# --- Static files ---
if os.path.exists("dist"):
    fastapi_app.mount("/dist", StaticFiles(directory="dist"), name="dist")

# --- Socket.io Logic ---
waiting_player: Optional[Dict[str, Any]] = None
active_matches: Dict[str, Dict[str, Any]] = {}

def normalize_profile(raw: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "name": str(raw.get("name", "Игрок"))[:20],
        "avatar": raw.get("avatar"),
        "charType": str(raw.get("charType", "mage")),
        "atk": float(raw.get("atk", 1.0)),
        "def": float(raw.get("def", 1.0)),
        "spd": float(raw.get("spd", 1.0)),
        "maxHp": float(raw.get("maxHp", 1000.0)),
        "weaponVisual": raw.get("weaponVisual"),
    }

@sio.event
async def connect(sid, environ):
    logger.info(f"Connected: {sid}")

@sio.event
async def play(sid, profile):
    global waiting_player
    normalized = normalize_profile(profile)
    
    if waiting_player and waiting_player["sid"] == sid:
        waiting_player = None
        
    if sid in active_matches:
        match = active_matches.pop(sid, None)
        if match:
            opp_sid = match["opponent_id"]
            active_matches.pop(opp_sid, None)
            await sio.emit("opponent_left", room=opp_sid)

    if waiting_player:
        host = waiting_player
        waiting_player = None
        
        room_id = f"match_{int(time.time())}_{random.randint(1000, 9999)}"
        seed = random.randint(1, 1000000)
        
        await sio.enter_room(host["sid"], room_id)
        await sio.enter_room(sid, room_id)
        
        active_matches[host["sid"]] = {"room_id": room_id, "opponent_id": sid, "role": "host"}
        active_matches[sid] = {"room_id": room_id, "opponent_id": host["sid"], "role": "guest"}
        
        await sio.emit("startGame", {
            "roomId": room_id,
            "seed": seed,
            "isHost": True,
            "profile": normalized
        }, room=host["sid"])
        
        await sio.emit("startGame", {
            "roomId": room_id,
            "seed": seed,
            "isHost": False,
            "profile": host["profile"]
        }, room=sid)
    else:
        waiting_player = {"sid": sid, "profile": normalized}
        await sio.emit("waiting", room=sid)

@sio.event
async def battle_state(sid, payload):
    match = active_matches.get(sid)
    if match and match["role"] == "host":
        await sio.emit("battle_state", payload, room=match["opponent_id"])

@sio.event
async def battle_over(sid, payload):
    match = active_matches.get(sid)
    if match:
        await sio.emit("battle_over", payload or {}, room=match["opponent_id"])
        opp_sid = match["opponent_id"]
        active_matches.pop(sid, None)
        active_matches.pop(opp_sid, None)

@sio.event
async def disconnect(sid):
    global waiting_player
    if waiting_player and waiting_player["sid"] == sid:
        waiting_player = None
    match = active_matches.pop(sid, None)
    if match:
        opp_sid = match["opponent_id"]
        active_matches.pop(opp_sid, None)
        await sio.emit("opponent_left", room=opp_sid)

# --- Routes ---
@fastapi_app.get("/")
async def get_index():
    return FileResponse("index.html")

@fastapi_app.get("/{page_name}.html")
async def get_html_page(page_name: str):
    file_path = f"{page_name}.html"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return JSONResponse({"error": "Page not found"}, status_code=404)

@fastapi_app.get("/{full_path:path}")
async def catch_all(full_path: str):
    if full_path.startswith("api/"):
        return JSONResponse({"error": "API route not found"}, status_code=404)
    if os.path.exists(full_path) and os.path.isfile(full_path):
        return FileResponse(full_path)
    return FileResponse("index.html")

@fastapi_app.post("/api/sync-user")
async def sync_user(request: Request):
    data = await request.json()
    telegram_id = data.get("telegram_id")
    username = data.get("username")
    char_id = data.get("character_id")
    
    db = await get_db_pool()
    if db and telegram_id:
        await db.execute(
            "INSERT INTO players (telegram_id, username) VALUES ($1, $2) ON CONFLICT (telegram_id) DO UPDATE SET username = EXCLUDED.username",
            str(telegram_id), username
        )
        if char_id:
            # Simple ensure char logic
            user_id_row = await db.fetchrow("SELECT id FROM players WHERE telegram_id = $1", str(telegram_id))
            if user_id_row:
                await db.execute(
                    "INSERT INTO user_characters (user_id, character_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                    user_id_row['id'], char_id
                )
    
    return {"ok": True, "username": username, "charId": char_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
