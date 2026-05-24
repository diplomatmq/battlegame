const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const telegramToken = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(telegramToken, { polling: false });

// Only webhook mode: set webhook and expose POST /bot<TOKEN> endpoint
const WEBHOOK_URL = process.env.WEBHOOK_URL || process.env.BASE_URL || process.env.SERVER_URL;
if (WEBHOOK_URL) {
  const hookPath = `/bot${telegramToken}`;
  const hookUrl = `${WEBHOOK_URL.replace(/\/$/, '')}${hookPath}`;
  (async () => {
    try {
      await bot.setWebHook(hookUrl);
    } catch (e) {
      console.error('Failed to set Telegram webhook', e && e.message ? e.message : e);
    }
  })();

  app.post(hookPath, express.json(), (req, res) => {
    try {
      console.log('Webhook received:', JSON.stringify(req.body)); // Логируем входящий webhook
      bot.processUpdate(req.body);
    } catch (e) {
      console.error('Error processing Telegram update via webhook', e);
    }
    res.sendStatus(200);
  });
}

// Установка webhook при запуске сервера (гарантированно)
(async () => {
  try {
    const WEBHOOK_URL = process.env.WEBHOOK_URL || process.env.BASE_URL || process.env.SERVER_URL;
    if (WEBHOOK_URL && telegramToken) {
      const hookPath = `/bot${telegramToken}`;
      const hookUrl = `${WEBHOOK_URL.replace(/\/$/, '')}${hookPath}`;
      await bot.setWebHook(hookUrl);
      console.log('Telegram webhook set:', hookUrl);
    } else {
      console.error('WEBHOOK_URL or TELEGRAM_TOKEN not set');
    }
  } catch (e) {
    console.error('Failed to set Telegram webhook (forced):', e && e.message ? e.message : e);
  }
})();

let waitingPlayer = null;
const activeMatches = new Map(); // socketId -> { roomId, opponentId, role }

function normalizeProfile(raw) {
  const safe = raw || {};
  return {
    name: typeof safe.name === 'string' && safe.name.trim() ? safe.name.trim() : 'Игрок',
    avatar: typeof safe.avatar === 'string' ? safe.avatar : null,
    charType: typeof safe.charType === 'string' ? safe.charType : 'mage',
    atk: Number.isFinite(safe.atk) ? safe.atk : 1,
    def: Number.isFinite(safe.def) ? safe.def : 1,
    spd: Number.isFinite(safe.spd) ? safe.spd : 1,
    weaponVisual: typeof safe.weaponVisual === 'string' ? safe.weaponVisual : null,
  };
}

function clearFromQueue(socketId) {
  if (waitingPlayer && waitingPlayer.socket && waitingPlayer.socket.id === socketId) {
    waitingPlayer = null;
  }
}

function clearMatchBySocketId(socketId) {
  const current = activeMatches.get(socketId);
  if (!current) return null;
  activeMatches.delete(socketId);
  activeMatches.delete(current.opponentId);
  return current;
}

io.on('connection', (socket) => {
  socket.on('play', (profile) => {
    const normalized = normalizeProfile(profile);

    clearFromQueue(socket.id);
    clearMatchBySocketId(socket.id);

    if (waitingPlayer && waitingPlayer.socket.id !== socket.id) {
      const host = waitingPlayer;
      const guest = { socket, profile: normalized };
      waitingPlayer = null;

      const roomId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const seed = Math.floor(Math.random() * 1000000);

      host.socket.join(roomId);
      guest.socket.join(roomId);

      activeMatches.set(host.socket.id, { roomId, opponentId: guest.socket.id, role: 'host' });
      activeMatches.set(guest.socket.id, { roomId, opponentId: host.socket.id, role: 'guest' });

      host.socket.emit('startGame', {
        roomId,
        seed,
        isHost: true,
        profile: guest.profile,
      });

      guest.socket.emit('startGame', {
        roomId,
        seed,
        isHost: false,
        profile: host.profile,
      });

      return;
    }

    waitingPlayer = { socket, profile: normalized, queuedAt: Date.now() };
    socket.emit('waiting');
  });

  socket.on('cancel_search', () => {
    clearFromQueue(socket.id);
  });

  // Host is authoritative and sends battle snapshots; server relays to guest.
  socket.on('battle_state', (payload) => {
    const match = activeMatches.get(socket.id);
    if (!match || match.role !== 'host') return;
    
    // Relay state to opponent
    const roomId = match.roomId;
    const state = payload && payload.state ? payload.state : payload;
    
    // Use broadcast to room instead of direct emit to ensure reliability
    socket.to(roomId).emit('battle_state', { state });
  });

  socket.on('battle_over', (payload) => {
    const match = activeMatches.get(socket.id);
    if (!match) return;
    
    const roomId = match.roomId;
    const outcome = payload && payload.outcome ? payload.outcome : 'draw';
    
    // Broadcast outcome to everyone in the room
    io.to(roomId).emit('battle_over', { outcome });
    
    // Clean up match
    setTimeout(() => {
      clearMatchBySocketId(socket.id);
    }, 2000);
  });

  socket.on('disconnect', () => {
    clearFromQueue(socket.id);
    const match = clearMatchBySocketId(socket.id);
    if (match) {
      io.to(match.opponentId).emit('opponent_left');
    }
  });
});

