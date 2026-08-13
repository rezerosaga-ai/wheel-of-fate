// ─── Wheel of Fate — Service Worker ─────────────────────────────────────────
// Cache-first for static assets, network-first for API calls
// Supports: offline fallback, background sync, push notifications ready

const CACHE_NAME = 'wof-v2';
const STATIC_CACHE = 'wof-static-v2';
const API_CACHE = 'wof-api-v1';

// الموارد التي تُحفظ دائماً
const PRECACHE_URLS = [
  '/',
  '/privacy',
  '/terms',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // تجاهل أخطاء التخزين المؤقت لعدم إيقاف التثبيت
      });
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch Strategy ──────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل non-GET و chrome-extension
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // API calls → network-first, لا نخزنها
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // _next/static → cache-first (ملفات JS/CSS)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Pages → stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached || offlineFallback());

      return cached || fetchPromise;
    })
  );
});

// ─── Offline Fallback ────────────────────────────────────────────────────────
function offlineFallback() {
  return new Response(
    `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Wheel of Fate — غير متصل</title>
  <style>
    body { font-family: Cairo, sans-serif; background: #FFF0F5; display: flex;
           flex-direction: column; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
    h1 { font-size: 24px; color: #FF4D8D; }
    p  { color: #888; font-size: 15px; line-height: 1.7; }
    button { background: #FF4D8D; color: white; border: none; border-radius: 16px;
             padding: 14px 32px; font-size: 16px; font-family: Cairo, sans-serif;
             cursor: pointer; margin-top: 16px; }
  </style>
</head>
<body>
  <div style="font-size:64px">🎡</div>
  <h1>لا يوجد اتصال بالإنترنت</h1>
  <p>تحقق من اتصالك وحاول مرة أخرى.<br>اللعبة تحتاج اتصالاً لمزامنة الغرفة.</p>
  <button onclick="location.reload()">🔄 إعادة المحاولة</button>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

// ─── Push Notifications (جاهز للمرحلة 3) ────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Wheel of Fate 🎡', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      dir: 'rtl',
      lang: 'ar',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
