<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user) {
            return response()->json(Branch::all());
        }

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            return response()->json(Branch::whereIn('id', $user->assigned_branches)->get());
        } elseif ($user->role === 'resident') {
            return response()->json(Branch::whereHas('rooms.bookings', function($q) use ($user) {
                $q->where('tenant_id', $user->id)->where('status', 'active');
            })->get());
        }

        return response()->json(Branch::all());
    }

    public function store(Request $request)
    {
        if (\Illuminate\Support\Facades\Auth::user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'maps_link' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|image|max:5120',
            'video' => 'nullable|mimes:mp4,mov,ogg,qt|max:20480',
        ]);

        $data = $request->except(['image', 'video']);

        if ($request->hasFile('image')) {
            $data['image_path'] = '/storage/' . $request->file('image')->store('branch_images', 'public');
        }

        if ($request->hasFile('video')) {
            $data['video_path'] = '/storage/' . $request->file('video')->store('branch_videos', 'public');
        }

        $branch = Branch::create($data);

        return response()->json(['message' => 'Cabang berhasil ditambahkan.', 'branch' => $branch]);
    }

    public function update(Request $request, $id)
    {
        if (\Illuminate\Support\Facades\Auth::user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'maps_link' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|image|max:5120',
            'video' => 'nullable|mimes:mp4,mov,ogg,qt|max:20480',
        ]);

        $branch = Branch::findOrFail($id);
        $data = $request->except(['image', 'video']);

        if ($request->hasFile('image')) {
            $data['image_path'] = '/storage/' . $request->file('image')->store('branch_images', 'public');
        }

        if ($request->hasFile('video')) {
            $data['video_path'] = '/storage/' . $request->file('video')->store('branch_videos', 'public');
        }

        $branch->update($data);

        return response()->json(['message' => 'Cabang berhasil diperbarui.', 'branch' => $branch]);
    }

    public function destroy($id)
    {
        if (\Illuminate\Support\Facades\Auth::user()->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $branch = Branch::findOrFail($id);
        $branch->delete();

        return response()->json(['message' => 'Cabang berhasil dihapus.']);
    }
}
