#!/usr/bin/env bash
set -euo pipefail
repo=/root/WedPhotoBook_WebSite
stage=/root/deploy-staging/media-cache-fix-20260830
release="$stage/project"
backup=/root/deploy-backups/media-cache-fix-20260830
[[ "$(readlink -f "$repo")" == /root/WedPhotoBook_WebSite ]]
[[ "$(readlink -f "$release")" == /root/deploy-staging/media-cache-fix-20260830/project ]]
[[ -s "$release/dist/server/index.js" && -s "$release/dist/server/wrangler.json" ]]
[[ ! -e "$backup" ]]
mkdir -p "$backup"
tar -tzf "$stage/changes.tar.gz" > "$backup/changed-files.txt"
while IFS= read -r file; do
  [[ "$file" != /* && "$file" != *../* ]]
  if [[ -f "$repo/$file" ]]; then printf '%s\n' "$file"; fi
done < "$backup/changed-files.txt" > "$backup/existing-files.txt"
tar -czf "$backup/source-before.tar.gz" -C "$repo" -T "$backup/existing-files.txt"
# Keep old hashed JS/CSS available to visitors with a previously opened page.
cp -a --update=none "$repo/dist/client/_next/." "$release/dist/client/_next/"

rollback() {
  trap - ERR
  printf 'Activation failed; restoring the previous release\n' >&2
  if [[ -d "$backup/dist" ]]; then
    if [[ -d "$repo/dist" ]]; then mv "$repo/dist" "$backup/failed-dist"; fi
    mv "$backup/dist" "$repo/dist"
  fi
  tar -xzf "$backup/source-before.tar.gz" -C "$repo"
  cd "$repo"
  pm2 restart website
  exit 1
}
trap rollback ERR
tar -xzf "$stage/changes.tar.gz" -C "$repo"
mv "$repo/dist" "$backup/dist"
mv "$release/dist" "$repo/dist"
cd "$repo"
pm2 restart website
ready=0
for attempt in $(seq 1 40); do
  if curl --noproxy '*' -fsS --max-time 3 http://127.0.0.1:3000/ -o "$backup/readiness.html" && grep -q 'hero-640.webp?v=20260830' "$backup/readiness.html"; then
    ready=1
    break
  fi
  sleep 1
done
[[ "$ready" == 1 ]]
curl --noproxy '*' -fsS --max-time 15 -o /dev/null 'https://fotobooktest24.ru/media/optimized/home/hero-1080.webp?v=20260830'
curl --noproxy '*' -fsS --max-time 15 -o /dev/null 'https://fotobooktest24.ru/_vinext/image?url=%2Fmedia%2Foptimized%2Fbrand%2Flogo-256.webp%3Fv%3D20260830&w=256&q=75'
trap - ERR
printf 'Activation succeeded. Backup: %s\n' "$backup"
