// fighter.ts — Fighter class: AI, damage, pixel-art draw
import { Particle, DamageText } from "./particles.js";
import { drawCryoKnight } from "./cryo-knight-draw.js";
// Shared mutable state — use an object so it acts as a reference
export const state = { screenShake: 0 };
// ── Standalone preview renderer (used by character.ts and menu.ts) ───────────
export function drawCharacterPreview(ctx, cx, by, charType, color, bob = 0, gt = 0) {
    ctx.imageSmoothingEnabled = false;
    const s = 1.0; // scale — callers can ctx.scale before calling
    ctx.save();
    ctx.translate(cx, by + bob);
    if (charType === "cryo_knight") {
        _drawCryoKnightPreview(ctx, gt, s);
    }
    else if (charType === "scarlet_assassin") {
        _drawScarletAssassinPreview(ctx, color, gt, s);
    }
    else if (charType === "necromancer") {
        _drawNecromancerPreview(ctx, color, gt, s);
    }
    else if (charType === "berserker") {
        _drawBerserkerPreview(ctx, color, s);
    }
    else if (charType === "goblin") {
        _drawGoblinPreview(ctx, color, gt, s);
    }
    else if (charType === "mage") {
        _drawMagePreview(ctx, color, gt, s);
    }
    else {
        _drawCryoKnightPreview(ctx, gt, s);
    }
    ctx.restore();
}
function _drawKnightPreview(ctx, C, _s) {
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Back leg
    ctx.fillStyle = "#4a3060";
    ctx.fillRect(-13, -22, 12, 24);
    // Cape
    ctx.fillStyle = "#8b1a1a";
    ctx.globalAlpha = 0.8;
    ctx.fillRect(-18, -58, 11, 40);
    ctx.globalAlpha = 1;
    // Torso armor
    ctx.fillStyle = C;
    ctx.fillRect(-14, -62, 30, 44);
    ctx.fillStyle = "#dde0e8";
    ctx.fillRect(-10, -58, 22, 30); // chest plate
    ctx.fillStyle = C;
    // Shoulder pads
    ctx.fillStyle = "#ccc";
    ctx.fillRect(-19, -64, 11, 13);
    ctx.fillRect(9, -64, 11, 13);
    // Front leg
    ctx.fillStyle = "#4a3060";
    ctx.fillRect(2, -22, 12, 24);
    // Neck + face
    ctx.fillStyle = "#f0c88a";
    ctx.fillRect(-7, -74, 14, 14);
    // Helmet
    ctx.fillStyle = C;
    ctx.fillRect(-12, -90, 24, 20);
    ctx.fillStyle = "#aab";
    ctx.fillRect(-10, -78, 20, 9); // visor
    ctx.fillStyle = "#333";
    ctx.fillRect(-7, -76, 4, 4);
    ctx.fillRect(4, -76, 4, 4);
    ctx.fillStyle = "#ccc";
    ctx.fillRect(-12, -92, 24, 4); // brim
    // Shield arm
    ctx.fillStyle = C;
    ctx.fillRect(-26, -62, 12, 34);
    ctx.fillStyle = "#cc2200";
    ctx.fillRect(-30, -66, 11, 40); // shield
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(-27, -54, 5, 5); // emblem
    // Sword arm
    ctx.fillStyle = C;
    ctx.fillRect(15, -64, 12, 30);
    // Sword
    ctx.fillStyle = "#7a4010";
    ctx.fillRect(28, -50, 6, 18);
    ctx.fillStyle = "#cc9900";
    ctx.fillRect(22, -56, 18, 6);
    ctx.fillStyle = "#d8d8e8"; // blade
    ctx.beginPath();
    ctx.moveTo(27, -88);
    ctx.lineTo(33, -88);
    ctx.lineTo(35, -52);
    ctx.lineTo(25, -52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(29, -86, 2, 34);
}
function _drawMagePreview(ctx, C, gt, _s) {
    const glow = Math.sin(gt * 0.06) * 0.5 + 0.5;
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Robe back
    ctx.fillStyle = "#2a0d5e";
    ctx.fillRect(-14, -62, 11, 64);
    // Robe main
    ctx.fillStyle = C;
    ctx.fillRect(-12, -62, 26, 62);
    // Robe trim
    ctx.fillStyle = "#c8a0ff";
    ctx.fillRect(-12, -64, 26, 4);
    ctx.fillRect(-12, -32, 26, 4);
    // Belt
    ctx.fillStyle = "#c8a0ff";
    ctx.fillRect(-8, -44, 18, 5);
    // Legs (under robe hem)
    ctx.fillStyle = "#1a0840";
    ctx.fillRect(-10, -20, 9, 20);
    ctx.fillRect(2, -20, 9, 20);
    // Cloak shoulders
    ctx.fillStyle = C;
    ctx.fillRect(-19, -64, 9, 22);
    ctx.fillRect(12, -64, 9, 22);
    // Neck
    ctx.fillStyle = "#f0c88a";
    ctx.fillRect(-5, -74, 11, 13);
    // Face
    ctx.fillStyle = "#f0c88a";
    ctx.fillRect(-9, -90, 18, 20);
    // Hair blonde
    ctx.fillStyle = "#e8c030";
    ctx.fillRect(-10, -94, 20, 10);
    ctx.fillRect(-12, -90, 6, 16);
    // Eyes
    ctx.fillStyle = "#2020a0";
    ctx.fillRect(-6, -84, 4, 4);
    ctx.fillRect(2, -84, 4, 4);
    // Hood
    ctx.fillStyle = C;
    ctx.fillRect(-10, -98, 20, 10);
    // Staff arm
    ctx.fillStyle = C;
    ctx.fillRect(-22, -64, 10, 32);
    // Staff
    ctx.fillStyle = "#8b5c20";
    ctx.fillRect(-28, -104, 5, 84);
    // Orb
    ctx.shadowBlur = 16 + glow * 18;
    ctx.shadowColor = C;
    ctx.fillStyle = C;
    ctx.beginPath();
    ctx.arc(-26, -108, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Cast hand
    ctx.fillStyle = C;
    ctx.fillRect(14, -60, 10, 24);
}
function _drawTrollPreview(ctx, C, _s) {
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 34, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Back leg
    ctx.fillStyle = "#3d5c1a";
    ctx.fillRect(-16, -30, 14, 30);
    // Body
    ctx.fillStyle = C;
    ctx.fillRect(-24, -76, 48, 54);
    ctx.fillStyle = "#6b3a10";
    ctx.fillRect(-22, -32, 44, 14); // loincloth
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(-11, -72, 9, 32);
    ctx.fillRect(4, -72, 9, 32); // muscle
    // Shoulder pads
    ctx.fillStyle = "#888";
    ctx.fillRect(-28, -78, 16, 14);
    ctx.fillRect(14, -78, 16, 14);
    // Front leg
    ctx.fillStyle = "#3d5c1a";
    ctx.fillRect(4, -30, 14, 30);
    // Arms
    ctx.fillStyle = C;
    ctx.fillRect(-38, -74, 17, 42);
    ctx.fillRect(23, -74, 17, 42);
    // Head
    ctx.fillStyle = C;
    ctx.fillRect(-17, -104, 36, 32);
    // Tusks
    ctx.fillStyle = "#fffde0";
    ctx.fillRect(-15, -78, 6, 12);
    ctx.fillRect(11, -78, 6, 12);
    // Eyes
    ctx.fillStyle = "#cc0000";
    ctx.fillRect(-11, -96, 7, 7);
    ctx.fillRect(6, -96, 7, 7);
    ctx.fillStyle = "#330000";
    ctx.fillRect(-9, -94, 3, 3);
    ctx.fillRect(8, -94, 3, 3);
    // Nose
    ctx.fillStyle = "#2d5010";
    ctx.fillRect(-4, -86, 9, 7);
    // Horns
    ctx.fillStyle = "#4a3010";
    ctx.beginPath();
    ctx.moveTo(-12, -104);
    ctx.lineTo(-20, -124);
    ctx.lineTo(-4, -104);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, -104);
    ctx.lineTo(22, -124);
    ctx.lineTo(6, -104);
    ctx.closePath();
    ctx.fill();
    // Axe
    ctx.fillStyle = "#5c2e08";
    ctx.fillRect(30, -100, 7, 80);
    ctx.fillStyle = "#9a9aaa";
    ctx.beginPath();
    ctx.moveTo(34, -94);
    ctx.lineTo(62, -108);
    ctx.lineTo(66, -78);
    ctx.lineTo(34, -66);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e0e0f0";
    ctx.beginPath();
    ctx.moveTo(60, -110);
    ctx.lineTo(72, -114);
    ctx.lineTo(72, -74);
    ctx.lineTo(60, -70);
    ctx.closePath();
    ctx.fill();
}
function _drawScarletAssassinPreview(ctx, C, gt, _s) {
    const pulse = Math.sin(gt * 0.14) * 0.5 + 0.5;
    const swirl = Math.sin(gt * 0.26) * 3.2;
    ctx.fillStyle = "rgba(0,0,0,0.33)";
    ctx.beginPath();
    ctx.ellipse(0, 3, 25, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    const aura = ctx.createRadialGradient(0, -64, 4, 0, -64, 44);
    aura.addColorStop(0, `rgba(255,70,88,${0.2 + pulse * 0.18})`);
    aura.addColorStop(1, "rgba(255,20,40,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -64, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#23030a";
    ctx.fillRect(-11, -22, 8, 22);
    ctx.fillRect(3, -22, 8, 22);
    ctx.fillStyle = "#460810";
    ctx.beginPath();
    ctx.moveTo(-13, -70);
    ctx.quadraticCurveTo(-30 + swirl, -28, -16, 2);
    ctx.lineTo(-8, -2);
    ctx.quadraticCurveTo(-8, -34, -6, -66);
    ctx.closePath();
    ctx.fill();
    const body = ctx.createLinearGradient(0, -72, 0, -20);
    body.addColorStop(0, "#ff3648");
    body.addColorStop(0.6, C);
    body.addColorStop(1, "#6a0f1c");
    ctx.fillStyle = body;
    ctx.fillRect(-12, -66, 24, 44);
    if (pulse > 0) {
        ctx.fillStyle = "rgba(255,150,150,0.18)";
        ctx.fillRect(-6, -64, 3, 34);
        ctx.fillRect(3, -64, 3, 34);
    }
    ctx.fillStyle = C;
    ctx.beginPath();
    ctx.moveTo(-13, -86);
    ctx.lineTo(0, -103);
    ctx.lineTo(13, -86);
    ctx.lineTo(9, -69);
    ctx.lineTo(-9, -69);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1e1f26";
    ctx.fillRect(-8, -80, 16, 10);
    ctx.fillStyle = `rgba(255,95,110,${0.72 + pulse * 0.28})`;
    ctx.fillRect(-5, -77, 3, 3);
    ctx.fillRect(2, -77, 3, 3);
    ctx.fillStyle = C;
    ctx.fillRect(-22, -63, 8, 28);
    ctx.fillRect(14, -63, 8, 28);
    ctx.strokeStyle = `rgba(255,86,110,${0.34 + pulse * 0.3})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-14, -48, 11, Math.PI * 1.06, Math.PI * 1.86);
    ctx.arc(14, -48, 11, Math.PI * 1.14, Math.PI * 1.94);
    ctx.stroke();
    ctx.fillStyle = "#6f4622";
    ctx.fillRect(-24, -38, 4, 13);
    ctx.fillRect(20, -38, 4, 13);
    ctx.fillStyle = "#dce0ee";
    ctx.beginPath();
    ctx.moveTo(-22, -53);
    ctx.lineTo(-11, -66);
    ctx.lineTo(-9, -53);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(22, -53);
    ctx.lineTo(33, -66);
    ctx.lineTo(35, -53);
    ctx.closePath();
    ctx.fill();
}
function _drawNecromancerPreview(ctx, C, gt, _s) {
    const pulse = Math.sin(gt * 0.09) * 0.5 + 0.5;
    const haze = ctx.createRadialGradient(0, -70, 2, 0, -70, 52);
    haze.addColorStop(0, `rgba(168,120,255,${0.24 + pulse * 0.2})`);
    haze.addColorStop(1, "rgba(95,55,170,0)");
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 3, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = haze;
    ctx.beginPath();
    ctx.arc(0, -70, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#12081d";
    ctx.fillRect(-12, -22, 9, 22);
    ctx.fillRect(3, -22, 9, 22);
    ctx.fillStyle = "#12061b";
    ctx.beginPath();
    ctx.moveTo(-18, -72);
    ctx.quadraticCurveTo(-34, -28, -18, 2);
    ctx.lineTo(-8, -2);
    ctx.quadraticCurveTo(-10, -38, -8, -70);
    ctx.closePath();
    ctx.fill();
    const robe = ctx.createLinearGradient(0, -74, 0, 2);
    robe.addColorStop(0, "#3c1f61");
    robe.addColorStop(0.55, C);
    robe.addColorStop(1, "#1a0c2e");
    ctx.fillStyle = robe;
    ctx.fillRect(-13, -70, 26, 70);
    ctx.fillStyle = "#26123c";
    ctx.fillRect(-13, -67, 26, 3);
    ctx.fillRect(-13, -36, 26, 3);
    ctx.fillStyle = C;
    ctx.beginPath();
    ctx.moveTo(-12, -98);
    ctx.lineTo(0, -114);
    ctx.lineTo(12, -98);
    ctx.lineTo(9, -88);
    ctx.lineTo(-9, -88);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#eee8d7";
    ctx.fillRect(-8, -88, 16, 18);
    ctx.fillStyle = "#1a1a24";
    ctx.fillRect(-5, -84, 3, 3);
    ctx.fillRect(2, -84, 3, 3);
    ctx.fillStyle = "#d8d0c0";
    ctx.fillRect(-1, -80, 2, 4);
    ctx.fillStyle = C;
    ctx.fillRect(-24, -67, 9, 29);
    ctx.fillStyle = "#6a4729";
    ctx.fillRect(-30, -110, 5, 74);
    ctx.strokeStyle = `rgba(186,154,255,${0.7 + pulse * 0.3})`;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(-27.5, -114, 7 + pulse * 2.3, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
        const ph = gt * (0.08 + i * 0.02) + i * 1.7;
        const ox = -2 + Math.cos(ph) * (11 + i * 4);
        const oy = -88 + Math.sin(ph * 1.3) * (5 + i * 1.5);
        const orb = ctx.createRadialGradient(ox, oy, 0.3, ox, oy, 3.5 + pulse * 1.5);
        orb.addColorStop(0, "rgba(235,220,255,0.85)");
        orb.addColorStop(1, "rgba(181,141,255,0)");
        ctx.fillStyle = orb;
        ctx.beginPath();
        ctx.arc(ox, oy, 3.5 + pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = C;
    ctx.fillRect(15, -62, 9, 24);
}
function _drawBerserkerPreview(ctx, C, _s) {
    ctx.fillStyle = "rgba(0,0,0,0.36)";
    ctx.beginPath();
    ctx.ellipse(0, 3, 31, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    const body = ctx.createLinearGradient(0, -86, 0, -28);
    body.addColorStop(0, "#f18b2a");
    body.addColorStop(0.55, C);
    body.addColorStop(1, "#72350f");
    ctx.fillStyle = "#4a220e";
    ctx.fillRect(-14, -26, 12, 28);
    ctx.fillRect(2, -26, 12, 28);
    ctx.fillStyle = "#2d190f";
    ctx.fillRect(-30, -35, 60, 15);
    ctx.fillStyle = "#c29a5f";
    ctx.fillRect(-28, -35, 8, 15);
    ctx.fillRect(20, -35, 8, 15);
    ctx.fillStyle = body;
    ctx.fillRect(-24, -82, 48, 52);
    ctx.fillStyle = "#7b3d16";
    ctx.fillRect(-10, -82, 20, 24);
    ctx.fillStyle = "rgba(255,208,120,0.2)";
    ctx.fillRect(-7, -80, 3, 18);
    ctx.fillRect(4, -80, 3, 18);
    ctx.fillStyle = "#f0c694";
    ctx.fillRect(-14, -102, 28, 22);
    ctx.fillStyle = "#2e1a11";
    ctx.fillRect(-8, -95, 3, 4);
    ctx.fillRect(5, -95, 3, 4);
    ctx.fillStyle = "#7f3514";
    ctx.beginPath();
    ctx.moveTo(-10, -104);
    ctx.lineTo(-20, -122);
    ctx.lineTo(-2, -104);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -104);
    ctx.lineTo(20, -122);
    ctx.lineTo(2, -104);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = C;
    ctx.fillRect(-38, -80, 14, 44);
    ctx.fillRect(24, -80, 14, 44);
    ctx.fillStyle = "#5c2e08";
    ctx.fillRect(32, -110, 6, 86);
    ctx.fillStyle = "#9095a6";
    ctx.beginPath();
    ctx.moveTo(35, -98);
    ctx.lineTo(65, -110);
    ctx.lineTo(69, -83);
    ctx.lineTo(35, -70);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e3e7f5";
    ctx.beginPath();
    ctx.moveTo(63, -112);
    ctx.lineTo(75, -116);
    ctx.lineTo(75, -76);
    ctx.lineTo(63, -72);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,160,80,0.35)";
    ctx.fillRect(58, -105, 2, 28);
}
function _drawGoblinPreview(ctx, C, gt, _s) {
    const pulse = Math.sin(gt * 0.18) * 0.5 + 0.5;
    const wobble = Math.sin(gt * 0.22) * 2.1;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 21, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f4214";
    ctx.fillRect(-10, -18, 7, 18);
    ctx.fillRect(3, -18, 7, 18);
    const skin = ctx.createLinearGradient(0, -88, 0, -24);
    skin.addColorStop(0, "#8ce158");
    skin.addColorStop(0.65, C);
    skin.addColorStop(1, "#2f661d");
    ctx.fillStyle = "#4b2a12";
    ctx.fillRect(-11, -29, 22, 11);
    ctx.fillStyle = skin;
    ctx.fillRect(-13, -64, 26, 40);
    ctx.fillStyle = C;
    ctx.beginPath();
    ctx.moveTo(-10, -86);
    ctx.lineTo(-22, -75 + wobble * 0.2);
    ctx.lineTo(-10, -70);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -86);
    ctx.lineTo(22, -75 - wobble * 0.2);
    ctx.lineTo(10, -70);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-10, -88, 20, 22);
    ctx.fillStyle = `rgba(255,70,35,${0.75 + pulse * 0.25})`;
    ctx.fillRect(-5, -82, 3, 3);
    ctx.fillRect(2, -82, 3, 3);
    ctx.fillStyle = "#111d0d";
    ctx.fillRect(-3, -80, 2, 2);
    ctx.fillRect(4, -80, 2, 2);
    ctx.fillStyle = "#d7e9b8";
    ctx.fillRect(-7, -73, 2, 6);
    ctx.fillRect(5, -73, 2, 6);
    ctx.fillStyle = "#2f541f";
    ctx.fillRect(-20, -62, 8, 25);
    ctx.fillRect(12, -62, 8, 25);
    const vial = ctx.createRadialGradient(-20, -43, 1, -20, -43, 8);
    vial.addColorStop(0, "rgba(200,255,130,0.88)");
    vial.addColorStop(1, "rgba(120,220,80,0)");
    ctx.fillStyle = vial;
    ctx.beginPath();
    ctx.arc(-20, -43, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6f4622";
    ctx.fillRect(21, -38, 4, 12);
    ctx.fillStyle = "#e4e4f2";
    ctx.beginPath();
    ctx.moveTo(23, -56);
    ctx.lineTo(34, -67);
    ctx.lineTo(36, -55);
    ctx.closePath();
    ctx.fill();
}
function _drawCryoKnightPreview(ctx, gt, _s) {
    const ambFrost = [];
    for (let i = 0; i < 12; i++) {
        ambFrost.push({
            a: gt * 0.025 + i * 0.52,
            d: 5 + (i % 4) * 4,
            off: 10 + Math.sin(gt * 0.05 + i) * 7,
            op: 0.55 + Math.sin(gt * 0.03 + i * 0.7) * 0.14,
            sz: 0.7 + (i % 3) * 0.35,
        });
    }
    const cryoTrails = [{
            x: 34,
            y: -44 + Math.sin(gt * 0.12) * 2,
            r: 6,
            w: 1.7,
            aa: Math.sin(gt * 0.08),
            as: 0.72,
            life: 0.8,
            light: true,
        }];
    drawCryoKnight(ctx, 0, 0, 0.95, true, "idle", 0, -0.24 + Math.sin(gt * 0.05) * 0.05, Math.sin(gt * 0.08) * 1.3, 0, 0, 0, gt * 0.08, 0.9, gt, ambFrost, cryoTrails, [], null, null);
}
export class Fighter {
    constructor(x, y, color, hpFillId, isFacingRight, isKnight, particles, damageTexts) {
        // Faction / stats fields
        this.charType = "knight";
        this.playerAtk = 1;
        this.playerDef = 1;
        this.playerSpd = 1;
        this.equippedWeaponVisual = null;
        this._castTimer = 0;
        this._circleDir = 1;
        this._assassinAttackIndex = 0;
        this.x = x;
        this.y = y;
        this.startX = x;
        this.targetX = x;
        this.color = color;
        this.hp = 1000;
        this.maxHp = 1000;
        this.hpFillId = hpFillId;
        this.isFacingRight = isFacingRight;
        this.width = 45;
        this.height = 90;
        this.fighterState = "idle";
        this.stateTimer = 0;
        this.attackCooldown = 0;
        this.hitTimer = 0;
        this.isKnight = isKnight;
        this.particles = particles;
        this.damageTexts = damageTexts;
    }
    setOpponent(opp) { this.opponent = opp; }
    // ── Faction-aware AI ────────────────────────────────────────────────────────
    updateAI(gameOver) {
        if (this.hp <= 0 || gameOver)
            return;
        if (this.attackCooldown > 0)
            this.attackCooldown--;
        if (this.stateTimer > 0)
            this.stateTimer--;
        const dist = Math.abs(this.x - this.opponent.x);
        this.isFacingRight = this.opponent.x > this.x;
        // Faction determines preferred combat range and state transitions
        switch (this.charType) {
            // ─── KNIGHT: slow, tanky, charges when ready then stands firm
            case "knight":
            case "cryo_knight":
                if (this.fighterState === "idle" && this.stateTimer <= 0) {
                    if (this.attackCooldown <= 0) {
                        this.fighterState = "charging"; // special: slow charge
                        this.stateTimer = 40;
                    }
                    else {
                        // Hold position — shuffle a little
                        this.targetX = this.startX + (Math.random() * 60 - 30);
                        this.fighterState = "retreating";
                        this.stateTimer = 20;
                    }
                }
                if (this.fighterState === "charging") {
                    this.targetX = this.isFacingRight ? this.opponent.x - 65 : this.opponent.x + 65;
                    this.x += (this.targetX - this.x) * 0.07; // slow, deliberate
                    if (dist < 90) {
                        this.performAttack();
                    }
                    if (this.stateTimer <= 0) {
                        this.fighterState = "idle";
                    }
                }
                if (this.fighterState === "attacking") {
                    this.x += this.isFacingRight ? 10 : -10;
                    if (this.stateTimer <= 0) {
                        this.fighterState = "retreating";
                        this.targetX = this.startX + (Math.random() * 80 - 40);
                        this.stateTimer = 55; // stands ground longer before next charge
                    }
                }
                break;
            // ─── SCARLET ASSASSIN: ultra-fast combo fighter with side swaps
            case "scarlet_assassin":
                if (this.fighterState === "idle" && this.stateTimer <= 0) {
                    if (this.attackCooldown <= 0) {
                        this.fighterState = "moving";
                    }
                    else {
                        this._circleDir *= Math.random() < 0.12 ? -1 : 1;
                        this.targetX = this.opponent.x + this._circleDir * (95 + Math.random() * 45);
                        this.fighterState = "circling";
                        this.stateTimer = 16;
                    }
                }
                if (this.fighterState === "circling") {
                    this.x += (this.targetX - this.x) * 0.24;
                    if (this.stateTimer <= 0)
                        this.fighterState = "idle";
                }
                if (this.fighterState === "moving") {
                    this.targetX = this.isFacingRight ? this.opponent.x - 44 : this.opponent.x + 44;
                    this.x += (this.targetX - this.x) * 0.28;
                    if (dist < 72) {
                        this.performAttack();
                        this.targetX = this.isFacingRight ? this.opponent.x + 130 : this.opponent.x - 130;
                    }
                }
                if (this.fighterState === "attacking") {
                    this.x += this.isFacingRight ? 20 : -20;
                    if (this.stateTimer <= 0) {
                        this.fighterState = "retreating";
                        this.targetX = this.x + (this.isFacingRight ? 95 : -95);
                        this.stateTimer = 20;
                    }
                }
                break;
            // ─── MAGE: keeps distance, channels, then fires a burst
            case "mage":
                if (this.fighterState === "idle" && this.stateTimer <= 0) {
                    if (dist < 180) {
                        // Too close — back away
                        this.targetX = this.isFacingRight
                            ? this.opponent.x - 250
                            : this.opponent.x + 250;
                        this.fighterState = "retreating";
                        this.stateTimer = 35;
                    }
                    else if (this.attackCooldown <= 0) {
                        this.fighterState = "casting";
                        this._castTimer = 30;
                        this.stateTimer = 30;
                    }
                    else {
                        this.fighterState = "idle";
                        this.stateTimer = 15;
                    }
                }
                if (this.fighterState === "retreating") {
                    this.x += (this.targetX - this.x) * 0.08;
                    if (this.stateTimer <= 0)
                        this.fighterState = "idle";
                }
                if (this.fighterState === "casting") {
                    // Stand still while channeling
                    if (this._castTimer > 0) {
                        this._castTimer--;
                    }
                    else if (this.stateTimer <= 0) {
                        // Release spell: 2 rapid hits
                        this.performAttack();
                        setTimeout(() => { if (this.hp > 0)
                            this.performAttack(); }, 180);
                        this.fighterState = "retreating";
                        this.targetX = this.isFacingRight
                            ? this.opponent.x - 260
                            : this.opponent.x + 260;
                        this.stateTimer = 50;
                    }
                }
                if (this.fighterState === "attacking") {
                    // Mage doesn't lunge — just glows; handled in performAttack
                    if (this.stateTimer <= 0)
                        this.fighterState = "idle";
                }
                break;
            // ─── NECROMANCER: ranged caster with life siphon
            case "necromancer":
                if (this.fighterState === "idle" && this.stateTimer <= 0) {
                    if (dist < 210) {
                        this.targetX = this.isFacingRight ? this.opponent.x - 285 : this.opponent.x + 285;
                        this.fighterState = "retreating";
                        this.stateTimer = 32;
                    }
                    else if (this.attackCooldown <= 0) {
                        this.fighterState = "casting";
                        this._castTimer = 38;
                        this.stateTimer = 38;
                    }
                    else {
                        this.fighterState = "idle";
                        this.stateTimer = 14;
                    }
                }
                if (this.fighterState === "retreating") {
                    this.x += (this.targetX - this.x) * 0.07;
                    if (this.stateTimer <= 0)
                        this.fighterState = "idle";
                }
                if (this.fighterState === "casting") {
                    if (this._castTimer > 0) {
                        this._castTimer--;
                    }
                    else if (this.stateTimer <= 0) {
                        this.performAttack();
                        if (Math.random() < 0.42) {
                            setTimeout(() => { if (this.hp > 0)
                                this.performAttack(); }, 230);
                        }
                        this.fighterState = "retreating";
                        this.targetX = this.isFacingRight ? this.opponent.x - 305 : this.opponent.x + 305;
                        this.stateTimer = 45;
                    }
                }
                if (this.fighterState === "attacking" && this.stateTimer <= 0) {
                    this.fighterState = "idle";
                }
                break;
            // ─── BERSERKER: frontal pressure, gains momentum at low HP
            case "berserker": {
                const frenzy = this.hp < this.maxHp * 0.45 ? 1.28 : 1;
                if (this.fighterState === "idle" && this.stateTimer <= 0) {
                    if (this.attackCooldown <= 0) {
                        this.fighterState = "moving";
                    }
                    else {
                        this.fighterState = "retreating";
                        this.targetX = this.startX + (Math.random() * 70 - 35);
                        this.stateTimer = 14;
                    }
                }
                if (this.fighterState === "moving") {
                    this.targetX = this.isFacingRight ? this.opponent.x - 70 : this.opponent.x + 70;
                    this.x += (this.targetX - this.x) * (0.18 * frenzy);
                    if (dist < 105)
                        this.performAttack();
                }
                if (this.fighterState === "attacking") {
                    this.x += this.isFacingRight ? 16 * frenzy : -16 * frenzy;
                    if (this.stateTimer <= 0) {
                        this.fighterState = "retreating";
                        this.targetX = this.startX;
                        this.stateTimer = 20;
                    }
                }
                break;
            }
            // ─── GOBLIN: evasive skirmisher with quick pokes
            case "goblin":
                if (this.fighterState === "idle" && this.stateTimer <= 0) {
                    if (this.attackCooldown <= 0) {
                        this.fighterState = "moving";
                    }
                    else {
                        this._circleDir *= Math.random() < 0.16 ? -1 : 1;
                        this.targetX = this.opponent.x + this._circleDir * (78 + Math.random() * 35);
                        this.fighterState = "circling";
                        this.stateTimer = 14;
                    }
                }
                if (this.fighterState === "circling") {
                    this.x += (this.targetX - this.x) * 0.22;
                    if (this.stateTimer <= 0)
                        this.fighterState = "idle";
                }
                if (this.fighterState === "moving") {
                    this.targetX = this.isFacingRight ? this.opponent.x - 42 : this.opponent.x + 42;
                    this.x += (this.targetX - this.x) * 0.26;
                    if (dist < 70) {
                        this.performAttack();
                        this.targetX = this.isFacingRight ? this.opponent.x + 95 : this.opponent.x - 95;
                    }
                }
                if (this.fighterState === "attacking") {
                    this.x += this.isFacingRight ? 14 : -14;
                    if (this.stateTimer <= 0) {
                        this.fighterState = "retreating";
                        this.targetX = this.startX + (Math.random() * 110 - 55);
                        this.stateTimer = 16;
                    }
                }
                break;
            // ─── Fallback: aggressive melee
            default:
                if (this.fighterState === "idle" && this.stateTimer <= 0) {
                    if (this.attackCooldown <= 0) {
                        this.fighterState = "moving";
                    }
                    else {
                        this.fighterState = "retreating";
                        this.targetX = this.startX + (Math.random() * 80 - 40);
                        this.stateTimer = 18; // short idle — aggressive
                    }
                }
                if (this.fighterState === "moving") {
                    this.targetX = this.isFacingRight ? this.opponent.x - 80 : this.opponent.x + 80;
                    this.x += (this.targetX - this.x) * 0.14;
                    if (dist < 100) {
                        this.performAttack();
                    }
                }
                if (this.fighterState === "attacking") {
                    this.x += this.isFacingRight ? 14 : -14;
                    if (this.stateTimer <= 0) {
                        this.fighterState = "retreating";
                        this.targetX = this.startX;
                        this.stateTimer = 28;
                    }
                }
                break;
        }
        if (this.fighterState === "retreating") {
            this.x += (this.targetX - this.x) * 0.05;
            if (this.stateTimer <= 0)
                this.fighterState = "idle";
        }
        // Clamp to arena
        this.x = Math.max(50, Math.min(850, this.x));
    }
    performAttack() {
        this.fighterState = "attacking";
        this.stateTimer = 12;
        const isMage = this.charType === "mage";
        const isScarletAssassin = this.charType === "scarlet_assassin";
        const isNecromancer = this.charType === "necromancer";
        const isBerserker = this.charType === "berserker";
        const isGoblin = this.charType === "goblin";
        const assassinAttack = isScarletAssassin ? this._assassinAttackIndex : -1;
        if (isScarletAssassin) {
            this._assassinAttackIndex = (this._assassinAttackIndex + 1) % 3;
            if (assassinAttack === 0)
                this.stateTimer = 10;
            else if (assassinAttack === 1)
                this.stateTimer = 14;
            else
                this.stateTimer = 18;
        }
        let baseCd = 85;
        if (isMage)
            baseCd = 110;
        else if (isNecromancer)
            baseCd = 124;
        else if (isScarletAssassin)
            baseCd = assassinAttack === 0 ? 44 : assassinAttack === 1 ? 56 : 70;
        else if (isGoblin)
            baseCd = 50;
        else if (isBerserker)
            baseCd = 72;
        this.attackCooldown = Math.max(16, baseCd - (this.playerSpd - 1) * 4) + Math.random() * 22;
        let delay = 80;
        if (isMage)
            delay = 220;
        else if (isNecromancer)
            delay = 250;
        else if (isScarletAssassin)
            delay = assassinAttack === 2 ? 130 : 60;
        else if (isGoblin)
            delay = 45;
        setTimeout(() => {
            if (this.hp <= 0)
                return;
            const range = isMage
                ? 320
                : isNecromancer
                    ? 360
                    : isScarletAssassin
                        ? assassinAttack === 2 ? 175 : 130
                        : isBerserker
                            ? 150
                            : isGoblin
                                ? 112
                                : 130;
            if (Math.abs(this.x - this.opponent.x) > range)
                return;
            let baseMin = 55;
            let baseMax = 110;
            if (isMage) {
                baseMin = 35;
                baseMax = 55;
            }
            else if (isNecromancer) {
                baseMin = 40;
                baseMax = 68;
            }
            else if (isScarletAssassin) {
                if (assassinAttack === 0) {
                    baseMin = 46;
                    baseMax = 66;
                }
                else if (assassinAttack === 1) {
                    baseMin = 33;
                    baseMax = 52;
                }
                else {
                    baseMin = 60;
                    baseMax = 86;
                }
            }
            else if (isBerserker) {
                baseMin = 72;
                baseMax = 126;
            }
            else if (isGoblin) {
                baseMin = 30;
                baseMax = 50;
            }
            const base = baseMin + Math.random() * (baseMax - baseMin);
            const dmg = Math.floor(base * (1 + (this.playerAtk - 1) * 0.18));
            const strikeColor = isScarletAssassin
                ? (assassinAttack === 2 ? "#ff2238" : "#ff5d67")
                : isNecromancer
                    ? "#b58dff"
                    : this.color;
            this.opponent.takeDamage(dmg, strikeColor);
            if (isMage) {
                for (let i = 0; i < 18; i++) {
                    this.particles.push(new Particle(this.opponent.x, this.opponent.y - 60, this.color, 2.0));
                }
            }
            if (isNecromancer) {
                for (let i = 0; i < 22; i++) {
                    this.particles.push(new Particle(this.opponent.x, this.opponent.y - 58, "#b58dff", 2.1));
                }
                const siphon = Math.max(4, Math.floor(dmg * 0.14));
                this.hp = Math.min(this.maxHp, this.hp + siphon);
                const ownFill = document.getElementById(this.hpFillId);
                if (ownFill)
                    ownFill.style.width = (this.hp / this.maxHp) * 100 + "%";
            }
            if (isScarletAssassin) {
                const burst = assassinAttack === 2 ? 28 : 18;
                const scale = assassinAttack === 2 ? 2.5 : 1.9;
                for (let i = 0; i < burst; i++) {
                    this.particles.push(new Particle(this.opponent.x, this.opponent.y - 56, strikeColor, scale));
                }
                if (assassinAttack === 1) {
                    setTimeout(() => {
                        if (this.hp <= 0)
                            return;
                        if (Math.abs(this.x - this.opponent.x) > 140)
                            return;
                        const followBase = 24 + Math.random() * 18;
                        const followDmg = Math.floor(followBase * (1 + (this.playerAtk - 1) * 0.16));
                        this.opponent.takeDamage(followDmg, "#ff6d7e");
                        for (let i = 0; i < 14; i++) {
                            this.particles.push(new Particle(this.opponent.x, this.opponent.y - 55, "#ff6d7e", 1.6));
                        }
                    }, 120);
                }
            }
            if (isBerserker && Math.random() < 0.34) {
                setTimeout(() => {
                    if (this.hp <= 0)
                        return;
                    if (Math.abs(this.x - this.opponent.x) > 160)
                        return;
                    const bonus = Math.floor((26 + Math.random() * 28) * (1 + (this.playerAtk - 1) * 0.12));
                    this.opponent.takeDamage(bonus, "#ff9830");
                    for (let i = 0; i < 16; i++) {
                        this.particles.push(new Particle(this.opponent.x, this.opponent.y - 50, "#ff9830", 2.1));
                    }
                }, 160);
            }
            if (isGoblin && Math.random() < 0.3) {
                setTimeout(() => {
                    if (this.hp <= 0)
                        return;
                    if (Math.abs(this.x - this.opponent.x) > 150)
                        return;
                    const bleed = Math.max(8, Math.floor((10 + Math.random() * 10) * (1 + (this.playerAtk - 1) * 0.08)));
                    this.opponent.takeDamage(bleed, "#8dff5e");
                    for (let i = 0; i < 10; i++) {
                        this.particles.push(new Particle(this.opponent.x, this.opponent.y - 52, "#8dff5e", 1.3));
                    }
                }, 260);
            }
        }, delay);
    }
    takeDamage(amount, attackerColor) {
        const reduced = Math.max(1, Math.floor(amount - (this.playerDef - 1) * 2.0));
        this.hp = Math.max(0, this.hp - reduced);
        this.hitTimer = 15;
        state.screenShake = 12;
        this.damageTexts.push(new DamageText(this.x, this.y - this.height, reduced, "#fff"));
        for (let i = 0; i < 25; i++)
            this.particles.push(new Particle(this.x, this.y - this.height / 2, attackerColor, 1.6));
        for (let i = 0; i < 12; i++)
            this.particles.push(new Particle(this.x, this.y - this.height / 2, "#ffffff", 2.1));
        const fill = document.getElementById(this.hpFillId);
        if (fill)
            fill.style.width = (this.hp / this.maxHp) * 100 + "%";
    }
    draw(ctx, gameTime) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(this.x, this.y);
        const attacking = this.fighterState === "attacking" || this.fighterState === "charging";
        const moving = this.fighterState === "moving" || this.fighterState === "circling";
        const casting = this.fighterState === "casting";
        let tilt = 0;
        if (moving)
            tilt = this.isFacingRight ? 0.12 : -0.12;
        if (attacking)
            tilt = this.isFacingRight ? 0.30 : -0.30;
        if (casting)
            tilt = 0; // mage stands upright while casting
        ctx.rotate(tilt);
        if (!this.isFacingRight)
            ctx.scale(-1, 1);
        const flash = this.hitTimer > 0;
        if (this.hitTimer > 0)
            this.hitTimer--;
        ctx.shadowBlur = flash ? 50 : (attacking ? 28 : casting ? 40 : 12);
        ctx.shadowColor = flash ? "#fff" : this.color;
        const legSwing = (moving || attacking) ? Math.sin(gameTime * 0.45) * 11 : 0;
        const isMage = this.charType === "mage";
        const isScarletAssassin = this.charType === "scarlet_assassin";
        const isNecromancer = this.charType === "necromancer";
        const isBerserker = this.charType === "berserker";
        const isGoblin = this.charType === "goblin";
        if (isMage) {
            this.drawMage(ctx, gameTime, flash, legSwing, attacking || casting);
        }
        else if (isNecromancer) {
            this.drawNecromancer(ctx, gameTime, flash, legSwing, attacking || casting);
        }
        else if (isScarletAssassin) {
            this.drawScarletAssassin(ctx, gameTime, flash, legSwing, attacking);
        }
        else if (isBerserker) {
            this.drawBerserker(ctx, gameTime, flash, legSwing, attacking);
        }
        else if (isGoblin) {
            this.drawGoblin(ctx, gameTime, flash, legSwing, attacking);
        }
        else {
            this.drawKnight(ctx, gameTime, flash, legSwing, attacking);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    fill(ctx, flash, color) {
        ctx.fillStyle = flash ? "#ffffff" : color;
    }
    // ────────────────────────────────────────────────────────── KNIGHT
    drawKnight(ctx, _gt, flash, leg, atk) {
        const C = this.color;
        // Back leg
        ctx.fillStyle = flash ? "#fff" : "#4a3060";
        ctx.fillRect(-13, -22, 11, 24 - leg);
        // Cape
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = flash ? "#fff" : "#8b1a1a";
        ctx.fillRect(-16, -56, 10, 38);
        ctx.globalAlpha = 1;
        // Torso — armor
        this.fill(ctx, flash, C);
        ctx.fillRect(-14, -60, 30, 42);
        // Chest plate detail
        if (!flash) {
            ctx.fillStyle = "#ddd";
            ctx.fillRect(-10, -56, 22, 28);
        }
        // Shoulder pads
        if (!flash) {
            ctx.fillStyle = "#ccc";
            ctx.fillRect(-18, -62, 10, 12);
            ctx.fillRect(8, -62, 10, 12);
        }
        // Head / helmet
        if (!flash) {
            ctx.fillStyle = "#f0c88a";
            ctx.fillRect(-9, -82, 18, 18);
        } // face
        this.fill(ctx, flash, C);
        ctx.fillRect(-11, -88, 22, 18); // helmet top
        if (!flash) {
            ctx.fillStyle = "#888";
            ctx.fillRect(-9, -76, 18, 8); // visor
            ctx.fillStyle = "#333";
            ctx.fillRect(-7, -74, 4, 4);
            ctx.fillRect(3, -74, 4, 4); // eye slits
        }
        // Front arm + shield
        this.fill(ctx, flash, C);
        ctx.fillRect(-24, -60, 11, 32); // shield arm
        if (!flash) {
            ctx.fillStyle = "#cc2200";
            ctx.fillRect(-28, -64, 10, 38); // shield body
            ctx.fillStyle = "#ffcc00";
            ctx.fillRect(-25, -52, 4, 4); // shield emblem
        }
        // Sword arm
        this.fill(ctx, flash, C);
        ctx.fillRect(14, -62, 11, 28);
        // Front leg
        ctx.fillStyle = flash ? "#fff" : "#4a3060";
        ctx.fillRect(2, -22, 11, 24 + leg);
        // Weapon — use equipped visual if set
        const wv = this.equippedWeaponVisual;
        if (wv === "axe")
            this.drawAxe(ctx, atk);
        else if (wv === "hammer")
            this.drawHammer(ctx, atk);
        else
            this.drawSword(ctx, atk); // default sword
    }
    // ────────────────────────────────────────────────────────── MAGE
    drawMage(ctx, gt, flash, leg, atk) {
        const C = this.color;
        const glow = Math.sin(gt * 0.08) * 0.5 + 0.5;
        // Robe back
        ctx.fillStyle = flash ? "#fff" : "#2a0d5e";
        ctx.fillRect(-14, -60, 10, 62);
        // Robe main
        this.fill(ctx, flash, C);
        ctx.fillRect(-12, -60, 26, 60);
        if (!flash) {
            // Robe trim
            ctx.fillStyle = "#c8a0ff";
            ctx.fillRect(-12, -62, 26, 4);
            ctx.fillRect(-12, -30, 26, 4);
        }
        // Back leg (robe slit)
        ctx.fillStyle = flash ? "#fff" : "#1a0840";
        ctx.fillRect(-10, -20, 9, 20 - leg);
        // Front leg
        ctx.fillStyle = flash ? "#fff" : "#1a0840";
        ctx.fillRect(2, -20, 9, 20 + leg);
        // Body under robe (belt)
        if (!flash) {
            ctx.fillStyle = "#c8a0ff";
            ctx.fillRect(-8, -42, 18, 5);
        }
        // Cloak shoulders
        this.fill(ctx, flash, C);
        ctx.fillRect(-18, -62, 8, 20);
        ctx.fillRect(12, -62, 8, 20);
        // Neck
        if (!flash) {
            ctx.fillStyle = "#f0c88a";
            ctx.fillRect(-5, -72, 11, 12);
        }
        // Head
        if (!flash) {
            ctx.fillStyle = "#f0c88a";
            ctx.fillRect(-9, -88, 18, 20);
        }
        // Hair (blonde)
        if (!flash) {
            ctx.fillStyle = "#e8c030";
            ctx.fillRect(-10, -92, 20, 10);
            ctx.fillRect(-12, -88, 6, 14);
        }
        // Eyes
        if (!flash) {
            ctx.fillStyle = "#2020a0";
            ctx.fillRect(-6, -82, 4, 4);
            ctx.fillRect(2, -82, 4, 4);
        }
        // Hood / hat
        this.fill(ctx, flash, C);
        ctx.fillRect(-10, -96, 20, 10);
        // Staff arm
        this.fill(ctx, flash, C);
        ctx.fillRect(-20, -62, 9, 30);
        // Staff
        if (!flash) {
            ctx.fillStyle = "#8b5c20";
            ctx.fillRect(-26, -100, 5, 80);
        }
        // Orb glow
        if (!flash) {
            ctx.shadowBlur = 20 + glow * 20;
            ctx.shadowColor = C;
            ctx.fillStyle = flash ? "#fff" : `rgba(${this.color === "#00e5ff" ? "0,200,255" : this.color === "#00ff88" ? "0,255,136" : "187,68,255"},${0.8 + glow * 0.2})`;
            ctx.beginPath();
            ctx.arc(-24, -105, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        // Cast hand glow on attack
        if (atk && !flash) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = C;
            ctx.fillStyle = C;
            ctx.beginPath();
            ctx.arc(18, -50, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        else {
            this.fill(ctx, flash, C);
            ctx.fillRect(14, -58, 9, 22);
        }
    }
    // ────────────────────────────────────────────────────────── TROLL
    drawTroll(ctx, _gt, flash, leg, atk) {
        const C = this.color;
        // Back leg
        ctx.fillStyle = flash ? "#fff" : "#3d5c1a";
        ctx.fillRect(-16, -28, 14, 28 - leg);
        // Body (big & stocky)
        this.fill(ctx, flash, C);
        ctx.fillRect(-22, -74, 46, 52);
        if (!flash) {
            // Leather loincloth
            ctx.fillStyle = "#6b3a10";
            ctx.fillRect(-20, -30, 42, 14);
            // Muscle definition
            ctx.fillStyle = "rgba(0,0,0,0.15)";
            ctx.fillRect(-10, -70, 8, 30);
            ctx.fillRect(4, -70, 8, 30);
            // Shoulder armor
            ctx.fillStyle = "#888";
            ctx.fillRect(-26, -76, 14, 14);
            ctx.fillRect(14, -76, 14, 14);
        }
        // Head (bigger, brutish)
        this.fill(ctx, flash, C);
        ctx.fillRect(-16, -100, 34, 30);
        if (!flash) {
            // Tusks
            ctx.fillStyle = "#fffde0";
            ctx.fillRect(-14, -76, 5, 10);
            ctx.fillRect(11, -76, 5, 10);
            // Eyes (red beady)
            ctx.fillStyle = "#cc0000";
            ctx.fillRect(-10, -92, 6, 6);
            ctx.fillRect(6, -92, 6, 6);
            ctx.fillStyle = "#330000";
            ctx.fillRect(-8, -91, 3, 3);
            ctx.fillRect(8, -91, 3, 3);
            // Nose
            ctx.fillStyle = "#2d5010";
            ctx.fillRect(-4, -84, 8, 6);
            // Horns
            ctx.fillStyle = "#4a3010";
            ctx.beginPath();
            ctx.moveTo(-12, -100);
            ctx.lineTo(-18, -118);
            ctx.lineTo(-5, -100);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(14, -100);
            ctx.lineTo(20, -118);
            ctx.lineTo(8, -100);
            ctx.fill();
        }
        // Arms
        this.fill(ctx, flash, C);
        ctx.fillRect(-36, -72, 16, 40); // back arm
        ctx.fillRect(22, -72, 16, 40); // front arm
        // Front leg
        ctx.fillStyle = flash ? "#fff" : "#3d5c1a";
        ctx.fillRect(4, -28, 14, 28 + leg);
        // Axe
        this.drawAxe(ctx, atk);
    }
    // ────────────────────────────────────────────────────────── SCARLET ASSASSIN
    drawScarletAssassin(ctx, gt, flash, leg, atk) {
        const C = this.color;
        const pulse = Math.sin(gt * 0.24) * 0.5 + 0.5;
        const scarfWave = Math.sin(gt * 0.36) * 4.8;
        const dash = atk ? Math.sin(gt * 1.3) * 5.4 : 0;
        if (!flash) {
            const aura = ctx.createRadialGradient(0, -60, 6, 0, -60, 36 + pulse * 10);
            aura.addColorStop(0, `rgba(255,70,100,${0.2 + pulse * 0.16})`);
            aura.addColorStop(1, "rgba(255,15,40,0)");
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(0, -60, 36 + pulse * 10, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = flash ? "#fff" : "#25040a";
        ctx.fillRect(-11, -22, 8, 22 - leg * 0.45);
        ctx.globalAlpha = flash ? 1 : 0.86;
        ctx.fillStyle = flash ? "#fff" : "#4b0611";
        ctx.beginPath();
        ctx.moveTo(-14, -71);
        ctx.quadraticCurveTo(-32 + scarfWave * 0.7, -30, -17, 1);
        ctx.lineTo(-8, -2);
        ctx.quadraticCurveTo(-8, -38, -6, -67);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        const torso = ctx.createLinearGradient(0, -70, 0, -20);
        torso.addColorStop(0, flash ? "#fff" : "#ff3348");
        torso.addColorStop(0.6, flash ? "#fff" : C);
        torso.addColorStop(1, flash ? "#fff" : "#680f1c");
        ctx.fillStyle = torso;
        ctx.fillRect(-12, -66, 24, 44);
        if (!flash) {
            ctx.fillStyle = "rgba(255,190,190,0.2)";
            ctx.fillRect(-6, -63, 2, 31);
            ctx.fillRect(4, -63, 2, 31);
            ctx.fillStyle = "#3f0710";
            ctx.fillRect(-8, -54, 16, 18);
        }
        ctx.fillStyle = flash ? "#fff" : "#25040a";
        ctx.fillRect(3, -22, 8, 22 + leg * 0.45);
        this.fill(ctx, flash, C);
        ctx.beginPath();
        ctx.moveTo(-13, -86);
        ctx.lineTo(0, -103);
        ctx.lineTo(13, -86);
        ctx.lineTo(9, -68);
        ctx.lineTo(-9, -68);
        ctx.closePath();
        ctx.fill();
        if (!flash) {
            ctx.fillStyle = "#1f2028";
            ctx.fillRect(-8, -80, 16, 10);
            ctx.fillStyle = `rgba(255,85,105,${0.72 + pulse * 0.28})`;
            ctx.fillRect(-5, -77, 3, 3);
            ctx.fillRect(2, -77, 3, 3);
        }
        this.fill(ctx, flash, C);
        ctx.fillRect(-22, -64, 8, 29);
        ctx.fillRect(14, -64, 8, 29);
        const slashRot = atk ? -Math.PI * 0.95 + Math.sin(gt * 1.1) * 0.12 : -Math.PI * 0.2;
        this.drawDagger(ctx, 22 + dash * 0.14, -40, slashRot);
        this.drawDagger(ctx, -22 - dash * 0.12, -38, -slashRot * 0.86);
        if (atk && !flash) {
            ctx.strokeStyle = `rgba(255,95,120,${0.35 + pulse * 0.3})`;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(22, -42, 17, -Math.PI * 0.95, -Math.PI * 0.35);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(-21, -40, 14, Math.PI * 1.25, Math.PI * 1.85);
            ctx.stroke();
        }
    }
    // ────────────────────────────────────────────────────────── NECROMANCER
    drawNecromancer(ctx, gt, flash, leg, atk) {
        const C = this.color;
        const pulse = Math.sin(gt * 0.13) * 0.5 + 0.5;
        const robeWave = Math.sin(gt * 0.16) * 3.2;
        if (!flash) {
            const aura = ctx.createRadialGradient(0, -72, 6, 0, -72, 52 + pulse * 10);
            aura.addColorStop(0, `rgba(172,122,255,${0.2 + pulse * 0.16})`);
            aura.addColorStop(1, "rgba(116,72,190,0)");
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(0, -72, 52 + pulse * 10, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = flash ? "#fff" : "#140a1f";
        ctx.fillRect(-12, -22, 9, 22 - leg * 0.25);
        ctx.fillStyle = flash ? "#fff" : "#0b0714";
        ctx.beginPath();
        ctx.moveTo(-18, -71);
        ctx.quadraticCurveTo(-37 + robeWave * 0.5, -30, -19, 2);
        ctx.lineTo(-8, -2);
        ctx.quadraticCurveTo(-10, -38, -8, -69);
        ctx.closePath();
        ctx.fill();
        const robe = ctx.createLinearGradient(0, -74, 0, 2);
        robe.addColorStop(0, flash ? "#fff" : "#3a1d62");
        robe.addColorStop(0.55, flash ? "#fff" : C);
        robe.addColorStop(1, flash ? "#fff" : "#1a0d30");
        ctx.fillStyle = robe;
        ctx.fillRect(-13, -70, 26, 70);
        if (!flash) {
            ctx.fillStyle = "#27113f";
            ctx.fillRect(-13, -68, 26, 3);
            ctx.fillRect(-13, -36, 26, 3);
            ctx.strokeStyle = "rgba(182,154,255,0.4)";
            ctx.lineWidth = 0.8;
            for (let i = 0; i < 3; i++) {
                const y = -58 + i * 10;
                ctx.beginPath();
                ctx.moveTo(-8, y);
                ctx.quadraticCurveTo(0, y + 4, 8, y);
                ctx.stroke();
            }
        }
        ctx.fillStyle = flash ? "#fff" : "#140a1f";
        ctx.fillRect(3, -22, 9, 22 + leg * 0.25);
        this.fill(ctx, flash, C);
        ctx.beginPath();
        ctx.moveTo(-12, -99);
        ctx.lineTo(0, -115);
        ctx.lineTo(12, -99);
        ctx.lineTo(9, -88);
        ctx.lineTo(-9, -88);
        ctx.closePath();
        ctx.fill();
        if (!flash) {
            ctx.fillStyle = "#efe7d2";
            ctx.fillRect(-8, -88, 16, 18);
            ctx.fillStyle = "#181824";
            ctx.fillRect(-5, -84, 3, 3);
            ctx.fillRect(2, -84, 3, 3);
            ctx.fillStyle = "#d9cfb8";
            ctx.fillRect(-1, -80, 2, 4);
        }
        this.fill(ctx, flash, C);
        ctx.fillRect(-24, -68, 9, 30);
        this.drawScythe(ctx, atk, pulse);
        this.fill(ctx, flash, C);
        ctx.fillRect(15, -64, 9, 25);
        if (!flash) {
            ctx.shadowBlur = 18 + pulse * 12;
            ctx.shadowColor = "#b58dff";
            ctx.fillStyle = `rgba(181,141,255,${0.42 + pulse * 0.35})`;
            ctx.beginPath();
            ctx.arc(20, -52, 8 + pulse * 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            for (let i = 0; i < 3; i++) {
                const phase = gt * (0.15 + i * 0.03) + i * 2.2;
                const rx = 10 + i * 3;
                const ry = 6 + i * 2;
                ctx.strokeStyle = `rgba(206,182,255,${0.26 + pulse * 0.2})`;
                ctx.lineWidth = 0.9;
                ctx.beginPath();
                ctx.ellipse(20, -52, rx, ry, phase, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        if (atk && !flash) {
            ctx.strokeStyle = `rgba(202,170,255,${0.38 + pulse * 0.25})`;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(20, -52, 18 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    // ────────────────────────────────────────────────────────── BERSERKER
    drawBerserker(ctx, gt, flash, leg, atk) {
        const C = this.color;
        const rage = this.hp < this.maxHp * 0.45 ? 1 : 0;
        const ragePulse = Math.sin(gt * 0.25) * 0.5 + 0.5;
        if (rage > 0 && !flash) {
            const aura = ctx.createRadialGradient(0, -60, 8, 0, -60, 54 + ragePulse * 12);
            aura.addColorStop(0, `rgba(255,145,62,${0.22 + ragePulse * 0.16})`);
            aura.addColorStop(1, "rgba(255,75,22,0)");
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(0, -60, 54 + ragePulse * 12, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = flash ? "#fff" : "#4a220e";
        ctx.fillRect(-14, -26, 12, 26 - leg * 0.3);
        if (!flash) {
            ctx.fillStyle = "#311d12";
            ctx.fillRect(-30, -36, 60, 14);
            ctx.fillStyle = "#be9558";
            ctx.fillRect(-28, -36, 8, 14);
            ctx.fillRect(20, -36, 8, 14);
        }
        const torso = ctx.createLinearGradient(0, -84, 0, -28);
        torso.addColorStop(0, flash ? "#fff" : "#ea8a2a");
        torso.addColorStop(0.55, flash ? "#fff" : C);
        torso.addColorStop(1, flash ? "#fff" : "#703512");
        ctx.fillStyle = torso;
        ctx.fillRect(-24, -82, 48, 52);
        if (!flash) {
            ctx.fillStyle = "#7b3d16";
            ctx.fillRect(-9, -82, 18, 24);
            ctx.fillStyle = "rgba(255,208,130,0.2)";
            ctx.fillRect(-7, -80, 3, 18);
            ctx.fillRect(4, -80, 3, 18);
            ctx.strokeStyle = "rgba(90,38,14,0.75)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-20, -52);
            ctx.lineTo(-12, -44);
            ctx.lineTo(-3, -53);
            ctx.moveTo(4, -51);
            ctx.lineTo(12, -45);
            ctx.lineTo(18, -54);
            ctx.stroke();
        }
        ctx.fillStyle = flash ? "#fff" : "#4a220e";
        ctx.fillRect(2, -26, 12, 26 + leg * 0.3);
        if (!flash) {
            ctx.fillStyle = "#f0c694";
            ctx.fillRect(-14, -102, 28, 22);
            ctx.fillStyle = "#2f1a11";
            ctx.fillRect(-9, -95, 4, 4);
            ctx.fillRect(5, -95, 4, 4);
            ctx.fillStyle = "#7f3514";
            ctx.beginPath();
            ctx.moveTo(-10, -104);
            ctx.lineTo(-20, -122);
            ctx.lineTo(-2, -104);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(10, -104);
            ctx.lineTo(20, -122);
            ctx.lineTo(2, -104);
            ctx.closePath();
            ctx.fill();
        }
        this.fill(ctx, flash, C);
        ctx.fillRect(-38, -80, 14, 44);
        ctx.fillRect(24, -80, 14, 44);
        this.drawWarAxe(ctx, atk, rage > 0 ? ragePulse : 0);
        if (atk && !flash) {
            ctx.strokeStyle = `rgba(255,165,70,${0.28 + ragePulse * 0.3})`;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(31, -61, 24, -Math.PI * 0.9, -Math.PI * 0.1);
            ctx.stroke();
        }
    }
    // ────────────────────────────────────────────────────────── GOBLIN
    drawGoblin(ctx, gt, flash, leg, atk) {
        const C = this.color;
        const pulse = Math.sin(gt * 0.27) * 0.5 + 0.5;
        const jitter = Math.sin(gt * 0.55) * 1.4;
        ctx.save();
        ctx.translate(0, jitter * 0.22);
        ctx.fillStyle = flash ? "#fff" : "#204214";
        ctx.fillRect(-10, -18, 7, 18 - leg * 0.4);
        if (!flash) {
            ctx.fillStyle = "#4b2a12";
            ctx.fillRect(-11, -28, 22, 10);
        }
        const skin = ctx.createLinearGradient(0, -90, 0, -22);
        skin.addColorStop(0, flash ? "#fff" : "#8be055");
        skin.addColorStop(0.65, flash ? "#fff" : C);
        skin.addColorStop(1, flash ? "#fff" : "#2e651d");
        ctx.fillStyle = skin;
        ctx.fillRect(-13, -64, 26, 40);
        ctx.fillStyle = flash ? "#fff" : "#204214";
        ctx.fillRect(3, -18, 7, 18 + leg * 0.4);
        this.fill(ctx, flash, C);
        ctx.fillRect(-10, -88, 20, 22);
        ctx.beginPath();
        ctx.moveTo(-10, -84);
        ctx.lineTo(-22, -74 + jitter * 0.2);
        ctx.lineTo(-10, -71);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, -84);
        ctx.lineTo(22, -74 - jitter * 0.2);
        ctx.lineTo(10, -71);
        ctx.closePath();
        ctx.fill();
        if (!flash) {
            ctx.fillStyle = `rgba(255,60,30,${0.7 + pulse * 0.3})`;
            ctx.fillRect(-5, -81, 3, 3);
            ctx.fillRect(2, -81, 3, 3);
            ctx.fillStyle = "#0d1a0a";
            ctx.fillRect(-3, -79, 2, 2);
            ctx.fillRect(4, -79, 2, 2);
            ctx.fillStyle = "#d7e6b0";
            ctx.fillRect(-8, -73, 3, 6);
            ctx.fillRect(5, -73, 3, 6);
            ctx.fillStyle = "#13210f";
            ctx.fillRect(-4, -74, 8, 2);
        }
        this.fill(ctx, flash, C);
        ctx.fillRect(-20, -62, 8, 25);
        ctx.fillRect(12, -62, 8, 25);
        if (!flash) {
            const vial = ctx.createRadialGradient(-20, -43, 1, -20, -43, 8 + pulse * 3);
            vial.addColorStop(0, "rgba(210,255,140,0.92)");
            vial.addColorStop(1, "rgba(110,220,70,0)");
            ctx.fillStyle = vial;
            ctx.beginPath();
            ctx.arc(-20, -43, 8 + pulse * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        this.drawDagger(ctx, 20, -40, atk ? -Math.PI * 0.9 + Math.sin(gt * 1.3) * 0.1 : -Math.PI * 0.2);
        if (atk && !flash) {
            ctx.strokeStyle = `rgba(160,255,110,${0.35 + pulse * 0.25})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(20, -42, 13, -Math.PI * 0.95, -Math.PI * 0.2);
            ctx.stroke();
        }
        ctx.restore();
    }
    drawDagger(ctx, x, y, rot) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = "#6f4622";
        ctx.fillRect(-2, 6, 4, 12);
        ctx.fillStyle = "#cc9900";
        ctx.fillRect(-5, 4, 10, 3);
        const blade = ctx.createLinearGradient(0, -16, 0, 5);
        blade.addColorStop(0, "#eef1fb");
        blade.addColorStop(0.55, "#ccd4ea");
        blade.addColorStop(1, "#a9b2ca");
        ctx.fillStyle = blade;
        ctx.beginPath();
        ctx.moveTo(-2, -16);
        ctx.lineTo(2, -16);
        ctx.lineTo(4, 4);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, -14, 1, 16);
        ctx.restore();
    }
    drawScythe(ctx, atk, pulse) {
        ctx.save();
        ctx.translate(-28, -62);
        ctx.rotate(atk ? -Math.PI * 0.44 : -Math.PI * 0.08);
        const shaft = ctx.createLinearGradient(0, -52, 0, 12);
        shaft.addColorStop(0, "#7a5634");
        shaft.addColorStop(1, "#4a2f1c");
        ctx.fillStyle = shaft;
        ctx.fillRect(-2, -52, 4, 64);
        const blade = ctx.createLinearGradient(4, -52, 38, -28);
        blade.addColorStop(0, "#9ca4bb");
        blade.addColorStop(0.6, "#dfe5f6");
        blade.addColorStop(1, "#7a829a");
        ctx.fillStyle = blade;
        ctx.beginPath();
        ctx.moveTo(1, -50);
        ctx.quadraticCurveTo(30, -60, 37, -38);
        ctx.quadraticCurveTo(22, -29, 5, -34);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = `rgba(198,170,255,${0.55 + pulse * 0.35})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(5, -41);
        ctx.quadraticCurveTo(20, -49, 31, -41);
        ctx.stroke();
        ctx.fillStyle = `rgba(185,150,255,${0.16 + pulse * 0.16})`;
        ctx.beginPath();
        ctx.arc(1, -43, 4 + pulse * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    drawWarAxe(ctx, atk, ragePulse) {
        ctx.save();
        ctx.translate(30, -61);
        ctx.rotate(atk ? -Math.PI * 0.72 : Math.PI * 0.06);
        const shaft = ctx.createLinearGradient(0, -10, 0, 55);
        shaft.addColorStop(0, "#7c4a20");
        shaft.addColorStop(1, "#522a0e");
        ctx.fillStyle = shaft;
        ctx.fillRect(-3, -11, 7, 66);
        const head = ctx.createLinearGradient(2, -36, 40, -10);
        head.addColorStop(0, "#878da2");
        head.addColorStop(0.55, "#cfd7ef");
        head.addColorStop(1, "#6f7690");
        ctx.fillStyle = head;
        ctx.beginPath();
        ctx.moveTo(4, -33);
        ctx.lineTo(32, -45);
        ctx.lineTo(37, -18);
        ctx.lineTo(4, -7);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#e8eefc";
        ctx.beginPath();
        ctx.moveTo(30, -47);
        ctx.lineTo(42, -50);
        ctx.lineTo(42, -12);
        ctx.lineTo(30, -10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = `rgba(255,155,80,${0.2 + ragePulse * 0.35})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(8, -30);
        ctx.lineTo(27, -23);
        ctx.moveTo(10, -22);
        ctx.lineTo(26, -16);
        ctx.stroke();
        ctx.restore();
    }
    drawSword(ctx, atk) {
        ctx.save();
        ctx.translate(22, -55);
        ctx.rotate(atk ? -Math.PI * 0.55 : -Math.PI * 0.15);
        // Handle
        ctx.fillStyle = "#7a4010";
        ctx.fillRect(-3, 12, 6, 18);
        // Guard
        ctx.fillStyle = "#cc9900";
        ctx.fillRect(-9, 6, 18, 6);
        // Pommel
        ctx.fillStyle = "#cc9900";
        ctx.fillRect(-4, 28, 8, 6);
        // Blade
        ctx.fillStyle = "#d8d8e8";
        ctx.beginPath();
        ctx.moveTo(-3, -38);
        ctx.lineTo(3, -38);
        ctx.lineTo(5, 8);
        ctx.lineTo(-5, 8);
        ctx.closePath();
        ctx.fill();
        // Blade edge shine
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-1, -36, 2, 40);
        ctx.restore();
    }
    drawHammer(ctx, atk) {
        ctx.save();
        ctx.translate(24, -58);
        ctx.rotate(atk ? -Math.PI * 0.6 : 0);
        // Handle
        ctx.fillStyle = "#5c2e08";
        ctx.fillRect(-3, -6, 6, 60);
        // Head left
        ctx.fillStyle = "#8a8aaa";
        ctx.fillRect(-14, -34, 30, 20);
        // Head top / edge
        ctx.fillStyle = "#b0b0cc";
        ctx.fillRect(-12, -38, 26, 8);
        // Bolts
        ctx.fillStyle = "#ffcc00";
        ctx.fillRect(-10, -30, 5, 5);
        ctx.fillRect(7, -30, 5, 5);
        ctx.restore();
    }
    drawAxe(ctx, atk) {
        ctx.save();
        ctx.translate(30, -60);
        ctx.rotate(atk ? -Math.PI * 0.65 : Math.PI * 0.08);
        // Handle
        ctx.fillStyle = "#5c2e08";
        ctx.fillRect(-3, -10, 7, 65);
        // Axe head body
        ctx.fillStyle = "#9a9aaa";
        ctx.beginPath();
        ctx.moveTo(4, -30);
        ctx.lineTo(30, -42);
        ctx.lineTo(34, -16);
        ctx.lineTo(4, -8);
        ctx.closePath();
        ctx.fill();
        // Axe edge
        ctx.fillStyle = "#e0e0f0";
        ctx.beginPath();
        ctx.moveTo(28, -44);
        ctx.lineTo(38, -48);
        ctx.lineTo(38, -10);
        ctx.lineTo(28, -12);
        ctx.closePath();
        ctx.fill();
        // Back spike
        ctx.fillStyle = "#7a7a8a";
        ctx.beginPath();
        ctx.moveTo(4, -20);
        ctx.lineTo(-10, -26);
        ctx.lineTo(-8, -14);
        ctx.lineTo(4, -12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}
