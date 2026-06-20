<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Booking;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class SendBookingReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kospart:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kirim reminder otomatis via WhatsApp Fonnte untuk tagihan yang belum lunas (H-3 dan H-0)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $token = env('FONNTE_API_KEY');
        if (!$token) {
            $this->error('Fonnte API Key belum diset.');
            return;
        }

        $now = Carbon::now();
        
        // Find unpaid bookings that end today (H-0) or in 3 days (H-3)
        $bookings = Booking::with(['tenant', 'room.branch'])
            ->where('payment_status', 'unpaid')
            ->where('status', 'active')
            ->where(function ($query) use ($now) {
                $query->whereDate('end_date', $now->toDateString())
                      ->orWhereDate('end_date', $now->copy()->addDays(3)->toDateString());
            })
            ->get();

        if ($bookings->isEmpty()) {
            $this->info('Tidak ada tagihan yang butuh reminder hari ini.');
            return;
        }

        $count = 0;
        foreach ($bookings as $booking) {
            if (!$booking->tenant || !$booking->tenant->phone) {
                continue;
            }

            $amountDue = $booking->total_amount - $booking->paid_amount;
            $amountFormatted = 'Rp ' . number_format($amountDue, 0, ',', '.');
            $dueDate = Carbon::parse($booking->end_date)->format('d M Y');

            $message = "*REMINDER OTOMATIS KOSPART PH 18*\n\n"
                . "Halo {$booking->tenant->name},\n\n"
                . "Mengingatkan kembali bahwa tagihan sewa kamar Anda belum lunas.\n\n"
                . "Detail Tagihan:\n"
                . "- Kamar: {$booking->room->room_number}\n"
                . "- Cabang: {$booking->room->branch->name}\n"
                . "- Sisa Tagihan: *{$amountFormatted}*\n"
                . "- Batas Waktu Sewa: *{$dueDate}*\n\n"
                . "Silakan selesaikan pembayaran ke rekening berikut:\n"
                . "- BCA: 8447060951\n"
                . "A/N PRAYOGA HERIYANTO\n\n"
                . "Mohon segera melakukan pembayaran dan *kirimkan bukti pembayaran Anda melalui chat ini*, atau hubungi operator kami jika ada kendala.\n\n"
                . "Abaikan pesan ini jika Anda sudah melakukan pembayaran. Terima kasih!";

            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->post('https://api.fonnte.com/send', [
                'target' => $booking->tenant->phone,
                'message' => $message,
                'countryCode' => '62',
            ]);

            if ($response->successful()) {
                $this->info("Reminder terkirim ke {$booking->tenant->name} ({$booking->tenant->phone})");
                $count++;
            } else {
                $this->error("Gagal mengirim ke {$booking->tenant->name} ({$booking->tenant->phone})");
            }
        }

        $this->info("Proses selesai. Berhasil mengirim $count pesan.");
    }
}
