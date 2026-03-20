// registration.ts — entry point for index.html

import {
  getNick, setNick, getAvatar, setAvatar, getCharId,
  isNickTaken, registerNick, getTelegramUser,
} from "./player.js";

// ── Redirect if already registered ─────────────────────────────────────────
if (getNick() && getCharId()) {
  window.location.replace("menu.html");
}

// If opened inside Telegram WebApp with a logged user, auto-fill and go to menu
(async function tryAutofillFromTelegram() {
  try {
    const tg = getTelegramUser();
    if (!tg) return;
    const username = tg.username || tg.first_name;
    if (!username) return;

    // set nick + default character
    setNick(username);
    if (!getCharId()) setCharId("knight");

    // try to get avatar from server endpoint and save
    if (tg.id) {
      try {
        const resp = await fetch(`/api/user/${tg.id}`);
        const j = await resp.json();
        if (j && j.avatar) setAvatar(j.avatar);
        localStorage.setItem("tgUserId", String(tg.id));
      } catch (e) { /* ignore */ }
    }

    // finally navigate to menu
    window.location.replace("menu.html");
  } catch (e) {
    // ignore
  }
})();

// ── DOM refs ────────────────────────────────────────────────────────────────
const avatarFrame    = document.getElementById("avatarFrame")    as HTMLElement;
const avatarFileInput = document.getElementById("avatarFileInput") as HTMLInputElement;
const nickInput      = document.getElementById("nickInput")      as HTMLInputElement;
const nickStatus     = document.getElementById("nickStatus")     as HTMLElement;
const btnCheck       = document.getElementById("btnCheck")       as HTMLButtonElement;
const btnOk          = document.getElementById("btnOk")          as HTMLButtonElement;
const bgCanvas       = document.getElementById("bgCanvas")       as HTMLCanvasElement;
const flashEl        = document.getElementById("flash")          as HTMLElement | null;

// ── Pre-fill ─────────────────────────────────────────────────────────────────
const tgUser = getTelegramUser();
if (tgUser?.username) nickInput.value = tgUser.username;
else if (getNick()) nickInput.value = getNick()!;

const savedAvatar = getAvatar();
if (savedAvatar) {
  avatarFrame.innerHTML =
    `<img src="${savedAvatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
}

// ── Avatar upload ─────────────────────────────────────────────────────────────
avatarFrame.addEventListener("click", () => avatarFileInput.click());
avatarFileInput.addEventListener("change", () => {
  const file = avatarFileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result as string;
    setAvatar(dataUrl);
    avatarFrame.innerHTML =
      `<img src="${dataUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  };
  reader.readAsDataURL(file);
});

// ── Nick check ────────────────────────────────────────────────────────────────
let nickOk = false;

function checkNick(): void {
  const nick = nickInput.value.trim();
  if (nick.length < 3) {
    nickStatus.textContent = "\u041e\u0448\u0438\u0431\u043a\u0430: \u043c\u0438\u043d 3 \u0441\u0438\u043c\u0432\u043e\u043b\u0430";
    nickStatus.style.color = "#ff0055";
    nickOk = false;
    btnOk.disabled = true;
    return;
  }
  if (isNickTaken(nick)) {
    nickStatus.textContent = "\u0418\u043c\u044f \u0437\u0430\u043d\u044f\u0442\u043e!";
    nickStatus.style.color = "#ff0055";
    nickOk = false;
    btnOk.disabled = true;
  } else {
    nickStatus.textContent = "\u0418\u043c\u044f \u0441\u0432\u043e\u0431\u043e\u0434\u043d\u043e!";
    nickStatus.style.color = "#00ff99";
    nickOk = true;
    btnOk.disabled = false;
  }
}

// Auto-check on every keystroke
nickInput.addEventListener("input", checkNick);

function proceed(): void {
  if (!nickOk) {
    checkNick();
    return;
  }
  const nick = nickInput.value.trim();
  registerNick(nick);
  setNick(nick);
  if (tgUser?.id) localStorage.setItem("tgUserId", String(tgUser.id));
  if (flashEl) {
    flashEl.style.opacity = "1";
    setTimeout(() => {
      window.location.replace("character.html");
    }, 300);
  } else {
    window.location.replace("character.html");
  }
}

btnCheck.addEventListener("click", checkNick);
btnOk.addEventListener("click", proceed);

// Run once on load so pre-filled nick activates the button
checkNick();

// Expose for HTML onclick attributes (fallback)
(window as unknown as Record<string, unknown>)["checkNick"] = checkNick;
(window as unknown as Record<string, unknown>)["proceed"]   = proceed;

// ── Background particle canvas ────────────────────────────────────────────────
(function startBgCanvas() {
  if (!bgCanvas) return;
  const ctx = bgCanvas.getContext("2d")!;
  bgCanvas.width  = window.innerWidth;
  bgCanvas.height = window.innerHeight;

  window.addEventListener("resize", () => {
    bgCanvas.width  = window.innerWidth;
    bgCanvas.height = window.innerHeight;
  });

  const stars: { x: number; y: number; s: number; v: number }[] = [];
  for (let i = 0; i < 140; i++) {
    stars.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      s: Math.random() * 2 + 0.5,
      v: Math.random() * 0.4 + 0.1,
    });
  }

  function tick() {
    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    ctx.fillStyle = "#0a0308";
    ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    for (const st of stars) {
      ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.random() * 0.3})`;
      ctx.fillRect(st.x, st.y, st.s, st.s);
      st.y += st.v;
      if (st.y > bgCanvas.height) { st.y = 0; st.x = Math.random() * bgCanvas.width; }
    }
    requestAnimationFrame(tick);
  }
  tick();
})();
