#!/bin/bash

# ----------------------------
# CONFIGURATION
# ----------------------------

CACHE_PREFIX="counting"

# Exclusion list (supports exact names, folders, and wildcards like *.icloud)
EXCLUDES="
sw.js
generate-sw.sh
*.icloud
.git
.gitignore
notes.txt
resources
"

# ----------------------------
# BUILD FIND EXCLUSION RULES
# ----------------------------

EXCLUDE_EXPR=""
for ITEM in $EXCLUDES; do
  ITEM=$(echo "$ITEM" | sed 's/^[ \t]*//;s/[ \t]*$//')
  [ -z "$ITEM" ] && continue

  if [[ "$ITEM" == *"*"* ]]; then
    EXCLUDE_EXPR+=" -not -name \"$ITEM\""
  else
    EXCLUDE_EXPR+=" -not -path \"./$ITEM\" -not -path \"./$ITEM/*\""
  fi
done

# ----------------------------
# COLLECT FILE LISTS
# ----------------------------

ALL_FILES=$(find . -type f | sort)

# shellcheck disable=SC2086
INCLUDED_FILES=$(eval find . -type f $EXCLUDE_EXPR | sort)

INCLUDE_COUNT=$(printf "%s\n" "$INCLUDED_FILES" | sed '/^$/d' | wc -l | tr -d ' ')

# ----------------------------
# GENERATE RANDOM UUID
# ----------------------------

if command -v uuidgen >/dev/null 2>&1; then
  UUID=$(uuidgen)
elif [[ -f /proc/sys/kernel/random/uuid ]]; then
  UUID=$(cat /proc/sys/kernel/random/uuid)
else
  UUID=$(openssl rand -hex 16)
fi

CACHE_NAME="${CACHE_PREFIX}-${UUID}"

# ----------------------------
# WRITE sw.js
# ----------------------------

{
  echo "const cacheName = '$CACHE_NAME';"
  echo "const appShellFiles = ["

  while read -r FILE; do
    [[ -z "$FILE" ]] && continue
    echo "  '$FILE',"
  done <<< "$INCLUDED_FILES"

  echo "];"
  echo ""
  cat <<'EOF'
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(appShellFiles);
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    for (const key of keys) {
      if (key !== cacheName) {
        await caches.delete(key);
      }
    }
  })());
});

self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    if (r) { return r; }
    const response = await fetch(e.request);
    const cache = await caches.open(cacheName);
    cache.put(e.request, response.clone());
    return response;
  })());
});
EOF
} > sw.js

# ----------------------------
# SUMMARY OUTPUT
# ----------------------------

echo ""
echo "============================================================"
echo "  ✔ Service Worker Generated"
echo "============================================================"
echo "  Cache name:     $CACHE_NAME"
echo "  Files cached:   $INCLUDE_COUNT"
echo ""

echo "Done. 🚀"
