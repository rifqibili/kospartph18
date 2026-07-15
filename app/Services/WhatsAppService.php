<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $token;
    protected string $apiUrl = 'https://api.fonnte.com/send';
    protected int $delaySeconds = 5;

    public function __construct()
    {
        $this->token = env('FONNTE_TOKEN') ?: env('FONNTE_API_KEY', '');
    }

    // =========================================================================
    // PENGIRIMAN TUNGGAL
    // =========================================================================

    /**
     * Kirim pesan bebas ke nomor tertentu.
     */
    public function sendRaw(string $phone, string $message): bool
    {
        if (!$this->token) {
            Log::warning('WhatsAppService: FONNTE_TOKEN / FONNTE_API_KEY belum diset di .env');
            return false;
        }

        $phone = $this->sanitizePhone($phone);

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->token,
            ])->post($this->apiUrl, [
                'target'      => $phone,
                'message'     => $message,
                'countryCode' => '62',
            ]);

            if (!$response->successful()) {
                Log::error('WhatsAppService sendRaw gagal.', [
                    'phone'  => $phone,
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('WhatsAppService Exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Kirim banyak pesan secara berurutan dengan delay 5 detik tiap pesan.
     * $messages = [ ['phone' => '08xxx', 'message' => '...'], ... ]
     */
    public function delayedSend(array $messages): int
    {
        $sent = 0;
        foreach ($messages as $index => $item) {
            // Delay sebelum setiap pengiriman (kecuali pesan pertama)
            if ($index > 0) {
                sleep($this->delaySeconds);
            }

            $success = $this->sendRaw($item['phone'], $item['message']);
            if ($success) {
                $sent++;
            }
        }
        return $sent;
    }

    // =========================================================================
    // TEMPLATE 1 — OTP BOOKING
    // =========================================================================

    /**
     * Kirim kode OTP saat tenant mengajukan booking baru.
     */
    public function sendOtp(string $phone, string $tenantName, string $roomNumber, string $otp): bool
    {
        $message = "🏢 *KOSPART PH 18 - KODE OTP*\n\n"
            . "Halo *{$tenantName}*,\n\n"
            . "Terima kasih telah melakukan pemesanan *Kamar {$roomNumber}* di Kospart PH 18.\n\n"
            . "Kode OTP konfirmasi Anda adalah:\n\n"
            . "🔐 *{$otp}*\n\n"
            . "Masukkan kode ini di aplikasi untuk melanjutkan ke tahap pembayaran.\n"
            . "⏳ Kode berlaku selama *5 menit*.\n\n"
            . "_Jangan bagikan kode ini kepada siapapun._";

        return $this->sendRaw($phone, $message);
    }

    // =========================================================================
    // TEMPLATE 2 — NOTIFIKASI BOOKING DISETUJUI
    // =========================================================================

    /**
     * Kirim notifikasi ketika admin menyetujui booking tenant.
     */
    public function sendBookingApproved(string $phone, $booking): bool
    {
        $tenant     = $booking->tenant;
        $room       = $booking->room;
        $branch     = $room->branch ?? null;
        $startDate  = \Carbon\Carbon::parse($booking->start_date)->format('d M Y');
        $endDate    = \Carbon\Carbon::parse($booking->end_date)->format('d M Y');
        $totalFmt   = 'Rp ' . number_format($booking->total_amount, 0, ',', '.');

        $message = "🏢 *KOSPART PH 18 - BOOKING DISETUJUI* ✅\n\n"
            . "Halo *{$tenant->name}*,\n\n"
            . "Selamat! Pemesanan kamar Anda telah *disetujui* oleh admin kami.\n\n"
            . "📋 *Detail Booking:*\n"
            . "- Kode Booking : *{$booking->booking_code}*\n"
            . "- Kamar         : {$room->room_number}"
            . ($branch ? " ({$branch->name})" : "") . "\n"
            . "- Masa Sewa    : {$startDate} s/d {$endDate}\n"
            . "- Total Tagihan: *{$totalFmt}*\n\n"
            . "💳 *Silakan segera lakukan pembayaran ke:*\n"
            . "- BCA : *8447060951*\n"
            . "- A/N : *PRAYOGA HERIYANTO*\n\n"
            . "Setelah bayar, harap *unggah bukti pembayaran* melalui aplikasi. Terima kasih! 🙏";

        return $this->sendRaw($phone, $message);
    }

    // =========================================================================
    // TEMPLATE 3 — INVOICE SETELAH PEMBAYARAN
    // =========================================================================

    /**
     * Kirim invoice/kuitansi setelah pembayaran berhasil diverifikasi atau dicatat.
     */
    public function sendPaymentInvoice(
        string $phone,
        $booking,
        int $amount,
        bool $isFullyPaid,
        string $methodText = 'Transfer'
    ): bool {
        $tenant      = $booking->tenant;
        $room        = $booking->room;
        $amountFmt   = 'Rp ' . number_format($amount, 0, ',', '.');
        $statusLabel = $isFullyPaid ? '✅ LUNAS' : '🟡 BAYAR SEBAGIAN';
        $invoiceUrl  = route('invoice.show', $booking->booking_code);

        $message = "🏢 *KOSPART PH 18 - KUITANSI PEMBAYARAN* 🧾\n\n"
            . "Halo *{$tenant->name}*,\n\n"
            . "Pembayaran *{$methodText}* Anda telah kami terima dan berhasil dicatat.\n\n"
            . "📝 *Detail Transaksi:*\n"
            . "- Kamar          : {$room->room_number}\n"
            . "- Kode Booking   : {$booking->booking_code}\n"
            . "- Nominal Dibayar: *{$amountFmt}*\n"
            . "- Status Tagihan : *{$statusLabel}*\n\n"
            . "📄 *Invoice digital Anda:*\n"
            . "{$invoiceUrl}\n\n"
            . "Simpan link di atas sebagai bukti pembayaran resmi Anda.\n"
            . "Terima kasih telah membayar tepat waktu! 🙏";

        return $this->sendRaw($phone, $message);
    }

    // =========================================================================
    // TEMPLATE 4 — REMINDER TAGIHAN BELUM LUNAS
    // =========================================================================

    /**
     * Kirim reminder untuk tagihan yang belum lunas.
     * $type: 'h0' (jatuh tempo hari ini) atau 'h3' (3 hari lagi)
     */
    public function sendReminderUnpaid(string $phone, $booking, string $type = 'h3'): bool
    {
        $tenant       = $booking->tenant;
        $room         = $booking->room;
        $branch       = $room->branch ?? null;
        $dueDate      = \Carbon\Carbon::parse($booking->end_date)->format('d M Y');
        $amountDue    = $booking->total_amount - $booking->paid_amount;
        $amountFmt    = 'Rp ' . number_format($amountDue, 0, ',', '.');

        $priceDaily   = $room->price_daily   > 0 ? 'Rp ' . number_format($room->price_daily,   0, ',', '.') : '-';
        $priceWeekly  = $room->price_weekly  > 0 ? 'Rp ' . number_format($room->price_weekly,  0, ',', '.') : '-';
        $priceMonthly = ($booking->price_monthly > 0 ? $booking->price_monthly : $room->price_monthly);
        $priceMonthly = $priceMonthly > 0 ? 'Rp ' . number_format($priceMonthly, 0, ',', '.') : '-';
        $priceYearly  = $room->price_yearly  > 0 ? 'Rp ' . number_format($room->price_yearly,  0, ',', '.') : '-';

        if ($type === 'h0') {
            $header  = "⚠️ *KOSPART PH 18 - JATUH TEMPO HARI INI*";
            $urgency = "Masa sewa *Kamar {$room->room_number}* Anda telah *jatuh tempo hari ini* (*{$dueDate}*).\n\n"
                . "Mohon segera selesaikan sisa tagihan sebesar *{$amountFmt}* untuk menghindari kendala.";
        } else {
            $header  = "🔔 *KOSPART PH 18 - PENGINGAT TAGIHAN*";
            $urgency = "Mengingatkan bahwa masa sewa *Kamar {$room->room_number}* akan berakhir pada *{$dueDate}*.\n\n"
                . "Sisa tagihan Anda: *{$amountFmt}*. Mohon segera dilunasi.";
        }

        $message = "{$header}\n\n"
            . "Halo *{$tenant->name}*,\n\n"
            . "{$urgency}\n\n"
            . "🏷️ *Daftar Harga Perpanjangan:*\n"
            . "- Harian  : *{$priceDaily}*\n"
            . "- Mingguan: *{$priceWeekly}*\n"
            . "- Bulanan : *{$priceMonthly}*\n"
            . "- Tahunan : *{$priceYearly}*\n\n"
            . "💳 *Pembayaran ke:*\n"
            . "- BCA : *8447060951*\n"
            . "- A/N : *PRAYOGA HERIYANTO*\n\n"
            . "Mohon *kirimkan bukti bayarnya langsung di chat ini*.\n"
            . "Abaikan pesan ini jika Anda sudah membayar. Terima kasih! 🙏";

        return $this->sendRaw($phone, $message);
    }

    // =========================================================================
    // TEMPLATE 5 — REMINDER SEWA AKAN HABIS (sudah lunas)
    // =========================================================================

    /**
     * Kirim reminder ke tenant yang masa sewanya akan habis tapi sudah lunas.
     */
    public function sendReminderExpiring(string $phone, $booking): bool
    {
        $tenant   = $booking->tenant;
        $room     = $booking->room;
        $branch   = $room->branch ?? null;
        $dueDate  = \Carbon\Carbon::parse($booking->end_date)->format('d M Y');

        $priceDaily   = $room->price_daily   > 0 ? 'Rp ' . number_format($room->price_daily,   0, ',', '.') : '-';
        $priceWeekly  = $room->price_weekly  > 0 ? 'Rp ' . number_format($room->price_weekly,  0, ',', '.') : '-';
        $priceMonthly = ($booking->price_monthly > 0 ? $booking->price_monthly : $room->price_monthly);
        $priceMonthly = $priceMonthly > 0 ? 'Rp ' . number_format($priceMonthly, 0, ',', '.') : '-';
        $priceYearly  = $room->price_yearly  > 0 ? 'Rp ' . number_format($room->price_yearly,  0, ',', '.') : '-';

        $message = "🏢 *KOSPART PH 18 - REMINDER AKHIR MASA SEWA* 📅\n\n"
            . "Halo *{$tenant->name}*,\n\n"
            . "Ini adalah pengingat otomatis bahwa masa sewa *Kamar {$room->room_number}*"
            . ($branch ? " di *{$branch->name}*" : "") . " akan segera berakhir.\n\n"
            . "📋 *Detail Sewa:*\n"
            . "- Kamar          : {$room->room_number}\n"
            . "- Batas Sewa     : *{$dueDate}*\n\n"
            . "🔄 *Ingin perpanjang? Harga perpanjangan:*\n"
            . "- Harian  : *{$priceDaily}*\n"
            . "- Mingguan: *{$priceWeekly}*\n"
            . "- Bulanan : *{$priceMonthly}*\n"
            . "- Tahunan : *{$priceYearly}*\n\n"
            . "💳 *Pembayaran ke:*\n"
            . "- BCA : *8447060951*\n"
            . "- A/N : *PRAYOGA HERIYANTO*\n\n"
            . "Mohon segera melakukan perpanjangan dan *kirimkan bukti bayarnya di sini*, "
            . "atau hubungi admin kami untuk konfirmasi checkout. Terima kasih! 🙏";

        return $this->sendRaw($phone, $message);
    }

    // =========================================================================
    // HELPER
    // =========================================================================

    /**
     * Bersihkan nomor telepon — hanya angka.
     */
    protected function sanitizePhone(string $phone): string
    {
        return preg_replace('/[^0-9]/', '', $phone);
    }
}