bot.on('message', async (msg) => {
  const base = process.env.WEB_APP_BASE_URL || process.env.WEBHOOK_URL || process.env.BASE_URL || 'https://battlerealme.monkeysdynasty.website';
  const safeBase = base.replace(/\/$/, '');
  if (msg.text === '/start' && msg.chat && msg.chat.type === 'private') {
    const userId = msg.from && (msg.from.id || msg.from.user_id) ? (msg.from.id || msg.from.user_id) : null;
    const username = msg.from && (msg.from.username || msg.from.first_name) ? (msg.from.username || msg.from.first_name) : 'player';
    
    let hasCharacter = false;
    if (userId) {
      // Регистрируем пользователя в базе
      await registerPlayer(String(userId), username);
      
      try {
        const charRes = await pool.query('SELECT * FROM user_characters WHERE user_id = (SELECT id FROM players WHERE telegram_id = $1) LIMIT 1', [String(userId)]);
        hasCharacter = charRes.rowCount > 0;
      } catch (e) {
        console.error('Error checking user characters:', e.message);
      }
    }

    const targetPage = hasCharacter ? 'menu.html' : 'character.html';
    const url = userId ? `${safeBase}/index.html?page=${targetPage}&tg=${userId}` : `${safeBase}/index.html?page=${targetPage}`;
    const text = 'Добро пожаловать в Battle Realm! Нажми "Играть", чтобы войти в игру.';

    bot.sendMessage(msg.chat.id, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Играть', web_app: { url } }]
        ]
      }
    }).catch(() => { });
  } else {
    bot.sendMessage(msg.chat.id, 'Добро пожаловать в игру! Введи /start для входа.').catch(() => { });
  }
});

