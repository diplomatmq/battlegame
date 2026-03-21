import { Fighter, state as globalState } from "./fighter.js";
import { Particle, DamageText } from "./particles.js";

interface Trail {
  x: number;
  y: number;
  r: number;
  aa: number;
  as: number;
  life: number;
  dec: number;
  w: number;
  light: boolean;
}

interface DPart {
  x: number;
  y: number;
  vx: number;
  vy: number;
  sz: number;
  life: number;
  ml: number;
  cy: boolean;
}

interface AmbFrost {
  a: number;
  d: number;
  s: number;
  sz: number;
  op: number;
  off: number;
}

interface FrostNova {
  x: number;
  y: number;
  r: number;
  maxR: number;
  speed: number;
  alpha: number;
}

interface FrostPoint {
  x: number;
  y: number;
  life: number;
  r: number;
}

export class CryoKnightFighter extends Fighter {
  // Animation progress
  private atkProg = 0;
  private lightAtkProg = 0;
  private thrustProg = 0;
  private jumpProg = 0;

  // Transforms
  private jumpY = 0;
  private thrustX = 0;
  private shakeX = 0;
  private breath = 0;
  private capePh = Math.random() * 10;
  private eyeGlow = 1;
  private armAng = 0.14;
  private time = 0;

  // VFX
  private cryoTrails: Trail[] = [];
  private cryoParts: DPart[] = [];
  private ambFrost: AmbFrost[] = [];
  private frostNova: FrostNova | null = null;
  private frostPoint: FrostPoint | null = null;
  private novaSpawned = false;
  private scale = 1.5;

  constructor(
    x: number, y: number,
    color: string, hpFillId: string,
    isFacingRight: boolean,
    particles: Particle[],
    damageTexts: DamageText[],
  ) {
    super(x, y, color, hpFillId, isFacingRight, true, particles, damageTexts);
    this.charType = "cryo_knight";
    this.hp = 1200;
    this.maxHp = 1200;

    for (let i = 0; i < 10; i++) this.ambFrost.push(this._newAmb());
  }

  private _newAmb(): AmbFrost {
    return {
      a: Math.random() * 6.28,
      d: 2 + Math.random() * 14,
      s: 0.3 + Math.random() * 0.7,
      sz: 0.4 + Math.random() * 1.4,
      op: 0.08 + Math.random() * 0.2,
      off: Math.random() * 50
    };
  }

  private isBusy(): boolean {
    return ["ATTACK", "LIGHT_ATK", "THRUST", "JUMP_CRIT"].includes(this.fighterState.toUpperCase());
  }

  // --- AI Actions ---
  private playAttack() {
    this.fighterState = "ATTACK" as any;
    this.stateTimer = 40;
    this.atkProg = 0;
  }

  private playLightAtk() {
    this.fighterState = "LIGHT_ATK" as any;
    this.stateTimer = 30;
    this.lightAtkProg = 0;
  }

  private playThrust() {
    this.fighterState = "THRUST" as any;
    this.stateTimer = 35;
    this.thrustProg = 0;
    this.thrustX = 0;
    this.frostPoint = null;
  }

  private playJumpCrit() {
    this.fighterState = "JUMP_CRIT" as any;
    this.stateTimer = 80;
    this.jumpProg = 0;
    this.jumpY = 0;
    this.frostNova = null;
    this.novaSpawned = false;
  }

  override updateAI(gameOver: boolean): void {
    if (this.hp <= 0 || gameOver) return;

    const dt = 1 / 60; // Assuming 60fps for internal logic consistency
    this.time += dt;
    this.capePh += dt;

    const dist = Math.abs(this.x - this.opponent.x);
    if (!this.isBusy()) {
      this.isFacingRight = this.opponent.x > this.x;
    }

    // AI Logic
    if (!this.isBusy()) {
      if (this.attackCooldown > 0) {
        this.attackCooldown--;
        // Idle/Movement logic
        this.breath = Math.sin(this.time * 2) * 1.5;
        this.eyeGlow = 0.65 + Math.sin(this.time * 1.5) * 0.15;
        this.armAng = 0.14 + Math.sin(this.time) * 0.04;
        this.shakeX = 0; this.jumpY = 0; this.thrustX = 0;

        // Move towards or away
        if (dist > 300) {
            this.x += (this.opponent.x > this.x ? 1 : -1) * 2;
        } else if (dist < 100) {
            this.x += (this.opponent.x > this.x ? -1 : 1) * 1.5;
        }
      } else {
        // Choose attack based on distance
        if (dist > 250) {
          if (Math.random() < 0.6) this.playJumpCrit();
          else this.playThrust();
        } else if (dist > 120) {
          if (Math.random() < 0.7) this.playThrust();
          else this.playLightAtk();
        } else {
          if (Math.random() < 0.5) this.playAttack();
          else this.playLightAtk();
        }
        this.attackCooldown = 80 + Math.random() * 40;
      }
    }

    this._updateStates(dt);
    this._updateVFX(dt);

    // Sync with base Fighter fields if needed
    // this.x = Math.max(50, Math.min(850, this.x)); // Already handled in Fighter if we call super or similar
  }

