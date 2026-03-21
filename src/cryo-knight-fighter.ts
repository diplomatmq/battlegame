import { Fighter, state as globalState } from "./fighter.js";
import { Particle, DamageText } from "./particles.js";
import { drawCryoKnight } from "./cryo-knight-draw.js";

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
    this.charType = "knight";
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
    drawCryoKnight(
      ctx, this.x, this.y, this.scale, this.isFacingRight,
      this.fighterState, this.stateTimer, this.armAng, this.breath,
      this.jumpY, this.thrustX, this.shakeX, this.capePh, this.eyeGlow,
      this.time, this.ambFrost, this.cryoTrails, this.cryoParts, this.frostNova, this.frostPoint
    );
  }
}
