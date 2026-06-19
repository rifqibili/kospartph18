const fs = require('fs');
const file = 'c:/laragon/www/KOSPART PH 18/resources/js/Pages/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

// The categorized boxes
content = content.replace(/bg-slate-50\/50 p-5 rounded-2xl border border-slate-100/g, 'bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50');
content = content.replace(/text-sm font-bold text-slate-700/g, 'text-sm font-bold text-slate-700 dark:text-slate-200');

// The inputs inside categorized boxes which were given bg-white
content = content.replace(/glass-input rounded-xl px-4 py-2\.5 text-sm w-full bg-white/g, 'glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white');
content = content.replace(/glass-input rounded-xl px-4 py-2\.5 text-sm w-full bg-white lg:w-1\/4/g, 'glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white lg:w-1/4');

// Booking manual form elements (they use bg-slate-50 and bg-white directly on inputs/selects)
content = content.replace(/bg-slate-50 text-sm/g, 'bg-slate-50 dark:bg-slate-800/50 dark:text-white dark:border-slate-700/50 text-sm');
content = content.replace(/bg-white text-sm/g, 'bg-white dark:bg-slate-900/50 dark:text-white dark:border-slate-700/50 text-sm');

// Form headings
content = content.replace(/text-slate-500 block/g, 'text-slate-500 dark:text-slate-400 block');
content = content.replace(/text-slate-500 mb-1 block/g, 'text-slate-500 dark:text-slate-400 mb-1 block');
content = content.replace(/text-slate-800 mb-3/g, 'text-slate-800 dark:text-slate-200 mb-3');
content = content.replace(/text-slate-800 text-2xl/g, 'text-slate-800 dark:text-white text-2xl');
content = content.replace(/text-2xl text-slate-800/g, 'text-2xl text-slate-800 dark:text-white');

// Select-option dark mode
content = content.replace(/text-slate-800 mb-4/g, 'text-slate-800 dark:text-slate-200 mb-4');

// Specifically handle the empty state in manual booking/pay
content = content.replace(/bg-slate-50 rounded-xl border border-slate-100/g, 'bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700/30');

// specifically for card items in manual
content = content.replace(/border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/g, 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/80');
content = content.replace(/border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/g, 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/80');

fs.writeFileSync(file, content);
console.log("Replaced form styles for dark mode.");
