// fighter.ts — Fighter class: AI, damage, pixel-art draw

import { Particle, DamageText } from "./particles.js";

// Shared mutable state — use an object so it acts as a reference
export const state = { screenShake: 0 };

export type FighterState = "idle" | "moving" | "retreating" | "attacking" | "charging" | "casting" | "circling" | "death" | "victory";

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

  if (charType === "mage") {
    _drawMagePreview(ctx, color, gt, s);
  } else if (charType === "killer") {
    _drawKillerPreview(ctx, color, gt, s);
  } else if (charType === "necro") {
    _drawNecroPreview(ctx, color, gt, s);
  } else if (charType === "berserker") {
    _drawBerserkerPreview(ctx, color, gt, s);
  } else if (charType === "troll") {
    _drawTrollPreview(ctx, color, s);
  } else if (charType === "cryo_knight") {
    _drawKnightPreview(ctx, "#4ac8e8", s); // Cyan cryo knight
  } else {
    _drawKnightPreview(ctx, color, s);
  }

  ctx.restore();
}

function _drawKnightPreview(ctx: CanvasRenderingContext2D, C: string, _s: number): void {
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.ellipse(0, 4, 32, 10, 0, 0, Math.PI*2); ctx.fill();
  
  // Cape (more flowing)
  ctx.fillStyle = "#8b1a1a";
  ctx.beginPath();
  ctx.moveTo(-12, -60);
  ctx.bezierCurveTo(-30, -40, -40, -10, -15, 0);
  ctx.lineTo(-5, 5);
  ctx.lineTo(-5, -55);
  ctx.fill();
  
  // Body (Rounded armor)
  const grad = ctx.createLinearGradient(-15, -60, 15, -20);
  grad.addColorStop(0, C); grad.addColorStop(1, "#1a1a2a");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(-15, -62, 30, 44, 12); ctx.fill();
  
  // Chest plate
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath(); ctx.roundRect(-10, -58, 20, 28, 8); ctx.fill();
  
  // Legs (Rounded)
  ctx.fillStyle = "#2a1b38"; 
  ctx.beginPath(); ctx.roundRect(-14, -22, 12, 26, 6); ctx.fill();
  ctx.beginPath(); ctx.roundRect(2, -22, 12, 26, 6); ctx.fill();
  
  // Helmet
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(-15, -96, 30, 30, 15); ctx.fill();
  
  // Face
  ctx.fillStyle = "#f0c88a"; 
  ctx.beginPath(); ctx.roundRect(-10, -84, 20, 14, 4); ctx.fill();
  
  // Eyes
  ctx.fillStyle = "#fff"; ctx.fillRect(-5, -81, 4, 4); ctx.fillRect(3, -81, 4, 4);
  ctx.fillStyle = "#1e3a8a"; ctx.fillRect(-3, -80, 2, 2); ctx.fillRect(5, -80, 2, 2);
  
  // Plume
  ctx.fillStyle = "#cc2200";
  ctx.beginPath();
  ctx.moveTo(0, -96);
  ctx.bezierCurveTo(-15, -115, 15, -115, 0, -96);
  ctx.fill();
  
  // Sword & Shield
  ctx.fillStyle = "#7a4010"; ctx.fillRect(18, -48, 6, 16); // handle
  ctx.fillStyle = "#d8d8e8"; ctx.beginPath(); ctx.roundRect(16, -86, 10, 40, 5); ctx.fill();
  
  ctx.fillStyle = "#cc2200";
  ctx.beginPath(); ctx.ellipse(-22, -45, 12, 18, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 2; ctx.stroke();
}

function _drawKillerPreview(ctx: CanvasRenderingContext2D, C: string, gt: number, _s: number): void {
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath(); ctx.ellipse(0, 4, 28, 8, 0, 0, Math.PI*2); ctx.fill();
  
  const pulse = Math.sin(gt * 0.1) * 0.2 + 0.8;
  
  // Body (Lean/Shadowy)
  const grad = ctx.createLinearGradient(-12, -60, 12, -10);
  grad.addColorStop(0, "#111"); grad.addColorStop(1, "#333");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(-12, -62, 24, 60, 10); ctx.fill();
  
  // Hood (Pointed/Organic)
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(-15, -60);
  ctx.bezierCurveTo(-18, -100, 18, -100, 15, -60);
  ctx.fill();
  
  // Glow under hood
  ctx.shadowBlur = 10; ctx.shadowColor = C;
  ctx.fillStyle = C;
  ctx.beginPath(); ctx.arc(-4, -75, 2, 0, Math.PI*2); ctx.arc(4, -75, 2, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  
  // Scarf/Cloak
  ctx.fillStyle = C;
  ctx.beginPath();
  ctx.moveTo(-12, -60);
  ctx.bezierCurveTo(-25, -55, -25, -20, -10, -30);
  ctx.lineTo(0, -40);
  ctx.fill();
  
  // Dual Daggers
  ctx.save();
  ctx.translate(18, -45);
  ctx.rotate(0.4);
  ctx.fillStyle = "#333"; ctx.fillRect(-2, 0, 4, 10);
  ctx.fillStyle = "#999"; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(0, -18); ctx.lineTo(3, 0); ctx.fill();
  ctx.restore();
  
  ctx.save();
  ctx.translate(-18, -45);
  ctx.rotate(-0.4);
  ctx.fillStyle = "#333"; ctx.fillRect(-2, 0, 4, 10);
  ctx.fillStyle = "#999"; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(0, -18); ctx.lineTo(3, 0); ctx.fill();
  ctx.restore();
}

function _drawMagePreview(ctx: CanvasRenderingContext2D, C: string, gt: number, _s: number): void {
  const float = Math.sin(gt * 0.05) * 5;
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(0, 4, 26, 8, 0, 0, Math.PI*2); ctx.fill();
  
  ctx.translate(0, float - 2);
  
  // Robe (Rounded)
  const grad = ctx.createLinearGradient(-12, -60, 12, 0);
  grad.addColorStop(0, C); grad.addColorStop(1, "#1a1a2a");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(-14, -62, 28, 64, 12); ctx.fill();
  
  // Magical trim
  ctx.shadowBlur = 10; ctx.shadowColor = "#00e5ff";
  ctx.fillStyle = "rgba(0,229,255,0.4)";
  ctx.beginPath(); ctx.roundRect(-8, -20, 16, 4, 2); ctx.fill();
  ctx.shadowBlur = 0;
  
  // Shoulder pads
  ctx.fillStyle = C; ctx.beginPath(); ctx.arc(-16, -58, 7, 0, Math.PI, true); ctx.fill();
  ctx.beginPath(); ctx.arc(16, -58, 7, 0, Math.PI, true); ctx.fill();
  
  // Head
  ctx.fillStyle = "#f0c88a"; 
  ctx.beginPath(); ctx.roundRect(-10, -90, 20, 22, 10); ctx.fill();
  
  // Hair
  ctx.fillStyle = "#e8c030"; ctx.beginPath(); ctx.roundRect(-12, -94, 24, 14, 6); ctx.fill();
  
  // Eyes
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(-4, -84, 3, 4, 0, 0, Math.PI*2); ctx.ellipse(4, -84, 3, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#2055ff"; ctx.beginPath(); ctx.arc(-3, -84, 1.5, 0, Math.PI*2); ctx.arc(5, -84, 1.5, 0, Math.PI*2); ctx.fill();
  
  // Hat (Pointed but rounded)
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-16, -92);
  ctx.lineTo(16, -92);
  ctx.lineTo(0, -118);
  ctx.fill();
  
  // Staff
  ctx.fillStyle = "#5c3a21"; ctx.beginPath(); ctx.roundRect(-26, -104, 5, 84, 2); ctx.fill();
  const crystalGlow = 16 + Math.sin(gt * 0.1) * 8;
  ctx.shadowBlur = crystalGlow; ctx.shadowColor = "#00e5ff";
  ctx.fillStyle = "#00e5ff";
  ctx.beginPath(); ctx.arc(-23.5, -110, 8, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
}

function _drawTrollPreview(ctx: CanvasRenderingContext2D, C: string, _s: number): void {
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.ellipse(0, 4, 40, 12, 0, 0, Math.PI*2); ctx.fill();
  
  // Body (Massive Round)
  const grad = ctx.createLinearGradient(-30, -80, 30, -20);
  grad.addColorStop(0, C); grad.addColorStop(1, "#1a3311");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(-30, -80, 60, 56, 20); ctx.fill();
  
  // Legs (Stocky)
  ctx.fillStyle = "#2d4a1a"; 
  ctx.beginPath(); ctx.roundRect(-22, -30, 18, 30, 5); ctx.fill();
  ctx.beginPath(); ctx.roundRect(4, -30, 18, 30, 5); ctx.fill();
  
  // Arms (Huge)
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(-42, -74, 18, 46, 10); ctx.fill();
  ctx.beginPath(); ctx.roundRect(24, -74, 18, 46, 10); ctx.fill();
  
  // Head
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(-22, -115, 44, 42, 18); ctx.fill();
  
  // Eyes
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-10, -96, 5, 0, Math.PI*2); ctx.arc(10, -96, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#cc0000"; ctx.beginPath(); ctx.arc(-9, -96, 2, 0, Math.PI*2); ctx.arc(11, -96, 2, 0, Math.PI*2); ctx.fill();
  
  // Tusks
  ctx.fillStyle = "#fffde0"; 
  ctx.beginPath(); ctx.arc(-15, -80, 4, Math.PI, 0, true); ctx.fill();
  ctx.beginPath(); ctx.arc(15, -80, 4, Math.PI, 0, true); ctx.fill();

  // Axe
  ctx.fillStyle = "#5c2e08"; ctx.beginPath(); ctx.roundRect(35, -100, 7, 80, 2); ctx.fill();
  ctx.fillStyle = "#8a8aaa";
  ctx.beginPath(); ctx.ellipse(55, -80, 15, 25, 0.2, 0, Math.PI*2); ctx.fill();
}

function _drawNecroPreview(ctx: CanvasRenderingContext2D, C: string, gt: number, _s: number): void {
  const float = Math.sin(gt * 0.05) * 4;
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(0, 4, 22, 6, 0, 0, Math.PI*2); ctx.fill();
  
  ctx.translate(0, float - 4); // Floating effect
  
  // Robe (Flowing)
  ctx.fillStyle = "#111"; 
  ctx.beginPath();
  ctx.moveTo(-12, -64);
  ctx.lineTo(12, -64);
  ctx.lineTo(15, 0);
  ctx.bezierCurveTo(0, 5, -10, 5, -14, 0);
  ctx.closePath();
  ctx.fill();

  // Hood (Rounded)
  ctx.fillStyle = "#111"; 
  ctx.beginPath(); ctx.roundRect(-15, -86, 30, 24, 12); ctx.fill();
  
  // Face shadow
  ctx.fillStyle = "#000"; ctx.beginPath(); ctx.roundRect(-8, -80, 16, 14, 6); ctx.fill();
  
  // Glowing eyes
  ctx.shadowBlur = 15; ctx.shadowColor = C; ctx.fillStyle = C;
  ctx.beginPath(); ctx.arc(-4, -75, 2, 0, Math.PI*2); ctx.arc(4, -75, 2, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  
  // Staff
  ctx.fillStyle = "#3a2a40"; ctx.beginPath(); ctx.roundRect(-24, -90, 4, 80, 2); ctx.fill();
  // Staff skull
  ctx.fillStyle = "#ddd"; ctx.beginPath(); ctx.roundRect(-28, -100, 12, 12, 4); ctx.fill();
  // Magical aura
  ctx.shadowBlur = 15; ctx.shadowColor = C;
  ctx.fillStyle = C;
  ctx.beginPath(); ctx.arc(-22, -106, 7 + Math.sin(gt*0.1)*2, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
}

function _drawBerserkerPreview(ctx: CanvasRenderingContext2D, C: string, gt: number, _s: number): void {
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(0, 4, 30, 10, 0, 0, Math.PI*2); ctx.fill();
  
  const breathe = Math.sin(gt * 0.1) * 2;
  
  // Torso (Muscular/Rounded)
  ctx.fillStyle = "#e8a070";
  ctx.beginPath(); ctx.roundRect(-18, -60, 36, 36 + breathe, 12); ctx.fill();
  
  // Pants
  ctx.fillStyle = "#3a1a10"; ctx.beginPath(); ctx.roundRect(-20, -28 - breathe, 40, 12, 5); ctx.fill();
  
  // Legs
  ctx.fillStyle = "#4a2a1a"; 
  ctx.beginPath(); ctx.roundRect(-16, -24, 12, 24, 4); ctx.fill();
  ctx.beginPath(); ctx.roundRect(4, -24, 12, 24, 4); ctx.fill();
  
  // Head
  ctx.fillStyle = "#e8a070";
  ctx.beginPath(); ctx.roundRect(-10, -78, 20, 20, 8); ctx.fill();
  
  // Hair/Beard
  ctx.fillStyle = C; 
  ctx.beginPath(); ctx.arc(0, -78, 12, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-12, -70, 24, 10, 4); ctx.fill();
  
  // Enraged Eyes
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-4, -72, 3, 0, Math.PI*2); ctx.arc(4, -72, 3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(-4, -72, 1, 0, Math.PI*2); ctx.arc(4, -72, 1, 0, Math.PI*2); ctx.fill();
  
  // Axes
  ctx.fillStyle = "#4a2a1a"; ctx.beginPath(); ctx.roundRect(-30, -70, 4, 40, 2); ctx.fill();
  ctx.fillStyle = "#aab"; ctx.beginPath(); ctx.ellipse(-35, -60, 8, 12, 0.4, 0, Math.PI*2); ctx.fill();
  
  ctx.fillStyle = "#4a2a1a"; ctx.beginPath(); ctx.roundRect(26, -70, 4, 40, 2); ctx.fill();
  ctx.fillStyle = "#aab"; ctx.beginPath(); ctx.ellipse(31, -60, 8, 12, -0.4, 0, Math.PI*2); ctx.fill();
}


export class Fighter {
  x: number; y: number;
  readonly startX: number;
  targetX: number;
  color: string;
  hp: number;
  maxHp: number;
  readonly hpFillId: string;
  isFacingRight: boolean;
  readonly width: number;
  readonly height: number;
  fighterState: FighterState;
  stateTimer: number;
  attackCooldown: number;
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
  private _castTimer: number = 0;
  private _circleDir: number = 1;

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
    this.attackCooldown = 0; this.hitTimer = 0;
    this.isKnight = isKnight;
    this.particles = particles; this.damageTexts = damageTexts;
  }

  setOpponent(opp: Fighter): void { this.opponent = opp; }

  // ── Faction-aware AI ────────────────────────────────────────────────────────
  updateAI(gameOver: boolean): void {
    if (this.hp <= 0 || gameOver) return;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.stateTimer > 0) this.stateTimer--;

    const dist = Math.abs(this.x - this.opponent.x);
    this.isFacingRight = this.opponent.x > this.x;

    // Faction determines preferred combat range and state transitions
    switch (this.charType) {

      // ─── KNIGHT: slow, tanky, charges when ready then stands firm
      case "knight":
      case "iron_golem":
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

      // ─── KILLER / shadow_killer: fast, dashes past opponent, hitand-run
      case "killer":
      case "shadow_killer":
        if (this.fighterState === "idle" && this.stateTimer <= 0) {
          if (this.attackCooldown <= 0) {
            this.fighterState = "moving";
          } else {
            // Circle around opponent
            this._circleDir *= Math.random() < 0.1 ? -1 : 1;
            this.targetX = this.opponent.x + this._circleDir * (120 + Math.random() * 60);
            this.fighterState = "circling"; this.stateTimer = 25;
          }
        }
        if (this.fighterState === "circling") {
          this.x += (this.targetX - this.x) * 0.18;
          if (this.stateTimer <= 0) this.fighterState = "idle";
        }
        if (this.fighterState === "moving") {
          this.targetX = this.isFacingRight ? this.opponent.x - 50 : this.opponent.x + 50;
          this.x += (this.targetX - this.x) * 0.22; // fast dash
          if (dist < 80) {
            this.performAttack();
            // Dash THROUGH/past the opponent after hitting
            this.targetX = this.isFacingRight
              ? this.opponent.x + 160
              : this.opponent.x - 160;
          }
        }
        if (this.fighterState === "attacking") {
          this.x += this.isFacingRight ? 18 : -18; // quick dash past
          if (this.stateTimer <= 0) {
            this.fighterState = "retreating";
            // Retreat to the *other* side so next strike comes from different angle
            this.targetX = this.x + (this.isFacingRight ? 100 : -100);
            this.stateTimer = 30;
          }
        }
        break;

      // ─── MAGE / dark_mage / necro: keeps distance, channels, then fires a burst
      case "mage":
      case "dark_mage":
      case "necro":
      case "soul_reaper":
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
            setTimeout(() => { if (this.hp > 0) this.performAttack(); }, 180);
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

      // ─── TROLL / orc / stone_giant / berserker: always rushing
      case "berserker":
      case "flame_berserker":
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
            this.stateTimer = 28; // troll barely retreats
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
    this.stateTimer = 12;
    const isMage = this.charType === "mage" || this.charType === "dark_mage";
    const isKiller = this.charType === "killer" || this.charType === "shadow_killer";
    // SPD influences cooldown
    const baseCd = isMage ? 110 : isKiller ? 55 : 85;
    this.attackCooldown = Math.max(20, baseCd - (this.playerSpd - 1) * 4) + Math.random() * 25;

    const delay = isMage ? 220 : 80; // mage spell travels
    setTimeout(() => {
      if (this.hp <= 0) return;
      const range = isMage ? 320 : 130;
      if (Math.abs(this.x - this.opponent.x) > range) return;

      // Mage 2-hit burst does less per hit; troll hits hardest
      const baseMin = isMage ? 35 : isKiller ? 45 : 55;
      const baseMax = isMage ? 55 : isKiller ? 85 : 110;
      const base = baseMin + Math.random() * (baseMax - baseMin);
      const dmg = Math.floor(base * (1 + (this.playerAtk - 1) * 0.18));
      this.opponent.takeDamage(dmg, this.color);

      // Mage adds particle burst from afar
      if (isMage || this.charType === "necro" || this.charType === "soul_reaper") {
        for (let i = 0; i < 18; i++)
          this.particles.push(new Particle(this.opponent.x, this.opponent.y - 60, this.color, 2.0));
      }
    }, delay);
  }

  takeDamage(amount: number, attackerColor: string): void {
    const reduced = Math.max(1, Math.floor(amount - (this.playerDef - 1) * 2.0));
    this.hp = Math.max(0, this.hp - reduced);
    this.hitTimer = 15;
    state.screenShake = 12;

    this.damageTexts.push(new DamageText(this.x, this.y - this.height, reduced, "#fff"));
    for (let i = 0; i < 25; i++) this.particles.push(new Particle(this.x, this.y - this.height / 2, attackerColor, 1.6));
    for (let i = 0; i < 12; i++) this.particles.push(new Particle(this.x, this.y - this.height / 2, "#ffffff", 2.1));

    const fill = document.getElementById(this.hpFillId) as HTMLElement | null;
    if (fill) fill.style.width = (this.hp / this.maxHp) * 100 + "%";
  }

  draw(ctx: CanvasRenderingContext2D, gameTime: number): void {
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

    const isMage   = this.charType === "mage"   || this.charType === "dark_mage";
    const isNecro  = this.charType === "necro"  || this.charType === "soul_reaper";
    const isTroll  = this.charType === "troll"  || this.charType === "orc_raider"  || this.charType === "stone_giant";
    const isKiller = this.charType === "killer" || this.charType === "shadow_killer";
    const isBerserker = this.charType === "berserker" || this.charType === "flame_berserker";

    if (isMage) {
      this.drawMage(ctx, gameTime, flash, legSwing, attacking || casting);
    } else if (isNecro) {
      this.drawNecro(ctx, gameTime, flash, legSwing, attacking || casting);
    } else if (isBerserker) {
      this.drawBerserker(ctx, gameTime, flash, legSwing, attacking);
    } else if (isTroll) {
      this.drawTroll(ctx, gameTime, flash, legSwing, attacking);
    } else if (isKiller) {
      this.drawKiller(ctx, gameTime, flash, legSwing, attacking);
    } else {
      this.drawKnight(ctx, gameTime, flash, legSwing, attacking);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private fill(ctx: CanvasRenderingContext2D, flash: boolean, color: string): void {
    ctx.fillStyle = flash ? "#ffffff" : color;
  }

  // ────────────────────────────────────────────────────────── KNIGHT
  private drawKnight(ctx: CanvasRenderingContext2D, _gt: number, flash: boolean, leg: number, atk: boolean): void {
    const C = this.color;
    // Back leg
    ctx.fillStyle = flash ? "#fff" : "#4a3060"; 
    ctx.beginPath(); ctx.roundRect(-13, -22, 11, 24 - leg, 5); ctx.fill();
    
    // Cape
    ctx.globalAlpha = 0.7; ctx.fillStyle = flash ? "#fff" : "#8b1a1a";
    ctx.beginPath();
    ctx.moveTo(-16, -56);
    ctx.bezierCurveTo(-35, -30, -35, 0, -10, 5);
    ctx.lineTo(-6, -56);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Torso — armor (Rounded)
    this.fill(ctx, flash, C);
    ctx.beginPath(); ctx.roundRect(-16, -62, 32, 44, 12); ctx.fill();
    
    // Chest plate detail
    if (!flash) { 
      ctx.fillStyle = "rgba(255,255,255,0.1)"; 
      ctx.beginPath(); ctx.roundRect(-10, -56, 20, 30, 8); ctx.fill(); 
    }
    
    // Shoulder pads
    if (!flash) { 
      ctx.fillStyle = "#ccc"; 
      ctx.beginPath(); ctx.arc(-18, -60, 8, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(14, -60, 8, 0, Math.PI*2); ctx.fill();
    }
    
    // Head / helmet (Rounded)
    if (!flash) { ctx.fillStyle = "#f0c88a"; ctx.beginPath(); ctx.roundRect(-9, -82, 18, 18, 4); ctx.fill(); }
    this.fill(ctx, flash, C);
    ctx.beginPath(); ctx.roundRect(-12, -90, 24, 16, 12); ctx.fill();
    
    if (!flash) {
      // eyes
      ctx.fillStyle = "#fff"; ctx.fillRect(-5, -78, 5, 4); ctx.fillRect(3, -78, 5, 4);
      ctx.fillStyle = "#1e3a8a"; ctx.fillRect(-2, -77, 2, 3); ctx.fillRect(6, -77, 2, 3);
      // visor
      ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(-11, -85, 22, 5);
    }
    
    // Front arm + shield
    this.fill(ctx, flash, C);
    ctx.beginPath(); ctx.roundRect(-24, -60, 12, 32, 6); ctx.fill();
    if (!flash) {
      ctx.fillStyle = "#cc2200"; 
      ctx.beginPath(); ctx.ellipse(-26, -45, 12, 18, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 2; ctx.stroke();
    }
    // Sword arm
    this.fill(ctx, flash, C);
    ctx.beginPath(); ctx.roundRect(14, -62, 12, 28, 6); ctx.fill();
    // Front leg
    ctx.fillStyle = flash ? "#fff" : "#4a3060"; 
    ctx.beginPath(); ctx.roundRect(2, -22, 11, 24 + leg, 5); ctx.fill();
    
    // Weapon
    const wv = this.equippedWeaponVisual;
    if (wv === "axe") this.drawAxe(ctx, atk);
    else if (wv === "hammer") this.drawHammer(ctx, atk);
    else this.drawSword(ctx, atk);
  }

  private drawKiller(ctx: CanvasRenderingContext2D, _gt: number, flash: boolean, leg: number, atk: boolean): void {
    const C = this.color;
    // Lean body (Rounded)
    const grad = ctx.createLinearGradient(-12, -60, 12, 0);
    grad.addColorStop(0, "#1a1a1a"); grad.addColorStop(1, "#333");
    ctx.fillStyle = flash ? "#fff" : grad;
    ctx.beginPath(); ctx.roundRect(-12, -62, 24, 60, 10); ctx.fill();
    
    // Hood
    ctx.fillStyle = flash ? "#fff" : "#000";
    ctx.beginPath();
    ctx.moveTo(-14, -60);
    ctx.bezierCurveTo(-16, -95, 16, -95, 14, -60);
    ctx.fill();
    
    if (!flash) {
      // Glow under hood
      ctx.shadowBlur = 15; ctx.shadowColor = C;
      ctx.fillStyle = C;
      ctx.beginPath(); ctx.arc(-4, -75, 2, 0, Math.PI*2); ctx.arc(4, -75, 2, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      
      // Scarf
      ctx.fillStyle = C;
      ctx.beginPath();
      ctx.moveTo(-12, -60);
      ctx.bezierCurveTo(-30, -50, -20, -10, -5, -35);
      ctx.fill();
    }
    
    // Legs
    ctx.fillStyle = flash ? "#fff" : "#111";
    ctx.beginPath(); ctx.roundRect(-10, -15, 8, 15 - leg, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(2, -15, 8, 15 + leg, 4); ctx.fill();
    
    // Arms (Dual wield)
    this.fill(ctx, flash, "#222");
    ctx.beginPath(); ctx.roundRect(-20, -55, 8, 25, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(12, -55, 8, 25, 4); ctx.fill();
    
    // Daggers
    this.drawDagger(ctx, -18, -35, -0.5, atk);
    this.drawDagger(ctx, 18, -35, 0.5, atk);
  }

  private drawDagger(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number, atk: boolean): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(atk ? rot * 2.5 : rot);
    ctx.fillStyle = "#333"; ctx.fillRect(-2, 0, 4, 8); // handle
    ctx.fillStyle = "#ccc"; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(0, -15); ctx.lineTo(3, 0); ctx.fill();
    ctx.restore();
  }

  // ────────────────────────────────────────────────────────── MAGE
  private drawMage(ctx: CanvasRenderingContext2D, gt: number, flash: boolean, leg: number, atk: boolean): void {
    const C = this.color;
    const glow = Math.sin(gt * 0.08) * 0.5 + 0.5;
    // Robe back (Rounded)
    ctx.fillStyle = flash ? "#fff" : "#2a0d5e";
    ctx.beginPath(); ctx.roundRect(-14, -60, 10, 62, 5); ctx.fill();
    
    // Robe main (Organic path)
    const grad = ctx.createLinearGradient(-12, -60, 12, 0);
    grad.addColorStop(0, C); grad.addColorStop(1, "#1a0840");
    this.fill(ctx, flash, grad as unknown as string);
    ctx.beginPath();
    ctx.moveTo(-12, -60);
    ctx.lineTo(14, -60);
    ctx.lineTo(16, 0);
    ctx.bezierCurveTo(0, 5, -10, 5, -15, 0);
    ctx.closePath();
    ctx.fill();

    if (!flash) {
      // Robe trim (Rounded)
      ctx.fillStyle = "#c8a0ff"; 
      ctx.beginPath(); ctx.roundRect(-12, -62, 26, 4, 2); ctx.fill();
    }
    
    // Legs
    ctx.fillStyle = flash ? "#fff" : "#1a0840"; 
    ctx.beginPath(); ctx.roundRect(-10, -15, 8, 15 - leg, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(2, -15, 8, 15 + leg, 4); ctx.fill();
    
    // Shoulder pads (Rounded)
    this.fill(ctx, flash, C);
    ctx.beginPath(); ctx.arc(-15, -60, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, -60, 6, 0, Math.PI*2); ctx.fill();

    // Head (Rounded)
    if (!flash) { ctx.fillStyle = "#f0c88a"; ctx.beginPath(); ctx.roundRect(-9, -88, 18, 20, 8); ctx.fill(); }
    
    // Hair (Organic)
    if (!flash) { 
      ctx.fillStyle = "#e8c030"; 
      ctx.beginPath(); ctx.arc(0, -90, 10, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.roundRect(-12, -88, 6, 14, 3); ctx.fill();
    }
    
    // Hat (Pointy but rounded base)
    this.fill(ctx, flash, C);
    ctx.beginPath();
    ctx.moveTo(-15, -92);
    ctx.lineTo(15, -92);
    ctx.lineTo(0, -115);
    ctx.closePath();
    ctx.fill();
    
    // Staff arm
    this.fill(ctx, flash, C); ctx.beginPath(); ctx.roundRect(-20, -62, 9, 30, 4); ctx.fill();
    // Staff (Natural wood)
    if (!flash) { 
        ctx.fillStyle = "#6b3e23"; 
        ctx.beginPath(); ctx.roundRect(-26, -100, 5, 80, 2); ctx.fill(); 
    }
    // Orb glow
    if (!flash) {
      ctx.shadowBlur = 25 + glow * 15; ctx.shadowColor = C;
      ctx.fillStyle = `rgba(${this.color === "#00e5ff" ? "0,200,255" : this.color === "#00ff88" ? "0,255,136" : "187,68,255"},${0.8 + glow * 0.2})`;
      ctx.beginPath(); ctx.arc(-24, -105, 10, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ────────────────────────────────────────────────────────── TROLL
  private drawTroll(ctx: CanvasRenderingContext2D, _gt: number, flash: boolean, leg: number, atk: boolean): void {
    const C = this.color;
    // Legs (Stocky/Rounded)
    ctx.fillStyle = flash ? "#fff" : "#3d5c1a"; 
    ctx.beginPath(); ctx.roundRect(-18, -28, 16, 28 - leg, 8); ctx.fill();
    ctx.beginPath(); ctx.roundRect(4, -28, 16, 28 + leg, 8); ctx.fill();

    // Body (Massive/Rounded)
    const grad = ctx.createLinearGradient(-25, -70, 25, 0);
    grad.addColorStop(0, C); grad.addColorStop(1, "#1a3011");
    this.fill(ctx, flash, grad as unknown as string);
    ctx.beginPath(); ctx.roundRect(-25, -74, 50, 52, 20); ctx.fill();
    
    if (!flash) {
      // Skin details (Warpaint/Tattoos)
      ctx.fillStyle = "rgba(0,0,0,0.1)"; ctx.beginPath(); ctx.arc(0, -50, 15, 0, Math.PI*2); ctx.fill();
    }
    
    // Head (Protruding/Rounded)
    this.fill(ctx, flash, C);
    ctx.beginPath(); ctx.roundRect(-18, -105, 36, 35, 15); ctx.fill();
    
    if (!flash) {
      // Tusks (Curved)
      ctx.fillStyle = "#fffde0"; 
      ctx.beginPath(); ctx.quadraticCurveTo(-20, -70, -25, -85); ctx.lineTo(-15, -75); ctx.fill();
      ctx.beginPath(); ctx.quadraticCurveTo(20, -70, 25, -85); ctx.lineTo(15, -75); ctx.fill();
      
      // Eyes (Angry)
      ctx.fillStyle = "#fff"; 
      ctx.beginPath(); ctx.arc(-8, -92, 4, 0, Math.PI*2); ctx.arc(8, -92, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#cc0000"; ctx.beginPath(); ctx.arc(-7, -92, 2, 0, Math.PI*2); ctx.arc(9, -92, 2, 0, Math.PI*2); ctx.fill();
    }
    
    // Arms (Huge/Rounded)
    this.fill(ctx, flash, C);
    ctx.beginPath(); ctx.roundRect(-40, -72, 18, 44, 9); ctx.fill();
    ctx.beginPath(); ctx.roundRect(22, -72, 18, 44, 9); ctx.fill();
    
    // Axe
    this.drawAxe(ctx, atk);
  }

  // ────────────────────────────────────────────────────────── NECROMANCER
  private drawNecro(ctx: CanvasRenderingContext2D, gt: number, flash: boolean, leg: number, atk: boolean): void {
    const C = this.color;
    const float = Math.sin(gt * 0.06) * 6;
    
    ctx.translate(0, float - 8); // Always floating!
    
    // Aura glow
    if (atk && !flash) {
      ctx.shadowBlur = 45; ctx.shadowColor = C;
    }
    
    // Robe pack (Flowing)
    ctx.fillStyle = flash ? "#fff" : "#111"; 
    ctx.beginPath();
    ctx.moveTo(-15, -64);
    ctx.lineTo(15, -64);
    ctx.lineTo(18, 5);
    ctx.bezierCurveTo(0, 10, -10, 10, -18, 5);
    ctx.closePath();
    ctx.fill();

    // Dark magic tendrils (Organic)
    if (!flash) {
      ctx.fillStyle = C; 
      ctx.globalAlpha = 0.5 + Math.sin(gt*0.1)*0.3;
      ctx.beginPath(); ctx.ellipse(-14, 0, 4, 15 + Math.sin(gt*0.2)*5, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(14, 0, 4, 15 + Math.cos(gt*0.2)*5, 0, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    
    // Head/Hood (Organic/Rounded)
    ctx.fillStyle = flash ? "#fff" : "#111"; 
    ctx.beginPath(); ctx.roundRect(-15, -90, 30, 26, 15); ctx.fill();
    
    if (!flash) {
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.roundRect(-10, -82, 20, 16, 8); ctx.fill(); // Face shadow
      // Glowing angular eyes
      ctx.shadowBlur = 15; ctx.shadowColor = C; ctx.fillStyle = C;
      ctx.beginPath(); ctx.arc(-4, -76, 2.5, 0, Math.PI*2); ctx.arc(4, -76, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    // Staff (Organic)
    if (!flash) {
      ctx.fillStyle = "#3a2a40"; ctx.beginPath(); ctx.roundRect(18, -95, 4, 85, 2); ctx.fill();
      // Skull (Rounded)
      ctx.fillStyle = "#ddd"; ctx.beginPath(); ctx.roundRect(14, -105, 12, 12, 4); ctx.fill();
      // Glow
      ctx.shadowBlur = 25; ctx.shadowColor = C;
      ctx.fillStyle = C; ctx.beginPath(); ctx.arc(20, -110, 7 + (atk ? 5 : 0), 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ────────────────────────────────────────────────────────── BERSERKER
  private drawBerserker(ctx: CanvasRenderingContext2D, _gt: number, flash: boolean, leg: number, atk: boolean): void {
    const C = this.color;
    
    // Legs (Muscular/Rounded)
    ctx.fillStyle = flash ? "#fff" : "#4a2a1a"; 
    ctx.beginPath(); ctx.roundRect(-18, -24, 14, 24 - leg, 6); ctx.fill();
    ctx.beginPath(); ctx.roundRect(6, -24, 14, 24 + leg, 6); ctx.fill();
    
    // Muscular Body (Organic)
    this.fill(ctx, flash, "#e8a070");
    ctx.beginPath(); ctx.roundRect(-22, -65, 44, 42, 15); ctx.fill();
    
    if (!flash) {
      // Tattoos (Rounded)
      ctx.fillStyle = C;
      ctx.beginPath(); ctx.arc(-10, -50, 5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(10, -50, 5, 0, Math.PI*2); ctx.fill();
      
      // Pants (Rounded)
      ctx.fillStyle = "#3a1a10"; ctx.beginPath(); ctx.roundRect(-24, -30, 48, 14, 5); ctx.fill();
      ctx.fillStyle = "#8a8a9a"; ctx.beginPath(); ctx.roundRect(-8, -32, 16, 8, 3); ctx.fill(); // Belt
    }
    
    // Head (Rounded)
    this.fill(ctx, flash, "#e8a070");
    ctx.beginPath(); ctx.roundRect(-12, -85, 24, 22, 10); ctx.fill();
    
    if (!flash) {
      // Hair/Beard (Organic)
      ctx.fillStyle = C; 
      ctx.beginPath(); ctx.arc(0, -85, 14, Math.PI, 0); ctx.fill();
      ctx.beginPath(); ctx.roundRect(-14, -72, 28, 12, 5); ctx.fill(); // Beard
      
      // Eyes (Angry dots)
      ctx.fillStyle = "#fff"; 
      ctx.beginPath(); ctx.arc(-5, -78, 3, 0, Math.PI*2); ctx.arc(5, -78, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(-5, -78, 1, 0, Math.PI*2); ctx.arc(5, -78, 1, 0, Math.PI*2); ctx.fill();
    }
    
    // Rage aura
    if (atk && !flash) {
      ctx.shadowBlur = 30; ctx.shadowColor = C;
      ctx.fillStyle = C;
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.arc(0, -45, 40, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
    
    // Weapons
    const wv = this.equippedWeaponVisual;
    if (wv === "sword") this.drawSword(ctx, atk);
    else if (wv === "hammer") this.drawHammer(ctx, atk);
    else {
      // Dual axes (Positioned naturally)
      ctx.save();
      ctx.translate(-28, -40);
      this.drawAxe(ctx, atk);
      ctx.restore();
      ctx.save();
      ctx.translate(22, -40);
      this.drawAxe(ctx, atk);
      ctx.restore();
    }
  }

  private drawSword(ctx: CanvasRenderingContext2D, atk: boolean): void {
    ctx.save();
    ctx.translate(22, -55);
    ctx.rotate(atk ? -Math.PI * 0.55 : -Math.PI * 0.15);
    // Handle
    ctx.fillStyle = "#7a4010"; ctx.fillRect(-3, 12, 6, 18);
    // Guard
    ctx.fillStyle = "#cc9900"; ctx.fillRect(-9, 6, 18, 6);
    // Pommel
    ctx.fillStyle = "#cc9900"; ctx.fillRect(-4, 28, 8, 6);
    // Blade
    ctx.fillStyle = "#d8d8e8";
    ctx.beginPath();
    ctx.moveTo(-3, -38); ctx.lineTo(3, -38); ctx.lineTo(5, 8); ctx.lineTo(-5, 8);
    ctx.closePath(); ctx.fill();
    // Blade edge shine
    ctx.fillStyle = "#ffffff"; ctx.fillRect(-1, -36, 2, 40);
    ctx.restore();
  }

  private drawHammer(ctx: CanvasRenderingContext2D, atk: boolean): void {
    ctx.save();
    ctx.translate(24, -58);
    ctx.rotate(atk ? -Math.PI * 0.6 : 0);
    // Handle
    ctx.fillStyle = "#5c2e08"; ctx.fillRect(-3, -6, 6, 60);
    // Head left
    ctx.fillStyle = "#8a8aaa"; ctx.fillRect(-14, -34, 30, 20);
    // Head top / edge
    ctx.fillStyle = "#b0b0cc"; ctx.fillRect(-12, -38, 26, 8);
    // Bolts
    ctx.fillStyle = "#ffcc00"; ctx.fillRect(-10, -30, 5, 5); ctx.fillRect(7, -30, 5, 5);
    ctx.restore();
  }

  private drawAxe(ctx: CanvasRenderingContext2D, atk: boolean): void {
    ctx.save();
    ctx.translate(30, -60);
    ctx.rotate(atk ? -Math.PI * 0.65 : Math.PI * 0.08);
    // Handle
    ctx.fillStyle = "#5c2e08"; ctx.fillRect(-3, -10, 7, 65);
    // Axe head body
    ctx.fillStyle = "#9a9aaa";
    ctx.beginPath();
    ctx.moveTo(4, -30); ctx.lineTo(30, -42); ctx.lineTo(34, -16); ctx.lineTo(4, -8);
    ctx.closePath(); ctx.fill();
    // Axe edge
    ctx.fillStyle = "#e0e0f0";
    ctx.beginPath();
    ctx.moveTo(28, -44); ctx.lineTo(38, -48); ctx.lineTo(38, -10); ctx.lineTo(28, -12);
    ctx.closePath(); ctx.fill();
    // Back spike
    ctx.fillStyle = "#7a7a8a";
    ctx.beginPath();
    ctx.moveTo(4, -20); ctx.lineTo(-10, -26); ctx.lineTo(-8, -14); ctx.lineTo(4, -12);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
