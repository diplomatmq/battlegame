// Express server with WebSocket and Telegram bot integration
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// PostgreSQL connection
const pool = new Pool({
  user: 'your_user',
  host: 'localhost',
  database: 'your_db',
  password: 'your_password',
  port: 5432,
});

// Telegram bot setup
const telegramToken = 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(telegramToken, { polling: true });

// Player matchmaking
let waitingPlayer = null;

io.on('connection', (socket) => {
  socket.on('play', () => {
    if (waitingPlayer) {
      // Start game for both players
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
  // Placeholder for Telegram bot logic
  bot.sendMessage(msg.chat.id, 'Добро пожаловать в игру!');
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
