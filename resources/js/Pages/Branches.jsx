import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Branches({ branches, auth }) {
    return (
        <div className="min-h-screen bg-mesh-dark text-slate-300 flex flex-col font-sans selection:bg-emerald-600 selection:text-white relative overflow-hidden">
            {/* Glowing Orbs */}
            <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none animate-blob"></div>
            <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-2000"></div>
            <Head title="Cabang Lokasi - Kospart PH 18" />

            {/* Header */}
            <header className="sticky top-0 z-40 glass-transparent border-b-0 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-gradient rounded-xl flex items-center justify-center shadow-lg border border-emerald-500/30 overflow-hidden">
                            <img src="/images/logo 2.jpeg" alt="Logo Kospart" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <span className="font-extrabold text-2xl tracking-tight text-white block text-glow">KOSPART</span>
                            <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase block -mt-1">PH 18 LAMPUNG</span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <Link href="/" className="hover:text-emerald-400 transition-colors">Beranda</Link>
                        <Link href="/kamar" className="hover:text-emerald-400 transition-colors">Cari Kamar</Link>
                        <Link href="/cabang" className="text-emerald-400 font-semibold text-glow">Cabang Kos</Link>
                        <Link href="/#contact" className="hover:text-emerald-400 transition-colors">Kontak</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {auth.user ? (
                            <Link href="/dashboard" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/10">
                                Masuk Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-slate-300 hover:text-white text-sm font-semibold transition-colors">
                                    Login
                                </Link>
                                <Link href="/register" className="hidden sm:inline-block px-5 py-2.5 glass-3d hover:bg-slate-800/60 text-white font-semibold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                    Daftar
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-16 bg-transparent border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-3d text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                        Lokasi Kos Eksklusif Lampung
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
                        Cabang <span className="text-emerald-400 text-glow">Kospart PH 18</span>
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                        Seluruh cabang kami terletak di komplek strategis pusat kota Bandar Lampung, sangat dekat dengan pusat perbelanjaan, fasilitas umum, dan jalan protokol.
                    </p>
                </div>
            </section>

            {/* Branches List */}
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                <div className="grid md:grid-cols-2 gap-8">
                    {branches.map(branch => (
                        <div key={branch.id} className="glass-3d rounded-3xl overflow-hidden flex flex-col justify-between group cursor-default">
                            {/* Branch Image Showcase */}
                            <div className="relative h-64 overflow-hidden bg-slate-900">
                                <img 
                                    src={branch.name.includes('Utama') ? '/images/tampak depan.jpeg' : '/images/ruang tamu.jpeg'} 
                                    alt={branch.name} 
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 mix-blend-overlay opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
                                <div className="absolute top-4 right-4 glass-3d backdrop-blur px-3.5 py-1.5 rounded-full text-xs font-extrabold text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)] border-emerald-500/30">
                                    {branch.available_rooms} Kamar Kosong
                                </div>
                            </div>

                            {/* Branch Details */}
                            <div className="p-8 flex-grow flex flex-col justify-between space-y-6">
                                <div className="space-y-3">
                                    <h2 className="text-2xl font-extrabold text-white font-outfit drop-shadow-md">{branch.name}</h2>
                                    
                                    {/* Stats Summary */}
                                    <div className="flex gap-4 text-xs font-semibold text-slate-400">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
                                            {branch.available_rooms} Kamar Tersedia
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                                            Total {branch.total_rooms} Unit Kamar
                                        </span>
                                    </div>

                                    {/* Address */}
                                    <div className="pt-2 text-sm text-slate-300 space-y-1">
                                        <span className="font-bold text-slate-500 block">Alamat Lengkap:</span>
                                        <p className="leading-relaxed">{branch.address}</p>
                                    </div>
                                </div>

                                {/* Map preview simulation */}
                                <div className="rounded-2xl overflow-hidden glass-3d p-2.5 shadow-inner border border-slate-700/50">
                                    <div className="relative h-36 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                                        {/* A premium styled mock map area */}
                                        <div className="absolute inset-0 bg-[#0f172a] flex flex-col items-center justify-center text-center p-4">
                                            {/* Simulated Map Grid lines */}
                                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                            <div className="w-10 h-10 bg-emerald-600/90 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10 border border-emerald-400 mb-2 animate-bounce">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-bold text-slate-300 z-10">Google Maps Preview (Palapa, Bandar Lampung)</span>
                                            <span className="text-[10px] text-slate-500 z-10">Klik tombol di bawah untuk petunjuk arah navigasi</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <a 
                                        href={branch.maps_link}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="py-3 glass-3d hover:bg-slate-800/60 text-emerald-400 font-bold rounded-xl text-center text-xs transition-all flex items-center justify-center gap-2 border-emerald-500/30"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446 1.202-.832a2.207 2.207 0 0 0 .188-3.575l-9.602-7.858a2.207 2.207 0 0 0-2.822 0l-1.202.832A2.207 2.207 0 0 0 3 9.307v7.858a2.207 2.207 0 0 0 .188 3.575l9.602 7.858a2.207 2.207 0 0 0 2.822 0ZM3 9.307l9.602 7.858a2.207 2.207 0 0 0 2.822 0L21 9.307" />
                                        </svg>
                                        Petunjuk Arah
                                    </a>
                                    <Link 
                                        href={`/kamar?branch=${branch.id}`}
                                        className="py-3 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold rounded-xl text-center text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400/50 transition-all flex items-center justify-center gap-2"
                                    >
                                        Lihat Unit Kamar
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </Link>
                                </div>

                                <div className="pt-2 text-center">
                                    <a 
                                        href="https://wa.me/628980598327"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-slate-400 hover:text-emerald-400 font-semibold transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-500">
                                            <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c1.358 3.312 4.08 6.033 7.391 7.391l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
                                        </svg>
                                        Hubungi WhatsApp Cabang (+62 898-0598-327)
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Coming Soon Card */}
                    <div className="glass-3d rounded-3xl overflow-hidden flex flex-col justify-between group cursor-default relative opacity-90 border-dashed border-2 border-slate-700/50">
                        {/* Branch Image Showcase (Blurred) */}
                        <div className="relative h-64 overflow-hidden bg-slate-900 flex items-center justify-center">
                            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center animate-pulse">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                                    </svg>
                                </div>
                                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-extrabold uppercase tracking-widest border border-amber-500/30">
                                    Coming Soon
                                </span>
                            </div>
                        </div>

                        {/* Branch Details */}
                        <div className="p-8 flex-grow flex flex-col justify-center items-center text-center space-y-4">
                            <h2 className="text-2xl font-extrabold text-slate-400 font-outfit drop-shadow-md">Cabang Baru</h2>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                                Kami sedang menyiapkan cabang Kospart baru dengan fasilitas yang lebih modern dan lokasi strategis.
                            </p>
                            <div className="mt-4 px-6 py-2 rounded-xl bg-slate-800/50 text-slate-400 font-semibold text-xs border border-slate-700">
                                Nantikan Pembaruannya!
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-auto glass-3d border-t border-slate-800/50 py-10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            <img src="/images/logo 2.jpeg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-extrabold text-white text-glow">KOSPART PH 18</span>
                    </div>
                    <p className="text-xs text-center">&copy; {new Date().getFullYear()} Kospart PH 18. All rights reserved. <a href="https://api.whatsapp.com/send/?phone=6289528306239&text&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">Powered by Rifqi Bili.</a></p>
                    <div className="flex gap-4 text-xs">
                        <Link href="/" className="hover:text-emerald-400 transition-colors">Beranda</Link>
                        <Link href="/kamar" className="hover:text-emerald-400 transition-colors">Cari Kamar</Link>
                        <Link href="/cabang" className="hover:text-emerald-400 transition-colors">Cabang Kos</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
