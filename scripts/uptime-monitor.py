"""Independent, bounded HTTP checks; persistent history; guarded PM2 recovery."""
import concurrent.futures
from datetime import datetime, timezone
from email.message import EmailMessage
from email.policy import SMTP
from email.utils import formatdate, parseaddr
import fcntl
import json
import os
from pathlib import Path
import sqlite3
import socket
import ssl
import subprocess
import time
import urllib.error
import urllib.request


def failure_kind(exception):
    reason = getattr(exception, "reason", exception)
    if isinstance(reason, socket.gaierror):
        return "dns"
    if isinstance(reason, ssl.SSLError):
        return "tls"
    if isinstance(reason, (TimeoutError, socket.timeout)):
        return "timeout"
    if isinstance(reason, ConnectionRefusedError):
        return "connection_refused"
    return type(exception).__name__


def probe(url, expected, timeout=6):
    started = time.monotonic()
    status = None
    try:
        request = urllib.request.Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "WedFotoBook-Uptime/1.0"})
        with urllib.request.urlopen(request, timeout=timeout) as response:
            status = response.status
            body = response.read(1_000_000).decode("utf-8", errors="replace")
            if status != 200 or expected not in body:
                raise ValueError("unexpected_response")
        error = None
    except Exception as exception:
        # Never publish response bodies, internal paths or credentials.
        status = getattr(exception, "code", status)
        error = failure_kind(exception)
    return {"ok": error is None, "http": status, "ms": round((time.monotonic() - started) * 1000), "error": error}


