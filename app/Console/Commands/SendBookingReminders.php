<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Booking;
use App\Services\WhatsAppService;
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
    protected $description = 'Kirim reminder otomatis via WhatsApp untuk tagihan yang belum lunas (H-3 dan H-0) dengan delay 5 detik antar pesan';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $wa = new WhatsAppService();

        $now = Carbon::now();

        // Cari booking belum lunas yang jatuh tempo hari ini (H-0) atau 3 hari lagi (H-3)
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

        // Bangun antrian pesan sebelum mengirim
        $queue = [];

        foreach ($bookings as $booking) {
            if (!$booking->tenant || !$booking->tenant->phone) {
                $this->warn("Booking #{$booking->id} tidak punya nomor WA tenant, dilewati.");
                continue;
            }

            $endDate = Carbon::parse($booking->end_date);
            $isToday = $endDate->isSameDay($now);
            $type    = $isToday ? 'h0' : 'h3';

            $queue[] = [
                'booking' => $booking,
                'type'    => $type,
            ];
        }

        if (empty($queue)) {
            $this->info('Tidak ada penerima valid yang ditemukan.');
            return;
        }

        $total = count($queue);
        $this->info("Memulai pengiriman {$total} reminder dengan delay 5 detik antar pesan...");
        $this->newLine();

        $sent   = 0;
        $failed = 0;

        foreach ($queue as $index => $item) {
            // Delay 5 detik sebelum setiap pengiriman (kecuali pesan pertama)
            if ($index > 0) {
                $this->line("  ⏳ Menunggu 5 detik sebelum pesan berikutnya...");
                sleep(5);
            }

            $booking = $item['booking'];
            $type    = $item['type'];
            $tenant  = $booking->tenant;

            $this->line("  📤 Mengirim ke {$tenant->name} ({$tenant->phone}) — tipe: {$type}");

            $success = $wa->sendReminderUnpaid($tenant->phone, $booking, $type);

            if ($success) {
                $this->info("  ✅ Berhasil: {$tenant->name}");
                $sent++;
            } else {
                $this->error("  ❌ Gagal: {$tenant->name} ({$tenant->phone})");
                $failed++;
            }
        }

        $this->newLine();
        $this->info("Proses selesai. ✅ Berhasil: {$sent} | ❌ Gagal: {$failed}");
    }
}
