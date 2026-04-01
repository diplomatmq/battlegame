// fighter.ts — Fighter class: AI, damage, pixel-art draw
import { Particle, DamageText } from "./particles.js";
// Shared mutable state — use an object so it acts as a reference
export const state = { screenShake: 0 };
// ── Standalone preview renderer (used by character.ts and menu.ts) ───────────
export function drawCharacterPreview(ctx, cx, by, charType, color, bob = 0, gt = 0) {
    ctx.imageSmoothingEnabled = false;
    const s = 1.0; // scale — callers can ctx.scale before calling
    ctx.save();
    ctx.translate(cx, by + bob);
    if (charType === "mage" || charType === "killer") {
        _drawMagePreview(ctx, color, gt, s);
    }
    else if (charType === "troll") {
        _drawTrollPreview(ctx, color, s);
    }
    else {
        _drawKnightPreview(ctx, color, s);
    }
    ctx.restore();
}
function _drawKnightPreview(ctx, C, _s) {
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Back leg
    ctx.fillStyle = "#4a3060";
    ctx.fillRect(-13, -22, 12, 24);
    // Cape
    ctx.fillStyle = "#8b1a1a";
    ctx.globalAlpha = 0.8;
    ctx.fillRect(-18, -58, 11, 40);
    ctx.globalAlpha = 1;
    // Torso armor
    ctx.fillStyle = C;
    ctx.fillRect(-14, -62, 30, 44);
    ctx.fillStyle = "#dde0e8";
    ctx.fillRect(-10, -58, 22, 30); // chest plate
    ctx.fillStyle = C;
    // Shoulder pads
    ctx.fillStyle = "#ccc";
    ctx.fillRect(-19, -64, 11, 13);
    ctx.fillRect(9, -64, 11, 13);
    // Front leg
    ctx.fillStyle = "#4a3060";
    ctx.fillRect(2, -22, 12, 24);
    // Neck + face
    ctx.fillStyle = "#f0c88a";
    ctx.fillRect(-7, -74, 14, 14);
    // Helmet
    ctx.fillStyle = C;
    ctx.fillRect(-12, -90, 24, 20);
    ctx.fillStyle = "#aab";
    ctx.fillRect(-10, -78, 20, 9); // visor
    ctx.fillStyle = "#333";
    ctx.fillRect(-7, -76, 4, 4);
    ctx.fillRect(4, -76, 4, 4);
    ctx.fillStyle = "#ccc";
    ctx.fillRect(-12, -92, 24, 4); // brim
    // Shield arm
    ctx.fillStyle = C;
    ctx.fillRect(-26, -62, 12, 34);
    ctx.fillStyle = "#cc2200";
    ctx.fillRect(-30, -66, 11, 40); // shield
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(-27, -54, 5, 5); // emblem
    // Sword arm
    ctx.fillStyle = C;
    ctx.fillRect(15, -64, 12, 30);
    // Sword
    ctx.fillStyle = "#7a4010";
    ctx.fillRect(28, -50, 6, 18);
    ctx.fillStyle = "#cc9900";
    ctx.fillRect(22, -56, 18, 6);
    ctx.fillStyle = "#d8d8e8"; // blade
    ctx.beginPath();
    ctx.moveTo(27, -88);
    ctx.lineTo(33, -88);
    ctx.lineTo(35, -52);
    ctx.lineTo(25, -52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(29, -86, 2, 34);
}
function _drawMagePreview(ctx, C, gt, _s) {
    const glow = Math.sin(gt * 0.06) * 0.5 + 0.5;
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Robe back
    ctx.fillStyle = "#2a0d5e";
    ctx.fillRect(-14, -62, 11, 64);
    // Robe main
    ctx.fillStyle = C;
    ctx.fillRect(-12, -62, 26, 62);
    // Robe trim
    ctx.fillStyle = "#c8a0ff";
    ctx.fillRect(-12, -64, 26, 4);
    ctx.fillRect(-12, -32, 26, 4);
    // Belt
    ctx.fillStyle = "#c8a0ff";
    ctx.fillRect(-8, -44, 18, 5);
    // Legs (under robe hem)
    ctx.fillStyle = "#1a0840";
    ctx.fillRect(-10, -20, 9, 20);
    ctx.fillRect(2, -20, 9, 20);
    // Cloak shoulders
    ctx.fillStyle = C;
    ctx.fillRect(-19, -64, 9, 22);
    ctx.fillRect(12, -64, 9, 22);
    // Neck
    ctx.fillStyle = "#f0c88a";
    ctx.fillRect(-5, -74, 11, 13);
    // Face
    ctx.fillStyle = "#f0c88a";
    ctx.fillRect(-9, -90, 18, 20);
    // Hair blonde
    ctx.fillStyle = "#e8c030";
    ctx.fillRect(-10, -94, 20, 10);
    ctx.fillRect(-12, -90, 6, 16);
    // Eyes
    ctx.fillStyle = "#2020a0";
    ctx.fillRect(-6, -84, 4, 4);
    ctx.fillRect(2, -84, 4, 4);
    // Hood
    ctx.fillStyle = C;
    ctx.fillRect(-10, -98, 20, 10);
    // Staff arm
    ctx.fillStyle = C;
    ctx.fillRect(-22, -64, 10, 32);
    // Staff
    ctx.fillStyle = "#8b5c20";
    ctx.fillRect(-28, -104, 5, 84);
    // Orb
    ctx.shadowBlur = 16 + glow * 18;
    ctx.shadowColor = C;
    ctx.fillStyle = C;
    ctx.beginPath();
    ctx.arc(-26, -108, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Cast hand
    ctx.fillStyle = C;
    ctx.fillRect(14, -60, 10, 24);
}
function _drawTrollPreview(ctx, C, _s) {
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 34, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Back leg
    ctx.fillStyle = "#3d5c1a";
    ctx.fillRect(-16, -30, 14, 30);
    // Body
    ctx.fillStyle = C;
    ctx.fillRect(-24, -76, 48, 54);
    ctx.fillStyle = "#6b3a10";
    ctx.fillRect(-22, -32, 44, 14); // loincloth
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(-11, -72, 9, 32);
    ctx.fillRect(4, -72, 9, 32); // muscle
    // Shoulder pads
    ctx.fillStyle = "#888";
    ctx.fillRect(-28, -78, 16, 14);
    ctx.fillRect(14, -78, 16, 14);
    // Front leg
    ctx.fillStyle = "#3d5c1a";
    ctx.fillRect(4, -30, 14, 30);
    // Arms
    ctx.fillStyle = C;
    ctx.fillRect(-38, -74, 17, 42);
    ctx.fillRect(23, -74, 17, 42);
    // Head
    ctx.fillStyle = C;
    ctx.fillRect(-17, -104, 36, 32);
    // Tusks
    ctx.fillStyle = "#fffde0";
    ctx.fillRect(-15, -78, 6, 12);
    ctx.fillRect(11, -78, 6, 12);
    // Eyes
    ctx.fillStyle = "#cc0000";
    ctx.fillRect(-11, -96, 7, 7);
    ctx.fillRect(6, -96, 7, 7);
    ctx.fillStyle = "#330000";
    ctx.fillRect(-9, -94, 3, 3);
    ctx.fillRect(8, -94, 3, 3);
    // Nose
    ctx.fillStyle = "#2d5010";
    ctx.fillRect(-4, -86, 9, 7);
    // Horns
    ctx.fillStyle = "#4a3010";
    ctx.beginPath();
    ctx.moveTo(-12, -104);
    ctx.lineTo(-20, -124);
    ctx.lineTo(-4, -104);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, -104);
    ctx.lineTo(22, -124);
    ctx.lineTo(6, -104);
    ctx.closePath();
    ctx.fill();
    // Axe
    ctx.fillStyle = "#5c2e08";
    ctx.fillRect(30, -100, 7, 80);
    ctx.fillStyle = "#9a9aaa";
    ctx.beginPath();
    ctx.moveTo(34, -94);
    ctx.lineTo(62, -108);
    ctx.lineTo(66, -78);
    ctx.lineTo(34, -66);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e0e0f0";
    ctx.beginPath();
    ctx.moveTo(60, -110);
    ctx.lineTo(72, -114);
    ctx.lineTo(72, -74);
    ctx.lineTo(60, -70);
    ctx.closePath();
    ctx.fill();
}
export class Fighter {
    constructor(x, y, color, hpFillId, isFacingRight, isKnight, particles, damageTexts) {
        // Faction / stats fields
        this.charType = "knight";
        this.playerAtk = 1;
        this.playerDef = 1;
        this.playerSpd = 1;
        this.equippedWeaponVisual = null;
        this._castTimer = 0;
        this._circleDir = 1;
        this.x = x;
        this.y = y;
        this.startX = x;
        this.targetX = x;
        this.color = color;
        this.hp = 1000;
        this.maxHp = 1000;
        this.hpFillId = hpFillId;
        this.isFacingRight = isFacingRight;
        this.width = 45;
        this.height = 90;
        this.fighterState = "idle";
        this.stateTimer = 0;
        this.attackCooldown = 0;
        this.hitTimer = 0;
        this.isKnight = isKnight;
        this.particles = particles;
        this.damageTexts = damageTexts;
    }
    setOpponent(opp) { this.opponent = opp; }
    // ── Faction-aware AI ────────────────────────────────────────────────────────
    updateAI(gameOver) {
        if (this.hp <= 0 || gameOver)
            return;
        if (this.attackCooldown > 0)
            this.attackCooldown--;
        if (this.stateTimer > 0)
            this.stateTimer--;
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
                    }
                    else {
                        // Hold position — shuffle a little
                        this.targetX = this.startX + (Math.random() * 60 - 30);
                        this.fighterState = "retreating";
                        this.stateTimer = 20;
                    }
                }
                if (this.fighterState === "charging") {
                    this.targetX = this.isFacingRight ? this.opponent.x - 65 : this.opponent.x + 65;
                    this.x += (this.targetX - this.x) * 0.07; // slow, deliberate
                    if (dist < 90) {
                        this.performAttack();
                    }
                    if (this.stateTimer <= 0) {
                        this.fighterState = "idle";
                    }
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
                    }
                    else {
                        // Circle around opponent
                        this._circleDir *= Math.random() < 0.1 ? -1 : 1;
                        this.targetX = this.opponent.x + this._circleDir * (120 + Math.random() * 60);
                        this.fighterState = "circling";
                        this.stateTimer = 25;
                    }
                }
                if (this.fighterState === "circling") {
                    this.x += (this.targetX - this.x) * 0.18;
                    if (this.stateTimer <= 0)
                        this.fighterState = "idle";
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
            // ─── MAGE / dark_mage: keeps distance, channels, then fires a burst
            case "mage":
            case "dark_mage":
                if (this.fighterState === "idle" && this.stateTimer <= 0) {
                    if (dist < 180) {
                        // Too close — back away
                        this.targetX = this.isFacingRight
                            ? this.opponent.x - 250
                            : this.opponent.x + 250;
                        this.fighterState = "retreating";
                        this.stateTimer = 35;
                    }
                    else if (this.attackCooldown <= 0) {
                        this.fighterState = "casting";
                        this._castTimer = 30;
                        this.stateTimer = 30;
                    }
                    else {
                        this.fighterState = "idle";
                        this.stateTimer = 15;
                    }
                }
                if (this.fighterState === "retreating") {
                    this.x += (this.targetX - this.x) * 0.08;
                    if (this.stateTimer <= 0)
                        this.fighterState = "idle";
                }
                if (this.fighterState === "casting") {
                    // Stand still while channeling
                    if (this._castTimer > 0) {
                        this._castTimer--;
                    }
                    else if (this.stateTimer <= 0) {
                        // Release spell: 2 rapid hits
                        this.performAttack();
                        setTimeout(() => { if (this.hp > 0)
                            this.performAttack(); }, 180);
                        this.fighterState = "retreating";
                        this.targetX = this.isFacingRight
                            ? this.opponent.x - 260
                            : this.opponent.x + 260;
                        this.stateTimer = 50;
                    }
                }
                if (this.fighterState === "attacking") {
                    // Mage doesn't lunge — just glows; handled in performAttack
                    if (this.stateTimer <= 0)
                        this.fighterState = "idle";
                }
                break;
            // ─── TROLL / orc / stone_giant: berserker — always rushing
            default:
                if (this.fighterState === "idle" && this.stateTimer <= 0) {
                    if (this.attackCooldown <= 0) {
                        this.fighterState = "moving";
                    }
                    else {
                        this.fighterState = "retreating";
                        this.targetX = this.startX + (Math.random() * 80 - 40);
                        this.stateTimer = 18; // short idle — aggressive
                    }
                }
                if (this.fighterState === "moving") {
                    this.targetX = this.isFacingRight ? this.opponent.x - 80 : this.opponent.x + 80;
                    this.x += (this.targetX - this.x) * 0.14;
                    if (dist < 100) {
                        this.performAttack();
                    }
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
            if (this.stateTimer <= 0)
                this.fighterState = "idle";
        }
        // Clamp to arena
        this.x = Math.max(50, Math.min(850, this.x));
    }
    performAttack() {
        this.fighterState = "attacking";
        this.stateTimer = 12;
        const isMage = this.charType === "mage" || this.charType === "dark_mage";
        const isKiller = this.charType === "killer" || this.charType === "shadow_killer";
        // SPD influences cooldown
        const baseCd = isMage ? 110 : isKiller ? 55 : 85;
        this.attackCooldown = Math.max(20, baseCd - (this.playerSpd - 1) * 4) + Math.random() * 25;
        const delay = isMage ? 220 : 80; // mage spell travels
        setTimeout(() => {
            if (this.hp <= 0)
                return;
            const range = isMage ? 320 : 130;
            if (Math.abs(this.x - this.opponent.x) > range)
                return;
            // Mage 2-hit burst does less per hit; troll hits hardest
            const baseMin = isMage ? 35 : isKiller ? 45 : 55;
            const baseMax = isMage ? 55 : isKiller ? 85 : 110;
            const base = baseMin + Math.random() * (baseMax - baseMin);
            const dmg = Math.floor(base * (1 + (this.playerAtk - 1) * 0.18));
            this.opponent.takeDamage(dmg, this.color);
            // Mage adds particle burst from afar
            if (isMage) {
                for (let i = 0; i < 18; i++)
                    this.particles.push(new Particle(this.opponent.x, this.opponent.y - 60, this.color, 2.0));
            }
        }, delay);
    }
    takeDamage(amount, attackerColor) {
        const reduced = Math.max(1, Math.floor(amount - (this.playerDef - 1) * 2.0));
        this.hp = Math.max(0, this.hp - reduced);
        this.hitTimer = 15;
        state.screenShake = 12;
        this.damageTexts.push(new DamageText(this.x, this.y - this.height, reduced, "#fff"));
        for (let i = 0; i < 25; i++)
            this.particles.push(new Particle(this.x, this.y - this.height / 2, attackerColor, 1.6));
        for (let i = 0; i < 12; i++)
            this.particles.push(new Particle(this.x, this.y - this.height / 2, "#ffffff", 2.1));
        const fill = document.getElementById(this.hpFillId);
        if (fill)
            fill.style.width = (this.hp / this.maxHp) * 100 + "%";
    }
    draw(ctx, gameTime) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(this.x, this.y);
        const attacking = this.fighterState === "attacking" || this.fighterState === "charging";
        const moving = this.fighterState === "moving" || this.fighterState === "circling";
        const casting = this.fighterState === "casting";
        let tilt = 0;
        if (moving)
            tilt = this.isFacingRight ? 0.12 : -0.12;
        if (attacking)
            tilt = this.isFacingRight ? 0.30 : -0.30;
        if (casting)
            tilt = 0; // mage stands upright while casting
        ctx.rotate(tilt);
        if (!this.isFacingRight)
            ctx.scale(-1, 1);
        const flash = this.hitTimer > 0;
        if (this.hitTimer > 0)
            this.hitTimer--;
        ctx.shadowBlur = flash ? 50 : (attacking ? 28 : casting ? 40 : 12);
        ctx.shadowColor = flash ? "#fff" : this.color;
        const legSwing = (moving || attacking) ? Math.sin(gameTime * 0.45) * 11 : 0;
        const isMage = this.charType === "mage" || this.charType === "dark_mage";
        const isTroll = this.charType === "troll" || this.charType === "orc_raider" || this.charType === "stone_giant";
        const isKiller = this.charType === "killer" || this.charType === "shadow_killer";
        if (isMage) {
            this.drawMage(ctx, gameTime, flash, legSwing, attacking || casting);
        }
        else if (isTroll) {
            this.drawTroll(ctx, gameTime, flash, legSwing, attacking);
        }
        else if (isKiller) {
            this.drawKnight(ctx, gameTime, flash, legSwing, attacking); // killer uses knight body
        }
        else {
            this.drawKnight(ctx, gameTime, flash, legSwing, attacking);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    fill(ctx, flash, color) {
        ctx.fillStyle = flash ? "#ffffff" : color;
    }
    // ────────────────────────────────────────────────────────── KNIGHT
    drawKnight(ctx, _gt, flash, leg, atk) {
        const C = this.color;
        // Back leg
        ctx.fillStyle = flash ? "#fff" : "#4a3060";
        ctx.fillRect(-13, -22, 11, 24 - leg);
        // Cape
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = flash ? "#fff" : "#8b1a1a";
        ctx.fillRect(-16, -56, 10, 38);
        ctx.globalAlpha = 1;
        // Torso — armor
        this.fill(ctx, flash, C);
        ctx.fillRect(-14, -60, 30, 42);
        // Chest plate detail
        if (!flash) {
            ctx.fillStyle = "#ddd";
            ctx.fillRect(-10, -56, 22, 28);
        }
        // Shoulder pads
        if (!flash) {
            ctx.fillStyle = "#ccc";
            ctx.fillRect(-18, -62, 10, 12);
            ctx.fillRect(8, -62, 10, 12);
        }
        // Head / helmet
        if (!flash) {
            ctx.fillStyle = "#f0c88a";
            ctx.fillRect(-9, -82, 18, 18);
        } // face
        this.fill(ctx, flash, C);
        ctx.fillRect(-11, -88, 22, 18); // helmet top
        if (!flash) {
            ctx.fillStyle = "#888";
            ctx.fillRect(-9, -76, 18, 8); // visor
            ctx.fillStyle = "#333";
            ctx.fillRect(-7, -74, 4, 4);
            ctx.fillRect(3, -74, 4, 4); // eye slits
        }
        // Front arm + shield
        this.fill(ctx, flash, C);
        ctx.fillRect(-24, -60, 11, 32); // shield arm
        if (!flash) {
            ctx.fillStyle = "#cc2200";
            ctx.fillRect(-28, -64, 10, 38); // shield body
            ctx.fillStyle = "#ffcc00";
            ctx.fillRect(-25, -52, 4, 4); // shield emblem
        }
        // Sword arm
        this.fill(ctx, flash, C);
        ctx.fillRect(14, -62, 11, 28);
        // Front leg
        ctx.fillStyle = flash ? "#fff" : "#4a3060";
        ctx.fillRect(2, -22, 11, 24 + leg);
        // Weapon — use equipped visual if set
        const wv = this.equippedWeaponVisual;
        if (wv === "axe")
            this.drawAxe(ctx, atk);
        else if (wv === "hammer")
            this.drawHammer(ctx, atk);
        else
            this.drawSword(ctx, atk); // default sword
    }
    // ────────────────────────────────────────────────────────── MAGE
    drawMage(ctx, gt, flash, leg, atk) {
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
            ctx.fillStyle = "#c8a0ff";
            ctx.fillRect(-12, -62, 26, 4);
            ctx.fillRect(-12, -30, 26, 4);
        }
        // Back leg (robe slit)
        ctx.fillStyle = flash ? "#fff" : "#1a0840";
        ctx.fillRect(-10, -20, 9, 20 - leg);
        // Front leg
        ctx.fillStyle = flash ? "#fff" : "#1a0840";
        ctx.fillRect(2, -20, 9, 20 + leg);
        // Body under robe (belt)
        if (!flash) {
            ctx.fillStyle = "#c8a0ff";
            ctx.fillRect(-8, -42, 18, 5);
        }
        // Cloak shoulders
        this.fill(ctx, flash, C);
        ctx.fillRect(-18, -62, 8, 20);
        ctx.fillRect(12, -62, 8, 20);
        // Neck
        if (!flash) {
            ctx.fillStyle = "#f0c88a";
            ctx.fillRect(-5, -72, 11, 12);
        }
        // Head
        if (!flash) {
            ctx.fillStyle = "#f0c88a";
            ctx.fillRect(-9, -88, 18, 20);
        }
        // Hair (blonde)
        if (!flash) {
            ctx.fillStyle = "#e8c030";
            ctx.fillRect(-10, -92, 20, 10);
            ctx.fillRect(-12, -88, 6, 14);
        }
        // Eyes
        if (!flash) {
            ctx.fillStyle = "#2020a0";
            ctx.fillRect(-6, -82, 4, 4);
            ctx.fillRect(2, -82, 4, 4);
        }
        // Hood / hat
        this.fill(ctx, flash, C);
        ctx.fillRect(-10, -96, 20, 10);
        // Staff arm
        this.fill(ctx, flash, C);
        ctx.fillRect(-20, -62, 9, 30);
        // Staff
        if (!flash) {
            ctx.fillStyle = "#8b5c20";
            ctx.fillRect(-26, -100, 5, 80);
        }
        // Orb glow
        if (!flash) {
            ctx.shadowBlur = 20 + glow * 20;
            ctx.shadowColor = C;
            ctx.fillStyle = flash ? "#fff" : `rgba(${this.color === "#00e5ff" ? "0,200,255" : this.color === "#00ff88" ? "0,255,136" : "187,68,255"},${0.8 + glow * 0.2})`;
            ctx.beginPath();
            ctx.arc(-24, -105, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        // Cast hand glow on attack
        if (atk && !flash) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = C;
            ctx.fillStyle = C;
            ctx.beginPath();
            ctx.arc(18, -50, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        else {
            this.fill(ctx, flash, C);
            ctx.fillRect(14, -58, 9, 22);
        }
    }
    // ────────────────────────────────────────────────────────── TROLL
    drawTroll(ctx, _gt, flash, leg, atk) {
        const C = this.color;
        // Back leg
        ctx.fillStyle = flash ? "#fff" : "#3d5c1a";
        ctx.fillRect(-16, -28, 14, 28 - leg);
        // Body (big & stocky)
        this.fill(ctx, flash, C);
        ctx.fillRect(-22, -74, 46, 52);
        if (!flash) {
            // Leather loincloth
            ctx.fillStyle = "#6b3a10";
            ctx.fillRect(-20, -30, 42, 14);
            // Muscle definition
            ctx.fillStyle = "rgba(0,0,0,0.15)";
            ctx.fillRect(-10, -70, 8, 30);
            ctx.fillRect(4, -70, 8, 30);
            // Shoulder armor
            ctx.fillStyle = "#888";
            ctx.fillRect(-26, -76, 14, 14);
            ctx.fillRect(14, -76, 14, 14);
        }
        // Head (bigger, brutish)
        this.fill(ctx, flash, C);
        ctx.fillRect(-16, -100, 34, 30);
        if (!flash) {
            // Tusks
            ctx.fillStyle = "#fffde0";
            ctx.fillRect(-14, -76, 5, 10);
            ctx.fillRect(11, -76, 5, 10);
            // Eyes (red beady)
            ctx.fillStyle = "#cc0000";
            ctx.fillRect(-10, -92, 6, 6);
            ctx.fillRect(6, -92, 6, 6);
            ctx.fillStyle = "#330000";
            ctx.fillRect(-8, -91, 3, 3);
            ctx.fillRect(8, -91, 3, 3);
            // Nose
            ctx.fillStyle = "#2d5010";
            ctx.fillRect(-4, -84, 8, 6);
            // Horns
            ctx.fillStyle = "#4a3010";
            ctx.beginPath();
            ctx.moveTo(-12, -100);
            ctx.lineTo(-18, -118);
            ctx.lineTo(-5, -100);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(14, -100);
            ctx.lineTo(20, -118);
            ctx.lineTo(8, -100);
            ctx.fill();
        }
        // Arms
        this.fill(ctx, flash, C);
        ctx.fillRect(-36, -72, 16, 40); // back arm
        ctx.fillRect(22, -72, 16, 40); // front arm
        // Front leg
        ctx.fillStyle = flash ? "#fff" : "#3d5c1a";
        ctx.fillRect(4, -28, 14, 28 + leg);
        // Axe
        this.drawAxe(ctx, atk);
    }
    drawSword(ctx, atk) {
        ctx.save();
        ctx.translate(22, -55);
        ctx.rotate(atk ? -Math.PI * 0.55 : -Math.PI * 0.15);
        // Handle
        ctx.fillStyle = "#7a4010";
        ctx.fillRect(-3, 12, 6, 18);
        // Guard
        ctx.fillStyle = "#cc9900";
        ctx.fillRect(-9, 6, 18, 6);
        // Pommel
        ctx.fillStyle = "#cc9900";
        ctx.fillRect(-4, 28, 8, 6);
        // Blade
        ctx.fillStyle = "#d8d8e8";
        ctx.beginPath();
        ctx.moveTo(-3, -38);
        ctx.lineTo(3, -38);
        ctx.lineTo(5, 8);
        ctx.lineTo(-5, 8);
        ctx.closePath();
        ctx.fill();
        // Blade edge shine
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-1, -36, 2, 40);
        ctx.restore();
    }
    drawHammer(ctx, atk) {
        ctx.save();
        ctx.translate(24, -58);
        ctx.rotate(atk ? -Math.PI * 0.6 : 0);
        // Handle
        ctx.fillStyle = "#5c2e08";
        ctx.fillRect(-3, -6, 6, 60);
        // Head left
        ctx.fillStyle = "#8a8aaa";
        ctx.fillRect(-14, -34, 30, 20);
        // Head top / edge
        ctx.fillStyle = "#b0b0cc";
        ctx.fillRect(-12, -38, 26, 8);
        // Bolts
        ctx.fillStyle = "#ffcc00";
        ctx.fillRect(-10, -30, 5, 5);
        ctx.fillRect(7, -30, 5, 5);
        ctx.restore();
    }
    drawAxe(ctx, atk) {
        ctx.save();
        ctx.translate(30, -60);
        ctx.rotate(atk ? -Math.PI * 0.65 : Math.PI * 0.08);
        // Handle
        ctx.fillStyle = "#5c2e08";
        ctx.fillRect(-3, -10, 7, 65);
        // Axe head body
        ctx.fillStyle = "#9a9aaa";
        ctx.beginPath();
        ctx.moveTo(4, -30);
        ctx.lineTo(30, -42);
        ctx.lineTo(34, -16);
        ctx.lineTo(4, -8);
        ctx.closePath();
        ctx.fill();
        // Axe edge
        ctx.fillStyle = "#e0e0f0";
        ctx.beginPath();
        ctx.moveTo(28, -44);
        ctx.lineTo(38, -48);
        ctx.lineTo(38, -10);
        ctx.lineTo(28, -12);
        ctx.closePath();
        ctx.fill();
        // Back spike
        ctx.fillStyle = "#7a7a8a";
        ctx.beginPath();
        ctx.moveTo(4, -20);
        ctx.lineTo(-10, -26);
        ctx.lineTo(-8, -14);
        ctx.lineTo(4, -12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}
