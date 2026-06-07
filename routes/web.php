<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\RoomController;
use Illuminate\Support\Facades\Route;

// Guest Landing Page
Route::get('/', [LandingController::class, 'index'])->name('home');
Route::get('/kamar', [LandingController::class, 'rooms'])->name('rooms.index');
Route::get('/cabang', [LandingController::class, 'branches'])->name('branches.index');

// Guest Booking API Operations
Route::post('/api/guest/bookings', [BookingController::class, 'store']);
Route::post('/api/guest/bookings/verify-otp', [BookingController::class, 'verifyOtp']);
Route::post('/api/guest/bookings/{id}/payment-proof', [BookingController::class, 'uploadPaymentProof']);

// Authenticated Routes
Route::middleware(['auth'])->group(function () {
    // Render Dashboard View
    Route::get('/dashboard', [DashboardController::class, 'view'])->name('dashboard');
    
    // Fetch Dashboard Stats & Notifications
    Route::get('/api/dashboard/data', [DashboardController::class, 'index']);
    
    // Profile Management
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Admin & Resident Booking Operations
    Route::get('/api/bookings', [BookingController::class, 'index']);
    Route::post('/api/bookings/{id}/approve', [BookingController::class, 'approveBooking']);
    Route::post('/api/bookings/{id}/change-room', [BookingController::class, 'changeRoom']);
    Route::post('/api/bookings/{id}/reschedule-bill', [BookingController::class, 'rescheduleBill']);
    Route::post('/api/bookings/{id}/checkout', [BookingController::class, 'checkout']);
    Route::post('/api/bookings/{id}/pay', [BookingController::class, 'uploadPaymentProofAuth']);

    // Complaints Management
    Route::get('/api/complaints', [ComplaintController::class, 'index']);
    Route::post('/api/complaints', [ComplaintController::class, 'store']);
    Route::post('/api/complaints/{id}/status', [ComplaintController::class, 'updateStatus']);

    // Finance Management
    Route::get('/api/finances', [FinanceController::class, 'index']);
    Route::post('/api/finances', [FinanceController::class, 'store']);
    Route::get('/api/finances/chart', [FinanceController::class, 'chartData']);

    // Branches & Rooms Management (Master Data)
    Route::apiResource('/api/branches', BranchController::class);
    Route::apiResource('/api/rooms', RoomController::class);
});

require __DIR__.'/auth.php';
