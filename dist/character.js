// character.ts — entry point for character.html
import { CHAR_META, getCharId, setCharId, setCoins } from "./player.js";
import { drawCharacterPreview } from "./fighter.js";
const bgCanvas = document.getElementById("bgCanvas");
const cardsContainer = document.getElementById("cardsContainer");
const btnConfirm = document.getElementById("btnConfirm");
const flashEl = document.getElementById("flash");
let selectedId = null;
// ── Build character cards ─────────────────────────────────────────────────────
const charIds = ["cryo_knight", "mage", "scarlet_assassin", "necromancer", "berserker", "goblin"];
charIds.forEach(id => {
    const meta = CHAR_META[id];
    const card = document.createElement("div");
    card.className = "char-card";
    card.id = `card-${id}`;
    // Canvas preview
    const cvs = document.createElement("canvas");
    cvs.width = 120;
    cvs.height = 180;
    {
        const pctx = cvs.getContext("2d");
        pctx.clearRect(0, 0, cvs.width, cvs.height);
        drawCharacterPreview(pctx, cvs.width / 2, cvs.height - 8, id, meta.color, 0, 0);
    }
    // Name label (encode Cyrillic in meta.name via the unicode escapes already in player.ts)
    const nameEl = document.createElement("div");
    nameEl.className = "char-name";
    nameEl.textContent = meta.name;
    nameEl.style.color = meta.color;
    // Stat bar
    const statEl = document.createElement("div");
    statEl.className = "char-stats";
    statEl.innerHTML =
        `<div>\u2665 ${meta.maxHp} HP</div>`;
    card.appendChild(cvs);
    card.appendChild(nameEl);
    card.appendChild(statEl);
    card.addEventListener("click", () => selectChar(id));
    cardsContainer?.appendChild(card);
});
selectChar(getCharId() ?? "mage");
function selectChar(id) {
    selectedId = id;
    charIds.forEach(cid => {
        const el = document.getElementById(`card-${cid}`);
        if (el) {
            el.classList.toggle("selected", cid === id);
            el.classList.toggle("active", cid === id);
        }
    });
    btnConfirm.disabled = false;
    const meta = CHAR_META[id];
    btnConfirm.style.borderColor = meta.color;
    btnConfirm.style.color = meta.color;
    btnConfirm.style.boxShadow = `0 0 16px ${meta.color}`;
    document.body.style.setProperty("--char-color", meta.color);
    document.body.style.setProperty("--char-rgb", meta.rgb);
}
function confirmSelect() {
    if (!selectedId)
        return;
    setCharId(selectedId);
    setCoins(100); // starter coins
    if (flashEl) {
        flashEl.style.opacity = "1";
        setTimeout(() => { window.location.href = "menu.html"; }, 300);
    }
    else {
        window.location.href = "menu.html";
    }
}
btnConfirm.addEventListener("click", confirmSelect);
// Expose for HTML onclick fallback
window["confirmSelect"] = confirmSelect;
// ── Background stars canvas ───────────────────────────────────────────────────
(function startBg() {
    if (!bgCanvas)
        return;
    const ctx = bgCanvas.getContext("2d");
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    window.addEventListener("resize", () => {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
    });
    const stars = [];
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
            if (st.y > bgCanvas.height) {
                st.y = 0;
                st.x = Math.random() * bgCanvas.width;
            }
        }
        requestAnimationFrame(tick);
    }
    tick();
})();
