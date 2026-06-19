<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::user();

        // Admin, operator, dan karyawan langsung ke dashboard
        if (in_array($user->role, ['super_admin', 'operator', 'karyawan'])) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        // Cek apakah penghuni memiliki kamar (aktif, pending, maupun selesai)
        $hasBooking = \App\Models\Booking::where('tenant_id', $user->id)
            ->whereIn('status', ['active', 'pending', 'completed'])
            ->exists();

        if ($hasBooking) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        // Tidak punya kamar → ke halaman cari kamar
        return redirect()->intended(route('rooms.index', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
