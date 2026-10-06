#!/bin/sh
set -eu

# Pull the public main branch into the NAS deployment directory and rebuild only
# when the downloaded archive changed. Runtime secrets stay outside the archive.
ROOT="/volume1/projects/free-culture"
APP="$ROOT/app"
STATE="$ROOT/.deploy"
LOCK="$STATE/update.lock"
ARCHIVE="$STATE/main.tar.gz"
UNPACK="$STATE/unpack"
SOURCE="$UNPACK/free-culture-main"
HASH_FILE="$STATE/main.tar.gz.sha256"
COMMIT_FILE="$STATE/main.commit"
LOG="$STATE/update.log"
REPOSITORY_ARCHIVE="https://codeload.github.com/seojungseok/free-culture/tar.gz/refs/heads/main"
REPOSITORY_REF="https://api.github.com/repos/seojungseok/free-culture/git/ref/heads/main"
PREVIEW="http://192.168.0.115:3275"

# Run from deployment state so source synchronization cannot overwrite the
# shell script while it is executing.
if [ "${NAS_SYNC_RUNNER:-0}" != "1" ]; then
  mkdir -p "$STATE"
  cp "$0" "$STATE/runner.sh"
  NAS_SYNC_RUNNER=1
  export NAS_SYNC_RUNNER
  exec /bin/sh "$STATE/runner.sh"
fi

mkdir -p "$STATE"
timestamp() {
  date '+%Y-%m-%dT%H:%M:%S%z'
}

if ! mkdir "$LOCK" 2>/dev/null; then
  printf '%s update skipped: lock exists\n' "$(timestamp)" >> "$LOG"
  exit 0
fi
STEP="locate tools"
cleanup() {
  status=$?
  if [ "$status" -ne 0 ]; then
    printf '%s update failed: step=%s exit=%s\n' "$(timestamp)" "$STEP" "$status" >> "$LOG"
  fi
  rm -rf "$LOCK" "$UNPACK" "$ARCHIVE.tmp"
}
trap cleanup EXIT INT TERM

find_cmd() {
  for candidate in "$@"; do
    if [ -x "$candidate" ]; then
      printf '%s' "$candidate"
      return 0
    fi
  done
  command -v "${1##*/}" 2>/dev/null
}

STEP="locate curl"
CURL="$(find_cmd /usr/bin/curl /bin/curl)"
STEP="locate tar"
TAR="$(find_cmd /usr/bin/tar /bin/tar)"
STEP="locate sha256sum"
SHA256SUM="$(find_cmd /usr/bin/sha256sum /bin/sha256sum)"
STEP="locate docker"
DOCKER="$(find_cmd /var/packages/ContainerManager/target/usr/bin/docker /usr/local/bin/docker /usr/bin/docker)"

# Hourly checks download one small public ref response. Unchanged commits do
# not download the archive or rebuild. Pin the archive to that verified SHA so
# a concurrent data commit cannot be recorded as a different deployment.
STEP="check main commit"
# Refresh selected affiliate products even when the source commit is unchanged.
if [ -f "$APP/scripts/nas/refresh-sharelink.sh" ]; then
  /bin/sh "$APP/scripts/nas/refresh-sharelink.sh" >> "$LOG" 2>&1 || printf '%s sharelink refresh deferred\n' "$(timestamp)" >> "$LOG"
fi
REMOTE_SHA=""
if "$CURL" --fail --silent --show-error --location --retry 2 --connect-timeout 15 --max-time 45 \
  --output "$STATE/main-ref.json.tmp" "$REPOSITORY_REF"; then
  REMOTE_SHA="$(sed -n 's/^[[:space:]]*"sha": "\([0-9a-f]\{40\}\)".*/\1/p' "$STATE/main-ref.json.tmp" | sed -n '1p')"
fi
if [ -n "$REMOTE_SHA" ] && [ -f "$COMMIT_FILE" ] && [ "$REMOTE_SHA" = "$(sed -n '1p' "$COMMIT_FILE")" ]; then
  printf '%s update skipped: main commit unchanged\n' "$(timestamp)" >> "$LOG"
  exit 0
