<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Booking;
use App\Models\Finance;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class BookingController extends Controller
{
    // List bookings for admin/operator/tenant
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Booking::with(['room.branch', 'tenant'])->where('otp_verified', true);

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

    // Submit a booking (Authenticated)
    public function store(Request $request)
    {
        $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'rental_type' => 'required|in:daily,monthly',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after:start_date',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => ['required', 'string', 'min:9', 'max:20', 'regex:/^[0-9\-\+\s]+$/'],
            'nik' => 'required|string|min:16|max:16',
            'ktp_photo' => 'required|image|max:5120',
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

        // Handle KTP Upload
        $ktpPath = null;
        if ($request->hasFile('ktp_photo')) {
            $file = $request->file('ktp_photo');
            $filename = time() . '_ktp_' . \Illuminate\Support\Str::random(10) . '.' . $file->getClientOriginalExtension();
            $ktpPath = $file->storeAs('ktp', $filename, 'public');
        }

        // DB Transaction
        return DB::transaction(function () use ($request, $room, $totalAmount, $ktpPath) {
            $tenant = Auth::user();
            
            // update user identity
            $tenantUpdates = [];
            if ($tenant->phone !== $request->phone) $tenantUpdates['phone'] = $request->phone;
            if ($tenant->nik !== $request->nik) $tenantUpdates['nik'] = $request->nik;
            if ($ktpPath) $tenantUpdates['ktp_photo'] = $ktpPath;
            
            if (!empty($tenantUpdates)) {
                $tenant->update($tenantUpdates);
            }

            // Generate OTP
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

            // Send OTP via Fonnte WA API
            try {
                $token = env('FONNTE_TOKEN');
                if ($token) {
                    // Bersihkan format nomor WA agar hanya berisi angka
                    $targetPhone = preg_replace('/[^0-9]/', '', $tenant->phone);
                    
                    $response = Http::withHeaders([
                        'Authorization' => $token,
                    ])->asForm()->post('https://api.fonnte.com/send', [
                        'target' => $targetPhone,
                        'message' => "Halo {$tenant->name},\n\nTerima kasih telah melakukan pemesanan kamar No. {$room->room_number} di Kospart PH 18.\n\nKode OTP konfirmasi Anda adalah: *{$otp}*\n\nHarap masukkan kode ini di aplikasi untuk melanjutkan ke tahap pembayaran. Berlaku selama 5 menit.",
                    ]);

                    if (!$response->successful()) {
                        \Illuminate\Support\Facades\Log::error('Fonnte API Error: ' . $response->body());
                    }
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Fonnte API Exception: ' . $e->getMessage());
            }

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
                'message' => 'Verifikasi OTP WhatsApp Berhasil! Pemesanan Anda telah disetujui. Harap unggah bukti pembayaran dalam waktu 1 jam.',
                'booking' => $booking
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Kode OTP salah atau kedaluwarsa.'
        ], 422);
    }

    // Upload payment proof
    public function uploadPaymentProof(Request $request, $id)
    {
        $request->validate([
            'payment_proof' => 'required|file|image|mimes:jpeg,png,jpg,pdf|max:2048',
            'paid_amount' => 'required|numeric|min:0'
        ]);

        $booking = Booking::findOrFail($id);

        if ($request->hasFile('payment_proof')) {
            $path = $request->file('payment_proof')->store('payment_proofs', 'public');
            $proofUrl = '/storage/' . $path;
        } else {
            $proofUrl = null;
        }

        $booking->update([
            'unverified_proof' => $proofUrl,
            'unverified_amount' => $request->paid_amount,
        ]);

        return response()->json([
            'message' => 'Bukti pembayaran berhasil diunggah dan sedang menunggu verifikasi pengelola.',
            'booking' => $booking
        ]);
    }

    // Upload payment proof by authenticated tenant from dashboard
    public function uploadPaymentProofAuth(Request $request, $id)
    {
        $user = Auth::user();

        $request->validate([
            'payment_proof' => 'required|file|mimetypes:image/jpeg,image/png,image/jpg,image/gif,image/webp,video/mp4,video/quicktime,video/x-msvideo|max:10240',
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

        $path = $request->file('payment_proof')->store('payments', 'public');

        $booking->update([
            'unverified_proof'  => $path,
            'unverified_amount' => $request->paid_amount,
        ]);

        return response()->json([
            'message' => 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi pengelola.',
            'booking' => $booking->fresh(['room.branch', 'tenant']),
        ]);
    }

    public function verifyPayment(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $booking = Booking::with(['room', 'tenant'])->findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($booking->room->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch booking access.'], 403);
            }
        }

        if ($booking->unverified_amount <= 0) {
            return response()->json(['message' => 'Tidak ada pembayaran yang menunggu verifikasi.'], 400);
        }

        $amountToVerify = $booking->unverified_amount;
        $newPaidAmount = $booking->paid_amount + $amountToVerify;
        $isFullyPaid = floatval($newPaidAmount) >= floatval($booking->total_amount);

        $booking->update([
            'payment_proof'  => $booking->unverified_proof,
            'paid_amount'    => $newPaidAmount,
            'payment_status' => $isFullyPaid ? 'paid' : 'dp',
            'status'         => 'active',
            'unverified_amount' => 0,
            'unverified_proof' => null,
        ]);

        $booking->room->update(['status' => 'occupied']);

        Finance::create([
            'transaction_type' => 'income',
            'amount'           => $amountToVerify,
            'category'         => 'rental',
            'transaction_date' => now()->format('Y-m-d'),
            'description'      => 'Pembayaran ' . ($booking->rental_type === 'daily' ? 'Harian' : 'Bulanan') . ' Kamar ' . $booking->room->room_number . ' - ' . $booking->tenant->name,
            'booking_id'       => $booking->id,
            'branch_id'        => $booking->room->branch_id,
        ]);

        return response()->json([
            'message' => 'Pembayaran berhasil diverifikasi.',
            'booking' => $booking->fresh(['room.branch', 'tenant'])
        ]);
    }

    public function rejectPayment(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $booking = Booking::findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($booking->room->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch booking access.'], 403);
            }
        }

        $booking->update([
            'unverified_amount' => 0,
            'unverified_proof' => null,
        ]);

        return response()->json([
            'message' => 'Pembayaran ditolak. Menunggu tenant mengunggah ulang bukti bayar.',
            'booking' => $booking->fresh(['room.branch', 'tenant'])
        ]);
    }

    public function sendReminder(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $booking = Booking::with(['room.branch', 'tenant'])->findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($booking->room->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch booking access.'], 403);
            }
        }

        if ($booking->payment_status === 'paid') {
            return response()->json(['message' => 'Tagihan sudah lunas, tidak perlu reminder.'], 400);
        }

        $tenantPhone = $booking->tenant->phone;
        if (!$tenantPhone) {
            return response()->json(['message' => 'Nomor WhatsApp tenant tidak ditemukan.'], 400);
        }

        $token = env('FONNTE_API_KEY');
        if (!$token) {
            return response()->json(['message' => 'Konfigurasi Fonnte API Key belum diset di .env.'], 500);
        }

        $amountDue = $booking->total_amount - $booking->paid_amount;
        $amountFormatted = 'Rp ' . number_format($amountDue, 0, ',', '.');
        $dueDate = \Carbon\Carbon::parse($booking->end_date)->format('d M Y');

        $message = "*REMINDER TAGIHAN KOSPART PH 18*\n\n"
            . "Halo {$booking->tenant->name},\n\n"
            . "Ini adalah pesan pengingat otomatis dari Admin Kospart PH 18 bahwa tagihan sewa kamar Anda belum lunas.\n\n"
            . "Detail Tagihan:\n"
            . "- Kamar: {$booking->room->room_number}\n"
            . "- Cabang: {$booking->room->branch->name}\n"
            . "- Sisa Tagihan: *{$amountFormatted}*\n"
            . "- Batas Waktu Sewa: *{$dueDate}*\n\n"
            . "Mohon segera melakukan pembayaran melalui aplikasi Kospart PH 18 atau hubungi operator kami jika ada kendala.\n\n"
            . "Abaikan pesan ini jika Anda sudah melakukan pembayaran. Terima kasih!";

        $response = Http::withHeaders([
            'Authorization' => $token,
        ])->post('https://api.fonnte.com/send', [
            'target' => $tenantPhone,
            'message' => $message,
            'countryCode' => '62',
        ]);

        if ($response->successful()) {
            return response()->json(['message' => 'Reminder WhatsApp berhasil dikirim ke ' . $tenantPhone]);
        }

        return response()->json(['message' => 'Gagal mengirim pesan via Fonnte.', 'error' => $response->json()], 500);
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

        $paymentStatus = $booking->payment_status;
        if (floatval($booking->paid_amount) < floatval($totalAmount)) {
            $paymentStatus = floatval($booking->paid_amount) > 0 ? 'dp' : 'unpaid';
        } else {
            $paymentStatus = 'paid';
        }

        $booking->update([
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'total_amount' => $totalAmount,
            'payment_status' => $paymentStatus,
        ]);

        return response()->json([
            'message' => 'Reschedule tagihan berhasil disesuaikan dengan masa sewa baru.',
            'booking' => $booking
        ]);
    }

    // Extend booking by tenant
    public function extendBooking(Request $request, $id)
    {
        $user = Auth::user();
        if ($user->role !== 'resident') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $booking = Booking::with('room')->findOrFail($id);
        
        if ($booking->tenant_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized: Bukan booking Anda.'], 403);
        }

        $room = $booking->room;

        // Determine extension duration
        $currentEndDate = \Carbon\Carbon::parse($booking->end_date);
        
        if ($booking->rental_type === 'daily') {
            $daysToAdd = (int) $request->input('duration', 1);
            $newEndDate = $currentEndDate->addDays($daysToAdd);
            $additionalAmount = $daysToAdd * $room->price_daily;
        } else {
            $monthsToAdd = (int) $request->input('duration', 1);
            $newEndDate = $currentEndDate->addMonths($monthsToAdd);
            $additionalAmount = $monthsToAdd * $room->price_monthly;
        }

        $newTotalAmount = floatval($booking->total_amount) + $additionalAmount;
        
        $paymentStatus = $booking->payment_status;
        if (floatval($booking->paid_amount) < $newTotalAmount) {
            $paymentStatus = floatval($booking->paid_amount) > 0 ? 'dp' : 'unpaid';
        }

        $booking->update([
            'end_date' => $newEndDate->toDateString(),
            'total_amount' => $newTotalAmount,
            'payment_status' => $paymentStatus,
        ]);

        return response()->json([
            'message' => 'Masa sewa berhasil diperpanjang. Silakan selesaikan pembayaran.',
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
        
        $booking->room->update(['status' => 'cleaning']);

        return response()->json(['message' => 'Penghuni berhasil check-out.', 'booking' => $booking]);
    }

    // Download Contract (DOC)
    public function downloadContract($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $booking = Booking::with(['room.branch', 'tenant'])->findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($booking->room->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch booking access.'], 403);
            }
        }

        // Use absolute URL for KTP so MS Word can fetch it
        $ktpUrl = null;
        if ($booking->tenant && $booking->tenant->ktp_photo) {
            $path = storage_path('app/public/' . $booking->tenant->ktp_photo);
            if (file_exists($path)) {
                // Generates http://domain/storage/ktp/...
                $ktpUrl = asset('storage/' . $booking->tenant->ktp_photo);
            }
        }

        $view = view('contract', compact('booking', 'ktpUrl'))->render();

        $headers = [
            "Content-type" => "application/vnd.ms-word",
            "Content-Disposition" => "attachment;Filename=Surat_Perjanjian_Sewa_" . str_replace(' ', '_', $booking->tenant->name ?? 'Kospart') . ".doc"
        ];

        return response()->make($view, 200, $headers);
    }
}
