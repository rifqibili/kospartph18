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
use Illuminate\Support\Facades\Hash;

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
            'rental_type' => 'required|in:daily,weekly,monthly,yearly',
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
            $totalAmount = 0;
            $currentDate = clone $startDate;
            for ($i = 0; $i < $days; $i++) {
                $dayOfWeek = $currentDate->format('w');
                if (($dayOfWeek == 0 || $dayOfWeek == 5 || $dayOfWeek == 6) && $room->price_weekend > 0) {
                    $totalAmount += $room->price_weekend;
                } else {
                    $totalAmount += $room->price_daily;
                }
                $currentDate->modify('+1 day');
            }
        } elseif ($request->rental_type === 'weekly') {
            $weeks = ceil($diff->days / 7);
            if ($weeks < 1) $weeks = 1;
            $totalAmount = $weeks * $room->price_weekly;
        } elseif ($request->rental_type === 'monthly') {
            $months = ($diff->y * 12) + $diff->m + ($diff->d > 0 ? 1 : 0);
            if ($months < 1) $months = 1;
            $totalAmount = $months * $room->price_monthly;
        } else {
            $years = $diff->y + ($diff->m > 0 || $diff->d > 0 ? 1 : 0);
            if ($years < 1) $years = 1;
            $totalAmount = $years * $room->price_yearly;
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
            if (app()->environment('local') && $request->email === 'rian@gmail.com') {
                $otp = '166345'; // Debug OTP, hanya aktif di environment local
            }

            $booking = Booking::create([
                'booking_code' => 'KP-' . strtoupper(uniqid()),
                'room_id' => $room->id,
                'tenant_id' => $tenant->id,
                'rental_type' => $request->rental_type,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'total_amount' => $totalAmount,
                'price_monthly' => $room->price_monthly,
                'price_daily' => $room->price_daily,
                'price_weekly' => $room->price_weekly,
                'price_yearly' => $room->price_yearly,
                'price_weekend' => $room->price_weekend,
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

    // Submit a booking manually (Admin/Operator)
    public function storeManual(Request $request)
    {
        $admin = Auth::user();
        if (!in_array($admin->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'rental_type' => 'required|in:daily,weekly,monthly,yearly',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after:start_date',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => ['required', 'string', 'min:9', 'max:20', 'regex:/^[0-9\-\+\s]+$/'],
            'nik' => 'required|string|min:16|max:16',
            'ktp_photo' => 'required|image|max:5120',
            'payment_status' => 'required|in:paid,unpaid'
        ]);

        $room = Room::findOrFail($request->room_id);
        
        // Authorization check for operator
        if ($admin->role === 'operator' && is_array($admin->assigned_branches)) {
            if (!in_array($room->branch_id, $admin->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch access.'], 403);
            }
        }

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
            $totalAmount = 0;
            $currentDate = clone $startDate;
            for ($i = 0; $i < $days; $i++) {
                $dayOfWeek = $currentDate->format('w');
                if (($dayOfWeek == 0 || $dayOfWeek == 5 || $dayOfWeek == 6) && $room->price_weekend > 0) {
                    $totalAmount += $room->price_weekend;
                } else {
                    $totalAmount += $room->price_daily;
                }
                $currentDate->modify('+1 day');
            }
        } elseif ($request->rental_type === 'weekly') {
            $weeks = ceil($diff->days / 7);
            if ($weeks < 1) $weeks = 1;
            $totalAmount = $weeks * $room->price_weekly;
        } elseif ($request->rental_type === 'monthly') {
            $months = ($diff->y * 12) + $diff->m + ($diff->d > 0 ? 1 : 0);
            if ($months < 1) $months = 1;
            $totalAmount = $months * $room->price_monthly;
        } else {
            $years = $diff->y + ($diff->m > 0 || $diff->d > 0 ? 1 : 0);
            if ($years < 1) $years = 1;
            $totalAmount = $years * $room->price_yearly;
        }

        // Handle KTP Upload
        $ktpPath = null;
        if ($request->hasFile('ktp_photo')) {
            $file = $request->file('ktp_photo');
            $filename = time() . '_manual_ktp_' . \Illuminate\Support\Str::random(10) . '.' . $file->getClientOriginalExtension();
            $ktpPath = $file->storeAs('ktp', $filename, 'public');
        }

        return DB::transaction(function () use ($request, $room, $totalAmount, $ktpPath) {
            // Find existing user by phone or email, or create new
            $tenant = User::where('phone', $request->phone)->orWhere('email', $request->email)->first();
            
            if (!$tenant) {
                $tenant = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'nik' => $request->nik,
                    'ktp_photo' => $ktpPath,
                    'password' => Hash::make('kospart123'),
                    'role' => 'resident'
                ]);
            } else {
                // Update missing info
                $tenantUpdates = [];
                if (!$tenant->nik) $tenantUpdates['nik'] = $request->nik;
                if (!$tenant->ktp_photo && $ktpPath) $tenantUpdates['ktp_photo'] = $ktpPath;
                if (!empty($tenantUpdates)) {
                    $tenant->update($tenantUpdates);
                }
            }

            $bookingStatus = $request->payment_status === 'paid' ? 'active' : 'pending';
            $roomStatus = $request->payment_status === 'paid' ? 'occupied' : 'booked';

            $booking = Booking::create([
                'booking_code' => 'KP-M-' . strtoupper(uniqid()),
                'room_id' => $room->id,
                'tenant_id' => $tenant->id,
                'rental_type' => $request->rental_type,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'total_amount' => $totalAmount,
                'price_monthly' => $room->price_monthly,
                'price_daily' => $room->price_daily,
                'price_weekly' => $room->price_weekly,
                'price_yearly' => $room->price_yearly,
                'price_weekend' => $room->price_weekend,
                'paid_amount' => $request->payment_status === 'paid' ? $totalAmount : 0,
                'status' => $bookingStatus,
                'payment_status' => $request->payment_status,
                'otp_code' => '000000', // Bypass OTP
                'otp_verified' => true,
                'otp_sent_at' => now(),
            ]);

            $room->update(['status' => $roomStatus]);

            // If paid, create finance entry
            if ($request->payment_status === 'paid') {
                Finance::create([
                    'transaction_type' => 'income',
                    'amount' => $totalAmount,
                    'category' => 'rental',
                    'description' => "Penyewaan Kamar {$room->room_number} oleh {$tenant->name} (Manual)",
                    'transaction_date' => now()->format('Y-m-d'),
                    'booking_id' => $booking->id,
                    'branch_id' => $room->branch_id,
                ]);
            }

            return response()->json([
                'message' => 'Booking manual berhasil ditambahkan.',
                'booking_code' => $booking->booking_code,
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
            'description'      => 'Pembayaran ' . ($booking->rental_type === 'daily' ? 'Harian' : ($booking->rental_type === 'weekly' ? 'Mingguan' : ($booking->rental_type === 'monthly' ? 'Bulanan' : 'Tahunan'))) . ' Kamar ' . $booking->room->room_number . ' - ' . $booking->tenant->name,
            'booking_id'       => $booking->id,
            'branch_id'        => $booking->room->branch_id,
            'payment_method'   => 'transfer',
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

        // Jika booking masih pending dan kamar masih booked, kembalikan status kamar
        if ($booking->status === 'pending' && $booking->room && $booking->room->status === 'booked') {
            $booking->room->update(['status' => 'available']);
            $booking->update(['status' => 'pending']); // tetap pending, tapi kamar sudah available
        }

        return response()->json([
            'message' => 'Pembayaran ditolak. Menunggu tenant mengunggah ulang bukti bayar.',
            'booking' => $booking->fresh(['room.branch', 'tenant'])
        ]);
    }

    public function payManual(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'paid_amount' => 'required|numeric|min:1',
            'payment_method' => 'required|string|in:cash,transfer'
        ]);

        $booking = Booking::with(['room', 'tenant'])->findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($booking->room->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch booking access.'], 403);
            }
        }

        if (floatval($booking->unverified_amount) > 0) {
            return response()->json(['message' => 'Terdapat pembayaran yang menunggu verifikasi. Silakan Verifikasi atau Tolak bukti bayar tersebut terlebih dahulu.'], 422);
        }

        $amountToVerify = $request->paid_amount;
        $newPaidAmount = $booking->paid_amount + $amountToVerify;
        $isFullyPaid = floatval($newPaidAmount) >= floatval($booking->total_amount);

        $booking->update([
            'paid_amount'    => $newPaidAmount,
            'payment_status' => $isFullyPaid ? 'paid' : 'dp',
            'status'         => 'active',
        ]);

        if ($booking->room->status !== 'occupied') {
            $booking->room->update(['status' => 'occupied']);
        }

        $methodText = $request->payment_method === 'cash' ? 'Tunai' : 'Transfer Bank';
        
        Finance::create([
            'transaction_type' => 'income',
            'amount'           => $amountToVerify,
            'category'         => 'rental',
            'transaction_date' => now()->format('Y-m-d'),
            'description'      => 'Pembayaran ' . ($booking->rental_type === 'daily' ? 'Harian' : ($booking->rental_type === 'weekly' ? 'Mingguan' : ($booking->rental_type === 'monthly' ? 'Bulanan' : 'Tahunan'))) . ' Kamar ' . $booking->room->room_number . ' (' . $methodText . ') - ' . $booking->tenant->name,
            'booking_id'       => $booking->id,
            'branch_id'        => $booking->room->branch_id,
            'payment_method'   => $request->payment_method,
        ]);

        return response()->json([
            'message' => 'Pembayaran manual berhasil dicatat.',
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

        $tenantPhone = $booking->tenant->phone;
        if (!$tenantPhone) {
            return response()->json(['message' => 'Nomor WhatsApp tenant tidak ditemukan.'], 400);
        }

        $token = env('FONNTE_API_KEY') ?: env('FONNTE_TOKEN');
        if (!$token) {
            return response()->json(['message' => 'Konfigurasi Fonnte API Key belum diset di .env.'], 500);
        }

        $dueDate = \Carbon\Carbon::parse($booking->end_date)->format('d M Y');
        $roomPriceFormatted = 'Rp ' . number_format($booking->total_amount, 0, ',', '.');

        if ($booking->payment_status === 'paid') {
            // Jika sudah lunas, kirim reminder batas waktu sewa
            $message = "*REMINDER SEWA KOSPART PH 18*\n\n"
                . "Halo {$booking->tenant->name},\n\n"
                . "Ini adalah pesan pengingat otomatis dari Admin Kospart PH 18 bahwa masa sewa kamar Anda akan segera berakhir.\n\n"
                . "Detail Sewa:\n"
                . "- Kamar: {$booking->room->room_number}\n"
                . "- Cabang: {$booking->room->branch->name}\n"
                . "- Biaya Sewa (Perpanjangan): *{$roomPriceFormatted}*\n"
                . "- Batas Waktu Sewa: *{$dueDate}*\n\n"
                . "Jika Anda ingin melanjutkan perpanjangan sewa, silakan selesaikan pembayaran ke rekening berikut:\n"
                . "- *BCA: 8447060951*\n"
                . "- *A/N PRAYOGA HERIYANTO*\n\n"
                . "Mohon segera melakukan perpanjangan dan *kirimkan bukti bayarnya langsung di chat ini*, atau hubungi kami untuk konfirmasi checkout.\n\n"
                . "Terima kasih!";
        } else {
            // Jika belum lunas, kirim reminder tagihan
            $amountDue = $booking->total_amount - $booking->paid_amount;
            $amountFormatted = 'Rp ' . number_format($amountDue, 0, ',', '.');
            
            $message = "*REMINDER TAGIHAN KOSPART PH 18*\n\n"
                . "Halo {$booking->tenant->name},\n\n"
                . "Ini adalah pesan pengingat otomatis dari Admin Kospart PH 18 bahwa tagihan sewa kamar Anda belum lunas.\n\n"
                . "Detail Tagihan:\n"
                . "- Kamar: {$booking->room->room_number}\n"
                . "- Cabang: {$booking->room->branch->name}\n"
                . "- Harga Kamar / Biaya Sewa: *{$roomPriceFormatted}*\n"
                . "- Sisa Tagihan: *{$amountFormatted}*\n"
                . "- Batas Waktu Pembayaran: *{$dueDate}*\n\n"
                . "Silakan selesaikan pembayaran tagihan Anda ke rekening berikut:\n"
                . "- *BCA: 8447060951*\n"
                . "- *A/N PRAYOGA HERIYANTO*\n\n"
                . "Mohon segera melunasi tagihan dan *kirimkan bukti bayarnya langsung di chat ini*.\n\n"
                . "Abaikan pesan ini jika Anda sudah melakukan pembayaran. Terima kasih!";
        }

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
            'branch_id' => $booking->room->branch_id,
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

        // Recalculate price using locked booking prices (if missing or 0, fallback to room price)
        $lockedPriceDaily = floatval($booking->price_daily) > 0 ? floatval($booking->price_daily) : floatval($room->price_daily);
        $lockedPriceWeekly = floatval($booking->price_weekly) > 0 ? floatval($booking->price_weekly) : floatval($room->price_weekly);
        $lockedPriceMonthly = floatval($booking->price_monthly) > 0 ? floatval($booking->price_monthly) : floatval($room->price_monthly);
        $lockedPriceYearly = floatval($booking->price_yearly) > 0 ? floatval($booking->price_yearly) : floatval($room->price_yearly);
        $lockedPriceWeekend = floatval($booking->price_weekend) > 0 ? floatval($booking->price_weekend) : floatval($room->price_weekend);

        $startDate = new \DateTime($request->start_date);
        $endDate = new \DateTime($request->end_date);
        $diff = $startDate->diff($endDate);
        
        if ($booking->rental_type === 'daily') {
            $days = $diff->days;
            if ($days < 1) $days = 1;
            $totalAmount = 0;
            $currentDate = clone $startDate;
            for ($i = 0; $i < $days; $i++) {
                $dayOfWeek = $currentDate->format('w');
                if (($dayOfWeek == 0 || $dayOfWeek == 5 || $dayOfWeek == 6) && $lockedPriceWeekend > 0) {
                    $totalAmount += $lockedPriceWeekend;
                } else {
                    $totalAmount += $lockedPriceDaily;
                }
                $currentDate->modify('+1 day');
            }
        } elseif ($booking->rental_type === 'weekly') {
            $weeks = floor($diff->days / 7);
            if ($weeks < 1) $weeks = 1;
            $totalAmount = $weeks * $lockedPriceWeekly;
        } elseif ($booking->rental_type === 'monthly') {
            $months = ($diff->y * 12) + $diff->m + ($diff->d > 0 ? 1 : 0);
            if ($months < 1) $months = 1;
            $totalAmount = $months * $lockedPriceMonthly;
        } else {
            $years = $diff->y + ($diff->m > 0 || $diff->d > 0 ? 1 : 0);
            if ($years < 1) $years = 1;
            $totalAmount = $years * $lockedPriceYearly;
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

        // Use locked prices from booking, fallback to room price if somehow missing or 0
        $lockedPriceDaily = floatval($booking->price_daily) > 0 ? floatval($booking->price_daily) : floatval($room->price_daily);
        $lockedPriceWeekly = floatval($booking->price_weekly) > 0 ? floatval($booking->price_weekly) : floatval($room->price_weekly);
        $lockedPriceMonthly = floatval($booking->price_monthly) > 0 ? floatval($booking->price_monthly) : floatval($room->price_monthly);
        $lockedPriceYearly = floatval($booking->price_yearly) > 0 ? floatval($booking->price_yearly) : floatval($room->price_yearly);
        $lockedPriceWeekend = floatval($booking->price_weekend) > 0 ? floatval($booking->price_weekend) : floatval($room->price_weekend);

        // Determine extension duration
        $currentEndDate = \Carbon\Carbon::parse($booking->end_date);
        $extendType = $request->input('extend_type', $booking->rental_type);
        
        if ($extendType === 'daily') {
            $daysToAdd = (int) $request->input('duration', 1);
            $additionalAmount = 0;
            $iterDate = $currentEndDate->copy();
            for ($i = 0; $i < $daysToAdd; $i++) {
                $dayOfWeek = $iterDate->format('w');
                if (($dayOfWeek == 0 || $dayOfWeek == 5 || $dayOfWeek == 6) && $lockedPriceWeekend > 0) {
                    $additionalAmount += $lockedPriceWeekend;
                } else {
                    $additionalAmount += $lockedPriceDaily;
                }
                $iterDate->addDay();
            }
            $newEndDate = $iterDate;
        } elseif ($extendType === 'weekly') {
            $weeksToAdd = (int) $request->input('duration', 1);
            $newEndDate = $currentEndDate->copy()->addWeeks($weeksToAdd);
            $additionalAmount = $weeksToAdd * $lockedPriceWeekly;
        } elseif ($extendType === 'monthly') {
            $monthsToAdd = (int) $request->input('duration', 1);
            $newEndDate = $currentEndDate->copy()->addMonths($monthsToAdd);
            $additionalAmount = $monthsToAdd * $lockedPriceMonthly;
        } else {
            $yearsToAdd = (int) $request->input('duration', 1);
            $newEndDate = $currentEndDate->copy()->addYears($yearsToAdd);
            $additionalAmount = $yearsToAdd * $lockedPriceYearly;
        }

        $newTotalAmount = floatval($booking->total_amount) + $additionalAmount;
        
        // Collision check
        $overlap = Booking::where('room_id', $room->id)
            ->where('id', '!=', $booking->id)
            ->whereIn('status', ['active', 'pending'])
            ->where(function ($q) use ($currentEndDate, $newEndDate) {
                $q->whereBetween('start_date', [$currentEndDate, $newEndDate])
                  ->orWhereBetween('end_date', [$currentEndDate, $newEndDate])
                  ->orWhere(function ($q2) use ($currentEndDate, $newEndDate) {
                      $q2->where('start_date', '<=', $currentEndDate)
                         ->where('end_date', '>=', $newEndDate);
                  });
            })->first();

        if ($overlap) {
            return response()->json(['message' => 'Gagal: Kamar ini sudah dipesan oleh orang lain pada rentang waktu perpanjangan tersebut.'], 400);
        }

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

    // Extend booking manually by admin/operator
    public function extendBookingManual(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'duration' => 'required|integer|min:1',
            'payment_status' => 'required|in:paid,unpaid,dp',
            'payment_method' => 'nullable|string|in:cash,transfer',
            'rental_type' => 'nullable|in:daily,weekly,monthly,yearly',
            'paid_amount' => 'nullable|numeric|min:1'
        ]);

        $booking = Booking::with('room', 'tenant')->findOrFail($id);

        if ($user->role === 'operator' && is_array($user->assigned_branches)) {
            if (!in_array($booking->room->branch_id, $user->assigned_branches)) {
                return response()->json(['message' => 'Unauthorized branch booking access.'], 403);
            }
        }

        $room = $booking->room;

        // Use locked prices from booking, fallback to room price if somehow missing or 0
        $lockedPriceDaily = floatval($booking->price_daily) > 0 ? floatval($booking->price_daily) : floatval($room->price_daily);
        $lockedPriceWeekly = floatval($booking->price_weekly) > 0 ? floatval($booking->price_weekly) : floatval($room->price_weekly);
        $lockedPriceMonthly = floatval($booking->price_monthly) > 0 ? floatval($booking->price_monthly) : floatval($room->price_monthly);
        $lockedPriceYearly = floatval($booking->price_yearly) > 0 ? floatval($booking->price_yearly) : floatval($room->price_yearly);
        $lockedPriceWeekend = floatval($booking->price_weekend) > 0 ? floatval($booking->price_weekend) : floatval($room->price_weekend);

        // Determine extension duration
        $currentEndDate = \Carbon\Carbon::parse($booking->end_date);
        $extendType = $request->input('rental_type', $booking->rental_type);
        $additionalAmount = 0;
        
        if ($extendType === 'daily') {
            $daysToAdd = (int) $request->input('duration', 1);
            $iterDate = $currentEndDate->copy();
            for ($i = 0; $i < $daysToAdd; $i++) {
                $dayOfWeek = $iterDate->format('w');
                if (($dayOfWeek == 0 || $dayOfWeek == 5 || $dayOfWeek == 6) && $lockedPriceWeekend > 0) {
                    $additionalAmount += $lockedPriceWeekend;
                } else {
                    $additionalAmount += $lockedPriceDaily;
                }
                $iterDate->addDay();
            }
            $newEndDate = $iterDate;
        } elseif ($extendType === 'weekly') {
            $weeksToAdd = (int) $request->input('duration', 1);
            $newEndDate = $currentEndDate->copy()->addWeeks($weeksToAdd);
            $additionalAmount = $weeksToAdd * $lockedPriceWeekly;
        } elseif ($extendType === 'monthly') {
            $monthsToAdd = (int) $request->input('duration', 1);
            $newEndDate = $currentEndDate->copy()->addMonths($monthsToAdd);
            $additionalAmount = $monthsToAdd * $lockedPriceMonthly;
        } else {
            $yearsToAdd = (int) $request->input('duration', 1);
            $newEndDate = $currentEndDate->copy()->addYears($yearsToAdd);
            $additionalAmount = $yearsToAdd * $lockedPriceYearly;
        }

        $newTotalAmount = floatval($booking->total_amount) + $additionalAmount;
        $paymentStatus = $booking->payment_status;
        $paidAmount = floatval($booking->paid_amount);

        // Collision check
        $overlap = Booking::where('room_id', $booking->room_id)
            ->where('id', '!=', $booking->id)
            ->whereIn('status', ['active', 'pending'])
            ->where(function ($q) use ($currentEndDate, $newEndDate) {
                $q->whereBetween('start_date', [$currentEndDate, $newEndDate])
                  ->orWhereBetween('end_date', [$currentEndDate, $newEndDate])
                  ->orWhere(function ($q2) use ($currentEndDate, $newEndDate) {
                      $q2->where('start_date', '<=', $currentEndDate)
                         ->where('end_date', '>=', $newEndDate);
                  });
            })->first();

        if ($overlap) {
            return response()->json(['message' => 'Gagal: Kamar ini sudah dipesan oleh orang lain pada rentang waktu perpanjangan tersebut.'], 400);
        }

        try {
            DB::transaction(function () use ($booking, $request, $additionalAmount, $newTotalAmount, $newEndDate, $extendType, &$paymentStatus, &$paidAmount) {
                if (in_array($request->payment_status, ['paid', 'dp'])) {
                    $actualPaid = $request->payment_status === 'dp' ? floatval($request->paid_amount) : $additionalAmount;
                    $paidAmount += $actualPaid;
                    
                    if ($actualPaid > 0) {
                        $methodText = $request->payment_method === 'cash' ? 'Tunai' : 'Transfer Bank';
                        
                        Finance::create([
                            'transaction_type' => 'income',
                            'amount'           => $actualPaid,
                            'category'         => 'rental',
                            'transaction_date' => now()->format('Y-m-d'),
                            'description'      => 'Perpanjangan ' . ($extendType === 'daily' ? 'Harian' : ($extendType === 'weekly' ? 'Mingguan' : ($extendType === 'monthly' ? 'Bulanan' : 'Tahunan'))) . ' Kamar ' . $booking->room->room_number . ' (' . $methodText . ') - ' . $booking->tenant->name,
                            'booking_id'       => $booking->id,
                            'branch_id'        => $booking->room->branch_id,
                            'payment_method'   => $request->payment_method ?? 'cash',
                        ]);
                    }
                }

                if ($paidAmount >= $newTotalAmount) {
                    $paymentStatus = 'paid';
                } elseif ($paidAmount > 0) {
                    $paymentStatus = 'dp';
                } else {
                    $paymentStatus = 'unpaid';
                }

                $booking->update([
                    'end_date'       => $newEndDate->toDateString(),
                    'total_amount'   => $newTotalAmount,
                    'paid_amount'    => $paidAmount,
                    'payment_status' => $paymentStatus,
                    'status'         => 'active'
                ]);
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('extendBookingManual error: ' . $e->getMessage());
            return response()->json(['message' => 'Terjadi kesalahan saat memproses perpanjangan: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'message' => 'Masa sewa berhasil diperpanjang oleh Admin.',
            'booking' => $booking->fresh(['room', 'tenant'])
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

    public function destroy($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['super_admin', 'operator'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $booking = Booking::findOrFail($id);
        
        if ($booking->status === 'active' || $booking->status === 'pending') {
            return response()->json(['error' => 'Hanya booking dengan status checkout yang dapat dihapus.'], 400);
        }

        // Hapus file bukti pembayaran jika ada untuk menghemat disk space
        if ($booking->payment_proof && \Storage::disk('public')->exists($booking->payment_proof)) {
            \Storage::disk('public')->delete($booking->payment_proof);
        }

        $tenantId = $booking->tenant_id;

        $booking->delete();

        // Hapus akun penyewa hanya jika tidak punya booking lain
        if ($tenantId) {
            $otherBookings = Booking::where('tenant_id', $tenantId)->count();
            if ($otherBookings === 0) {
                \App\Models\User::where('id', $tenantId)->delete();
            }
        }

        return response()->json(['message' => 'Log transaksi penyewaan beserta akun penghuni berhasil dihapus.']);
    }
}
