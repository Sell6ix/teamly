# Teamly

**English:** Teamly is a browse-first web app for putting together game parties. Browse a catalog of games and lobbies, share a `/join` link, find people to play with and keep a block list. The UI is available in English and Russian with a light/dark theme. Built with Next.js, React, Auth.js (Discord OAuth plus a demo login), SQLite via Drizzle and an optional Discord bot (`/lfg`, `/party`, voice channels). Setup instructions below (in Russian): copy `.env.example` to `.env.local`, run `npm install`, then `npm run dev` and open <http://127.0.0.1:4317>.

---

Browse-first веб-приложение для сбора пати: каталог игр, лобби, шарящиеся `/join`, поиск людей, чёрный список. UI: **RU + EN** (переключатель в шапке, выбор в `localStorage`).

Данные пати / looking / профили авторизованных пользователей живут в **SQLite**. Auth — **Auth.js** (Discord OAuth + демо-вход). Discord — **бот** (`npm run bot`) и/или webhook в профиле.

Тебе остаются только переменные в `.env.local` (см. `.env.example`).

## Env

```bash
cp .env.example .env.local
# заполни AUTH_SECRET, Discord OAuth и/или bot token
```

| Переменная | Зачем |
|---|---|
| `AUTH_SECRET` | Секрет сессий Auth.js (`openssl rand -base64 32`) |
| `AUTH_URL` | Публичный URL приложения |
| `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` | Discord OAuth (redirect `{AUTH_URL}/api/auth/callback/discord`) |
| `DATABASE_URL` | Путь к SQLite, по умолчанию `file:./data/teamly.db` |
| `DISCORD_BOT_TOKEN` | Токен бота |
| `DISCORD_LFG_CHANNEL_ID` | Канал для брифов и `/lfg` |
| `DISCORD_GUILD_ID` | Опционально для slash; **обязателен** для кнопки «Войс» в трее |
| `DISCORD_VOICE_CATEGORY_ID` | Опционально — категория для voice-каналов пати |
| `APP_URL` | Ссылки в сообщениях бота |

Без Discord OAuth работает **демо-вход** на `/login` (пишет пользователя в SQLite). Без бота подтверждение пати копирует бриф; с ботом — ещё постит в канал. Кнопка **Войс** в трее создаёт Discord voice-канал + invite на код `/join` (не WebRTC); без `DISCORD_BOT_TOKEN` + `DISCORD_GUILD_ID` кнопка disabled с подсказкой.

## Запуск

```bash
npm install
npm run dev          # http://127.0.0.1:4317
npm run bot          # отдельный процесс Discord-бота
npm test
npm run build
```

## Экраны

- `/` — каталог (`/?type=party&q=…`)
- `/login` — Discord OAuth или демо-вход
- `/g/{game}/{style}` — лобби
- `/party/{id}`, `/join/{code}` — сборы
- `/people`, `/people/{personId}` — каталог людей + чёрный список

В трее: **Я ищу**, **Открыть сбор**, подтверждение с брифом (clipboard + Discord), сворачиваемый **чат пати** (SQLite по коду `/join`), **Войс** (Discord invite на канал пати).

Язык интерфейса: `RU` / `EN` в шапке и в профиле (`teamly-ui-locale`). Тема: светлая / тёмная. В лобби — **Сбросить фильтры** (и `Esc`).

## Архитектура

- `src/db` — Drizzle + better-sqlite3
- `src/auth.ts` — Auth.js
- `src/lib/party-store.ts` — join / published / looking в БД
- `bot/index.ts` — slash `/lfg`, `/party`
- `POST /api/discord-notify` — webhook пользователя или Bot API в канал
