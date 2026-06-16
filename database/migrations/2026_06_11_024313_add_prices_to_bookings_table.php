<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->decimal('price_monthly', 12, 2)->nullable()->after('end_date');
            $table->decimal('price_daily', 12, 2)->nullable()->after('price_monthly');
        });

        // Copy current room prices into existing bookings so they are locked
        DB::statement('
            UPDATE bookings
            INNER JOIN rooms ON bookings.room_id = rooms.id
            SET bookings.price_monthly = rooms.price_monthly,
                bookings.price_daily = rooms.price_daily
        ');

        // Make columns not nullable after backfilling (optional, but good for integrity)
        Schema::table('bookings', function (Blueprint $table) {
            $table->decimal('price_monthly', 12, 2)->nullable(false)->change();
            $table->decimal('price_daily', 12, 2)->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['price_monthly', 'price_daily']);
        });
    }
};
