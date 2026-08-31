#!/usr/bin/env bash
set -euo pipefail
stage=/root/deploy-staging/media-cache-fix-20260830
release="$stage/project"
[[ "$(readlink -f "$release")" == /root/deploy-staging/media-cache-fix-20260830/project ]]
[[ ! -e "$stage/partial-dist" ]]
if [[ -d "$release/dist" ]]; then mv "$release/dist" "$stage/partial-dist"; fi
tar -xzf "$stage/validated-dist.tar.gz" -C "$release"
# Preserve server-only original asset URLs, without replacing the validated files.
cp -a --update=none "$release/public/." "$release/dist/client/"
cd "$release"
node --test tests/*.test.mjs
npm run check:assets
printf 'Validated release is ready\n'
