// game.ts — entry point for game.html
import { Fighter, state } from "./fighter.js";
import { JadeMageFighter } from "./jade-mage.js";
import { CryoKnightFighter } from "./cryo-knight-fighter.js";
import { CHAR_META, getNick, getCharId, getAvatar, getTotalStats, getEquippedWeaponVisual, addXP, getRandomEnemy, recordFightPlayed, recordFightWon, syncProfileToServer } from "./player.js";
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const ARENA_WIDTH = 900;
const ARENA_HEIGHT = 600;
const ARENA_FLOOR_Y = 480;
const particles = [];
const damageTexts = [];
// --- Player data ---
const savedCharId = (getCharId() ?? "mage");
const savedNick = getNick() ?? "\u0417\u0410\u0429\u0418\u0422\u041d\u0418\u041a";
const savedAvatar = getAvatar();
const meta = CHAR_META[savedCharId];
void syncProfileToServer({ username: savedNick, charId: savedCharId });
// --- Seeded RNG for synced auto-battler ---
let currentSeed = Math.random() * 1000000;
function pseudoRandom() {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
}
// Override Math.random with seeded random only during combat updates
const originalMathRandom = Math.random;
// --- Random enemy (offline fallback) ---
let enemy = getRandomEnemy();
// Apply P1 UI
const p1NameEl = document.getElementById("p1Name");
const p1AvatarEl = document.getElementById("p1Avatar");
const hp1Fill = document.getElementById("hp-fill-1");
p1NameEl.textContent = savedNick;
p1AvatarEl.style.borderColor = meta.color;
hp1Fill.style.background = meta.color;
if (savedAvatar) {
    p1AvatarEl.innerHTML = `<img src="${savedAvatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;">`;
}
else {
    p1AvatarEl.textContent = savedNick.substring(0, 2).toUpperCase();
    p1AvatarEl.style.color = meta.color;
    p1AvatarEl.style.fontSize = "10px";
}
// Apply P2 UI (enemy)
const p2NameEl = document.getElementById("p2Name");
const p2AvatarEl = document.getElementById("p2Avatar");
const hp2Fill = document.getElementById("hp-fill-2");
if (p2NameEl)
    p2NameEl.textContent = enemy.name;
if (p2AvatarEl)
    p2AvatarEl.style.borderColor = enemy.color;
if (hp2Fill)
    hp2Fill.style.background = enemy.color;
if (p2AvatarEl)
    p2AvatarEl.textContent = enemy.name.substring(0, 2);
