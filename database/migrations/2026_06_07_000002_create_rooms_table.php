<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->string('room_number');
            $table->decimal('price_monthly', 12, 2);
            $table->decimal('price_daily', 12, 2);
            $table->string('status')->default('available'); // available, occupied, booked, maintenance
            $table->json('facilities')->nullable(); // JSON array of facilities
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('rooms');
    }
};
