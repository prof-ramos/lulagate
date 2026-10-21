#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/app"
npm ci
npm run build
cd "$ROOT"
for artifact in index.html og.png; do
  if ! cmp "dist/$artifact" "docs/$artifact"; then
    echo "docs/$artifact difere de dist/$artifact; gere o build e sincronize docs/." >&2
    exit 1
  fi
done
echo 'docs/ corresponde ao build (index.html e og.png).'
