// fighter.ts — Fighter class: AI, damage, pixel-art draw

import { Particle, DamageText } from "./particles.js";

// Shared mutable state — use an object so it acts as a reference
export const state = { screenShake: 0 };

export type FighterState = "idle" | "moving" | "retreating" | "attacking" | "charging" | "casting" | "circling";

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

  if (charType === "mage" || charType === "killer") {
    _drawMagePreview(ctx, color, gt, s);
  } else if (charType === "necro") {
    _drawNecroPreview(ctx, color, gt, s);
  } else if (charType === "berserker") {
    _drawBerserkerPreview(ctx, color, gt, s);
  } else if (charType === "troll") {
    _drawTrollPreview(ctx, color, s);
  } else {
    _drawKnightPreview(ctx, color, s);
  }

  ctx.restore();
}

function _drawKnightPreview(ctx: CanvasRenderingContext2D, C: string, _s: number): void {
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.ellipse(0, 2, 30, 8, 0, 0, Math.PI*2); ctx.fill();
  
  ctx.fillStyle = "#8b1a1a";
  ctx.beginPath(); ctx.moveTo(-10, -60); ctx.lineTo(-26, -5); ctx.lineTo(-8, -5); ctx.fill();
  
  ctx.fillStyle = "#2a1b38"; ctx.fillRect(-12, -22, 10, 24);
  
  const grad = ctx.createLinearGradient(-14, -62, 14, -20);
  grad.addColorStop(0, C); grad.addColorStop(1, "#222");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(-14, -62, 28, 42, 4); ctx.fill();
  
  ctx.fillStyle = "#dde0e8";
  ctx.beginPath(); ctx.roundRect(-10, -58, 20, 26, 3); ctx.fill();
  
  ctx.fillStyle = C; ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(6, -42); ctx.lineTo(0, -36); ctx.lineTo(-6, -42); ctx.fill();
  
  ctx.fillStyle = "#ccc";
  ctx.beginPath(); ctx.arc(-16, -58, 8, 0, Math.PI, true); ctx.fill();
  ctx.beginPath(); ctx.arc(16, -58, 8, 0, Math.PI, true); ctx.fill();
  
  ctx.fillStyle = "#4a3060"; ctx.fillRect(2, -22, 10, 24);
  
  ctx.fillStyle = C;
  ctx.beginPath(); ctx.roundRect(-14, -94, 28, 26, 6); ctx.fill();
  
  ctx.fillStyle = "#f0c88a"; ctx.fillRect(-8, -84, 16, 12); // face showing
  ctx.fillStyle = "#fff"; ctx.fillRect(-5, -81, 4, 4); ctx.fillRect(3, -81, 4, 4); // eyes
  ctx.fillStyle = "#1e3a8a"; ctx.fillRect(-3, -80, 2, 2); ctx.fillRect(5, -80, 2, 2); // pupils
  ctx.strokeStyle = "#4a2a1a"; ctx.lineWidth = 1.5; // determined brow
  ctx.beginPath(); ctx.moveTo(-6, -83); ctx.lineTo(-1, -82); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -83); ctx.lineTo(3, -82); ctx.stroke(); ctx.lineWidth = 1;
  
  ctx.fillStyle = C; ctx.fillRect(-22, -60, 10, 30);
  
  ctx.fillStyle = "#cc2200";
  ctx.beginPath(); ctx.moveTo(-28, -66); ctx.lineTo(-12, -66); ctx.lineTo(-12, -30); ctx.lineTo(-20, -20); ctx.lineTo(-28, -30); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = "#ffcc00"; ctx.stroke();
  
  ctx.fillStyle = C; ctx.fillRect(14, -60, 10, 26);
  ctx.fillStyle = "#7a4010"; ctx.fillRect(26, -48, 6, 16);
  ctx.fillStyle = "#cc9900"; ctx.fillRect(20, -52, 18, 4);
  ctx.fillStyle = "#d8d8e8";
  ctx.beginPath(); ctx.moveTo(26,-86); ctx.lineTo(32,-86); ctx.lineTo(33,-52); ctx.lineTo(25,-52); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.fillRect(28, -84, 2, 32);
}

