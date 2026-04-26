#!/bin/bash

# ----------------------------
# CONFIGURATION
# ----------------------------

CACHE_PREFIX="mandarin"

# Exclusion list (supports exact names, folders, and wildcards like *.icloud)
EXCLUDES="
sw.js
generate-sw.sh
*.icloud
.git
.gitignore
notes.txt
resources
deploy.sh
.codex
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
async function updateCache(request, response) {
  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
}

function shouldUseNetworkFirst(request) {
  const url = new URL(request.url);
  return request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
}

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
  if (e.request.method !== 'GET') {
    return;
  }

  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (!cached) {
      return fetch(e.request);
    }

    if (!shouldUseNetworkFirst(e.request)) {
      return cached;
    }

    try {
      const response = await fetch(e.request);
      await updateCache(e.request, response);
      return response;
    } catch (error) {
      return cached;
    }
  })());
});
EOF
} > sw.js

# ----------------------------
# UPDATE PWA SCRIPTS TO USE CACHE_NAME AS QUERY PARAM (NO BACKUP)
# ----------------------------

UPDATED_PWA_FILES=""

if [ -f pwa.js ]; then
  sed -i'' -E "s|navigator\.serviceWorker\.register\('sw\.js(\?[^']*)?'\)|navigator.serviceWorker.register('sw.js?v=${UUID}')|g" pwa.js
  UPDATED_PWA_FILES="${UPDATED_PWA_FILES} pwa.js"
fi

if [ -f cards/pwa.js ]; then
  sed -i'' -E "s|navigator\.serviceWorker\.register\('\.\./sw\.js(\?[^']*)?'\)|navigator.serviceWorker.register('../sw.js?v=${UUID}')|g" cards/pwa.js
  UPDATED_PWA_FILES="${UPDATED_PWA_FILES} cards/pwa.js"
fi

# ----------------------------
# SUMMARY OUTPUT
# ----------------------------

echo ""
echo "============================================================"
echo "  ✔ Service Worker Generated"
echo "============================================================"
echo "  Cache name:     $CACHE_NAME"
echo "  Files cached:   $INCLUDE_COUNT"
echo "  PWA files updated:${UPDATED_PWA_FILES:- none}"
echo ""

echo "Done. 🚀"
