# Безопасный запуск WedFotoBook

## Рекомендуемый production: Cloudflare Sites

Проект рассчитан на Cloudflare Workers/Sites и D1. Это основной production-вариант: база D1, миграции из `drizzle/` и HTTPS управляются платформой. Админ-панель использует собственную страницу входа `/admin/login/` с одним полем «Пароль» и не запрашивает логин.

Перед публикацией:

```bash
npm ci
npm run lint
npm run build
```

В настройках runtime-переменных Sites задайте:

- `ADMIN_PASSWORD_HASH` — PBKDF2-хеш единственного пароля, а не сам пароль;
- `ADMIN_SESSION_SECRET` — отдельная случайная строка минимум 32 байта для подписи сессии;
- `ADMIN_LOGIN_SALT` — ещё одна независимая случайная строка минимум 32 байта для ограничения попыток входа;
- `ADMIN_DISPLAY_NAME` и `ADMIN_ACCOUNT_EMAIL` — необязательные внутренние значения для журнала; на странице входа они не показываются и не запрашиваются;
- `ADMIN_EMAILS` — необязательный резервный allowlist для Sign in with ChatGPT на Cloudflare Sites;
- `ADMIN_AUDIT_SALT` — отдельная криптографически случайная строка минимум 32 байта;
- `RATE_LIMIT_SALT` — другая случайная строка минимум 32 байта;
- `TRUST_PROXY_ORIGIN=1` — только на VPS за доверенным reverse proxy, который всегда перезаписывает `Host`, `X-Forwarded-Host` и `X-Forwarded-Proto`; для Sites оставьте `0`;
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` и `TURNSTILE_SECRET_KEY` — ключи одного Turnstile-виджета;
- `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` — если нужны почтовые уведомления.

Безопасно создать хеш пароля в Linux, не передавая пароль аргументом команды:

```bash
umask 077
read -rsp 'Новый пароль администратора: ' ADMIN_PASSWORD_INPUT && echo
printf '%s' "$ADMIN_PASSWORD_INPUT" > .admin-password.tmp
unset ADMIN_PASSWORD_INPUT
node scripts/hash-admin-password.mjs .admin-password.tmp
rm -f .admin-password.tmp
openssl rand -base64 48  # ADMIN_SESSION_SECRET
openssl rand -base64 48  # ADMIN_LOGIN_SALT
openssl rand -base64 48  # ADMIN_AUDIT_SALT
```

Скопируйте полученный хеш и три независимых секрета в защищённые runtime-переменные. Не добавляйте реальные значения в `.env.example`, Git, логи или команды CI. Смена `ADMIN_SESSION_SECRET` немедленно завершает все старые сеансы.

Миграции D1 находятся в `drizzle/` и должны применяться средой публикации до переключения трафика. Не запускайте `wrangler deploy` из текущего checkout: сгенерированный `dist/server/wrangler.json` содержит шаблонный D1 ID, а не production-базу.

## Локальная проверка перед публикацией

Linux/macOS:

```bash
npm ci
cp .env.example .env.local
chmod 600 .env.local
npm run db:local
npm run dev
```

Windows PowerShell:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run db:local
npm run dev
```

Заполните `.env.local` перед запуском. Файл уже исключён из Git. Cookie панели всегда имеет атрибут `Secure`, поэтому полноценный вход проверяйте через HTTPS.

## Запуск собранной версии на одном сервере

Этот режим подходит для закрытого стенда. Локальная D1-эмуляция не заменяет production D1 и не предназначена для отказоустойчивого публичного размещения.

```bash
npm ci
cp .env.example .env.local
chmod 600 .env.local
npm run db:local
npm run lint
npm run build
npm run start:vps
```

Перед портом 3000 обязателен reverse proxy с HTTPS (Caddy, nginx или балансировщик). Не публикуйте порт напрямую. Прокси должен:

- принимать только HTTPS и перенаправлять HTTP на HTTPS;
- передавать исходный `Host`;
- всегда перезаписывать `X-Forwarded-Host` и `X-Forwarded-Proto`, если включён `TRUST_PROXY_ORIGIN=1`;
- всегда удалять входящие `oai-authenticated-user-*` от клиентов, если эти заголовки не устанавливает доверенный upstream;
- ограничивать размер тела запроса до 64 КБ для `/api/admin/` и до 8 КБ для `/api/analytics`;
- не кешировать `/admin/`, `/api/` и маршруты входа;
- писать access-логи без тел запросов, cookies, токенов и авторизационных заголовков.

`start:vps` запускает локальный Cloudflare Worker runtime, потому что обычный Node-процесс `vinext start` не предоставляет D1 binding. Этот режим предназначен для отдельного тестового VPS; для основного production используйте Cloudflare Sites.

## Проверка после запуска

```bash
curl -I https://YOUR_DOMAIN/admin/
curl -sS -o /dev/null -w 'TTFB: %{time_starttransfer}s\nTotal: %{time_total}s\nSize: %{size_download} bytes\n' https://YOUR_DOMAIN/
curl -sSI https://YOUR_DOMAIN/ | grep -Ei 'content-security-policy|cache-control|cdn-cache-control'
curl -sS https://YOUR_DOMAIN/ | grep -o '<meta property="og:image"[^>]*>'
curl -sSI https://YOUR_DOMAIN/llms.txt | head -n 1
curl -sSI https://YOUR_DOMAIN/.well-known/agents.json | head -n 1
curl -sS https://YOUR_DOMAIN/robots.txt | grep -E 'GPTBot|ClaudeBot|Google-Extended'
curl -i -X PATCH https://YOUR_DOMAIN/api/admin/content \
  -H 'Origin: https://evil.example' \
  -H 'Content-Type: application/json' \
  --data '{}'
```

`og:image` находится в HTML, поэтому его проверяют через обычный GET, а не через `curl -I`. TTFB измеряется параметром `time_starttransfer`; стандартный HTTP-заголовок `time` сервер не возвращает.

Первый ответ должен содержать `Cache-Control: private, no-store`, `X-Frame-Options: DENY` и `Content-Security-Policy`. Второй запрос должен получить `403` и не должен содержать `Access-Control-Allow-Origin`.

Дополнительно проверьте:

- без сессии `/admin/` перенаправляет на `/admin/login/`;
- на странице входа есть только поле пароля, а шестая неверная попытка с одного адреса за 15 минут получает `429`;
- в `/admin/security/` появляется запись после тестового изменения текста;
- возврат исходного текста также попадает в журнал;
- резервное копирование и восстановление production D1 проверены на отдельной базе.
