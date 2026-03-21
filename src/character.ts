// character.ts — entry point for character.html

import { CHAR_META, getNick, getAvatar, getCharId, getCoins, CharId, setCharId, setCoins } from "./player.js";
import { drawCharacterPreview } from "./fighter.js";
import { Knight3D } from "./three-knight.js";

const bgCanvas       = document.getElementById("bgCanvas")       as HTMLCanvasElement;
const viewport         = document.getElementById("cardsViewport")   as HTMLElement;
const cardsContainer   = document.getElementById("cardsContainer")  as HTMLElement;
const btnConfirm       = document.getElementById("btnConfirm")      as HTMLButtonElement;
const flashEl          = document.getElementById("flash")           as HTMLElement | null;
const bgOverlay        = document.getElementById("bgOverlay")       as HTMLElement;

let selectedId: CharId | null = null;

// ── Build character cards ─────────────────────────────────────────────────────
const charIds: CharId[] = ["knight", "killer", "mage", "necro", "berserker", "troll", "cryo_knight"];

charIds.forEach(id => {
  const meta = CHAR_META[id];
  const card = document.createElement("div");
  card.className = "char-card";
  card.id        = `card-${id}`;
  card.dataset.id = id;

  // Visual container
  const visual = document.createElement("div");
  visual.className = "char-visual";
  visual.style.width = "100%";
  visual.style.height = "240px";

  if (id === "knight") {
    // 3D Knight
    setTimeout(() => {
        new Knight3D(visual);
    }, 10);
  } else {
    // 2D Canvas preview
    const cvs = document.createElement("canvas");
    cvs.width  = 160;
    cvs.height = 240;
    const pctx = cvs.getContext("2d")!;
    drawCharacterPreview(pctx, cvs.width / 2, cvs.height - 20, id, meta.color, 0, 0);
    visual.appendChild(cvs);
  }

  const infoBox = document.createElement("div");
  infoBox.className = "char-info-box";

  const nameEl = document.createElement("div");
  nameEl.className   = "char-name";
  nameEl.textContent = meta.name;

  const statEl = document.createElement("div");
  statEl.className = "char-stats";
  statEl.textContent = `\u2665 ${meta.maxHp} HP \u2022 \u2694\ufe0f ${meta.weapon.toUpperCase()}`;

  infoBox.appendChild(nameEl);
  infoBox.appendChild(statEl);
  
  card.appendChild(visual);
  card.appendChild(infoBox);
  
  card.addEventListener("click", () => {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });

  cardsContainer.appendChild(card);
});

// ── Theme & Scroll Logic ──────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function updateActiveTheme() {
  const viewportRect = viewport.getBoundingClientRect();
  const centerX = viewportRect.left + viewportRect.width / 2;
  
  let closestCard: HTMLElement | null = null;
  let minDistance = Infinity;

  const cards = Array.from(cardsContainer.children) as HTMLElement[];
  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    const distance = Math.abs(centerX - cardCenter);

    if (distance < minDistance) {
      minDistance = distance;
      closestCard = card;
    }
    card.classList.remove("active");
  }

  if (closestCard) {
    closestCard.classList.add("active");
    const id = closestCard.dataset.id as CharId;
    if (selectedId !== id) {
      selectedId = id;
      const meta = CHAR_META[id];
      const rgb = hexToRgb(meta.color);
      
      document.body.style.setProperty("--char-color", meta.color);
      document.body.style.setProperty("--char-rgb", rgb);
      
      btnConfirm.disabled = false;
    }
  }
}

viewport.addEventListener("scroll", () => {
  requestAnimationFrame(updateActiveTheme);
}, { passive: true });

// Initial call
setTimeout(updateActiveTheme, 100);

async function confirmSelect(): Promise<void> {
  if (!selectedId) return;
  setCharId(selectedId);
  setCoins(100); // starter coins

  try {
    const { getTelegramUser } = await import("./player.js");
    const tgUser = getTelegramUser();
    // Попытка сохранить на сервере, если есть id Telegram
    if (tgUser && tgUser.id) {
      await fetch('/api/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          telegram_id: String(tgUser.id),
          character_id: selectedId,
          faction: 'human' // дефолт
        })
      });
    } else {
      // Иначе пробуем достать из параметров (если tg= передано в URL)
      const params = new URLSearchParams(window.location.search);
      const tgParam = params.get('tg');
      if (tgParam) {
        await fetch('/api/character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            telegram_id: tgParam, 
            character_id: selectedId,
            faction: 'human'
          })
        });
      }
    }
  } catch(e) { /* ignore backend errors and proceed locally */ }

  if (flashEl) {
    flashEl.style.opacity = "1";
    setTimeout(() => { 
      console.log("Character: Selection confirmed, redirecting to menu.html");
      window.location.replace("menu.html"); 
    }, 300);
  } else {
    console.log("Character: Selection confirmed (no flash), redirecting to menu.html");
    window.location.replace("menu.html");
  }
}

btnConfirm.addEventListener("click", confirmSelect);

// Expose for HTML onclick fallback
(window as unknown as Record<string, unknown>)["confirmSelect"] = confirmSelect;

// ── Background stars canvas ───────────────────────────────────────────────────
(function startBg() {
  if (!bgCanvas) return;
  const ctx = bgCanvas.getContext("2d")!;
  bgCanvas.width  = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  window.addEventListener("resize", () => {
    bgCanvas.width  = window.innerWidth;
    bgCanvas.height = window.innerHeight;
  });
  const stars: { x: number; y: number; s: number; v: number }[] = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      s: Math.random() * 1.8 + 0.4,
      v: Math.random() * 0.3 + 0.1,
    });
  }
  function tick() {
    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    ctx.fillStyle = "#07030f";
    ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    for (const st of stars) {
      ctx.fillStyle = `rgba(200,180,255,${0.3 + Math.random() * 0.3})`;
      ctx.fillRect(st.x, st.y, st.s, st.s);
      st.y += st.v;
      if (st.y > bgCanvas.height) { st.y = 0; st.x = Math.random() * bgCanvas.width; }
    }
    requestAnimationFrame(tick);
  }
  tick();
})();
