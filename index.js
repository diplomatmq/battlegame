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

let waitingPlayer = null;

io.on('connection', (socket) => {
  socket.on('play', () => {
    if (waitingPlayer) {
      io.to(waitingPlayer).emit('startGame', { opponent: socket.id });
      socket.emit('startGame', { opponent: waitingPlayer });
      waitingPlayer = null;
    } else {
      waitingPlayer = socket.id;
      socket.emit('waiting');
    }
  });
});

bot.on('message', (msg) => {
  const base = process.env.WEB_APP_BASE_URL || process.env.WEBHOOK_URL || process.env.BASE_URL || 'https://battlerealme.monkeysdynasty.website';
  const safeBase = base.replace(/\/$/, '');
  if (msg.text === '/start' && msg.chat && msg.chat.type === 'private') {
    const userId = msg.from && (msg.from.id || msg.from.user_id) ? (msg.from.id || msg.from.user_id) : null;
    const url = userId ? `${safeBase}/menu.html?tg=${userId}` : `${safeBase}/menu.html`;
    bot.sendMessage(msg.chat.id, 'Открой меню игры:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Открыть меню', web_app: { url } }]
        ]
      }
    }).catch(() => {});
  } else {
    bot.sendMessage(msg.chat.id, 'Добро пожаловать в игру!').catch(() => {});
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

    const username = (chat && (chat.username || chat.first_name)) || null;
    res.json({ ok: true, id: userId, username, avatar });
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
  // Replace CREATE TABLE with CREATE TABLE IF NOT EXISTS
  const safeSql = sql.replace(/CREATE TABLE /g, 'CREATE TABLE IF NOT EXISTS ');
  try {
    await pool.query(safeSql);
    console.log('Database migrations applied');
  } catch (e) {
    console.error('Migration error:', e.message);
  }
}

runMigrations();