function _drawMagePreview(ctx: CanvasRenderingContext2D, C: string, gt: number, _s: number): void {
  const float = Math.sin(gt * 0.05) * 5;
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(0, 4, 24, 6, 0, 0, Math.PI*2); ctx.fill();
  
  ctx.translate(0, float - 2);
  
  ctx.fillStyle = "#2a0d5e"; ctx.beginPath(); ctx.roundRect(-14, -62, 28, 64, 6); ctx.fill();
  
  const grad = ctx.createLinearGradient(-12, -60, 12, 0);
  grad.addColorStop(0, C); grad.addColorStop(1, "#331166");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(-12, -60, 24, 60, 4); ctx.fill();
  
  ctx.shadowBlur = 10; ctx.shadowColor = "#00e5ff";
  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(-6, -20, 12, 2); ctx.fillRect(-4, -14, 8, 2);
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = "#c8a0ff"; ctx.fillRect(-10, -44, 20, 6);
  ctx.fillStyle = "#e0c0ff"; ctx.beginPath(); ctx.arc(0, -41, 4, 0, Math.PI*2); ctx.fill();
  
  ctx.fillStyle = C;
  ctx.beginPath(); ctx.arc(-16, -58, 7, 0, Math.PI, true); ctx.fill();
  ctx.beginPath(); ctx.arc(16, -58, 7, 0, Math.PI, true); ctx.fill();
  
  ctx.fillStyle = "#f0c88a"; ctx.fillRect(-6, -72, 12, 10);
  ctx.fillStyle = "#f0c88a"; ctx.beginPath(); ctx.roundRect(-10, -90, 20, 20, 8); ctx.fill();
  
  ctx.fillStyle = "#e8c030";
  ctx.beginPath(); ctx.roundRect(-12, -94, 24, 12, 6); ctx.fill();
  
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(-4, -84, 3, 4, 0, 0, Math.PI*2); ctx.ellipse(4, -84, 3, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#2055ff"; ctx.beginPath(); ctx.arc(-3, -84, 2, 0, Math.PI*2); ctx.arc(5, -84, 2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-4, -85, 1, 0, Math.PI*2); ctx.arc(4, -85, 1, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#b08020"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-7, -89); ctx.lineTo(-1, -88); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(7, -89); ctx.lineTo(1, -88); ctx.stroke(); ctx.lineWidth = 1;
  
  ctx.fillStyle = C;
  ctx.beginPath(); ctx.moveTo(-16, -90); ctx.lineTo(16, -90); ctx.lineTo(0, -114); ctx.fill();
  
  ctx.fillStyle = C; ctx.fillRect(-22, -60, 8, 28);
  
  ctx.fillStyle = "#5c3a21"; ctx.fillRect(-26, -104, 4, 84);
  const crystalGlow = 16 + Math.sin(gt * 0.1) * 8;
  ctx.shadowBlur = crystalGlow; ctx.shadowColor = "#00e5ff";
  ctx.fillStyle = "#00e5ff";
  ctx.beginPath(); ctx.moveTo(-24, -116); ctx.lineTo(-20, -106); ctx.lineTo(-24, -100); ctx.lineTo(-28, -106); ctx.fill();
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = C; ctx.fillRect(14, -60, 8, 24);
}

function _drawTrollPreview(ctx: CanvasRenderingContext2D, C: string, _s: number): void {
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.ellipse(0, 2, 38, 10, 0, 0, Math.PI*2); ctx.fill();
  
  ctx.fillStyle = "#2d4a1a"; ctx.beginPath(); ctx.roundRect(-18, -30, 16, 30, 4); ctx.fill();
  
  const grad = ctx.createLinearGradient(-26, -80, 26, -20);
  grad.addColorStop(0, C); grad.addColorStop(1, "#1a3311");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(-26, -80, 52, 56, 12); ctx.fill();
  
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath(); ctx.arc(-10, -66, 14, 0, Math.PI, false); ctx.fill();
  ctx.beginPath(); ctx.arc(10, -66, 14, 0, Math.PI, false); ctx.fill();
  
  ctx.fillStyle = "#4a2610"; ctx.beginPath(); ctx.roundRect(-24, -36, 48, 18, 4); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, -27, 4, 0, Math.PI*2); ctx.fill(); // bone buckle
  
  ctx.fillStyle = "#666";
  ctx.beginPath(); ctx.arc(-26, -76, 12, 0, Math.PI, true); ctx.fill();
  ctx.beginPath(); ctx.arc(26, -76, 12, 0, Math.PI, true); ctx.fill();
  
  ctx.fillStyle = "#2d4a1a"; ctx.beginPath(); ctx.roundRect(2, -30, 16, 30, 4); ctx.fill();
  
  ctx.fillStyle = C;
  ctx.beginPath(); ctx.roundRect(-38, -74, 16, 46, 8); ctx.fill(); // back arm
  ctx.beginPath(); ctx.roundRect(22, -74, 16, 46, 8); ctx.fill();  // front arm
  
  ctx.fillStyle = C;
  ctx.beginPath(); ctx.roundRect(-20, -112, 40, 36, 10); ctx.fill();
  
  ctx.fillStyle = "#cc0000"; // Warpaint
  ctx.fillRect(-20, -96, 40, 6);
  
  ctx.fillStyle = "#fffde0";
  ctx.beginPath(); ctx.moveTo(-16, -82); ctx.lineTo(-12, -96); ctx.lineTo(-8, -82); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8, -82); ctx.lineTo(12, -96); ctx.lineTo(16, -82); ctx.fill();
  
  ctx.fillStyle = "#fff"; 
  ctx.beginPath(); ctx.moveTo(-12, -100); ctx.lineTo(-5, -97); ctx.lineTo(-12, -95); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6, -97); ctx.lineTo(13, -100); ctx.lineTo(13, -95); ctx.fill();
  ctx.fillStyle = "#cc0000"; ctx.beginPath(); ctx.arc(-7, -97, 1.5, 0, Math.PI*2); ctx.arc(11, -97, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#1a1005"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-13, -102); ctx.lineTo(1, -98); ctx.lineTo(14, -102); ctx.stroke(); ctx.lineWidth = 1;
  
  ctx.fillStyle = "#3a2010";
  ctx.beginPath(); ctx.moveTo(-16,-112); ctx.lineTo(-24,-130); ctx.lineTo(-6,-110); ctx.fill();
  ctx.beginPath(); ctx.moveTo(16,-112); ctx.lineTo(24,-130); ctx.lineTo(6,-110); ctx.fill();
  
  ctx.fillStyle = "#5c2e08"; ctx.fillRect(30, -100, 6, 80);
  ctx.fillStyle = "#8a8aaa";
  ctx.beginPath(); ctx.moveTo(33,-96); ctx.lineTo(66,-112); ctx.lineTo(72,-76); ctx.lineTo(33,-64); ctx.fill();
  ctx.fillStyle = "#e0e0f0";
  ctx.beginPath(); ctx.moveTo(64,-108); ctx.lineTo(78,-114); ctx.lineTo(78,-74); ctx.lineTo(64,-78); ctx.fill();
}

