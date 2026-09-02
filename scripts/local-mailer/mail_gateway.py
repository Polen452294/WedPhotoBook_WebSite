#!/usr/bin/env python3
"""Loopback-only bridge from the web application to the local Postfix queue."""

from __future__ import annotations

import hmac
import json
import os
import re
import sqlite3
import subprocess
import time
from contextlib import closing
from email.message import EmailMessage
from email.policy import SMTP
from email.utils import formataddr, formatdate, make_msgid, parseaddr
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


MAX_BODY_BYTES = 64 * 1024
ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:/-]{7,199}$")
EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$")
LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = int(os.environ.get("LOCAL_MAILER_PORT", "3081"))
AUTH_TOKEN = os.environ.get("LOCAL_MAILER_TOKEN", "")
STATE_PATH = os.environ.get("LOCAL_MAILER_STATE", "/var/lib/wedfotobook-mailer/state.sqlite3")
SENDMAIL_PATH = os.environ.get("SENDMAIL_PATH", "/usr/sbin/sendmail")


def mailbox(value: object) -> tuple[str, str]:
    raw = str(value or "").strip()
    if "\r" in raw or "\n" in raw:
        return "", ""
    display_name, address = parseaddr(raw)
    if not EMAIL_PATTERN.fullmatch(address):
        return "", ""
    return display_name[:120], address.lower()


def initialize_state() -> None:
    os.makedirs(os.path.dirname(STATE_PATH), mode=0o700, exist_ok=True)
    with closing(sqlite3.connect(STATE_PATH)) as connection:
        with connection:
            connection.execute(
                """CREATE TABLE IF NOT EXISTS deliveries (
                    id TEXT PRIMARY KEY,
                    status TEXT NOT NULL,
                    updated_at INTEGER NOT NULL
                )"""
            )


def claim_delivery(delivery_id: str) -> str:
    now = int(time.time())
    with closing(sqlite3.connect(STATE_PATH, timeout=5)) as connection:
        with connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT status, updated_at FROM deliveries WHERE id = ?", (delivery_id,)
            ).fetchone()
            if row and row[0] == "accepted":
                return "duplicate"
            if row and row[0] == "processing" and now - int(row[1]) < 300:
                return "busy"
            connection.execute(
                "INSERT INTO deliveries(id, status, updated_at) VALUES (?, 'processing', ?) "
                "ON CONFLICT(id) DO UPDATE SET status = 'processing', updated_at = excluded.updated_at",
                (delivery_id, now),
            )
    return "claimed"


def finish_delivery(delivery_id: str, accepted: bool) -> None:
    with closing(sqlite3.connect(STATE_PATH, timeout=5)) as connection:
        with connection:
            if accepted:
                connection.execute(
                    "UPDATE deliveries SET status = 'accepted', updated_at = ? WHERE id = ?",
                    (int(time.time()), delivery_id),
                )
            else:
                connection.execute("DELETE FROM deliveries WHERE id = ?", (delivery_id,))


class MailHandler(BaseHTTPRequestHandler):
    server_version = "WedfotobookMailer/1"

    def log_message(self, message: str, *args: object) -> None:
        print(f"{self.address_string()} - {message % args}", flush=True)

    def respond(self, status: int, payload: dict[str, object]) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self.respond(200, {"ok": True})
        else:
            self.respond(404, {"ok": False})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/send":
            self.respond(404, {"ok": False})
            return

        supplied_token = self.headers.get("Authorization", "").removeprefix("Bearer ")
        if not AUTH_TOKEN or not hmac.compare_digest(supplied_token, AUTH_TOKEN):
            self.respond(401, {"ok": False, "error": "unauthorized"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0
        if content_length < 2 or content_length > MAX_BODY_BYTES:
            self.respond(413, {"ok": False, "error": "invalid request size"})
            return

        try:
            payload = json.loads(self.rfile.read(content_length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.respond(400, {"ok": False, "error": "invalid json"})
            return

        delivery_id = str(payload.get("id", ""))
        sender_name, sender_address = mailbox(payload.get("from"))
        _, recipient_address = mailbox(payload.get("to"))
        subject = str(payload.get("subject", "")).replace("\r", " ").replace("\n", " ").strip()[:300]
        text = str(payload.get("text", ""))[:32000]
        if not ID_PATTERN.fullmatch(delivery_id) or not sender_address or not recipient_address or not subject or not text:
            self.respond(422, {"ok": False, "error": "invalid message"})
            return

        claim = claim_delivery(delivery_id)
        if claim == "duplicate":
            self.respond(200, {"ok": True, "duplicate": True})
            return
        if claim == "busy":
            self.respond(409, {"ok": False, "error": "delivery in progress"})
            return

        message = EmailMessage()
        message["From"] = formataddr((sender_name, sender_address)) if sender_name else sender_address
        message["To"] = recipient_address
        message["Subject"] = subject
        message["Date"] = formatdate(localtime=False, usegmt=True)
        message["Message-ID"] = make_msgid(domain=sender_address.split("@", 1)[1])
        message["X-Wedfotobook-Request-ID"] = delivery_id
        message.set_content(text, charset="utf-8")

        try:
            result = subprocess.run(
                [SENDMAIL_PATH, "-i", "-f", sender_address, recipient_address],
                input=message.as_bytes(policy=SMTP),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                timeout=20,
                check=False,
            )
            if result.returncode != 0:
                raise RuntimeError("sendmail rejected the message")
        except (OSError, subprocess.SubprocessError, RuntimeError):
            finish_delivery(delivery_id, accepted=False)
            self.respond(503, {"ok": False, "error": "mail queue unavailable"})
            return

        finish_delivery(delivery_id, accepted=True)
        self.respond(200, {"ok": True})


def main() -> None:
    if len(AUTH_TOKEN) < 32:
        raise SystemExit("LOCAL_MAILER_TOKEN must contain at least 32 characters")
    initialize_state()
    server = ThreadingHTTPServer((LISTEN_HOST, LISTEN_PORT), MailHandler)
    server.serve_forever()


if __name__ == "__main__":
    main()
