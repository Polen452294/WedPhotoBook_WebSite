# WedFotoBook

Production-сайт фотокниг на Next.js App Router. Приложение запускается как обычный
Node.js-процесс на VPS, хранит данные в локальном SQLite и не требует внешней edge/CDN-платформы.

## Требования

- Node.js `>=22.13.0`;
- npm;
- Linux VPS с reverse proxy и HTTPS для production.

## Локальный запуск

```bash
npm ci
cp .env.example .env.local
npm run db:migrate
npm run dev
```

На Windows скопируйте `.env.example` в `.env.local` через PowerShell. Файл с секретами и локальная база `.data/`
исключены из Git.

## Хранение и заявки

- `db/schema.ts` описывает заявки, аналитику, изменения контента и журнал защиты.
- `drizzle/` содержит последовательные SQLite-миграции.
- Каждая принятая форма сначала сохраняется в SQLite, после чего локальный шлюз передаёт письмо в
  Postfix/OpenDKIM на том же VPS.
- Внешний email API не используется. Формы защищены honeypot-полем, минимальным временем заполнения,
  валидацией и серверным rate limit.

## Команды

- `npm run lint` — ESLint;
- `npm run build` — production-сборка Next.js;
- `npm test` — сборка и интеграционные тесты;
- `npm run db:migrate` — применить SQLite-миграции;
- `npm run start:vps` — проверить конфигурацию, базу и запустить Next.js на `127.0.0.1:3000`;
- `npm run setup:local-mailer` — установить собственную почтовую цепочку на Ubuntu VPS;
- `npm run check:assets -- --base-url=https://DOMAIN` — проверить все публичные маршруты и ресурсы.

Архитектура описана в [`docs/architecture.md`](docs/architecture.md), а production-запуск — в [`docs/deploy.md`](docs/deploy.md).
