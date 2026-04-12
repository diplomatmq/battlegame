// player.ts — shared data model and localStorage helpers

export type WeaponType = "staff" | "daggers" | "scythe" | "axe" | "knife";
export const CHAR_IDS = ["mage", "scarlet_assassin", "necromancer", "berserker", "goblin"] as const;
export type CharId = typeof CHAR_IDS[number];

export function isCharId(v: string): v is CharId {
  return (CHAR_IDS as readonly string[]).includes(v);
}

export interface CharMeta {
  id: CharId;
  name: string;
  desc: string;
  color: string;
  rgb: string;
  weapon: WeaponType;
  isKnight: boolean;
  maxHp: number;
}

export const CHAR_META: Record<CharId, CharMeta> = {
  mage: {
    id: "mage",
    name: "\u041d\u0415\u0424\u0420\u0418\u0422 \u041c\u0410\u0413",
    desc: "\u041c\u0410\u0421\u0422\u0415\u0420 \u0418\u0417\u0423\u041c\u0420\u0423\u0414\u041d\u041e\u0419 \u042d\u041d\u0415\u0420\u0413\u0418\u0418",
    color: "#00e884", rgb: "0,232,132",
    weapon: "staff", isKnight: false, maxHp: 300,
  },
  scarlet_assassin: {
    id: "scarlet_assassin",
    name: "\u0410\u041b\u042b\u0419 \u0423\u0411\u0418\u0419\u0426\u0410",
    desc: "\u0411\u0410\u0413\u0420\u042f\u041d\u042b\u0419 \u0422\u0410\u041d\u0426\u041e\u0420 \u0414\u0412\u0423\u0425 \u041a\u041b\u0418\u041d\u041a\u041e\u0412",
    color: "#e0142f", rgb: "224,20,47",
    weapon: "daggers", isKnight: false, maxHp: 260,
  },
  necromancer: {
    id: "necromancer",
    name: "\u041d\u0415\u041a\u0420\u041e\u041c\u0410\u041d\u0422",
    desc: "\u0412\u041b\u0410\u0414\u042b\u041a\u0410 \u0414\u0423\u0428 \u0418 \u0422\u0415\u041c\u041d\u041e\u0419 \u041c\u0410\u0413\u0418\u0418",
    color: "#7a4ab8", rgb: "122,74,184",
    weapon: "scythe", isKnight: false, maxHp: 320,
  },
  berserker: {
    id: "berserker",
    name: "\u0411\u0415\u0420\u0421\u0415\u0420\u041a",
    desc: "\u042f\u0420\u041e\u0421\u0422\u041d\u042b\u0419 \u0420\u0423\u0411\u0410\u041a\u0410 \u041f\u0415\u0420\u0415\u0414\u041d\u0415\u0419 \u041b\u0418\u041d\u0418\u0418",
    color: "#c86a1d", rgb: "200,106,29",
    weapon: "axe", isKnight: true, maxHp: 410,
  },
  goblin: {
    id: "goblin",
    name: "\u0413\u041e\u0411\u041b\u0418\u041d",
    desc: "\u0425\u0418\u0422\u0420\u042b\u0419 \u0420\u0415\u0417\u0427\u0418\u041a \u0418\u0417 \u0427\u0410\u0429\u0418",
    color: "#5fbf3a", rgb: "95,191,58",
    weapon: "knife", isKnight: false, maxHp: 230,
  },
};

// ── Shop catalogue (shared between shop.ts, game.ts, fighter.ts) ─────────────
export type ItemSlot = "weapon" | "armor" | "accessory";
export type WeaponVisual = "sword" | "axe" | "hammer" | "staff";

export interface ShopItemDef {
  id:            string;
  name:          string;
  icon:          string;
  price:         number;
  slot:          ItemSlot;
  bonus:         { atk: number; def: number; spd: number };
  weaponVisual?: WeaponVisual;
}

