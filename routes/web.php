<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\FaqController;
use App\Http\Controllers\VirtualTourController;
use App\Http\Controllers\TestimonialController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

// Guest Landing Page
Route::get('/', [LandingController::class, 'index'])->name('home');
Route::get('/kamar', [LandingController::class, 'rooms'])->name('rooms.index');
Route::get('/cabang', [LandingController::class, 'branches'])->name('branches.index');
Route::get('/invoice/{booking_code}', [BookingController::class, 'showInvoice'])->name('invoice.show');

// Public Settings (for Landing pages — no auth required)
Route::get('/api/settings', [SettingController::class, 'index']);

// Authenticated Routes
Route::middleware(['auth'])->group(function () {
    // Intended route for redirecting back to rooms after login/register
    Route::get('/kamar/pesan', function () {
        return redirect()->route('rooms.index');
    })->name('rooms.book.intent');

    // Render Dashboard View
    Route::get('/dashboard', [DashboardController::class, 'view'])->name('dashboard');
    
    // Fetch Dashboard Stats & Notifications
    Route::get('/api/dashboard/data', [DashboardController::class, 'index']);
    // Endpoint ringan hanya untuk polling notifikasi (dipakai setiap 30 detik dari frontend)
    Route::get('/api/dashboard/ping', [DashboardController::class, 'ping']);
    
    // Profile Management
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // User Management (Super Admin)
    Route::get('/api/users', [UserController::class, 'index']);
    Route::post('/api/users', [UserController::class, 'store']);
    Route::put('/api/users/{id}', [UserController::class, 'update']);
    Route::delete('/api/users/{id}', [UserController::class, 'destroy']);

    // Content Management
    Route::get('/api/faqs', [FaqController::class, 'index']);
    Route::post('/api/faqs', [FaqController::class, 'store']);
    Route::put('/api/faqs/{id}', [FaqController::class, 'update']);
    Route::delete('/api/faqs/{id}', [FaqController::class, 'destroy']);

    Route::get('/api/virtual-tours', [VirtualTourController::class, 'index']);
    Route::post('/api/virtual-tours', [VirtualTourController::class, 'store']);
    Route::post('/api/virtual-tours/{id}', [VirtualTourController::class, 'update']); // use POST for form-data update with files
    Route::delete('/api/virtual-tours/{id}', [VirtualTourController::class, 'destroy']);

    Route::get('/api/testimonials', [TestimonialController::class, 'index']);
    Route::post('/api/testimonials', [TestimonialController::class, 'store']);
    Route::put('/api/testimonials/{id}', [TestimonialController::class, 'update']);
    Route::delete('/api/testimonials/{id}', [TestimonialController::class, 'destroy']);

    // App Settings (super_admin write)
    Route::post('/api/settings', [SettingController::class, 'update']);

    // Resident Booking Operations (Authenticated)
    Route::post('/api/bookings/store', [BookingController::class, 'store']);
    Route::post('/api/bookings/manual', [BookingController::class, 'storeManual']);
    Route::post('/api/bookings/verify-otp', [BookingController::class, 'verifyOtp']);
    Route::post('/api/bookings/{id}/payment-proof', [BookingController::class, 'uploadPaymentProof']);
    Route::post('/api/bookings/{id}/extend', [BookingController::class, 'extendBooking']);
    Route::post('/api/bookings/{id}/extend-manual', [BookingController::class, 'extendBookingManual']);

    // Admin & Resident Booking Operations
    Route::get('/api/bookings', [BookingController::class, 'index']);
    Route::post('/api/bookings/{id}/approve', [BookingController::class, 'approveBooking']);
    Route::post('/api/bookings/{id}/change-room', [BookingController::class, 'changeRoom']);
    Route::post('/api/bookings/{id}/reschedule-bill', [BookingController::class, 'rescheduleBill']);
    Route::post('/api/bookings/{id}/checkout', [BookingController::class, 'checkout']);
    Route::get('/api/bookings/{id}/contract', [BookingController::class, 'downloadContract']);
    Route::post('/api/bookings/{id}/pay', [BookingController::class, 'uploadPaymentProofAuth']);
    Route::post('/api/bookings/{id}/verify-payment', [BookingController::class, 'verifyPayment']);
    Route::post('/api/bookings/{id}/reject-payment', [BookingController::class, 'rejectPayment']);
    Route::post('/api/bookings/{id}/pay-manual', [BookingController::class, 'payManual']);
    Route::post('/api/bookings/{id}/remind', [BookingController::class, 'sendReminder']);
    Route::delete('/api/bookings/{id}', [BookingController::class, 'destroy']);

    // Complaints Management
    Route::get('/api/complaints', [ComplaintController::class, 'index']);
    Route::post('/api/complaints', [ComplaintController::class, 'store']);
    Route::post('/api/complaints/{id}/status', [ComplaintController::class, 'updateStatus']);

    // Finance Management
    Route::get('/api/finances', [FinanceController::class, 'index']);
    Route::post('/api/finances', [FinanceController::class, 'store']);
    Route::get('/api/finances/chart', [FinanceController::class, 'chartData']);

    // Canteen Management
    Route::get('/api/canteen-items', [App\Http\Controllers\CanteenItemController::class, 'index']);
    Route::post('/api/canteen-items', [App\Http\Controllers\CanteenItemController::class, 'store']);
    Route::put('/api/canteen-items/{id}', [App\Http\Controllers\CanteenItemController::class, 'update']);
    Route::delete('/api/canteen-items/{id}', [App\Http\Controllers\CanteenItemController::class, 'destroy']);
    
    Route::get('/api/canteen-orders', [App\Http\Controllers\CanteenOrderController::class, 'index']);
    Route::post('/api/canteen-orders', [App\Http\Controllers\CanteenOrderController::class, 'store']);
    Route::post('/api/canteen-orders/manual', [App\Http\Controllers\CanteenOrderController::class, 'storeManual']);
    Route::put('/api/canteen-orders/{id}/status', [App\Http\Controllers\CanteenOrderController::class, 'updateStatus']);
    Route::put('/api/canteen-orders/{id}/payment', [App\Http\Controllers\CanteenOrderController::class, 'updatePayment']);
    Route::post('/api/canteen-orders/{id}/payment', [App\Http\Controllers\CanteenOrderController::class, 'updatePayment']); // For multipart/form-data with file upload
    Route::post('/api/canteen-orders/{id}/pay-debt', [App\Http\Controllers\CanteenOrderController::class, 'payDebt']);
    Route::post('/api/canteen-orders/pay-bulk-debt', [App\Http\Controllers\CanteenOrderController::class, 'payBulkDebt']);
    Route::post('/api/canteen-orders/remind-bulk-debt', [App\Http\Controllers\CanteenOrderController::class, 'sendBulkReminders']);
    // Branches & Rooms Management (Master Data)
    Route::apiResource('/api/branches', BranchController::class)->names('api.branches');
    Route::apiResource('/api/rooms', RoomController::class)->names('api.rooms');
    Route::post('/api/rooms/{id}/finish-cleaning', [RoomController::class, 'finishCleaning']);
});

require __DIR__.'/auth.php';

// Route bantuan untuk Setup di Shared Hosting
Route::get('/setup-production', function () {
    if (!auth()->check() || auth()->user()->role !== 'super_admin') {
        abort(403, 'Unauthorized action.');
    }
    try {
        \Illuminate\Support\Facades\Artisan::call('storage:link');
        \Illuminate\Support\Facades\Artisan::call('optimize:clear');
        return 'Setup Production Berhasil! Storage terhubung (gambar akan muncul) dan cache dibersihkan.';
    } catch (\Exception $e) {
        return 'Error: ' . $e->getMessage();
    }
})->middleware('auth');

