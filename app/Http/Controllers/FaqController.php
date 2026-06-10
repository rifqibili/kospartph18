<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function index()
    {
        return response()->json(Faq::orderBy('order')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'question' => 'required|string',
            'answer' => 'required|string',
            'is_active' => 'boolean',
            'order' => 'integer'
        ]);

        $faq = Faq::create($request->all());

        return response()->json([
            'message' => 'FAQ berhasil ditambahkan',
            'faq' => $faq
        ]);
    }

    public function update(Request $request, $id)
    {
        $faq = Faq::findOrFail($id);

        $request->validate([
            'question' => 'required|string',
            'answer' => 'required|string',
            'is_active' => 'boolean',
            'order' => 'integer'
        ]);

        $faq->update($request->all());

        return response()->json([
            'message' => 'FAQ berhasil diperbarui',
            'faq' => $faq
        ]);
    }

    public function destroy($id)
    {
        $faq = Faq::findOrFail($id);
        $faq->delete();

        return response()->json(['message' => 'FAQ berhasil dihapus']);
    }
}
