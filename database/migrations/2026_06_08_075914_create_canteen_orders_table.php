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
        Schema::create('canteen_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('tenant_id')->constrained('users')->onDelete('cascade');
            $table->string('order_code')->unique();
            $table->decimal('total_amount', 15, 2);
            $table->string('payment_method'); // qris, cash, debt
            $table->string('payment_status'); // pending, paid, debt_unpaid
            $table->string('status'); // pending_approval, processing, ready, completed, cancelled
            $table->string('payment_proof')->nullable();
            $table->text('notes')->nullable();
            $table->string('delivery_method')->default('pickup'); // pickup, delivery
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('canteen_orders');
    }
};
