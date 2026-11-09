// 離線快取：頁面「網路優先」，字型「快取優先」（出國漫遊不穩也能看行程）
const CACHE = 'cebu2026-v3';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-180.png', './icon-192.png', './icon-512.png'];
// 景點照片（約 4MB）：安裝後於背景預先快取，不阻塞安裝；失敗也不影響其他功能
const PHOTOS = ['d1-magellan','d1-santonino','d1-fort','d1-panglao','d2-dolphin','d2-reef','d2-balicasag','d2-balicasag-air','d2-alona',
  'd3-tarsier','d3-chocolate','d3-loboc','d3-loboc2','d3-bloodcompact','d3-cathedral','d3-chocolate2',
  'd4-whaleshark','d4-whaleshark2','d4-cuartel','d4-oslobchurch','d5-airport','d5-skyline'].map(n => './photos/' + n + '.jpg');
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
  caches.open(CACHE).then(c => Promise.all(PHOTOS.map(u => c.match(u).then(hit => hit || c.add(u).catch(() => {}))))).catch(() => {});
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('./index.html')))
  );
});
