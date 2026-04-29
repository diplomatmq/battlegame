// fighter.ts — Fighter class: AI, damage, pixel-art draw

import { Particle, DamageText } from "./particles.js";
import { drawCryoKnight } from "./cryo-knight-draw.js";
import * as CharDraw from "./char-draw.js";

// Shared mutable state — use an object so it acts as a reference
export const state = { screenShake: 0 };

export type FighterState =
  | "idle"
  | "moving"
  | "retreating"
  | "attacking"
  | "charging"
  | "casting"
  | "circling"
  | "ultimate_casting"
  | "victory"
  | "death";

// ── Standalone preview renderer (used by character.ts and menu.ts) ───────────
export function drawCharacterPreview(
  ctx: CanvasRenderingContext2D,
  cx: number,
  by: number,
  charType: string,
  color: string,
  bob: number = 0,
  gt: number  = 0,
): void {
  ctx.imageSmoothingEnabled = false;
  const s = 1.0; // scale — callers can ctx.scale before calling
  ctx.save();
  ctx.translate(cx, by + bob);

  if (charType === "cryo_knight") {
    _drawCryoKnightPreview(ctx, gt, s);
  } else if (charType === "scarlet_assassin") {
    CharDraw.drawAssassin(ctx, gt, false, 0, false, color, true);
  } else if (charType === "necromancer") {
    CharDraw.drawNecromancer(ctx, gt, false, 0, false, color);
  } else if (charType === "berserker") {
    CharDraw.drawBerserker(ctx, gt, false, 0, false, color);
  } else if (charType === "goblin") {
    CharDraw.drawGoblin(ctx, gt, false, 0, false, color);
  } else if (charType === "mage") {
    CharDraw.drawMage(ctx, gt, false, 0, false, color);
  } else {
    _drawCryoKnightPreview(ctx, gt, s);
  }

  ctx.restore();
}

function _drawKnightPreview(ctx: CanvasRenderingContext2D, C: string, _s: number): void {
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath(); ctx.ellipse(0, 2, 28, 7, 0, 0, Math.PI*2); ctx.fill();
  // Back leg
  ctx.fillStyle = "#4a3060"; ctx.fillRect(-13, -22, 12, 24);
  // Cape
  ctx.fillStyle = "#8b1a1a"; ctx.globalAlpha = 0.8;
  ctx.fillRect(-18, -58, 11, 40); ctx.globalAlpha = 1;
  // Torso armor
  ctx.fillStyle = C; ctx.fillRect(-14, -62, 30, 44);
  ctx.fillStyle = "#dde0e8"; ctx.fillRect(-10, -58, 22, 30); // chest plate
  ctx.fillStyle = C;
  // Shoulder pads
  ctx.fillStyle = "#ccc"; ctx.fillRect(-19, -64, 11, 13); ctx.fillRect(9, -64, 11, 13);
  // Front leg
  ctx.fillStyle = "#4a3060"; ctx.fillRect(2, -22, 12, 24);
  // Neck + face
  ctx.fillStyle = "#f0c88a"; ctx.fillRect(-7, -74, 14, 14);
  // Helmet
  ctx.fillStyle = C; ctx.fillRect(-12, -90, 24, 20);
  ctx.fillStyle = "#aab"; ctx.fillRect(-10, -78, 20, 9); // visor
  ctx.fillStyle = "#333"; ctx.fillRect(-7, -76, 4, 4); ctx.fillRect(4, -76, 4, 4);
  ctx.fillStyle = "#ccc"; ctx.fillRect(-12, -92, 24, 4); // brim
  // Shield arm
  ctx.fillStyle = C; ctx.fillRect(-26, -62, 12, 34);
  ctx.fillStyle = "#cc2200"; ctx.fillRect(-30, -66, 11, 40); // shield
  ctx.fillStyle = "#ffcc00"; ctx.fillRect(-27, -54, 5, 5);   // emblem
  // Sword arm
  ctx.fillStyle = C; ctx.fillRect(15, -64, 12, 30);
  // Sword
  ctx.fillStyle = "#7a4010"; ctx.fillRect(28, -50, 6, 18);
  ctx.fillStyle = "#cc9900"; ctx.fillRect(22, -56, 18, 6);
  ctx.fillStyle = "#d8d8e8"; // blade
  ctx.beginPath(); ctx.moveTo(27,-88); ctx.lineTo(33,-88); ctx.lineTo(35,-52); ctx.lineTo(25,-52); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.fillRect(29, -86, 2, 34);
}

