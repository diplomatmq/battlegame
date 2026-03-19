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

io.on('connection', (socket) => {
  let currentProfile = null;

  socket.on('play', (profile) => {
    currentProfile = profile; // { name, avatar, charType, stats }
    if (waitingPlayer && waitingPlayer.id !== socket.id) {
      const oppSocket = waitingPlayer;
      const seed = Math.floor(Math.random() * 1000000); // shared seed for match
      
      // Notify both players
      io.to(oppSocket.id).emit('startGame', { 
        opponent: socket.id, 
        profile: currentProfile,
        seed
      });
      socket.emit('startGame', { 
        opponent: oppSocket.id, 
        profile: oppSocket.profile,
        seed
      });
      
      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      waitingPlayer.profile = profile;
      socket.emit('waiting');
    }
  });

  socket.on('disconnect', () => {
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
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

    const targetPage = hasCharacter ? 'index.html' : 'character.html';
    const url = userId ? `${safeBase}/${targetPage}?tg=${userId}` : `${safeBase}/${targetPage}`;
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

app.get('/', (req, res) => {
  res.send('Game server is running');
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
    
    // Проверяем, есть ли уже персонаж
    const checkRes = await pool.query('SELECT id FROM user_characters WHERE user_id = $1', [userId]);
    if (checkRes.rowCount > 0) {
      // Уже есть
      return res.json({ ok: true, message: 'Character already selected' });
    }
    
    await addUserCharacter(userId, character_id, faction || 'human');
    res.json({ ok: true });
  } catch (e) {
    console.error('API /api/character error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Return basic public user info (username + avatar URL) for Telegram user id
app.get('/api/user/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    // Try to get chat (username/first_name)
    const chat = await bot.getChat(userId);

    // Try to retrieve profile photo (first available)
    let avatar = null;
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

    // Checking if user has a character in our DB
    let charId = null;
    try {
      const charRes = await pool.query(
        'SELECT character_id FROM user_characters uc JOIN players p ON p.id = uc.user_id WHERE p.telegram_id = $1 LIMIT 1',
        [String(userId)]
      );
      if (charRes.rowCount > 0) {
        charId = charRes.rows[0].character_id;
      }
    } catch (e) { }

    const username = (chat && (chat.username || chat.first_name)) || null;
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
    if (safeStmt.startsWith('CREATE TABLE') && !safeStmt.includes('IF NOT EXISTS')) {
      safeStmt = safeStmt.replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS');
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
      'INSERT INTO players (telegram_id, username) VALUES ($1, $2) ON CONFLICT (telegram_id) DO NOTHING RETURNING id',
      [telegram_id, username]
    );
    return res.rows[0]?.id;
  } catch (e) {
    console.error('DB registerPlayer error:', e.message);
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
