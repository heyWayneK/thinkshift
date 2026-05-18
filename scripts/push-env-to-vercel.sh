#!/usr/bin/env bash
# Push the Next.js-side env vars from .env.local to the linked Vercel project
# for production, preview and development.
#
# Run AFTER:  vercel login  &&  vercel link
# Usage:      bash scripts/push-env-to-vercel.sh
#
# NOT pushed here (these belong in the CONVEX dashboard env vars, not Vercel,
# because the Convex deployment — not Next — reads them):
#   CLERK_WEBHOOK_SECRET, MS356_EMAIL_SERVER_*, CONVEX_DEPLOYMENT
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -d .vercel ]; then
  echo "Not linked. Run 'vercel login' then 'vercel link' first." >&2
  exit 1
fi
if [ ! -f .env.local ]; then
  echo ".env.local not found." >&2
  exit 1
fi

# Vars the Next app needs at build (NEXT_PUBLIC_* are inlined) and runtime.
VARS=(
  NEXT_PUBLIC_CONVEX_URL
  NEXT_PUBLIC_CONVEX_SITE_URL
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  CLERK_SECRET_KEY
  SUPERADMIN_ORG_ID
)
ENVS=(production preview development)

get_val() {
  # First match wins; strips `export `, surrounding quotes and inline ` #...`.
  grep -E "^(export +)?$1=" .env.local | head -n1 \
    | sed -E "s/^(export +)?$1=//; s/[[:space:]]+#.*$//; s/^\"(.*)\"$/\1/; s/^'(.*)'$/\1/"
}

for name in "${VARS[@]}"; do
  val="$(get_val "$name" || true)"
  if [ -z "${val:-}" ]; then
    echo "skip  $name (empty/missing in .env.local)"
    continue
  fi
  for env in "${ENVS[@]}"; do
    # Remove an existing value so re-runs update instead of erroring.
    vercel env rm "$name" "$env" --yes >/dev/null 2>&1 || true
    printf '%s' "$val" | vercel env add "$name" "$env" >/dev/null
    echo "set   $name -> $env"
  done
done

echo
echo "Done. Trigger a new deploy for changes to take effect:  vercel --prod"
