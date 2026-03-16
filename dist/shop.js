// shop.ts вЂ” entry point for shop.html
import { getCoins, setCoins, SHOP_CATALOGUE, getEquipped, setEquipped, getTotalStats, getLevel, getXP, getXPForNextLevel, recordCoinSpend, } from "./player.js";
// в”Ђв”Ђ Owned items в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function getOwned() { return JSON.parse(localStorage.getItem("shopOwned") ?? "[]"); }
function addOwned(id) {
    const o = getOwned();
    if (!o.includes(id)) {
        o.push(id);
        localStorage.setItem("shopOwned", JSON.stringify(o));
    }
}
// в”Ђв”Ђ DOM в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const coinEl = document.getElementById("coinCount");
const statsEl = document.getElementById("statsPanel");
const levelEl = document.getElementById("playerLevel");
const xpBarEl = document.getElementById("xpBar");
const xpTextEl = document.getElementById("xpText");
function refreshHeader() {
    coinEl.textContent = String(getCoins());
    const s = getTotalStats();
    if (statsEl)
        statsEl.innerHTML =
            `\u2694 \u0410\u0422\u041a:<b>${s.atk}</b>&nbsp; \uD83D\uDEE1 \u0414\u0415\u0424:<b>${s.def}</b>&nbsp; \u26A1 \u0421\u041f\u0414:<b>${s.spd}</b>`;
    if (levelEl)
        levelEl.textContent = `LVL ${getLevel()}`;
    if (xpBarEl)
        xpBarEl.style.width = `${Math.min(100, Math.round(getXP() / getXPForNextLevel() * 100))}%`;
    if (xpTextEl)
        xpTextEl.textContent = `${getXP()} / ${getXPForNextLevel()} XP`;
}
refreshHeader();
// в”Ђв”Ђ Render grid в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function renderGrid(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container)
        return;
    container.innerHTML = "";
    const owned = getOwned();
    const equipped = getEquipped();
    for (const item of items) {
        const isOwned = owned.includes(item.id);
        const isEquipped = equipped[item.slot] === item.id;
        const bonusParts = [];
        if (item.bonus.atk)
            bonusParts.push(`\u2694 +${item.bonus.atk} \u0410\u0422\u041a`);
        if (item.bonus.def)
            bonusParts.push(`\uD83D\uDEE1 +${item.bonus.def} \u0414\u0415\u0424`);
        if (item.bonus.spd)
            bonusParts.push(`\u26A1 +${item.bonus.spd} \u0421\u041f\u0414`);
        const bonusStr = bonusParts.join("  ") || "\u2014";
        const div = document.createElement("div");
        div.className = `shop-item${isOwned ? " owned" : ""}${isEquipped ? " equipped" : ""}`;
        div.innerHTML =
            `<div class="item-icon">${item.icon}</div>` +
                `<div class="item-name">${item.name}</div>` +
                `<div class="item-bonus">${bonusStr}</div>` +
                (isOwned
                    ? `<button class="equip-btn${isEquipped ? " is-equipped" : ""}" data-id="${item.id}" data-slot="${item.slot}">` +
                        (isEquipped ? "\u2716 \u0421\u041d\u042f\u0422\u042c" : "\u2714 \u042d\u041a\u0418\u041f\u0418\u0420") +
                        `</button>`
                    : `<div class="item-price">\uD83E\uDE99 ${item.price}</div>`);
        if (!isOwned)
            div.addEventListener("click", () => buyItem(item));
        const btn = div.querySelector(".equip-btn");
        btn?.addEventListener("click", (e) => { e.stopPropagation(); toggleEquip(item.id, item.slot); });
        container.appendChild(div);
    }
}
function buyItem(item) {
    const coins = getCoins();
    if (coins < item.price) {
        showToast("\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u043c\u043e\u043d\u0435\u0442!");
        return;
    }
    setCoins(coins - item.price);
    recordCoinSpend(item.price);
    addOwned(item.id);
    refreshHeader();
    renderAll();
    showToast(`${item.name} \u043a\u0443\u043f\u043b\u0435\u043d\u043e! \u041d\u0430\u0436\u043c\u0438 \u042d\u041a\u0418\u041f\u0418\u0420.`);
}
function toggleEquip(id, slot) {
    const eq = getEquipped();
    if (eq[slot] === id) {
        eq[slot] = null;
        showToast("\u0421\u043d\u044f\u0442\u043e \u0441 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0430");
    }
    else {
        eq[slot] = id;
        showToast(`\u042d\u043a\u0438\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e \u0432 \u0431\u043e\u044e!`);
    }
    setEquipped(eq);
    refreshHeader();
    renderAll();
}
function renderAll() {
    renderGrid("weaponsGrid", SHOP_CATALOGUE.filter(i => i.slot === "weapon"));
    renderGrid("armorsGrid", SHOP_CATALOGUE.filter(i => i.slot === "armor"));
    renderGrid("accessoriesGrid", SHOP_CATALOGUE.filter(i => i.slot === "accessory"));
}
renderAll();
// в”Ђв”Ђ Toast в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const toastEl = document.getElementById("toast");
let toastTimer = null;
function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.style.opacity = "1";
    if (toastTimer)
        clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.style.opacity = "0"; }, 2400);
}
// в”Ђв”Ђ Background в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
(function startBg() {
    const cvs = document.getElementById("bgCanvas");
    if (!cvs)
        return;
    const ctx = cvs.getContext("2d");
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    window.addEventListener("resize", () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; });
    const pts = [];
    for (let i = 0; i < 80; i++)
        pts.push({ x: Math.random() * cvs.width, y: Math.random() * cvs.height, s: Math.random() * 1.5 + 0.4, v: Math.random() * 0.3 + 0.08 });
    (function tick() {
        ctx.fillStyle = "#0a0308";
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        for (const p of pts) {
            ctx.fillStyle = `rgba(255,180,80,${0.2 + Math.random() * 0.2})`;
            ctx.fillRect(p.x, p.y, p.s, p.s);
            p.y += p.v;
            if (p.y > cvs.height) {
                p.y = 0;
                p.x = Math.random() * cvs.width;
            }
        }
        requestAnimationFrame(tick);
    })();
})();