function _drawCryoKnightPreview(ctx: CanvasRenderingContext2D, gt: number, _s: number): void {
  const ambFrost: { a: number; d: number; off: number; op: number; sz: number }[] = [];
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

  drawCryoKnight(
    ctx,
    0,
    0,
    0.95,
    true,
    "idle",
    0,
    -0.24 + Math.sin(gt * 0.05) * 0.05,
    Math.sin(gt * 0.08) * 1.3,
    0,
    0,
    0,
    gt * 0.08,
    0.9,
    gt,
    ambFrost,
    cryoTrails,
    [],
    null,
    null,
  );
}


export class Fighter {
  x: number; y: number;
  readonly startX: number;
  targetX: number;
  color: string;
  hp: number;
  readonly maxHp: number;
  readonly hpFillId: string;
  isFacingRight: boolean;
  readonly width: number;
  readonly height: number;
  fighterState: FighterState;
  stateTimer: number;
  attackCooldown: number;
  stunTimer: number;
  hitTimer: number;
  opponent!: Fighter;
  readonly isKnight: boolean;
  particles: Particle[];
  damageTexts: DamageText[];

  // Faction / stats fields
  charType: string = "knight";
  playerAtk: number = 1;
  playerDef: number = 1;
  playerSpd: number = 1;
  equippedWeaponVisual: string | null = null;
  ultimateCharge: number = 0;
  
  private _castTimer: number = 0;
  private _circleDir: number = 1;
  private _assassinAttackIndex: number = 0;
  
  // Deterministic attack queue (no setTimeout)
  private pendingAttacks: { delay: number; damage: number; color: string; type: "normal"|"critical"|"ultimate"; range: number; effect?: string }[] = [];

  constructor(
    x: number, y: number,
    color: string, hpFillId: string,
    isFacingRight: boolean,
    isKnight: boolean,
    particles: Particle[],
    damageTexts: DamageText[],
  ) {
    this.x = x; this.y = y; this.startX = x; this.targetX = x;
    this.color = color; this.hp = 1000; this.maxHp = 1000;
    this.hpFillId = hpFillId; this.isFacingRight = isFacingRight;
    this.width = 45; this.height = 90;
    this.fighterState = "idle"; this.stateTimer = 0;
    this.attackCooldown = 0; this.stunTimer = 0; this.hitTimer = 0;
    this.isKnight = isKnight;
    this.particles = particles; this.damageTexts = damageTexts;
  }

  setOpponent(opp: Fighter): void { this.opponent = opp; }

  // ── Combat logic (deterministic) ───────────────────────────────────────────
  private updateCombat(): void {
    if (this.hp <= 0) {
      this.pendingAttacks = [];
      return;
    }

    for (let i = this.pendingAttacks.length - 1; i >= 0; i--) {
      const atk = this.pendingAttacks[i];
      atk.delay--;
      if (atk.delay <= 0) {
        this.executeAttack(atk);
        this.pendingAttacks.splice(i, 1);
      }
    }
  }