function _drawNecroPreview(ctx: CanvasRenderingContext2D, C: string, gt: number, _s: number): void {
  const float = Math.sin(gt * 0.05) * 4;
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(0, 4, 20, 5, 0, 0, Math.PI*2); ctx.fill();
  
  ctx.translate(0, float - 4); // Floating effect
  
  // Robe body
  ctx.fillStyle = "#111"; ctx.fillRect(-12, -64, 24, 52);
  // Hood
  ctx.fillStyle = "#111"; ctx.fillRect(-14, -86, 28, 22);
  // Face shadow
  ctx.fillStyle = "#000"; ctx.fillRect(-8, -80, 16, 14);
  // Glowing eyes
  ctx.shadowBlur = 15; ctx.shadowColor = C; ctx.fillStyle = C;
  ctx.beginPath(); ctx.moveTo(-6, -78); ctx.lineTo(-1, -75); ctx.lineTo(-6, -74); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6, -78); ctx.lineTo(1, -75); ctx.lineTo(6, -74); ctx.fill();
  ctx.shadowBlur = 0;
  // Arcane trim
  ctx.fillStyle = C; ctx.fillRect(-6, -64, 12, 2);
  ctx.fillRect(-2, -62, 4, 30);
  
  // Staff
  ctx.fillStyle = "#3a2a40"; ctx.fillRect(-24, -90, 4, 80);
  // Staff skull
  ctx.fillStyle = "#ddd"; ctx.fillRect(-28, -100, 12, 12);
  ctx.fillStyle = "#000"; ctx.fillRect(-26, -96, 3, 3); ctx.fillRect(-21, -96, 3, 3);
  // Magical aura from skull
  ctx.shadowBlur = 15; ctx.shadowColor = C;
  ctx.fillStyle = `rgba(${C === "#ba55ff" ? "186,85,255" : "0,255,0"}, ${0.6 + Math.sin(gt * 0.1)*0.2})`;
  ctx.beginPath(); ctx.arc(-22, -106, 6 + Math.sin(gt*0.1)*2, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
}

