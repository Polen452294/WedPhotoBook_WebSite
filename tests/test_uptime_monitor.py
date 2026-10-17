import importlib.util
from pathlib import Path
import unittest
import sqlite3
import tempfile
import json
from unittest.mock import patch, MagicMock

try:
    import fcntl  # noqa: F401 -- monitor targets the Linux VPS
except ImportError:
    raise unittest.SkipTest("The systemd monitor is tested on Linux")

spec = importlib.util.spec_from_file_location("monitor", Path(__file__).parents[1] / "scripts" / "uptime-monitor.py")
monitor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor)


class MonitorTest(unittest.TestCase):
    def test_http_must_redirect_permanently_to_canonical_https(self):
        response = MagicMock()
        response.__enter__.return_value = response
        opener = MagicMock()
        opener.open.return_value = response
        with patch.object(monitor.urllib.request, "build_opener", return_value=opener):
            for status, target, ok in [
                (301, "https://wedfotobook.ru/", True), (308, "https://wedfotobook.ru/", True),
                (200, None, False), (302, "https://wedfotobook.ru/", False),
                (301, "http://wedfotobook.ru/", False), (301, "https://unrelated.example/", False)]:
                response.status = status
                response.headers = {"Location": target}
                self.assertEqual(monitor.probe_https_redirect("www.wedfotobook.ru")["ok"], ok)
            opener.open.side_effect = monitor.urllib.error.HTTPError(
                "http://wedfotobook.ru/", 301, "Moved", {"Location": "https://wedfotobook.ru/"}, None)
            self.assertTrue(monitor.probe_https_redirect("wedfotobook.ru")["ok"])
            opener.open.side_effect = TimeoutError
            self.assertEqual(monitor.probe_https_redirect("wedfotobook.ru")["error"], "timeout")

    def test_served_certificate_expiry_and_hostname_validation(self):
        context = MagicMock()
        secured = context.wrap_socket.return_value.__enter__.return_value
        secured.getpeercert.return_value = {"notAfter": "Dec  2 14:34:09 2026 GMT"}
        expiry = monitor.ssl.cert_time_to_seconds("Dec  2 14:34:09 2026 GMT")
        with patch.object(monitor.ssl, "create_default_context", return_value=context), \
                patch.object(monitor.socket, "create_connection") as connect, \
                patch.object(monitor.time, "time", return_value=expiry - 30 * 86400):
            result = monitor.probe_certificate("www.wedfotobook.ru")
            self.assertTrue(result["ok"])
            self.assertEqual(result["expiresInDays"], 30)
            connect.assert_called_once_with(("www.wedfotobook.ru", 443), timeout=6)
            self.assertEqual(context.wrap_socket.call_args.kwargs["server_hostname"], "www.wedfotobook.ru")
            with patch.object(monitor.time, "time", return_value=expiry - 14 * 86400):
                self.assertEqual(monitor.probe_certificate("www.wedfotobook.ru")["error"], "certificate_expiring")
            context.wrap_socket.side_effect = monitor.ssl.SSLCertVerificationError("invalid certificate")
            self.assertEqual(monitor.probe_certificate("www.wedfotobook.ru")["error"], "tls")

    def test_certificate_connection_failures_are_not_healthy(self):
        with patch.object(monitor.socket, "create_connection", side_effect=TimeoutError):
            self.assertEqual(monitor.probe_certificate("wedfotobook.ru")["error"], "timeout")

    def test_expiring_certificate_is_diagnosed_without_app_failure(self):
        checks = {"local": {"ok": True}, "tls:wedfotobook.ru": {"ok": False, "error": "certificate_expiring"}}
        self.assertIn("14 дней", monitor.diagnose(checks))

    def test_recovery_requires_repeated_local_failure_and_cooldown(self):
        self.assertEqual(monitor.recovery_needed({}, False, 1000), (1, False))
        self.assertEqual(monitor.recovery_needed({"failures": 2}, False, 1000), (3, True))
        self.assertEqual(monitor.recovery_needed({"failures": 8, "last_restart": 950}, False, 1000), (9, False))
        self.assertEqual(monitor.recovery_needed({"failures": 2}, True, 1000), (0, False))

    def test_maintenance_prevents_restart(self):
        with patch("builtins.open", MagicMock()), patch.object(monitor.fcntl, "flock", side_effect=BlockingIOError), patch.object(monitor.subprocess, "run") as run:
            self.assertEqual(monitor.recover(), "maintenance")
            run.assert_not_called()

    def test_wrong_page_and_timeout_are_not_healthy(self):
        response = MagicMock()
        response.__enter__.return_value = response
        response.status = 200
        response.read.return_value = b"wrong page"
        with patch.object(monitor.urllib.request, "urlopen", return_value=response):
            self.assertFalse(monitor.probe("http://localhost/", "expected")["ok"])
        with patch.object(monitor.urllib.request, "urlopen", side_effect=TimeoutError):
            self.assertEqual(monitor.probe("http://localhost/", "expected")["error"], "timeout")

    def test_incident_is_confirmed_once_and_recovery_is_queued(self):
        database = sqlite3.connect(":memory:")
        self.addCleanup(database.close)
        database.execute("CREATE TABLE outbox (id TEXT PRIMARY KEY, payload TEXT, sent_at INTEGER)")
        state = {}
        for now, ok in [(1000, False), (1060, False), (1120, False), (1180, True), (1240, True)]:
            previous, state = state, {}
            monitor.record_alert(database, previous, state, {"time": now, "ok": ok})
        events = [json.loads(row[0]) for row in database.execute("SELECT payload FROM outbox ORDER BY rowid")]
        self.assertEqual([event["kind"] for event in events], ["down", "up"])
        self.assertEqual([event["started"] for event in events], [1000, 1000])
        self.assertFalse(state["alerted"])

    def test_single_failure_does_not_send_mail(self):
        database = MagicMock()
        state = {}
        monitor.record_alert(database, {}, state, {"time": 1000, "ok": False})
        monitor.record_alert(database, state, {}, {"time": 1060, "ok": True})
        database.execute.assert_not_called()

    def test_failed_delivery_is_persisted_and_retried_in_order(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            with sqlite3.connect(directory / "history.sqlite3") as database:
                database.execute("CREATE TABLE outbox (id TEXT PRIMARY KEY, payload TEXT, sent_at INTEGER)")
                database.executemany("INSERT INTO outbox VALUES (?, '{}', NULL)", [("down",), ("up",)])
            with patch.object(monitor, "send_alert", side_effect=OSError):
                monitor.flush_alerts(directory)
            with sqlite3.connect(directory / "history.sqlite3") as database:
                self.assertEqual(database.execute("SELECT count(*) FROM outbox WHERE sent_at IS NULL").fetchone()[0], 2)
            with patch.object(monitor, "send_alert") as send:
                monitor.flush_alerts(directory)
                self.assertEqual([call.args[0] for call in send.call_args_list], ["down", "up"])
                send.reset_mock()
                monitor.flush_alerts(directory)
                send.assert_not_called()

    def test_diagnosis_distinguishes_connection_and_readiness(self):
        checks = {name: {"ok": True, "error": None, "http": 200} for name in ("local", "health", "homepage", "javascript")}
        checks["local"] = {"ok": False, "error": "connection_refused", "http": None}
        self.assertIn("не принимает соединения", monitor.diagnose(checks))
        checks["local"] = {"ok": False, "error": "HTTPError", "http": 503}
        self.assertIn("возможен", monitor.diagnose(checks))

    def test_enablement_skips_historical_alerts_without_deleting_them(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            with sqlite3.connect(directory / "history.sqlite3") as database:
                database.execute("CREATE TABLE outbox (id TEXT PRIMARY KEY, payload TEXT, sent_at INTEGER)")
                database.executemany("INSERT INTO outbox VALUES (?, ?, NULL)", [
                    ("old", json.dumps({"time": 1000})), ("new", json.dumps({"time": 2000}))])
            with patch.dict(monitor.os.environ, {"UPTIME_MAIL_SINCE": "1500"}), patch.object(monitor, "send_alert") as send:
                monitor.flush_alerts(directory)
                self.assertEqual([call.args[0] for call in send.call_args_list], ["new"])
            with sqlite3.connect(directory / "history.sqlite3") as database:
                self.assertIsNone(database.execute("SELECT sent_at FROM outbox WHERE id='old'").fetchone()[0])
                self.assertIsNotNone(database.execute("SELECT sent_at FROM outbox WHERE id='new'").fetchone()[0])

    def test_tls_and_expiry_mail_subjects_and_test_message(self):
        from email import message_from_bytes
        event = {"kind": "down", "started": 1000, "time": 1060, "reason": "TLS", "action": None,
                 "checks": {"tls:wedfotobook.ru": {"ok": False, "http": None, "ms": 1, "error": "tls"}}}
        with patch.dict(monitor.os.environ, {"UPTIME_MAIL_FROM": "monitor@example.com", "UPTIME_MAIL_TO": "owner@example.com"}), patch.object(monitor.subprocess, "run") as send:
            for error, subject in [("tls", "Ошибка HTTPS"), ("certificate_expiring", "Истекает сертификат"), ("timeout", "Ошибка HTTPS"), ("https_redirect", "Ошибка HTTPS")]:
                event["checks"]["tls:wedfotobook.ru"]["error"] = error
                monitor.send_alert("1000-down", event)
                message = message_from_bytes(send.call_args.kwargs["input"], policy=monitor.SMTP)
                self.assertIn(subject, str(message["Subject"]))
            event["kind"] = "test"
            monitor.send_alert("1000-test", event)
            message = message_from_bytes(send.call_args.kwargs["input"], policy=monitor.SMTP)
            self.assertIn("Проверка уведомлений", str(message["Subject"]))
            self.assertIn("Реального сбоя не обнаружено", message.get_payload(decode=True).decode("utf-8"))
            self.assertNotIn("Сбой подтверждён", message.get_payload(decode=True).decode("utf-8"))

    def test_mail_has_diagnostic_details_and_no_shell_command(self):
        event = {"kind": "down", "started": 1000, "time": 1060, "checks": {}, "reason": "Диагностика сбоя", "action": None}
        with patch.dict(monitor.os.environ, {"UPTIME_MAIL_FROM": "monitor@example.com", "UPTIME_MAIL_TO": "owner@example.com"}), patch.object(monitor.subprocess, "run") as send:
            monitor.send_alert("1000-down", event)
            self.assertEqual(send.call_args.args[0][-2:], ["--", "owner@example.com"])
            from email import message_from_bytes
            message = message_from_bytes(send.call_args.kwargs["input"])
            self.assertIn("Диагностика сбоя", message.get_payload(decode=True).decode("utf-8"))


if __name__ == "__main__":
    unittest.main()
