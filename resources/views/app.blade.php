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

        <!-- Fonts: Non-blocking preload (fixes render-blocking resource) -->
        <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap"></noscript>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        <main>
        @inertia
        </main>
        
        @if(!request()->is('/'))
        <!-- Global Initial Loading Splash Screen -->
        <div id="global-initial-loader" style="position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at center, #ffffff 0%, #faf7f2 100%); font-family: sans-serif; transition: opacity 0.4s ease; pointer-events: none;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 24px;">
                <!-- Glowing Circle Container -->
                <div style="position: relative; width: 96px; height: 96px; display: flex; align-items: center; justify-content: center;">
                    <!-- Rotating glowing gold border ring -->
                    <div style="
                        position: absolute;
                        inset: -4px;
                        border-radius: 50%;
                        background: conic-gradient(from 0deg, transparent, #c9a84c, #e0cb82, transparent);
                        animation: loader-spin 1.4s linear infinite;
                    "></div>
                    <!-- Logo mask -->
                    <div style="
                        position: absolute;
                        inset: 2px;
                        border-radius: 50%;
                        background: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 2;
                        box-shadow: 0 4px 15px rgba(26,61,43,0.1), inset 0 2px 4px rgba(0,0,0,0.05);
                    ">
                        <img src="/images/logo 2.jpeg" alt="Logo" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;" />
                    </div>
                </div>
                
                <!-- Text elements -->
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;">
                    <span style="font-weight: 800; font-size: 24px; color: #1a3d2b; letter-spacing: 0.05em; font-family: system-ui, -apple-system, sans-serif;">KOSPART</span>
                    <span style="font-weight: 700; font-size: 10px; color: #c9a84c; letter-spacing: 0.25em; text-transform: uppercase;">PH 18 LAMPUNG</span>
                </div>
                
                <!-- Linear Progress -->
                <div style="width: 80px; height: 3px; background: rgba(201, 168, 76, 0.15); border-radius: 9999px; overflow: hidden; position: relative;">
                    <div style="width: 40%; height: 100%; background: #c9a84c; position: absolute; left: 0; top: 0; border-radius: 9999px; animation: loader-progress 1.5s infinite ease-in-out;"></div>
                </div>
            </div>
        </div>
        <style>
            @keyframes loader-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
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
        @endif
    </body>
</html>
