<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WebSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('faqs')->truncate();
        DB::table('testimonials')->truncate();

        $faqs = [
            [
                'question' => 'Apakah ada jam malam di Kospart?',
                'answer' => 'Kospart menyediakan akses 24 jam untuk setiap penghuni. Namun, kami memohon agar penghuni tetap menjaga ketenangan saat larut malam demi kenyamanan bersama.',
                'is_active' => true,
                'order' => 1,
            ],
            [
                'question' => 'Apakah tamu boleh menginap?',
                'answer' => 'Tamu diperbolehkan berkunjung di area umum hingga pukul 22.00 WIB. Jika ada keluarga/tamu yang menginap, mohon melapor ke pengelola maksimal H-1 (terdapat biaya tambahan untuk tamu menginap).',
                'is_active' => true,
                'order' => 2,
            ],
            [
                'question' => 'Fasilitas apa saja yang sudah termasuk dalam harga sewa?',
                'answer' => 'Harga sewa bulanan sudah termasuk fasilitas kamar full-furnished, air bersih, WiFi kecepatan tinggi, serta akses ke fasilitas umum (dapur bersama, ruang santai, parkiran). Token listrik diisi sendiri oleh masing-masing penghuni.',
                'is_active' => true,
                'order' => 3,
            ],
            [
                'question' => 'Bagaimana prosedur perpanjang sewa bulanan?',
                'answer' => 'Sistem Kospart akan mengirimkan notifikasi pengingat secara otomatis H-7 sebelum masa sewa Anda berakhir. Anda dapat langsung membayar tagihan perpanjangan sewa melalui sistem dashboard.',
                'is_active' => true,
                'order' => 4,
            ],
            [
                'question' => 'Apakah parkiran aman untuk kendaraan?',
                'answer' => 'Sangat aman. Kospart menyediakan area parkir motor dan mobil yang luas, tertutup, dan terpantau oleh kamera CCTV selama 24 jam non-stop.',
                'is_active' => true,
                'order' => 5,
            ]
        ];

        foreach ($faqs as $faq) {
            DB::table('faqs')->insert([
                'question' => $faq['question'],
                'answer' => $faq['answer'],
                'is_active' => $faq['is_active'],
                'order' => $faq['order'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $testimonials = [
            [
                'name' => 'Andi Pratama',
                'role' => 'Mahasiswa',
                'avatar' => '🧑‍🎓',
                'rating' => 5,
                'date_text' => 'Desember 2025',
                'text' => 'Kospart benar-benar bikin nyaman! Kamarnya selalu bersih, wifi stabil banget buat nugas, dan paling seneng karena ada kantin di dalamnya.',
                'badge' => 'Penghuni Lama',
                'is_active' => true,
                'order' => 1,
            ],
            [
                'name' => 'Rini Yulianti',
                'role' => 'Karyawan Swasta',
                'avatar' => '👩‍💼',
                'rating' => 5,
                'date_text' => 'Januari 2026',
                'text' => 'Lokasinya sangat strategis buat saya yang kerjanya sering pulang malam. Keamanannya terjamin dengan CCTV dan pengelolanya juga ramah banget.',
                'badge' => 'Penghuni Aktif',
                'is_active' => true,
                'order' => 2,
            ],
            [
                'name' => 'Bima Sakti',
                'role' => 'Freelancer',
                'avatar' => '🧑‍💻',
                'rating' => 4,
                'date_text' => 'Februari 2026',
                'text' => 'Secara keseluruhan sangat memuaskan. Area parkirnya luas dan aman. Suasananya juga tenang jadi enak banget buat dipakai kerja WFH.',
                'badge' => '',
                'is_active' => true,
                'order' => 3,
            ],
            [
                'name' => 'Citra Amelia',
                'role' => 'Mahasiswi',
                'avatar' => '👩‍🎓',
                'rating' => 5,
                'date_text' => 'Maret 2026',
                'text' => 'Fasilitas kamarnya lengkap banget, tinggal bawa koper langsung bisa nempatin. Dan yang paling penting harganya masuk akal dengan fasilitas se-oke ini.',
                'badge' => 'Penghuni Baru',
                'is_active' => true,
                'order' => 4,
            ],
        ];

        foreach ($testimonials as $testimonial) {
            DB::table('testimonials')->insert([
                'name' => $testimonial['name'],
                'role' => $testimonial['role'],
                'avatar' => $testimonial['avatar'],
                'rating' => $testimonial['rating'],
                'date_text' => $testimonial['date_text'],
                'text' => $testimonial['text'],
                'badge' => $testimonial['badge'],
                'is_active' => $testimonial['is_active'],
                'order' => $testimonial['order'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
