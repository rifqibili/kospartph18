<?php

return [
    /*
    |--------------------------------------------------------------------------
    | VAPID Keys for Web Push Notifications
    |--------------------------------------------------------------------------
    | Generate keys via: php artisan webpush:vapid
    | Or generate manually and set in .env
    */
    'vapid' => [
        'subject' => env('VAPID_SUBJECT', 'mailto:admin@example.com'),
        'public_key' => env('VAPID_PUBLIC_KEY', ''),
        'private_key' => env('VAPID_PRIVATE_KEY', ''),
    ],
];
