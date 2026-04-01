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
    bright: "#69ffb8",
    deep: "#00a96a",
    dark: "#0d2e1f",
    robe: "#113a2a",
    staff: "#6c4c2c",
    glow: "rgba(0,232,132,0.65)",
    glowSoft: "rgba(0,232,132,0.25)",
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
    getUltimateCharge() {
        return this.ultimateCharge;
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
        this.charType = "jade_mage";
        this.equippedWeaponVisual = "staff";
    }
    updateAI(gameOver) {
        if (this.hp <= 0 || gameOver) {
            this.animation.update({ moving: false, casting: false, ultimate: false, hit: false, dead: true });
            return;
        }
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
        ctx.imageSmoothingEnabled = false;
        ctx.translate(this.x, this.y);
        if (!this.isFacingRight)
            ctx.scale(-1, 1);
        const bob = Math.sin(gameTime * 0.12) * 2;
        const walkSwing = this.animation.state === "walk" ? Math.sin(gameTime * 0.3) * 4 : 0;
        const castGlow = this.animation.state === "attack" || this.animation.state === "ultimate";
        const hitFlash = this.animation.state === "hit";
        ctx.translate(0, bob);
        // Ground shadow
        ctx.fillStyle = "rgba(0,0,0,0.30)";
        ctx.beginPath();
        ctx.ellipse(0, 2, 22, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        // Back robe layer
        ctx.fillStyle = JADE.dark;
        ctx.fillRect(-15, -60, 11, 60);
        // Main robe and trim
        ctx.fillStyle = hitFlash ? "#ffffff" : JADE.robe;
        ctx.fillRect(-12, -60, 27, 60);
        ctx.fillStyle = hitFlash ? "#ffffff" : JADE.deep;
        ctx.fillRect(-12, -62, 27, 4);
        ctx.fillRect(-12, -28, 27, 4);
        // Legs
        ctx.fillStyle = hitFlash ? "#ffffff" : "#0f261c";
        ctx.fillRect(-9, -20, 8, 20 - walkSwing);
        ctx.fillRect(3, -20, 8, 20 + walkSwing);
        // Shoulders and arm base
        ctx.fillStyle = hitFlash ? "#ffffff" : JADE.primary;
        ctx.fillRect(-18, -62, 8, 22);
        ctx.fillRect(14, -60, 8, 24);
        // Neck and head
        ctx.fillStyle = hitFlash ? "#ffffff" : "#d6f6e5";
        ctx.fillRect(-6, -72, 12, 12);
        ctx.fillRect(-9, -90, 18, 20);
        // Jade hood and crown band
        ctx.fillStyle = hitFlash ? "#ffffff" : JADE.primary;
        ctx.fillRect(-10, -98, 20, 10);
        ctx.fillStyle = hitFlash ? "#ffffff" : JADE.bright;
        ctx.fillRect(-10, -90, 20, 4);
        // Eyes
        ctx.fillStyle = "#083d2c";
        ctx.fillRect(-6, -84, 4, 3);
        ctx.fillRect(2, -84, 4, 3);
        // Staff arm
        ctx.fillStyle = hitFlash ? "#ffffff" : JADE.primary;
        ctx.fillRect(-22, -62, 9, 30);
        // Staff body
        ctx.fillStyle = JADE.staff;
        ctx.fillRect(-28, -102, 5, 82);
        // Staff jade gem and cast orb
        const pulse = 0.5 + Math.sin(gameTime * 0.2) * 0.5;
        ctx.shadowColor = JADE.primary;
        ctx.shadowBlur = castGlow ? 30 : 18;
        ctx.fillStyle = hitFlash ? "#ffffff" : JADE.bright;
        ctx.beginPath();
        ctx.arc(-26, -106, 9 + pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();
        if (castGlow) {
            ctx.fillStyle = JADE.glow;
            ctx.beginPath();
            ctx.arc(20, -50, this.animation.state === "ultimate" ? 16 : 11, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    releaseAttack(type) {
        this.attacks.commitAttack(type);
        const def = this.attacks.getDefinition(type);
        this.attackCooldown = def.cooldownFrames;
        const dir = this.isFacingRight ? 1 : -1;
        const spawnX = this.x + dir * 22;
        const spawnY = this.y - 54;
        const damageScale = 1 + Math.max(0, this.playerAtk - 1) * 0.16;
        const scaledDamage = Math.floor(def.damage * damageScale);
        if (type === "ultimate") {
            this.spawnUltimateProjectiles(spawnX, spawnY, dir, scaledDamage, def);
            state.screenShake = 14;
            return;
        }
        this.projectiles.push({
            x: spawnX,
            y: spawnY,
            vx: def.projectileSpeed * dir,
            vy: type === "critical" ? -0.12 : 0,
            radius: def.projectileRadius,
            life: 95,
            damage: scaledDamage,
            type,
            color: type === "critical" ? JADE.bright : JADE.primary,
        });
        const burstCount = type === "critical" ? 16 : 8;
        for (let i = 0; i < burstCount; i++) {
            this.particles.push(new Particle(spawnX, spawnY, JADE.primary, type === "critical" ? 2.1 : 1.4));
        }
    }
    spawnUltimateProjectiles(x, y, dir, damage, def) {
        // A wide emerald volley makes ultimate visually distinct and easier to read.
        const spread = [-0.22, 0, 0.22];
        for (const ang of spread) {
            this.projectiles.push({
                x,
                y,
                vx: (def.projectileSpeed + 1.4) * dir,
                vy: ang * 4,
                radius: def.projectileRadius,
                life: 120,
                damage,
                type: "ultimate",
                color: JADE.bright,
            });
        }
        for (let i = 0; i < 28; i++) {
            this.particles.push(new Particle(x, y, JADE.primary, 2.8));
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
            if (p.life % 3 === 0) {
                this.particles.push(new Particle(p.x, p.y, p.color, p.type === "ultimate" ? 1.9 : 1.2));
            }
            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }
            const hit = Math.abs(p.x - this.opponent.x) < (30 + p.radius) &&
                Math.abs(p.y - (this.opponent.y - 55)) < (40 + p.radius);
            if (!hit)
                continue;
            this.opponent.takeDamage(p.damage, p.color);
            const impactBurst = p.type === "ultimate" ? 42 : p.type === "critical" ? 26 : 14;
            for (let k = 0; k < impactBurst; k++) {
                this.particles.push(new Particle(this.opponent.x, this.opponent.y - 58, p.color, p.type === "ultimate" ? 3.2 : 2.0));
            }
            if (p.type === "ultimate") {
                state.screenShake = 20;
            }
            else if (p.type === "critical") {
                state.screenShake = Math.max(state.screenShake, 10);
            }
            this.projectiles.splice(i, 1);
        }
    }
    drawProjectiles(ctx, gameTime) {
        for (const p of this.projectiles) {
            const pulse = 0.7 + Math.sin((gameTime + p.x) * 0.15) * 0.3;
            ctx.save();
            ctx.globalAlpha = p.type === "ultimate" ? 0.85 : 0.9;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.type === "ultimate" ? 32 : p.type === "critical" ? 22 : 14;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
            ctx.fill();
            if (p.type !== "normal") {
                ctx.fillStyle = JADE.glowSoft;
                ctx.beginPath();
                ctx.arc(p.x - p.vx * 0.8, p.y - p.vy * 0.8, p.radius * 1.7, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
}
export function drawJadeMagePreview(ctx, cx, by, bob = 0, gameTick = 0) {
    ctx.save();
    ctx.translate(cx, by + bob);
    const pulse = 0.5 + Math.sin(gameTick * 0.06) * 0.5;
    ctx.fillStyle = "rgba(0,0,0,0.30)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = JADE.dark;
    ctx.fillRect(-14, -62, 10, 62);
    ctx.fillStyle = JADE.robe;
    ctx.fillRect(-12, -62, 26, 62);
    ctx.fillStyle = JADE.deep;
    ctx.fillRect(-12, -64, 26, 4);
    ctx.fillRect(-12, -30, 26, 4);
    ctx.fillStyle = "#d6f6e5";
    ctx.fillRect(-8, -89, 16, 20);
    ctx.fillStyle = JADE.primary;
    ctx.fillRect(-10, -98, 20, 10);
    ctx.fillRect(-20, -64, 8, 30);
    ctx.fillRect(14, -60, 8, 24);
    ctx.fillStyle = JADE.staff;
    ctx.fillRect(-26, -103, 5, 83);
    ctx.shadowBlur = 18 + pulse * 18;
    ctx.shadowColor = JADE.primary;
    ctx.fillStyle = JADE.bright;
    ctx.beginPath();
    ctx.arc(-24, -108, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
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
