#!/bin/sh
set -eu
APP="/volume1/projects/free-culture/app"
ENV_FILE="$APP/runtime/sharelink.env"
# Credential-free installations keep the site running with the last verified feed.
[ -f "$ENV_FILE" ] || exit 0
DOCKER="/var/packages/ContainerManager/target/usr/bin/docker"
[ -x "$DOCKER" ] || DOCKER="$(command -v docker)"
mkdir -p "$APP/runtime/sharelink/public" "$APP/runtime/sharelink/state"
chmod 755 "$APP/runtime/sharelink/public"
chmod 700 "$APP/runtime/sharelink/state"
chmod 600 "$ENV_FILE"
"$DOCKER" run --rm --network bridge --env-file "$ENV_FILE" \
  -e TOSS_SHARELINK_STATE_DIR=/state -e TOSS_SHARELINK_PUBLIC_FILE=/output/editorial.json \
  -v "$APP/scripts/sharelink:/work:ro" -v "$APP/runtime/sharelink/state:/state" \
  -v "$APP/runtime/sharelink/public:/output" -w /work node:20-bookworm-slim node sync.mjs
chmod 644 "$APP/runtime/sharelink/public/editorial.json"