export const SHOP_CATALOGUE: ShopItemDef[] = [
  // weapons
  { id: "iron_sword",     icon: "\u2694\uFE0F", name: "\u0416\u0415\u041b\u0415\u0417\u041d\u042b\u0419 \u041c\u0415\u0427",   price:  80, slot: "weapon",    bonus: { atk: 3, def: 0, spd: 0 }, weaponVisual: "sword" },
  { id: "fire_axe",       icon: "\uD83D\uDD25", name: "\u041e\u0413\u041d\u0415\u041d\u041d\u042b\u0419 \u0422\u041e\u041f\u041e\u0420", price: 140, slot: "weapon", bonus: { atk: 5, def: 0, spd: 0 }, weaponVisual: "axe" },
  { id: "shadow_blade",   icon: "\uD83D\uDDE1\uFE0F", name: "\u041a\u041b\u0418\u041d\u041e\u041a \u0422\u0415\u041d\u0418", price: 120, slot: "weapon", bonus: { atk: 2, def: 0, spd: 3 }, weaponVisual: "sword" },
  { id: "thunder_hammer", icon: "\uD83D\uDD28", name: "\u041c\u041e\u041b\u041e\u0422 \u0413\u0420\u041e\u041c\u0410",          price: 220, slot: "weapon",    bonus: { atk: 8, def: 0, spd: 0 }, weaponVisual: "hammer" },
  // armor
  { id: "shield_rune",    icon: "\uD83D\uDEE1\uFE0F", name: "\u0420\u0423\u041d\u0410 \u0429\u0418\u0422\u0410",               price:  60, slot: "armor",     bonus: { atk: 0, def: 5, spd: 0 } },
  { id: "iron_armor",     icon: "\uD83E\uDDE5",       name: "\u0416\u0415\u041b\u0415\u0417\u041d\u0410\u042f \u0411\u0420\u041e\u041d\u042f", price: 110, slot: "armor", bonus: { atk: 0, def: 8, spd: 0 } },
  // accessories
  { id: "speed_elixir",   icon: "\u26A1",             name: "\u042d\u041b\u0418\u041a\u0421\u0418\u0420 \u0421\u041a\u041e\u0420.",  price:  55, slot: "accessory", bonus: { atk: 0, def: 0, spd: 4 } },
  { id: "rage_crystal",   icon: "\uD83D\uDD2E",       name: "\u041a\u0420\u0418\u0421\u0422\u0410\u041b\u042c \u042f\u0420\u041e\u0421\u0422\u0418", price: 75, slot: "accessory", bonus: { atk: 4, def: 0, spd: 0 } },
];

// ── Level / XP ────────────────────────────────────────────────────────────────
export function getLevel(): number { return parseInt(localStorage.getItem("playerLevel") ?? "1", 10); }
export function setLevel(v: number): void { localStorage.setItem("playerLevel", String(v)); }
export function getXP():    number { return parseInt(localStorage.getItem("playerXP")    ?? "0", 10); }
export function setXP(v: number):   void { localStorage.setItem("playerXP",    String(v)); }
export function getXPForNextLevel(): number { return getLevel() * 15; }
/** Returns true if leveled up */
export function addXP(amount: number): boolean {
  let xp = getXP() + amount;
  const needed = getXPForNextLevel();
  if (xp >= needed) {
    setLevel(getLevel() + 1);
    setXP(xp - needed);
    return true;
  }
  setXP(xp);
  return false;
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export interface PlayerStats { atk: number; def: number; spd: number; }

export function getBaseStats(): PlayerStats {
  const lvl = getLevel();
  return { atk: lvl, def: lvl, spd: lvl };
}

// ── Equipped items ────────────────────────────────────────────────────────────
export interface EquippedItems { weapon: string | null; armor: string | null; accessory: string | null; }

export function getEquipped(): EquippedItems {
  try { return JSON.parse(localStorage.getItem("equippedItems") ?? "null") ?? { weapon: null, armor: null, accessory: null }; }
  catch { return { weapon: null, armor: null, accessory: null }; }
}
export function setEquipped(v: EquippedItems): void { localStorage.setItem("equippedItems", JSON.stringify(v)); }

export function getTotalStats(): PlayerStats {
  const base = getBaseStats();
  const eq   = getEquipped();
  let { atk, def, spd } = base;
  for (const id of [eq.weapon, eq.armor, eq.accessory]) {
    if (!id) continue;
    const item = SHOP_CATALOGUE.find(i => i.id === id);
    if (item) { atk += item.bonus.atk; def += item.bonus.def; spd += item.bonus.spd; }
  }
  return { atk, def, spd };
}

export function getEquippedWeaponVisual(): WeaponVisual | null {
  const eq = getEquipped();
  if (!eq.weapon) return null;
  const item = SHOP_CATALOGUE.find(i => i.id === eq.weapon);
  return (item?.weaponVisual as WeaponVisual) ?? null;
}

// ── Basic player data ─────────────────────────────────────────────────────────
export function getNick(): string | null { return localStorage.getItem("playerNick"); }
export function setNick(v: string): void { localStorage.setItem("playerNick", v); }

export function getAvatar(): string | null { return localStorage.getItem("playerAvatar"); }
export function setAvatar(v: string): void { localStorage.setItem("playerAvatar", v); }

export function getCharId(): CharId | null {
  const raw = localStorage.getItem("playerCharacter");
  if (!raw) return null;
  return isCharId(raw) ? raw : null;
}
export function setCharId(v: CharId | string): void {
  if (typeof v !== "string") return;
  if (!isCharId(v)) return;
  localStorage.setItem("playerCharacter", v);
}

export function getCoins(): number { return parseInt(localStorage.getItem("playerCoins") ?? "0", 10); }
export function setCoins(v: number): void { localStorage.setItem("playerCoins", String(v)); }

export function getTakenNicks(): string[] { return JSON.parse(localStorage.getItem("takenNicks") ?? "[]"); }
export function isNickTaken(nick: string): boolean {
  const current = getNick();
  return getTakenNicks().includes(nick.toLowerCase()) &&
    nick.toLowerCase() !== (current ?? "").toLowerCase();
}
export function registerNick(nick: string): void {
  const list = getTakenNicks();
  if (!list.includes(nick.toLowerCase())) { list.push(nick.toLowerCase()); localStorage.setItem("takenNicks", JSON.stringify(list)); }
}

export interface TelegramUser { id?: number; username?: string; first_name?: string; }
export function getTelegramUser(): TelegramUser | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tg = (window as any).Telegram?.WebApp;
  if (tg) { tg.ready(); tg.expand(); }
  return tg?.initDataUnsafe?.user ?? null;
}

