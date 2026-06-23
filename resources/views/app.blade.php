<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="Kospart PH 18 - Hunian kos eksklusif dan nyaman di Bandar Lampung dengan fasilitas premium setara apartemen.">
        <meta name="theme-color" content="#1a3d2b">
        
        <!-- Open Graph / WhatsApp Preview Meta Tags -->
        <meta property="og:title" content="Kospart PH 18 - Hunian Kos Premium & Eksklusif">
        <meta property="og:description" content="Kos premium setara apartemen di Bandar Lampung dengan fasilitas lengkap, keamanan 24 jam, dan kenyamanan terbaik.">
        <meta property="og:image" content="{{ asset('images/hero section.png') }}">
        <meta property="og:url" content="{{ url('/') }}">
        <meta property="og:type" content="website">
        
        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        <link rel="icon" type="image/png" href="/images/Gemini_Generated_Image_6gwojj6gwojj6gwo-removebg-preview.png">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Preload Hero Image to improve LCP -->
        <link rel="preload" as="image" href="/images/ruang tamu.png">

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
