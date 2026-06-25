import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => !title || title === appName ? appName : `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#c9a84c',   // Gold brand color — terlihat jelas di semua background
        showSpinner: true,  // Tampilkan spinner di kanan atas saat navigasi
    },
});


// --- Universal Modal Closer ---
// Adds Escape key support and backdrop click support to all Modals globally
if (typeof window !== 'undefined') {
    // Handle Escape Key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Find all open modals (elements with fixed and inset-0)
            const modals = document.querySelectorAll('.fixed.inset-0');
            if (modals.length > 0) {
                const topModal = modals[modals.length - 1];
                
                // 1. Try to trigger the modal's own backdrop click handler if it has one
                topModal.click();
                
                // 2. Fallback: Find a close button or 'Batal' button inside and click it
                const btns = Array.from(topModal.querySelectorAll('button'));
                const closeBtn = btns.find(b => b.textContent.match(/batal|tutup/i) || (b.innerHTML.includes('svg') && !b.textContent.trim() && b.className.includes('absolute')));
                if (closeBtn) {
                    closeBtn.click();
                }
            }
        }
    });

    // Handle Backdrop Clicks for modals that forgot to implement it
    window.addEventListener('click', (e) => {
        // If the user clicked directly on the backdrop (not inside the modal content)
        if (e.target && e.target.classList && e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
            const btns = Array.from(e.target.querySelectorAll('button'));
            const closeBtn = btns.find(b => b.textContent.match(/batal|tutup/i) || (b.innerHTML.includes('svg') && !b.textContent.trim() && b.className.includes('absolute')));
            if (closeBtn) {
                closeBtn.click();
            }
        }
    });

    // Global Inertia Page Transition Loader Overlay
    let loaderContainer = null;
    let loadTimeout = null;

    router.on('start', (event) => {
        // Jangan tampilkan loading screen jika menuju ke landing page ATAU sedang berada di landing page
        try {
            const targetIsHome = event.detail.visit.url.pathname === '/';
            const currentIsHome = window.location.pathname === '/';
            if (targetIsHome || currentIsHome) return;
        } catch (e) {}

        if (loadTimeout) clearTimeout(loadTimeout);
        loadTimeout = setTimeout(() => {
            if (!loaderContainer) {
                loaderContainer = document.createElement('div');
                loaderContainer.id = 'inertia-global-loader';
                loaderContainer.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background-color: rgba(15, 33, 23, 0.45);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    z-index: 99999;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.25s ease;
                    font-family: sans-serif;
                    pointer-events: all;
                `;
                loaderContainer.innerHTML = `
                    <div style="
                        background: rgba(255, 255, 255, 0.85);
                        backdrop-filter: blur(16px);
                        -webkit-backdrop-filter: blur(16px);
                        padding: 32px 40px;
                        border-radius: 28px;
                        box-shadow: 0 25px 50px -12px rgba(15, 33, 23, 0.3), 0 0 0 1px rgba(201, 168, 76, 0.15);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 24px;
                        width: 260px;
                        text-align: center;
                        animation: loaderCardIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    ">
                        <!-- Custom Animated Glowing Gold Spinner with Logo -->
                        <div style="position: relative; width: 68px; height: 68px; display: flex; align-items: center; justify-content: center;">
                            <!-- Glowing gradient ring -->
                            <div style="
                                position: absolute;
                                inset: -3px;
                                border-radius: 50%;
                                background: conic-gradient(from 0deg, transparent, #c9a84c, #e0cb82, transparent);
                                animation: spin-loader-anim 1.2s linear infinite;
                            "></div>
                            <!-- White inner container masking the center -->
                            <div style="
                                position: absolute;
                                inset: 2px;
                                border-radius: 50%;
                                background: #ffffff;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                z-index: 2;
                                box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);
                            ">
                                <img src="/images/logo 2.jpeg" alt="Logo" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover;" />
                            </div>
                        </div>

                        <!-- Elegant status text -->
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                            <span style="font-weight: 800; font-size: 15px; color: #1a3d2b; letter-spacing: -0.01em;">Memuat Halaman...</span>
                            <span style="font-size: 9px; color: #c9a84c; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;">Kospart PH 18</span>
                        </div>
                    </div>
                    <style>
                        @keyframes spin-loader-anim {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                        @keyframes loaderCardIn {
                            from { opacity: 0; transform: scale(0.9) translateY(12px); }
                            to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                    </style>
                `;
                document.body.appendChild(loaderContainer);
                setTimeout(() => {
                    if (loaderContainer) loaderContainer.style.opacity = '1';
                }, 10);
            }
        }, 150); // 150ms delay to avoid flashing on super-fast connection
    });

    router.on('finish', () => {
        if (loadTimeout) {
            clearTimeout(loadTimeout);
            loadTimeout = null;
        }
        if (loaderContainer) {
            loaderContainer.style.opacity = '0';
            setTimeout(() => {
                if (loaderContainer) {
                    loaderContainer.remove();
                    loaderContainer = null;
                }
            }, 250);
        }
    });
}

