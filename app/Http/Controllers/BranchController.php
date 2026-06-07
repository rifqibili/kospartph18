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
        ]);

        $branch = Branch::create($request->all());

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
        ]);

        $branch = Branch::findOrFail($id);
        $branch->update($request->all());

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
