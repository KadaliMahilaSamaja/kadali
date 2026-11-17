/*
 * Kadali's service worker — hand-written, no build step (public/ is copied
 * verbatim into dist/ by the deploy). Plain, small, and deliberately boring:
 *
 *   navigations  → network-first, cached copy as fallback, then /offline.html
 *   /_astro/*    → cache-first (hashed, immutable filenames)
 *   /images/*    → stale-while-revalidate, capped so uploads can't pile up
 *   other GETs   → network, falling back to the cache (favicon.svg and friends)
 *
 * The admin area (/admin/) is never intercepted: Sveltia CMS must always talk
 * to the network. Bump VERSION whenever offline.html or the routing rules
 * change — page HTML itself is network-first, so content changes need no bump.
 */

const VERSION = 'v1';
const PAGE_CACHE = `kadali-pages-${VERSION}`;
const STATIC_CACHE = `kadali-static-${VERSION}`;
const IMAGE_CACHE = `kadali-images-${VERSION}`;
const CACHES = [PAGE_CACHE, STATIC_CACHE, IMAGE_CACHE];

const OFFLINE_URL = '/offline.html';
const IMAGE_LIMIT = 60;
const STATIC_LIMIT = 120;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      // cache:'reload' — fetch straight from the network, not the HTTP cache,
      // so the precached fallback is never a stale copy.
      await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
      self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith('kadali-') && !CACHES.includes(name)) {
          await caches.delete(name);
        }
      }
      await self.clients.claim();
    })(),
  );
});

/** Keep a cache from growing without end; keys() is oldest-insertion first. */
async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) {
    await cache.delete(key);
  }
}

async function cacheFirst(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
    trimCache(cacheName, limit);
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const fresh = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        trimCache(cacheName, limit);
      }
      return response;
    })
    .catch(() => undefined);
  return hit ?? (await fresh) ?? Response.error();
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const hit = await cache.match(request);
    if (hit) return hit;
    // Only navigations get the offline fallback; stray failed fetches just fail.
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    throw new Error('offline and not cached');
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never touch the CMS area or the worker/manifest themselves.
  if (url.pathname.startsWith('/admin/')) return;
  if (url.pathname === '/sw.js' || url.pathname === '/manifest.webmanifest') {
    return;
  }
  // Range requests (partial media fetches) don't fit whole-response caches.
  if (request.headers.has('range')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGE_CACHE));
  } else if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, STATIC_LIMIT));
  } else if (url.pathname.startsWith('/images/')) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, IMAGE_LIMIT));
  } else {
    event.respondWith(networkFirst(request, STATIC_CACHE));
  }
});
