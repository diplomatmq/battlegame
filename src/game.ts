// game.ts — entry point for game.html

import { Fighter, state } from "./fighter.js";
import { JadeMageFighter } from "./jade-mage.js";
import { CryoKnightFighter } from "./cryo-knight-fighter.js";
import { Particle, DamageText } from "./particles.js";
import { CHAR_META, CharId, getNick, getCharId, getAvatar, getTotalStats, getEquippedWeaponVisual, addXP, getRandomEnemy, recordFightPlayed, recordFightWon, syncProfileToServer } from "./player.js";

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx    = canvas.getContext("2d")!;

const ARENA_WIDTH = 900;
const ARENA_HEIGHT = 600;
const ARENA_FLOOR_Y = 480;

type MatchRole = "host" | "guest";
type MatchOutcome = MatchRole | "draw";

interface OnlineProfile {
  name: string;
  avatar: string | null;
  charType: string;
  atk: number;
  def: number;
  spd: number;
  weaponVisual: string | null;
}

interface StartGamePayload {
  roomId: string;
  seed: number;
  isHost: boolean;
  profile: OnlineProfile;
}

interface SyncedFighterState {
  x: number;
  y: number;
  hp: number;
  fighterState: Fighter["fighterState"];
  hitTimer: number;
  charType: string;
  color: string;
}

interface SyncedBattleState {
  tick: number;
  gameOver: boolean;
  host: SyncedFighterState;
  guest: SyncedFighterState;
}

interface SocketLike {
  id?: string;
  connected: boolean;
  emit(event: string, payload?: unknown): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  disconnect(): void;
}

declare global {
  interface Window {
    Telegram?: any;
    io?: (...args: unknown[]) => SocketLike;
  }
}

const particles:   Particle[]   = [];
const damageTexts: DamageText[] = [];

// --- Player data ---
const savedCharId = (getCharId() ?? "mage") as CharId;
const savedNick   = getNick()   ?? "\u0417\u0410\u0429\u0418\u0422\u041d\u0418\u041a";
const savedAvatar = getAvatar();
const meta        = CHAR_META[savedCharId];

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
const p1NameEl   = document.getElementById("p1Name")   as HTMLElement;
const p1AvatarEl = document.getElementById("p1Avatar") as HTMLElement;
const hp1Fill    = document.getElementById("hp-fill-1") as HTMLElement;

p1NameEl.textContent          = savedNick;
p1AvatarEl.style.borderColor = meta.color;
hp1Fill.style.background = meta.color;

if (savedAvatar) {
  p1AvatarEl.innerHTML = `<img src="${savedAvatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;">`;
} else {
  p1AvatarEl.textContent = savedNick.substring(0, 2).toUpperCase();
  p1AvatarEl.style.color    = meta.color;
  p1AvatarEl.style.fontSize = "10px";
}

// Apply P2 UI (enemy)
const p2NameEl   = document.getElementById("p2Name")   as HTMLElement | null;
const p2AvatarEl = document.getElementById("p2Avatar") as HTMLElement | null;
const hp2Fill    = document.getElementById("hp-fill-2") as HTMLElement;
if (p2NameEl)   p2NameEl.textContent          = enemy.name;
if (p2AvatarEl) p2AvatarEl.style.borderColor  = enemy.color;
if (hp2Fill)    hp2Fill.style.background       = enemy.color;
if (p2AvatarEl) p2AvatarEl.textContent = enemy.name.substring(0, 2);

const battleStatusEl = document.getElementById("battleStatus") as HTMLElement | null;
function setBattleStatus(text: string): void {
  if (battleStatusEl) battleStatusEl.textContent = text;
}

