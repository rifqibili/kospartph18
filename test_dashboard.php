<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('role', 'operator')->first();
Illuminate\Support\Facades\Auth::login($user);
$res = app(App\Http\Controllers\DashboardController::class)->index();
echo json_encode($res->getData());