def probe_certificate(hostname, timeout=6):
    """Check the certificate actually served, including hostname, chain and expiry."""
    started = time.monotonic()
    expires_in_days = None
    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, 443), timeout=timeout) as connection:
            with context.wrap_socket(connection, server_hostname=hostname) as secured:
                expires = ssl.cert_time_to_seconds(secured.getpeercert()["notAfter"])
        remaining = expires - time.time()
        expires_in_days = int(remaining // 86400)
        error = "certificate_expiring" if remaining <= 14 * 86400 else None
    except Exception as exception:
        error = failure_kind(exception)
    return {"ok": error is None, "http": None, "ms": round((time.monotonic() - started) * 1000),
            "error": error, "expiresInDays": expires_in_days}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def probe_https_redirect(hostname, timeout=6):
    started = time.monotonic()
    status = None
    try:
        opener = urllib.request.build_opener(NoRedirect())
        request = urllib.request.Request(f"http://{hostname}/", method="HEAD")
        try:
            response = opener.open(request, timeout=timeout)
        except urllib.error.HTTPError as exception:
            response = exception
        with response:
            status = response.status
            error = None if status in (301, 308) and response.headers.get("Location") == "https://wedfotobook.ru/" else "https_redirect"
    except Exception as exception:
        error = failure_kind(exception)
    return {"ok": error is None, "http": status, "ms": round((time.monotonic() - started) * 1000), "error": error}


def recovery_needed(previous, local_ok, now):
    failures = 0 if local_ok else previous.get("failures", 0) + 1
    return failures, failures >= 3 and now - previous.get("last_restart", 0) >= 600


def recover(lock_path="/root/wedfotobook-update.lock"):
    with open(lock_path, "a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return "maintenance"
        try:
            result = subprocess.run(["/usr/bin/pm2", "restart", "website"], capture_output=True, timeout=35, check=False)
            return "restarted" if result.returncode == 0 else "restart_failed"
        except (OSError, subprocess.TimeoutExpired):
            return "restart_failed"


def diagnose(checks):
    """Describe observed evidence, without pretending it establishes every root cause."""
    local = checks["local"]
    if not local["ok"]:
        if local["error"] == "connection_refused":
            return "Приложение не принимает соединения на локальном порту: процесс остановлен или ещё запускается."
        if local["http"] == 503:
            return "Приложение отвечает, но не готово: возможен сбой чтения базы данных, запуск или завершение процесса."
        if local["error"] == "timeout":
            return "Локальное приложение не ответило вовремя: возможны зависание или перегрузка сервера."
        return "Не проходит локальная проверка приложения; точная причина требует серверных журналов."
    errors = {check["error"] for check in checks.values() if not check["ok"]}
    if "dns" in errors:
        return "Ошибка разрешения DNS с сервера мониторинга; локальное приложение работает."
    if "tls" in errors:
        return "Ошибка HTTPS/TLS при проверке сертификата или соединения; локальное приложение работает."
    if "certificate_expiring" in errors:
        return "До окончания сертификата HTTPS осталось не более 14 дней: проверьте продление Certbot и применение сертификата в nginx."
    if "https_redirect" in errors:
        return "HTTP-адрес сайта не перенаправляет на безопасный HTTPS-адрес: проверьте настройки nginx."
    if any(check["http"] in (502, 503, 504) for check in checks.values()):
        return "Внешний HTTP возвращает серверную ошибку; возможна проблема nginx или соединения с приложением."
    if not checks["javascript"]["ok"] and checks["homepage"]["ok"] and checks["health"]["ok"]:
        return "Не загружается или не проходит проверку JavaScript главной страницы."
    return "Внешняя проверка сайта не прошла, хотя локальное приложение работает: проверьте nginx, сеть и содержимое ответа."


def record_alert(database, previous, state, details):
    now = details["time"]
    state["incident_start"] = previous.get("incident_start", now) if not details["ok"] else None
    # Old state or a previous successful check may contain an explicit null.
    if not details["ok"] and state["incident_start"] is None:
        state["incident_start"] = now
    state["down_checks"] = 0 if details["ok"] else previous.get("down_checks", 0) + 1
    state["alerted"] = previous.get("alerted", False)
    if not details["ok"] and state["down_checks"] >= 2 and not state["alerted"]:
        state["alerted"] = True
        event = {**details, "kind": "down", "started": state["incident_start"]}
    elif details["ok"] and state["alerted"]:
        state["alerted"] = False
        event = {**details, "kind": "up", "started": previous["incident_start"]}
    else:
        return
    database.execute("INSERT OR IGNORE INTO outbox (id, payload) VALUES (?, ?)",
                     (f"{event['started']}-{event['kind']}", json.dumps(event)))


def send_alert(event_id, event):
    sender = os.environ.get("UPTIME_MAIL_FROM", "")
    recipient = os.environ.get("UPTIME_MAIL_TO", "")
    for address in (sender, recipient):
        if any(char in address for char in "\r\n") or "@" not in parseaddr(address)[1]:
            raise ValueError("Invalid monitor mail configuration")
    recovered = event["kind"] == "up"
    testing = event["kind"] == "test"
    errors = {check.get("error") for check in event["checks"].values() if not check["ok"]}
    message = EmailMessage()
    message["From"], message["To"] = sender, recipient
    if testing:
        message["Subject"] = "[WedFotoBook] Проверка уведомлений HTTPS"
    elif recovered:
        message["Subject"] = "[WedFotoBook] Сайт восстановлен"
    elif "certificate_expiring" in errors:
        message["Subject"] = "[WedFotoBook] Истекает сертификат HTTPS"
    elif errors.intersection({"tls", "https_redirect"}) or any(name.startswith(("tls:", "https-redirect:")) and not check["ok"] for name, check in event["checks"].items()):
        message["Subject"] = "[WedFotoBook] Ошибка HTTPS / сертификата"
    else:
        message["Subject"] = "[WedFotoBook] Обнаружен сбой сайта"
    message["Date"] = formatdate(usegmt=True)
    message["Message-ID"] = f"<uptime-{event_id}@{parseaddr(sender)[1].split('@')[1]}>"
    stamp = lambda value: datetime.fromtimestamp(value, timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    lines = ["Сайт: https://wedfotobook.ru/", f"Проверка: {stamp(event['time'])}"]
    if testing:
        lines.append("Это тестовое письмо для проверки уведомлений HTTPS. Реального сбоя не обнаружено.")
    else:
        lines.append(f"Первый сбой: {stamp(event['started'])}")
    if recovered:
        lines.append(f"Проверки снова проходят. Интервал до обнаружения восстановления: {event['time'] - event['started']} секунд.")
    elif not testing:
        lines.extend(["Сбой подтверждён двумя последовательными проверками.", "Диагностика: " + event["reason"]])
    for name, check in event["checks"].items():
        lines.append(f"{name}: {'OK' if check['ok'] else 'FAIL'}, HTTP {check['http']}, {check['ms']} мс, ошибка: {check['error'] or 'нет'}")
        if check.get("expiresInDays") is not None:
            lines.append(f"До окончания сертификата: {check['expiresInDays']} дней.")
    lines.extend([f"Автовосстановление в этой проверке: {event['action'] or 'не запускалось'}.",
                  "История: https://wedfotobook.ru/status/", "Причина основана на проверках; точный первоисточник может потребовать анализа журналов."])
    message.set_content("\n".join(lines), charset="utf-8")
    subprocess.run(["/usr/sbin/sendmail", "-i", "-f", parseaddr(sender)[1], "--", parseaddr(recipient)[1]],
                   input=message.as_bytes(policy=SMTP), capture_output=True, timeout=8, check=True)


def flush_alerts(directory):
    # Preserve old queued incidents without mailing them when alerts are first enabled.
    since = int(os.environ.get("UPTIME_MAIL_SINCE", "0"))
    with sqlite3.connect(directory / "history.sqlite3") as database:
        for event_id, payload in database.execute(
                "SELECT id, payload FROM outbox WHERE sent_at IS NULL "
                "AND coalesce(json_extract(payload, '$.time'), 0) >= ? ORDER BY rowid LIMIT 2", (since,)).fetchall():
            try:
                send_alert(event_id, json.loads(payload))
            except (ValueError, OSError, subprocess.SubprocessError) as exception:
                print(json.dumps({"mail": "retry_pending", "error": type(exception).__name__}), flush=True)
                break
            database.execute("UPDATE outbox SET sent_at=? WHERE id=?", (int(time.time()), event_id))
            database.commit()
            print(json.dumps({"mail": "queued", "event": event_id}), flush=True)


def run():
    directory = Path(os.environ.get("UPTIME_STATE_DIR", "/var/lib/wedfotobook-monitor"))
    directory.mkdir(parents=True, exist_ok=True)
    public = Path(os.environ.get("UPTIME_PUBLIC_DIR", "/var/www/wedfotobook-status"))
    public.mkdir(parents=True, exist_ok=True)
    targets = {
        "homepage": ("https://wedfotobook.ru/", "data-home-styles"),
        "health": ("https://wedfotobook.ru/api/health/", '"status":"ok"'),
        "javascript": ("https://wedfotobook.ru/wp-assets/home-interactions.js", "addEventListener"),
        "local": ("http://127.0.0.1:3000/api/health/", '"status":"ok"'),
    }
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = {key: executor.submit(probe, *target) for key, target in targets.items()}
        # Redirect hosts need valid TLS too: the handshake precedes any redirect.
        for hostname in ("wedfotobook.ru", "www.wedfotobook.ru", "fotobooktest24.ru", "www.fotobooktest24.ru"):
            futures[f"tls:{hostname}"] = executor.submit(probe_certificate, hostname)
            futures[f"https-redirect:{hostname}"] = executor.submit(probe_https_redirect, hostname)
        checks = {key: future.result() for key, future in futures.items()}
    now = int(time.time())
    with sqlite3.connect(directory / "history.sqlite3") as database:
        database.execute("CREATE TABLE IF NOT EXISTS checks (time INTEGER PRIMARY KEY, ok INTEGER NOT NULL, details TEXT NOT NULL)")
        database.execute("CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL)")
        database.execute("CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY, payload TEXT NOT NULL, sent_at INTEGER)")
        row = database.execute("SELECT data FROM state WHERE id=1").fetchone()
        previous = json.loads(row[0]) if row else {}
        failures, needed = recovery_needed(previous, checks["local"]["ok"], now)
        action = recover() if needed else None
        state = {"failures": failures, "last_restart": now if action in ("restarted", "restart_failed") else previous.get("last_restart", 0)}
        ok = all(check["ok"] for check in checks.values())
        details = {"time": now, "ok": ok, "checks": checks, "action": action, "reason": None if ok else diagnose(checks)}
        record_alert(database, previous, state, details)
        database.execute("INSERT OR REPLACE INTO checks VALUES (?, ?, ?)", (now, ok, json.dumps(details)))
        database.execute("INSERT OR REPLACE INTO state VALUES (1, ?)", (json.dumps(state),))
        database.execute("DELETE FROM checks WHERE time < ?", (now - 90 * 86400,))
        database.execute("DELETE FROM outbox WHERE sent_at < ?", (now - 90 * 86400,))
        recent = [json.loads(row[0]) for row in database.execute("SELECT details FROM checks ORDER BY time DESC LIMIT 1440")]
        summary = database.execute("SELECT count(*), coalesce(sum(ok),0) FROM checks WHERE time >= ?", (now - 86400,)).fetchone()
    payload = {"updated": now, "ok": ok, "sampleAvailability24h": round(100 * summary[1] / summary[0], 2), "samples24h": summary[0], "history": recent}
    temporary = public / "status.json.tmp"
    temporary.write_text(json.dumps(payload), encoding="utf-8")
    temporary.chmod(0o644)
    temporary.replace(public / "status.json")
    print(json.dumps(details), flush=True)
    flush_alerts(directory)


if __name__ == "__main__":
    run()