  private executeAttack(atk: { damage: number; color: string; type: string; range: number; effect?: string }): void {
    if (this.hp <= 0) return;
    if (Math.abs(this.x - this.opponent.x) > atk.range) return;

    this.opponent.takeDamage(atk.damage, atk.color);

    // Particle effects
    const burst = atk.type === "ultimate" ? 50 : atk.type === "critical" ? 25 : 15;
    const scale = atk.type === "ultimate" ? 3.5 : atk.type === "critical" ? 2.2 : 1.6;
    for (let i = 0; i < burst; i++) {
      this.particles.push(new Particle(this.opponent.x, this.opponent.y - 55, atk.color, scale));
    }

    // Class-specific effects
    if (atk.type === "ultimate") {
        state.screenShake = 25;
        this.opponent.stunTimer = 40; // stun on ult
    }

    if (this.charType === "necromancer") {
      const siphonPercent = atk.type === "ultimate" ? 0.4 : 0.15;
      const siphon = Math.max(4, Math.floor(atk.damage * siphonPercent));
      this.hp = Math.min(this.maxHp, this.hp + siphon);
    }
    
    if (this.charType === "scarlet_assassin" && atk.type === "ultimate") {
        // Multi-hit combo for assassin ult
        for (let i = 1; i < 5; i++) {
            this.pendingAttacks.push({
                delay: i * 4,
                damage: Math.floor(atk.damage * 0.3),
                color: "#ff2244",
                type: "normal",
                range: atk.range
            });
        }
    }

    if (atk.effect === "bleed") {
        this.opponent.takeDamage(Math.floor(atk.damage * 0.4), "#8dff5e");
    }

    // Ultimate charge
    if (atk.type !== "ultimate") {
      this.ultimateCharge = Math.min(100, this.ultimateCharge + (atk.type === "critical" ? 20 : 10));
    } else {
      this.ultimateCharge = 0;
    }
  }

