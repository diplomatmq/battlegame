// char-draw.ts - Advanced drawing functions for characters

export function drawAssassin(ctx: CanvasRenderingContext2D, gt: number, flash: boolean, leg: number, atk: boolean, color: string, isFacingRight: boolean): void {
    const pulse = Math.sin(gt * 0.15) * 0.5 + 0.5;
    
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath(); ctx.ellipse(0, 2, 22, 6, 0, 0, Math.PI * 2); ctx.fill();

    // Body
    ctx.fillStyle = flash ? "#fff" : "#1a050a";
    ctx.fillRect(-10, -22, 8, 22 - leg);
    ctx.fillRect(2, -22, 8, 22 + leg);

    // Cape/Scarf
    ctx.fillStyle = flash ? "#fff" : color;
    ctx.beginPath();
    ctx.moveTo(-12, -65);
    ctx.quadraticCurveTo(-25 + Math.sin(gt * 0.2) * 5, -30, -15, 0);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-5, -65);
    ctx.fill();

    // Torso
    ctx.fillStyle = flash ? "#fff" : "#2a0810";
    ctx.fillRect(-12, -62, 24, 42);
    
    // Head/Mask
    ctx.fillStyle = flash ? "#fff" : color;
    ctx.beginPath();
    ctx.moveTo(-11, -82); ctx.lineTo(0, -98); ctx.lineTo(11, -82);
    ctx.lineTo(8, -65); ctx.lineTo(-8, -65); ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = flash ? "#fff" : "#ff3344";
    ctx.fillRect(-5, -78, 3, 3);
    ctx.fillRect(2, -78, 3, 3);

    // Arms & Weapons
    const armY = atk ? -55 + Math.sin(gt * 0.4) * 10 : -55;
    ctx.fillStyle = flash ? "#fff" : color;
    ctx.fillRect(-20, armY, 8, 26);
    ctx.fillRect(12, armY, 8, 26);

    // Daggers
    ctx.fillStyle = flash ? "#fff" : "#d0d4e0";
    ctx.beginPath(); ctx.moveTo(-18, armY + 20); ctx.lineTo(-26, armY + 45); ctx.lineTo(-14, armY + 20); ctx.fill();
    ctx.beginPath(); ctx.moveTo(18, armY + 20); ctx.lineTo(26, armY + 45); ctx.lineTo(14, armY + 20); ctx.fill();
}

