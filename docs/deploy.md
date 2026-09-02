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
- `CONTACT_MAILER_URL=http://127.0.0.1:3081/send`, `CONTACT_MAILER_TOKEN`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` — VPS-конфигурация собственной отправки через Postfix. URL намеренно ограничен loopback-интерфейсом.
- `RESEND_API_KEY` — необязательный резервный транспорт для Cloudflare Sites, где локальный Postfix недоступен.

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

Проверьте доставку заявок до запуска собранной версии:

```bash
npm run check:contact-config
```

Проверка не выводит секреты и завершает запуск с ошибкой, если не настроен ни локальный mailer, ни резервный Resend, либо некорректны адреса. Сама заявка сначала сохраняется в базе и доступна в `/admin/zayavki/`; почтовое уведомление отправляется после сохранения.

### Собственная почтовая доставка на VPS

На Ubuntu-сервере установите loopback-шлюз, Postfix и OpenDKIM:

```bash
sudo npm run setup:local-mailer
```

Установщик:

- создаёт отдельного пользователя `wedfotomailer` и systemd-сервис, слушающий только `127.0.0.1:3081`;
- генерирует отдельный токен и сохраняет его в root-only файле `/etc/wedfotobook-mailer.env` и `.env.local`, не печатая значение;
- настраивает исходящий Postfix без публичного SMTP-релея;
- генерирует DKIM-ключ и выводит только публичную TXT-запись.

Для доставляемости обязательно опубликуйте выведенную DKIM-запись, TXT `_dmarc.fotobooktest24.ru` и закажите у владельца IP обратную DNS-запись `138.16.227.234 -> mail.fotobooktest24.ru`. SPF домена должен разрешать `138.16.227.234`. Приватный DKIM-ключ остаётся только в `/etc/opendkim/keys/`.

После установки пересоберите и перезапустите приложение:

```bash
npm run check:contact-config
npm run lint
npm run build
pm2 restart website --update-env
pm2 save
```

`notification_status=sent` означает, что локальный Postfix принял письмо в очередь. Окончательную доставку проверяйте по очереди `postqueue -p`, журналу Postfix и фактическому появлению письма у получателя.

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

### Изображения, иконки и полнота сборки

Статические файлы из `public/` необходимо переносить вместе с кодом, включая
`public/media/optimized/`. Не публикуйте только изменённые TSX-файлы: они могут
ссылаться на новые изображения, которых ещё нет на сервере.

После сборки, до переключения трафика:

```bash
npm run check:assets
```

Проверка обходит страницы из sitemap, проверяет `src`, все варианты `srcset`,
изображения галерей, иконки, стили и шрифты, а также сравнивает публичные медиафайлы
с `dist/client`. Она также автоматически выполняется при `start:vps` и прерывает
запуск неполной сборки. Не подменяйте текущую рабочую сборку до успешной проверки.

После публикации проверьте реальные HTTP-ответы:

```bash
npm run check:assets -- --base-url=https://YOUR_DOMAIN --report=tmp/assets-live.json
```

Ошибка `404` у изображения должна возвращать `Cache-Control: no-store`.
При восстановлении файлов, для которых браузеры уже закешировали ошибку, обновите
версию URL в `optimizedMediaUrl` (`lib/media-path.ts`), сохранив сами пути файлов.

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
