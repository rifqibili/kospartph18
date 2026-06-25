<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="description" content="Kospart PH 18 - Hunian kos eksklusif dan nyaman di Bandar Lampung dengan fasilitas premium setara apartemen.">
        <meta name="theme-color" content="#1a3d2b">
        
        <!-- Open Graph / WhatsApp Preview Meta Tags -->
        <meta property="og:title" content="Kospart PH 18 - Hunian Kos Premium & Eksklusif">
        <meta property="og:description" content="Kos premium setara apartemen di Bandar Lampung dengan fasilitas lengkap, keamanan 24 jam, dan kenyamanan terbaik.">
        <meta property="og:image" content="{{ asset('images/hero section.jpg') }}">
        <meta property="og:url" content="{{ url('/') }}">
        <meta property="og:type" content="website">
        
        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        <link rel="icon" type="image/png" href="/images/Gemini_Generated_Image_6gwojj6gwojj6gwo-removebg-preview.png">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />


        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
        
        <!-- Global Initial Loading Splash Screen -->
        <div id="global-initial-loader" style="position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #faf7f2; font-family: sans-serif; transition: opacity 0.4s ease; pointer-events: none;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 2px solid #c9a84c; box-shadow: 0 4px 12px rgba(0,0,0,0.1); animation: loader-pulse 2s infinite ease-in-out;">
                    <img src="/images/logo 2.jpeg" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <span style="font-weight: 800; font-size: 20px; color: #1a3d2b; letter-spacing: 0.05em;">KOSPART</span>
                    <span style="font-weight: 700; font-size: 10px; color: #c9a84c; letter-spacing: 0.2em; text-transform: uppercase;">PH 18 LAMPUNG</span>
                </div>
                <div style="width: 60px; height: 3px; background: rgba(201, 168, 76, 0.2); border-radius: 9999px; overflow: hidden; position: relative;">
                    <div style="width: 40%; height: 100%; background: #c9a84c; position: absolute; left: 0; top: 0; border-radius: 9999px; animation: loader-progress 1.5s infinite ease-in-out;"></div>
                </div>
            </div>
        </div>
        <style>
            @keyframes loader-pulse {
                0%, 100% { transform: scale(1); opacity: 0.9; }
                50% { transform: scale(1.05); opacity: 1; }
            }
            @keyframes loader-progress {
                0% { left: -40%; }
                50% { left: 100%; }
                100% { left: 100%; }
            }
        </style>
        <script>
            // Remove loader when page is fully initialized (Inertia finished rendering)
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                    const loader = document.getElementById('global-initial-loader');
                    if (loader) {
                        loader.style.opacity = '0';
                        setTimeout(() => loader.remove(), 400);
                    }
                }, 200);
            });
        </script>
    </body>
</html>
