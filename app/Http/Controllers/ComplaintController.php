<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ComplaintController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $query = Complaint::with(['tenant', 'room.branch']);

        // Operator branch restriction
        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            $query->whereHas('room', function ($q) use ($user) {
                $q->whereIn('branch_id', $user->assigned_branches);
            });
        } elseif ($user->role === 'resident') {
            $query->where('tenant_id', $user->id);
        }

        $complaints = $query->orderBy('created_at', 'desc')->get();
        return response()->json($complaints);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'photo' => 'nullable|string', // base64 or string url simulation
        ]);

        if ($user->role === 'resident') {
            $hasBooking = \App\Models\Booking::where('tenant_id', $user->id)
                ->where('room_id', $request->room_id)
                ->where('status', 'active')
                ->exists();
            if (!$hasBooking) {
                return response()->json(['message' => 'Anda tidak menempati kamar ini.'], 403);
            }
        }

        $complaint = Complaint::create([
            'tenant_id' => $user->id,
            'room_id' => $request->room_id,
            'title' => $request->title,
            'description' => $request->description,
            'status' => 'pending',
            'photo' => $request->photo,
        ]);

        return response()->json([
            'message' => 'Komplain berhasil diajukan dan sedang menunggu konfirmasi pengelola.',
            'complaint' => $complaint
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'status' => 'required|in:pending,confirmed,processing,completed,ready',
            'admin_response' => 'nullable|string',
            'repair_photo' => 'nullable|string',
        ]);

        $complaint = Complaint::with('room')->findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($complaint->room->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch complaint access.'], 403);
            }
        }

        $complaint->update([
            'status' => $request->status,
            'admin_response' => $request->admin_response,
            'repair_photo' => $request->repair_photo,
        ]);

        return response()->json([
            'message' => 'Status komplain berhasil diperbarui menjadi ' . ucfirst($request->status),
            'complaint' => $complaint
        ]);
    }
}
