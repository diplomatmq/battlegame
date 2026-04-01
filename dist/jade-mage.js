import { Fighter, state } from "./fighter.js";
import { Particle } from "./particles.js";
export const JADE_MAGE_META = {
    id: "mage",
    name: "НЕФРИТ МАГ",
    desc: "МАСТЕР ИЗУМРУДНОЙ ЭНЕРГИИ",
    color: "#00e884",
    rgb: "0,232,132",
    weapon: "staff",
    maxHp: 1000,
};
const JADE = {
    primary: "#00e884",
    bright: "#75ffc2",
    deep: "#00ad6f",
    dark: "#0d2b1f",
    robeOuter: "#123a2b",
    robeInner: "#1f5a42",
    robeShadow: "#0b2219",
    gold: "#d6b96a",
    metal: "#7b878d",
    leather: "#6a472a",
    skin: "#f1d6bb",
    eye: "#0c5f47",
    glow: "#7bffd0",
};
const DEFAULT_ATTACK_CONFIG = {
    normal: {
        damage: 34,
        castFrames: 14,
        cooldownFrames: 24,
        projectileSpeed: 11,
        projectileRadius: 10,
    },
    critical: {
        damage: 72,
        castFrames: 24,
        cooldownFrames: 62,
        projectileSpeed: 13,
        projectileRadius: 14,
    },
    ultimate: {
        damage: 175,
        castFrames: 52,
        cooldownFrames: 330,
        projectileSpeed: 8,
        projectileRadius: 24,
    },
    criticalChance: 0.24,
    ultimateChargePerNormal: 16,
    ultimateChargePerCritical: 28,
};
class JadeMageAnimationController {
    constructor() {
        this.state = "idle";
        this.lockFrames = 0;
    }
    update(opts) {
        if (opts.dead) {
            this.state = "death";
            this.lockFrames = 0;
            return;
        }
        if (this.lockFrames > 0) {
            this.lockFrames--;
            return;
        }
        if (opts.hit) {
            this.state = "hit";
            return;
        }
        if (opts.ultimate) {
            this.state = "ultimate";
            return;
        }
        if (opts.casting) {
            this.state = "attack";
            return;
        }
        this.state = opts.moving ? "walk" : "idle";
    }
    playOneShot(next, frames) {
        this.state = next;
        this.lockFrames = Math.max(this.lockFrames, frames);
    }
}
class JadeMageAttackSystem {
    constructor(config = DEFAULT_ATTACK_CONFIG) {
        this.criticalCooldown = 0;
        this.ultimateCooldown = 0;
        this.ultimateCharge = 0;
        this.cfg = config;
    }
    tick() {
        if (this.criticalCooldown > 0)
            this.criticalCooldown--;
        if (this.ultimateCooldown > 0)
            this.ultimateCooldown--;
    }
    pickAttack() {
        if (this.ultimateCharge >= 100 && this.ultimateCooldown <= 0) {
            return "ultimate";
        }
        if (this.criticalCooldown <= 0 && Math.random() < this.cfg.criticalChance) {
            return "critical";
        }
        return "normal";
    }
    startCast(type) {
        return { type, framesLeft: this.cfg[type].castFrames };
    }
    commitAttack(type) {
        if (type === "critical") {
            this.criticalCooldown = this.cfg.critical.cooldownFrames;
            this.ultimateCharge = Math.min(100, this.ultimateCharge + this.cfg.ultimateChargePerCritical);
            return;
        }
        if (type === "ultimate") {
            this.ultimateCooldown = this.cfg.ultimate.cooldownFrames;
            this.ultimateCharge = 0;
            return;
        }
        this.ultimateCharge = Math.min(100, this.ultimateCharge + this.cfg.ultimateChargePerNormal);
    }
    getDefinition(type) {
        return this.cfg[type];
    }
}
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}
function rgbaHex(hex, alpha) {
    const clean = hex.replace("#", "");
    if (clean.length !== 6)
        return `rgba(0,232,132,${alpha})`;
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
function drawDiamondCrystal(ctx, x, y, w, h, glowStrength, hitFlash) {
    const glowRadius = 12 + glowStrength * 22;
    const halo = ctx.createRadialGradient(x, y, 1, x, y, glowRadius);
    halo.addColorStop(0, rgbaHex(JADE.glow, 0.42 + glowStrength * 0.32));
    halo.addColorStop(1, rgbaHex(JADE.glow, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    const crystalGrad = ctx.createLinearGradient(x, y - h, x, y + h);
    crystalGrad.addColorStop(0, hitFlash ? "#ffffff" : JADE.bright);
    crystalGrad.addColorStop(0.52, hitFlash ? "#ffffff" : JADE.primary);
    crystalGrad.addColorStop(1, hitFlash ? "#d8fff1" : JADE.deep);
    ctx.fillStyle = crystalGrad;
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - w, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hitFlash ? "#ffffff" : rgbaHex(JADE.bright, 0.95);
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.strokeStyle = rgbaHex("#ffffff", 0.7);
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.45, y - h * 0.18);
    ctx.quadraticCurveTo(x, y - h * 0.62, x + w * 0.52, y - h * 0.04);
    ctx.stroke();
}
function drawStaff(ctx, castPower, ultimatePower, auraPhase, hitFlash) {
    const shaftGrad = ctx.createLinearGradient(-32, -146, -24, -8);
    shaftGrad.addColorStop(0, hitFlash ? "#ffffff" : "#7a5937");
    shaftGrad.addColorStop(0.45, hitFlash ? "#f0f0f0" : "#6a472b");
    shaftGrad.addColorStop(1, hitFlash ? "#dfdfdf" : "#4f341f");
    ctx.strokeStyle = shaftGrad;
    ctx.lineWidth = 5.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-27, -10);
    ctx.quadraticCurveTo(-33, -76, -30, -143);
    ctx.stroke();
    // Engraved runes wrapped around the shaft.
    ctx.strokeStyle = hitFlash ? "#ffffff" : rgbaHex(JADE.gold, 0.82);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
        const y = -32 - i * 22;
        ctx.beginPath();
        ctx.arc(-29.4, y, 3.8, Math.PI * 0.2, Math.PI * 1.8);
        ctx.stroke();
    }
    const headGlow = clamp(castPower * 0.7 + ultimatePower * 0.9, 0, 1);
    ctx.strokeStyle = hitFlash ? "#ffffff" : rgbaHex(JADE.metal, 0.95);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-31, -143);
    ctx.quadraticCurveTo(-46, -154, -39, -168);
    ctx.moveTo(-29, -143);
    ctx.quadraticCurveTo(-13, -154, -20, -168);
    ctx.stroke();
    ctx.strokeStyle = hitFlash ? "#ffffff" : rgbaHex(JADE.gold, 0.95);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-29, -170, 9, 0, Math.PI * 2);
    ctx.stroke();
    drawDiamondCrystal(ctx, -29, -170, 6.8, 11, headGlow, hitFlash);
    const orbitCount = 3;
    for (let i = 0; i < orbitCount; i++) {
        const phase = auraPhase * (1.4 + i * 0.18) + (Math.PI * 2 * i) / orbitCount;
        const ox = -29 + Math.cos(phase) * (10 + i * 2);
        const oy = -170 + Math.sin(phase) * (6 + i * 1.2);
        const orb = ctx.createRadialGradient(ox, oy, 0.3, ox, oy, 3.8 + headGlow * 2.2);
        orb.addColorStop(0, rgbaHex(JADE.bright, 0.95));
        orb.addColorStop(1, rgbaHex(JADE.bright, 0));
        ctx.fillStyle = orb;
        ctx.beginPath();
        ctx.arc(ox, oy, 3.8 + headGlow * 2.2, 0, Math.PI * 2);
        ctx.fill();
    }
}
function drawMageFigure(ctx, opts) {
    const walkSwing = Math.sin(opts.walkPhase) * 3.2;
    const robeWave = Math.sin(opts.walkPhase * 1.2) * 4.2;
    const tone = (hex) => (opts.hitFlash ? "#ffffff" : hex);
    const auraRadius = 54 + opts.castPower * 28 + opts.ultimatePower * 20;
    const aura = ctx.createRadialGradient(0, -78, 8, 0, -78, auraRadius);
    aura.addColorStop(0, rgbaHex(JADE.bright, 0.16 + opts.castPower * 0.18));
    aura.addColorStop(0.58, rgbaHex(JADE.primary, 0.08 + opts.ultimatePower * 0.15));
    aura.addColorStop(1, rgbaHex(JADE.primary, 0));
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -78, auraRadius, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
        const phase = opts.auraPhase * (0.7 + i * 0.09) + i * 0.9;
        const x = Math.cos(phase) * (18 + i * 3.4);
        const y = -72 + Math.sin(phase * 1.4) * (10 + i * 1.5);
        const mote = ctx.createRadialGradient(x, y, 0.2, x, y, 3 + opts.castPower * 2.5);
        mote.addColorStop(0, rgbaHex(JADE.bright, 0.85));
        mote.addColorStop(1, rgbaHex(JADE.bright, 0));
        ctx.fillStyle = mote;
        ctx.beginPath();
        ctx.arc(x, y, 3 + opts.castPower * 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    const shadow = ctx.createRadialGradient(0, 2, 5, 0, 2, 30);
    shadow.addColorStop(0, "rgba(0,0,0,0.34)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(0, 2, 27, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    drawStaff(ctx, opts.castPower, opts.ultimatePower, opts.auraPhase, opts.hitFlash);
    const cloakBack = ctx.createLinearGradient(-20, -120, -18, 6);
    cloakBack.addColorStop(0, tone(JADE.dark));
    cloakBack.addColorStop(1, tone(JADE.robeShadow));
    ctx.fillStyle = cloakBack;
    ctx.beginPath();
    ctx.moveTo(-12, -112);
    ctx.bezierCurveTo(-45, -86, -43, -36, -24, 8 + robeWave * 0.3);
    ctx.quadraticCurveTo(-8, 3, -7, -22);
    ctx.quadraticCurveTo(-9, -74, -5, -110);
    ctx.closePath();
    ctx.fill();
    const robeOuter = ctx.createLinearGradient(0, -102, 0, 10);
    robeOuter.addColorStop(0, tone(JADE.robeInner));
    robeOuter.addColorStop(0.5, tone(JADE.robeOuter));
    robeOuter.addColorStop(1, tone(JADE.robeShadow));
    ctx.fillStyle = robeOuter;
    ctx.beginPath();
    ctx.moveTo(-21, -95);
    ctx.quadraticCurveTo(-33, -38, -24, 8 + robeWave);
    ctx.quadraticCurveTo(0, 17, 25, 8 + robeWave * 0.6);
    ctx.quadraticCurveTo(34, -39, 19, -95);
    ctx.quadraticCurveTo(0, -108, -21, -95);
    ctx.closePath();
    ctx.fill();
    const robeInner = ctx.createLinearGradient(0, -98, 0, 8);
    robeInner.addColorStop(0, tone("#2d7254"));
    robeInner.addColorStop(1, tone("#194a35"));
    ctx.fillStyle = robeInner;
    ctx.beginPath();
    ctx.moveTo(-13, -90);
    ctx.quadraticCurveTo(-20, -35, -12, 6 + robeWave * 0.7);
    ctx.quadraticCurveTo(0, 10, 13, 6 + robeWave * 0.4);
    ctx.quadraticCurveTo(19, -35, 11, -90);
    ctx.quadraticCurveTo(0, -98, -13, -90);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgbaHex(tone(JADE.deep), 0.55);
    ctx.lineWidth = 1.05;
    for (let i = 0; i < 4; i++) {
        const x = -8 + i * 5.3;
        ctx.beginPath();
        ctx.moveTo(x, -86);
        ctx.quadraticCurveTo(x + Math.sin(opts.walkPhase + i) * 2.6, -42, x + Math.sin(opts.walkPhase + i * 1.2) * 1.8, 2 + robeWave * 0.45);
        ctx.stroke();
    }
    ctx.fillStyle = tone("#0b1d16");
    ctx.beginPath();
    ctx.ellipse(-8, 2 + walkSwing * 0.1, 8, 4.2, -0.1, 0, Math.PI * 2);
    ctx.ellipse(9, 2 - walkSwing * 0.1, 8, 4.2, 0.1, 0, Math.PI * 2);
    ctx.fill();
    const belt = ctx.createLinearGradient(-18, -48, 18, -48);
    belt.addColorStop(0, tone(JADE.leather));
    belt.addColorStop(1, tone("#8f6438"));
    ctx.strokeStyle = belt;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-16, -48);
    ctx.quadraticCurveTo(0, -44, 16, -48);
    ctx.stroke();
    ctx.fillStyle = tone(JADE.gold);
    ctx.beginPath();
    ctx.ellipse(0, -47, 4.8, 4.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tone("#6d4b2c");
    ctx.beginPath();
    ctx.ellipse(-12.5, -40.5, 4.2, 5.2, -0.08, 0, Math.PI * 2);
    ctx.ellipse(12.5, -40.5, 4.2, 5.2, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = tone(JADE.gold);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(7, -44);
    ctx.quadraticCurveTo(9, -33, 6, -24);
    ctx.stroke();
    drawDiamondCrystal(ctx, 5.4, -22, 2.8, 4.5, 0.2 + opts.castPower * 0.4, opts.hitFlash);
    const torso = ctx.createLinearGradient(0, -96, 0, -42);
    torso.addColorStop(0, tone("#244f3d"));
    torso.addColorStop(1, tone("#173626"));
    ctx.fillStyle = torso;
    ctx.beginPath();
    ctx.moveTo(-13, -92);
    ctx.quadraticCurveTo(-16, -72, -10, -56);
    ctx.quadraticCurveTo(0, -50, 10, -56);
    ctx.quadraticCurveTo(16, -72, 13, -92);
    ctx.quadraticCurveTo(0, -101, -13, -92);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = tone(JADE.metal);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-11, -90);
    ctx.quadraticCurveTo(0, -95, 11, -90);
    ctx.quadraticCurveTo(10, -62, 0, -55);
    ctx.quadraticCurveTo(-10, -62, -11, -90);
    ctx.stroke();
    drawDiamondCrystal(ctx, 0, -74, 4.3, 6.8, 0.28 + opts.castPower * 0.5, opts.hitFlash);
    const shoulderGradL = ctx.createLinearGradient(-32, -90, -10, -72);
    shoulderGradL.addColorStop(0, tone("#93a1a8"));
    shoulderGradL.addColorStop(1, tone("#59666e"));
    ctx.fillStyle = shoulderGradL;
    ctx.beginPath();
    ctx.ellipse(-20, -83, 12.8, 8.7, -0.18, 0, Math.PI * 2);
    ctx.fill();
    const shoulderGradR = ctx.createLinearGradient(10, -90, 34, -72);
    shoulderGradR.addColorStop(0, tone("#8f9da5"));
    shoulderGradR.addColorStop(1, tone("#536067"));
    ctx.fillStyle = shoulderGradR;
    ctx.beginPath();
    ctx.ellipse(20, -82, 12.8, 8.7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    drawDiamondCrystal(ctx, -20, -82, 2.8, 4.2, 0.16 + opts.castPower * 0.35, opts.hitFlash);
    drawDiamondCrystal(ctx, 20, -81, 2.8, 4.2, 0.16 + opts.castPower * 0.35, opts.hitFlash);
    ctx.fillStyle = tone("#1f5a42");
    ctx.beginPath();
    ctx.moveTo(-23, -80);
    ctx.quadraticCurveTo(-30, -66, -25, -48);
    ctx.quadraticCurveTo(-21, -45, -16, -51);
    ctx.quadraticCurveTo(-18, -63, -16, -77);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(21, -78);
    ctx.quadraticCurveTo(31, -64, 29, -50);
    ctx.quadraticCurveTo(22, -44, 17, -51);
    ctx.quadraticCurveTo(19, -62, 17, -76);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = tone(JADE.dark);
    ctx.beginPath();
    ctx.moveTo(-22, -118);
    ctx.quadraticCurveTo(-24, -94, -14, -83);
    ctx.quadraticCurveTo(-2, -89, 8, -83);
    ctx.quadraticCurveTo(20, -94, 22, -118);
    ctx.quadraticCurveTo(0, -132, -22, -118);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = tone(JADE.skin);
    ctx.beginPath();
    ctx.ellipse(0, -101, 11.5, 13.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = tone("#8d6d4e");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -104);
    ctx.quadraticCurveTo(1.5, -100, 0, -96);
    ctx.stroke();
    ctx.fillStyle = tone("#fdfefe");
    ctx.beginPath();
    ctx.ellipse(-3.8, -103.2, 2.5, 1.8, -0.1, 0, Math.PI * 2);
    ctx.ellipse(3.8, -103.2, 2.5, 1.8, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tone(JADE.eye);
    ctx.beginPath();
    ctx.ellipse(-3.6, -103.1, 1.1, 1.1, 0, 0, Math.PI * 2);
    ctx.ellipse(3.9, -103.1, 1.1, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = tone("#4e3a2b");
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-7.2, -106.4);
    ctx.quadraticCurveTo(-4.1, -108.8, -1.4, -106.2);
    ctx.moveTo(1.4, -106.2);
    ctx.quadraticCurveTo(4.2, -108.8, 7.2, -106.4);
    ctx.stroke();
    ctx.strokeStyle = tone("#6f4d34");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, -94.2);
    ctx.quadraticCurveTo(0, -92.4, 3, -94.2);
    ctx.stroke();
    ctx.fillStyle = tone("#2d4f3f");
    ctx.beginPath();
    ctx.moveTo(-8.5, -92.2);
    ctx.quadraticCurveTo(0, -87.5, 8.5, -92.2);
    ctx.quadraticCurveTo(0, -84.7, -8.5, -92.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = tone(JADE.gold);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-9.5, -114.5);
    ctx.quadraticCurveTo(0, -119.4, 9.5, -114.5);
    ctx.stroke();
    drawDiamondCrystal(ctx, 0, -120, 2.5, 3.8, 0.1 + opts.castPower * 0.25, opts.hitFlash);
    ctx.fillStyle = tone("#1e5841");
    ctx.beginPath();
    ctx.moveTo(16, -76);
    ctx.quadraticCurveTo(33, -69, 31, -54);
    ctx.quadraticCurveTo(23, -46, 14.5, -52);
    ctx.quadraticCurveTo(16.4, -62, 13.8, -74);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = tone(JADE.skin);
    ctx.beginPath();
    ctx.ellipse(25.2, -52.2, 3.5, 4.3, 0, 0, Math.PI * 2);
    ctx.fill();
    if (opts.castPower > 0.05 || opts.ultimatePower > 0.05) {
        const orbX = 30;
        const orbY = -57;
        const strength = clamp(opts.castPower + opts.ultimatePower * 0.9, 0, 1);
        const orb = ctx.createRadialGradient(orbX, orbY, 2, orbX, orbY, 15 + strength * 16);
        orb.addColorStop(0, rgbaHex(JADE.bright, 0.95));
        orb.addColorStop(0.45, rgbaHex(JADE.primary, 0.6));
        orb.addColorStop(1, rgbaHex(JADE.primary, 0));
        ctx.fillStyle = orb;
        ctx.beginPath();
        ctx.arc(orbX, orbY, 15 + strength * 16, 0, Math.PI * 2);
        ctx.fill();
        drawDiamondCrystal(ctx, orbX, orbY, 4 + strength * 2.8, 6 + strength * 3.8, 0.45 + strength * 0.5, opts.hitFlash);
        ctx.strokeStyle = rgbaHex(JADE.bright, 0.75);
        ctx.lineWidth = 1.35;
        for (let i = 0; i < 3; i++) {
            const phase = opts.auraPhase * (1 + i * 0.26) + i * 1.8;
            const rx = 11 + i * 4;
            const ry = 7 + i * 2.4;
            ctx.beginPath();
            ctx.ellipse(orbX, orbY, rx, ry, phase, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}
export class JadeMageFighter extends Fighter {
    constructor(x, y, hpFillId, isFacingRight, particles, damageTexts) {
        super(x, y, JADE_MAGE_META.color, hpFillId, isFacingRight, false, particles, damageTexts);
        this.attacks = new JadeMageAttackSystem();
        this.animation = new JadeMageAnimationController();
        this.activeCast = null;
        this.projectiles = [];
        this.moveVelocity = 0;
        this.walkStep = 0;
        this.auraPhase = Math.random() * Math.PI * 2;
        this.charType = "jade_mage";
        this.equippedWeaponVisual = "staff";
    }
    updateAI(gameOver) {
        if (this.hp <= 0 || gameOver) {
            this.animation.update({ moving: false, casting: false, ultimate: false, hit: false, dead: true });
            return;
        }
        this.auraPhase += 0.07;
        this.attacks.tick();
        this.isFacingRight = this.opponent.x > this.x;
        const distance = Math.abs(this.x - this.opponent.x);
        const speed = 1.8 + Math.max(0, this.playerSpd - 1) * 0.18;
        let isMoving = false;
        if (!this.activeCast) {
            if (distance < 220) {
                const dir = this.isFacingRight ? -1 : 1;
                this.moveVelocity = dir * speed;
                isMoving = true;
            }
            else if (distance > 360) {
                const dir = this.isFacingRight ? 1 : -1;
                this.moveVelocity = dir * speed;
                isMoving = true;
            }
            else {
                const strafeDir = this.isFacingRight ? 1 : -1;
                this.moveVelocity = strafeDir * Math.sin(this.walkStep * 0.08) * 0.8;
                isMoving = Math.abs(this.moveVelocity) > 0.15;
            }
            this.x += this.moveVelocity;
            this.walkStep++;
            if (this.attackCooldown > 0) {
                this.attackCooldown--;
            }
            else {
                const attackType = this.attacks.pickAttack();
                this.activeCast = this.attacks.startCast(attackType);
                this.fighterState = attackType === "ultimate" ? "ultimate_casting" : "casting";
                this.animation.playOneShot(attackType === "ultimate" ? "ultimate" : "attack", attackType === "ultimate" ? 42 : 14);
            }
        }
        else {
            this.moveVelocity *= 0.65;
            this.x += this.moveVelocity;
            this.activeCast.framesLeft--;
            if (this.activeCast.framesLeft <= 0) {
                this.releaseAttack(this.activeCast.type);
                this.activeCast = null;
                this.fighterState = "idle";
            }
        }
        if (Math.random() < 0.05) {
            const ang = Math.random() * Math.PI * 2;
            const rad = 18 + Math.random() * 16;
            const px = this.x + Math.cos(ang) * rad;
            const py = this.y - 72 + Math.sin(ang) * 14;
            this.particles.push(new Particle(px, py, JADE.primary, 0.4));
        }
        this.updateProjectiles();
        this.x = Math.max(50, Math.min(850, this.x));
        this.animation.update({
            moving: isMoving,
            casting: this.activeCast !== null,
            ultimate: this.activeCast?.type === "ultimate",
            hit: this.hitTimer > 0,
            dead: false,
        });
        if (this.hitTimer > 0)
            this.hitTimer--;
    }
    takeDamage(amount, attackerColor) {
        super.takeDamage(amount, attackerColor);
        this.animation.playOneShot("hit", 8);
    }
    draw(ctx, gameTime) {
        this.drawProjectiles(ctx, gameTime);
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.translate(this.x, this.y);
        if (!this.isFacingRight)
            ctx.scale(-1, 1);
        const walkPhase = this.animation.state === "walk" ? gameTime * 0.32 : gameTime * 0.08;
        const bob = Math.sin(gameTime * 0.12) * 2.2;
        const bodyTilt = this.animation.state === "walk" ? Math.sin(gameTime * 0.18) * 0.045 : 0;
        let castPower = 0;
        let ultimatePower = 0;
        if (this.activeCast) {
            const total = this.attacks.getDefinition(this.activeCast.type).castFrames;
            castPower = clamp(1 - this.activeCast.framesLeft / Math.max(1, total), 0, 1);
            if (this.activeCast.type === "ultimate")
                ultimatePower = castPower;
        }
        ctx.translate(0, bob);
        ctx.rotate(bodyTilt);
        drawMageFigure(ctx, {
            walkPhase,
            auraPhase: this.auraPhase,
            castPower,
            ultimatePower,
            hitFlash: this.animation.state === "hit",
        });
        ctx.restore();
    }
    releaseAttack(type) {
        this.attacks.commitAttack(type);
        const def = this.attacks.getDefinition(type);
        this.attackCooldown = def.cooldownFrames;
        const dir = this.isFacingRight ? 1 : -1;
        const spawnX = this.x + dir * 30;
        const spawnY = this.y - 58;
        const damageScale = 1 + Math.max(0, this.playerAtk - 1) * 0.16;
        const scaledDamage = Math.floor(def.damage * damageScale);
        if (type === "ultimate") {
            this.spawnUltimateProjectiles(spawnX, spawnY, dir, scaledDamage, def);
            state.screenShake = 16;
            return;
        }
        this.projectiles.push({
            x: spawnX,
            y: spawnY,
            vx: def.projectileSpeed * dir,
            vy: type === "critical" ? -0.2 : 0,
            radius: def.projectileRadius,
            life: 95,
            damage: scaledDamage,
            type,
            color: type === "critical" ? JADE.bright : JADE.primary,
        });
        if (type === "critical") {
            this.projectiles.push({
                x: spawnX,
                y: spawnY + 2.4,
                vx: def.projectileSpeed * 0.92 * dir,
                vy: 0.22,
                radius: def.projectileRadius * 0.78,
                life: 90,
                damage: Math.floor(scaledDamage * 0.45),
                type,
                color: JADE.glow,
            });
        }
        const burstCount = type === "critical" ? 20 : 10;
        for (let i = 0; i < burstCount; i++) {
            this.particles.push(new Particle(spawnX, spawnY, JADE.primary, type === "critical" ? 2.4 : 1.55));
        }
    }
    spawnUltimateProjectiles(x, y, dir, damage, def) {
        const spread = [-0.34, -0.16, 0, 0.16, 0.34];
        for (const [index, ang] of spread.entries()) {
            this.projectiles.push({
                x,
                y,
                vx: (def.projectileSpeed + 1.6) * dir,
                vy: ang * 4,
                radius: def.projectileRadius * (index === 2 ? 1.18 : 0.92),
                life: 128,
                damage: Math.floor(damage * (index === 2 ? 1 : 0.66)),
                type: "ultimate",
                color: index === 2 ? JADE.bright : JADE.primary,
            });
        }
        for (let i = 0; i < 34; i++) {
            this.particles.push(new Particle(x, y, JADE.primary, 3.1));
        }
    }
    updateProjectiles() {
        if (!this.opponent)
            return;
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life % 2 === 0) {
                this.particles.push(new Particle(p.x, p.y, p.color, p.type === "ultimate" ? 2.2 : 1.35));
            }
            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }
            const hit = Math.abs(p.x - this.opponent.x) < (32 + p.radius) &&
                Math.abs(p.y - (this.opponent.y - 56)) < (42 + p.radius);
            if (!hit)
                continue;
            this.opponent.takeDamage(p.damage, p.color);
            const impactBurst = p.type === "ultimate" ? 46 : p.type === "critical" ? 28 : 16;
            for (let k = 0; k < impactBurst; k++) {
                this.particles.push(new Particle(this.opponent.x, this.opponent.y - 58, p.color, p.type === "ultimate" ? 3.4 : 2.2));
            }
            if (p.type === "ultimate") {
                state.screenShake = 22;
            }
            else if (p.type === "critical") {
                state.screenShake = Math.max(state.screenShake, 11);
            }
            this.projectiles.splice(i, 1);
        }
    }
    drawProjectiles(ctx, gameTime) {
        for (const p of this.projectiles) {
            const pulse = 0.78 + Math.sin((gameTime + p.x) * 0.16) * 0.22;
            const r = p.radius * pulse;
            const halo = ctx.createRadialGradient(p.x, p.y, r * 0.18, p.x, p.y, r * 2.8);
            halo.addColorStop(0, rgbaHex(p.color, 0.9));
            halo.addColorStop(0.55, rgbaHex(JADE.primary, p.type === "ultimate" ? 0.5 : 0.32));
            halo.addColorStop(1, rgbaHex(JADE.primary, 0));
            ctx.save();
            ctx.globalAlpha = p.type === "ultimate" ? 0.92 : 0.88;
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 2.8, 0, Math.PI * 2);
            ctx.fill();
            const core = ctx.createRadialGradient(p.x - r * 0.2, p.y - r * 0.2, 0.2, p.x, p.y, r * 1.2);
            core.addColorStop(0, "rgba(255,255,255,0.92)");
            core.addColorStop(0.5, rgbaHex(JADE.bright, 0.95));
            core.addColorStop(1, rgbaHex(p.color, 0.35));
            ctx.fillStyle = core;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 1.12, 0, Math.PI * 2);
            ctx.fill();
            const tx = p.x - p.vx * 2.5;
            const ty = p.y - p.vy * 2.5;
            const tailGrad = ctx.createLinearGradient(p.x, p.y, tx, ty);
            tailGrad.addColorStop(0, rgbaHex(p.color, 0.7));
            tailGrad.addColorStop(1, rgbaHex(p.color, 0));
            ctx.fillStyle = tailGrad;
            ctx.beginPath();
            ctx.moveTo(p.x + p.vy * 0.2, p.y - p.vx * 0.2);
            ctx.quadraticCurveTo((p.x + tx) * 0.5, (p.y + ty) * 0.5, tx - p.vy * 0.6, ty + p.vx * 0.6);
            ctx.quadraticCurveTo((p.x + tx) * 0.5, (p.y + ty) * 0.5, p.x - p.vy * 0.2, p.y + p.vx * 0.2);
            ctx.closePath();
            ctx.fill();
            if (p.type !== "normal") {
                ctx.strokeStyle = rgbaHex(JADE.bright, p.type === "ultimate" ? 0.8 : 0.62);
                ctx.lineWidth = p.type === "ultimate" ? 1.55 : 1.1;
                const rot = gameTime * 0.09 + p.life * 0.04;
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, r * 1.65, r * 0.95, rot, 0, Math.PI * 2);
                ctx.stroke();
            }
            if (p.type === "ultimate") {
                ctx.strokeStyle = rgbaHex("#ffffff", 0.55);
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(p.x - r * 1.8, p.y);
                ctx.lineTo(p.x + r * 1.8, p.y);
                ctx.moveTo(p.x, p.y - r * 1.8);
                ctx.lineTo(p.x, p.y + r * 1.8);
                ctx.stroke();
            }
            ctx.restore();
        }
    }
}
export function drawJadeMagePreview(ctx, cx, by, bob = 0, gameTick = 0) {
    ctx.save();
    ctx.translate(cx, by + bob);
    ctx.scale(0.95, 0.95);
    drawMageFigure(ctx, {
        walkPhase: gameTick * 0.1,
        auraPhase: gameTick * 0.07,
        castPower: 0.26 + Math.sin(gameTick * 0.045) * 0.08,
        ultimatePower: 0,
        hitFlash: false,
    });
    ctx.restore();
}
export function enforceJadeMageSelection() {
    localStorage.setItem("playerCharacter", JADE_MAGE_META.id);
}
export function applyJadeMageUi(avatarEl, hpFillEl) {
    if (avatarEl)
        avatarEl.style.borderColor = JADE_MAGE_META.color;
    if (hpFillEl)
        hpFillEl.style.background = JADE_MAGE_META.color;
}
