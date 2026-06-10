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
        Schema::create('canteen_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('canteen_order_id')->constrained('canteen_orders')->onDelete('cascade');
            $table->foreignId('canteen_item_id')->constrained('canteen_items')->onDelete('cascade');
            $table->integer('quantity');
            $table->decimal('price_at_time', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('canteen_order_items');
    }
};
