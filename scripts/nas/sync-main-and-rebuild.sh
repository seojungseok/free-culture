#!/bin/sh
set -eu

# Pull the public main branch into the NAS deployment directory and rebuild only
# when the downloaded archive changed. Runtime secrets stay outside the archive.
ROOT="/volume1/projects/free-culture"
APP="$ROOT/app"
STATE="$ROOT/.deploy"
LOCK="$STATE/update.lock"
ARCHIVE="$STATE/main.zip"
UNPACK="$STATE/unpack"
SOURCE="$UNPACK/free-culture-main"
HASH_FILE="$STATE/main.zip.sha256"
LOG="$STATE/update.log"
REPOSITORY_ARCHIVE="https://codeload.github.com/seojungseok/free-culture/zip/refs/heads/main"
PREVIEW="http://192.168.0.115:3275"

mkdir -p "$STATE"
timestamp() {
  date '+%Y-%m-%dT%H:%M:%S%z'
}

if ! mkdir "$LOCK" 2>/dev/null; then
  printf '%s update skipped: lock exists\n' "$(timestamp)" >> "$LOG"
  exit 0
fi
cleanup() {
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
  return 1
}

CURL="$(find_cmd /usr/bin/curl /bin/curl)"
UNZIP="$(find_cmd /usr/bin/unzip /bin/unzip)"
RSYNC="$(find_cmd /usr/bin/rsync /bin/rsync)"
SHA256SUM="$(find_cmd /usr/bin/sha256sum /bin/sha256sum)"
DOCKER="$(find_cmd /var/packages/ContainerManager/target/usr/bin/docker /usr/local/bin/docker /usr/bin/docker)"

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

rm -rf "$UNPACK"
mkdir -p "$UNPACK"
mv "$ARCHIVE.tmp" "$ARCHIVE"
"$UNZIP" -q "$ARCHIVE" -d "$UNPACK"
for required in package.json Dockerfile.nas compose.nas.yml scripts/nas/smoke.mjs; do
  if [ ! -f "$SOURCE/$required" ]; then
    printf '%s update failed: archive validation\n' "$(timestamp)" >> "$LOG"
    exit 1
  fi
done

# Never delete or overwrite NAS-only secrets and deployment state.
"$RSYNC" -a --delete \
  --exclude '/runtime/' \
  --exclude '/compose.yaml' \
  --exclude '/.deploy/' \
  "$SOURCE/" "$APP/"
cp "$APP/compose.nas.yml" "$APP/compose.yaml"

cd "$APP"
"$DOCKER" compose -f compose.yaml up -d --build --remove-orphans
"$CURL" --fail --silent --show-error --max-time 30 "$PREVIEW/robots.txt" >/dev/null
"$CURL" --fail --silent --show-error --max-time 30 "$PREVIEW/sitemap.xml" >/dev/null

printf '%s\n' "$NEW_HASH" > "$HASH_FILE"
printf '%s update complete\n' "$(timestamp)" >> "$LOG"
