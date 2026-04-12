// menu.ts — entry point for menu.html
import { CHAR_META, getNick, getAvatar, getCharId, getCoins, CharId, syncProfileToServer } from "./player.js";
import { drawCharacterPreview } from "./fighter.js";
import { drawJadeMagePreview } from "./jade-mage.js";
// import { Knight3D } from "./three-knight.js"; // Removed 3D

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
let charId: CharId | null = null;

async function ensurePlayerFromTelegramIfMissing(): Promise<boolean> {
  nick = getNick();
  charId = getCharId();
  if (nick && charId) return true;
  // Если ник есть, но герой не выбран — сразу переход на выбор героя
  if (nick && !charId) {
    console.log("Menu: Nick exists but no CharId, redirecting to character.html");
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
            console.log("Menu: TG param found but no CharId, redirecting to character.html");
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

  const currentCharId = charId;
  if (!currentCharId) return;
  const meta   = CHAR_META[currentCharId];
  void syncProfileToServer({ username: nick, charId: charId as CharId });
  const avatar = getAvatar();
  const coins  = getCoins();

  // Apply dynamic theme to background and buttons
  function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }
  document.body.style.setProperty("--char-color", meta.color);
  document.body.style.setProperty("--char-rgb", hexToRgb(meta.color));

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

  // 3D Integration - REMOVED: High-fidelity 2D only

  function drawArena(): void {
    gameTime++;
    const w  = arenaCanvas.width;
    const h  = arenaCanvas.height;
    
    arCtx.clearRect(0, 0, w, h);

    // Floor rendering
    const floorY = h * 0.75;
    arCtx.fillStyle = "#0a0a05";
    arCtx.fillRect(0, floorY, w, h - floorY);
    arCtx.shadowColor = meta.color; arCtx.shadowBlur = 15;
    arCtx.strokeStyle = meta.color; arCtx.lineWidth = 2;
    arCtx.globalAlpha = 0.3;
    arCtx.beginPath(); arCtx.moveTo(0, floorY); arCtx.lineTo(w, floorY); arCtx.stroke();
    arCtx.globalAlpha = 1.0;
    arCtx.shadowBlur = 0;

    // Draw Character Scaled
    arCtx.save();
    // Position character in center, standing on floorY
    const scale = 2.4; 
    arCtx.translate(w / 2, floorY - 10);
    arCtx.scale(scale, scale);
    
    const bob = Math.sin(gameTime * 0.04) * 4;
    if (currentCharId === "mage") {
      drawJadeMagePreview(arCtx, 0, 0, bob, gameTime);
    } else {
      drawCharacterPreview(arCtx, 0, 0, currentCharId as CharId, meta.color, bob, gameTime);
    }
    arCtx.restore();

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
