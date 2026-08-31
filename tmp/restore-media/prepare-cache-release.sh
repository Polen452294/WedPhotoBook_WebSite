#!/usr/bin/env bash
set -euo pipefail
repo=/root/WedPhotoBook_WebSite
release=/root/deploy-staging/media-cache-fix-20260830/project
[[ "$(readlink -f "$repo")" == /root/WedPhotoBook_WebSite ]]
[[ ! -e "$release" ]]
mkdir -p "$release"
cd "$repo"
cp -a app build components data db docs drizzle lib public scripts tests worker .openai \
  next.config.ts next-env.d.ts package.json package-lock.json postcss.config.mjs \
  tsconfig.json vite.config.ts drizzle.config.ts eslint.config.mjs wrangler.local.jsonc "$release/"
install -m 600 .env.local "$release/.env.local"
ln -s "$repo/node_modules" "$release/node_modules"
tar -xzf /root/deploy-staging/media-cache-fix-20260830/changes.tar.gz -C "$release"
cd "$release"
npm run build
node --test tests/*.test.mjs
npm run check:assets
printf 'Staged release validated\n'