fi
if [ -n "$REMOTE_SHA" ]; then
  REPOSITORY_ARCHIVE="https://codeload.github.com/seojungseok/free-culture/tar.gz/$REMOTE_SHA"
  SOURCE="$UNPACK/free-culture-$REMOTE_SHA"
fi

STEP="download main"
"$CURL" --fail --silent --show-error --location --retry 3 --connect-timeout 20 \
  --output "$ARCHIVE.tmp" "$REPOSITORY_ARCHIVE"
NEW_HASH="$("$SHA256SUM" "$ARCHIVE.tmp" | awk '{print $1}')"
OLD_HASH=""
if [ -f "$HASH_FILE" ]; then
  OLD_HASH="$(sed -n '1p' "$HASH_FILE")"
fi
if [ "$NEW_HASH" = "$OLD_HASH" ]; then
  if [ -n "$REMOTE_SHA" ]; then printf '%s\n' "$REMOTE_SHA" > "$COMMIT_FILE"; fi
  printf '%s update skipped: main unchanged\n' "$(timestamp)" >> "$LOG"
  exit 0
fi

STEP="extract and validate"
rm -rf "$UNPACK"
mkdir -p "$UNPACK"
mv "$ARCHIVE.tmp" "$ARCHIVE"
"$TAR" -xzf "$ARCHIVE" -C "$UNPACK"
for required in package.json Dockerfile.nas compose.nas.yml scripts/nas/smoke.mjs; do
  if [ ! -f "$SOURCE/$required" ]; then
    printf '%s update failed: archive validation\n' "$(timestamp)" >> "$LOG"
    exit 1
  fi
done

# Never delete or overwrite NAS-only secrets and deployment state. DSM does
# not guarantee rsync is installed, so merge top-level source entries with cp.
STEP="synchronize app source"
for entry in "$SOURCE"/* "$SOURCE"/.[!.]*; do
  [ -e "$entry" ] || continue
  name="${entry##*/}"
  case "$name" in
    runtime|compose.yaml|.deploy) continue ;;
  esac
  cp -a "$entry" "$APP/"
done
cp "$APP/compose.nas.yml" "$APP/compose.yaml"
mkdir -p "$APP/runtime/sharelink/public"
mkdir -p "$APP/runtime/sharelink/events"
chown 10001:10001 "$APP/runtime/sharelink/events"
chmod 700 "$APP/runtime/sharelink/events"
if [ ! -f "$APP/runtime/sharelink/public/editorial.json" ] && [ -f "$APP/data/sharelink-editorial.json" ]; then
  cp "$APP/data/sharelink-editorial.json" "$APP/runtime/sharelink/public/editorial.json"
fi
if [ -f "$APP/scripts/nas/refresh-sharelink.sh" ]; then
  /bin/sh "$APP/scripts/nas/refresh-sharelink.sh" >> "$LOG" 2>&1 || printf '%s sharelink refresh deferred\n' "$(timestamp)" >> "$LOG"
fi

cd "$APP"
STEP="build containers"
"$DOCKER" compose -p free-culture-nas -f compose.yaml up -d --build

smoke_url() {
  url="$1"
  attempt=1
  while [ "$attempt" -le 40 ]; do
    if "$CURL" --fail --silent --show-error --max-time 30 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 3
    attempt=$((attempt + 1))
  done
  "$CURL" --fail --silent --show-error --max-time 30 "$url" >/dev/null
}

STEP="smoke check"
smoke_url "$PREVIEW/robots.txt"
smoke_url "$PREVIEW/sitemap.xml"

STEP="verify stored public information mode"
RUNTIME_MODE="$("$DOCKER" compose -p free-culture-nas -f compose.yaml exec -T web node -p 'process.env.TOUR_RUNTIME_FETCH')"
if [ "$RUNTIME_MODE" != "0" ]; then
  printf '%s update failed: public TourAPI mode must be stored\n' "$(timestamp)" >> "$LOG"
  exit 1
fi

printf '%s\n' "$NEW_HASH" > "$HASH_FILE"
if [ -n "$REMOTE_SHA" ]; then printf '%s\n' "$REMOTE_SHA" > "$COMMIT_FILE"; fi
printf '%s update complete: commit=%s public TourAPI mode=stored\n' "$(timestamp)" "${REMOTE_SHA:-archive-hash}" >> "$LOG"