  // ── Faction-aware AI ────────────────────────────────────────────────────────
  updateAI(gameOver: boolean): void {
    if (this.hp <= 0 || gameOver) return;
    
    this.updateCombat();

    // Generic hard-CC window used by ultimate skills.
    if (this.stunTimer > 0) {
      this.stunTimer--;
      this.fighterState = "casting";
      this.targetX = this.x;
      if (this.attackCooldown > 0) this.attackCooldown--;
      return;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.stateTimer > 0) this.stateTimer--;

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
          } else {
            // Hold position — shuffle a little
            this.targetX = this.startX + (Math.random() * 60 - 30);
            this.fighterState = "retreating"; this.stateTimer = 20;
          }
        }
        if (this.fighterState === "charging") {
          this.targetX = this.isFacingRight ? this.opponent.x - 65 : this.opponent.x + 65;
          this.x += (this.targetX - this.x) * 0.07; // slow, deliberate
          if (dist < 90) { this.performAttack(); }
          if (this.stateTimer <= 0) { this.fighterState = "idle"; }
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
          } else {
            this._circleDir *= Math.random() < 0.12 ? -1 : 1;
            this.targetX = this.opponent.x + this._circleDir * (95 + Math.random() * 45);
            this.fighterState = "circling";
            this.stateTimer = 16;
          }
        }
        if (this.fighterState === "circling") {
          this.x += (this.targetX - this.x) * 0.24;
          if (this.stateTimer <= 0) this.fighterState = "idle";
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
            this.fighterState = "retreating"; this.stateTimer = 35;
          } else if (this.attackCooldown <= 0) {
            this.fighterState = "casting"; this._castTimer = 30; this.stateTimer = 30;
          } else {
            this.fighterState = "idle"; this.stateTimer = 15;
          }
        }
        if (this.fighterState === "retreating") {
          this.x += (this.targetX - this.x) * 0.08;
          if (this.stateTimer <= 0) this.fighterState = "idle";
        }
        if (this.fighterState === "casting") {
          // Stand still while channeling
          if (this._castTimer > 0) { this._castTimer--; }
          else if (this.stateTimer <= 0) {
            // Release spell: 2 rapid hits
            this.performAttack();
            this.fighterState = "retreating";
            this.targetX = this.isFacingRight
              ? this.opponent.x - 260
              : this.opponent.x + 260;
            this.stateTimer = 50;
          }
        }
        if (this.fighterState === "attacking") {
          // Mage doesn't lunge — just glows; handled in performAttack
          if (this.stateTimer <= 0) this.fighterState = "idle";
        }
        break;

      // ─── NECROMANCER: ranged caster with life siphon
      case "necromancer":
        if (this.fighterState === "idle" && this.stateTimer <= 0) {
          if (dist < 210) {
            this.targetX = this.isFacingRight ? this.opponent.x - 285 : this.opponent.x + 285;
            this.fighterState = "retreating";
            this.stateTimer = 32;
          } else if (this.attackCooldown <= 0) {
            this.fighterState = "casting";
            this._castTimer = 38;
            this.stateTimer = 38;
          } else {
            this.fighterState = "idle";
            this.stateTimer = 14;
          }
        }
        if (this.fighterState === "retreating") {
          this.x += (this.targetX - this.x) * 0.07;
          if (this.stateTimer <= 0) this.fighterState = "idle";
        }
        if (this.fighterState === "casting") {
          if (this._castTimer > 0) {
            this._castTimer--;
          } else if (this.stateTimer <= 0) {
            this.performAttack();
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
          } else {
            this.fighterState = "retreating";
            this.targetX = this.startX + (Math.random() * 70 - 35);
            this.stateTimer = 14;
          }
        }
        if (this.fighterState === "moving") {
          this.targetX = this.isFacingRight ? this.opponent.x - 70 : this.opponent.x + 70;
          this.x += (this.targetX - this.x) * (0.18 * frenzy);
          if (dist < 105) this.performAttack();
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
          } else {
            this._circleDir *= Math.random() < 0.16 ? -1 : 1;
            this.targetX = this.opponent.x + this._circleDir * (78 + Math.random() * 35);
            this.fighterState = "circling";
            this.stateTimer = 14;
          }
        }
        if (this.fighterState === "circling") {
          this.x += (this.targetX - this.x) * 0.22;
          if (this.stateTimer <= 0) this.fighterState = "idle";
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
          } else {
            this.fighterState = "retreating";
            this.targetX = this.startX + (Math.random() * 80 - 40);
            this.stateTimer = 18; // short idle — aggressive
          }
        }
        if (this.fighterState === "moving") {
          this.targetX = this.isFacingRight ? this.opponent.x - 80 : this.opponent.x + 80;
          this.x += (this.targetX - this.x) * 0.14;
          if (dist < 100) { this.performAttack(); }
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
      if (this.stateTimer <= 0) this.fighterState = "idle";
    }

    // Clamp to arena
    this.x = Math.max(50, Math.min(850, this.x));
  }

  performAttack(): void {
    this.fighterState = "attacking";
    this.stateTimer = 15;
    
    const isMage = this.charType === "mage";
    const isScarletAssassin = this.charType === "scarlet_assassin";
    const isNecromancer = this.charType === "necromancer";
    const isBerserker = this.charType === "berserker";
    const isGoblin = this.charType === "goblin";

    // Determine attack type
    let type: "normal" | "critical" | "ultimate" = "normal";
    if (this.ultimateCharge >= 100) {
        type = "ultimate";
    } else if (Math.random() < 0.2) {
        type = "critical";
    }

    const assassinAttack = isScarletAssassin ? this._assassinAttackIndex : -1;
    if (isScarletAssassin && type !== "ultimate") {
      this._assassinAttackIndex = (this._assassinAttackIndex + 1) % 3;
      if (assassinAttack === 0) this.stateTimer = 10;
      else if (assassinAttack === 1) this.stateTimer = 14;
      else this.stateTimer = 18;
    }

    let baseCd = 85;
    if (isMage) baseCd = 110;
    else if (isNecromancer) baseCd = 124;
    else if (isScarletAssassin) baseCd = assassinAttack === 0 ? 44 : assassinAttack === 1 ? 56 : 70;
    else if (isGoblin) baseCd = 50;
    else if (isBerserker) baseCd = 72;
    
    if (type === "ultimate") {
        baseCd *= 2.5;
        this.stateTimer = isMage || isNecromancer ? 60 : 40;
    } else if (type === "critical") {
        baseCd *= 1.3;
    }

    this.attackCooldown = Math.max(16, baseCd - (this.playerSpd - 1) * 4) + Math.random() * 20;

    let delay = 10; // default delay for melee
    if (isMage) delay = 25;
    else if (isNecromancer) delay = 30;
    else if (isScarletAssassin) delay = assassinAttack === 2 ? 15 : 8;
    else if (isGoblin) delay = 6;
    
    if (type === "ultimate") delay += 20;

    const range = isMage ? 320 : isNecromancer ? 360 : isScarletAssassin ? (assassinAttack === 2 ? 175 : 130) : isBerserker ? 150 : isGoblin ? 112 : 130;
    
    let baseMin = 50;
    let baseMax = 100;
    
    if (isMage) { baseMin = 35; baseMax = 55; }
    else if (isNecromancer) { baseMin = 40; baseMax = 65; }
    else if (isScarletAssassin) {
      if (assassinAttack === 0) { baseMin = 45; baseMax = 65; }
      else if (assassinAttack === 1) { baseMin = 35; baseMax = 50; }
      else { baseMin = 60; baseMax = 85; }
    } else if (isBerserker) { baseMin = 70; baseMax = 120; }
    else if (isGoblin) { baseMin = 30; baseMax = 50; }

    let base = baseMin + Math.random() * (baseMax - baseMin);
    
    if (type === "critical") base *= 1.8;
    if (type === "ultimate") base *= 3.5;

    const dmg = Math.floor(base * (1 + (this.playerAtk - 1) * 0.18));
    const strikeColor = type === "ultimate" ? "#fff" : (type === "critical" ? "#ffcc00" : this.color);

    this.pendingAttacks.push({
        delay,
        damage: dmg,
        color: strikeColor,
        type,
        range: type === "ultimate" ? range * 1.5 : range,
        effect: isGoblin && type === "critical" ? "bleed" : undefined
    });

    // Handle multi-hits or follow-ups without setTimeout
    if (isMage && type === "normal") {
        this.pendingAttacks.push({ delay: delay + 12, damage: Math.floor(dmg * 0.8), color: strikeColor, type, range });
    }
    
    if (isScarletAssassin && assassinAttack === 1 && type === "normal") {
        this.pendingAttacks.push({ delay: delay + 8, damage: Math.floor(dmg * 0.5), color: "#ff6d7e", type, range });
    }
  }

  takeDamage(amount: number, attackerColor: string): void {
    const reduced = Math.max(1, Math.floor(amount - (this.playerDef - 1) * 2.0));
    this.hp = Math.max(0, this.hp - reduced);
    this.hitTimer = 15;
    state.screenShake = 12;

    this.damageTexts.push(new DamageText(this.x, this.y - this.height, reduced, "#fff"));
    for (let i = 0; i < 25; i++) this.particles.push(new Particle(this.x, this.y - this.height / 2, attackerColor, 1.6));
    for (let i = 0; i < 12; i++) this.particles.push(new Particle(this.x, this.y - this.height / 2, "#ffffff", 2.1));
  }

  draw(ctx: CanvasRenderingContext2D, gameTime: number): void {
    // Draw ultimate bar if needed
    if (this.hp > 0) {
        this.drawUltimateBar(ctx);
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(this.x, this.y);

    const attacking = this.fighterState === "attacking" || this.fighterState === "charging";
    const moving    = this.fighterState === "moving" || this.fighterState === "circling";
    const casting   = this.fighterState === "casting";
    let tilt = 0;
    if (moving)    tilt = this.isFacingRight ?  0.12 : -0.12;
    if (attacking) tilt = this.isFacingRight ?  0.30 : -0.30;
    if (casting)   tilt = 0; // mage stands upright while casting
    ctx.rotate(tilt);
    if (!this.isFacingRight) ctx.scale(-1, 1);

    const flash = this.hitTimer > 0;
    if (this.hitTimer > 0) this.hitTimer--;

    ctx.shadowBlur  = flash ? 50 : (attacking ? 28 : casting ? 40 : 12);
    ctx.shadowColor = flash ? "#fff" : this.color;

    const legSwing = (moving || attacking) ? Math.sin(gameTime * 0.45) * 11 : 0;

    const isMage = this.charType === "mage";
    const isScarletAssassin = this.charType === "scarlet_assassin";
    const isNecromancer = this.charType === "necromancer";
    const isBerserker = this.charType === "berserker";
    const isGoblin = this.charType === "goblin";

    if (isMage) {
      CharDraw.drawMage(ctx, gameTime, flash, legSwing, attacking || casting, this.color);
    } else if (isNecromancer) {
      CharDraw.drawNecromancer(ctx, gameTime, flash, legSwing, attacking || casting, this.color);
    } else if (isScarletAssassin) {
      CharDraw.drawAssassin(ctx, gameTime, flash, legSwing, attacking, this.color, this.isFacingRight);
    } else if (isBerserker) {
      CharDraw.drawBerserker(ctx, gameTime, flash, legSwing, attacking, this.color);
    } else if (isGoblin) {
      CharDraw.drawGoblin(ctx, gameTime, flash, legSwing, attacking, this.color);
    } else {
      this.drawKnight(ctx, gameTime, flash, legSwing, attacking);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawUltimateBar(ctx: CanvasRenderingContext2D): void {
      const barW = 40;
      const barH = 4;
      const bx = this.x - barW / 2;
      const by = this.y - 110;
      
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(bx, by, barW, barH);
      
      const chargeW = (this.ultimateCharge / 100) * barW;
      ctx.fillStyle = this.ultimateCharge >= 100 ? "#fff" : "#00e5ff";
      if (this.ultimateCharge >= 100) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#fff";
      }
      ctx.fillRect(bx, by, chargeW, barH);
      ctx.shadowBlur = 0;
  }

  private fill(ctx: CanvasRenderingContext2D, flash: boolean, color: string): void {
    ctx.fillStyle = flash ? "#ffffff" : color;
  }

  // ────────────────────────────────────────────────────────── KNIGHT
  private drawKnight(ctx: CanvasRenderingContext2D, _gt: number, flash: boolean, leg: number, atk: boolean): void {
    const C = this.color;
    // Back leg
    ctx.fillStyle = flash ? "#fff" : "#4a3060"; ctx.fillRect(-13, -22, 11, 24 - leg);
    // Cape
    ctx.globalAlpha = 0.7; ctx.fillStyle = flash ? "#fff" : "#8b1a1a";
    ctx.fillRect(-16, -56, 10, 38); ctx.globalAlpha = 1;
    // Torso — armor
    this.fill(ctx, flash, C);
    ctx.fillRect(-14, -60, 30, 42);
    // Chest plate detail
    if (!flash) { ctx.fillStyle = "#ddd"; ctx.fillRect(-10, -56, 22, 28); }
    // Shoulder pads
    if (!flash) { ctx.fillStyle = "#ccc"; ctx.fillRect(-18, -62, 10, 12); ctx.fillRect(8, -62, 10, 12); }
    // Head / helmet
    if (!flash) { ctx.fillStyle = "#f0c88a"; ctx.fillRect(-9, -82, 18, 18); } // face
    this.fill(ctx, flash, C);
    ctx.fillRect(-11, -88, 22, 18); // helmet top
    if (!flash) {
      ctx.fillStyle = "#888"; ctx.fillRect(-9, -76, 18, 8); // visor
      ctx.fillStyle = "#333"; ctx.fillRect(-6, -74, 3, 3); ctx.fillRect(3, -74, 3, 3);
    }
    // Shield arm
    this.fill(ctx, flash, C); ctx.fillRect(-24, -58, 11, 32);
    if (!flash) {
      ctx.fillStyle = "#cc2200"; ctx.fillRect(-28, -62, 10, 38); // shield
      ctx.fillStyle = "#ffcc00"; ctx.fillRect(-25, -50, 4, 4); // emblem
    }
    // Sword arm
    this.fill(ctx, flash, C); ctx.fillRect(14, -60, 11, 28);
    // Sword
    if (!flash) {
      ctx.fillStyle = "#7a4010"; ctx.fillRect(26, -46, 5, 16); // hilt
      ctx.fillStyle = "#cc9900"; ctx.fillRect(20, -52, 16, 5); // guard
      ctx.fillStyle = "#d8d8e8"; // blade
      ctx.beginPath(); ctx.moveTo(25, -84); ctx.lineTo(31, -84); ctx.lineTo(33, -48); ctx.lineTo(23, -48); ctx.closePath(); ctx.fill();
    }
    // Front leg
    ctx.fillStyle = flash ? "#fff" : "#4a3060"; ctx.fillRect(2, -22, 11, 24 + leg);
  }
}
