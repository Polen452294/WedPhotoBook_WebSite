#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "Run this installer as root." >&2
  exit 1
fi

cd -- "$(dirname -- "$0")/.."
if [[ ! -f .env.local ]]; then
  echo "Missing .env.local" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
printf '%s\n' \
  'postfix postfix/mailname string fotobooktest24.ru' \
  'postfix postfix/main_mailer_type select Internet Site' | debconf-set-selections
apt-get update
apt-get install -y --no-install-recommends postfix opendkim opendkim-tools python3 ca-certificates curl

if ! id wedfotomailer >/dev/null 2>&1; then
  useradd --system --home-dir /var/lib/wedfotobook-mailer --create-home --shell /usr/sbin/nologin wedfotomailer
fi

install -d -m 0755 /usr/local/lib/wedfotobook-mailer
install -m 0755 scripts/local-mailer/mail_gateway.py /usr/local/lib/wedfotobook-mailer/mail_gateway.py
install -m 0644 scripts/local-mailer/wedfotobook-mailer.service /etc/systemd/system/wedfotobook-mailer.service
install -m 0644 scripts/local-mailer/opendkim.conf /etc/opendkim.conf
install -d -m 0755 /etc/opendkim /etc/opendkim/keys
install -m 0644 scripts/local-mailer/key.table /etc/opendkim/key.table
install -m 0644 scripts/local-mailer/signing.table /etc/opendkim/signing.table
install -m 0644 scripts/local-mailer/trusted.hosts /etc/opendkim/trusted.hosts
install -d -o opendkim -g opendkim -m 0700 /etc/opendkim/keys/fotobooktest24.ru

if [[ ! -f /etc/opendkim/keys/fotobooktest24.ru/mail.private ]]; then
  opendkim-genkey -b 2048 -D /etc/opendkim/keys/fotobooktest24.ru -d fotobooktest24.ru -s mail
fi
chown -R opendkim:opendkim /etc/opendkim/keys/fotobooktest24.ru
chmod 0600 /etc/opendkim/keys/fotobooktest24.ru/mail.private

printf '%s\n' 'fotobooktest24.ru' >/etc/mailname
postconf -e 'myhostname = mail.fotobooktest24.ru'
postconf -e 'mydomain = fotobooktest24.ru'
postconf -e 'myorigin = $mydomain'
postconf -e 'inet_interfaces = loopback-only'
postconf -e 'inet_protocols = ipv4'
postconf -e 'mydestination = $myhostname, localhost.$mydomain, localhost'
postconf -e 'mynetworks = 127.0.0.0/8 [::1]/128'
postconf -e 'relay_domains ='
postconf -e 'smtpd_relay_restrictions = permit_mynetworks, reject_unauth_destination'
postconf -e 'disable_vrfy_command = yes'
postconf -e 'smtp_helo_name = $myhostname'
postconf -e 'smtp_tls_security_level = may'
postconf -e 'smtp_tls_CApath = /etc/ssl/certs'
postconf -e 'milter_protocol = 6'
postconf -e 'milter_default_action = accept'
postconf -e 'smtpd_milters = inet:127.0.0.1:8891'
postconf -e 'non_smtpd_milters = inet:127.0.0.1:8891'
postfix check

mailer_token="$(openssl rand -hex 32)"
mailer_env_tmp="$(mktemp)"
trap 'rm -f -- "$mailer_env_tmp"' EXIT
printf 'LOCAL_MAILER_TOKEN=%s\nLOCAL_MAILER_PORT=3081\nLOCAL_MAILER_STATE=/var/lib/wedfotobook-mailer/state.sqlite3\n' "$mailer_token" >"$mailer_env_tmp"
install -o root -g root -m 0600 "$mailer_env_tmp" /etc/wedfotobook-mailer.env
LOCAL_MAILER_TOKEN_VALUE="$mailer_token" node scripts/configure-local-mailer.mjs .env.local
unset mailer_token

systemctl daemon-reload
systemctl enable opendkim postfix wedfotobook-mailer
systemctl restart opendkim postfix wedfotobook-mailer
mailer_healthy=0
for _ in {1..20}; do
  if curl --fail --silent http://127.0.0.1:3081/health >/dev/null; then
    mailer_healthy=1
    break
  fi
  sleep 0.5
done
if [[ "$mailer_healthy" -ne 1 ]]; then
  systemctl --no-pager --full status wedfotobook-mailer >&2 || true
  exit 1
fi

echo "Local mailer is running. Publish the DKIM TXT value shown below at mail._domainkey.fotobooktest24.ru:"
tr -d '\n\t"()' </etc/opendkim/keys/fotobooktest24.ru/mail.txt
echo
echo "Also set PTR 138.16.227.234 -> mail.fotobooktest24.ru and publish a DMARC TXT record at _dmarc.fotobooktest24.ru."
