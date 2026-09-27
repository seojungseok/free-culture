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
LOG="$STATE/update.log"
REPOSITORY_ARCHIVE="https://codeload.github.com/seojungseok/free-culture/tar.gz/refs/heads/main"
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

STEP="download main"
"$CURL" --fail --silent --show-error --location --retry 3 --connect-timeout 20 \
  --output "$ARCHIVE.tmp" "$REPOSITORY_ARCHIVE"
NEW_HASH="$("$SHA256SUM" "$ARCHIVE.tmp" | awk '{print $1}')"
OLD_HASH=""
if [ -f "$HASH_FILE" ]; then
  OLD_HASH="$(sed -n '1p' "$HASH_FILE")"
fi
if [ "$NEW_HASH" = "$OLD_HASH" ]; then
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

cd "$APP"
STEP="build containers"
"$DOCKER" compose -f compose.yaml up -d --build --remove-orphans
STEP="smoke check"
"$CURL" --fail --silent --show-error --max-time 30 "$PREVIEW/robots.txt" >/dev/null
"$CURL" --fail --silent --show-error --max-time 30 "$PREVIEW/sitemap.xml" >/dev/null

printf '%s\n' "$NEW_HASH" > "$HASH_FILE"
printf '%s update complete\n' "$(timestamp)" >> "$LOG"
