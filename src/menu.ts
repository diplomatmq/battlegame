// menu.ts — entry point for menu.html

import { CHAR_META, getNick, getAvatar, getCharId, getCoins } from "./player.js";
import { drawCharacterPreview } from "./fighter.js";

// ── Navigation ──────────────────────────────────────────────────────────────
function navigate(url: string): void {
  const flash = document.getElementById("flash");
  if (flash) {
    flash.style.opacity = "1";
    setTimeout(() => { window.location.replace(url); }, 280);
  } else {
    window.location.replace(url);
  }
}
function goPlay():       void { navigate("game.html");       }
function goShop():       void { navigate("shop.html");       }
function goChallenges(): void { navigate("challenges.html"); }
(window as unknown as Record<string, unknown>)["goPlay"]       = goPlay;
(window as unknown as Record<string, unknown>)["goShop"]       = goShop;
(window as unknown as Record<string, unknown>)["goChallenges"] = goChallenges;

// ── Guard / Telegram auto-fill ─────────────────────────────────────────────────
let nick: string | null = null;
let charId: string | null = null;

async function ensurePlayerFromTelegramIfMissing(): Promise<boolean> {
  nick = getNick();
  charId = getCharId();
  if (nick && charId) return true;
  // Если ник есть, но герой не выбран — сразу переход на выбор героя
  if (nick && !charId) {
    window.location.replace("character.html");
    return false;
  }
  // If URL contains ?tg=<id>, use that to auto-fill from server
  try {
    const params = new URLSearchParams(window.location.search);
    const tgParam = params.get('tg');
    if (tgParam) {
      const { setNick, setCharId, setAvatar } = await import("./player.js");
      try {
        const resp = await fetch(`/api/user/${encodeURIComponent(tgParam)}`);
        const j = await resp.json();
        if (j && (j.username || j.avatar)) {
          const username = j.username || (j.first_name || 'player');
          setNick(username);
          if (j.charId) {
            setCharId(j.charId);
          }
          if (j.avatar) setAvatar(j.avatar);
          
          if (!getCharId()) {
            if (!window.location.pathname.endsWith('character.html')) {
              window.location.replace("character.html?tg=" + encodeURIComponent(tgParam));
            }
            return false;
          }
          nick = getNick();
          charId = getCharId();
          return true;
        }
      } catch (e) {}
    }
  } catch (e) {}
  
  try {
    const { getTelegramUser, setNick, getCharId: _getCharId, setCharId, setAvatar } = await import("./player.js");
    const tgUser = getTelegramUser();
    if (tgUser && (tgUser.username || tgUser.first_name || tgUser.id)) {
      const username = (tgUser.username || tgUser.first_name || "player").toString();
      setNick(username);
      try {
        const resp = await fetch(`/api/user/${tgUser.id}`);
        const j = await resp.json();
        if (j && j.avatar) setAvatar(j.avatar);
        if (j && j.charId) setCharId(j.charId);
      } catch (e) {}
      
      if (!_getCharId()) {
        window.location.replace(`character.html?tg=${tgUser.id}`);
        return false;
      }
      
      nick = getNick();
      charId = getCharId();
      return true;
    }
  } catch (e) {}
  
  // nothing found — but ensuring we don't crash
  nick = getNick();
  charId = getCharId();
  if (!charId) {
    if (window.location.pathname.endsWith('character.html')) return false;
    window.location.replace("character.html");
    return false;
  }
  return true;
}


// We'll initialize DOM and populate after ensuring player data
async function initMenuUI() {
  const playerAvatarEl = document.getElementById("playerAvatar") as HTMLElement;
  const playerNickEl   = document.getElementById("playerNick")   as HTMLElement;
  const coinCountEl    = document.getElementById("coinCount")    as HTMLElement;
  const arenaCanvas    = document.getElementById("arenaCanvas")  as HTMLCanvasElement;
  const bgCanvas       = document.getElementById("bgCanvas")     as HTMLCanvasElement;
  const flashEl        = document.getElementById("flash")        as HTMLElement | null;

  const meta   = CHAR_META[charId as any];
  const avatar = getAvatar();
  const coins  = getCoins();

  playerNickEl.textContent          = (nick ?? "\u0413\u0415\u0420\u041e\u0419").toUpperCase();
  coinCountEl.textContent           = String(coins);
  playerAvatarEl.style.borderColor  = meta.color;

  if (avatar) {
    playerAvatarEl.innerHTML =
      `<img src="${avatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    playerAvatarEl.textContent = (nick ?? "??").substring(0, 2).toUpperCase();
    playerAvatarEl.style.color    = meta.color;
    playerAvatarEl.style.fontSize = "12px";
  }

  // Arena and background init (existing logic below)
  const arCtx  = arenaCanvas.getContext("2d")!;
  let gameTime = 0;

  function resizeArena(): void {
    arenaCanvas.width  = arenaCanvas.offsetWidth  || 400;
    arenaCanvas.height = arenaCanvas.offsetHeight || 280;
  }
  resizeArena();
  window.addEventListener("resize", resizeArena);

  function drawArena(): void {
    gameTime++;
    const w  = arenaCanvas.width;
    const h  = arenaCanvas.height;
    const cx = w / 2;
    const by = h - 18;

    arCtx.clearRect(0, 0, w, h);
    arCtx.fillStyle = "#111108";
    arCtx.fillRect(0, h - 40, w, 40);
    arCtx.shadowColor = "#8b6020"; arCtx.shadowBlur = 8;
    arCtx.strokeStyle = "#6b4010"; arCtx.lineWidth = 3;
    arCtx.beginPath(); arCtx.moveTo(0, h - 40); arCtx.lineTo(w, h - 40); arCtx.stroke();
    arCtx.shadowBlur = 0;

    const bob = Math.sin(gameTime * 0.04) * 5;
    drawCharacterPreview(arCtx, cx, by, charId ?? "knight", meta.color, bob, gameTime);

    requestAnimationFrame(drawArena);
  }
  drawArena();

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
    for (let i = 0; i < 100; i++) {
      stars.push({ x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height, s: Math.random() * 1.8 + 0.4, v: Math.random() * 0.25 + 0.08 });
    }
    function tick() {
      ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      ctx.fillStyle = "#0e0a03";
      ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      for (const st of stars) {
        ctx.fillStyle = `rgba(255,220,120,${0.25 + Math.random() * 0.2})`;
        ctx.fillRect(st.x, st.y, st.s, st.s);
        st.y += st.v;
        if (st.y > bgCanvas.height) { st.y = 0; st.x = Math.random() * bgCanvas.width; }
      }
      requestAnimationFrame(tick);
    }
    tick();
  })();
}

// Initialize: ensure player then init UI
ensurePlayerFromTelegramIfMissing().then((shouldInit) => {
  if (shouldInit) initMenuUI();
});
