// TecHive service worker — FLEET-0071, S230.
//
// Network-first passthrough ONLY. NO offline caching of member data —
// privacy over cleverness (packet requirement). This worker's entire job is
// to make the app installable (a fetch handler is what most browsers use
// to decide a page qualifies as a PWA); it never intercepts a response to
// serve stale/cached content, and it never stores approval drafts, inbox
// data, or any other member content in a Cache API store.
//
// skipWaiting()/clients.claim() on install/activate so a redeploy takes
// over immediately rather than waiting for every open tab to close first —
// there is no cached payload here that a stale worker would be protecting
// anyway.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Passthrough — always hit the network, never read or write a Cache API
  // store. Explicit no-op beyond letting the browser handle it by default,
  // written out for clarity of intent rather than omitting the handler.
  event.respondWith(fetch(event.request));
});
