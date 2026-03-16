# Онлайн игра с Telegram-ботом

## Структура
- `server/` — backend (Express, WebSocket, Telegram-бот, PostgreSQL)
- `src/` — клиентская логика (TypeScript)
- `*.html` — клиентские страницы

## Запуск сервера
1. Перейдите в папку `server`:
   ```
   cd server
   ```
2. Установите зависимости:
   ```
   npm install
   ```
3. Создайте файл `.env` на основе `.env.example` и укажите свои данные.
4. Запустите сервер:
   ```
   npm start
   ```

## Миграции PostgreSQL
Выполните SQL из `server/migrations.sql` для создания таблиц.

## Telegram-бот
Добавьте токен в `.env` и настройте логику в `index.js`.

## Клиент
Подключите Socket.IO к серверу для онлайн игры.

## Загрузка на GitHub
Добавьте все файлы и папки, затем выполните:
```
git init
git add .
git commit -m "Initial commit"
git remote add origin <ваш_репозиторий>
git push -u origin master
```
