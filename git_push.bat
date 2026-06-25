git add -A
git commit -m "fix: perbaiki semua bug dan siapkan untuk production hosting

Bug Fixes Kritis:
- fix: initChart gunakan authFetch bukan fetch biasa (chart 401 error)
- fix: handleAddFinance kirim FormData agar receipt_file terupload
- fix: hapus repair_photo hardcoded di update komplain

Fitur Baru - Sistem Pengaturan Dinamis:
- feat: tambah tabel settings dengan migration dan seed default values
- feat: tambah model Setting dengan helper get/set/allAsArray
- feat: tambah SettingController (public GET, super_admin POST)
- feat: share appSettings ke semua halaman via HandleInertiaRequests
- feat: tambah sub-tab Pengaturan Umum di WebSettingsTab

Data Dinamis tidak lagi hardcoded:
- fix: Welcome.jsx - WA link dan rekening bank dari database settings
- fix: Rooms.jsx - rekening bank dari database settings
- fix: Branches.jsx - WA link dari database settings
- fix: hero-dithering-card.jsx - WA link dari database settings
- fix: GuestLayout.jsx - copyright tahun dinamis, hapus nama dummy
- fix: Welcome.jsx - hapus duplikat setBookingStep

Backend:
- fix: FinanceController gunakan Storage::disk public konsisten
- fix: routes/web.php - apiResource branches dan rooms pakai nama unik
- feat: routes/console.php - daftarkan scheduler send-reminders jam 08:00"
git push origin main
