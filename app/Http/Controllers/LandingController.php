<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    public function index(): Response
    {
        $branches = Branch::where('status', 'active')->get();
        $rooms = Room::with('branch')
            ->whereIn('status', ['available', 'occupied', 'booked', 'maintenance'])
            ->get();

        return Inertia::render('Welcome', [
            'branches' => $branches,
            'rooms' => $rooms,
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
        ]);
    }

    public function rooms(Request $request): Response
    {
        $branches = Branch::where('status', 'active')->get();
        $rooms = Room::with('branch')
            ->whereIn('status', ['available', 'occupied', 'booked', 'maintenance'])
            ->get();

        return Inertia::render('Rooms', [
            'branches' => $branches,
            'rooms' => $rooms,
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
        ]);
    }

    public function branches(): Response
    {
        $branches = Branch::withCount(['rooms as total_rooms'])
            ->withCount(['rooms as available_rooms' => function ($query) {
                $query->where('status', 'available');
            }])
            ->where('status', 'active')
            ->get();

        return Inertia::render('Branches', [
            'branches' => $branches,
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
        ]);
    }
}
