<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$abandonedBookings = \App\Models\Booking::with('room')->where('otp_verified', false)->get();
foreach($abandonedBookings as $abandoned) {
    if ($abandoned->room && $abandoned->room->status === 'booked') {
        $abandoned->room->update(['status' => 'available']);
    }
    $abandoned->delete();
}
echo "Cleared " . count($abandonedBookings) . " bookings.\n";
