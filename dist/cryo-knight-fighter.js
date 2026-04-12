import { Fighter, state } from "./fighter.js";
import { drawCryoKnight } from "./cryo-knight-draw.js";
export class CryoKnightFighter extends Fighter {
    constructor(x, y, hpFillId, isFacingRight, particles, damageTexts) {
        super(x, y, "#4ac8e8", hpFillId, isFacingRight, true, particles, damageTexts);
        this.ambFrost = [];
        this.cryoTrails = [];
        this.cryoParts = [];
        this.frostNova = null;
        this.frostPoint = null;
        this.capePh = Math.random() * Math.PI * 2;
        this.charType = "cryo_knight";
        this.equippedWeaponVisual = "sword";
        for (let i = 0; i < 14; i++) {
            this.ambFrost.push({
                a: Math.random() * Math.PI * 2,
                d: 5 + Math.random() * 16,
                off: 8 + Math.random() * 18,
                op: 0.45 + Math.random() * 0.45,
                sz: 0.8 + Math.random() * 1.4,
            });
        }
    }
    updateAI(gameOver) {
        // Reuse tested knight AI profile while preserving cryo visuals.
        const keep = this.charType;
        this.charType = "knight";
        super.updateAI(gameOver);
        this.charType = keep;
        const bladeActive = this.fighterState === "attacking" || this.fighterState === "charging";
        this.advanceCryoVfx(bladeActive);
    }
    performAttack() {
        super.performAttack();
        const tipX = this.x + (this.isFacingRight ? 56 : -56);
        const tipY = this.y - 58;
        this.frostNova = { x: tipX, y: tipY, r: 10, maxR: 66, alpha: 1 };
        this.frostPoint = { x: tipX, y: tipY, r: 14, life: 1 };
        state.screenShake = Math.max(state.screenShake, 10);
        for (let i = 0; i < 16; i++) {
            this.cryoParts.push({
                x: tipX,
                y: tipY,
                vx: (Math.random() - 0.5) * 2.4,
                vy: -Math.random() * 1.8,
                life: 0.8 + Math.random() * 0.4,
                sz: 0.8 + Math.random() * 1.1,
                cy: true,
            });
        }
    }
    takeDamage(amount, attackerColor) {
        super.takeDamage(amount, attackerColor);
        this.frostPoint = { x: this.x, y: this.y - 58, r: 16, life: 0.95 };
        for (let i = 0; i < 12; i++) {
            this.cryoParts.push({
                x: this.x,
                y: this.y - 55,
                vx: (Math.random() - 0.5) * 1.9,
                vy: -Math.random() * 1.4,
                life: 0.6 + Math.random() * 0.5,
                sz: 0.7 + Math.random() * 0.9,
                cy: true,
            });
        }
    }
    draw(ctx, gameTime) {
        const attacking = this.fighterState === "attacking" || this.fighterState === "charging";
        const breath = this.fighterState === "death" ? 0 : Math.sin(gameTime * 0.12) * 1.6;
        const armAng = attacking
            ? -1.02 + Math.sin(gameTime * 0.35) * 0.12
            : -0.24 + Math.sin(gameTime * 0.08) * 0.05;
        const jumpY = this.fighterState === "charging"
            ? Math.sin(gameTime * 0.25) * -2.4
            : 0;
        const thrustX = attacking ? (this.isFacingRight ? 9 : -9) : 0;
        const shakeX = this.hitTimer > 0 ? (Math.random() - 0.5) * 2 : 0;
        const eyeGlow = attacking
            ? 1.16
            : this.fighterState === "victory"
                ? 1.05
                : 0.86 + Math.sin(gameTime * 0.08) * 0.08;
        if (this.hitTimer > 0)
            this.hitTimer--;
        drawCryoKnight(ctx, this.x, this.y, 1, this.isFacingRight, this.fighterState, this.stateTimer, armAng, breath, jumpY, thrustX, shakeX, this.capePh, eyeGlow, gameTime, this.ambFrost, this.cryoTrails, this.cryoParts, this.frostNova, this.frostPoint);
    }
    advanceCryoVfx(bladeActive) {
        this.capePh += 0.08;
        for (const p of this.ambFrost) {
            p.a += 0.02 + p.sz * 0.008;
            p.off += Math.sin(this.capePh + p.d * 0.12) * 0.12;
            if (Math.random() < 0.08) {
                p.op = Math.max(0.35, Math.min(1, p.op + (Math.random() - 0.5) * 0.12));
            }
        }
        if (bladeActive && Math.random() < 0.65) {
            const sx = this.x + (this.isFacingRight ? 58 : -58);
            const sy = this.y - 57 + (Math.random() - 0.5) * 6;
            this.cryoTrails.push({
                x: sx,
                y: sy,
                r: 5 + Math.random() * 5,
                w: 1.4 + Math.random() * 1.3,
                aa: Math.random() * Math.PI * 2,
                as: 0.6 + Math.random() * 0.35,
                life: 1,
                light: Math.random() < 0.45,
            });
        }
        if (Math.random() < 0.18) {
            this.cryoParts.push({
                x: this.x + (Math.random() - 0.5) * 22,
                y: this.y - 70 + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 0.9,
                vy: -Math.random() * 0.7,
                life: 0.45 + Math.random() * 0.35,
                sz: 0.55 + Math.random() * 0.7,
                cy: Math.random() < 0.7,
            });
        }
        for (let i = this.cryoTrails.length - 1; i >= 0; i--) {
            const t = this.cryoTrails[i];
            t.life -= 0.06;
            if (t.life <= 0)
                this.cryoTrails.splice(i, 1);
        }
        for (let i = this.cryoParts.length - 1; i >= 0; i--) {
            const p = this.cryoParts[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.02;
            p.life -= 0.05;
            if (p.life <= 0)
                this.cryoParts.splice(i, 1);
        }
        if (this.frostNova) {
            this.frostNova.r += 5;
            this.frostNova.alpha -= 0.05;
            if (this.frostNova.alpha <= 0 || this.frostNova.r > this.frostNova.maxR)
                this.frostNova = null;
        }
        if (this.frostPoint) {
            this.frostPoint.r += 1.6;
            this.frostPoint.life -= 0.06;
            if (this.frostPoint.life <= 0)
                this.frostPoint = null;
        }
    }
}
