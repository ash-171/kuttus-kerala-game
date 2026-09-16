// Offline-capable service worker.
//
// The app shell (HTML/CSS/JS/manifest) is fetched network-first: whenever
// the player is online they always get the latest deployed code, and the
// cache is only a fallback for offline play — so a GitHub Pages update is
// visible immediately on next load instead of being stuck behind a stale
// cached copy. Everything else (art, sfx — content that doesn't change
// once shipped) is served cache-first with a background refresh, since
// re-fetching those on every load would be wasteful.
var CACHE_NAME = "arus-kerala-v2";
var CORE_ASSETS = ["./", "./index.html", "./style.css", "./game.js", "./manifest.json"];
var CORE_PATHS = ["/", "/index.html", "/style.css", "/game.js", "/manifest.json", "/service-worker.js"];

function isCorePath(pathname) {
  return CORE_PATHS.indexOf(pathname) !== -1 || /\/(index\.html|style\.css|game\.js|manifest\.json)$/.test(pathname);
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(CORE_ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("message", function (event) {
  if (event.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isCorePath(url.pathname)) {
    // Network-first: always prefer the live version when online.
    event.respondWith(
      fetch(event.request).then(function (response) {
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        }
        return response;
      }).catch(function () { return caches.match(event.request); })
    );
    return;
  }

  // Cache-first, refreshing the cache in the background for next time.
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var networkFetch = fetch(event.request).then(function (response) {
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        }
        return response;
      }).catch(function () { return cached; });
      return cached || networkFetch;
    })
  );
});
