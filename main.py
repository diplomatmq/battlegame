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
fastapi_app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
# Railway and Railpack look for 'app' by default
app = socketio.ASGIApp(sio, fastapi_app)

# Static files - serving the compiled JS and assets
if os.path.exists("dist"):
    fastapi_app.mount("/dist", StaticFiles(directory="dist"), name="dist")

# Mock DB or real DB connection (psycopg2/asyncpg would be needed for Postgres)
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

# Routes for all game pages
@fastapi_app.get("/")
async def get_index():
    return FileResponse("index.html")

@fastapi_app.get("/{page_name}.html")
async def get_html_page(page_name: str):
    file_path = f"{page_name}.html"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return JSONResponse({"error": "Page not found"}, status_code=404)

# Fallback to serve index.html for any other route (SPA-like)
@fastapi_app.get("/{full_path:path}")
async def catch_all(full_path: str):
    # Don't catch api calls
    if full_path.startswith("api/"):
        return JSONResponse({"error": "API route not found"}, status_code=404)
    # Check if it's a file that exists (like manifest.json, etc)
    if os.path.exists(full_path) and os.path.isfile(full_path):
        return FileResponse(full_path)
    return FileResponse("index.html")

@fastapi_app.post("/api/sync-user")
async def sync_user(request: Request):
    data = await request.json()
    return {"ok": True, "username": data.get("username", "player"), "charId": data.get("character_id")}

if __name__ == "__main__":
    import uvicorn
    # Local development use
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
