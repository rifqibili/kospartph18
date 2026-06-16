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
        Schema::table('canteen_orders', function (Blueprint $table) {
            $table->string('customer_name')->nullable()->after('tenant_id');
            // Make tenant_id nullable for non-tenant guests
            $table->unsignedBigInteger('tenant_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('canteen_orders', function (Blueprint $table) {
            $table->dropColumn('customer_name');
            $table->unsignedBigInteger('tenant_id')->nullable(false)->change();
        });
    }
};
