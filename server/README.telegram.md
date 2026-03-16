# Telegram интеграция

- Для отправки сообщений из клиента используйте функцию sendTelegramMessage(chatId, text) из src/telegram.ts
- Серверный эндпоинт /telegram принимает POST-запросы и отправляет сообщения через Telegram-бота
- Для полноценной работы используйте серверный index.js и настройте TELEGRAM_TOKEN в .env
