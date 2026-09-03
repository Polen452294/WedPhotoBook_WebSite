# DNS для собственной почты fotobooktest24.ru

Проверено 3 сентября 2026 года. Письма отправляются собственным Postfix на VPS,
без стороннего почтового сервиса. OpenDKIM подписывает письма, но проверка
подписи у получателя невозможна, пока публичный ключ не опубликован в DNS.

DNS обслуживают серверы AdminVPS. Эти записи нужно добавить в панели управления
доменом, а не в файлы сайта или локальную DNS-конфигурацию VPS.

## 1. DKIM — добавить TXT

- Имя: `mail._domainkey` (полное имя: `mail._domainkey.fotobooktest24.ru`).
- Тип: `TXT`.
- TTL: `3600` или значение по умолчанию.
- Значение — одна строка, без внешних кавычек и переносов:

```text
v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtAzu3V5Ngb46YffGcIosGyGBoWk5LZzYeKImkyqg7TMGDNKYr6spF9rwtVJ5dsYdaQAseuFELVtmdCxeywWkEvNAAArM4WTf1E9vDYcDgKAf1Vzaei8moD9p9j+Xp+HhY+iwpD7R+oAQ9xyUU4MF6iit+ce95r3ef+O5Droo49axjzQNxOton3iLE9ZoVPntalocMH3rpBh+f8XsCUaqoWwNVMMQ7EZeTPGDflOR3XOLcahXC3CJD9Pk6mjIPTTBGbNkCm2EDMaOTvQia2HUwvefwwlKQR4S3hw1h8snkVmtRSPtnoiH8ebsrU3Y2Fj1DXi/1r4PwsprHgGsk0E9xwIDAQAB
```

Это **публичный** ключ из `/etc/opendkim/keys/fotobooktest24.ru/mail.txt`.
Приватный ключ нельзя копировать в панель DNS, репозиторий или переписку.
Если панель сама добавляет домен, указывайте короткое имя `mail._domainkey`,
чтобы домен не продублировался. Панель может автоматически разбить длинную TXT
запись на несколько строк в кавычках — важно, чтобы они были частями одной записи.

## 2. DMARC — добавить TXT

- Имя: `_dmarc` (полное имя: `_dmarc.fotobooktest24.ru`).
- Тип: `TXT`.
- Значение: `v=DMARC1; p=none; adkim=r; aspf=r`.

Начальная политика `p=none` не требует отклонять письма при ошибке проверки.
Более строгую политику следует включать только после проверки всех легитимных
отправителей домена. Сама по себе эта запись не гарантирует попадание во «Входящие».

## 3. PTR — настроить у провайдера IP

В настройках VPS / Reverse DNS или через поддержку AdminVPS:

```text
138.16.227.234 → mail.fotobooktest24.ru
```

PTR не добавляется в обычную DNS-зону домена. Прямой A-адрес `mail.fotobooktest24.ru`
уже указывает на `138.16.227.234`, а имя Postfix/HELO — `mail.fotobooktest24.ru`.

## Существующие записи — сохранить

На момент проверки уже опубликованы:

| Имя | Тип | Значение |
| --- | --- | --- |
| `mail` | A | `138.16.227.234` |
| `@` | MX | `10 mail.fotobooktest24.ru.` |
| `@` | TXT (SPF) | `v=spf1 ip4:138.16.227.234 a mx ~all` |

Не создавайте вторую SPF-запись. Эти настройки относятся к отправке уведомлений
сайта; MX домена не определяет адрес получателя заказов. Получатель задаётся
серверной переменной `CONTACT_TO_EMAIL`.

## Проверка после обновления DNS

На VPS:

```bash
dig +short TXT mail._domainkey.fotobooktest24.ru @1.1.1.1
dig +short TXT _dmarc.fotobooktest24.ru @8.8.8.8
dig +short -x 138.16.227.234 @8.8.8.8
opendkim-testkey -d fotobooktest24.ru -s mail -vvv
postqueue -p
```

После появления записей отправить одну тестовую заявку через сайт и проверить:

1. Заявка сохранена в админке и не продублирована.
2. Postfix получил от сервера получателя ответ SMTP `250` / `status=sent`.
3. В исходных заголовках полученного письма: `spf=pass`, `dkim=pass`, `dmarc=pass`.
4. Папку назначения проверить в самом почтовом ящике: SMTP `250` не подтверждает
   попадание во «Входящие». Даже корректные DNS-записи не отменяют репутационные
   и содержательные фильтры получателя.

Справка Яндекса: [проверка подлинности отправителей](https://yandex.ru/support/yandex-360/customers/mail/ru/web/security/security-technologies).