const battleStatusEl = document.getElementById("battleStatus");
function setBattleStatus(text) {
    if (battleStatusEl)
        battleStatusEl.textContent = text;
}
// --- Fighters ---
function createFighterByCharType(x, y, hpFillId, isFacingRight, charType, color) {
    if (charType === "mage" || charType === "jade_mage") {
        return new JadeMageFighter(x, y, hpFillId, isFacingRight, particles, damageTexts);
    }
    if (charType === "cryo_knight") {
        return new CryoKnightFighter(x, y, hpFillId, isFacingRight, particles, damageTexts);
    }
    const fighter = new Fighter(x, y, color, hpFillId, isFacingRight, false, particles, damageTexts);
    fighter.charType = charType;
    return fighter;
}
const p1 = createFighterByCharType(200, 480, "hp-fill-1", true, savedCharId, meta.color);
// Apply player stats from equipment/level system
const stats = getTotalStats();
p1.playerAtk = stats.atk;
p1.playerDef = stats.def;
p1.playerSpd = stats.spd;
p1.equippedWeaponVisual = getEquippedWeaponVisual();
// Base p2 init (will be overridden if online)
let p2 = createFighterByCharType(700, 480, "hp-fill-2", false, enemy.charType, enemy.color);
p2.playerAtk = enemy.atk;
p2.playerDef = enemy.def;
p2.playerSpd = enemy.spd;
p1.setOpponent(p2);
p2.setOpponent(p1);
// Responsive canvas: scale to wrapper size and devicePixelRatio
const wrapper = document.getElementById('game-wrapper');
let dpr = window.devicePixelRatio || 1;
let arenaScale = 1;
let arenaOffsetX = 0;
let arenaOffsetY = 0;
function resizeCanvas() {
    if (!wrapper)
        return;
    const rect = wrapper.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    canvas.width = Math.max(300, Math.floor(rect.width * dpr));
    canvas.height = Math.max(200, Math.floor(rect.height * dpr));
    const cssW = canvas.width / dpr;
    const cssH = canvas.height / dpr;
    arenaScale = Math.min(cssW / ARENA_WIDTH, cssH / ARENA_HEIGHT);
    arenaOffsetX = (cssW - ARENA_WIDTH * arenaScale) * 0.5;
    arenaOffsetY = (cssH - ARENA_HEIGHT * arenaScale) * 0.5;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
// If opened inside Telegram WebApp, try to use user's Telegram username + avatar
async function initTelegramUser() {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            const user = tg.initDataUnsafe && tg.initDataUnsafe.user;
            if (user) {
                const username = user.username || `${user.first_name || ''}`.trim() || savedNick;
                p1NameEl.textContent = username;
                // fetch avatar from server endpoint (server will proxy Telegram file)
                try {
                    const resp = await fetch(`/api/user/${user.id}`);
                    const j = await resp.json();
                    if (j && j.avatar) {
                        p1AvatarEl.innerHTML = `<img src="${j.avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;">`;
                    }
                    else {
                        p1AvatarEl.textContent = username.substring(0, 2).toUpperCase();
                        p1AvatarEl.style.color = meta.color;
                    }
                }
                catch (e) {
                    p1AvatarEl.textContent = username.substring(0, 2).toUpperCase();
                    p1AvatarEl.style.color = meta.color;
                }
            }
        }
    }
    catch (e) {
        // ignore
    }
}
initTelegramUser();
// Record fight started for challenges
recordFightPlayed();
let gameOver = false;
let gameTime = 0;
// --- ONLINE GAME LOGIC ---
let isOnline = false;
let isWaiting = false;
let hasStarted = false;
let localRole = "host";
let activeRoomId = null;
let pendingRemoteState = null;
let lastStateSentAt = 0;
let outcomeHandled = false;
const socket = typeof window.io === "function" ? window.io() : null;
function syncHpBars() {
    hp1Fill.style.width = `${(p1.hp / p1.maxHp) * 100}%`;
    hp2Fill.style.width = `${(p2.hp / p2.maxHp) * 100}%`;
}
function serializeFighterState(f) {
    return {
        x: f.x,
        y: f.y,
        hp: f.hp,
        fighterState: f.fighterState,
        hitTimer: f.hitTimer,
        charType: f.charType,
        color: f.color,
    };
}
function applySyncedFighterState(target, stateData) {
    target.x = stateData.x;
    target.y = stateData.y;
    target.hp = stateData.hp;
    target.fighterState = stateData.fighterState;
    target.hitTimer = stateData.hitTimer;
    target.charType = stateData.charType;
    target.color = stateData.color;
}
function resolveHostOutcome() {
    if (p1.hp > 0 && p2.hp <= 0)
        return "host";
    if (p2.hp > 0 && p1.hp <= 0)
        return "guest";
    return "draw";
}
function handleBattleOutcome() {
    if (outcomeHandled)
        return;
    outcomeHandled = true;
    const hostWins = forcedOutcome === "host" || (forcedOutcome === null && p1.hp > 0 && p2.hp <= 0);
    const guestWins = forcedOutcome === "guest" || (forcedOutcome === null && p2.hp > 0 && p1.hp <= 0);
    if (hostWins) {
        p1.fighterState = "victory";
        p2.fighterState = "death";
        p2.hp = 0;
        if (localRole === "host") {
            addXP(50);
            recordFightWon();
        }
    }
    else if (guestWins) {
        p1.fighterState = "death";
        p2.fighterState = "victory";
        p1.hp = 0;
        if (localRole === "guest") {
            addXP(50);
            recordFightWon();
        }
    }
    else {
        p1.fighterState = "death";
        p2.fighterState = "death";
        p1.hp = 0;
        p2.hp = 0;
    }
    syncHpBars();
    setBattleStatus("БОЙ ЗАВЕРШЕН");
    gameOver = true;
    console.log("Battle outcome handled, showing back button...");
    // Disconnect from socket
    if (socket && isOnline) {
        setTimeout(() => {
            if (socket)
                socket.disconnect();
        }, 1000);
    }
    // Show back button with retries
    const showBtn = () => {
        console.log("Attempting to show back button...");
        // Telegram MainButton
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.MainButton.text = "ВЕРНУТЬСЯ В МЕНЮ";
            tg.MainButton.color = "#4CAF50";
            tg.MainButton.textColor = "#FFFFFF";
            tg.MainButton.show();
            tg.MainButton.onClick(() => {
                window.location.href = 'menu.html';
            });
            console.log("Telegram MainButton shown");
        }
        // HTML button
        const btn = document.getElementById("backBtn");
        console.log("Back button element:", btn);
        if (btn) {
            btn.style.display = "block";
            btn.style.opacity = "1";
            btn.style.visibility = "visible";
            btn.style.zIndex = "10000";
            btn.style.position = "fixed";
            btn.style.bottom = "60px";
            btn.style.left = "50%";
            btn.style.transform = "translateX(-50%)";
            btn.style.padding = "15px 40px";
            btn.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
            btn.style.color = "white";
            btn.style.border = "none";
            btn.style.borderRadius = "12px";
            btn.style.fontSize = "18px";
            btn.style.fontWeight = "bold";
            btn.style.cursor = "pointer";
            btn.style.boxShadow = "0 4px 15px rgba(0,0,0,0.5)";
            btn.style.pointerEvents = "auto";
            btn.textContent = "ВЕРНУТЬСЯ В МЕНЮ";
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Back button clicked!");
                window.location.href = 'menu.html';
            };
            console.log("Back button styled and visible");
        }
        else {
            console.error("Back button element not found!");
        }
    };
    showBtn();
    setTimeout(showBtn, 100);
    setTimeout(showBtn, 500);
    setTimeout(showBtn, 1000);
}
function startOfflineBattle() {
    isOnline = false;
    isWaiting = false;
    hasStarted = true;
    localRole = "host";
    activeRoomId = null;
    pendingRemoteState = null;
    setBattleStatus("АВТОМАТИЧЕСКИЙ БОЙ");
}
function startOnlineGame(opponentData, seed) {
    isWaiting = false;
    hasStarted = true;
    currentSeed = seed || 12345;
    gameOver = false;
    outcomeHandled = false;
    lastStateSentAt = 0;
    state.screenShake = 0;
    particles.length = 0;
    damageTexts.length = 0;
    if (p2NameEl)
        p2NameEl.textContent = opponentData.name || "ВРАГ";
    const oppCharType = opponentData.charType || "mage";
    const oppMeta = CHAR_META[oppCharType] || CHAR_META["mage"];
    const oppColor = oppMeta.color;
    if (p2AvatarEl) {
        p2AvatarEl.style.borderColor = oppColor;
        if (opponentData.avatar) {
            p2AvatarEl.innerHTML = `<img src="${opponentData.avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;">`;
        }
        else {
            p2AvatarEl.textContent = (opponentData.name || "ВРАГ").substring(0, 2).toUpperCase();
            p2AvatarEl.style.color = oppColor;
        }
    }
    if (hp2Fill)
        hp2Fill.style.background = oppColor;
    p2 = createFighterByCharType(700, 480, "hp-fill-2", false, oppCharType, oppColor);
    p2.playerAtk = opponentData.atk || 1;
    p2.playerDef = opponentData.def || 1;
    p2.playerSpd = opponentData.spd || 1;
    p2.equippedWeaponVisual = opponentData.weaponVisual || null;
    p1.setOpponent(p2);
    p2.setOpponent(p1);
    enemy = {
        ...enemy,
        name: opponentData.name || "ВРАГ",
        charType: oppCharType,
        color: oppColor,
    };
    syncHpBars();
}
function playOnline() {
    if (!socket) {
        startOfflineBattle();
        return;
    }
    if (isWaiting || hasStarted)
        return;
    isWaiting = true;
    setBattleStatus("ПОИСК СОПЕРНИКА...");
    if (p2NameEl)
        p2NameEl.textContent = "ПОИСК ПРОТИВНИКА...";
    if (p2AvatarEl) {
        p2AvatarEl.innerHTML = "";
        p2AvatarEl.textContent = "??";
        p2AvatarEl.style.color = "#888";
        p2AvatarEl.style.borderColor = "#888";
    }
    // Profile data to send to opponent
    const profile = {
        name: p1NameEl.textContent,
        avatar: savedAvatar,
        charType: savedCharId,
        atk: p1.playerAtk,
        def: p1.playerDef,
        spd: p1.playerSpd,
        weaponVisual: p1.equippedWeaponVisual
    };
    socket.emit("play", profile);
}
function setupOnlineSocket() {
    if (!socket) {
        startOfflineBattle();
        return;
    }
    socket.on("connect", () => {
        if (!hasStarted && !isWaiting) {
            playOnline();
        }
    });
    socket.on("waiting", () => {
        isWaiting = true;
        hasStarted = false;
        setBattleStatus("ПОИСК СОПЕРНИКА...");
        if (p2NameEl)
            p2NameEl.textContent = "ОЖИДАНИЕ...";
    });
    socket.on("startGame", (payloadRaw) => {
        const payload = (payloadRaw || {});
        isOnline = true;
        localRole = payload.isHost ? "host" : "guest";
        activeRoomId = payload.roomId || null;
        pendingRemoteState = null;
        startOnlineGame(payload.profile || {}, payload.seed || 12345);
        setBattleStatus("ОНЛАЙН БОЙ");
    });
    socket.on("battle_state", (payloadRaw) => {
        if (localRole === "host")
            return;
        const payload = payloadRaw;
        const synced = payload.state || payload;
        if (!synced)
            return;
        pendingRemoteState = synced;
    });
    socket.on("battle_over", () => {
        if (localRole === "host")
            return;
        if (gameOver)
            return;
        gameOver = true;
        handleBattleOutcome();
    });
    socket.on("opponent_left", () => {
        isWaiting = false;
        hasStarted = false;
        gameOver = true;
        setBattleStatus("СОПЕРНИК ВЫШЕЛ");
        if (p2NameEl)
            p2NameEl.textContent = "СОПЕРНИК ВЫШЕЛ";
        const btn = document.getElementById("backBtn");
        if (btn)
            btn.style.display = "block";
    });
    socket.on("disconnect", () => {
        if (!gameOver) {
            hasStarted = false;
            isWaiting = false;
            setBattleStatus("СОЕДИНЕНИЕ ПОТЕРЯНО");
        }
    });
    if (socket.connected)
        playOnline();
    else
        setBattleStatus("ПОДКЛЮЧЕНИЕ...");
}
setupOnlineSocket();
window.addEventListener("beforeunload", () => {
    if (!socket)
        return;
    if (isWaiting)
        socket.emit("cancel_search");
    socket.disconnect();
});
function update() {
    if (isWaiting || !hasStarted)
        return; // wait for match to start
    gameTime++;
    // SYNCED DETERMINISTIC SIMULATION
    // Replace Math.random with seeded pseudoRandom for identical results on both clients
    const originalMathRandom = Math.random;
    Math.random = pseudoRandom;
    if (!gameOver) {
        p1.updateAI(gameOver);
        p2.updateAI(gameOver);
        // HOST: Send state to server every 3 frames for synchronization
        if (isOnline && localRole === "host" && socket && activeRoomId && gameTime % 3 === 0) {
            const state = {
                tick: gameTime,
                gameOver: false,
                host: serializeFighterState(p1),
                guest: serializeFighterState(p2),
            };
            socket.emit("battle_state", { roomId: activeRoomId, state });
            lastStateSentAt = gameTime;
        }
        // GUEST: Apply received state from host to stay in sync
        if (isOnline && localRole === "guest" && pendingRemoteState) {
            const remoteState = pendingRemoteState;
            pendingRemoteState = null;
            // Apply host's authoritative state
            applySyncedFighterState(p1, remoteState.host);
            applySyncedFighterState(p2, remoteState.guest);
            syncHpBars();
            // Check if host says game is over
            if (remoteState.gameOver && !gameOver) {
                gameOver = true;
                handleBattleOutcome();
            }
        }
        if (p1.hp <= 0 || p2.hp <= 0) {
            if (gameOver)
                return; // Prevent double call
            gameOver = true;
            // Force sync outcome data
            if (p1.hp <= 0 && p2.hp <= 0)
                forcedOutcome = "draw";
            else if (p1.hp <= 0)
                forcedOutcome = localRole === "host" ? "guest" : "host";
            else if (p2.hp <= 0)
                forcedOutcome = localRole === "host" ? "host" : "guest";
            console.log("Battle finished locally. Outcome:", forcedOutcome);
            // If online, HOST reports the final outcome to the server
            if (isOnline && localRole === "host" && socket && activeRoomId) {
                const finalOutcome = resolveHostOutcome();
                socket.emit("battle_over", {
                    roomId: activeRoomId,
                    outcome: finalOutcome
                });
                // Send final state with gameOver flag
                const finalState = {
                    tick: gameTime,
                    gameOver: true,
                    host: serializeFighterState(p1),
                    guest: serializeFighterState(p2),
                };
                socket.emit("battle_state", { roomId: activeRoomId, state: finalState });
            }
            handleBattleOutcome();
        }
    }
    // Restore original Math.random
    Math.random = originalMathRandom;
    // Local-only visual updates (particles, etc.)
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0)
            particles.splice(i, 1);
    }
    for (let i = damageTexts.length - 1; i >= 0; i--) {
        damageTexts[i].update();
        if (damageTexts[i].life <= 0)
            damageTexts.splice(i, 1);
    }
}
function draw() {
function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Check for game over FIRST before any transformations
    if (gameOver) {
        console.log("Drawing game over screen. Winner:", forcedOutcome, "p1.hp:", p1.hp, "p2.hp:", p2.hp);
        // Draw dark overlay
        ctx.fillStyle = "rgba(0,0,0,0.9)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const hostWins = forcedOutcome === "host" || (forcedOutcome === null && p1.hp > 0 && p2.hp <= 0);
        const guestWins = forcedOutcome === "guest" || (forcedOutcome === null && p2.hp > 0 && p1.hp <= 0);
        
        let winnerName = "НИЧЬЯ";
        let winnerColor = "#fff";
        
        if (hostWins) {
            winnerName = (localRole === "host" ? savedNick : (enemy.name || "ВРАГ"));
            winnerColor = meta.color;
        }
        else if (guestWins) {
            winnerName = (localRole === "guest" ? savedNick : (enemy.name || "ВРАГ"));
            winnerColor = enemy.color;
        }
        
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Draw Winner Name
        ctx.shadowBlur = 30;
        ctx.shadowColor = winnerColor;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 48px Arial, sans-serif";
        ctx.fillText(winnerName.toUpperCase(), canvas.width / 2, canvas.height / 2 - 80);
        
        // Draw "ПОБЕДИТЕЛЬ" text
        ctx.shadowBlur = 0;
        ctx.font = "bold 28px Arial, sans-serif";
        ctx.fillStyle = winnerColor;
        ctx.fillText("ПОБЕДИТЕЛЬ", canvas.width / 2, canvas.height / 2 - 20);
        
        // Draw hint
        ctx.font = "20px Arial, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("Нажмите кнопку ниже для возврата в меню", canvas.width / 2, canvas.height / 2 + 60);
        
        requestAnimationFrame(loop);
        return;
    }
    
    ctx.save();
    ctx.scale(dpr, dpr);
    // Keep the original combat world (900x600) and fit it fully into the available phone viewport.
    ctx.translate(arenaOffsetX, arenaOffsetY);
    ctx.scale(arenaScale, arenaScale);
    // Screen shake
    if (state.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * state.screenShake, (Math.random() - 0.5) * state.screenShake);
        state.screenShake *= 0.8;
        if (state.screenShake < 0.5)
            state.screenShake = 0;
    }
    // Arena floor
    ctx.fillStyle = "#111108";
    ctx.fillRect(0, ARENA_FLOOR_Y, ARENA_WIDTH, ARENA_HEIGHT - ARENA_FLOOR_Y);
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#8b6020";
    ctx.strokeStyle = "#6b4010";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, ARENA_FLOOR_Y);
    ctx.lineTo(ARENA_WIDTH, ARENA_FLOOR_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    p1.draw(ctx, gameTime);
    p2.draw(ctx, gameTime);
    particles.forEach(p => p.draw(ctx));
    damageTexts.forEach(d => d.draw(ctx));
    // Global top-layer pass for Jade Mage sphere so it is never occluded by fighters/effects.
    if (p1 instanceof JadeMageFighter)
        p1.drawGlobalOverlay(ctx, gameTime);
    if (p2 instanceof JadeMageFighter)
        p2.drawGlobalOverlay(ctx, gameTime);
    ctx.restore();
    requestAnimationFrame(loop);
}
}
function loop() { update(); draw(); }
loop();
