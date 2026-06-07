<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Booking;
use App\Models\Finance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    // List bookings for admin/operator/tenant
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Booking::with(['room.branch', 'tenant']);

        // Role-based restrictions
        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            $query->whereHas('room', function ($q) use ($user) {
                $q->whereIn('branch_id', $user->assigned_branches);
            });
        } elseif ($user->role === 'resident') {
            $query->where('tenant_id', $user->id);
        }

        $bookings = $query->orderBy('created_at', 'desc')->get();
        return response()->json($bookings);
    }

    // Submit a booking from Landing Page
    public function store(Request $request)
    {
        $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'rental_type' => 'required|in:daily,monthly',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after:start_date',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
        ]);

        $room = Room::findOrFail($request->room_id);
        if ($room->status !== 'available') {
            return response()->json(['message' => 'Kamar tidak tersedia untuk disewa.'], 422);
        }

        // Calculate price
        $startDate = new \DateTime($request->start_date);
        $endDate = new \DateTime($request->end_date);
        $diff = $startDate->diff($endDate);
        
        if ($request->rental_type === 'daily') {
            $days = $diff->days;
            if ($days < 1) $days = 1;
            $totalAmount = $days * $room->price_daily;
        } else {
            // monthly
            $months = ($diff->y * 12) + $diff->m + ($diff->d > 0 ? 1 : 0);
            if ($months < 1) $months = 1;
            $totalAmount = $months * $room->price_monthly;
        }

        // DB Transaction to create/find resident, and create booking
        return DB::transaction(function () use ($request, $room, $totalAmount) {
            // Find or create resident user
            $tenant = User::where('email', $request->email)->first();
            if (!$tenant) {
                $tenant = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'password' => bcrypt('password123'), // Default password
                    'role' => 'resident',
                ]);
            } else {
                // update phone if exists
                $tenant->update(['phone' => $request->phone]);
            }

            // Generate OTP (simulation)
            $otp = strval(rand(100000, 999999));
            if ($request->email === 'rian@gmail.com') {
                $otp = '166345'; // Matching PDF example if needed
            }

            $booking = Booking::create([
                'booking_code' => 'KP-' . strtoupper(uniqid()),
                'room_id' => $room->id,
                'tenant_id' => $tenant->id,
                'rental_type' => $request->rental_type,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'otp_code' => $otp,
                'otp_verified' => false,
                'otp_sent_at' => now(),
            ]);

            // Simulation: reserve room status as booked temporarily
            $room->update(['status' => 'booked']);

            return response()->json([
                'message' => 'Pemesanan berhasil diajukan. Kode OTP verifikasi dikirim ke nomor WhatsApp Anda.',
                'booking_code' => $booking->booking_code,
                'otp_code_simulated' => $otp, // Exposed only for simulator UI
                'booking_id' => $booking->id
            ]);
        });
    }

    // Verify OTP from Landing Page
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'otp_code' => 'required|string|size:6',
        ]);

        $booking = Booking::findOrFail($request->booking_id);

        if ($booking->otp_code === $request->otp_code) {
            $booking->update([
                'otp_verified' => true,
                'status' => 'pending', // approved but waiting for deposit / payment proof
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Verifikasi OTP WhatsApp Berhasil! Pemesanan Anda telah disetujui. Harap unggah bukti pembayaran dalam waktu 6 jam.',
                'booking' => $booking
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Kode OTP salah atau kedaluwarsa.'
        ], 422);
    }

    // Upload payment proof (simulation)
    public function uploadPaymentProof(Request $request, $id)
    {
        $request->validate([
            'payment_proof' => 'required|string', // simulated Base64 or fake file path
            'paid_amount' => 'required|numeric|min:0'
        ]);

        $booking = Booking::findOrFail($id);
        $booking->update([
            'payment_proof' => $request->payment_proof,
            'paid_amount' => $request->paid_amount,
            'payment_status' => $request->paid_amount >= $booking->total_amount ? 'paid' : 'dp',
            'status' => 'active', // Approved and check-in
        ]);

        // Mark room as occupied
        $booking->room->update(['status' => 'occupied']);

        // Record financial transaction (income)
        Finance::create([
            'transaction_type' => 'income',
            'amount' => $request->paid_amount,
            'category' => 'rental',
            'transaction_date' => now()->format('Y-m-d'),
            'description' => 'Pembayaran ' . ($booking->rental_type === 'daily' ? 'Harian' : 'Bulanan') . ' Kamar ' . $booking->room->room_number . ' - ' . $booking->tenant->name,
            'booking_id' => $booking->id,
        ]);

        return response()->json([
            'message' => 'Bukti pembayaran berhasil diunggah. Kamar sekarang aktif ditempati.',
            'booking' => $booking
        ]);
    }

    // Upload payment proof by authenticated tenant from dashboard
    public function uploadPaymentProofAuth(Request $request, $id)
    {
        $user = Auth::user();

        $request->validate([
            'payment_proof' => 'required|string',
            'paid_amount'   => 'required|numeric|min:0',
        ]);

        $booking = Booking::with(['room', 'tenant'])->findOrFail($id);

        // Tenant can only pay their own booking
        if ($user->role === 'resident' && $booking->tenant_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized: Bukan booking Anda.'], 403);
        }

        // Admin/operator can mark payment for any booking in their scope
        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($booking->room->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized: Booking di luar cabang Anda.'], 403);
            }
        }

        $isFullyPaid = floatval($request->paid_amount) >= floatval($booking->total_amount);

        $booking->update([
            'payment_proof'  => $request->payment_proof,
            'paid_amount'    => $request->paid_amount,
            'payment_status' => $isFullyPaid ? 'paid' : 'dp',
            'status'         => 'active',
        ]);

        $booking->room->update(['status' => 'occupied']);

        Finance::create([
            'transaction_type' => 'income',
            'amount'           => $request->paid_amount,
            'category'         => 'rental',
            'transaction_date' => now()->format('Y-m-d'),
            'description'      => 'Pembayaran ' . ($booking->rental_type === 'daily' ? 'Harian' : 'Bulanan') . ' Kamar ' . $booking->room->room_number . ' - ' . $booking->tenant->name,
            'booking_id'       => $booking->id,
        ]);

        return response()->json([
            'message' => $isFullyPaid
                ? 'Pembayaran lunas berhasil! Kamar sekarang aktif ditempati.'
                : 'DP berhasil diunggah. Sisa tagihan akan dilunasi kemudian.',
            'booking' => $booking->fresh(['room.branch', 'tenant']),
        ]);
    }

    // Update status / Approve booking manually by admin
    public function approveBooking(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $booking = Booking::with('room')->findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($booking->room->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch booking access.'], 403);
            }
        }
        $booking->update([
            'status' => 'active',
            'payment_status' => 'paid',
            'paid_amount' => $booking->total_amount,
        ]);
        
        $booking->room->update(['status' => 'occupied']);

        // Record finance
        Finance::create([
            'transaction_type' => 'income',
            'amount' => $booking->total_amount,
            'category' => 'rental',
            'transaction_date' => now()->format('Y-m-d'),
            'description' => 'Pembayaran lunas sewa Kamar ' . $booking->room->room_number . ' - ' . $booking->tenant->name,
            'booking_id' => $booking->id,
        ]);

        return response()->json(['message' => 'Penyewaan berhasil diaktifkan.', 'booking' => $booking]);
    }

    // Change room (Penyewaan Pindah/Perubahan Kamar)
    public function changeRoom(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'new_room_id' => 'required|exists:rooms,id',
        ]);

        $booking = Booking::with('room')->findOrFail($id);
        $oldRoom = $booking->room;
        $newRoom = Room::findOrFail($request->new_room_id);

        if ($newRoom->status !== 'available') {
            return response()->json(['message' => 'Kamar baru tidak tersedia.'], 422);
        }

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($oldRoom->branch_id, $user->assigned_branches) || !in_array($newRoom->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch room access.'], 403);
            }
        }

        DB::transaction(function () use ($booking, $oldRoom, $newRoom) {
            // Update booking to new room
            $booking->update(['room_id' => $newRoom->id]);
            
            // Swap room statuses
            $oldRoom->update(['status' => 'available']);
            $newRoom->update(['status' => 'occupied']);
        });

        return response()->json([
            'message' => 'Berhasil memindahkan penghuni dari Kamar ' . $oldRoom->room_number . ' ke Kamar ' . $newRoom->room_number,
            'booking' => $booking->load('room')
        ]);
    }

    // Reschedule bills (Reschedule Tagihan Kos)
    public function rescheduleBill(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $booking = Booking::with('room')->findOrFail($id);
        $room = $booking->room;

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($room->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch booking access.'], 403);
            }
        }

        // Recalculate price
        $startDate = new \DateTime($request->start_date);
        $endDate = new \DateTime($request->end_date);
        $diff = $startDate->diff($endDate);
        
        if ($booking->rental_type === 'daily') {
            $days = $diff->days;
            if ($days < 1) $days = 1;
            $totalAmount = $days * $room->price_daily;
        } else {
            $months = ($diff->y * 12) + $diff->m + ($diff->d > 0 ? 1 : 0);
            if ($months < 1) $months = 1;
            $totalAmount = $months * $room->price_monthly;
        }

        $booking->update([
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'total_amount' => $totalAmount,
            // If payment was paid, we check if it is still matching, else keep paid or recalculate
        ]);

        return response()->json([
            'message' => 'Reschedule tagihan berhasil disesuaikan dengan masa sewa baru.',
            'booking' => $booking
        ]);
    }

    // Check out resident
    public function checkout($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $booking = Booking::with('room')->findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($booking->room->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch booking access.'], 403);
            }
        }

        $booking->update([
            'status' => 'completed',
        ]);
        
        $booking->room->update(['status' => 'available']);

        return response()->json(['message' => 'Penghuni berhasil check-out.', 'booking' => $booking]);
    }
}
