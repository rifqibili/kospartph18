<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Kirim reminder WA otomatis setiap hari jam 08:00
// Cron di cPanel: * * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1
Schedule::command('kospart:send-reminders')->dailyAt('08:00');
