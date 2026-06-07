<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('finances', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_type'); // income, expense
            $table->decimal('amount', 12, 2);
            $table->string('category'); // rental, deposit, maintenance, electricity, salary, internet, water, other
            $table->date('transaction_date');
            $table->text('description')->nullable();
            $table->foreignId('booking_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('finances');
    }
};
