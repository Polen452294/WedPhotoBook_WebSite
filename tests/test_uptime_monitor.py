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
