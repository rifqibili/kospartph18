<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_code')->unique();
            $table->foreignId('room_id')->constrained()->onDelete('cascade');
            $table->foreignId('tenant_id')->constrained('users')->onDelete('cascade');
            $table->string('rental_type'); // daily, monthly
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('total_amount', 12, 2);
            $table->string('status')->default('pending'); // pending, approved, rejected, active, completed
            $table->string('payment_status')->default('unpaid'); // unpaid, dp, paid, overdue
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->string('payment_proof')->nullable();
            $table->string('otp_code', 6)->nullable();
            $table->boolean('otp_verified')->default(false);
            $table->timestamp('otp_sent_at')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('bookings');
    }
};
