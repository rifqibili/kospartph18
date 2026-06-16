<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('finances', function (Blueprint $table) {
            $table->unsignedBigInteger('canteen_order_id')->nullable()->after('booking_id');
            $table->foreign('canteen_order_id')->references('id')->on('canteen_orders')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('finances', function (Blueprint $table) {
            $table->dropForeign(['canteen_order_id']);
            $table->dropColumn('canteen_order_id');
        });
    }
};
