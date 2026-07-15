import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * PushNotificationManager
 * Komponen React yang handle:
 * - Register Service Worker
 * - Minta izin notifikasi ke user
 * - Subscribe ke Push dan kirim endpoint ke backend
 * - UI toggle on/off notifikasi
 */
export default function PushNotificationManager({ className = '' }) {
    const [status, setStatus]         = useState('idle'); // idle | unsupported | denied | granted | loading
    const [subscription, setSubscription] = useState(null);
    const [showBanner, setShowBanner] = useState(false);

    // Cek support & status awal
    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setStatus('unsupported');
            return;
        }

        const permission = Notification.permission;
        if (permission === 'denied') {
            setStatus('denied');
            return;
        }

        // Cek apakah sudah subscribe
        navigator.serviceWorker.ready.then((reg) => {
            reg.pushManager.getSubscription().then((sub) => {
                if (sub) {
                    setSubscription(sub);
                    setStatus('granted');
                } else if (permission === 'default') {
                    // Belum pernah minta izin — tampilkan banner setelah 3 detik
                    setTimeout(() => setShowBanner(true), 3000);
                }
            });
        });
    }, []);

    // Konversi VAPID public key dari base64url ke Uint8Array
    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
    };

    // Subscribe ke Push
    const subscribe = useCallback(async () => {
        setStatus('loading');
        setShowBanner(false);
        try {
            // Daftarkan Service Worker kalau belum
            const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            await navigator.serviceWorker.ready;

            // Ambil VAPID public key dari backend
            const { data } = await axios.get('/api/push/vapid-key');
            const vapidKey  = urlBase64ToUint8Array(data.public_key);

            // Subscribe ke push manager browser
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly:      true,
                applicationServerKey: vapidKey,
            });

            // Kirim subscription ke backend
            const subJson = sub.toJSON();
            await axios.post('/api/push/subscribe', {
                endpoint:   sub.endpoint,
                keys: {
                    p256dh: subJson.keys.p256dh,
                    auth:   subJson.keys.auth,
                },
            });

            setSubscription(sub);
            setStatus('granted');
        } catch (err) {
            console.error('Push subscribe error:', err);
            if (Notification.permission === 'denied') {
                setStatus('denied');
            } else {
                setStatus('idle');
            }
        }
    }, []);

    // Unsubscribe dari Push
    const unsubscribe = useCallback(async () => {
        if (!subscription) return;
        setStatus('loading');
        try {
            await axios.post('/api/push/unsubscribe', {
                endpoint: subscription.endpoint,
            });
            await subscription.unsubscribe();
            setSubscription(null);
            setStatus('idle');
            setShowBanner(true);
        } catch (err) {
            console.error('Push unsubscribe error:', err);
            setStatus('granted');
        }
    }, [subscription]);

    // --- Render ---

    // Browser tidak support
    if (status === 'unsupported') return null;

    // Kalau sudah granted — tampilkan tombol kecil toggle
    if (status === 'granted') {
        return (
            <button
                onClick={unsubscribe}
                title="Notifikasi aktif. Klik untuk matikan."
                className={`group flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-semibold transition-all ${className}`}
                style={{
                    background: 'linear-gradient(135deg, #16a34a22, #16a34a11)',
                    border: '1px solid #16a34a55',
                    color: '#16a34a',
                }}
            >
                <span className="relative flex h-2 w-2">
                    <span
                        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                        style={{ background: '#16a34a' }}
                    />
                    <span
                        className="relative inline-flex rounded-full h-2 w-2"
                        style={{ background: '#16a34a' }}
                    />
                </span>
                Notif Aktif
            </button>
        );
    }

    // Izin ditolak — tampilkan hint kecil
    if (status === 'denied') {
        return (
            <span
                title="Notifikasi diblokir browser. Ubah di pengaturan browser."
                className={`text-xs px-2.5 py-1.5 rounded-full font-semibold ${className}`}
                style={{
                    background: '#ef444422',
                    border: '1px solid #ef444455',
                    color: '#ef4444',
                    cursor: 'default',
                }}
            >
                🔕 Notif Diblokir
            </span>
        );
    }

    // Loading
    if (status === 'loading') {
        return (
            <span
                className={`text-xs px-2.5 py-1.5 rounded-full font-semibold ${className}`}
                style={{
                    background: '#c9a84c22',
                    border: '1px solid #c9a84c55',
                    color: '#c9a84c',
                    cursor: 'default',
                }}
            >
                ⏳ Mengaktifkan...
            </span>
        );
    }

    // Banner permintaan izin
    if (showBanner) {
        return (
            <div
                className="fixed bottom-5 left-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
                style={{
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #0f2117ee, #1a3d2bee)',
                    border: '1px solid rgba(201,168,76,0.3)',
                    backdropFilter: 'blur(16px)',
                    maxWidth: '90vw',
                    animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
            >
                <style>{`
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                    }
                `}</style>
                <span style={{ fontSize: 28 }}>🔔</span>
                <div className="flex flex-col">
                    <span className="text-white font-bold text-sm">Aktifkan Notifikasi</span>
                    <span className="text-gray-300 text-xs">Dapatkan info pesanan & update langsung di HP/PC kamu</span>
                </div>
                <div className="flex gap-2 ml-2">
                    <button
                        onClick={subscribe}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #c9a84c, #e0cb82)',
                            color: '#0f2117',
                        }}
                    >
                        Aktifkan
                    </button>
                    <button
                        onClick={() => setShowBanner(false)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            color: '#ffffff99',
                        }}
                    >
                        Nanti
                    </button>
                </div>
            </div>
        );
    }

    // Default: tombol kecil untuk aktifkan
    return (
        <button
            onClick={subscribe}
            title="Aktifkan notifikasi push"
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-semibold transition-all hover:opacity-80 active:scale-95 ${className}`}
            style={{
                background: 'rgba(201,168,76,0.15)',
                border: '1px solid rgba(201,168,76,0.4)',
                color: '#c9a84c',
            }}
        >
            🔔 Aktifkan Notif
        </button>
    );
}
