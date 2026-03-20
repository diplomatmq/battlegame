// telegram.ts — пример интеграции с Telegram API
// Для полноценной работы используйте серверный index.js
export function sendTelegramMessage(chatId, text) {
    // Здесь клиент только вызывает сервер через fetch
    fetch("/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, text })
    });
}
