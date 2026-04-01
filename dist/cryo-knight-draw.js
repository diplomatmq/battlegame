/**
 * cryo-knight-draw.ts
 * High-fidelity 2D drawing logic for the Cryo Knight.
 * Hand-ported from the high-fidelity snippet.
 */
export function drawCryoKnight(c, x, y, scale, isFacingRight, fighterState, stateTimer, armAng, breath, jumpY, thrustX, shakeX, capePh, eyeGlow, time, ambFrost, cryoTrails, cryoParts, frostNova, frostPoint) {
    const fDir = isFacingRight ? 1 : -1;
    // 1. Shadow
    _shadow(c, x, y, thrustX, jumpY, scale, fighterState);
    // 2. Main Translate/Scale
    c.save();
    const dx = x + shakeX + thrustX;
    const dy = y;
    const s = scale;
    const br = (fighterState === "death") ? 0 : breath;
    c.translate(dx, dy + br + jumpY);
    if (fighterState === "death") {
        c.globalAlpha = Math.max(0, 1 - (stateTimer / 100));
        c.rotate(1.45 * fDir);
    }
    if (!isFacingRight)
        c.scale(-1, 1);
    c.scale(s, s);
    _cape(c, capePh);
    _backArm(c);
    _legs(c);
    _torso(c, eyeGlow);
    _head(c, eyeGlow);
    _shield(c, eyeGlow);
    _swordArm(c, armAng, eyeGlow, ambFrost, fighterState);
    // Victory ring
    if (fighterState === "victory") {
        c.save();
        c.globalAlpha = (0.14 + Math.sin(time * 1.6) * 0.06);
        c.strokeStyle = "rgba(74,200,232,.5)";
        c.lineWidth = 1.4;
        c.shadowColor = "#4ac8e8";
        c.shadowBlur = 12;
        c.beginPath();
        c.ellipse(30, 1, 18, 4.5, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
    }
    c.restore();
    // 3. Global VFX
    if (frostNova)
        _drawFrostNova(c, frostNova, scale);
    _drawTrails(c, cryoTrails);
    _drawDP(c, cryoParts);
    if (frostPoint)
        _drawFrostPoint(c, frostPoint);
}
function _shadow(c, x, y, thrustX, jumpY, scale, state) {
    c.save();
    let alpha = (state === "death") ? 0.1 : 0.22;
    if (jumpY < 0)
        alpha *= Math.max(0.08, 1 - Math.abs(jumpY) / (105 * scale) * 0.8);
    c.globalAlpha = alpha;
    c.fillStyle = "#000";
    c.beginPath();
    c.ellipse(x + thrustX, y + 2, 28 * scale, 5 * scale, 0, 0, 6.283);
    c.fill();
    c.restore();
}
function _cape(c, t) {
    c.save();
    const w1 = Math.sin(t * 1.5) * 4, w2 = Math.sin(t * 2.2 + 0.7) * 3, w3 = Math.sin(t * 1.8 + 1.3) * 5;
    c.beginPath();
    c.moveTo(-16, -92);
    c.lineTo(4, -90);
    c.quadraticCurveTo(6 + w1 * 0.5, -60, 3 + w2 * 0.5, -20);
    const tts = [[3 + w2 * 0.5, -8 + Math.sin(t * 2) * 2], [-2 + w3 * 0.3, -15 + Math.sin(t * 1.7 + 1) * 3],
        [-8 + w1 * 0.3, -4 + Math.sin(t * 2.3 + 2) * 2], [-14 + w2 * 0.2, -13 + Math.sin(t * 1.9 + 3) * 3],
        [-20 + w3 * 0.3, -2 + Math.sin(t * 2.1 + 4) * 2], [-26 + w1 * 0.4, -11 + Math.sin(t * 1.6 + 5) * 3],
        [-30 + w2 * 0.5, -5 + Math.sin(t * 2.4 + 6) * 2]];
    for (const p of tts)
        c.lineTo(p[0], p[1]);
    c.quadraticCurveTo(-28 + w3 * 0.5, -50, -16, -92);
    c.closePath();
    const g = c.createLinearGradient(-15, -92, -10, -5);
    g.addColorStop(0, "#0d0d22");
    g.addColorStop(0.7, "#080816");
    g.addColorStop(1, "#050510");
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = "rgba(28,28,55,.55)";
    c.lineWidth = 0.5;
    c.stroke();
    c.strokeStyle = "rgba(22,22,45,.35)";
    c.lineWidth = 0.4;
    c.beginPath();
    c.moveTo(-8, -85);
    c.quadraticCurveTo(-10 + w1 * 0.3, -50, -12 + w2 * 0.3, -15);
    c.stroke();
    c.beginPath();
    c.moveTo(-3, -88);
    c.quadraticCurveTo(-5 + w2 * 0.2, -55, -8 + w1 * 0.2, -10);
    c.stroke();
    c.restore();
}
function _backArm(c) {
    c.save();
    c.beginPath();
    c.moveTo(-20, -88);
    c.lineTo(-26, -86);
    c.lineTo(-30, -66);
    c.lineTo(-24, -64);
    c.closePath();
    c.fillStyle = "#0b0b1a";
    c.fill();
    c.strokeStyle = "#181832";
    c.lineWidth = 0.45;
    c.stroke();
    c.beginPath();
    c.moveTo(-27, -66);
    c.lineTo(-33, -64);
    c.lineTo(-35, -46);
    c.lineTo(-29, -44);
    c.closePath();
    c.fillStyle = "#0d0d1e";
    c.fill();
    c.strokeStyle = "#181832";
    c.lineWidth = 0.45;
    c.stroke();
    c.beginPath();
    c.ellipse(-22, -89, 8, 6, -0.2, Math.PI, 0);
    c.closePath();
    c.fillStyle = "#151530";
    c.fill();
    c.strokeStyle = "#28284e";
    c.lineWidth = 0.55;
    c.stroke();
    c.beginPath();
    c.moveTo(-28, -88);
    c.quadraticCurveTo(-22, -96, -16, -88);
    c.strokeStyle = "#222245";
    c.lineWidth = 0.4;
    c.stroke();
    c.restore();
}
function _legs(c) {
    c.save();
    const L = (x1, y1, x2, y2, x3, y3, x4, y4, f) => {
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.lineTo(x3, y3);
        c.lineTo(x4, y4);
        c.closePath();
        c.fillStyle = f;
        c.fill();
        c.strokeStyle = "#181832";
        c.lineWidth = 0.4;
        c.stroke();
    };
    L(-14, -53, -5, -53, -7, -30, -16, -30, "#09091a");
    L(-16, -30, -7, -30, -6, -6, -17, -6, "#0b0b1d");
    L(-17, -6, -6, -6, -4, 0, -19, 0, "#070712");
    L(5, -53, 14, -53, 16, -30, 7, -30, "#09091a");
    L(7, -30, 16, -30, 17, -6, 6, -6, "#0b0b1d");
    L(6, -6, 17, -6, 19, 0, 4, 0, "#070712");
    c.fillStyle = "#121228";
    c.strokeStyle = "#26264a";
    c.lineWidth = 0.45;
    c.beginPath();
    c.ellipse(-11, -30, 5, 3.5, 0, 0, 6.283);
    c.fill();
    c.stroke();
    c.beginPath();
    c.ellipse(11, -30, 5, 3.5, 0, 0, 6.283);
    c.fill();
    c.stroke();
    c.restore();
}
function _torso(c, eyeGlow) {
    c.save();
    c.beginPath();
    c.moveTo(-20, -90);
    c.lineTo(20, -90);
    c.lineTo(22, -78);
    c.quadraticCurveTo(20, -60, 15, -53);
    c.lineTo(-15, -53);
    c.quadraticCurveTo(-20, -60, -22, -78);
    c.closePath();
    const g = c.createLinearGradient(0, -90, 0, -53);
    g.addColorStop(0, "#101028");
    g.addColorStop(0.5, "#0b0b1e");
    g.addColorStop(1, "#080816");
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = "#202042";
    c.lineWidth = 0.6;
    c.stroke();
    c.strokeStyle = "#14142c";
    c.lineWidth = 0.4;
    c.beginPath();
    c.moveTo(-18, -78);
    c.lineTo(18, -78);
    c.stroke();
    c.beginPath();
    c.moveTo(-16, -66);
    c.lineTo(16, -66);
    c.stroke();
    c.beginPath();
    c.moveTo(0, -88);
    c.lineTo(0, -55);
    c.strokeStyle = "#12122a";
    c.lineWidth = 0.3;
    c.stroke();
    c.fillStyle = "#131128";
    c.fillRect(-22, -90, 4, 6);
    c.fillRect(18, -90, 4, 6);
    c.beginPath();
    c.moveTo(-16, -56);
    c.lineTo(16, -56);
    c.lineTo(15, -51);
    c.lineTo(-15, -51);
    c.closePath();
    c.fillStyle = "#090918";
    c.fill();
    c.strokeStyle = "#1c1c38";
    c.lineWidth = 0.45;
    c.stroke();
    c.save();
    c.shadowColor = "#4ac8e8";
    c.shadowBlur = 4 * eyeGlow;
    c.fillStyle = `rgba(55,165,210,${0.32 * eyeGlow})`;
    c.beginPath();
    c.moveTo(0, -56);
    c.lineTo(3, -53.5);
    c.lineTo(0, -51);
    c.lineTo(-3, -53.5);
    c.closePath();
    c.fill();
    c.restore();
    c.save();
    c.strokeStyle = `rgba(55,155,195,${0.11 * eyeGlow})`;
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(-7, -82);
    c.lineTo(0, -74);
    c.lineTo(7, -82);
    c.stroke();
    c.restore();
    c.restore();
}
function _head(c, eyeGlow) {
    c.save();
    c.fillStyle = "#070712";
    c.fillRect(-5, -95, 10, 5);
    c.beginPath();
    c.moveTo(-15, -96);
    c.lineTo(-17, -110);
    c.lineTo(-15, -120);
    c.lineTo(-8, -127);
    c.lineTo(0, -130);
    c.lineTo(8, -127);
    c.lineTo(15, -120);
    c.lineTo(17, -110);
    c.lineTo(15, -96);
    c.closePath();
    const g = c.createLinearGradient(-17, -130, 17, -96);
    g.addColorStop(0, "#131128");
    g.addColorStop(0.4, "#0d0d20");
    g.addColorStop(1, "#090916");
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = "#202042";
    c.lineWidth = 0.6;
    c.stroke();
    c.beginPath();
    c.moveTo(0, -130);
    c.lineTo(0, -98);
    c.strokeStyle = "#181835";
    c.lineWidth = 1.1;
    c.stroke();
    c.beginPath();
    c.moveTo(-12, -112);
    c.lineTo(12, -112);
    c.lineTo(11, -106);
    c.lineTo(-11, -106);
    c.closePath();
    c.fillStyle = "#03030e";
    c.fill();
    c.strokeStyle = "#181832";
    c.lineWidth = 0.45;
    c.stroke();
    c.save();
    c.shadowColor = "#4ac8e8";
    c.shadowBlur = 12 * eyeGlow;
    c.fillStyle = `rgba(74,200,232,${0.85 * eyeGlow})`;
    c.beginPath();
    c.ellipse(-5, -109, 3.5, 1.5, 0, 0, 6.283);
    c.fill();
    c.beginPath();
    c.ellipse(5, -109, 3.5, 1.5, 0, 0, 6.283);
    c.fill();
    c.shadowBlur = 5 * eyeGlow;
    c.fillStyle = `rgba(200,245,255,${0.65 * eyeGlow})`;
    c.beginPath();
    c.ellipse(-5, -109, 1.6, 0.7, 0, 0, 6.283);
    c.fill();
    c.beginPath();
    c.ellipse(5, -109, 1.6, 0.7, 0, 0, 6.283);
    c.fill();
    c.restore();
    c.save();
    c.shadowColor = "rgba(60,170,210,.12)";
    c.shadowBlur = 4;
    const horn = (sx) => {
        c.beginPath();
        c.moveTo(sx * 6, -126);
        c.lineTo(sx * 10, -142);
        c.lineTo(sx * 4, -128);
        c.closePath();
        c.fillStyle = "#151530";
        c.fill();
        c.strokeStyle = "#282850";
        c.lineWidth = 0.4;
        c.stroke();
    };
    horn(-1);
    horn(1);
    c.restore();
    c.beginPath();
    c.moveTo(-10, -120);
    c.lineTo(0, -116);
    c.lineTo(10, -120);
    c.strokeStyle = "#181835";
    c.lineWidth = 0.4;
    c.stroke();
    c.restore();
}
function _shield(c, eyeGlow) {
    c.save();
    c.translate(-33, -58);
    c.beginPath();
    c.moveTo(0, -18);
    c.lineTo(13, -8);
    c.lineTo(11, 12);
    c.lineTo(0, 22);
    c.lineTo(-11, 12);
    c.lineTo(-13, -8);
    c.closePath();
    const g = c.createLinearGradient(-13, -18, 13, 22);
    g.addColorStop(0, "#131128");
    g.addColorStop(0.5, "#0b0b1e");
    g.addColorStop(1, "#070714");
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = "#202040";
    c.lineWidth = 0.65;
    c.stroke();
    c.beginPath();
    c.moveTo(0, -15);
    c.lineTo(10, -6);
    c.lineTo(9, 10);
    c.lineTo(0, 19);
    c.lineTo(-9, 10);
    c.lineTo(-10, -6);
    c.closePath();
    c.strokeStyle = "#181835";
    c.lineWidth = 0.35;
    c.stroke();
    c.save();
    c.shadowColor = "#4ac8e8";
    c.shadowBlur = 5 * eyeGlow;
    c.strokeStyle = `rgba(65,175,215,${0.18 * eyeGlow})`;
    c.lineWidth = 0.55;
    c.translate(0, 2);
    for (let i = 0; i < 3; i++) {
        const a = i * Math.PI / 3;
        c.beginPath();
        c.moveTo(Math.cos(a) * -6, Math.sin(a) * -6);
        c.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
        c.stroke();
        const ba = a + 0.4, bb = a - 0.4;
        c.beginPath();
        c.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
        c.lineTo(Math.cos(ba) * 5, Math.sin(ba) * 5);
        c.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
        c.lineTo(Math.cos(bb) * 5, Math.sin(bb) * 5);
        c.stroke();
    }
    c.restore();
    c.fillStyle = `rgba(65,175,215,${0.12 * eyeGlow})`;
    c.beginPath();
    c.arc(0, 2, 1.8, 0, 6.283);
    c.fill();
    c.restore();
}
function _swordArm(c, armAng, eyeGlow, ambFrost, state) {
    c.save();
    c.translate(20, -88);
    c.rotate(armAng);
    c.beginPath();
    c.ellipse(0, 0, 9, 7, 0, Math.PI, 0);
    c.closePath();
    c.fillStyle = "#171738";
    c.fill();
    c.strokeStyle = "#282852";
    c.lineWidth = 0.55;
    c.stroke();
    c.beginPath();
    c.moveTo(-7, -1);
    c.quadraticCurveTo(0, -8, 7, -1);
    c.strokeStyle = "#222246";
    c.lineWidth = 0.4;
    c.stroke();
    const arm = (y1, y2, f) => {
        c.beginPath();
        c.moveTo(-4, y1);
        c.lineTo(4, y1);
        c.lineTo(4.5, y2);
        c.lineTo(-4.5, y2);
        c.closePath();
        c.fillStyle = f;
        c.fill();
        c.strokeStyle = "#181835";
        c.lineWidth = 0.4;
        c.stroke();
    };
    arm(2, 17, "#0b0b1d");
    c.beginPath();
    c.ellipse(0, 17, 4.5, 3, 0, 0, 6.283);
    c.fill();
    c.stroke();
    arm(17, 32, "#0d0d20");
    c.beginPath();
    c.moveTo(-4, 32);
    c.lineTo(4, 32);
    c.lineTo(3.5, 38);
    c.lineTo(-3.5, 38);
    c.closePath();
    c.fillStyle = "#090918";
    c.fill();
    c.strokeStyle = "#141430";
    c.lineWidth = 0.35;
    c.stroke();
    _sword(c, 38, eyeGlow);
    if (state !== "death")
        _ambFrostInner(c, 38, eyeGlow, ambFrost);
    c.restore();
}
function _sword(c, hy, eyeGlow) {
    c.save();
    c.translate(0, hy);
    c.fillStyle = "#0b0b1a";
    c.fillRect(-2, -6, 4, 5);
    c.beginPath();
    c.arc(0, -7, 3, 0, 6.283);
    c.fillStyle = "#111126";
    c.fill();
    c.strokeStyle = "#262648";
    c.lineWidth = 0.4;
    c.stroke();
    c.beginPath();
    c.moveTo(-9, -1);
    c.lineTo(9, -1);
    c.lineTo(8, 3);
    c.lineTo(-8, 3);
    c.closePath();
    c.fillStyle = "#121228";
    c.fill();
    c.strokeStyle = "#282850";
    c.lineWidth = 0.45;
    c.stroke();
    const bl = 52;
    const rEdge = [[5, 3], [6, 8], [5.5, 14], [6.5, 20], [5, 26], [6, 32], [5, 38], [4, 44], [2.5, 49], [0, 3 + bl]];
    const lEdge = [[-2.5, 49], [-4, 44], [-5, 38], [-6, 32], [-5, 26], [-6.5, 20], [-5.5, 14], [-6, 8], [-5, 3]];
    const bp = () => { c.beginPath(); c.moveTo(-5, 3); c.lineTo(5, 3); for (const p of rEdge)
        c.lineTo(p[0], p[1]); for (const p of lEdge)
        c.lineTo(p[0], p[1]); c.closePath(); };
    c.save();
    c.shadowColor = "rgba(75,185,230,.3)";
    c.shadowBlur = 10;
    bp();
    const bg = c.createLinearGradient(-7, 3, 7, 3);
    bg.addColorStop(0, "rgba(48,128,168,.42)");
    bg.addColorStop(.5, "rgba(28,68,88,.68)");
    bg.addColorStop(1, "rgba(48,128,168,.42)");
    c.fillStyle = bg;
    c.fill();
    c.strokeStyle = "rgba(95,205,242,.32)";
    c.lineWidth = 0.55;
    c.stroke();
    c.restore();
    c.restore();
}
function _ambFrostInner(c, hy, eyeGlow, ambFrost) {
    c.save();
    c.translate(0, hy + 25);
    for (const p of ambFrost) {
        const px = Math.cos(p.a) * p.d, py = Math.sin(p.a) * p.d + (p.off - 25);
        c.globalAlpha = p.op * Math.max(0.15, eyeGlow);
        c.fillStyle = "#80d8f0";
        c.shadowColor = "#4ac8e8";
        c.shadowBlur = 3;
        c.beginPath();
        c.arc(px, py, p.sz, 0, 6.283);
        c.fill();
    }
    c.restore();
}
function _drawTrails(c, cryoTrails) {
    for (const t of cryoTrails) {
        c.save();
        c.globalAlpha = t.light ? t.life * 0.36 : t.life * 0.42;
        c.strokeStyle = t.light ? `rgba(188,240,255,${t.life * 0.72})` : "rgba(155,222,255,.65)";
        c.lineWidth = t.w * t.life;
        c.beginPath();
        c.arc(t.x, t.y, t.r * t.life, t.aa - t.as, t.aa + t.as);
        c.stroke();
        c.restore();
    }
}
function _drawDP(c, cryoParts) {
    for (const p of cryoParts) {
        c.save();
        c.globalAlpha = Math.max(0, p.life);
        const col = p.cy ? "#4ac8e8" : "#28385a";
        c.fillStyle = col;
        c.beginPath();
        c.arc(p.x, p.y, Math.max(0, p.sz * p.life), 0, 6.283);
        c.fill();
        c.restore();
    }
}
function _drawFrostPoint(c, fp) {
    if (!fp || fp.life <= 0)
        return;
    c.save();
    const r = fp.r * fp.life;
    c.globalAlpha = fp.life;
    const gr = c.createRadialGradient(fp.x, fp.y, 0, fp.x, fp.y, r);
    gr.addColorStop(0, `rgba(215,250,255,${fp.life * 0.92})`);
    gr.addColorStop(1, "rgba(18,55,90,0)");
    c.fillStyle = gr;
    c.beginPath();
    c.arc(fp.x, fp.y, r, 0, Math.PI * 2);
    c.fill();
    c.restore();
}
function _drawFrostNova(c, n, scale) {
    if (!n || n.alpha <= 0)
        return;
    c.save();
    const rw = Math.max(0.5, (1 - n.r / n.maxR) * 4.5 * scale);
    c.globalAlpha = n.alpha * 0.82;
    c.strokeStyle = `rgba(100,218,250,${n.alpha})`;
    c.lineWidth = rw;
    c.shadowColor = "rgba(80,195,238,.75)";
    c.shadowBlur = 15;
    c.beginPath();
    c.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    c.stroke();
    c.restore();
}
