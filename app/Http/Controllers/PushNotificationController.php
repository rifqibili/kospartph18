<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PushNotificationController extends Controller
{
    /**
     * Simpan atau update subscription browser ke DB.
     * Dipanggil dari frontend saat user mengizinkan notifikasi.
     */
    public function subscribe(Request $request)
    {
        $request->validate([
            'endpoint'   => 'required|string',
            'keys.p256dh' => 'required|string',
            'keys.auth'   => 'required|string',
        ]);

        $user = Auth::user();

        // Upsert: kalau endpoint sudah ada, update. Kalau belum, buat baru.
        PushSubscription::updateOrCreate(
            [
                'user_id'  => $user->id,
                'endpoint' => $request->input('endpoint'),
            ],
            [
                'public_key'       => $request->input('keys.p256dh'),
                'auth_token'       => $request->input('keys.auth'),
                'content_encoding' => 'aesgcm',
            ]
        );

        return response()->json(['message' => 'Subscription berhasil disimpan.']);
    }

    /**
     * Hapus subscription browser dari DB.
     * Dipanggil saat user mematikan notifikasi.
     */
    public function unsubscribe(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        PushSubscription::where('user_id', Auth::id())
            ->where('endpoint', $request->input('endpoint'))
            ->delete();

        return response()->json(['message' => 'Subscription dihapus.']);
    }

    /**
     * Return VAPID public key untuk frontend.
     */
    public function vapidPublicKey()
    {
        return response()->json([
            'public_key' => config('webpush.vapid.public_key'),
        ]);
    }
}