export function drawNecromancer(ctx: CanvasRenderingContext2D, gt: number, flash: boolean, leg: number, atk: boolean, color: string): void {
    const pulse = Math.sin(gt * 0.1) * 0.5 + 0.5;
    
    // Aura
    const grad = ctx.createRadialGradient(0, -50, 5, 0, -50, 45);
    grad.addColorStop(0, flash ? "rgba(255,255,255,0.3)" : `rgba(181,141,255,${0.2 + pulse * 0.15})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, -50, 45, 0, Math.PI * 2); ctx.fill();

    // Robes
    ctx.fillStyle = flash ? "#fff" : "#12061b";
    ctx.fillRect(-13, -65, 26, 65);
    ctx.fillStyle = flash ? "#fff" : color;
    ctx.fillRect(-13, -68, 26, 4);
    ctx.fillRect(-13, -35, 26, 3);

    // Head/Hood
    ctx.fillStyle = flash ? "#fff" : color;
    ctx.beginPath();
    ctx.moveTo(-11, -95); ctx.lineTo(0, -110); ctx.lineTo(11, -95);
    ctx.lineTo(9, -85); ctx.lineTo(-9, -85); ctx.closePath();
    ctx.fill();

    // Skull Face
    ctx.fillStyle = flash ? "#fff" : "#eee8d7";
    ctx.fillRect(-7, -85, 14, 16);
    ctx.fillStyle = "#111";
    ctx.fillRect(-4, -80, 2, 3);
    ctx.fillRect(2, -80, 2, 3);

    // Staff
    ctx.fillStyle = flash ? "#fff" : "#5a3a20";
    ctx.fillRect(-28, -100, 5, 80);
    
    // Staff Orb
    ctx.shadowBlur = 15 + pulse * 10;
    ctx.shadowColor = color;
    ctx.fillStyle = flash ? "#fff" : color;
    ctx.beginPath(); ctx.arc(-25.5, -105, 8, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
}

export function drawBerserker(ctx: CanvasRenderingContext2D, gt: number, flash: boolean, leg: number, atk: boolean, color: string): void {
    const rage = Math.sin(gt * 0.3) * 2;
    
    // Muscles/Body
    ctx.fillStyle = flash ? "#fff" : "#4a220e";
    ctx.fillRect(-14, -24, 12, 24 - leg);
    ctx.fillRect(2, -24, 12, 24 + leg);

    // Torso
    ctx.fillStyle = flash ? "#fff" : color;
    ctx.fillRect(-22, -75, 44, 52);
    
    // Fur/Armor
    ctx.fillStyle = flash ? "#fff" : "#7b3d16";
    ctx.fillRect(-25, -78, 50, 15);
    
    // Head
    ctx.fillStyle = flash ? "#fff" : "#f0c694";
    ctx.fillRect(-12, -95, 24, 22);
    
    // Warpaint
    ctx.fillStyle = "#cc0000";
    ctx.fillRect(-8, -90, 2, 10);
    ctx.fillRect(6, -90, 2, 10);

    // Arms
    const armAng = atk ? Math.sin(gt * 0.5) * 0.8 : 0;
    ctx.save();
    ctx.translate(15, -60);
    ctx.rotate(armAng);
    ctx.fillStyle = flash ? "#fff" : color;
    ctx.fillRect(0, 0, 14, 40);
    
    // Great Axe
    ctx.fillStyle = "#5c2e08";
    ctx.fillRect(10, -40, 6, 80);
    ctx.fillStyle = "#9095a6";
    ctx.beginPath(); ctx.moveTo(13, -30); ctx.lineTo(40, -45); ctx.lineTo(45, -10); ctx.lineTo(13, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
}

export function drawGoblin(ctx: CanvasRenderingContext2D, gt: number, flash: boolean, leg: number, atk: boolean, color: string): void {
    const wobble = Math.sin(gt * 0.2) * 2;
    
    // Legs
    ctx.fillStyle = flash ? "#fff" : "#1f4214";
    ctx.fillRect(-8, -15, 6, 15 - leg);
    ctx.fillRect(2, -15, 6, 15 + leg);

    // Body
    ctx.fillStyle = flash ? "#fff" : color;
    ctx.fillRect(-12, -55, 24, 40);
    
    // Backpack
    ctx.fillStyle = "#4b2a12";
    ctx.fillRect(-15, -50, 5, 30);
    
    // Head
    ctx.fillStyle = flash ? "#fff" : color;
    ctx.fillRect(-10, -75, 20, 22);
    
    // Large Ears
    ctx.beginPath();
    ctx.moveTo(-10, -70); ctx.lineTo(-22, -65 + wobble); ctx.lineTo(-10, -60); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -70); ctx.lineTo(22, -65 - wobble); ctx.lineTo(10, -60); ctx.fill();

    // Eyes (Glowing)
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(-5, -68, 3, 3);
    ctx.fillRect(2, -68, 3, 3);

    // Dagger
    const armX = atk ? 10 + Math.sin(gt * 0.6) * 10 : 10;
    ctx.fillStyle = flash ? "#fff" : color;
    ctx.fillRect(armX, -45, 7, 20);
    ctx.fillStyle = "#d0d4e0";
    ctx.beginPath(); ctx.moveTo(armX + 3, -45); ctx.lineTo(armX + 15, -65); ctx.lineTo(armX + 8, -45); ctx.fill();
}

export function drawMage(ctx: CanvasRenderingContext2D, gt: number, flash: boolean, leg: number, casting: boolean, color: string): void {
    const float = Math.sin(gt * 0.1) * 3;
    
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath(); ctx.ellipse(0, 2, 20, 5, 0, 0, Math.PI * 2); ctx.fill();

    ctx.translate(0, float);

    // Robes
    ctx.fillStyle = flash ? "#fff" : color;
    ctx.fillRect(-12, -60, 24, 60);
    ctx.fillStyle = "#1a0840";
    ctx.fillRect(-12, -10, 24, 10);

    // Head
    ctx.fillStyle = flash ? "#fff" : "#f0c88a";
    ctx.fillRect(-9, -85, 18, 20);
    
    // Hat
    ctx.fillStyle = flash ? "#fff" : color;
    ctx.beginPath();
    ctx.moveTo(-15, -85); ctx.lineTo(0, -115); ctx.lineTo(15, -85); ctx.closePath(); ctx.fill();

    // Staff
    ctx.fillStyle = "#8b5c20";
    ctx.fillRect(-22, -90, 4, 80);
    
    // Crystal
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#fff";
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-20, -95, 7, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
}
