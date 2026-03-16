// particles.ts — visual effects: sparks and floating damage numbers

export class Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; color: string; size: number;

  constructor(x: number, y: number, color: string, speedMult = 1) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 20 * speedMult;
    this.vy = (Math.random() - 0.5) * 20 * speedMult;
    this.life = 1.0;
    this.color = color;
    this.size = Math.random() * 6 + 2;
  }

  update(): void {
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.95; this.vy *= 0.95;
    this.life -= 0.025;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15; ctx.shadowColor = this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1.0; ctx.shadowBlur = 0;
  }
}

export class DamageText {
  x: number; y: number; text: string; life: number; color: string;

  constructor(x: number, y: number, amount: number, color: string) {
    this.x = x + (Math.random() * 40 - 20);
    this.y = y - 50;
    this.text = "-" + amount;
    this.life = 1.0;
    this.color = color;
  }

  update(): void { this.y -= 1.5; this.life -= 0.02; }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.font = "bold 32px sans-serif";
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "black"; ctx.lineWidth = 4;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1.0;
  }
}