// ── Enemy roster (random opponent each fight) ─────────────────────────────────
export interface EnemyDef {
  id: string; name: string; charType: string;
  color: string; maxHp: number;
  atk: number; def: number; spd: number;
}
export const ENEMY_ROSTER: EnemyDef[] = [
  { id: "troll_warrior",  name: "\u0422\u0420\u041e\u041b\u041b\u042c \u0412\u041e\u0418\u041d",        charType: "troll",  color: "#cc3300", maxHp: 1100, atk: 3, def: 2, spd: 1 },
  { id: "dark_mage",      name: "\u0422\u0415\u041c\u041d\u042b\u0419 \u041c\u0410\u0413",              charType: "mage",   color: "#9900cc", maxHp:  850, atk: 4, def: 1, spd: 4 },
  { id: "orc_raider",     name: "\u041e\u0420\u041a \u041d\u0410\u041b\u0415\u0422\u0427\u0418\u041a",  charType: "troll",  color: "#558822", maxHp:  800, atk: 5, def: 1, spd: 5 },
  { id: "iron_golem",     name: "\u0416\u0415\u041b\u0415\u0417\u041d\u042b\u0419 \u0413\u041e\u041b\u0415\u041c", charType: "knight", color: "#8899aa", maxHp: 1400, atk: 2, def: 8, spd: 1 },
  { id: "shadow_killer",  name: "\u0423\u0411\u0418\u0419\u0426\u0410 \u0422\u0415\u041d\u0415\u0419",  charType: "killer", color: "#aa0066", maxHp:  700, atk: 6, def: 1, spd: 6 },
  { id: "stone_giant",    name: "\u041a\u0410\u041c\u0415\u041d\u041d\u042b\u0419 \u0413\u0418\u0413\u0410\u041d\u0422", charType: "troll", color: "#776655", maxHp: 1500, atk: 4, def: 5, spd: 1 },
  { id: "blood_knight",   name: "\u041a\u0420\u041e\u0412\u0410\u0412\u042b\u0419 \u0420\u042b\u0426\u0410\u0420\u042c", charType: "knight", color: "#cc0022", maxHp:  950, atk: 5, def: 4, spd: 2 },
  { id: "scarlet_assassin", name: "\u0410\u041b\u042b\u0419 \u0423\u0411\u0418\u0419\u0426\u0410", charType: "scarlet_assassin", color: "#d6152e", maxHp: 820, atk: 6, def: 2, spd: 7 },
  { id: "necromancer",      name: "\u041d\u0415\u041a\u0420\u041e\u041c\u0410\u041d\u0422",     charType: "necromancer",      color: "#7a4ab8", maxHp: 980, atk: 5, def: 3, spd: 3 },
  { id: "berserker",        name: "\u0411\u0415\u0420\u0421\u0415\u0420\u041a",       charType: "berserker",        color: "#c86a1d", maxHp: 1250, atk: 7, def: 2, spd: 3 },
  { id: "goblin",           name: "\u0413\u041e\u0411\u041b\u0418\u041d",         charType: "goblin",           color: "#5fbf3a", maxHp: 760, atk: 4, def: 1, spd: 7 },
];
export function getRandomEnemy(): EnemyDef {
  return ENEMY_ROSTER[Math.floor(Math.random() * ENEMY_ROSTER.length)];
}

// ── Challenge progress helpers (called from game.ts / shop.ts) ────────────────
function incProg(id: string, by = 1): void {
  const v = parseInt(localStorage.getItem(`ch_prog_${id}`) ?? "0", 10);
  localStorage.setItem(`ch_prog_${id}`, String(v + by));
}
export function recordFightPlayed(): void {
  incProg("daily_fight1"); incProg("daily_fight3"); incProg("weekly_fight10");
}
export function recordFightWon(): void {
  incProg("daily_win1"); incProg("weekly_win5");
}
export function recordCoinSpend(amount: number): void {
  incProg("weekly_spend200", amount);
}
