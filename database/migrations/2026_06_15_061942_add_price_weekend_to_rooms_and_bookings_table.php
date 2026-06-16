<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->decimal('price_weekend', 12, 2)->default(0)->after('price_yearly');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->decimal('price_weekend', 12, 2)->default(0)->after('price_yearly');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms_and_bookings', function (Blueprint $table) {
            //
        });
    }
};
