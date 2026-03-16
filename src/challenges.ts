// challenges.ts — entry point for challenges.html

import { getCoins, setCoins } from "./player.js";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Challenge {
  id:       string;
  icon:     string;
  name:     string;
  desc:     string;
  reward:   number;
  target:   number;
  weekly:   boolean;
}

// ── Challenge definitions ─────────────────────────────────────────────────────
const challenges: Challenge[] = [
  // Daily
  {
    id: "daily_fight1", icon: "\u2694\uFE0F",
    name: "\u041F\u0415\u0420\u0412\u042B\u0419 \u0411\u041E\u0419",
    desc: "\u0421\u044B\u0433\u0440\u0430\u0439 1 \u0431\u0438\u0442\u0432\u0443",
    reward: 30, target: 1, weekly: false,
  },
  {
    id: "daily_fight3", icon: "\uD83D\uDDE1\uFE0F",
    name: "3 \u0411\u041E\u042F",
    desc: "\u0421\u044B\u0433\u0440\u0430\u0439 3 \u0431\u0438\u0442\u0432\u044B",
    reward: 60, target: 3, weekly: false,
  },
  {
    id: "daily_win1", icon: "\uD83C\uDF1F",
    name: "\u041F\u041E\u0411\u0415\u0414\u0418\u0422\u0415\u041B\u042C",
    desc: "\u041F\u043E\u0431\u0435\u0434\u0438 \u0432 1 \u0431\u0438\u0442\u0432\u0435",
    reward: 50, target: 1, weekly: false,
  },
  {
    id: "daily_shop", icon: "\uD83D\uDED2",
    name: "\u041F\u041E\u043A\u0423\u041F\u041A\u0410",
    desc: "\u041A\u0443\u043F\u0438 \u043F\u0440\u0435\u0434\u043C\u0435\u0442 \u0432 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0435",
    reward: 40, target: 1, weekly: false,
  },
  // Weekly
  {
    id: "weekly_fight10", icon: "\u2694\uFE0F\uFE0F",
    name: "10 \u0411\u041E\u0401\u0412",
    desc: "\u0421\u044B\u0433\u0440\u0430\u0439 10 \u0431\u0438\u0442\u0432 \u0437\u0430 \u043D\u0435\u0434\u0435\u043B\u044E",
    reward: 200, target: 10, weekly: true,
  },
  {
    id: "weekly_win5", icon: "\uD83C\uDFC6",
    name: "5 \u041F\u041E\u0411\u0415\u0414",
    desc: "\u041E\u0434\u0435\u0440\u0436\u0438 5 \u043F\u043E\u0431\u0435\u0434 \u0437\u0430 \u043D\u0435\u0434\u0435\u043B\u044E",
    reward: 300, target: 5, weekly: true,
  },
  {
    id: "weekly_spend200", icon: "\uD83D\uDCB0",
    name: "\u0422\u0420\u0410\u0422\u042C \u041C\u041E\u041D\u0415\u0422\u042B",
    desc: "\u041F\u043E\u0442\u0440\u0430\u0442\u044C 200 \u043C\u043E\u043D\u0435\u0442 \u0432 \u043C\u0430\u0433\u0430\u0437\u0438\u043D\u0435",
    reward: 150, target: 200, weekly: true,
  },
];

// ── Progress storage ──────────────────────────────────────────────────────────
function getProgress(id: string): number {
  return parseInt(localStorage.getItem(`ch_prog_${id}`) ?? "0", 10);
}
function getClaimed(id: string): boolean {
  return localStorage.getItem(`ch_claimed_${id}`) === "1";
}
function setClaimed(id: string): void {
  localStorage.setItem(`ch_claimed_${id}`, "1");
}

// ── UI ────────────────────────────────────────────────────────────────────────
const coinEl = document.getElementById("coinCount") as HTMLElement;
coinEl.textContent = String(getCoins());

const toastEl = document.getElementById("toast")!;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
function showToast(msg: string): void {
  toastEl.textContent = msg;
  toastEl.style.opacity = "1";
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.style.opacity = "0"; }, 2200);
}

function claimChallenge(ch: Challenge): void {
  if (getClaimed(ch.id)) return;
  setClaimed(ch.id);
  const newCoins = getCoins() + ch.reward;
  setCoins(newCoins);
  coinEl.textContent = String(newCoins);
  renderAll();
  showToast(`+${ch.reward} \uD83E\uDE99 \u043D\u0430\u0447\u0438\u0441\u043B\u0435\u043D\u043E!`);
}

function renderChallenge(ch: Challenge): HTMLElement {
  const prog    = getProgress(ch.id);
  const claimed = getClaimed(ch.id);
  const done    = prog >= ch.target;
  const pct     = Math.min(100, Math.round((prog / ch.target) * 100));

  const card = document.createElement("div");
  card.className = `challenge-card${claimed ? " done" : ""}`;

  card.innerHTML =
    `<div class="ch-top">
       <div class="ch-icon">${ch.icon}</div>
       <div class="ch-info">
         <div class="ch-name">${ch.name}</div>
         <div class="ch-desc">${ch.desc}</div>
       </div>
       <div class="ch-reward">\uD83E\uDE99 +${ch.reward}</div>
     </div>
     <div class="ch-progress">
       <div class="progress-track">
         <div class="progress-fill${claimed || done ? " done" : ""}" style="width:${pct}%"></div>
       </div>
       <div class="progress-label">${prog}/${ch.target}</div>
     </div>` +
    (claimed
      ? `<div class="done-badge">\u0412\u042B\u041F\u041E\u041B\u041D\u0415\u041D\u041E</div>`
      : done
        ? `<button class="claim-btn" id="claim_${ch.id}">\u0417\u0410\u0411\u0420\u0410\u0422\u042C!</button>`
        : `<div class="timer-badge">${pct}%</div>`
    );

  if (done && !claimed) {
    const btn = card.querySelector(`#claim_${ch.id}`) as HTMLButtonElement;
    btn?.addEventListener("click", () => claimChallenge(ch));
  }

  return card;
}

function renderAll(): void {
  const daily  = document.getElementById("dailyList")!;
  const weekly = document.getElementById("weeklyList")!;
  daily.innerHTML  = "";
  weekly.innerHTML = "";
  for (const ch of challenges) {
    (ch.weekly ? weekly : daily).appendChild(renderChallenge(ch));
  }
}
renderAll();

// ── Background ────────────────────────────────────────────────────────────────
(function startBg() {
  const cvs = document.getElementById("bgCanvas") as HTMLCanvasElement;
  if (!cvs) return;
  const ctx = cvs.getContext("2d")!;
  cvs.width  = window.innerWidth;
  cvs.height = window.innerHeight;
  window.addEventListener("resize", () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; });
  const pts: { x: number; y: number; s: number; v: number; a: number }[] = [];
  for (let i = 0; i < 90; i++) pts.push({ x: Math.random() * cvs.width, y: Math.random() * cvs.height, s: Math.random() * 2 + 0.3, v: Math.random() * 0.2 + 0.06, a: Math.random() * 0.3 + 0.1 });
  (function tick() {
    ctx.fillStyle = "#030a14"; ctx.fillRect(0, 0, cvs.width, cvs.height);
    for (const p of pts) {
      ctx.fillStyle = `rgba(64,168,200,${p.a * (0.8 + Math.random() * 0.4)})`;
      ctx.fillRect(p.x, p.y, p.s, p.s);
      p.y += p.v;
      if (p.y > cvs.height) { p.y = 0; p.x = Math.random() * cvs.width; }
    }
    requestAnimationFrame(tick);
  })();
})();
