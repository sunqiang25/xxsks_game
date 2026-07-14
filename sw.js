// Service Worker：网络优先 + 缓存兜底（保证用户总能拿到最新代码，断网时才用缓存）
// 改动文件后把 CACHE 版本号 +1
const CACHE = 'mathquest-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/questions.js',
  './js/levels.js',
  './js/english.js',
  './js/subjects.js',
  './js/storage.js',
  './js/sound.js',
  './js/game.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 网络优先：总是先请求最新文件，成功就回填缓存；失败（断网）才用缓存兜底
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((resp) => {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