function _drawBerserkerPreview(ctx: CanvasRenderingContext2D, C: string, gt: number, _s: number): void {
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(0, 2, 26, 8, 0, 0, Math.PI*2); ctx.fill();
  
  const breathe = Math.sin(gt * 0.1) * 2;
  
  // Back leg
  ctx.fillStyle = "#4a2a1a"; ctx.fillRect(-16, -24, 12, 24);
  // Torso (muscular)
  ctx.fillStyle = "#e8a070"; ctx.fillRect(-18, -60, 36, 36 + breathe);
  // Tribal tattoos
  ctx.fillStyle = C; ctx.fillRect(-14, -54, 8, 4); ctx.fillRect(6, -54, 8, 4);
  ctx.fillRect(-10, -46, 20, 4);
  // Pants
  ctx.fillStyle = "#3a1a10"; ctx.fillRect(-20, -28 - breathe, 40, 12);
  // Belt
  ctx.fillStyle = "#8a8a9a"; ctx.fillRect(-6, -30 - breathe, 12, 8);
  // Front leg
  ctx.fillStyle = "#4a2a1a"; ctx.fillRect(4, -24, 12, 24);
  // Head
  ctx.fillStyle = "#e8a070"; ctx.fillRect(-10, -78, 20, 18);
  // Hair/Beard
  ctx.fillStyle = C; ctx.fillRect(-12, -82, 24, 8); // Hair
  ctx.fillRect(-12, -70, 24, 10); // Beard
  // Eyes (enraged)
  ctx.fillStyle = "#fff"; 
  ctx.beginPath(); ctx.ellipse(-4, -74, 3, 2, 0, 0, Math.PI*2); ctx.ellipse(4, -74, 3, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(-3, -74, 1, 0, Math.PI*2); ctx.arc(5, -74, 1, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = C; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-8, -77); ctx.lineTo(-2, -75); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -77); ctx.lineTo(2, -75); ctx.stroke(); ctx.lineWidth = 1;
  
  // Double axes!
  // Back axe
  ctx.fillStyle = "#4a2a1a"; ctx.fillRect(-30, -70, 4, 40);
  ctx.fillStyle = "#aab"; ctx.beginPath(); ctx.moveTo(-32,-74); ctx.lineTo(-44,-60); ctx.lineTo(-28,-50); ctx.fill();
  // Front axe
  ctx.fillStyle = "#4a2a1a"; ctx.fillRect(26, -70, 4, 40);
  ctx.fillStyle = "#aab"; ctx.beginPath(); ctx.moveTo(32,-74); ctx.lineTo(44,-60); ctx.lineTo(28,-50); ctx.fill();
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
      this.drawKnight(ctx, gameTime, flash, legSwing, attacking); // killer uses knight body
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
    ctx.fillRect(-11, -88, 22, 14); // helmet top
    if (!flash) {
      // eyes
      ctx.fillStyle = "#fff"; ctx.fillRect(-5, -78, 5, 4); ctx.fillRect(3, -78, 5, 4);
      ctx.fillStyle = "#1e3a8a"; ctx.fillRect(-2, -77, 2, 3); ctx.fillRect(6, -77, 2, 3);
      ctx.strokeStyle = "#4a2a1a"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-7, -80); ctx.lineTo(-2, -79); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(9, -80); ctx.lineTo(4, -79); ctx.stroke(); ctx.lineWidth = 1;
      // raised visor
      ctx.fillStyle = "#888"; ctx.fillRect(-11, -85, 22, 5);
      // helmet lower guard
      ctx.fillStyle = "#888"; ctx.fillRect(-9, -71, 18, 5);
    }
    // Front arm + shield
    this.fill(ctx, flash, C);
    ctx.fillRect(-24, -60, 11, 32); // shield arm
    if (!flash) {
      ctx.fillStyle = "#cc2200"; ctx.fillRect(-28, -64, 10, 38); // shield body
      ctx.fillStyle = "#ffcc00"; ctx.fillRect(-25, -52, 4, 4);  // shield emblem
    }
    // Sword arm
    this.fill(ctx, flash, C);
    ctx.fillRect(14, -62, 11, 28);
    // Front leg
    ctx.fillStyle = flash ? "#fff" : "#4a3060"; ctx.fillRect(2, -22, 11, 24 + leg);
    // Weapon — use equipped visual if set
    const wv = this.equippedWeaponVisual;
    if (wv === "axe") this.drawAxe(ctx, atk);
    else if (wv === "hammer") this.drawHammer(ctx, atk);
    else this.drawSword(ctx, atk); // default sword
  }

  // ────────────────────────────────────────────────────────── MAGE
  private drawMage(ctx: CanvasRenderingContext2D, gt: number, flash: boolean, leg: number, atk: boolean): void {
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
      ctx.fillStyle = "#c8a0ff"; ctx.fillRect(-12, -62, 26, 4);
      ctx.fillRect(-12, -30, 26, 4);
    }
    // Back leg (robe slit)
    ctx.fillStyle = flash ? "#fff" : "#1a0840"; ctx.fillRect(-10, -20, 9, 20 - leg);
    // Front leg
    ctx.fillStyle = flash ? "#fff" : "#1a0840"; ctx.fillRect(2, -20, 9, 20 + leg);
    // Body under robe (belt)
    if (!flash) { ctx.fillStyle = "#c8a0ff"; ctx.fillRect(-8, -42, 18, 5); }
    // Cloak shoulders
    this.fill(ctx, flash, C);
    ctx.fillRect(-18, -62, 8, 20); ctx.fillRect(12, -62, 8, 20);
    // Neck
    if (!flash) { ctx.fillStyle = "#f0c88a"; ctx.fillRect(-5, -72, 11, 12); }
    // Head
    if (!flash) { ctx.fillStyle = "#f0c88a"; ctx.fillRect(-9, -88, 18, 20); }
    // Hair (blonde)
    if (!flash) { ctx.fillStyle = "#e8c030"; ctx.fillRect(-10, -92, 20, 10); ctx.fillRect(-12, -88, 6, 14); }
    // Eyes
    if (!flash) {
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(-4, -80, 3, 4, 0, 0, Math.PI*2); ctx.ellipse(4, -80, 3, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#2055ff"; ctx.beginPath(); ctx.arc(-3, -80, 2, 0, Math.PI*2); ctx.arc(5, -80, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-4, -81, 1, 0, Math.PI*2); ctx.arc(4, -81, 1, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#b08020"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-7, -85); ctx.lineTo(-1, -84); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7, -85); ctx.lineTo(1, -84); ctx.stroke(); ctx.lineWidth = 1;
    }
    // Hood / hat
    this.fill(ctx, flash, C);
    ctx.fillRect(-10, -96, 20, 10);
    // Staff arm
    this.fill(ctx, flash, C); ctx.fillRect(-20, -62, 9, 30);
    // Staff
    if (!flash) { ctx.fillStyle = "#8b5c20"; ctx.fillRect(-26, -100, 5, 80); }
    // Orb glow
    if (!flash) {
      ctx.shadowBlur = 20 + glow * 20; ctx.shadowColor = C;
      ctx.fillStyle = flash ? "#fff" : `rgba(${this.color === "#00e5ff" ? "0,200,255" : this.color === "#00ff88" ? "0,255,136" : "187,68,255"},${0.8 + glow * 0.2})`;
      ctx.beginPath(); ctx.arc(-24, -105, 9, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    // Cast hand glow on attack
    if (atk && !flash) {
      ctx.shadowBlur = 30; ctx.shadowColor = C;
      ctx.fillStyle = C; ctx.beginPath(); ctx.arc(18, -50, 11, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      this.fill(ctx, flash, C); ctx.fillRect(14, -58, 9, 22);
    }
  }

  // ────────────────────────────────────────────────────────── TROLL
  private drawTroll(ctx: CanvasRenderingContext2D, _gt: number, flash: boolean, leg: number, atk: boolean): void {
    const C = this.color;
    // Back leg
    ctx.fillStyle = flash ? "#fff" : "#3d5c1a"; ctx.fillRect(-16, -28, 14, 28 - leg);
    // Body (big & stocky)
    this.fill(ctx, flash, C);
    ctx.fillRect(-22, -74, 46, 52);
    if (!flash) {
      // Leather loincloth
      ctx.fillStyle = "#6b3a10"; ctx.fillRect(-20, -30, 42, 14);
      // Muscle definition
      ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fillRect(-10, -70, 8, 30); ctx.fillRect(4, -70, 8, 30);
      // Shoulder armor
      ctx.fillStyle = "#888"; ctx.fillRect(-26, -76, 14, 14); ctx.fillRect(14, -76, 14, 14);
    }
    // Head (bigger, brutish)
    this.fill(ctx, flash, C);
    ctx.fillRect(-16, -100, 34, 30);
    if (!flash) {
      // Tusks
      ctx.fillStyle = "#fffde0"; ctx.fillRect(-14, -76, 5, 10); ctx.fillRect(11, -76, 5, 10);
      // Eyes, sharp angry shape
      ctx.fillStyle = "#fff"; 
      ctx.beginPath(); ctx.moveTo(-11, -92); ctx.lineTo(-4, -89); ctx.lineTo(-11, -87); ctx.fill();
      ctx.beginPath(); ctx.moveTo(5, -89); ctx.lineTo(12, -92); ctx.lineTo(12, -87); ctx.fill();
      ctx.fillStyle = "#cc0000"; ctx.beginPath(); ctx.arc(-6, -89, 1.5, 0, Math.PI*2); ctx.arc(10, -89, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#1a1005"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-12, -94); ctx.lineTo(0, -90); ctx.lineTo(13, -94); ctx.stroke(); ctx.lineWidth = 1;
      // Nose
      ctx.fillStyle = "#2d5010"; ctx.fillRect(-4, -84, 8, 6);
      // Horns
      ctx.fillStyle = "#4a3010";
      ctx.beginPath(); ctx.moveTo(-12, -100); ctx.lineTo(-18, -118); ctx.lineTo(-5, -100); ctx.fill();
      ctx.beginPath(); ctx.moveTo(14, -100); ctx.lineTo(20, -118); ctx.lineTo(8, -100); ctx.fill();
    }
    // Arms
    this.fill(ctx, flash, C);
    ctx.fillRect(-36, -72, 16, 40); // back arm
    ctx.fillRect(22, -72, 16, 40);  // front arm
    // Front leg
    ctx.fillStyle = flash ? "#fff" : "#3d5c1a"; ctx.fillRect(4, -28, 14, 28 + leg);
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
      ctx.shadowBlur = 40; ctx.shadowColor = C;
    }
    
    // Robe pack
    ctx.fillStyle = flash ? "#fff" : "#111"; ctx.fillRect(-12, -64, 24, 60);
    // Dark magic tendrils
    if (!flash) {
      ctx.fillStyle = C; 
      ctx.globalAlpha = 0.6 + Math.sin(gt*0.1)*0.3;
      ctx.fillRect(-16, -20 + leg, 4, 20);
      ctx.fillRect(12, -10 - leg, 4, 15);
      ctx.globalAlpha = 1;
    }
    
    // Arcane trim
    this.fill(ctx, flash, C);
    ctx.fillRect(-6, -64, 12, 2);
    ctx.fillRect(-2, -62, 4, 30);
    
    // Head/Hood
    ctx.fillStyle = flash ? "#fff" : "#111"; ctx.fillRect(-14, -86, 28, 22);
    if (!flash) {
      ctx.fillStyle = "#000"; ctx.fillRect(-8, -80, 16, 14); // Face shadow
      // Glowing angular eyes
      ctx.shadowBlur = 15; ctx.shadowColor = C; ctx.fillStyle = C;
      ctx.beginPath(); ctx.moveTo(-6, -78); ctx.lineTo(-1, -75); ctx.lineTo(-6, -74); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, -78); ctx.lineTo(1, -75); ctx.lineTo(6, -74); ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    // Staff
    if (!flash) {
      ctx.fillStyle = "#3a2a40"; ctx.fillRect(16, -90, 4, 80);
      // Skull
      ctx.fillStyle = "#ddd"; ctx.fillRect(12, -100, 12, 12);
      ctx.fillStyle = "#000"; ctx.fillRect(14, -96, 3, 3); ctx.fillRect(19, -96, 3, 3);
      // Glow
      ctx.shadowBlur = 20; ctx.shadowColor = C;
      ctx.fillStyle = C; ctx.beginPath(); ctx.arc(18, -106, 6 + (atk ? 4 : 0), 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ────────────────────────────────────────────────────────── BERSERKER
  private drawBerserker(ctx: CanvasRenderingContext2D, _gt: number, flash: boolean, leg: number, atk: boolean): void {
    const C = this.color;
    
    // Back leg
    ctx.fillStyle = flash ? "#fff" : "#4a2a1a"; ctx.fillRect(-16, -24, 12, 24 - leg);
    
    // Muscular Body
    this.fill(ctx, flash, "#e8a070");
    ctx.fillRect(-18, -60, 36, 36);
    
    if (!flash) {
      // Tattoos (Color!)
      ctx.fillStyle = C;
      ctx.fillRect(-14, -54, 8, 4); ctx.fillRect(6, -54, 8, 4);
      ctx.fillRect(-10, -46, 20, 6);
      
      // Pants
      ctx.fillStyle = "#3a1a10"; ctx.fillRect(-20, -28, 40, 12);
      ctx.fillStyle = "#8a8a9a"; ctx.fillRect(-6, -30, 12, 8); // Belt
    }
    
    // Head & Hair
    this.fill(ctx, flash, "#e8a070");
    ctx.fillRect(-10, -78, 20, 18);
    if (!flash) {
      ctx.fillStyle = C; 
      ctx.fillRect(-12, -82, 24, 8);  // Hair
      ctx.fillRect(-12, -70, 24, 10); // Beard
      // Eyes
      ctx.fillStyle = "#fff"; 
      ctx.beginPath(); ctx.ellipse(-4, -74, 3, 2, 0, 0, Math.PI*2); ctx.ellipse(4, -74, 3, 2, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(-3, -74, 1, 0, Math.PI*2); ctx.arc(5, -74, 1, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = C; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-8, -77); ctx.lineTo(-2, -75); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, -77); ctx.lineTo(2, -75); ctx.stroke(); ctx.lineWidth = 1;
    }
    
    // Front leg
    ctx.fillStyle = flash ? "#fff" : "#4a2a1a"; ctx.fillRect(4, -24, 12, 24 + leg);
    
    // Fire trail / Rage aura when attacking
    if (atk && !flash) {
      ctx.shadowBlur = 20; ctx.shadowColor = C;
      ctx.fillStyle = C;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(-24, -64, 48, 44);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
    
    // Equipped weapon or Double Axes
    const wv = this.equippedWeaponVisual;
    if (wv === "sword") this.drawSword(ctx, atk);
    else if (wv === "hammer") this.drawHammer(ctx, atk);
    else {
      // Berserker dual wields axes if no specific weapon!
      ctx.save();
      ctx.translate(-24, 0); // Back hand
      this.drawAxe(ctx, atk);
      ctx.restore();
      this.drawAxe(ctx, atk); // Front hand
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
