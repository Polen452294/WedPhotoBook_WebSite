# Production-запуск WedFotoBook на VPS

## Схема

nginx завершает HTTPS и проксирует запросы на Next.js, слушающий только `127.0.0.1:3000`.
Приложение работает как Node.js-процесс под PM2. SQLite-файл лежит в постоянном каталоге
вне checkout, например `/var/lib/wedfotobook/wedfotobook.sqlite3`.

## Переменные

В `.env.local` нужно задать:

- `DATABASE_PATH` — абсолютный путь к SQLite;
- `CONTACT_MAILER_URL=http://127.0.0.1:3081/send` и длинный `CONTACT_MAILER_TOKEN`;
- `CONTACT_TO_EMAIL` и `CONTACT_FROM_EMAIL`;
- `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, `ADMIN_LOGIN_SALT`, `ADMIN_AUDIT_SALT`;
- `RATE_LIMIT_SALT`;
- `TRUST_PROXY_ORIGIN=1` только если nginx всегда перезаписывает `Host`, `X-Forwarded-Host` и `X-Forwarded-Proto`.

Реальные секреты нельзя печатать в логи или хранить в Git. Файл `.env.local` должен иметь права `600`.

## Сборка и запуск

```bash
npm ci
npm run lint
npm run build
npm run check:contact-config
npm run db:migrate
pm2 start npm --name website -- run start:vps
pm2 save
```

При обновлении:

```bash
npm ci
npm run lint
npm run build
npm run check:contact-config
npm run db:migrate
pm2 restart website --update-env
pm2 save
```

`start:vps` сам повторно проверяет конфигурацию, применяет миграции и запускает готовую сборку.

## Собственная почта

На Ubuntu один раз выполните:

```bash
sudo npm run setup:local-mailer
```

Установщик создаёт отдельного непривилегированного пользователя, loopback-only службу,
Postfix, OpenDKIM и случайный токен. Приложение не может передать токен на внешний адрес.

Для доставляемости нужны DNS-записи SPF, DKIM и DMARC, а также PTR IP-адреса на `mail.fotobooktest24.ru`.
Статус `notification_status=sent` означает, что Postfix принял письмо. Окончательную доставку проверяют по
`postqueue -p`, журналу Postfix и фактическому появлению письма у получателя.

## Reverse proxy

Порт 3000 не публикуется во внешнюю сеть. nginx должен:

- перенаправлять HTTP на HTTPS;
- передавать исходный `Host` и перезаписывать forwarded-заголовки;
- не кешировать `/admin/` и `/api/`;
- ограничивать тело API-запросов;
- не писать в логи тела запросов, cookies и авторизационные заголовки.

## Проверка после запуска

```bash
npm run check:assets -- --base-url=https://fotobooktest24.ru --report=tmp/assets-live.json
curl -sSI https://fotobooktest24.ru/
curl -sSI https://fotobooktest24.ru/admin/
curl -sS -o /dev/null -w 'TTFB: %{time_starttransfer}s Total: %{time_total}s\n' https://fotobooktest24.ru/
postqueue -p
```

Дополнительно проверьте вход в `/admin/`, создание заявки, её запись в SQLite и почтовый ответ
получающего сервера. Перед каждым релизом создавайте резервную копию SQLite и проверяйте число ключевых
записей до переключения.