// --- Fighters ---
function createFighterByCharType(
  x: number,
  y: number,
  hpFillId: string,
  isFacingRight: boolean,
  charType: string,
  color: string,
): Fighter {
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

const p1: Fighter = createFighterByCharType(200, 480, "hp-fill-1", true, savedCharId, meta.color);

// Apply player stats from equipment/level system
const stats = getTotalStats();
p1.playerAtk = stats.atk;
p1.playerDef = stats.def;
p1.playerSpd = stats.spd;
p1.equippedWeaponVisual = getEquippedWeaponVisual();

// Base p2 init (will be overridden if online)
let p2: Fighter = createFighterByCharType(700, 480, "hp-fill-2", false, enemy.charType, enemy.color);
p2.playerAtk = enemy.atk;
p2.playerDef = enemy.def;
p2.playerSpd = enemy.spd;
p1.setOpponent(p2);
p2.setOpponent(p1);

// Responsive canvas: scale to wrapper size and devicePixelRatio
const wrapper = document.getElementById('game-wrapper') as HTMLElement;
let dpr = window.devicePixelRatio || 1;
let arenaScale = 1;
let arenaOffsetX = 0;
let arenaOffsetY = 0;

function resizeCanvas() {
  if (!wrapper) return;
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
          } else {
            p1AvatarEl.textContent = username.substring(0, 2).toUpperCase();
            p1AvatarEl.style.color = meta.color;
          }
        } catch (e) {
          p1AvatarEl.textContent = username.substring(0, 2).toUpperCase();
          p1AvatarEl.style.color = meta.color;
        }
      }
    }
  } catch (e) {
    // ignore
  }
}
initTelegramUser();

// Record fight started for challenges
recordFightPlayed();

let gameOver = false;
let gameTime  = 0;

// --- ONLINE GAME LOGIC ---
let isOnline = false;
let isWaiting = false;
let hasStarted = false;
let localRole: MatchRole = "host";
let activeRoomId: string | null = null;
let pendingRemoteState: SyncedBattleState | null = null;
let lastStateSentAt = 0;
let outcomeHandled = false;

const socket: SocketLike | null = typeof window.io === "function" ? window.io() : null;

function syncHpBars(): void {
  hp1Fill.style.width = `${(p1.hp / p1.maxHp) * 100}%`;
  hp2Fill.style.width = `${(p2.hp / p2.maxHp) * 100}%`;
}

