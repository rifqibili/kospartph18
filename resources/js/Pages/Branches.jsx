import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Branches({ branches, auth }) {
    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
            <Head title="Cabang Lokasi - Kospart PH 18" />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-gradient rounded-xl flex items-center justify-center shadow-lg border border-emerald-500/30 overflow-hidden">
                            <img src="/images/logo 2.jpeg" alt="Logo Kospart" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <span className="font-extrabold text-2xl tracking-tight text-slate-900 block">KOSPART</span>
                            <span className="text-emerald-600 text-xs font-semibold tracking-widest uppercase block -mt-1">PH 18 LAMPUNG</span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <Link href="/" className="hover:text-emerald-600 transition-colors">Beranda</Link>
                        <Link href="/kamar" className="hover:text-emerald-600 transition-colors">Cari Kamar</Link>
                        <Link href="/cabang" className="text-emerald-600 font-semibold">Cabang Kos</Link>
                        <Link href="/#contact" className="hover:text-emerald-600 transition-colors">Kontak</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {auth.user ? (
                            <Link href="/dashboard" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/10">
                                Masuk Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
                                    Login Admin
                                </Link>
                                <Link href="/register" className="hidden sm:inline-block px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-all border border-slate-200 shadow-sm">
                                    Daftar Akun
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-16 bg-premium-dark border-b border-emerald-50">
                <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200">
                        Lokasi Kos Eksklusif Lampung
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
                        Cabang <span className="text-emerald-600 text-glow-emerald">Kospart PH 18</span>
                    </h1>
                    <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                        Seluruh cabang kami terletak di komplek strategis pusat kota Bandar Lampung, sangat dekat dengan pusat perbelanjaan, fasilitas umum, dan jalan protokol.
                    </p>
                </div>
            </section>

            {/* Branches List */}
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                <div className="grid md:grid-cols-2 gap-8">
                    {branches.map(branch => (
                        <div key={branch.id} className="glass-panel rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                            {/* Branch Image Showcase */}
                            <div className="relative h-64 overflow-hidden bg-slate-100">
                                <img 
                                    src={branch.name.includes('Utama') ? '/images/tampak depan.jpeg' : '/images/ruang tamu.jpeg'} 
                                    alt={branch.name} 
                                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3.5 py-1.5 rounded-full text-xs font-extrabold text-slate-800 shadow-sm border border-slate-100">
                                    {branch.available_rooms} Kamar Kosong
                                </div>
                            </div>

                            {/* Branch Details */}
                            <div className="p-8 flex-grow flex flex-col justify-between space-y-6">
                                <div className="space-y-3">
                                    <h2 className="text-2xl font-extrabold text-slate-900 font-outfit">{branch.name}</h2>
                                    
                                    {/* Stats Summary */}
                                    <div className="flex gap-4 text-xs font-semibold text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                            {branch.available_rooms} Kamar Tersedia
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                                            Total {branch.total_rooms} Unit Kamar
                                        </span>
                                    </div>

                                    {/* Address */}
                                    <div className="pt-2 text-sm text-slate-600 space-y-1">
                                        <span className="font-bold text-slate-700 block">Alamat Lengkap:</span>
                                        <p className="leading-relaxed">{branch.address}</p>
                                    </div>
                                </div>

                                {/* Map preview simulation */}
                                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2.5 shadow-inner">
                                    <div className="relative h-36 bg-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                                        {/* A premium styled mock map area */}
                                        <div className="absolute inset-0 bg-[#e5e3df] flex flex-col items-center justify-center text-center p-4">
                                            {/* Simulated Map Grid lines */}
                                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg z-10 border-2 border-white mb-2 animate-bounce">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-bold text-slate-800 z-10">Google Maps Preview (Palapa, Bandar Lampung)</span>
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
                                        className="py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-center text-xs border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446 1.202-.832a2.207 2.207 0 0 0 .188-3.575l-9.602-7.858a2.207 2.207 0 0 0-2.822 0l-1.202.832A2.207 2.207 0 0 0 3 9.307v7.858a2.207 2.207 0 0 0 .188 3.575l9.602 7.858a2.207 2.207 0 0 0 2.822 0ZM3 9.307l9.602 7.858a2.207 2.207 0 0 0 2.822 0L21 9.307" />
                                        </svg>
                                        Petunjuk Arah
                                    </a>
                                    <Link 
                                        href={`/kamar?branch=${branch.id}`}
                                        className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center text-xs shadow-md shadow-emerald-700/10 transition-all flex items-center justify-center gap-2"
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
                                        className="text-xs text-slate-500 hover:text-emerald-600 font-semibold transition-colors flex items-center justify-center gap-1.5"
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
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-auto bg-white border-t border-slate-200 py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100">
                            <img src="/images/logo 2.jpeg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-extrabold text-slate-900">KOSPART PH 18</span>
                    </div>
                    <p className="text-xs text-center">&copy; {new Date().getFullYear()} Kospart PH 18. All rights reserved. <span className="text-emerald-600 font-semibold">Powered by Rifqi Bili.</span></p>
                    <div className="flex gap-4 text-xs">
                        <Link href="/" className="hover:text-emerald-600 transition-colors">Beranda</Link>
                        <Link href="/kamar" className="hover:text-emerald-600 transition-colors">Cari Kamar</Link>
                        <Link href="/cabang" className="hover:text-emerald-600 transition-colors">Cabang Kos</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
