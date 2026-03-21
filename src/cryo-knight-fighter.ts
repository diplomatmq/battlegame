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
  override draw(ctx: CanvasRenderingContext2D, gameTime: number): void {
    if (this.hp <= 0) {
      this._drawDeath(ctx);
      return;
    }

    this._drawShadow(ctx);
    if (this.frostNova) this._drawFrostNova(ctx);

    ctx.save();
    const dx = this.x + this.shakeX + this.thrustX;
    const dy = this.y;
    const s = this.scale;
    const br = this.breath;
    
    ctx.translate(dx, dy + br + this.jumpY);
    if (!this.isFacingRight) ctx.scale(-1, 1);
    ctx.scale(s, s);

    // Hit flash
    if (this.hitTimer > 0) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#fff";
        this.hitTimer--;
    }

    this._drawCape(ctx);
    this._drawBackArm(ctx);
    this._drawLegs(ctx);
    this._drawTorso(ctx);
    this._drawHead(ctx);
    this._drawShield(ctx);
    this._drawSwordArm(ctx);

    ctx.restore();

    this._drawVFXLayer(ctx);
    if (this.frostPoint) this._drawFrostPoint(ctx);
  }

  private _drawShadow(ctx: CanvasRenderingContext2D) {
    ctx.save();
    let alpha = 0.22;
    if (this.jumpY < 0) alpha *= Math.max(0.08, 1 - Math.abs(this.jumpY) / (105 * this.scale) * 0.8);
    ctx.globalAlpha = alpha;
    const s = this.scale;
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(this.x + this.thrustX, this.y + 2, 28 * s, 5 * s, 0, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  private _drawCape(ctx: CanvasRenderingContext2D) {
    ctx.save(); const t = this.capePh;
    const w1 = Math.sin(t * 1.5) * 4, w2 = Math.sin(t * 2.2 + 0.7) * 3, w3 = Math.sin(t * 1.8 + 1.3) * 5;
    ctx.beginPath(); ctx.moveTo(-16, -92); ctx.lineTo(4, -90);
    ctx.quadraticCurveTo(6 + w1 * 0.5, -60, 3 + w2 * 0.5, -20);
    const tts: [number, number][] = [[3 + w2 * 0.5, -8 + Math.sin(t * 2) * 2], [-2 + w3 * 0.3, -15 + Math.sin(t * 1.7 + 1) * 3],
      [-8 + w1 * 0.3, -4 + Math.sin(t * 2.3 + 2) * 2], [-14 + w2 * 0.2, -13 + Math.sin(t * 1.9 + 3) * 3],
      [-20 + w3 * 0.3, -2 + Math.sin(t * 2.1 + 4) * 2], [-26 + w1 * 0.4, -11 + Math.sin(t * 1.6 + 5) * 3],
      [-30 + w2 * 0.5, -5 + Math.sin(t * 2.4 + 6) * 2]];
    for (const p of tts) ctx.lineTo(p[0], p[1]);
    ctx.quadraticCurveTo(-28 + w3 * 0.5, -50, -16, -92); ctx.closePath();
    const g = ctx.createLinearGradient(-15, -92, -10, -5);
    g.addColorStop(0, "#0d0d22"); g.addColorStop(0.7, "#080816"); g.addColorStop(1, "#050510");
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = "rgba(28,28,55,0.55)"; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.restore();
  }

  private _drawBackArm(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-20, -88); ctx.lineTo(-26, -86); ctx.lineTo(-30, -66); ctx.lineTo(-24, -64); ctx.closePath();
    ctx.fillStyle = "#0b0b1a"; ctx.fill(); ctx.strokeStyle = "#181832"; ctx.lineWidth = 0.45; ctx.stroke();
    ctx.restore();
  }

  private _drawLegs(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const L = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, f: string) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath();
      ctx.fillStyle = f; ctx.fill(); ctx.strokeStyle = "#181832"; ctx.lineWidth = 0.4; ctx.stroke()};
    L(-14, -53, -5, -53, -7, -30, -16, -30, "#09091a"); L(-16, -30, -7, -30, -6, -6, -17, -6, "#0b0b1d");
    L(5, -53, 14, -53, 16, -30, 7, -30, "#09091a"); L(7, -30, 16, -30, 17, -6, 6, -6, "#0b0b1d");
    ctx.restore();
  }

  private _drawTorso(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-20, -90); ctx.lineTo(20, -90); ctx.lineTo(22, -78);
    ctx.quadraticCurveTo(20, -60, 15, -53); ctx.lineTo(-15, -53); ctx.quadraticCurveTo(-20, -60, -22, -78); ctx.closePath();
    const g = ctx.createLinearGradient(0, -90, 0, -53);
    g.addColorStop(0, "#101028"); g.addColorStop(0.5, "#0b0b1e"); g.addColorStop(1, "#080816");
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = "#202042"; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.restore();
  }

  private _drawHead(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-15, -96); ctx.lineTo(-17, -110); ctx.lineTo(-15, -120); ctx.lineTo(-8, -127);
    ctx.lineTo(0, -130); ctx.lineTo(8, -127); ctx.lineTo(15, -120); ctx.lineTo(17, -110); ctx.lineTo(15, -96); ctx.closePath();
    const g = ctx.createLinearGradient(-17, -130, 17, -96);
    g.addColorStop(0, "#131128"); g.addColorStop(0.4, "#0d0d20"); g.addColorStop(1, "#090916");
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = "#202042"; ctx.lineWidth = 0.6; ctx.stroke();
    
    // Eyes
    ctx.save(); ctx.shadowColor = "#4ac8e8"; ctx.shadowBlur = 12 * this.eyeGlow;
    ctx.fillStyle = `rgba(74,200,232,${0.85 * this.eyeGlow})`;
    ctx.beginPath(); ctx.ellipse(-5, -109, 3.5, 1.5, 0, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -109, 3.5, 1.5, 0, 0, 6.283); ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  private _drawShield(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.translate(-33, -58);
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(13, -8); ctx.lineTo(11, 12); ctx.lineTo(0, 22); ctx.lineTo(-11, 12); ctx.lineTo(-13, -8); ctx.closePath();
    const g = ctx.createLinearGradient(-13, -18, 13, 22);
    g.addColorStop(0, "#131128"); g.addColorStop(0.5, "#0b0b1e"); g.addColorStop(1, "#070714");
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = "#202040"; ctx.lineWidth = 0.65; ctx.stroke();
    ctx.restore();
  }

  private _drawSwordArm(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.translate(20, -88); ctx.rotate(this.armAng);
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 7, 0, Math.PI, 0); ctx.closePath();
    ctx.fillStyle = "#171738"; ctx.fill(); ctx.strokeStyle = "#282852"; ctx.lineWidth = 0.55; ctx.stroke();
    
    // Sword
    ctx.save(); ctx.translate(0, 38);
    ctx.fillStyle = "#0b0b1a"; ctx.fillRect(-2, -6, 4, 5);
    const bl = 52;
    ctx.save(); ctx.shadowColor = "rgba(75,185,230,0.3)"; ctx.shadowBlur = 10;
    const bg = ctx.createLinearGradient(-7, 3, 7, 3);
    bg.addColorStop(0, "rgba(48,128,168,0.42)"); bg.addColorStop(0.5, "rgba(28,68,88,0.68)"); bg.addColorStop(1, "rgba(48,128,168,0.42)");
    ctx.fillStyle = bg; ctx.fillRect(-5, 3, 10, bl); ctx.restore();
    ctx.restore();

    this._drawAmbFrost(ctx, 38);
    ctx.restore();
  }

  private _drawAmbFrost(ctx: CanvasRenderingContext2D, hy: number) {
    ctx.save(); ctx.translate(0, hy + 25);
    for (const p of this.ambFrost) {
      const px = Math.cos(p.a) * p.d, py = Math.sin(p.a) * p.d + (p.off - 25);
      ctx.globalAlpha = p.op * Math.max(0.15, this.eyeGlow); ctx.fillStyle = "#80d8f0";
      ctx.shadowColor = "#4ac8e8"; ctx.shadowBlur = 3; ctx.beginPath(); ctx.arc(px, py, p.sz, 0, 6.283); ctx.fill()}
    ctx.restore();
  }

  private _drawVFXLayer(ctx: CanvasRenderingContext2D) {
    for (const t of this.cryoTrails) {
      ctx.save();
      ctx.globalAlpha = t.light ? t.life * 0.36 : t.life * 0.42;
      ctx.strokeStyle = t.light ? `rgba(188,240,255,${t.life * 0.72})` : "rgba(155,222,255,0.65)";
      ctx.lineWidth = t.w * (t.light ? t.life * 0.75 : t.life);
      ctx.shadowColor = t.light ? "rgba(140,218,248,0.45)" : "rgba(95,195,235,0.28)";
      ctx.shadowBlur = t.light ? 14 : 10;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r * t.life, t.aa - t.as, t.aa + t.as); ctx.stroke();
      ctx.restore();
    }
    for (const p of this.cryoParts) {
      ctx.save(); ctx.globalAlpha = Math.max(0, p.life);
      const col = p.cy ? "#4ac8e8" : "#28385a";
      ctx.shadowColor = col; ctx.shadowBlur = p.cy ? 5 : 2;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0, p.sz * p.life), 0, 6.283); ctx.fill();
      ctx.restore();
    }
  }

  private _drawFrostNova(ctx: CanvasRenderingContext2D) {
    const n = this.frostNova; if (!n || n.alpha <= 0) return;
    ctx.save();
    const rw = Math.max(0.5, (1 - n.r / n.maxR) * 4.5 * this.scale);
    ctx.globalAlpha = n.alpha * 0.82;
    ctx.strokeStyle = `rgba(100,218,250,${n.alpha})`; ctx.lineWidth = rw;
    ctx.shadowColor = "rgba(80,195,238,0.75)"; ctx.shadowBlur = 15;
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  private _drawFrostPoint(ctx: CanvasRenderingContext2D) {
    const fp = this.frostPoint; if (!fp || fp.life <= 0) return;
    ctx.save(); const r = fp.r * fp.life;
    ctx.globalAlpha = fp.life;
    const gr = ctx.createRadialGradient(fp.x, fp.y, 0, fp.x, fp.y, r);
    gr.addColorStop(0, `rgba(215,250,255,${fp.life * 0.92})`);
    gr.addColorStop(1, "rgba(18,55,90,0)");
    ctx.fillStyle = gr; ctx.shadowColor = "rgba(100,218,255,0.88)"; ctx.shadowBlur = 22;
    ctx.beginPath(); ctx.arc(fp.x, fp.y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  private _drawDeath(ctx: CanvasRenderingContext2D) {
     // Minimal death state just to avoid crashing if hp <= 0
     ctx.save();
     ctx.translate(this.x, this.y);
     ctx.rotate(1.45 * (this.isFacingRight ? 1 : -1));
     ctx.scale(this.scale, this.scale);
     this._drawTorso(ctx);
     this._drawHead(ctx);
     ctx.restore();
  }
}