  private _updateStates(dt: number) {
    const s = this.fighterState.toUpperCase();
    if (s === "ATTACK") {
      this.atkProg += dt / 0.55;
      const p = this.atkProg;
      if (p < 0.18) {
        const t = this._ei(p / 0.18);
        this.armAng = 0.14 + t * (-2.5 - 0.14);
      } else if (p < 0.42) {
        const t = this._eo((p - 0.18) / 0.24);
        this.armAng = -2.5 + t * (1.4 + 2.5);
        this._emitTrail();
        this.eyeGlow = 1.2;
        if (p > 0.3 && p < 0.35) this._checkHit(130, 80);
      } else if (p < 1) {
        const t = this._ss((p - 0.42) / 0.58);
        this.armAng = 1.4 + t * (0.14 - 1.4);
        this.eyeGlow = 1.2 - t * 0.55;
      } else {
        this.armAng = 0.14;
        this.fighterState = "idle";
      }
    } else if (s === "LIGHT_ATK") {
      this.lightAtkProg += dt / 0.40;
      const p = this.lightAtkProg;
      if (p < 0.12) {
        const t = this._ei(p / 0.12);
        this.armAng = 0.14 + t * (-1.15 - 0.14);
        this.eyeGlow = 0.8 + t * 0.35;
      } else if (p < 0.55) {
        const t = this._eo((p - 0.12) / 0.43);
        this.armAng = -1.15 + t * (2.4 + 1.15);
        this.eyeGlow = 1.2;
        this._emitLightTrail();
        this.x += (this.isFacingRight ? 1 : -1) * 1.5; // step in
        if (p > 0.2 && p < 0.25) this._checkHit(100, 50);
      } else if (p < 1) {
        const t = this._ss((p - 0.55) / 0.45);
        this.armAng = 2.4 + t * (0.14 - 2.4);
        this.eyeGlow = 1.2 - t * 0.58;
      } else {
        this.armAng = 0.14;
        this.fighterState = "idle";
      }
    } else if (s === "THRUST") {
      this.thrustProg += dt / 0.50;
      const p = this.thrustProg;
      if (p < 0.22) {
        const t = this._ei(p / 0.22);
        this.armAng = 0.14 + t * (-0.6 - 0.14);
        this.thrustX = -t * 14;
        this.eyeGlow = 0.8 + t * 0.32;
      } else if (p < 0.52) {
        const t = this._eo((p - 0.22) / 0.30);
        this.armAng = -0.6 + t * (1.55 + 0.6);
        const lunge = t * 80; // 80px lunge
        this.thrustX = -14 + lunge;
        this.x += (this.isFacingRight ? 1 : -1) * (lunge * 0.1); // Moving the physical X too
        this.eyeGlow = 1.3;
        if (t > 0.55 && !this.frostPoint) {
          const sc = this.scale;
          const dir = this.isFacingRight ? 1 : -1;
          const ang = 1.55;
          const tipX = this.x + this.thrustX + (20 * sc + Math.sin(ang) * 90 * sc) * dir;
          const tipY = this.y + this.breath + (-88 * sc + Math.cos(ang) * 90 * sc);
          this.frostPoint = { x: tipX, y: tipY, life: 1, r: 20 * sc };
          this._checkHit(160, 100);
        }
      } else if (p < 1) {
        const t = this._ss((p - 0.52) / 0.48);
        this.armAng = 1.55 + t * (0.14 - 1.55);
        this.thrustX = 66 * (1 - t);
        this.eyeGlow = 1.3 - t * 0.65;
      } else {
        this.armAng = 0.14;
        this.thrustX = 0;
        this.fighterState = "idle";
      }
    } else if (s === "JUMP_CRIT") {
      this.jumpProg += dt / 1.30;
      const p = this.jumpProg;
      const sc = this.scale;
      if (p < 0.25) {
        const t = this._eo(p / 0.25);
        this.jumpY = -t * 105 * sc;
        this.armAng = 0.14 + t * (-2.0 - 0.14);
        this.eyeGlow = 0.9 + t * 0.35;
        this.x += (this.isFacingRight ? 1 : -1) * 2.5; // leap forward
      } else if (p < 0.50) {
        this.jumpY = -105 * sc;
        this.armAng = -2.0;
        this.eyeGlow = 1.25;
      } else if (p < 0.65) {
        const t = this._ei((p - 0.50) / 0.15);
        this.jumpY = -105 * sc * (1 - t);
        this.armAng = -2.0 + t * (1.9 + 2.0);
        this.eyeGlow = 1.4;
        this.x += (this.isFacingRight ? 1 : -1) * 2; // slam forward
      } else if (p < 0.70) {
        this.jumpY = 0;
        if (!this.novaSpawned) {
          this.novaSpawned = true;
          this.frostNova = { x: this.x, y: this.y, r: 6 * sc, maxR: 120 * sc, speed: 185 * sc, alpha: 1 };
          globalState.screenShake = 20;
          this._checkHit(200, 150);
          for (let i = 0; i < 22; i++) {
            const ang = Math.random() * Math.PI * 2, spd = 1.0 + Math.random() * 3.0;
            this.cryoParts.push({
              x: this.x + (Math.random() - 0.5) * 10 * sc, y: this.y,
              vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd * 0.3 - 1.8,
              sz: 1.0 + Math.random() * 3.4, life: 1, ml: 0.45 + Math.random() * 0.55, cy: true
            });
          }
        }
        this.shakeX = Math.sin(this.time * 68) * 6 * sc * Math.max(0, 1 - (p-0.65) / 0.05);
        this.armAng = 1.9; this.eyeGlow = 1.4;
      } else if (p < 1) {
        const t = this._ss((p - 0.70) / 0.30);
        this.armAng = 1.9 + t * (0.14 - 1.9);
        this.eyeGlow = 1.4 - t * 0.78;
        this.shakeX = 0; this.jumpY = 0;
      } else {
        this.armAng = 0.14; this.jumpY = 0; this.shakeX = 0;
        this.fighterState = "idle";
      }
    }
  }

