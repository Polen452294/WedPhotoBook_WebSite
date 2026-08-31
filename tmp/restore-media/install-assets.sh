#!/usr/bin/env bash
set -euo pipefail

repo=/root/WedPhotoBook_WebSite
stage=/root/deploy-staging/media-recovery-20260830
backup=/root/deploy-backups/media-recovery-20260830
[[ "$(readlink -f "$repo")" == /root/WedPhotoBook_WebSite ]]
[[ -d "$repo/public/media" && -d "$repo/dist/client/media" ]]
test -s "$stage/assets.tar.gz"
mkdir -p "$backup"
tar -tzf "$stage/assets.tar.gz" > "$backup/added-assets.txt"
while IFS= read -r asset; do
  [[ "$asset" == media/home/* || "$asset" == media/optimized/* ]]
  [[ "$asset" != *../* && "$asset" != /* ]]
  [[ ! -e "$repo/public/$asset" && ! -e "$repo/dist/client/$asset" ]]
done < "$backup/added-assets.txt"
cp -n "$stage/assets.tar.gz" "$backup/restored-assets.tar.gz"
tar --keep-old-files --no-same-owner --no-same-permissions -xzf "$stage/assets.tar.gz" -C "$repo/public"
tar --keep-old-files --no-same-owner --no-same-permissions -xzf "$stage/assets.tar.gz" -C "$repo/dist/client"
while IFS= read -r asset; do
  chmod 644 "$repo/public/$asset" "$repo/dist/client/$asset"
  cmp "$repo/public/$asset" "$repo/dist/client/$asset"
done < "$backup/added-assets.txt"
printf 'Restored %s files into public and dist/client\n' "$(wc -l < "$backup/added-assets.txt")"
