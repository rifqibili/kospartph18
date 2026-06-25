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

    router.on('start', () => {
        if (loadTimeout) clearTimeout(loadTimeout);
        loadTimeout = setTimeout(() => {
            if (!loaderContainer) {
                loaderContainer = document.createElement('div');
                loaderContainer.id = 'inertia-global-loader';
                loaderContainer.style.cssText = `
                    position: fixed;
                    inset: 0;
                    background-color: rgba(26, 61, 43, 0.4);
                    backdrop-filter: blur(4px);
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
                    <div style="background: white; padding: 24px 32px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); border: 1px solid rgba(201, 168, 76, 0.2); display: flex; flex-direction: column; align-items: center; gap: 16px;">
                        <svg style="width: 40px; height: 40px; color: #c9a84c; animation: spin-loader-anim 1s linear infinite;" fill="none" viewBox="0 0 24 24">
                            <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                            <span style="font-weight: 700; font-size: 14px; color: #1a3d2b;">Menghubungkan...</span>
                            <span style="font-size: 9px; color: #c9a84c; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase;">Kospart PH 18</span>
                        </div>
                    </div>
                    <style>
                        @keyframes spin-loader-anim {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
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

