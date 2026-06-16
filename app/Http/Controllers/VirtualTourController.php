<?php

namespace App\Http\Controllers;

use App\Models\VirtualTour;
use Illuminate\Http\Request;

class VirtualTourController extends Controller
{
    public function index()
    {
        return response()->json(VirtualTour::orderBy('order')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'video' => 'required|file|mimetypes:video/mp4,video/quicktime|max:50000', // 50MB max
            'is_active' => 'boolean',
            'order' => 'integer',
        ]);

        $videoPath = '/storage/' . $request->file('video')->store('virtual_tours', 'public');

        $tour = VirtualTour::create([
            'title' => $request->title,
            'video_path' => $videoPath,
            'is_active' => $request->boolean('is_active', true),
            'order' => $request->integer('order', 0),
        ]);

        return response()->json(['message' => 'Virtual Tour berhasil ditambahkan', 'tour' => $tour]);
    }

    public function update(Request $request, $id)
    {
        $tour = VirtualTour::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'is_active' => 'boolean',
            'order' => 'integer',
        ]);

        $tour->title = $request->title;
        $tour->is_active = $request->boolean('is_active');
        $tour->order = $request->integer('order');

        if ($request->hasFile('video')) {
            $request->validate([
                'video' => 'file|mimetypes:video/mp4,video/quicktime|max:50000',
            ]);
            $tour->video_path = '/storage/' . $request->file('video')->store('virtual_tours', 'public');
        }

        $tour->save();

        return response()->json(['message' => 'Virtual Tour berhasil diperbarui', 'tour' => $tour]);
    }

    public function destroy($id)
    {
        $tour = VirtualTour::findOrFail($id);
        $tour->delete();

        return response()->json(['message' => 'Virtual Tour berhasil dihapus']);
    }
}
