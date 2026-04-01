import { Fighter, state } from "./fighter.js";
import { Particle, DamageText } from "./particles.js";

export const JADE_MAGE_META = {
  id: "mage",
  name: "НЕФРИТ МАГ",
  desc: "ТЕМНЫЙ ВЛАСТЕЛИН ИЗУМРУДНОГО ПЛАМЕНИ",
  color: "#00c978",
  rgb: "0,201,120",
  weapon: "staff",
  maxHp: 1000,
} as const;

const JADE = {
  primary: "#00c978",
  bright: "#7cffcb",
  deep: "#0a7f51",
  dark: "#081a14",
  robeOuter: "#102922",
  robeInner: "#1c4334",
  robeEdge: "#2f6b53",
  metal: "#69757c",
  leather: "#5d3f25",
  gold: "#b79a59",
  skin: "#d2b294",
  eye: "#0c9c67",
  cold: "#8cf6d3",
};

type JadeAnimationState = "idle" | "walk" | "attack" | "ultimate" | "hit" | "death";
type AttackType = "normal" | "critical" | "ultimate";
type ProjectileStyle = "hand_orb" | "staff_lightning";
type SkyBeamStage = "buildup" | "impact" | "explosion";

interface AttackDefinition {
  damage: number;
  castFrames: number;
  cooldownFrames: number;
  projectileSpeed: number;
  projectileRadius: number;
}

interface ActiveCast {
  type: AttackType;
  framesLeft: number;
}

interface AttackConfig {
  normal: AttackDefinition;
  critical: AttackDefinition;
  ultimate: AttackDefinition;
  criticalChance: number;
  ultimateChargePerNormal: number;
  ultimateChargePerCritical: number;
}

interface JadeProjectile {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  damage: number;
  type: AttackType;
  style: ProjectileStyle;
  color: string;
  wobble: number;
}

interface SkyBeamStrike {
  x: number;
  groundY: number;
  damage: number;
  stage: SkyBeamStage;
  timer: number;
  didDamage: boolean;
}

interface MageRenderOptions {
  walkPhase: number;
  auraPhase: number;
  castType: AttackType | null;
  castProgress: number;
  hitFlash: boolean;
  stunned: boolean;
  skyCalling: boolean;
}

interface StaffRenderOptions {
  mode: "idle" | "critical" | "ultimate";
  power: number;
  auraPhase: number;
  hitFlash: boolean;
}

const DEFAULT_ATTACK_CONFIG: AttackConfig = {
  normal: {
    damage: 34,
    castFrames: 12,
    cooldownFrames: 22,
    projectileSpeed: 12,
    projectileRadius: 8,
  },
  critical: {
    damage: 82,
    castFrames: 24,
    cooldownFrames: 68,
    projectileSpeed: 15,
    projectileRadius: 11,
  },
  ultimate: {
    damage: 210,
    castFrames: 58,
    cooldownFrames: 380,
    projectileSpeed: 0,
    projectileRadius: 0,
  },
  criticalChance: 0.22,
  ultimateChargePerNormal: 16,
  ultimateChargePerCritical: 30,
};

class JadeMageAnimationController {
  state: JadeAnimationState = "idle";
  private lockFrames = 0;

  update(opts: { moving: boolean; casting: boolean; ultimate: boolean; hit: boolean; dead: boolean }): void {
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

  playOneShot(next: JadeAnimationState, frames: number): void {
    this.state = next;
    this.lockFrames = Math.max(this.lockFrames, frames);
  }
}

class JadeMageAttackSystem {
  private readonly cfg: AttackConfig;
  private criticalCooldown = 0;
  private ultimateCooldown = 0;
  private ultimateCharge = 0;

  constructor(config: AttackConfig = DEFAULT_ATTACK_CONFIG) {
    this.cfg = config;
  }

  tick(): void {
    if (this.criticalCooldown > 0) this.criticalCooldown--;
    if (this.ultimateCooldown > 0) this.ultimateCooldown--;
  }

  pickAttack(): AttackType {
    if (this.ultimateCharge >= 100 && this.ultimateCooldown <= 0) {
      return "ultimate";
    }
    if (this.criticalCooldown <= 0 && Math.random() < this.cfg.criticalChance) {
      return "critical";
    }
    return "normal";
  }

  startCast(type: AttackType): ActiveCast {
    return { type, framesLeft: this.cfg[type].castFrames };
  }

