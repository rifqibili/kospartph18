// ============================================================
// KOSPART PH 18 — Service Worker for Web Push Notifications
// ============================================================

// Versi cache — update ini untuk invalidate cache lama
const CACHE_VERSION = 'kospart-sw-v1';

// ──────────────────────────────────────────────────────────────
// 1. PUSH EVENT — Muncul saat server kirim notifikasi
// ──────────────────────────────────────────────────────────────
self.addEventListener('push', function (event) {
    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'KOSPART PH 18',
            body: event.data.text(),
            url: '/',
        };
    }

    const title   = data.title || 'KOSPART PH 18';
    const options = {
        body:    data.body || '',
        icon:    data.icon  || '/images/logo 2.jpeg',
        badge:   data.badge || '/images/logo 2.jpeg',
        data:    { url: data.url || '/dashboard' },
        vibrate: [200, 100, 200],
        tag:     'kospart-notification',
        renotify: true,
        requireInteraction: false,
        actions: [
            { action: 'open',    title: 'Buka Aplikasi' },
            { action: 'dismiss', title: 'Tutup' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ──────────────────────────────────────────────────────────────
// 2. NOTIFICATION CLICK — Ketika user klik notifikasi
// ──────────────────────────────────────────────────────────────
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const urlToOpen = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Kalau tab sudah terbuka, focus ke tab itu
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // Kalau belum ada tab terbuka, buka tab baru
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// ──────────────────────────────────────────────────────────────
// 3. PUSH SUBSCRIPTION CHANGE — Kalau browser ganti endpoint
// ──────────────────────────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', function (event) {
    event.waitUntil(
        self.registration.pushManager.subscribe(event.oldSubscription.options)
            .then(function (subscription) {
                // Kirim subscription baru ke backend
                return fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '', // akan di-handle oleh backend via Sanctum/session
                    },
                    body: JSON.stringify(subscription),
                    credentials: 'include',
                });
            })
    );
});
