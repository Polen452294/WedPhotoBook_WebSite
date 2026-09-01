#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local" >&2
  exit 1
fi
if [[ ! -f dist/server/wrangler.json ]]; then
  echo "Missing build output. Run npm run build first." >&2
  exit 1
fi

node scripts/check-contact-config.mjs .env.local

# The generated Sites config serves assets automatically, but the VPS image
# optimizer also needs an explicit service binding for source files.
node scripts/check-public-assets.mjs
node scripts/prepare-vps-runtime.mjs dist/server/wrangler.json

# Wrangler reads local Worker bindings from the config directory. Keep this
# generated file private and out of Git.
install -m 600 .env.local dist/server/.dev.vars

exec ./node_modules/.bin/wrangler dev \
  --local \
  --ip 127.0.0.1 \
  --port "${PORT:-3000}" \
  --persist-to=.wrangler/state \
  --config=dist/server/wrangler.json
