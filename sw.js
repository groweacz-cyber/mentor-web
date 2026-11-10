// Service worker webu ocdmentor.cz. Generuje ho tools/gen.mjs (verze se mění s obsahem webu).
// Ukládá jen vlastní statické soubory (/assets/) a stránky, které si návštěvník otevřel. HTML jde přes síť jako první,
// při výpadku se zobrazí uložená stránka nebo /offline. Cizí adresy (například rezervace Reservanto) vůbec nezachytává.
var VERSION = '01439203';
var CACHE = 'ocdmentor-' + VERSION;
var OFFLINE = '/offline';
var OFFLINE_EN = '/en/offline';
var OFFLINE_SK = '/sk/offline';

// Při výpadku sítě se anglickým stránkám (/en/…) ukáže anglická offline stránka, slovenským (/sk/…) slovenská, ostatním česká.
function offlineFor(pathname) {
  if (pathname === '/en' || pathname.indexOf('/en/') === 0) return OFFLINE_EN;
  if (pathname === '/sk' || pathname.indexOf('/sk/') === 0) return OFFLINE_SK;
  return OFFLINE;
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll([OFFLINE, OFFLINE_EN, OFFLINE_SK, '/assets/img/favicon.svg']);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/\.(mp4|webm|pdf)$/.test(url.pathname) || req.headers.has('range')) return;

  // HTML: nejdřív síť, při výpadku uložená stránka, jinak offline stránka
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function (res) {
        if (res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (m) { return m || caches.match(offlineFor(url.pathname)); });
      })
    );
    return;
  }

  // Statické soubory: uložená kopie hned, na pozadí se obnoví
  if (url.pathname.indexOf('/assets/') === 0) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        var network = fetch(req).then(function (res) {
          if (res.ok) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        }).catch(function () { return cached; });
        return cached || network;
      })
    );
  }
});
