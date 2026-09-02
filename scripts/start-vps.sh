#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local" >&2
  exit 1
fi
if [[ ! -f .next/BUILD_ID ]]; then
  echo "Missing build output. Run npm run build first." >&2
  exit 1
fi

if ! node scripts/check-contact-config.mjs .env.local; then
  echo "Warning: contact email is not fully configured; starting the site with notifications unavailable." >&2
fi

node scripts/migrate-sqlite.mjs .env.local

exec node scripts/server.mjs
