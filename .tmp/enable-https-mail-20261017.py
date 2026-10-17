import importlib.util
import json
import os
from pathlib import Path
import shlex
import shutil
import sqlite3
import subprocess
import tempfile
import time
from email.utils import parseaddr

backup = Path('/root/deploy-backups/https-mail-20261017')
backup.mkdir(mode=0o700, parents=True, exist_ok=True)
monitor_path = Path('/opt/wedfotobook-monitor/uptime-monitor.py')
config_path = Path('/etc/wedfotobook-monitor.env')
for path in (monitor_path, config_path):
    if path.exists():
        destination = backup / path.name
        if not destination.exists():
            shutil.copy2(path, destination)

process = next(item for item in json.loads(subprocess.check_output(['pm2', 'jlist'])) if item['name'] == 'website')
values = {}
for line in (Path(process['pm2_env']['pm_cwd']) / '.env.local').read_text().splitlines():
    key, separator, value = line.partition('=')
    if separator and key.strip() in ('CONTACT_TO_EMAIL', 'CONTACT_FROM_EMAIL'):
        values[key.strip()] = value.strip().strip('\"\'')
recipient = process['pm2_env'].get('CONTACT_TO_EMAIL') or values['CONTACT_TO_EMAIL']
sender = process['pm2_env'].get('CONTACT_FROM_EMAIL') or values['CONTACT_FROM_EMAIL']
for address in (recipient, sender):
    assert '\r' not in address and '\n' not in address and '@' in parseaddr(address)[1]

source = Path('/root/wedfotobook-https-check-20261017/scripts/uptime-monitor.py')
temporary = monitor_path.with_suffix('.py.new')
shutil.copyfile(source, temporary)
temporary.chmod(0o644)
temporary.replace(monitor_path)

now = int(time.time())
config = {}
if config_path.exists():
    for line in config_path.read_text().splitlines():
        key, separator, value = line.partition('=')
        if separator and not key.lstrip().startswith('#'):
            parsed = shlex.split(value)
            config[key.strip()] = parsed[0] if parsed else ''
config.update(UPTIME_MAIL_TO=recipient, UPTIME_MAIL_FROM=sender)
config.setdefault('UPTIME_MAIL_SINCE', str(now))
temporary_config = config_path.with_suffix('.env.new')
descriptor = os.open(temporary_config, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(descriptor, 'w') as stream:
    for key, value in config.items():
        stream.write(f'{key}={json.dumps(value, ensure_ascii=False)}\n')
temporary_config.chmod(0o600)
temporary_config.replace(config_path)
os.environ.update(config)

spec = importlib.util.spec_from_file_location('monitor', monitor_path)
monitor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor)
checks = {f'tls:{hostname}': monitor.probe_certificate(hostname) for hostname in (
    'wedfotobook.ru', 'www.wedfotobook.ru', 'fotobooktest24.ru', 'www.fotobooktest24.ru')}
assert all(check['ok'] for check in checks.values()), checks
event = {'kind': 'test', 'started': now, 'time': now, 'checks': checks, 'reason': None, 'action': None}
event_id = f'{now}-test-https'
with tempfile.TemporaryDirectory() as temporary_directory:
    directory = Path(temporary_directory)
    with sqlite3.connect(directory / 'history.sqlite3') as database:
        database.execute('CREATE TABLE outbox (id TEXT PRIMARY KEY, payload TEXT NOT NULL, sent_at INTEGER)')
        database.execute('INSERT INTO outbox VALUES (?, ?, NULL)', (event_id, json.dumps(event)))
    monitor.flush_alerts(directory)
    with sqlite3.connect(directory / 'history.sqlite3') as database:
        assert database.execute('SELECT sent_at FROM outbox').fetchone()[0] is not None, 'Test message was not queued'
print(json.dumps({'recipient': recipient, 'test_message_id': f"<uptime-{event_id}@{parseaddr(sender)[1].split('@')[1]}>",
                  'notifications_since': config['UPTIME_MAIL_SINCE']}, ensure_ascii=False))
