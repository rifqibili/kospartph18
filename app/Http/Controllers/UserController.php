<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get all users (Super Admin only)
     */
    public function index()
    {
        $user = Auth::user();
        if ($user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $users = User::with(['bookings' => function($query) {
            $query->whereIn('status', ['active', 'pending'])->with('room.branch');
        }])->orderBy('created_at', 'desc')->get();
        
        return response()->json($users);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $admin = Auth::user();
        if ($admin->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => ['required', Rule::in(['super_admin', 'operator', 'resident', 'karyawan'])],
            'phone' => 'nullable|string|max:20',
            'assigned_branches' => 'nullable|array'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
            'assigned_branches' => in_array($request->role, ['operator', 'karyawan']) ? $request->assigned_branches : null,
        ]);

        return response()->json(['message' => 'Pengguna berhasil ditambahkan', 'user' => $user]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, $id)
    {
        $admin = Auth::user();
        if ($admin->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', Rule::in(['super_admin', 'operator', 'resident', 'karyawan'])],
            'phone' => 'nullable|string|max:20',
            'assigned_branches' => 'nullable|array'
        ]);

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'phone' => $request->phone,
            'assigned_branches' => in_array($request->role, ['operator', 'karyawan']) ? $request->assigned_branches : null,
        ];

        if ($request->filled('password')) {
            $request->validate(['password' => 'string|min:6']);
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json(['message' => 'Data pengguna berhasil diperbarui', 'user' => $user]);
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy($id)
    {
        $admin = Auth::user();
        if ($admin->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($admin->id == $id) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri'], 400);
        }

        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'Pengguna berhasil dihapus']);
    }
}
