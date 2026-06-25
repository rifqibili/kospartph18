<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Seed default values
        DB::table('settings')->insert([
            ['key' => 'whatsapp_number', 'value' => '628980598327', 'description' => 'Nomor WhatsApp Admin (format: 628xxx tanpa +)', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'bank_account_name', 'value' => 'BCA', 'description' => 'Nama Bank untuk Transfer', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'bank_account_number', 'value' => '8447060961', 'description' => 'Nomor Rekening Bank', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'bank_account_holder', 'value' => 'PRAYOGA HERIYANTO', 'description' => 'Nama Pemilik Rekening', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
