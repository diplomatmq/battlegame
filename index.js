const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const telegramToken = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(telegramToken, { polling: true });

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
  if (msg.text === '/start' && msg.chat.type === 'private') {
    bot.sendMessage(msg.chat.id, 'Открой игру:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Открыть игру', web_app: { url: 'https://battlerealme.monkeysdynasty.website/game.html' } }]
        ]
      }
    });
  } else {
    bot.sendMessage(msg.chat.id, 'Добро пожаловать в игру!');
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
