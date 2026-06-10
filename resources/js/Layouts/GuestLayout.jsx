import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left Column - Premium Branding Banner */}
            <div className="hidden lg:flex lg:w-5/12 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white border-r border-slate-800">
                {/* Decorative gradients */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-gradient-to-br from-emerald-500/30 to-teal-700/20 rounded-full blur-[100px] pointer-events-none animate-pulse duration-10000"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-gradient-to-tr from-emerald-800/40 to-slate-800/10 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Logo & Header */}
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-gradient rounded-xl flex items-center justify-center border border-emerald-500/20 overflow-hidden shadow-lg">
                            <img src="/images/logo 2.jpeg" alt="Logo Kospart" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <span className="font-extrabold text-xl tracking-tight text-white block">KOSPART</span>
                            <span className="text-emerald-450 text-[10px] font-bold uppercase tracking-widest block -mt-1">PH 18 LAMPUNG</span>
                        </div>
                    </Link>
                </div>

                {/* Center Content / Highlights */}
                <div className="relative z-10 my-auto space-y-8">
                    <div className="space-y-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            ✨ Hunian Rasa Apartemen
                        </span>
                        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-100">
                            Pilihan Terbaik untuk Hunian Eksklusif di Lampung
                        </h1>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Kospart PH 18 menghadirkan kenyamanan maksimal dengan layanan premium yang terintegrasi untuk memudahkan aktivitas harian Anda.
                        </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-4">
                        {[
                            { icon: '❄️', title: 'Fasilitas Kamar Mewah', desc: 'AC, Android TV, meja rias, lemari pakaian' },
                            { icon: '🚿', title: 'Kamar Mandi Dalam', desc: 'Water heater dan WC duduk di setiap kamar' },
                            { icon: '🛋️', title: 'Lounge & Kursi Pijat', desc: 'Area santai dengan fasilitas premium' },
                            { icon: '🍽️', title: 'Resto & Makanan Rumahan', desc: 'Sajian hidangan lezat dan higienis setiap hari' }
                        ].map((feat, i) => (
                            <div key={i} className="flex gap-3.5 items-start">
                                <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/20 flex items-center justify-center shrink-0 text-sm">
                                    {feat.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-200 text-sm leading-snug">{feat.title}</h4>
                                    <p className="text-slate-550 text-xs mt-0.5">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Testimonial Quote */}
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
                        <p className="text-slate-300 text-xs italic leading-relaxed">
                            "Pengalaman nge-kos yang sangat berbeda. Fasilitasnya sangat lengkap, serasa tinggal di apartemen pribadi lengkap dengan resto rumahan dan laundry."
                        </p>
                        <span className="text-[10px] font-bold text-emerald-400 block mt-2">— Dani Trisna (Penghuni Kos)</span>
                    </div>
                </div>

                {/* Footer text */}
                <div className="relative z-10 text-slate-500 text-xs">
                    © 2026 Kospart PH 18. All rights reserved.
                </div>
            </div>

            {/* Right Column - Form Container */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-y-auto">
                <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-200/40 rounded-full blur-[120px] mix-blend-multiply opacity-70"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-100/50 rounded-full blur-[120px] mix-blend-multiply opacity-70"></div>
                </div>

                {/* Mobile Logo Header */}
                <div className="lg:hidden mb-8 text-center flex flex-col items-center">
                    <Link href="/">
                        <div className="w-16 h-16 bg-emerald-gradient rounded-2xl flex items-center justify-center border border-emerald-500/20 overflow-hidden shadow-lg">
                            <img src="/images/logo 2.jpeg" alt="Logo Kospart" className="w-full h-full object-cover" />
                        </div>
                    </Link>
                    <span className="font-extrabold text-2xl tracking-tight text-slate-900 mt-3 block">KOSPART</span>
                    <span className="text-emerald-600 text-xs font-bold tracking-widest uppercase block -mt-1">PH 18 LAMPUNG</span>
                </div>

                {/* Form card */}
                <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-3xl border border-white shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-8 relative z-10 transition-all duration-500 hover:shadow-[0_16px_50px_rgba(16,185,129,0.06)]">
                    {children}
                </div>
                
                {/* Back to Home Link */}
                <Link href="/" className="mt-6 text-xs font-bold text-slate-505 hover:text-slate-800 transition-colors flex items-center gap-1.5 hover:underline">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}
