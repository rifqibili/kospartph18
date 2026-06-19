import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
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
        color: '#4B5563',
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
}