  commitAttack(type: AttackType): void {
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

  getDefinition(type: AttackType): AttackDefinition {
    return this.cfg[type];
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rgbaHex(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `rgba(0,201,120,${alpha})`;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawDiamondCrystal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  glowStrength: number,
  hitFlash: boolean,
): void {
  const haloRadius = 10 + glowStrength * 20;
  const halo = ctx.createRadialGradient(x, y, 1, x, y, haloRadius);
  halo.addColorStop(0, rgbaHex(JADE.bright, 0.4 + glowStrength * 0.35));
  halo.addColorStop(1, rgbaHex(JADE.bright, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, haloRadius, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createLinearGradient(x, y - h, x, y + h);
  grad.addColorStop(0, hitFlash ? "#ffffff" : JADE.bright);
  grad.addColorStop(0.5, hitFlash ? "#ffffff" : JADE.primary);
  grad.addColorStop(1, hitFlash ? "#d9fff2" : JADE.deep);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - w, y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = hitFlash ? "#ffffff" : rgbaHex(JADE.cold, 0.9);
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawRuneCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rotation: number,
  alpha: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.strokeStyle = rgbaHex(JADE.cold, alpha);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 9; i++) {
    const a = (Math.PI * 2 * i) / 9;
    const sx = Math.cos(a) * (r * 0.72);
    const sy = Math.sin(a) * (r * 0.72);
    const ex = Math.cos(a) * r;
    const ey = Math.sin(a) * r;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHandMagicSpheres(
  ctx: CanvasRenderingContext2D,
  handX: number,
  handY: number,
  auraPhase: number,
  power: number,
  hitFlash: boolean,
): void {
  const strength = clamp(power, 0, 1.2);
  const coreRadius = lerp(3.4, 5.8, strength);
  const glowRadius = lerp(12, 24, strength);
  const orbitRadius = lerp(5.5, 9.5, strength);

  const palmGlow = ctx.createRadialGradient(handX, handY, 0.6, handX, handY, glowRadius);
  palmGlow.addColorStop(0, rgbaHex(hitFlash ? "#ffffff" : JADE.bright, 0.9));
  palmGlow.addColorStop(0.48, rgbaHex(hitFlash ? "#ffffff" : JADE.primary, 0.5));
  palmGlow.addColorStop(1, rgbaHex(JADE.primary, 0));
  ctx.fillStyle = palmGlow;
  ctx.beginPath();
  ctx.arc(handX, handY, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(handX - 1.2, handY - 1.1, 0.4, handX, handY, coreRadius * 1.8);
  core.addColorStop(0, "rgba(255,255,255,0.95)");
  core.addColorStop(0.5, rgbaHex(hitFlash ? "#ffffff" : JADE.bright, 0.88));
  core.addColorStop(1, rgbaHex(JADE.primary, 0.35));
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(handX, handY, coreRadius * 1.8, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 3; i++) {
    const phase = auraPhase * 1.55 + i * ((Math.PI * 2) / 3);
    const ox = handX + Math.cos(phase) * orbitRadius;
    const oy = handY - 1 + Math.sin(phase * 1.2) * (orbitRadius * 0.42);
    const r = 1.6 + strength * 0.85 + Math.sin(auraPhase * 2.1 + i) * 0.2;

    const orb = ctx.createRadialGradient(ox, oy, 0.2, ox, oy, r * 2.5);
    orb.addColorStop(0, rgbaHex("#ffffff", 0.92));
    orb.addColorStop(0.55, rgbaHex(JADE.bright, 0.82));
    orb.addColorStop(1, rgbaHex(JADE.primary, 0));
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(ox, oy, r * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 5; i++) {
    const phase = auraPhase * 1.1 + i * 1.26;
    const px = handX + Math.cos(phase) * (orbitRadius + 4 + (i % 2) * 1.5);
    const py = handY + Math.sin(phase * 1.25) * (orbitRadius * 0.55 + i * 0.15) - 2;
    const spark = ctx.createRadialGradient(px, py, 0.1, px, py, 1.9 + strength * 0.9);
    spark.addColorStop(0, rgbaHex(JADE.bright, 0.82));
    spark.addColorStop(1, rgbaHex(JADE.bright, 0));
    ctx.fillStyle = spark;
    ctx.beginPath();
    ctx.arc(px, py, 1.9 + strength * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBattleStaff(ctx: CanvasRenderingContext2D, opts: StaffRenderOptions): void {
  const modePower = opts.mode === "critical" ? opts.power : opts.mode === "ultimate" ? 0.8 + opts.power * 0.5 : 0.2;

  const shaftGrad = ctx.createLinearGradient(0, -110, 0, 8);
  shaftGrad.addColorStop(0, opts.hitFlash ? "#ffffff" : "#6f4d2f");
  shaftGrad.addColorStop(0.45, opts.hitFlash ? "#f0f0f0" : "#54371f");
  shaftGrad.addColorStop(1, opts.hitFlash ? "#dddddd" : "#3b2616");

  ctx.strokeStyle = shaftGrad;
  ctx.lineWidth = 5.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.quadraticCurveTo(-3, -54, 0, -110);
  ctx.stroke();

  ctx.strokeStyle = opts.hitFlash ? "#ffffff" : rgbaHex(JADE.gold, 0.78);
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 4; i++) {
    const y = -18 - i * 20;
    ctx.beginPath();
    ctx.arc(0, y, 3.2, Math.PI * 0.25, Math.PI * 1.75);
    ctx.stroke();
  }

  ctx.strokeStyle = opts.hitFlash ? "#ffffff" : rgbaHex(JADE.metal, 0.92);
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, -110);
  ctx.quadraticCurveTo(-10, -118, -7, -132);
  ctx.moveTo(0, -110);
  ctx.quadraticCurveTo(10, -118, 7, -132);
  ctx.stroke();

  ctx.strokeStyle = opts.hitFlash ? "#ffffff" : rgbaHex(JADE.gold, 0.92);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -133, 7.6, 0, Math.PI * 2);
  ctx.stroke();

  drawDiamondCrystal(ctx, 0, -133, 5.8, 9.5, modePower, opts.hitFlash);

  if (opts.mode !== "idle") {
    const orbs = opts.mode === "ultimate" ? 5 : 3;
    for (let i = 0; i < orbs; i++) {
      const phase = opts.auraPhase * (1 + i * 0.11) + i * 1.2;
      const ox = Math.cos(phase) * (9 + i * 1.6);
      const oy = -133 + Math.sin(phase) * (5 + i);
      const g = ctx.createRadialGradient(ox, oy, 0.3, ox, oy, 3.4 + modePower * 2.8);
      g.addColorStop(0, rgbaHex(JADE.bright, 0.9));
      g.addColorStop(1, rgbaHex(JADE.bright, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ox, oy, 3.4 + modePower * 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (opts.mode === "critical") {
    ctx.strokeStyle = rgbaHex(JADE.cold, 0.9);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const sy = -132 + i * 4;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo((i % 2 === 0 ? -1 : 1) * (9 + i * 2), sy - 7);
      ctx.lineTo((i % 2 === 0 ? -1 : 1) * (5 + i), sy - 14);
      ctx.stroke();
    }
  }

  if (opts.mode === "ultimate") {
    ctx.strokeStyle = rgbaHex(JADE.bright, 0.8);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -133);
    ctx.quadraticCurveTo(1.5, -160, 0, -186);
    ctx.stroke();
  }
}

function drawBattleMageFigure(ctx: CanvasRenderingContext2D, opts: MageRenderOptions): void {
  const tone = (hex: string): string => (opts.hitFlash ? "#ffffff" : hex);

  const handCast = opts.castType === "normal";
  const staffCast = opts.castType === "critical";
  const ultimateCast = opts.castType === "ultimate" || opts.skyCalling;

  const handPower = handCast ? opts.castProgress : 0;
  const staffPower = staffCast ? opts.castProgress : 0;
  const ultimatePower = ultimateCast ? opts.castProgress : 0;

  const walkSwing = Math.sin(opts.walkPhase) * 2.5;
  const robeWave = Math.sin(opts.walkPhase * 1.2) * 3.8;

  const auraRadius = 52 + handPower * 24 + staffPower * 18 + ultimatePower * 30;
  const aura = ctx.createRadialGradient(0, -80, 8, 0, -80, auraRadius);
  aura.addColorStop(0, rgbaHex(JADE.primary, 0.18 + handPower * 0.18 + ultimatePower * 0.1));
  aura.addColorStop(0.58, rgbaHex(JADE.deep, 0.12 + staffPower * 0.15));
  aura.addColorStop(1, rgbaHex(JADE.primary, 0));
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, -80, auraRadius, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 5; i++) {
    const phase = opts.auraPhase * (0.85 + i * 0.14) + i * 1.4;
    const x = Math.cos(phase) * (17 + i * 3);
    const y = -79 + Math.sin(phase * 1.3) * (8 + i * 1.4);
    const orb = ctx.createRadialGradient(x, y, 0.1, x, y, 2.8 + handPower * 2 + staffPower * 1.5);
    orb.addColorStop(0, rgbaHex(JADE.bright, 0.82));
    orb.addColorStop(1, rgbaHex(JADE.bright, 0));
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(x, y, 2.8 + handPower * 2 + staffPower * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const shadow = ctx.createRadialGradient(0, 4, 4, 0, 4, 32);
  shadow.addColorStop(0, "rgba(0,0,0,0.38)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(0, 4, 28, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const cloakBack = ctx.createLinearGradient(-24, -124, -20, 12);
  cloakBack.addColorStop(0, tone(JADE.dark));
  cloakBack.addColorStop(1, tone("#06120f"));
  ctx.fillStyle = cloakBack;
  ctx.beginPath();
  ctx.moveTo(-12, -116);
  ctx.bezierCurveTo(-46, -89, -44, -35, -23, 12 + robeWave * 0.2);
  ctx.quadraticCurveTo(-9, 5, -8, -20);
  ctx.quadraticCurveTo(-9, -76, -5, -113);
  ctx.closePath();
  ctx.fill();

  const robeOuter = ctx.createLinearGradient(0, -106, 0, 14);
  robeOuter.addColorStop(0, tone(JADE.robeInner));
  robeOuter.addColorStop(0.55, tone(JADE.robeOuter));
  robeOuter.addColorStop(1, tone(JADE.dark));
  ctx.fillStyle = robeOuter;
  ctx.beginPath();
  ctx.moveTo(-22, -98);
  ctx.quadraticCurveTo(-34, -40, -25, 13 + robeWave);
  ctx.quadraticCurveTo(0, 23, 26, 11 + robeWave * 0.55);
  ctx.quadraticCurveTo(35, -41, 20, -98);
  ctx.quadraticCurveTo(0, -112, -22, -98);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = rgbaHex(tone(JADE.robeEdge), 0.52);
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 4; i++) {
    const x = -8 + i * 5.2;
    ctx.beginPath();
    ctx.moveTo(x, -90);
    ctx.quadraticCurveTo(x + Math.sin(opts.walkPhase + i) * 2.3, -44, x + Math.sin(opts.walkPhase + i * 1.1) * 1.9, 6 + robeWave * 0.35);
    ctx.stroke();
  }

  ctx.fillStyle = tone("#07120f");
  ctx.beginPath();
  ctx.ellipse(-8, 3 + walkSwing * 0.12, 8, 4, -0.08, 0, Math.PI * 2);
  ctx.ellipse(9, 3 - walkSwing * 0.12, 8, 4, 0.08, 0, Math.PI * 2);
  ctx.fill();

  const belt = ctx.createLinearGradient(-18, -47, 18, -47);
  belt.addColorStop(0, tone(JADE.leather));
  belt.addColorStop(1, tone("#7a512f"));
  ctx.strokeStyle = belt;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-17, -47);
  ctx.quadraticCurveTo(0, -43, 17, -47);
  ctx.stroke();

  ctx.fillStyle = tone(JADE.gold);
  ctx.beginPath();
  ctx.ellipse(0, -46, 4.9, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = tone("#583a22");
  ctx.beginPath();
  ctx.ellipse(-13, -39.5, 4.1, 5.2, -0.1, 0, Math.PI * 2);
  ctx.ellipse(13, -39.5, 4.1, 5.2, 0.1, 0, Math.PI * 2);
  ctx.fill();

  const torso = ctx.createLinearGradient(0, -96, 0, -44);
  torso.addColorStop(0, tone("#173428"));
  torso.addColorStop(1, tone("#10241c"));
  ctx.fillStyle = torso;
  ctx.beginPath();
  ctx.moveTo(-14, -93);
  ctx.quadraticCurveTo(-17, -72, -10, -57);
  ctx.quadraticCurveTo(0, -50, 10, -57);
  ctx.quadraticCurveTo(17, -72, 14, -93);
  ctx.quadraticCurveTo(0, -102, -14, -93);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = tone(JADE.metal);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-11, -91);
  ctx.quadraticCurveTo(0, -96, 11, -91);
  ctx.quadraticCurveTo(10, -63, 0, -56);
  ctx.quadraticCurveTo(-10, -63, -11, -91);
  ctx.stroke();

  drawDiamondCrystal(ctx, 0, -74, 4.2, 6.8, 0.3 + handPower * 0.2 + staffPower * 0.2, opts.hitFlash);

  const shoulderL = ctx.createLinearGradient(-34, -90, -12, -72);
  shoulderL.addColorStop(0, tone("#7f8b93"));
  shoulderL.addColorStop(1, tone("#4f5b63"));
  ctx.fillStyle = shoulderL;
  ctx.beginPath();
  ctx.ellipse(-20.5, -83, 13, 8.5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  const shoulderR = ctx.createLinearGradient(12, -90, 34, -72);
  shoulderR.addColorStop(0, tone("#7a868d"));
  shoulderR.addColorStop(1, tone("#4d5860"));
  ctx.fillStyle = shoulderR;
  ctx.beginPath();
  ctx.ellipse(20.5, -82, 13, 8.5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  drawDiamondCrystal(ctx, -20.5, -82, 2.7, 4.2, 0.16 + handPower * 0.2, opts.hitFlash);
  drawDiamondCrystal(ctx, 20.5, -81.5, 2.7, 4.2, 0.16 + staffPower * 0.2, opts.hitFlash);

  ctx.strokeStyle = rgbaHex("#d7e2e9", 0.26);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-27, -84);
  ctx.lineTo(-17, -80);
  ctx.moveTo(16, -83);
  ctx.lineTo(26, -79);
  ctx.stroke();

  const staffMode: StaffRenderOptions["mode"] = ultimateCast ? "ultimate" : staffCast ? "critical" : "idle";
  const staffAngle = ultimateCast
    ? 0.25 + ultimatePower * 1.1
    : staffCast
      ? 0.2 + staffPower * 0.7
      : 0.1 - Math.sin(opts.walkPhase * 0.6) * 0.05;

  ctx.save();
  ctx.translate(20, -75);
  ctx.rotate(staffAngle);
  ctx.fillStyle = tone("#153628");
  ctx.beginPath();
  ctx.moveTo(-1, -2);
  ctx.quadraticCurveTo(-8, 15, -6, 28);
  ctx.quadraticCurveTo(-2, 31, 2, 27);
  ctx.quadraticCurveTo(1, 13, 3, -1);
  ctx.closePath();
  ctx.fill();
  drawBattleStaff(ctx, { mode: staffMode, power: staffPower + ultimatePower, auraPhase: opts.auraPhase, hitFlash: opts.hitFlash });
  ctx.restore();

  const handLift = ultimateCast
    ? -22 - ultimatePower * 36
    : handCast
      ? -8 - handPower * 16
      : -4 + walkSwing * 0.25;
  const handForward = ultimateCast
    ? 8 + ultimatePower * 9
    : handCast
      ? 20 + handPower * 14
      : 10;

  ctx.fillStyle = tone("#184132");
  ctx.beginPath();
  ctx.moveTo(-14, -77);
  ctx.quadraticCurveTo(-27, -65, -24 - handForward * 0.14, -52 + handLift * 0.2);
  ctx.quadraticCurveTo(-21 - handForward * 0.2, -48 + handLift * 0.25, -15, -53);
  ctx.quadraticCurveTo(-17, -63, -14, -76);
  ctx.closePath();
  ctx.fill();

  const handX = -23 - handForward;
  const handY = -53 + handLift;
  ctx.fillStyle = tone(JADE.skin);
  ctx.beginPath();
  ctx.ellipse(handX, handY, 3.4, 4.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Restored signature hand spheres: always visible and bound to hand animation.
  const handSpherePower = 0.42 + handPower * 0.66 + ultimatePower * 0.22;
  drawHandMagicSpheres(ctx, handX, handY - 0.8, opts.auraPhase + opts.walkPhase * 0.23, handSpherePower, opts.hitFlash);

  if (handCast) {
    const orb = ctx.createRadialGradient(handX, handY, 0.8, handX, handY, 16 + handPower * 13);
    orb.addColorStop(0, rgbaHex("#ffffff", 0.92));
    orb.addColorStop(0.42, rgbaHex(JADE.bright, 0.85));
    orb.addColorStop(1, rgbaHex(JADE.primary, 0));
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(handX, handY, 16 + handPower * 13, 0, Math.PI * 2);
    ctx.fill();

    drawDiamondCrystal(ctx, handX, handY, 4 + handPower * 2, 6 + handPower * 3, 0.4 + handPower * 0.5, opts.hitFlash);
  }

  if (ultimateCast) {
    const callY = -158 - ultimatePower * 10;
    drawRuneCircle(ctx, 0, callY, 14 + ultimatePower * 8, opts.auraPhase * 1.1, 0.58 + ultimatePower * 0.25);
    drawRuneCircle(ctx, 0, callY, 24 + ultimatePower * 10, -opts.auraPhase * 0.8, 0.35 + ultimatePower * 0.2);

    ctx.strokeStyle = rgbaHex(JADE.cold, 0.72);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.quadraticCurveTo(handX - 8, -118, 0, callY);
    ctx.stroke();
  }

  ctx.fillStyle = tone("#070f0d");
  ctx.beginPath();
  ctx.moveTo(-22, -119);
  ctx.quadraticCurveTo(-24, -95, -14, -84);
  ctx.quadraticCurveTo(0, -90, 14, -84);
  ctx.quadraticCurveTo(24, -95, 22, -119);
  ctx.quadraticCurveTo(0, -132, -22, -119);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = tone(JADE.skin);
  ctx.beginPath();
  const faceGrad = ctx.createLinearGradient(0, -116, 0, -86);
  faceGrad.addColorStop(0, tone("#dcc1a6"));
  faceGrad.addColorStop(0.58, tone(JADE.skin));
  faceGrad.addColorStop(1, tone("#b78f72"));
  ctx.fillStyle = faceGrad;
  ctx.ellipse(0, -102, 11.3, 13.1, 0, 0, Math.PI * 2);
  ctx.fill();

  const cheekShade = ctx.createRadialGradient(-5.5, -99, 0.2, -5.5, -99, 4.4);
  cheekShade.addColorStop(0, rgbaHex(tone("#a47d62"), 0.24));
  cheekShade.addColorStop(1, rgbaHex(tone("#a47d62"), 0));
  ctx.fillStyle = cheekShade;
  ctx.beginPath();
  ctx.arc(-5.5, -99, 4.4, 0, Math.PI * 2);
  ctx.fill();

  const cheekShadeR = ctx.createRadialGradient(5.5, -99, 0.2, 5.5, -99, 4.4);
  cheekShadeR.addColorStop(0, rgbaHex(tone("#a47d62"), 0.24));
  cheekShadeR.addColorStop(1, rgbaHex(tone("#a47d62"), 0));
  ctx.fillStyle = cheekShadeR;
  ctx.beginPath();
  ctx.arc(5.5, -99, 4.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = tone("#8c6c51");
  ctx.lineWidth = 1.05;
  ctx.beginPath();
  ctx.moveTo(0, -105.2);
  ctx.quadraticCurveTo(1.2, -101.4, -0.15, -98.1);
  ctx.moveTo(-0.1, -98.3);
  ctx.quadraticCurveTo(0.6, -97.5, 1.5, -98.1);
  ctx.stroke();

  const eyeY = -103.2;
  ctx.fillStyle = tone("#f1faf6");
  ctx.beginPath();
  ctx.moveTo(-7.2, eyeY + 0.2);
  ctx.quadraticCurveTo(-4.2, eyeY - 2.1, -1.7, eyeY - 0.2);
  ctx.quadraticCurveTo(-4.2, eyeY + 1.2, -7.2, eyeY + 0.4);
  ctx.closePath();
  ctx.moveTo(7.2, eyeY + 0.2);
  ctx.quadraticCurveTo(4.2, eyeY - 2.1, 1.7, eyeY - 0.2);
  ctx.quadraticCurveTo(4.2, eyeY + 1.2, 7.2, eyeY + 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = tone(JADE.eye);
  ctx.beginPath();
  ctx.ellipse(-4.35, eyeY - 0.35, 1.05, 1.28, -0.16, 0, Math.PI * 2);
  ctx.ellipse(4.35, eyeY - 0.35, 1.05, 1.28, 0.16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rgbaHex(tone("#e1fff3"), 0.42);
  ctx.beginPath();
  ctx.ellipse(-4.7, eyeY - 0.8, 0.38, 0.52, 0, 0, Math.PI * 2);
  ctx.ellipse(4.05, eyeY - 0.8, 0.38, 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sharper brows and focused gaze.
  ctx.strokeStyle = tone("#2b1d16");
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-8.8, -106.9);
  ctx.lineTo(-2.2, -109.1);
  ctx.moveTo(2.2, -109.1);
  ctx.lineTo(8.8, -106.9);
  ctx.stroke();

  ctx.strokeStyle = tone("#7b5b43");
  ctx.lineWidth = 0.95;
  ctx.beginPath();
  ctx.moveTo(-7.1, -101.2);
  ctx.quadraticCurveTo(-4.4, -100.3, -1.8, -101.2);
  ctx.moveTo(1.8, -101.2);
  ctx.quadraticCurveTo(4.4, -100.3, 7.1, -101.2);
  ctx.stroke();

  ctx.strokeStyle = tone("#5a4030");
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-2.7, -94.5);
  ctx.quadraticCurveTo(0, -93.6, 2.7, -94.5);
  ctx.moveTo(-1.1, -93.8);
  ctx.lineTo(1.1, -93.9);
  ctx.stroke();

  // Battle scar on cheek.
  ctx.strokeStyle = tone("#7a3f3f");
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(6.5, -100.5);
  ctx.lineTo(4.6, -96.8);
  ctx.stroke();

  if (opts.stunned) {
    const frost = ctx.createRadialGradient(0, -86, 8, 0, -86, 50);
    frost.addColorStop(0, rgbaHex(JADE.cold, 0.12));
    frost.addColorStop(1, rgbaHex(JADE.cold, 0));
    ctx.fillStyle = frost;
    ctx.beginPath();
    ctx.arc(0, -86, 50, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class JadeMageFighter extends Fighter {
  private readonly attacks = new JadeMageAttackSystem();
  private readonly animation = new JadeMageAnimationController();
  private activeCast: ActiveCast | null = null;
  private projectiles: JadeProjectile[] = [];
  private skyBeam: SkyBeamStrike | null = null;
  private moveVelocity = 0;
  private walkStep = 0;
  private auraPhase = Math.random() * Math.PI * 2;

  constructor(
    x: number,
    y: number,
    hpFillId: string,
    isFacingRight: boolean,
    particles: Particle[],
    damageTexts: DamageText[],
  ) {
    super(x, y, JADE_MAGE_META.color, hpFillId, isFacingRight, false, particles, damageTexts);
    this.charType = "jade_mage";
    this.equippedWeaponVisual = "staff";
  }

  override updateAI(gameOver: boolean): void {
    if (this.hp <= 0 || gameOver) {
      this.animation.update({ moving: false, casting: false, ultimate: false, hit: false, dead: true });
      return;
    }

    this.auraPhase += 0.07;

    if (this.stunTimer > 0) {
      this.stunTimer--;
      this.moveVelocity *= 0.78;
      this.updateProjectiles();
      this.updateSkyBeam();
      this.animation.update({ moving: false, casting: false, ultimate: false, hit: true, dead: false });
      if (this.hitTimer > 0) this.hitTimer--;
      return;
    }

    this.attacks.tick();
    this.isFacingRight = this.opponent.x > this.x;

    const distance = Math.abs(this.x - this.opponent.x);
    const speed = 1.85 + Math.max(0, this.playerSpd - 1) * 0.18;
    let isMoving = false;

    if (!this.activeCast) {
      if (distance < 220) {
        const dir = this.isFacingRight ? -1 : 1;
        this.moveVelocity = dir * speed;
        isMoving = true;
      } else if (distance > 370) {
        const dir = this.isFacingRight ? 1 : -1;
        this.moveVelocity = dir * speed;
        isMoving = true;
      } else {
        const strafeDir = this.isFacingRight ? 1 : -1;
        this.moveVelocity = strafeDir * Math.sin(this.walkStep * 0.08) * 0.75;
        isMoving = Math.abs(this.moveVelocity) > 0.14;
      }

      this.x += this.moveVelocity;
      this.walkStep++;

      if (this.attackCooldown > 0) {
        this.attackCooldown--;
      } else {
        const attackType = this.attacks.pickAttack();
        this.activeCast = this.attacks.startCast(attackType);
        this.fighterState = attackType === "ultimate" ? "ultimate_casting" : "casting";
        this.animation.playOneShot(attackType === "ultimate" ? "ultimate" : "attack", attackType === "ultimate" ? 48 : 14);
      }
    } else {
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
      const a = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 18;
      this.particles.push(new Particle(this.x + Math.cos(a) * r, this.y - 80 + Math.sin(a) * 14, JADE.primary, 0.45));
    }

    this.updateProjectiles();
    this.updateSkyBeam();

    this.x = Math.max(50, Math.min(850, this.x));

    this.animation.update({
      moving: isMoving,
      casting: this.activeCast !== null,
      ultimate: this.activeCast?.type === "ultimate" || this.skyBeam?.stage === "buildup",
      hit: this.hitTimer > 0,
      dead: false,
    });

    if (this.hitTimer > 0) this.hitTimer--;
  }

  override takeDamage(amount: number, attackerColor: string): void {
    super.takeDamage(amount, attackerColor);
    this.animation.playOneShot("hit", 8);
  }

  override draw(ctx: CanvasRenderingContext2D, gameTime: number): void {
    this.drawSkyBeam(ctx, gameTime);
    this.drawProjectiles(ctx, gameTime);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(this.x, this.y);
    if (!this.isFacingRight) ctx.scale(-1, 1);

    const walkPhase = this.animation.state === "walk" ? gameTime * 0.32 : gameTime * 0.08;
    const bob = Math.sin(gameTime * 0.12) * 1.9;
    const bodyTilt = this.animation.state === "walk" ? Math.sin(gameTime * 0.16) * 0.05 : 0;

    let castType: AttackType | null = null;
    let castProgress = 0;
    if (this.activeCast) {
      castType = this.activeCast.type;
      const total = this.attacks.getDefinition(this.activeCast.type).castFrames;
      castProgress = clamp(1 - this.activeCast.framesLeft / Math.max(1, total), 0, 1);
    }

    ctx.translate(0, bob);
    ctx.rotate(bodyTilt);

    drawBattleMageFigure(ctx, {
      walkPhase,
      auraPhase: this.auraPhase,
      castType,
      castProgress,
      hitFlash: this.animation.state === "hit",
      stunned: this.stunTimer > 0,
      skyCalling: this.skyBeam?.stage === "buildup",
    });

    ctx.restore();
  }

  private releaseAttack(type: AttackType): void {
    this.attacks.commitAttack(type);
    const def = this.attacks.getDefinition(type);
    this.attackCooldown = def.cooldownFrames;

    const damageScale = 1 + Math.max(0, this.playerAtk - 1) * 0.16;
    const scaledDamage = Math.floor(def.damage * damageScale);

    if (type === "ultimate") {
      this.startSkyBeam(Math.floor(scaledDamage * 1.05));
      return;
    }

    if (type === "normal") {
      const hand = this.getHandOrigin();
      const vel = this.velocityToOpponent(hand.x, hand.y, def.projectileSpeed);
      this.projectiles.push({
        x: hand.x,
        y: hand.y,
        lastX: hand.x,
        lastY: hand.y,
        vx: vel.vx,
        vy: vel.vy,
        radius: def.projectileRadius,
        life: 88,
        damage: scaledDamage,
        type,
        style: "hand_orb",
        color: JADE.primary,
        wobble: Math.random() * Math.PI * 2,
      });

      for (let i = 0; i < 8; i++) this.particles.push(new Particle(hand.x, hand.y, JADE.primary, 1.35));
      return;
    }

    const staff = this.getStaffTipOrigin();
    const vel = this.velocityToOpponent(staff.x, staff.y, def.projectileSpeed);
    this.projectiles.push({
      x: staff.x,
      y: staff.y,
      lastX: staff.x,
      lastY: staff.y,
      vx: vel.vx,
      vy: vel.vy,
      radius: def.projectileRadius,
      life: 62,
      damage: scaledDamage,
      type,
      style: "staff_lightning",
      color: JADE.cold,
      wobble: Math.random() * Math.PI * 2,
    });

    for (let i = 0; i < 20; i++) this.particles.push(new Particle(staff.x, staff.y, JADE.bright, 2.25));
  }

  private startSkyBeam(damage: number): void {
    const targetX = this.opponent.x;
    const groundY = this.opponent.y - 58;

    this.skyBeam = {
      x: targetX,
      groundY,
      damage,
      stage: "buildup",
      timer: 40,
      didDamage: false,
    };

    this.opponent.stunTimer = Math.max(this.opponent.stunTimer, 78);
    this.opponent.attackCooldown = Math.max(this.opponent.attackCooldown, 78);
    this.opponent.targetX = this.opponent.x;
    this.opponent.fighterState = "casting";

    for (let i = 0; i < 22; i++) this.particles.push(new Particle(targetX, 62 + Math.random() * 18, JADE.cold, 2.0));
  }

  private updateSkyBeam(): void {
    const beam = this.skyBeam;
    if (!beam) return;

    if (this.opponent.hp > 0 && beam.stage !== "explosion") {
      this.opponent.stunTimer = Math.max(this.opponent.stunTimer, 3);
      this.opponent.attackCooldown = Math.max(this.opponent.attackCooldown, 3);
      this.opponent.targetX = this.opponent.x;
      this.opponent.fighterState = "casting";
    }

    if (beam.stage === "buildup") {
      beam.timer--;

      if (beam.timer % 2 === 0) {
        this.particles.push(new Particle(beam.x + (Math.random() - 0.5) * 26, beam.groundY + 12, JADE.cold, 1.8));
      }

      if (beam.timer <= 0) {
        beam.stage = "impact";
        beam.timer = 16;
        state.screenShake = Math.max(state.screenShake, 24);
        this.applySkyBeamDamage(beam);
      }
      return;
    }

    if (beam.stage === "impact") {
      beam.timer--;
      state.screenShake = Math.max(state.screenShake, 14);

      if (beam.timer % 2 === 0) {
        for (let i = 0; i < 6; i++) {
          this.particles.push(new Particle(beam.x + (Math.random() - 0.5) * 22, beam.groundY + (Math.random() - 0.5) * 18, JADE.bright, 3.0));
        }
      }

      if (beam.timer <= 0) {
        beam.stage = "explosion";
        beam.timer = 22;
      }
      return;
    }

    beam.timer--;
    if (beam.timer % 3 === 0) {
      for (let i = 0; i < 5; i++) {
        this.particles.push(new Particle(beam.x + (Math.random() - 0.5) * 35, beam.groundY + (Math.random() - 0.5) * 22, JADE.primary, 2.4));
      }
    }

    if (beam.timer <= 0) {
      this.skyBeam = null;
    }
  }

  private applySkyBeamDamage(beam: SkyBeamStrike): void {
    if (beam.didDamage) return;
    beam.didDamage = true;

    const dx = Math.abs(this.opponent.x - beam.x);
    let dealt = beam.damage;
    if (dx > 72 && dx < 132) dealt = Math.floor(dealt * 0.55);
    if (dx >= 132) dealt = 0;

    if (dealt > 0) {
      this.opponent.takeDamage(dealt, JADE.cold);
    }

    for (let i = 0; i < 38; i++) {
      this.particles.push(new Particle(beam.x + (Math.random() - 0.5) * 28, beam.groundY + (Math.random() - 0.5) * 18, JADE.bright, 3.4));
    }
  }

  private updateProjectiles(): void {
    if (!this.opponent) return;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lastX = p.x;
      p.lastY = p.y;

      p.x += p.vx;
      p.y += p.vy;
      if (p.style === "hand_orb") {
        p.y += Math.sin((p.life + p.wobble) * 0.18) * 0.12;
      }
      p.life--;

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.life % 2 === 0) {
        this.particles.push(new Particle(p.x, p.y, p.color, p.style === "staff_lightning" ? 1.9 : 1.2));
      }

      const hitPad = p.style === "staff_lightning" ? 10 : 0;
      const hit =
        Math.abs(p.x - this.opponent.x) < (30 + p.radius + hitPad) &&
        Math.abs(p.y - (this.opponent.y - 56)) < (40 + p.radius + hitPad);

      if (!hit) continue;

      this.opponent.takeDamage(p.damage, p.color);

      const burst = p.style === "staff_lightning" ? 32 : 18;
      for (let k = 0; k < burst; k++) {
        this.particles.push(new Particle(this.opponent.x, this.opponent.y - 58, p.color, p.style === "staff_lightning" ? 2.8 : 2.0));
      }

      state.screenShake = Math.max(state.screenShake, p.style === "staff_lightning" ? 13 : 8);
      this.projectiles.splice(i, 1);
    }
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D, gameTime: number): void {
    for (const p of this.projectiles) {
      if (p.style === "hand_orb") {
        const pulse = 0.78 + Math.sin((gameTime + p.x) * 0.17) * 0.22;
        const r = p.radius * pulse;

        const halo = ctx.createRadialGradient(p.x, p.y, r * 0.2, p.x, p.y, r * 2.8);
        halo.addColorStop(0, rgbaHex(JADE.bright, 0.88));
        halo.addColorStop(0.6, rgbaHex(JADE.primary, 0.45));
        halo.addColorStop(1, rgbaHex(JADE.primary, 0));

        ctx.save();
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2.8, 0, Math.PI * 2);
        ctx.fill();

        const core = ctx.createRadialGradient(p.x - r * 0.2, p.y - r * 0.2, 0.3, p.x, p.y, r * 1.15);
        core.addColorStop(0, "rgba(255,255,255,0.9)");
        core.addColorStop(0.45, rgbaHex(JADE.bright, 0.9));
        core.addColorStop(1, rgbaHex(JADE.primary, 0.35));
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 1.15, 0, Math.PI * 2);
        ctx.fill();

        const tx = p.x - p.vx * 2.1;
        const ty = p.y - p.vy * 2.1;
        const tail = ctx.createLinearGradient(p.x, p.y, tx, ty);
        tail.addColorStop(0, rgbaHex(JADE.primary, 0.68));
        tail.addColorStop(1, rgbaHex(JADE.primary, 0));
        ctx.fillStyle = tail;
        ctx.beginPath();
        ctx.moveTo(p.x + p.vy * 0.22, p.y - p.vx * 0.22);
        ctx.quadraticCurveTo((p.x + tx) * 0.5, (p.y + ty) * 0.5, tx - p.vy * 0.58, ty + p.vx * 0.58);
        ctx.quadraticCurveTo((p.x + tx) * 0.5, (p.y + ty) * 0.5, p.x - p.vy * 0.22, p.y + p.vx * 0.22);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        continue;
      }

      ctx.save();
      ctx.lineCap = "round";

      const seg = 6;
      const dx = p.x - p.lastX;
      const dy = p.y - p.lastY;

      ctx.strokeStyle = rgbaHex(JADE.cold, 0.82);
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.moveTo(p.lastX, p.lastY);
      for (let i = 1; i < seg; i++) {
        const t = i / seg;
        const jx = (Math.random() - 0.5) * 8;
        const jy = (Math.random() - 0.5) * 8;
        ctx.lineTo(p.lastX + dx * t + jx, p.lastY + dy * t + jy);
      }
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      ctx.strokeStyle = rgbaHex("#ffffff", 0.7);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(p.lastX, p.lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      const core = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.radius * 1.8);
      core.addColorStop(0, rgbaHex("#ffffff", 0.92));
      core.addColorStop(0.5, rgbaHex(JADE.bright, 0.86));
      core.addColorStop(1, rgbaHex(JADE.primary, 0));
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private drawSkyBeam(ctx: CanvasRenderingContext2D, gameTime: number): void {
    const beam = this.skyBeam;
    if (!beam) return;

    const topY = 0;

    if (beam.stage === "buildup") {
      const t = clamp(1 - beam.timer / 40, 0, 1);
      const width = 9 + t * 12;

      drawRuneCircle(ctx, beam.x, 96, 22 + t * 8, gameTime * 0.06, 0.46 + t * 0.35);
      drawRuneCircle(ctx, beam.x, beam.groundY + 10, 16 + t * 8, -gameTime * 0.07, 0.52 + t * 0.35);

      const col = ctx.createLinearGradient(beam.x, topY, beam.x, beam.groundY + 12);
      col.addColorStop(0, rgbaHex(JADE.cold, 0.08 + t * 0.2));
      col.addColorStop(0.45, rgbaHex(JADE.primary, 0.14 + t * 0.24));
      col.addColorStop(1, rgbaHex(JADE.primary, 0));
      ctx.fillStyle = col;
      ctx.fillRect(beam.x - width, topY, width * 2, beam.groundY + 12 - topY);
      return;
    }

    if (beam.stage === "impact") {
      const pulse = 0.82 + Math.sin(gameTime * 0.55) * 0.18;
      const width = 34 * pulse;

      const beamGrad = ctx.createLinearGradient(beam.x - width, topY, beam.x + width, topY);
      beamGrad.addColorStop(0, rgbaHex(JADE.primary, 0));
      beamGrad.addColorStop(0.26, rgbaHex(JADE.primary, 0.8));
      beamGrad.addColorStop(0.5, rgbaHex("#ffffff", 0.9));
      beamGrad.addColorStop(0.74, rgbaHex(JADE.bright, 0.82));
      beamGrad.addColorStop(1, rgbaHex(JADE.primary, 0));

      ctx.fillStyle = beamGrad;
      ctx.fillRect(beam.x - width, topY, width * 2, beam.groundY + 14 - topY);

      const core = ctx.createLinearGradient(beam.x - width * 0.35, topY, beam.x + width * 0.35, topY);
      core.addColorStop(0, rgbaHex("#ffffff", 0));
      core.addColorStop(0.5, rgbaHex("#ffffff", 0.8));
      core.addColorStop(1, rgbaHex("#ffffff", 0));
      ctx.fillStyle = core;
      ctx.fillRect(beam.x - width * 0.35, topY, width * 0.7, beam.groundY + 10 - topY);

      const impact = ctx.createRadialGradient(beam.x, beam.groundY + 6, 6, beam.x, beam.groundY + 6, 78);
      impact.addColorStop(0, rgbaHex("#ffffff", 0.88));
      impact.addColorStop(0.35, rgbaHex(JADE.bright, 0.8));
      impact.addColorStop(1, rgbaHex(JADE.primary, 0));
      ctx.fillStyle = impact;
      ctx.beginPath();
      ctx.arc(beam.x, beam.groundY + 6, 78, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const t = clamp(1 - beam.timer / 22, 0, 1);
    const radius = 28 + t * 120;

    const exp = ctx.createRadialGradient(beam.x, beam.groundY + 8, 8, beam.x, beam.groundY + 8, radius);
    exp.addColorStop(0, rgbaHex("#ffffff", 0.9));
    exp.addColorStop(0.4, rgbaHex(JADE.bright, 0.62));
    exp.addColorStop(1, rgbaHex(JADE.primary, 0));
    ctx.fillStyle = exp;
    ctx.beginPath();
    ctx.arc(beam.x, beam.groundY + 8, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = rgbaHex(JADE.cold, 0.64 - t * 0.35);
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.arc(beam.x, beam.groundY + 8, radius * 0.8, 0, Math.PI * 2);
    ctx.stroke();
  }

  private getHandOrigin(): { x: number; y: number } {
    const dir = this.isFacingRight ? 1 : -1;
    return { x: this.x + dir * -34, y: this.y - 60 };
  }

  private getStaffTipOrigin(): { x: number; y: number } {
    const dir = this.isFacingRight ? 1 : -1;
    return { x: this.x + dir * 28, y: this.y - 160 };
  }

  private velocityToOpponent(fromX: number, fromY: number, speed: number): { vx: number; vy: number } {
    const tx = this.opponent.x;
    const ty = this.opponent.y - 60;
    const dx = tx - fromX;
    const dy = ty - fromY;
    const len = Math.hypot(dx, dy) || 1;
    return { vx: (dx / len) * speed, vy: (dy / len) * speed };
  }
}

export function drawJadeMagePreview(
  ctx: CanvasRenderingContext2D,
  cx: number,
  by: number,
  bob = 0,
  gameTick = 0,
): void {
  ctx.save();
  ctx.translate(cx, by + bob);
  ctx.scale(0.95, 0.95);

  drawBattleMageFigure(ctx, {
    walkPhase: gameTick * 0.12,
    auraPhase: gameTick * 0.07,
    castType: null,
    castProgress: 0,
    hitFlash: false,
    stunned: false,
    skyCalling: false,
  });

  ctx.restore();
}

export function enforceJadeMageSelection(): void {
  localStorage.setItem("playerCharacter", JADE_MAGE_META.id);
}

export function applyJadeMageUi(avatarEl: HTMLElement | null, hpFillEl: HTMLElement | null): void {
  if (avatarEl) avatarEl.style.borderColor = JADE_MAGE_META.color;
  if (hpFillEl) hpFillEl.style.background = JADE_MAGE_META.color;
}
