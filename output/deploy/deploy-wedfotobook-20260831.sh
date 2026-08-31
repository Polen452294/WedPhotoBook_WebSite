#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

repo=/root/WedPhotoBook_WebSite
archive=/root/wedfotobook-update-20260831.tar.gz
if (( $# )); then archive="$1"; fi
expected_sha=1e2176358a148c0f4d29456a5027a24111310571fb72b408bfa505ad0c2aa560
stage=
backup=
stopped=0
installed=0

rollback() {
  local status="$1"
  trap - ERR INT TERM HUP
  set +e
  if (( stopped )); then
    printf '\nUpdate failed. Restarting the previous version.\n' >&2
    if (( installed )); then
      timeout 45s pm2 stop website
      if ! tar -xf "$backup/release.tar" -C "$repo"; then
        printf 'Restore failed. Backup: %s/release.tar\n' "$backup" >&2
        exit "$status"
      fi
    fi
    cd "$repo" || exit "$status"
    timeout 45s pm2 restart website --update-env
  fi
  printf 'Update did not complete. Staging: %s\nBackup: %s\n' "$stage" "$backup" >&2
  exit "$status"
}

trap 'rollback $?' ERR
trap 'rollback 130' INT
trap 'rollback 143' TERM
trap 'rollback 129' HUP

[[ "$(id -u)" == 0 ]]
[[ "$(readlink -f "$repo")" == "$repo" ]]
[[ -s "$repo/.env.local" && -d "$repo/.wrangler/state" ]]
[[ -s "$repo/dist/server/index.js" && -x "$repo/node_modules/.bin/vinext" ]]
for executable in node npm pm2 rsync flock timeout curl tar sha256sum; do
  command -v "$executable" >/dev/null
done

exec 9>/root/wedfotobook-update.lock
flock -n 9 || { echo 'Another update is running.' >&2; exit 1; }
printf '%s  %s\n' "$expected_sha" "$archive" | sha256sum -c -
available_kb="$(df -Pk "$repo" | awk 'NR==2 {print $4}')"
(( available_kb >= 2097152 )) || { echo 'At least 2 GiB of free disk space is required.' >&2; exit 1; }
timeout 20s pm2 describe website >/dev/null

mkdir -p /root/deploy-staging /root/deploy-backups
stage="$(mktemp -d /root/deploy-staging/wedfotobook-20260831.XXXXXX)"
tar -xzf "$archive" -C "$stage" --no-same-owner
if ! cmp -s "$repo/package-lock.json" "$stage/package-lock.json"; then
  echo 'Server dependencies changed. Stopping before touching the running site.' >&2
  exit 1
fi

# The verified lockfile is unchanged. Reuse Linux dependencies, never Windows binaries.
ln -s "$repo/node_modules" "$stage/node_modules"
install -m 600 "$repo/.env.local" "$stage/.env.local"
backup="$(mktemp -d /root/deploy-backups/wedfotobook-20260831.XXXXXX)"

echo 'Stopping the site temporarily to free memory for the build.'
stopped=1
timeout 45s pm2 stop website

# Runtime settings, Git history and the database remain in the original directory.
tar -cf "$backup/release.tar" -C "$repo" \
  --exclude='./node_modules' \
  --exclude='./.git' \
  --exclude='./.wrangler' \
  --exclude='./.env*' \
  --exclude='./.dev.vars*' \
  --exclude='./dist/server/.dev.vars*' \
  --exclude='./.tmp' \
  --exclude='./tmp' \
  --exclude='./output' \
  .

cd "$stage"
NODE_OPTIONS=--max-old-space-size=512 npm run lint
NODE_OPTIONS=--max-old-space-size=512 npm run build
NODE_OPTIONS=--max-old-space-size=512 node --test tests/*.test.mjs
NODE_OPTIONS=--max-old-space-size=512 npm run check:assets

# No --delete: retain older hashed assets for visitors with an already-open page.
# Never replace the server's secrets, database, dependencies or Git directory.
installed=1
rsync -a \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.wrangler' \
  --exclude='.env*' \
  --exclude='.dev.vars*' \
  "$stage/" "$repo/"

cd "$repo"
timeout 45s pm2 restart website --update-env
healthy=0
for (( attempt=1; attempt<=60; attempt++ )); do
  if curl -fsS --max-time 5 http://127.0.0.1:3000/ -o "$stage/smoke-home.html" \
    && grep -Fq 'home-optimized.css?v=5' "$stage/smoke-home.html" \
    && curl -fsS --max-time 5 http://127.0.0.1:3000/media/responsive/0dfe3d6435c0d3d8-480.webp -o "$stage/smoke-hero.webp" \
    && cmp -s "$stage/smoke-hero.webp" "$repo/public/media/responsive/0dfe3d6435c0d3d8-480.webp"; then
    healthy=1
    break
  fi
  sleep 1
done
[[ "$healthy" == 1 ]]
stopped=0
trap - ERR INT TERM HUP
printf '\nUpdate complete: https://fotobooktest24.ru/\nBackup: %s/release.tar\n' "$backup"
echo 'Server settings and .wrangler/state were preserved; no migrations were run.'