function serializeFighterState(f: Fighter): SyncedFighterState {
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

function applySyncedFighterState(target: Fighter, stateData: SyncedFighterState): void {
  target.x = stateData.x;
  target.y = stateData.y;
  target.hp = stateData.hp;
  target.fighterState = stateData.fighterState;
  target.hitTimer = stateData.hitTimer;
  target.charType = stateData.charType;
  target.color = stateData.color;
}

function resolveHostOutcome(): MatchOutcome {
  if (p1.hp > 0 && p2.hp <= 0) return "host";
  if (p2.hp > 0 && p1.hp <= 0) return "guest";
  return "draw";
}

function handleBattleOutcome(): void {
  if (outcomeHandled) return;
  outcomeHandled = true;

  if (p1.hp > 0 && p2.hp <= 0) {
    p1.fighterState = "victory";
    p2.fighterState = "death";
    addXP(50);
    recordFightWon();
  } else if (p2.hp > 0 && p1.hp <= 0) {
    p1.fighterState = "death";
    p2.fighterState = "victory";
  } else {
    p1.fighterState = "death";
    p2.fighterState = "death";
  }

  setBattleStatus("МАТЧ ЗАВЕРШЕН");
}

function startOfflineBattle(): void {
  isOnline = false;
  isWaiting = false;
  hasStarted = true;
  localRole = "host";
  activeRoomId = null;
  pendingRemoteState = null;
  setBattleStatus("АВТОМАТИЧЕСКИЙ БОЙ");
}

function startOnlineGame(opponentData: OnlineProfile, seed: number) {
  isWaiting = false;
  hasStarted = true;
  currentSeed = seed || 12345;
  gameOver = false;
  outcomeHandled = false;
  lastStateSentAt = 0;
  state.screenShake = 0;
  particles.length = 0;
  damageTexts.length = 0;
  
  if (p2NameEl) p2NameEl.textContent = opponentData.name || "ВРАГ";
  
  const oppCharType = opponentData.charType || "mage";
  const oppMeta = CHAR_META[oppCharType as keyof typeof CHAR_META] || CHAR_META["mage"];
  const oppColor = oppMeta.color;

  if (p2AvatarEl) {
    p2AvatarEl.style.borderColor = oppColor;
    if (opponentData.avatar) {
      p2AvatarEl.innerHTML = `<img src="${opponentData.avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      p2AvatarEl.textContent = (opponentData.name || "ВРАГ").substring(0, 2).toUpperCase();
      p2AvatarEl.style.color = oppColor;
    }
  }
  if (hp2Fill) hp2Fill.style.background = oppColor;

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

  if (isWaiting || hasStarted) return;
  isWaiting = true;
  setBattleStatus("ПОИСК СОПЕРНИКА...");
  if (p2NameEl) p2NameEl.textContent = "ПОИСК ПРОТИВНИКА...";
  if (p2AvatarEl) {
    p2AvatarEl.innerHTML = "";
    p2AvatarEl.textContent = "??";
    p2AvatarEl.style.color = "#888";
    p2AvatarEl.style.borderColor = "#888";
  }

  // Profile data to send to opponent
  const profile: OnlineProfile = {
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

function setupOnlineSocket(): void {
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
    if (p2NameEl) p2NameEl.textContent = "ОЖИДАНИЕ...";
  });

  socket.on("startGame", (payloadRaw: unknown) => {
    const payload = (payloadRaw || {}) as StartGamePayload;
    isOnline = true;
    localRole = payload.isHost ? "host" : "guest";
    activeRoomId = payload.roomId || null;
    pendingRemoteState = null;
    startOnlineGame(payload.profile || ({} as OnlineProfile), payload.seed || 12345);
    setBattleStatus("ОНЛАЙН БОЙ");
  });

  socket.on("battle_state", (payloadRaw: unknown) => {
    if (localRole === "host") return;

    const payload = payloadRaw as { state?: SyncedBattleState } | SyncedBattleState;
    const synced = (payload as { state?: SyncedBattleState }).state || (payload as SyncedBattleState);
    if (!synced) return;
    pendingRemoteState = synced;
  });

  socket.on("battle_over", () => {
    if (localRole === "host") return;
    if (gameOver) return;
    gameOver = true;
    handleBattleOutcome();
  });

  socket.on("opponent_left", () => {
    isWaiting = false;
    hasStarted = false;
    gameOver = true;
    setBattleStatus("СОПЕРНИК ВЫШЕЛ");
    if (p2NameEl) p2NameEl.textContent = "СОПЕРНИК ВЫШЕЛ";
    const btn = document.getElementById("backBtn") as HTMLElement | null;
    if (btn) btn.style.display = "block";
  });

  socket.on("disconnect", () => {
    if (!gameOver) {
      hasStarted = false;
      isWaiting = false;
      setBattleStatus("СОЕДИНЕНИЕ ПОТЕРЯНО");
    }
  });

  if (socket.connected) playOnline();
  else setBattleStatus("ПОДКЛЮЧЕНИЕ...");
}

setupOnlineSocket();

window.addEventListener("beforeunload", () => {
  if (!socket) return;
  if (isWaiting) socket.emit("cancel_search");
  socket.disconnect();
});

function update(): void {
  if (isWaiting || !hasStarted) return; // wait for match to start
  gameTime++;
  
  Math.random = pseudoRandom; // sync rng
  
  if (!gameOver) {
    // Both Host and Guest simulate locally for smoothness
    p1.updateAI(gameOver);
    p2.updateAI(gameOver);

    if (isOnline && localRole === "guest" && pendingRemoteState) {
      // Guest occasionally corrects position/hp from host state if drift occurs
      // We use a small interpolation to avoid snapping
      const driftX1 = Math.abs(p1.x - pendingRemoteState.guest.x);
      const driftX2 = Math.abs(p2.x - pendingRemoteState.host.x);
      
      if (driftX1 > 5) p1.x += (pendingRemoteState.guest.x - p1.x) * 0.2;
      if (driftX2 > 5) p2.x += (pendingRemoteState.host.x - p2.x) * 0.2;
      
      // HP is more critical, but still interpolate for bars
      if (Math.abs(p1.hp - pendingRemoteState.guest.hp) > 2) p1.hp = pendingRemoteState.guest.hp;
      if (Math.abs(p2.hp - pendingRemoteState.host.hp) > 2) p2.hp = pendingRemoteState.host.hp;
      
      syncHpBars();
      
      if (pendingRemoteState.gameOver) {
        gameOver = true;
        handleBattleOutcome();
      }
    }

    if (p1.hp <= 0 || p2.hp <= 0) {
      gameOver = true;
      handleBattleOutcome();

      if (isOnline && localRole === "host" && socket && activeRoomId) {
        socket.emit("battle_over", {
          roomId: activeRoomId,
          outcome: resolveHostOutcome(),
        });
      }
    }

    if (isOnline && localRole === "host" && socket && activeRoomId && socket.connected) {
      const now = Date.now();
      if (now - lastStateSentAt >= 100) { // slightly lower frequency is fine with local sim
        socket.emit("battle_state", {
          roomId: activeRoomId,
          state: {
            tick: gameTime,
            gameOver,
            host: serializeFighterState(p1),
            guest: serializeFighterState(p2),
          },
        });
        lastStateSentAt = now;
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
  for (let i = damageTexts.length - 1; i >= 0; i--) {
    damageTexts[i].update();
    if (damageTexts[i].life <= 0) damageTexts.splice(i, 1);
  }
  
  Math.random = originalMathRandom; // restore rng
}

function draw(): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(dpr, dpr);

  // Keep the original combat world (900x600) and fit it fully into the available phone viewport.
  ctx.translate(arenaOffsetX, arenaOffsetY);
  ctx.scale(arenaScale, arenaScale);

  // Screen shake
  if (state.screenShake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * state.screenShake,
      (Math.random() - 0.5) * state.screenShake,
    );
    state.screenShake *= 0.8;
    if (state.screenShake < 0.5) state.screenShake = 0;
  }

  // Arena floor
  ctx.fillStyle = "#111108";
  ctx.fillRect(0, ARENA_FLOOR_Y, ARENA_WIDTH, ARENA_HEIGHT - ARENA_FLOOR_Y);
  ctx.shadowBlur = 10; ctx.shadowColor = "#8b6020";
  ctx.strokeStyle = "#6b4010"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, ARENA_FLOOR_Y); ctx.lineTo(ARENA_WIDTH, ARENA_FLOOR_Y); ctx.stroke();
  ctx.shadowBlur = 0;

  p1.draw(ctx, gameTime);
  p2.draw(ctx, gameTime);
  particles.forEach(p  => p.draw(ctx));
  damageTexts.forEach(d => d.draw(ctx));

  // Global top-layer pass for Jade Mage sphere so it is never occluded by fighters/effects.
  if (p1 instanceof JadeMageFighter) p1.drawGlobalOverlay(ctx, gameTime);
  if (p2 instanceof JadeMageFighter) p2.drawGlobalOverlay(ctx, gameTime);

  if (gameOver) {
    drawGameOver();
    ctx.restore();
    return;
  }

  ctx.restore();
  requestAnimationFrame(loop);
}

function drawGameOver(): void {
  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

  const p1Win = p1.hp > 0 && p2.hp <= 0;
  const p2Win = p2.hp > 0 && p1.hp <= 0;
  const winnerText = p1Win
    ? savedNick.toUpperCase() + " \u041f\u041e\u0411\u0415\u0414\u0418\u041b"
    : p2Win
      ? enemy.name + " \u041f\u041e\u0411\u0415\u0414\u0418\u041b"
      : "\u041e\u0411\u041e\u042e\u0414\u041d\u041e\u0415";
  const winnerColor = p1Win ? p1.color : p2.color;

  ctx.textAlign  = "center";
  ctx.font       = "bold 26px \"Press Start 2P\"";
  ctx.shadowBlur = 30; ctx.shadowColor = winnerColor; ctx.fillStyle = "#fff";
  ctx.fillText(winnerText, ARENA_WIDTH / 2, ARENA_HEIGHT / 2);

  ctx.shadowBlur = 0;
  ctx.font       = "10px \"Press Start 2P\"";
  ctx.fillStyle  = "#6b4810";
  ctx.fillText("\u041d\u0410\u0416\u041c\u0418 \u041a\u041d\u041e\u041f\u041a\u0423 \u041d\u0418\u0416\u0415", ARENA_WIDTH / 2, ARENA_HEIGHT / 2 + 56);

  const btn = document.getElementById("backBtn") as HTMLElement | null;
  if (btn) btn.style.display = "block";
}

function loop(): void { update(); draw(); }
loop();
