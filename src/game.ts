// game.ts — entry point for game.html

import { Fighter, state } from "./fighter.js";
import { Particle, DamageText } from "./particles.js";
import { CHAR_META, getNick, getCharId, getAvatar, getTotalStats, getEquippedWeaponVisual, addXP, getRandomEnemy, recordFightPlayed, recordFightWon } from "./player.js";
import socket from "./socket";

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx    = canvas.getContext("2d")!;

const particles:   Particle[]   = [];
const damageTexts: DamageText[] = [];

// --- Player data ---
const savedCharId = getCharId() ?? "knight";
const savedNick   = getNick()   ?? "\u0413\u0415\u0420\u041e\u0419";
const savedAvatar = getAvatar();
const meta        = CHAR_META[savedCharId];

// --- Random enemy ---
const enemy = getRandomEnemy();

// Apply P1 UI
const p1NameEl   = document.getElementById("p1Name")   as HTMLElement;
const p1AvatarEl = document.getElementById("p1Avatar") as HTMLElement;
const hp1Fill    = document.getElementById("hp-fill-1") as HTMLElement;

p1NameEl.textContent          = savedNick;
p1AvatarEl.style.borderColor  = meta.color;
hp1Fill.style.background      = meta.color;

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

// --- Fighters ---
const p1 = new Fighter(200, 480, meta.color,   "hp-fill-1", true,  meta.isKnight, particles, damageTexts);
const p2 = new Fighter(700, 480, enemy.color,  "hp-fill-2", false, false,          particles, damageTexts);
p1.charType = savedCharId;
p2.charType = enemy.charType;

// Apply player stats from equipment/level system
const stats = getTotalStats();
p1.playerAtk = stats.atk;
p1.playerDef = stats.def;
p1.playerSpd = stats.spd;
p1.equippedWeaponVisual = getEquippedWeaponVisual();

// Responsive canvas: scale to wrapper size and devicePixelRatio
const wrapper = document.getElementById('game-wrapper') as HTMLElement;
function resizeCanvas() {
  if (!wrapper) return;
  const rect = wrapper.getBoundingClientRect();
  const DPR = window.devicePixelRatio || 1;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  canvas.width = Math.max(300, Math.floor(rect.width * DPR));
  canvas.height = Math.max(200, Math.floor(rect.height * DPR));
  // scale drawing to DPR so 1 unit == CSS pixel
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// If opened inside Telegram WebApp, try to use user's Telegram username + avatar
declare global { interface Window { Telegram?: any } }
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

// Enemy gets its own stats from the roster
p2.playerAtk = enemy.atk;
p2.playerDef = enemy.def;
p2.playerSpd = enemy.spd;

p1.setOpponent(p2);
p2.setOpponent(p1);

// Record fight started for challenges
recordFightPlayed();

let gameOver = false;
let gameTime  = 0;

// --- ONLINE GAME LOGIC ---
let isOnline = false;
let opponent = null;

function startOnlineGame(opponentData: any) {
  // Здесь можно обновить enemy и UI
  if (p2NameEl) p2NameEl.textContent = opponentData.name || "ВРАГ";
  if (p2AvatarEl) p2AvatarEl.textContent = (opponentData.name || "ВРАГ").substring(0, 2);
  // Можно добавить дополнительные данные
}

function playOnline() {
  socket.emit("play");
}

socket.on("startGame", (data: { opponent: string; name?: string }) => {
  isOnline = true;
  opponent = data.opponent;
  startOnlineGame(data);
});

socket.on("waiting", () => {
  // UI: показать "Ожидание второго игрока..."
  if (p2NameEl) p2NameEl.textContent = "Ожидание второго игрока...";
});

// Кнопка для онлайн режима
const controls = document.querySelector(".controls") as HTMLElement;
if (controls) {
  const onlineBtn = document.createElement("button");
  onlineBtn.textContent = "Играть онлайн";
  onlineBtn.style.marginLeft = "12px";
  onlineBtn.onclick = playOnline;
  controls.appendChild(onlineBtn);
}

function update(): void {
  gameTime++;
  if (!gameOver) {
    p1.updateAI(gameOver);
    p2.updateAI(gameOver);
    if (p1.hp <= 0 || p2.hp <= 0) {
      gameOver = true;
      if (p1.hp > 0 && p2.hp <= 0) {
        // Player won — award XP + record win for challenges
        addXP(50);
        recordFightWon();
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
}

function draw(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Screen shake
  ctx.save();
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
  ctx.fillRect(0, 480, canvas.width, 120);
  ctx.shadowBlur = 10; ctx.shadowColor = "#8b6020";
  ctx.strokeStyle = "#6b4010"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, 480); ctx.lineTo(canvas.width, 480); ctx.stroke();
  ctx.shadowBlur = 0;

  p1.draw(ctx, gameTime);
  p2.draw(ctx, gameTime);
  particles.forEach(p  => p.draw(ctx));
  damageTexts.forEach(d => d.draw(ctx));

  ctx.restore();

  if (gameOver) {
    drawGameOver();
    return;
  }
  requestAnimationFrame(loop);
}

function drawGameOver(): void {
  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
  ctx.fillText(winnerText, canvas.width / 2, canvas.height / 2);

  ctx.shadowBlur = 0;
  ctx.font       = "10px \"Press Start 2P\"";
  ctx.fillStyle  = "#6b4810";
  ctx.fillText("\u041d\u0410\u0416\u041c\u0418 \u041a\u041d\u041e\u041f\u041a\u0423 \u041d\u0418\u0416\u0415", canvas.width / 2, canvas.height / 2 + 56);

  const btn = document.getElementById("backBtn") as HTMLElement | null;
  if (btn) btn.style.display = "block";
}

function loop(): void { update(); draw(); }
loop();
