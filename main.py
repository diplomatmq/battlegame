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

    def serialize(self):
        return {
            "x": self.x, "y": self.y, "hp": self.hp,
            "fighterState": self.state, "hitTimer": self.hit_timer,
            "charType": self.char_type
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
        
        # Simple movement/attack logic (simplified port of TS logic)
        dist = abs(self.f1.x - self.f2.x)
        
        for f, opp in [(self.f1, self.f2), (self.f2, self.f1)]:
            if f.hit_timer > 0: f.hit_timer -= 1
            if f.state_timer > 0: f.state_timer -= 1
            if f.attack_cd > 0: f.attack_cd -= 1
            
            if f.state == "idle":
                if f.attack_cd <= 0:
                    f.state = "moving"
                else:
                    f.x += (200 if f.side == 'host' else 700 - f.x) * 0.05
            
            if f.state == "moving":
                target_x = opp.x - 60 if f.x < opp.x else opp.x + 60
                f.x += (target_x - f.x) * 0.1
                if dist < 80:
                    f.state = "attacking"
                    f.state_timer = 15
                    f.attack_cd = 60
                    # Deal damage
                    dmg = max(5, (f.atk * 40) - (opp.def_ * 5))
                    opp.hp -= dmg
                    opp.hit_timer = 10
            
            if f.state == "attacking" and f.state_timer <= 0:
                f.state = "idle"

        if self.f1.hp <= 0 or self.f2.hp <= 0:
            self.game_over = True
            self.winner = "host" if self.f2.hp <= 0 else "guest"

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
waiting_player = None
@sio.event
async def play(sid, profile):
    global waiting_player
    if waiting_player and waiting_player != sid:
        host_sid = waiting_player
        waiting_player = None
        room_id = f"battle_{int(time.time())}"
        await sio.enter_room(host_sid, room_id)
        await sio.enter_room(sid, room_id)
        
        # In real app, fetch profiles from DB. For now use what client sent.
        active_battles[room_id] = BattleInstance(room_id, host_sid, sid, profile, profile) # Dummy profiles
        
        await sio.emit("startGame", {"roomId": room_id, "isHost": True, "profile": profile}, room=host_sid)
        await sio.emit("startGame", {"roomId": room_id, "isHost": False, "profile": profile}, room=sid)
    else:
        waiting_player = sid
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
