<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Booking;

class SyncInvoices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kospart:sync-invoices {booking_id? : ID Booking spesifik (opsional)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sinkronisasi ulang invoice items berdasarkan start_date dan end_date terbaru di database.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $bookingId = $this->argument('booking_id');

        $query = Booking::with('room');
        if ($bookingId) {
            $query->where('id', $bookingId);
        }

        $bookings = $query->get();
        if ($bookings->isEmpty()) {
            $this->info("Tidak ada booking ditemukan.");
            return;
        }

        $controller = new \App\Http\Controllers\BookingController();
        $reflection = new \ReflectionClass(\App\Http\Controllers\BookingController::class);
        $method = $reflection->getMethod('buildInvoiceItems');
        $method->setAccessible(true);

        $count = 0;
        $this->info("Memulai sinkronisasi invoice...");

        foreach ($bookings as $booking) {
            $room = $booking->room;
            if (!$room) continue;

            $prices = [
                'daily' => $booking->price_daily > 0 ? (float)$booking->price_daily : (float)$room->price_daily,
                'weekly' => $booking->price_weekly > 0 ? (float)$booking->price_weekly : (float)$room->price_weekly,
                'monthly' => $booking->price_monthly > 0 ? (float)$booking->price_monthly : (float)$room->price_monthly,
                'yearly' => $booking->price_yearly > 0 ? (float)$booking->price_yearly : (float)$room->price_yearly,
                'weekend' => $booking->price_weekend > 0 ? (float)$booking->price_weekend : (float)$room->price_weekend,
            ];

            // Hitung total_amount baru berdasarkan tanggal
            $startDate = new \DateTime($booking->start_date);
            $endDate = new \DateTime($booking->end_date);
            $diff = $startDate->diff($endDate);
            $totalAmount = 0;

            if ($booking->rental_type === 'daily') {
                $days = $diff->days;
                if ($days < 1) $days = 1;
                $currentDate = clone $startDate;
                for ($i = 0; $i < $days; $i++) {
                    $dayOfWeek = $currentDate->format('w');
                    if (($dayOfWeek == 0 || $dayOfWeek == 5 || $dayOfWeek == 6) && $prices['weekend'] > 0) {
                        $totalAmount += $prices['weekend'];
                    } else {
                        $totalAmount += $prices['daily'];
                    }
                    $currentDate->modify('+1 day');
                }
            } elseif ($booking->rental_type === 'weekly') {
                $weeks = ceil($diff->days / 7);
                if ($weeks < 1) $weeks = 1;
                $totalAmount = $weeks * $prices['weekly'];
            } elseif ($booking->rental_type === 'monthly') {
                $months = ($diff->y * 12) + $diff->m + ($diff->d > 0 ? 1 : 0);
                if ($months < 1) $months = 1;
                $totalAmount = $months * $prices['monthly'];
            } else {
                $years = $diff->y + ($diff->m > 0 || $diff->d > 0 ? 1 : 0);
                if ($years < 1) $years = 1;
                $totalAmount = $years * $prices['yearly'];
            }

            // Regenerate invoice items
            $invoiceItems = $method->invokeArgs($controller, [
                $booking->rental_type,
                $booking->start_date,
                $booking->end_date,
                $prices,
                &$totalAmount
            ]);

            // Update booking
            $booking->invoice_items = $invoiceItems;
            $booking->total_amount = $totalAmount;
            
            // Jika sudah lunas, pastikan paid_amount ikut disesuaikan agar tidak jadi hutang/lebih
            if ($booking->payment_status === 'paid') {
                $booking->paid_amount = $totalAmount;
            }

            if ($booking->isDirty()) {
                $booking->save();
                $this->line("Diperbarui: Booking ID {$booking->id} (Total: Rp " . number_format($totalAmount, 0, ',', '.') . ")");
                $count++;
            }
        }

        $this->info("Selesai. $count invoice berhasil disinkronisasi.");
    }
}
