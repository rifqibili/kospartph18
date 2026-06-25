<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SettingController extends Controller
{
    /**
     * Return all settings as key => value pairs.
     * Public (no auth) so Landing pages can fetch them too.
     */
    public function index()
    {
        return response()->json(Setting::allAsArray());
    }

    /**
     * Update one or more settings at once.
     * Only super_admin can modify.
     */
    public function update(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string|max:100',
            'settings.*.value' => 'nullable|string|max:1000',
        ]);

        foreach ($request->settings as $item) {
            Setting::updateOrCreate(
                ['key' => $item['key']],
                ['value' => $item['value'] ?? null]
            );
        }

        return response()->json([
            'message' => 'Pengaturan berhasil disimpan.',
            'settings' => Setting::allAsArray(),
        ]);
    }
}
