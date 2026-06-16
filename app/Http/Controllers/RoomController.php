<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoomController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $query = Room::with('branch');

        // Operator branch restriction
        if ($user && $user->role === 'operator' && is_array($user->assigned_branches)) {
            $query->whereIn('branch_id', $user->assigned_branches);
        } elseif ($user && $user->role === 'resident') {
            // Resident should only see rooms they have active bookings in (for complaints dropdown)
            $query->whereHas('bookings', function($q) use ($user) {
                $q->where('tenant_id', $user->id)->where('status', 'active');
            });
        }

        return response()->json($query->orderBy('room_number')->get());
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'room_number' => 'required|string|max:50',
            'price_monthly' => 'required|numeric|min:0',
            'price_daily' => 'required|numeric|min:0',
            'price_weekly' => 'required|numeric|min:0',
            'price_yearly' => 'required|numeric|min:0',
            'price_weekend' => 'nullable|numeric|min:0',
            'status' => 'required|in:available,occupied,booked,maintenance,cleaning',
            'facilities' => 'nullable|array',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:5120',
            'videos' => 'nullable|array',
            'videos.*' => 'mimes:mp4,mov,ogg,qt|max:20480',
        ]);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($request->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch access.'], 403);
            }
        }

        $data = $request->except(['photos', 'videos']);
        
        if ($request->hasFile('photos')) {
            $photosPaths = [];
            foreach ($request->file('photos') as $photo) {
                $photosPaths[] = '/storage/' . $photo->store('room_photos', 'public');
            }
            $data['photos'] = $photosPaths;
        }

        if ($request->hasFile('videos')) {
            $videosPaths = [];
            foreach ($request->file('videos') as $video) {
                $videosPaths[] = '/storage/' . $video->store('room_videos', 'public');
            }
            $data['videos'] = $videosPaths;
        }

        $room = Room::create($data);

        return response()->json(['message' => 'Kamar berhasil ditambahkan.', 'room' => $room]);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if ($user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'room_number' => 'required|string|max:50',
            'price_monthly' => 'required|numeric|min:0',
            'price_daily' => 'required|numeric|min:0',
            'price_weekly' => 'required|numeric|min:0',
            'price_yearly' => 'required|numeric|min:0',
            'price_weekend' => 'nullable|numeric|min:0',
            'status' => 'required|in:available,occupied,booked,maintenance,cleaning',
            'facilities' => 'nullable|array',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'existing_photos' => 'nullable|array',
            'existing_photos.*' => 'string',
            'existing_videos' => 'nullable|array',
            'existing_videos.*' => 'string',
            'new_photos' => 'nullable|array',
            'new_photos.*' => 'image|max:5120',
            'new_videos' => 'nullable|array',
            'new_videos.*' => 'mimes:mp4,mov,ogg,qt|max:20480',
        ]);

        $room = Room::findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($room->branch_id, $user->assigned_branches) || !in_array($request->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch access.'], 403);
            }
        }

        $data = $request->except(['existing_photos', 'existing_videos', 'new_photos', 'new_videos']);
        
        $photosPaths = $request->input('existing_photos', []);
        if ($request->hasFile('new_photos')) {
            foreach ($request->file('new_photos') as $photo) {
                $photosPaths[] = '/storage/' . $photo->store('room_photos', 'public');
            }
        }
        $data['photos'] = empty($photosPaths) ? null : $photosPaths;

        $videosPaths = $request->input('existing_videos', []);
        if ($request->hasFile('new_videos')) {
            foreach ($request->file('new_videos') as $video) {
                $videosPaths[] = '/storage/' . $video->store('room_videos', 'public');
            }
        }
        $data['videos'] = empty($videosPaths) ? null : $videosPaths;

        $room->update($data);

        return response()->json(['message' => 'Kamar berhasil diperbarui.', 'room' => $room]);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        if ($user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $room = Room::findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($room->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch access.'], 403);
            }
        }

        $room->delete();

        return response()->json(['message' => 'Kamar berhasil dihapus.']);
    }

    public function finishCleaning($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $room = Room::findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($room->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch access.'], 403);
            }
        }

        if ($room->status !== 'cleaning') {
            return response()->json(['message' => 'Kamar tidak sedang dalam proses pembersihan.'], 400);
        }

        $room->update(['status' => 'available']);

        return response()->json(['message' => 'Pembersihan selesai, kamar kini tersedia.']);
    }
}
