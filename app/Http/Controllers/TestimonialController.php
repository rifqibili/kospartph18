<?php

namespace App\Http\Controllers;

use App\Models\Testimonial;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    public function index()
    {
        return response()->json(Testimonial::orderBy('order')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
            'avatar' => 'nullable|string|max:50',
            'rating' => 'integer|min:1|max:5',
            'date_text' => 'required|string|max:255',
            'text' => 'required|string',
            'badge' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'order' => 'integer',
        ]);

        $testimonial = Testimonial::create($request->all());

        return response()->json(['message' => 'Testimoni berhasil ditambahkan', 'testimonial' => $testimonial]);
    }

    public function update(Request $request, $id)
    {
        $testimonial = Testimonial::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|string|max:255',
            'avatar' => 'nullable|string|max:50',
            'rating' => 'integer|min:1|max:5',
            'date_text' => 'required|string|max:255',
            'text' => 'required|string',
            'badge' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'order' => 'integer',
        ]);

        $testimonial->update($request->all());

        return response()->json(['message' => 'Testimoni berhasil diperbarui', 'testimonial' => $testimonial]);
    }

    public function destroy($id)
    {
        $testimonial = Testimonial::findOrFail($id);
        $testimonial->delete();

        return response()->json(['message' => 'Testimoni berhasil dihapus']);
    }
}
