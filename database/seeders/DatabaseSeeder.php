<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Branch;
use App\Models\Room;
use App\Models\Booking;
use App\Models\Complaint;
use App\Models\Finance;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Branches
        $branchUtama = Branch::create([
            'name' => 'Kospart PH 18 - Utama',
            'address' => 'samping BNI kartini dikomplek perukoan dibelakang mall kartini (masuk jalannya dari samping halte kartini), H7M3+J6F, Palapa, Kec. Tj. Karang Pusat, Kota Bandar Lampung, Lampung 35118',
            'maps_link' => 'https://www.google.com/maps/place/kospart+PH+18/@-5.4164332,105.2538444,19.18z/data=!4m9!3m8!1s0x2e40dbb43262d9df:0xa1cf05d7be03bb72!5m2!4m1!1i2!8m2!3d-5.416147!4d105.2535747!16s%2Fg%2F11yspfw7t2?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D',
            'status' => 'active',
        ]);

        $branchExecutive = Branch::create([
            'name' => 'Kospart PH 18 - Executive',
            'address' => 'samping BNI kartini dikomplek perukoan dibelakang mall kartini (masuk jalannya dari samping halte kartini), H7M3+J6F, Palapa, Kec. Tj. Karang Pusat, Kota Bandar Lampung, Lampung 35118',
            'maps_link' => 'https://www.google.com/maps/place/kospart+PH+18/@-5.4164332,105.2538444,19.18z/data=!4m9!3m8!1s0x2e40dbb43262d9df:0xa1cf05d7be03bb72!5m2!4m1!1i2!8m2!3d-5.416147!4d105.2535747!16s%2Fg%2F11yspfw7t2?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D',
            'status' => 'active',
        ]);

        // 2. Create Users
        $superAdmin = User::create([
            'name' => 'Super Admin Kospart',
            'email' => 'admin@kospart.com',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'phone' => '081234567890',
            'avatar' => null,
        ]);

        $operator1 = User::create([
            'name' => 'Budi Operator',
            'email' => 'budi@kospart.com',
            'password' => Hash::make('operator123'),
            'role' => 'operator',
            'phone' => '087712345678',
            'assigned_branches' => [$branchUtama->id],
        ]);

        $operator2 = User::create([
            'name' => 'Siti Operator',
            'email' => 'siti@kospart.com',
            'password' => Hash::make('operator123'),
            'role' => 'operator',
            'phone' => '087787654321',
            'assigned_branches' => [$branchExecutive->id],
        ]);

        $resident1 = User::create([
            'name' => 'Dani Trisna Tri Utami',
            'email' => 'dani@gmail.com',
            'password' => Hash::make('tenant123'),
            'role' => 'resident',
            'phone' => '085712345678',
        ]);

        $resident2 = User::create([
            'name' => 'Rian Aditya',
            'email' => 'rian@gmail.com',
            'password' => Hash::make('tenant123'),
            'role' => 'resident',
            'phone' => '089876543210',
        ]);

        // 3. Create Rooms with actual public/images files
        // Branch Utama
        $room101 = Room::create([
            'branch_id' => $branchUtama->id,
            'room_number' => '101',
            'price_monthly' => 1200000.00,
            'price_daily' => 100000.00,
            'status' => 'occupied',
            'facilities' => ['Wi-Fi', 'Kamar Mandi Dalam', 'Kasur Springbed', 'Lemari'],
            'description' => 'Kamar standar Kospart yang bersih dan nyaman dengan sirkulasi udara baik.',
            'image' => '/images/foto kamar 1.jpeg',
        ]);

        $room102 = Room::create([
            'branch_id' => $branchUtama->id,
            'room_number' => '102',
            'price_monthly' => 1200000.00,
            'price_daily' => 100000.00,
            'status' => 'available',
            'facilities' => ['Wi-Fi', 'Kamar Mandi Dalam', 'Kasur Springbed', 'Lemari'],
            'description' => 'Kamar tidur minimalis yang nyaman lengkap dengan perabotan kayu.',
            'image' => '/images/foto kamar 2.jpeg',
        ]);

        $room103 = Room::create([
            'branch_id' => $branchUtama->id,
            'room_number' => '103',
            'price_monthly' => 1800000.00,
            'price_daily' => 150000.00,
            'status' => 'available',
            'facilities' => ['AC', 'Wi-Fi', 'Kamar Mandi Dalam', 'Kasur Springbed', 'Lemari', 'Meja Kerja'],
            'description' => 'Kamar eksklusif ber-AC, interior modern, siap huni.',
            'image' => '/images/kamar 1.800.000.jpeg',
        ]);

        $room104 = Room::create([
            'branch_id' => $branchUtama->id,
            'room_number' => '104',
            'price_monthly' => 2500000.00,
            'price_daily' => 200000.00,
            'status' => 'maintenance',
            'facilities' => ['AC', 'Wi-Fi', 'Kamar Mandi Dalam', 'Kasur Springbed', 'Lemari', 'TV', 'Meja Kerja'],
            'description' => 'Kamar suite terluas dengan fasilitas lengkap dan Smart TV.',
            'image' => '/images/kamar 2.500.000.jpeg',
        ]);

        // Branch Executive
        $room201 = Room::create([
            'branch_id' => $branchExecutive->id,
            'room_number' => '201',
            'price_monthly' => 2500000.00,
            'price_daily' => 200000.00,
            'status' => 'occupied',
            'facilities' => ['AC', 'Wi-Fi', 'Kamar Mandi Dalam', 'Kasur Springbed', 'Lemari', 'TV', 'Kulkas Kecil'],
            'description' => 'Kamar eksekutif lantai 2 dengan pemandangan balkon, berfasilitas lengkap.',
            'image' => '/images/kamar 2 2.500.000.jpeg',
        ]);

        $room202 = Room::create([
            'branch_id' => $branchExecutive->id,
            'room_number' => '202',
            'price_monthly' => 1800000.00,
            'price_daily' => 150000.00,
            'status' => 'available',
            'facilities' => ['AC', 'Wi-Fi', 'Kamar Mandi Dalam', 'Kasur Springbed', 'Lemari'],
            'description' => 'Kamar ber-AC eksklusif lantai atas dengan pencahayaan alami yang baik.',
            'image' => '/images/foto kamar 1.800.000.jpeg',
        ]);

        // 4. Create Bookings
        $booking1 = Booking::create([
            'booking_code' => 'KP-' . strtoupper(uniqid()),
            'room_id' => $room101->id,
            'tenant_id' => $resident1->id,
            'rental_type' => 'monthly',
            'start_date' => now()->subDays(23)->format('Y-m-d'),
            'end_date' => now()->addDays(7)->format('Y-m-d'),
            'total_amount' => 1200000.00,
            'status' => 'active',
            'payment_status' => 'paid',
            'paid_amount' => 1200000.00,
            'otp_verified' => true,
        ]);

        $booking2 = Booking::create([
            'booking_code' => 'KP-' . strtoupper(uniqid()),
            'room_id' => $room201->id,
            'tenant_id' => $resident2->id,
            'rental_type' => 'monthly',
            'start_date' => now()->subMonth()->format('Y-m-d'),
            'end_date' => now()->format('Y-m-d'),
            'total_amount' => 2500000.00,
            'status' => 'active',
            'payment_status' => 'unpaid',
            'paid_amount' => 0.00,
            'otp_verified' => true,
        ]);

        $booking3 = Booking::create([
            'booking_code' => 'KP-' . strtoupper(uniqid()),
            'room_id' => $room102->id,
            'tenant_id' => $resident1->id,
            'rental_type' => 'daily',
            'start_date' => now()->subDays(2)->format('Y-m-d'),
            'end_date' => now()->addDay()->format('Y-m-d'),
            'total_amount' => 300000.00,
            'status' => 'active',
            'payment_status' => 'paid',
            'paid_amount' => 300000.00,
            'otp_verified' => true,
        ]);

        $bookingPending = Booking::create([
            'booking_code' => 'KP-PENDING123',
            'room_id' => $room103->id,
            'tenant_id' => $resident2->id,
            'rental_type' => 'daily',
            'start_date' => now()->addDays(2)->format('Y-m-d'),
            'end_date' => now()->addDays(5)->format('Y-m-d'),
            'total_amount' => 450000.00,
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'paid_amount' => 0.00,
            'otp_code' => '166345',
            'otp_verified' => false,
            'otp_sent_at' => now(),
        ]);

        // 5. Create Complaints
        Complaint::create([
            'tenant_id' => $resident1->id,
            'room_id' => $room101->id,
            'title' => 'Kran Air Kamar Mandi Bocor',
            'description' => 'Kran air di kamar mandi terus meneteskan air deras meskipun sudah ditutup rapat. Mohon segera ditindaklanjuti karena pemborosan air.',
            'status' => 'pending',
            'photo' => null,
        ]);

        Complaint::create([
            'tenant_id' => $resident2->id,
            'room_id' => $room201->id,
            'title' => 'AC Kamar Tidak Dingin',
            'description' => 'AC di kamar 201 hanya bertiup seperti kipas biasa, tidak dingin sama sekali sejak 2 hari yang lalu. Mohon dicuci atau diisi freon.',
            'status' => 'processing',
            'photo' => null,
        ]);

        // 6. Create Finances
        Finance::create([
            'transaction_type' => 'income',
            'amount' => 1200000.00,
            'category' => 'rental',
            'transaction_date' => now()->subDays(23)->format('Y-m-d'),
            'description' => 'Pemasukan sewa bulanan Kamar 101 - Dani Trisna',
            'booking_id' => $booking1->id,
        ]);

        Finance::create([
            'transaction_type' => 'income',
            'amount' => 300000.00,
            'category' => 'rental',
            'transaction_date' => now()->subDays(2)->format('Y-m-d'),
            'description' => 'Pemasukan sewa harian Kamar 102 - Dani Trisna',
            'booking_id' => $booking3->id,
        ]);

        Finance::create([
            'transaction_type' => 'expense',
            'amount' => 350000.00,
            'category' => 'electricity',
            'transaction_date' => now()->subDays(20)->format('Y-m-d'),
            'description' => 'Bayar tagihan listrik PLN token untuk Kospart PH 18 Utama',
        ]);

        Finance::create([
            'transaction_type' => 'expense',
            'amount' => 150000.00,
            'category' => 'water',
            'transaction_date' => now()->subDays(15)->format('Y-m-d'),
            'description' => 'Bayar tagihan air PDAM Kospart PH 18 Executive',
        ]);

        Finance::create([
            'transaction_type' => 'expense',
            'amount' => 500000.00,
            'category' => 'salary',
            'transaction_date' => now()->subDays(6)->format('Y-m-d'),
            'description' => 'Uang lelah mingguan Operator Budi',
        ]);

        Finance::create([
            'transaction_type' => 'expense',
            'amount' => 75000.00,
            'category' => 'maintenance',
            'transaction_date' => now()->subDays(2)->format('Y-m-d'),
            'description' => 'Pembelian kran air stainless dan seal tape untuk perbaikan toilet',
        ]);
    }
}
