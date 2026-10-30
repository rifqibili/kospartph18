<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('canteen_orders', 'paid_amount')) {
            Schema::table('canteen_orders', function (Blueprint $table) {
                $table->decimal('paid_amount', 12, 2)->default(0)->after('total_amount');
            });

            DB::table('canteen_orders')
                ->where('payment_status', 'paid')
                ->update(['paid_amount' => DB::raw('total_amount')]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('canteen_orders', 'paid_amount')) {
            Schema::table('canteen_orders', function (Blueprint $table) {
                $table->dropColumn('paid_amount');
            });
        }
    }
};

