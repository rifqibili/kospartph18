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
            $valDaily = $booking->room->price_daily;
            $valWeekly = $booking->room->price_weekly;
            $valMonthly = $booking->price_monthly > 0 ? $booking->price_monthly : $booking->room->price_monthly;
            $valYearly = $booking->room->price_yearly;

            $priceDaily = $valDaily > 0 ? 'Rp ' . number_format($valDaily, 0, ',', '.') : '-';
            $priceWeekly = $valWeekly > 0 ? 'Rp ' . number_format($valWeekly, 0, ',', '.') : '-';
            $priceMonthly = $valMonthly > 0 ? 'Rp ' . number_format($valMonthly, 0, ',', '.') : '-';
            $priceYearly = $valYearly > 0 ? 'Rp ' . number_format($valYearly, 0, ',', '.') : '-';

            $amountDue = $booking->total_amount - $booking->paid_amount;
            $amountFormatted = 'Rp ' . number_format($amountDue, 0, ',', '.');
            $roomPriceFormatted = 'Rp ' . number_format($booking->total_amount, 0, ',', '.');
            $dueDate = Carbon::parse($booking->end_date)->format('d M Y');

            $endDate = Carbon::parse($booking->end_date);
            $isToday = $endDate->isSameDay($now);

            if ($isToday) {
                $message = "🏢 *KOSPART PH 18 - JATUH TEMPO HARI INI*\n\n"
                    . "Halo *{$booking->tenant->name}*,\n"
                    . "Masa sewa *Kamar {$booking->room->room_number}* Anda telah jatuh tempo pada hari ini (*{$dueDate}*).\n\n"
                    . "Untuk menghindari kendala, mohon segera menyelesaikan sisa tagihan sewa berjalan sebesar *{$amountFormatted}*.\n\n"
                    . "Daftar Harga Perpanjangan:\n"
                    . "- Harian: *{$priceDaily}*\n"
                    . "- Mingguan: *{$priceWeekly}*\n"
                    . "- Bulanan: *{$priceMonthly}*\n"
                    . "- Tahunan: *{$priceYearly}*\n\n"
                    . "Silakan selesaikan pembayaran ke rekening berikut:\n"
                    . "- *BCA: 8447060951 a.n PRAYOGA HERIYANTO*\n\n"
                    . "Mohon *kirimkan bukti bayarnya langsung di chat ini*, atau hubungi admin kami jika ada kendala. Terima kasih atas kerja samanya! 🙏";
            } else {
                $message = "🏢 *KOSPART PH 18 - PENGINGAT TAGIHAN*\n\n"
                    . "Halo *{$booking->tenant->name}*,\n"
                    . "Mengingatkan kembali bahwa masa sewa *Kamar {$booking->room->room_number}* akan berakhir pada *{$dueDate}* (3 hari lagi).\n\n"
                    . "Anda masih memiliki sisa tagihan berjalan sebesar *{$amountFormatted}* yang harus segera dilunasi.\n\n"
                    . "Jika Anda juga berencana memperpanjang masa sewa, berikut adalah daftar harga perpanjangan:\n"
                    . "- Harian: *{$priceDaily}*\n"
                    . "- Mingguan: *{$priceWeekly}*\n"
                    . "- Bulanan: *{$priceMonthly}*\n"
                    . "- Tahunan: *{$priceYearly}*\n\n"
                    . "Silakan selesaikan pembayaran ke rekening berikut:\n"
                    . "- *BCA: 8447060951 a.n PRAYOGA HERIYANTO*\n\n"
                    . "Mohon *kirimkan bukti bayarnya langsung di chat ini*. Abaikan pesan ini jika Anda sudah bayar. Terima kasih! 🙏";
            }

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
