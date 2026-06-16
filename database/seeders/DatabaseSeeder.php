<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Super Admin (Satu-satunya data yang disisakan)
        User::updateOrCreate(
            ['email' => 'admin@kospart.com'],
            [
                'name' => 'Super Admin Kospart',
                'password' => Hash::make('admin123'),
                'role' => 'super_admin',
                'phone' => '081234567890',
                'avatar' => null,
            ]
        );
    }
}
