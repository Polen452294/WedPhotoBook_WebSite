import json
from pathlib import Path
import sqlite3
import subprocess

processes = json.loads(subprocess.check_output(["pm2", "jlist"]))
for process in processes:
    if process["name"] != "website":
        continue
    environment = process["pm2_env"]
    cwd = Path(environment["pm_cwd"])
    print("application_directory:", cwd)
    values = {}
    path = cwd / ".env.local"
    if path.exists():
        for line in path.read_text().splitlines():
            key, separator, value = line.partition("=")
            if separator and key.strip() in ("CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL"):
                values[key.strip()] = value.strip().strip("\"'")
    for key in ("CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL"):
        print(key + ":", environment.get(key) or values.get(key) or "NOT_SET")
with sqlite3.connect("file:/var/lib/wedfotobook-monitor/history.sqlite3?mode=ro", uri=True) as database:
    print("pending_notifications:", database.execute("SELECT count(*), min(id), max(id) FROM outbox WHERE sent_at IS NULL").fetchone())
    for row in database.execute("SELECT id, payload FROM outbox WHERE sent_at IS NULL ORDER BY rowid LIMIT 5"):
        event = json.loads(row[1])
        print(json.dumps({key: event.get(key) for key in ("time", "kind", "reason")}, ensure_ascii=False))