  private _checkHit(range: number, damage: number) {
    const dist = Math.abs(this.x - this.opponent.x);
    if (dist < range && this.opponent.hp > 0) {
       this.opponent.takeDamage(damage, this.color);
    }
  }

  private _updateVFX(dt: number) {
    for (let i = this.cryoTrails.length - 1; i >= 0; i--) {
      this.cryoTrails[i].life -= dt * this.cryoTrails[i].dec;
      if (this.cryoTrails[i].life <= 0) this.cryoTrails.splice(i, 1);
    }
    for (let i = this.cryoParts.length - 1; i >= 0; i--) {
      const p = this.cryoParts[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.016;
      p.life -= dt / p.ml;
      if (p.life <= 0) this.cryoParts.splice(i, 1);
    }
    for (const p of this.ambFrost) p.a += p.s * dt;
    if (this.frostNova) {
      this.frostNova.r += this.frostNova.speed * dt;
      this.frostNova.alpha = Math.max(0, 1 - this.frostNova.r / this.frostNova.maxR);
      if (this.frostNova.alpha <= 0) this.frostNova = null;
    }
    if (this.frostPoint) {
      this.frostPoint.life -= dt * 2.2;
      if (this.frostPoint.life <= 0) this.frostPoint = null;
    }
  }

  // --- Easing ---
  private _ei(t: number) { return t * t; }
  private _eo(t: number) { return 1 - (1 - t) * (1 - t); }
  private _ss(t: number) { return t * t * (3 - 2 * t); }

  // --- Trail Emitters ---
  private _emitTrail() {
    const s = this.scale, sX = 20, sY = -88, reach = 90;
    const tLX = sX + Math.sin(this.armAng) * reach, tLY = sY + Math.cos(this.armAng) * reach;
    const dir = this.isFacingRight ? 1 : -1;
    const wx = this.x + this.shakeX + tLX * s * dir, wy = this.y + this.breath + tLY * s + this.jumpY;
    for (let i = 0; i < 2 + (Math.random() * 2 | 0); i++) this.cryoTrails.push({
      x: wx + (Math.random() - 0.5) * 12 * s, y: wy + (Math.random() - 0.5) * 12 * s,
      r: (8 + Math.random() * 18) * s, aa: this.armAng * dir, as: 0.4 + Math.random() * 0.6,
      life: 1, dec: 1.8 + Math.random(), w: (1.5 + Math.random() * 3) * s, light: false
    });
  }

  private _emitLightTrail() {
    const s = this.scale, sX = 20, sY = -88, reach = 90;
    const tLX = sX + Math.sin(this.armAng) * reach, tLY = sY + Math.cos(this.armAng) * reach;
    const dir = this.isFacingRight ? 1 : -1;
    const wx = this.x + this.shakeX + tLX * s * dir, wy = this.y + this.breath + tLY * s + this.jumpY;
    for (let i = 0; i < 3 + (Math.random() * 3 | 0); i++) this.cryoTrails.push({
      x: wx + (Math.random() - 0.5) * 32 * s, y: wy + (Math.random() - 0.5) * 22 * s,
      r: (22 + Math.random() * 32) * s, aa: this.armAng * dir + (Math.random() - 0.5) * 0.55,
      as: 0.85 + Math.random() * 0.75, life: 1, dec: 2.6 + Math.random() * 1.5,
      w: (0.5 + Math.random() * 1.5) * s, light: true
    });
  }

  // --- DRAWING ---
  override draw(ctx: CanvasRenderingContext2D, _gameTime: number): void {
    this._shadow(ctx);
    if (this.frostNova) this._drawFrostNova(ctx);

    ctx.save();
    const fDir = this.isFacingRight ? 1 : -1;
    const dx = this.x + this.shakeX + this.thrustX;
    const dy = this.y;
    const s = this.scale;
    const br = (this.fighterState === "death") ? 0 : this.breath;

    ctx.translate(dx, dy + br + this.jumpY);
    if (this.fighterState === "death") {
      ctx.globalAlpha = Math.max(0, 1 - (this.stateTimer / 100)); // Simplified fade
      ctx.rotate(1.45 * fDir);
    }
    if (!this.isFacingRight) ctx.scale(-1, 1);
    ctx.scale(s, s);

    // Hit flash
    if (this.hitTimer > 0) {
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#fff";
      this.hitTimer--;
    }

    this._cape(ctx);
    this._backArm(ctx);
    this._legs(ctx);
    this._torso(ctx);
    this._head(ctx);
    this._shield(ctx);
    this._swordArm(ctx);

    /* victory: sword-ground glow ring drawn in char-space */
    if (this.fighterState === "victory") {
      ctx.save();
      ctx.globalAlpha = (0.14 + Math.sin(this.time * 1.6) * 0.06);
      ctx.strokeStyle = "rgba(74,200,232,.5)"; ctx.lineWidth = 1.4;
      ctx.shadowColor = "#4ac8e8"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.ellipse(30, 1, 18, 4.5, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    this._drawTrails(ctx);
    this._drawDP(ctx);
    if (this.frostPoint) this._drawFrostPoint(ctx);
  }

  private _shadow(c: CanvasRenderingContext2D) {
    c.save();
    let alpha = (this.fighterState === "death") ? 0.1 : 0.22;
    if (this.jumpY < 0) alpha *= Math.max(0.08, 1 - Math.abs(this.jumpY) / (105 * this.scale) * 0.8);
    c.globalAlpha = alpha;
    const s = this.scale;
    const sx = this.x + this.thrustX;
    c.fillStyle = "#000"; c.beginPath(); c.ellipse(sx, this.y + 2, 28 * s, 5 * s, 0, 0, 6.283); c.fill();
    c.restore();
  }

  private _cape(c: CanvasRenderingContext2D) {
    c.save(); const t = this.capePh;
    const w1 = Math.sin(t * 1.5) * 4, w2 = Math.sin(t * 2.2 + 0.7) * 3, w3 = Math.sin(t * 1.8 + 1.3) * 5;
    c.beginPath(); c.moveTo(-16, -92); c.lineTo(4, -90);
    c.quadraticCurveTo(6 + w1 * 0.5, -60, 3 + w2 * 0.5, -20);
    const tts: [number, number][] = [[3 + w2 * 0.5, -8 + Math.sin(t * 2) * 2], [-2 + w3 * 0.3, -15 + Math.sin(t * 1.7 + 1) * 3],
    [-8 + w1 * 0.3, -4 + Math.sin(t * 2.3 + 2) * 2], [-14 + w2 * 0.2, -13 + Math.sin(t * 1.9 + 3) * 3],
    [-20 + w3 * 0.3, -2 + Math.sin(t * 2.1 + 4) * 2], [-26 + w1 * 0.4, -11 + Math.sin(t * 1.6 + 5) * 3],
    [-30 + w2 * 0.5, -5 + Math.sin(t * 2.4 + 6) * 2]];
    for (const p of tts) c.lineTo(p[0], p[1]);
    c.quadraticCurveTo(-28 + w3 * 0.5, -50, -16, -92); c.closePath();
    const g = c.createLinearGradient(-15, -92, -10, -5);
    g.addColorStop(0, "#0d0d22"); g.addColorStop(0.7, "#080816"); g.addColorStop(1, "#050510");
    c.fillStyle = g; c.fill(); c.strokeStyle = "rgba(28,28,55,.55)"; c.lineWidth = 0.5; c.stroke();
    c.strokeStyle = "rgba(22,22,45,.35)"; c.lineWidth = 0.4;
    c.beginPath(); c.moveTo(-8, -85); c.quadraticCurveTo(-10 + w1 * 0.3, -50, -12 + w2 * 0.3, -15); c.stroke();
    c.beginPath(); c.moveTo(-3, -88); c.quadraticCurveTo(-5 + w2 * 0.2, -55, -8 + w1 * 0.2, -10); c.stroke();
    c.restore();
  }

  private _backArm(c: CanvasRenderingContext2D) {
    c.save();
    c.beginPath(); c.moveTo(-20, -88); c.lineTo(-26, -86); c.lineTo(-30, -66); c.lineTo(-24, -64); c.closePath();
    c.fillStyle = "#0b0b1a"; c.fill(); c.strokeStyle = "#181832"; c.lineWidth = 0.45; c.stroke();
    c.beginPath(); c.moveTo(-27, -66); c.lineTo(-33, -64); c.lineTo(-35, -46); c.lineTo(-29, -44); c.closePath();
    c.fillStyle = "#0d0d1e"; c.fill(); c.strokeStyle = "#181832"; c.lineWidth = 0.45; c.stroke();
    c.beginPath(); c.ellipse(-22, -89, 8, 6, -0.2, Math.PI, 0); c.closePath();
    c.fillStyle = "#151530"; c.fill(); c.strokeStyle = "#28284e"; c.lineWidth = 0.55; c.stroke();
    c.beginPath(); c.moveTo(-28, -88); c.quadraticCurveTo(-22, -96, -16, -88); c.strokeStyle = "#222245"; c.lineWidth = 0.4; c.stroke();
    c.restore();
  }

  private _legs(c: CanvasRenderingContext2D) {
    c.save();
    const L = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, f: string) => {
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.lineTo(x4, y4); c.closePath();
      c.fillStyle = f; c.fill(); c.strokeStyle = "#181832"; c.lineWidth = 0.4; c.stroke()
    };
    L(-14, -53, -5, -53, -7, -30, -16, -30, "#09091a"); L(-16, -30, -7, -30, -6, -6, -17, -6, "#0b0b1d");
    L(-17, -6, -6, -6, -4, 0, -19, 0, "#070712");
    L(5, -53, 14, -53, 16, -30, 7, -30, "#09091a"); L(7, -30, 16, -30, 17, -6, 6, -6, "#0b0b1d");
    L(6, -6, 17, -6, 19, 0, 4, 0, "#070712");
    c.fillStyle = "#121228"; c.strokeStyle = "#26264a"; c.lineWidth = 0.45;
    c.beginPath(); c.ellipse(-11, -30, 5, 3.5, 0, 0, 6.283); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(11, -30, 5, 3.5, 0, 0, 6.283); c.fill(); c.stroke();
    c.restore();
  }

  private _torso(c: CanvasRenderingContext2D) {
    c.save();
    c.beginPath(); c.moveTo(-20, -90); c.lineTo(20, -90); c.lineTo(22, -78);
    c.quadraticCurveTo(20, -60, 15, -53); c.lineTo(-15, -53); c.quadraticCurveTo(-20, -60, -22, -78); c.closePath();
    const g = c.createLinearGradient(0, -90, 0, -53);
    g.addColorStop(0, "#101028"); g.addColorStop(0.5, "#0b0b1e"); g.addColorStop(1, "#080816");
    c.fillStyle = g; c.fill(); c.strokeStyle = "#202042"; c.lineWidth = 0.6; c.stroke();
    c.strokeStyle = "#14142c"; c.lineWidth = 0.4;
    c.beginPath(); c.moveTo(-18, -78); c.lineTo(18, -78); c.stroke();
    c.beginPath(); c.moveTo(-16, -66); c.lineTo(16, -66); c.stroke();
    c.beginPath(); c.moveTo(0, -88); c.lineTo(0, -55); c.strokeStyle = "#12122a"; c.lineWidth = 0.3; c.stroke();
    c.fillStyle = "#131128"; c.fillRect(-22, -90, 4, 6); c.fillRect(18, -90, 4, 6);
    c.beginPath(); c.moveTo(-16, -56); c.lineTo(16, -56); c.lineTo(15, -51); c.lineTo(-15, -51); c.closePath();
    c.fillStyle = "#090918"; c.fill(); c.strokeStyle = "#1c1c38"; c.lineWidth = 0.45; c.stroke();
    c.save(); c.shadowColor = "#4ac8e8"; c.shadowBlur = 4 * this.eyeGlow;
    c.fillStyle = `rgba(55,165,210,${0.32 * this.eyeGlow})`;
    c.beginPath(); c.moveTo(0, -56); c.lineTo(3, -53.5); c.lineTo(0, -51); c.lineTo(-3, -53.5); c.closePath(); c.fill(); c.restore();
    c.save(); c.strokeStyle = `rgba(55,155,195,${0.11 * this.eyeGlow})`; c.lineWidth = 0.5;
    c.beginPath(); c.moveTo(-7, -82); c.lineTo(0, -74); c.lineTo(7, -82); c.stroke(); c.restore();
    c.restore();
  }

  private _head(c: CanvasRenderingContext2D) {
    c.save();
    c.fillStyle = "#070712"; c.fillRect(-5, -95, 10, 5);
    c.beginPath(); c.moveTo(-15, -96); c.lineTo(-17, -110); c.lineTo(-15, -120); c.lineTo(-8, -127);
    c.lineTo(0, -130); c.lineTo(8, -127); c.lineTo(15, -120); c.lineTo(17, -110); c.lineTo(15, -96); c.closePath();
    const g = c.createLinearGradient(-17, -130, 17, -96);
    g.addColorStop(0, "#131128"); g.addColorStop(0.4, "#0d0d20"); g.addColorStop(1, "#090916");
    c.fillStyle = g; c.fill(); c.strokeStyle = "#202042"; c.lineWidth = 0.6; c.stroke();
    c.beginPath(); c.moveTo(0, -130); c.lineTo(0, -98); c.strokeStyle = "#181835"; c.lineWidth = 1.1; c.stroke();
    c.beginPath(); c.moveTo(-12, -112); c.lineTo(12, -112); c.lineTo(11, -106); c.lineTo(-11, -106); c.closePath();
    c.fillStyle = "#03030e"; c.fill(); c.strokeStyle = "#181832"; c.lineWidth = 0.45; c.stroke();
    c.save(); c.shadowColor = "#4ac8e8"; c.shadowBlur = 12 * this.eyeGlow;
    c.fillStyle = `rgba(74,200,232,${0.85 * this.eyeGlow})`;
    c.beginPath(); c.ellipse(-5, -109, 3.5, 1.5, 0, 0, 6.283); c.fill();
    c.beginPath(); c.ellipse(5, -109, 3.5, 1.5, 0, 0, 6.283); c.fill();
    c.shadowBlur = 5 * this.eyeGlow; c.fillStyle = `rgba(200,245,255,${0.65 * this.eyeGlow})`;
    c.beginPath(); c.ellipse(-5, -109, 1.6, 0.7, 0, 0, 6.283); c.fill();
    c.beginPath(); c.ellipse(5, -109, 1.6, 0.7, 0, 0, 6.283); c.fill(); c.restore();
    c.save(); c.shadowColor = "rgba(60,170,210,.12)"; c.shadowBlur = 4;
    const horn = (sx: number) => {
      c.beginPath(); c.moveTo(sx * 6, -126); c.lineTo(sx * 10, -142); c.lineTo(sx * 4, -128); c.closePath();
      c.fillStyle = "#151530"; c.fill(); c.strokeStyle = "#282850"; c.lineWidth = 0.4; c.stroke()
    };
    horn(-1); horn(1); c.restore();
    c.beginPath(); c.moveTo(-10, -120); c.lineTo(0, -116); c.lineTo(10, -120); c.strokeStyle = "#181835"; c.lineWidth = 0.4; c.stroke();
    c.restore();
  }

  private _shield(c: CanvasRenderingContext2D) {
    c.save(); c.translate(-33, -58);
    c.beginPath(); c.moveTo(0, -18); c.lineTo(13, -8); c.lineTo(11, 12); c.lineTo(0, 22); c.lineTo(-11, 12); c.lineTo(-13, -8); c.closePath();
    const g = c.createLinearGradient(-13, -18, 13, 22);
    g.addColorStop(0, "#131128"); g.addColorStop(0.5, "#0b0b1e"); g.addColorStop(1, "#070714");
    c.fillStyle = g; c.fill(); c.strokeStyle = "#202040"; c.lineWidth = 0.65; c.stroke();
    c.beginPath(); c.moveTo(0, -15); c.lineTo(10, -6); c.lineTo(9, 10); c.lineTo(0, 19); c.lineTo(-9, 10); c.lineTo(-10, -6); c.closePath();
    c.strokeStyle = "#181835"; c.lineWidth = 0.35; c.stroke();
    c.save(); c.shadowColor = "#4ac8e8"; c.shadowBlur = 5 * this.eyeGlow;
    c.strokeStyle = `rgba(65,175,215,${0.18 * this.eyeGlow})`; c.lineWidth = 0.55; c.translate(0, 2);
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI / 3;
      c.beginPath(); c.moveTo(Math.cos(a) * -6, Math.sin(a) * -6); c.lineTo(Math.cos(a) * 6, Math.sin(a) * 6); c.stroke();
      const ba = a + 0.4, bb = a - 0.4;
      c.beginPath(); c.moveTo(Math.cos(a) * 3, Math.sin(a) * 3); c.lineTo(Math.cos(ba) * 5, Math.sin(ba) * 5);
      c.moveTo(Math.cos(a) * 3, Math.sin(a) * 3); c.lineTo(Math.cos(bb) * 5, Math.sin(bb) * 5); c.stroke()
    }
    c.restore();
    c.fillStyle = `rgba(65,175,215,${0.12 * this.eyeGlow})`; c.beginPath(); c.arc(0, 2, 1.8, 0, 6.283); c.fill();
    c.restore();
  }

  private _swordArm(c: CanvasRenderingContext2D) {
    c.save(); c.translate(20, -88); c.rotate(this.armAng);
    c.beginPath(); c.ellipse(0, 0, 9, 7, 0, Math.PI, 0); c.closePath();
    c.fillStyle = "#171738"; c.fill(); c.strokeStyle = "#282852"; c.lineWidth = 0.55; c.stroke();
    c.beginPath(); c.moveTo(-7, -1); c.quadraticCurveTo(0, -8, 7, -1); c.strokeStyle = "#222246"; c.lineWidth = 0.4; c.stroke();
    const arm = (y1: number, y2: number, f: string) => {
      c.beginPath(); c.moveTo(-4, y1); c.lineTo(4, y1); c.lineTo(4.5, y2); c.lineTo(-4.5, y2); c.closePath();
      c.fillStyle = f; c.fill(); c.strokeStyle = "#181835"; c.lineWidth = 0.4; c.stroke()
    };
    arm(2, 17, "#0b0b1d");
    c.beginPath(); c.ellipse(0, 17, 4.5, 3, 0, 0, 6.283); c.fillStyle = "#121228"; c.fill(); c.strokeStyle = "#26264a"; c.lineWidth = 0.4; c.stroke();
    arm(17, 32, "#0d0d20");
    c.beginPath(); c.moveTo(-4, 32); c.lineTo(4, 32); c.lineTo(3.5, 38); c.lineTo(-3.5, 38); c.closePath();
    c.fillStyle = "#090918"; c.fill(); c.strokeStyle = "#141430"; c.lineWidth = 0.35; c.stroke();
    this._sword(c, 38);
    if (this.fighterState !== "death") this._ambFrostInner(c, 38);
    c.restore();
  }

  private _sword(c: CanvasRenderingContext2D, hy: number) {
    c.save(); c.translate(0, hy);
    c.fillStyle = "#0b0b1a"; c.fillRect(-2, -6, 4, 5);
    c.beginPath(); c.arc(0, -7, 3, 0, 6.283); c.fillStyle = "#111126"; c.fill(); c.strokeStyle = "#262648"; c.lineWidth = 0.4; c.stroke();
    c.beginPath(); c.moveTo(-9, -1); c.lineTo(9, -1); c.lineTo(8, 3); c.lineTo(-8, 3); c.closePath();
    c.fillStyle = "#121228"; c.fill(); c.strokeStyle = "#282850"; c.lineWidth = 0.45; c.stroke();
    c.save(); c.shadowColor = "rgba(75,175,225,.25)"; c.shadowBlur = 3;
    c.fillStyle = `rgba(55,155,195,${0.18 * this.eyeGlow})`;
    c.beginPath(); c.ellipse(-7, 1, 2, 1.4, 0, 0, 6.283); c.fill();
    c.beginPath(); c.ellipse(7, 1, 2, 1.4, 0, 0, 6.283); c.fill(); c.restore();
    const bl = 52;
    const rEdge = [[5, 3], [6, 8], [5.5, 14], [6.5, 20], [5, 26], [6, 32], [5, 38], [4, 44], [2.5, 49], [0, 3 + bl]];
    const lEdge = [[-2.5, 49], [-4, 44], [-5, 38], [-6, 32], [-5, 26], [-6.5, 20], [-5.5, 14], [-6, 8], [-5, 3]];
    const bp = () => { c.beginPath(); c.moveTo(-5, 3); c.lineTo(5, 3); for (const p of rEdge) c.lineTo(p[0] as number, p[1] as number); for (const p of lEdge) c.lineTo(p[0] as number, p[1] as number); c.closePath() };
    c.save(); c.shadowColor = "rgba(75,185,230,.3)"; c.shadowBlur = 10; bp();
    const bg = c.createLinearGradient(-7, 3, 7, 3);
    bg.addColorStop(0, "rgba(48,128,168,.42)"); bg.addColorStop(.2, "rgba(22,55,78,.62)");
    bg.addColorStop(.5, "rgba(28,68,88,.68)"); bg.addColorStop(.8, "rgba(22,55,78,.62)"); bg.addColorStop(1, "rgba(48,128,168,.42)");
    c.fillStyle = bg; c.fill(); c.strokeStyle = "rgba(95,205,242,.32)"; c.lineWidth = 0.55; c.stroke(); c.restore();
    c.save(); c.globalCompositeOperation = "lighter"; bp();
    const lg = c.createLinearGradient(0, 3, 0, 3 + bl);
    lg.addColorStop(0, "rgba(38,115,155,.04)"); lg.addColorStop(.5, "rgba(55,155,195,.07)"); lg.addColorStop(1, "rgba(75,195,235,.1)");
    c.fillStyle = lg; c.fill(); c.restore();
    c.save(); c.strokeStyle = "rgba(135,220,255,.22)"; c.lineWidth = 0.4;
    c.beginPath(); c.moveTo(0, 6); c.lineTo(1.5, 16); c.lineTo(-0.5, 26); c.lineTo(1, 36); c.lineTo(-0.5, 46); c.lineTo(0, 52); c.stroke();
    c.beginPath(); c.moveTo(1.5, 16); c.lineTo(4, 21); c.moveTo(-0.5, 26); c.lineTo(-4, 30);
    c.moveTo(1, 36); c.lineTo(4, 40); c.moveTo(-0.5, 46); c.lineTo(-3, 50); c.stroke();
    c.restore(); c.restore();
  }

  private _ambFrostInner(c: CanvasRenderingContext2D, hy: number) {
    c.save(); c.translate(0, hy + 25);
    for (const p of this.ambFrost) {
      const px = Math.cos(p.a) * p.d, py = Math.sin(p.a) * p.d + (p.off - 25);
      c.globalAlpha = p.op * Math.max(0.15, this.eyeGlow); c.fillStyle = "#80d8f0";
      c.shadowColor = "#4ac8e8"; c.shadowBlur = 3; c.beginPath(); c.arc(px, py, p.sz, 0, 6.283); c.fill()
    }
    c.restore();
  }

  private _drawTrails(c: CanvasRenderingContext2D) {
    for (const t of this.cryoTrails) {
      c.save();
      if (t.light) {
        c.globalAlpha = t.life * 0.36;
        c.strokeStyle = `rgba(188,240,255,${t.life * 0.72})`;
        c.lineWidth = t.w * t.life * 0.75;
        c.shadowColor = "rgba(140,218,248,.45)"; c.shadowBlur = 14;
      } else {
        c.globalAlpha = t.life * 0.42;
        c.strokeStyle = "rgba(155,222,255,.65)";
        c.lineWidth = t.w * t.life;
        c.shadowColor = "rgba(95,195,235,.28)"; c.shadowBlur = 10;
      }
      c.lineCap = "round";
      c.beginPath(); c.arc(t.x, t.y, t.r * t.life, t.aa - t.as, t.aa + t.as); c.stroke();
      c.restore();
    }
  }

  private _drawDP(c: CanvasRenderingContext2D) {
    for (const p of this.cryoParts) {
      c.save(); c.globalAlpha = Math.max(0, p.life);
      const col = p.cy ? "#4ac8e8" : "#28385a";
      c.shadowColor = col; c.shadowBlur = p.cy ? 5 : 2;
      c.fillStyle = col; c.beginPath(); c.arc(p.x, p.y, Math.max(0, p.sz * p.life), 0, 6.283); c.fill();
      c.restore();
    }
  }

  private _drawFrostNova(c: CanvasRenderingContext2D) {
    const n = this.frostNova; if (!n || n.alpha <= 0) return;
    c.save();
    const rw = Math.max(0.5, (1 - n.r / n.maxR) * 4.5 * this.scale);
    c.globalAlpha = n.alpha * 0.82;
    c.strokeStyle = `rgba(100,218,250,${n.alpha})`; c.lineWidth = rw;
    c.shadowColor = "rgba(80,195,238,.75)"; c.shadowBlur = 15;
    c.beginPath(); c.arc(n.x, n.y, n.r, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  private _drawFrostPoint(c: CanvasRenderingContext2D) {
    const fp = this.frostPoint; if (!fp || fp.life <= 0) return;
    c.save();
    const r = fp.r * fp.life;
    c.globalAlpha = fp.life;
    const gr = c.createRadialGradient(fp.x, fp.y, 0, fp.x, fp.y, r);
    gr.addColorStop(0, `rgba(215,250,255,${fp.life * 0.92})`);
    gr.addColorStop(.28, `rgba(82,205,242,${fp.life * 0.65})`);
    gr.addColorStop(.7, `rgba(38,112,158,${fp.life * 0.28})`);
    gr.addColorStop(1, "rgba(18,55,90,0)");
    c.fillStyle = gr; c.shadowColor = "rgba(100,218,255,.88)"; c.shadowBlur = 22;
    c.beginPath(); c.arc(fp.x, fp.y, r, 0, Math.PI * 2); c.fill();
    c.restore();
  }
}
