import os
import random
import time
import asyncio
from typing import Dict, Optional, Any
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import socketio
from pydantic import BaseModel

# FastAPI setup
app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

# Static files
app.mount("/static", StaticFiles(directory="."), name="static")

# Mock DB or real DB connection (psycopg2/asyncpg would be needed for Postgres)
# For now, keeping it simple as a proof of concept
class PlayerProfile(BaseModel):
    name: str = "Игрок"
    avatar: Optional[str] = None
    charType: str = "mage"
    atk: float = 1.0
    def_: float = 1.0
    spd: float = 1.0
    weaponVisual: Optional[str] = None

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
        "weaponVisual": raw.get("weaponVisual"),
    }

@sio.event
async def connect(sid, environ):
    print(f"Connected: {sid}")

@sio.event
async def play(sid, profile):
    global waiting_player
    normalized = normalize_profile(profile)
    
    # Clear from queue if already there
    if waiting_player and waiting_player["sid"] == sid:
        waiting_player = None
        
    # Clear from active matches
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
        
        print(f"Match started: {room_id}")
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
    print(f"Disconnected: {sid}")

@app.get("/")
async def get_index():
    return FileResponse("index.html")

# Mock Telegram API and other endpoints from Node server
@app.post("/api/sync-user")
async def sync_user(request: Request):
    data = await request.json()
    # In a real app, save to Postgres here
    return {"ok": True, "username": data.get("username", "player"), "charId": data.get("character_id")}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)