// Если запрашивают исходную страницу - отдаем текст
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.json());
app.post('/telegram', async (req, res) => {
  const { chatId, text } = req.body;
  try {
    await bot.sendMessage(chatId, text);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Endpoint for the webapp to save the character to database
app.post('/api/character', async (req, res) => {
  const { telegram_id, character_id, faction } = req.body;
  try {
    // Получаем ID пользователя
    const userRes = await pool.query('SELECT id FROM players WHERE telegram_id = $1', [telegram_id]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }
    const userId = userRes.rows[0].id;

    const sync = await ensureUserCharacterForUserId(userId, character_id, faction || 'human');
    res.json({ ok: true, sync });
  } catch (e) {
    console.error('API /api/character error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Lightweight sync endpoint to restore DB records from WebApp local state.
app.post('/api/sync-user', async (req, res) => {
  const telegramId = req.body && req.body.telegram_id ? String(req.body.telegram_id) : null;
  if (!telegramId) {
    return res.status(400).json({ ok: false, error: 'telegram_id is required' });
  }

  const username = req.body && req.body.username
    ? String(req.body.username)
    : `player_${telegramId}`;
  const characterId = req.body && req.body.character_id
    ? String(req.body.character_id)
    : null;
  const faction = req.body && req.body.faction
    ? String(req.body.faction)
    : 'human';

  try {
    await registerPlayer(telegramId, username);

    let sync = { created: false, updated: false };
    if (characterId) {
      const result = await ensureUserCharacterByTelegramId(telegramId, characterId, faction);
      if (result) sync = result;
    }

    const profileRes = await pool.query(
      `SELECT p.username, uc.character_id
       FROM players p
       LEFT JOIN user_characters uc ON uc.user_id = p.id
       WHERE p.telegram_id = $1
       ORDER BY uc.created_at DESC NULLS LAST
       LIMIT 1`,
      [telegramId]
    );

    const row = profileRes.rowCount > 0 ? profileRes.rows[0] : null;
    res.json({
      ok: true,
      id: telegramId,
      username: row && row.username ? row.username : username,
      charId: row ? row.character_id ?? null : null,
      sync,
    });
  } catch (e) {
    console.error('API /api/sync-user error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Return basic public user info (username + avatar URL) for Telegram user id
app.get('/api/user/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const hintedUsername = req.query && req.query.username
      ? String(req.query.username)
      : null;
    const hintedCharId = req.query && req.query.charId
      ? String(req.query.charId)
      : null;

    let username = hintedUsername;
    let avatar = null;

    // Try to get chat/profile info from Telegram, but do not fail endpoint if unavailable.
    try {
      const chat = await bot.getChat(userId);
      if (!username && chat) {
        username = chat.username || chat.first_name || null;
      }

      try {
        const photos = await bot.getUserProfilePhotos(userId, { limit: 1 });
        if (photos && photos.total_count > 0 && photos.photos && photos.photos[0] && photos.photos[0][0]) {
          const fileId = photos.photos[0][0].file_id;
          const file = await bot.getFile(fileId);
          if (file && file.file_path) {
            avatar = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${file.file_path}`;
          }
        }
      } catch (e) {
        // ignore profile photo errors
      }
    } catch (e) {
      console.warn('Telegram getChat failed for user', userId, e.message);
    }

    // Always ensure player exists in DB, even if Telegram API is unavailable.
    await registerPlayer(String(userId), username || `player_${userId}`);

    // Optional char sync when frontend sends local selected char.
    if (hintedCharId) {
      await ensureUserCharacterByTelegramId(String(userId), hintedCharId, 'human');
    }

    // Checking if user has a character in our DB
    let charId = null;
    try {
      const charRes = await pool.query(
        'SELECT p.username, uc.character_id FROM players p LEFT JOIN user_characters uc ON p.id = uc.user_id WHERE p.telegram_id = $1 ORDER BY uc.created_at DESC NULLS LAST LIMIT 1',
        [String(userId)]
      );
      if (charRes.rowCount > 0) {
        if (!username) username = charRes.rows[0].username || null;
        charId = charRes.rows[0].character_id;
      }
    } catch (e) { }

    res.json({ ok: true, id: userId, username, avatar, charId });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

async function runMigrations() {
  // Read migrations.sql
  const sql = fs.readFileSync(__dirname + '/server/migrations.sql', 'utf8');
  // Разделить на отдельные команды
  const statements = sql.split(/;\s*\n/).filter(s => s.trim());
  for (const stmt of statements) {
    let safeStmt = stmt.trim();
    if (/CREATE TABLE\s+(?!IF NOT EXISTS)/i.test(safeStmt)) {
      safeStmt = safeStmt.replace(/CREATE TABLE\s+/i, "CREATE TABLE IF NOT EXISTS ");
    }
    try {
      await pool.query(safeStmt);
    } catch (e) {
      console.error('Migration error:', e.message, '\nSQL:', safeStmt);
    }
  }
  console.log('Database migrations applied');
}

// Добавить запись пользователя в players при первом входе
async function registerPlayer(telegram_id, username) {
  try {
    const res = await pool.query(
      `INSERT INTO players (telegram_id, username)
       VALUES ($1, $2)
       ON CONFLICT (telegram_id)
       DO UPDATE SET username = CASE
         WHEN EXCLUDED.username IS NULL OR EXCLUDED.username = '' THEN players.username
         ELSE EXCLUDED.username
       END
       RETURNING id`,
      [telegram_id, username]
    );
    return res.rows[0]?.id;
  } catch (e) {
    console.error('DB registerPlayer error:', e.message);
    return null;
  }
}

async function ensureUserCharacterForUserId(user_id, character_id, faction) {
  try {
    const existing = await pool.query(
      'SELECT id, character_id FROM user_characters WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
      [user_id]
    );

    if (existing.rowCount === 0) {
      await addUserCharacter(user_id, character_id, faction);
      return { created: true, updated: false };
    }

    const row = existing.rows[0];
    if (row.character_id !== character_id) {
      await pool.query(
        'UPDATE user_characters SET character_id = $1, faction = $2 WHERE id = $3',
        [character_id, faction, row.id]
      );
      return { created: false, updated: true };
    }

    return { created: false, updated: false };
  } catch (e) {
    console.error('DB ensureUserCharacterForUserId error:', e.message);
    return { created: false, updated: false };
  }
}

async function ensureUserCharacterByTelegramId(telegram_id, character_id, faction) {
  try {
    if (!character_id) return null;
    const userRes = await pool.query('SELECT id FROM players WHERE telegram_id = $1 LIMIT 1', [telegram_id]);
    if (userRes.rowCount === 0) return null;
    return await ensureUserCharacterForUserId(userRes.rows[0].id, character_id, faction);
  } catch (e) {
    console.error('DB ensureUserCharacterByTelegramId error:', e.message);
    return null;
  }
}

// Добавить запись персонажа для пользователя
async function addUserCharacter(user_id, character_id, faction) {
  try {
    await pool.query(
      'INSERT INTO user_characters (user_id, character_id, faction) VALUES ($1, $2, $3)',
      [user_id, character_id, faction]
    );
  } catch (e) {
    console.error('DB addUserCharacter error:', e.message);
  }
}


// Проверка и вывод переменных окружения для диагностики
console.log('ENV TELEGRAM_TOKEN:', process.env.TELEGRAM_TOKEN);
console.log('ENV WEBHOOK_URL:', process.env.WEBHOOK_URL);
console.log('ENV BASE_URL:', process.env.BASE_URL);
console.log('ENV SERVER_URL:', process.env.SERVER_URL);
console.log('ENV DATABASE_URL:', process.env.DATABASE_URL);

runMigrations();
