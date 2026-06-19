import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';

function useReveal() {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        if (!ref.current) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.1 }
        );
        obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return [ref, visible];
}

const Reveal = ({ children, delay = 0, className = '' }) => {
    const [ref, visible] = useReveal();
    return (
        <div ref={ref} className={className} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(28px)',
            transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`
        }}>
            {children}
        </div>
    );
};

export default function Branches({ branches, auth }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);

    return (
        <div className="min-h-screen bg-lux text-slate-700 flex flex-col font-sans" style={{ position: 'relative' }}>
            <style>{`
                @keyframes lux-float-slow { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.05); } }
                @keyframes lux-float-slow2 { 0%,100% { transform: translateY(0) scale(1) rotate(0deg); } 50% { transform: translateY(20px) scale(0.96) rotate(6deg); } }
                .lux-blob-1 { animation: lux-float-slow 14s ease-in-out infinite; }
                .lux-blob-2 { animation: lux-float-slow2 18s ease-in-out infinite; }
                .lux-blob-3 { animation: lux-float-slow 22s ease-in-out infinite reverse; }
                .lux-orb { position:fixed; border-radius:50%; pointer-events:none; z-index:0; }
            `}</style>

            {/* ── GLOBAL DECORATIVE BLOBS ── */}
            <div className="lux-orb lux-blob-1" style={{ width: 600, height: 600, top: '-150px', right: '-100px', background: 'radial-gradient(circle, rgba(201,168,76,0.10) 0%, transparent 70%)' }} />
            <div className="lux-orb lux-blob-2" style={{ width: 500, height: 500, bottom: '5%', left: '-120px', background: 'radial-gradient(circle, rgba(45,106,79,0.09) 0%, transparent 70%)' }} />
            <div className="lux-orb lux-blob-3" style={{ width: 400, height: 400, top: '40%', right: '5%', background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)' }} />
            <div className="lux-orb" style={{ width: 300, height: 300, top: '60%', left: '20%', background: 'radial-gradient(circle, rgba(45,106,79,0.06) 0%, transparent 70%)' }} />

            {/* SVG Corner Ornament — top left */}
            <svg className="fixed top-0 left-0 pointer-events-none" style={{ zIndex: 0, opacity: 0.5, width: 320, height: 320 }} viewBox="0 0 320 320" fill="none">
                <circle cx="0" cy="0" r="200" stroke="rgba(201,168,76,0.08)" strokeWidth="1" />
                <circle cx="0" cy="0" r="140" stroke="rgba(201,168,76,0.06)" strokeWidth="1" />
                <circle cx="0" cy="0" r="80" stroke="rgba(201,168,76,0.05)" strokeWidth="1" />
                <path d="M0 160 L160 0" stroke="rgba(201,168,76,0.05)" strokeWidth="0.8" />
                <path d="M0 80 L80 0" stroke="rgba(201,168,76,0.04)" strokeWidth="0.8" />
            </svg>

            {/* SVG Corner Ornament — bottom right */}
            <svg className="fixed bottom-0 right-0 pointer-events-none" style={{ zIndex: 0, opacity: 0.45, width: 280, height: 280 }} viewBox="0 0 280 280" fill="none">
                <circle cx="280" cy="280" r="180" stroke="rgba(45,106,79,0.08)" strokeWidth="1" />
                <circle cx="280" cy="280" r="120" stroke="rgba(45,106,79,0.06)" strokeWidth="1" />
                <circle cx="280" cy="280" r="60" stroke="rgba(45,106,79,0.05)" strokeWidth="1" />
            </svg>

            <Head title="Cabang Lokasi – Kospart PH 18 | Kost Premium Lampung" />

            {/* ── HEADER ── */}
            <header className="lux-header sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-[rgba(201,168,76,0.3)] shadow-sm">
                            <img src="/images/logo 2.jpeg" alt="Logo Kospart" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <span className="font-extrabold text-xl tracking-tight text-forest block" style={{ fontFamily: "'Outfit', sans-serif" }}>KOSPART</span>
                            <span className="text-gold text-[10px] font-bold tracking-[0.2em] uppercase block -mt-0.5">PH 18 LAMPUNG</span>
                        </div>
                    </Link>

                    {/* Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/" className="lux-nav-link">Beranda</Link>
                        <Link href="/kamar" className="lux-nav-link">Cari Kamar</Link>
                        <Link href="/cabang" className="lux-nav-link active">Cabang Kos</Link>
                        <a href="/#contact" className="lux-nav-link">Kontak</a>
                    </nav>

                    {/* CTA */}
                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <Link href="/dashboard" className="hidden sm:inline-flex lux-btn-primary px-5 py-2.5 text-sm">
                                Dashboard
                            </Link>
                        ) : (
                            <div className="hidden md:flex items-center gap-3">
                                <Link href="/login" className="lux-nav-link text-sm">Masuk</Link>
                                <Link href="/register" className="lux-btn-primary px-5 py-2.5 text-sm">Daftar</Link>
                            </div>
                        )}
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-slate-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMobileMenuOpen
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute w-full bg-[#faf7f2] border-t border-[rgba(201,168,76,0.15)] shadow-lg z-50 p-5 space-y-3">
                        <Link href="/" className="block text-slate-700 font-semibold py-2">Beranda</Link>
                        <Link href="/kamar" className="block text-slate-700 font-semibold py-2">Cari Kamar</Link>
                        <Link href="/cabang" className="block text-forest font-bold py-2">Cabang Kos</Link>
                        <a href="/#contact" className="block text-slate-700 font-semibold py-2">Kontak</a>
                        <div className="pt-3 border-t border-[rgba(201,168,76,0.15)] flex flex-col gap-2">
                            {auth.user ? (
                                <Link href="/dashboard" className="lux-btn-primary px-5 py-3 text-center text-sm">Dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="lux-btn-outline px-5 py-3 text-center text-sm">Masuk</Link>
                                    <Link href="/register" className="lux-btn-primary px-5 py-3 text-center text-sm">Daftar Akun</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* ── HERO ── */}
            <section className="lux-hero lux-texture py-16 md:py-24 border-b border-[rgba(201,168,76,0.1)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-forest leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Cabang <span className="text-gold">Kospart</span> PH 18
                    </h1>
                    <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                        Hadir di lokasi-lokasi strategis jantung Kota Bandar Lampung, dekat pusat perbelanjaan, fasilitas umum, dan jalur transportasi utama.
                    </p>

                    {/* Stats bar */}
                    <div className="mt-10 inline-flex items-center gap-8 bg-white rounded-2xl border border-[rgba(201,168,76,0.2)] shadow-sm px-8 py-4 mx-auto">
                        <div className="text-center">
                            <div className="text-2xl font-extrabold text-forest">{branches.length}</div>
                            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Cabang Aktif</div>
                        </div>
                        <div className="w-px h-10 bg-[rgba(201,168,76,0.2)]"></div>
                        <div className="text-center">
                            <div className="text-2xl font-extrabold text-forest">{branches.reduce((a, b) => a + (b.total_rooms || 0), 0)}</div>
                            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Total Kamar</div>
                        </div>
                        <div className="w-px h-10 bg-[rgba(201,168,76,0.2)]"></div>
                        <div className="text-center">
                            <div className="text-2xl font-extrabold text-[#2d6a4f]">{branches.reduce((a, b) => a + (b.available_rooms || 0), 0)}</div>
                            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Kamar Kosong</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── BRANCH CARDS ── */}
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lux-section w-full">
                <div className="grid md:grid-cols-2 gap-8">
                    {branches.map((branch, idx) => (
                        <Reveal key={branch.id} delay={idx * 0.1}>
                            <div className="lux-card group">
                                {/* Image */}
                                <div className="relative h-64 overflow-hidden rounded-t-[20px]">
                                    <img
                                        src={branch.name.includes('Utama') ? '/images/tampak depan.jpeg' : '/images/ruang tamu.jpeg'}
                                        alt={branch.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a3d2b]/70 via-transparent to-transparent"></div>

                                    {/* Availability badge */}
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${branch.available_rooms > 0 ? 'bg-white/90 text-[#1a3d2b]' : 'bg-red-50/90 text-red-700'} shadow-md backdrop-blur-sm`}>
                                            {branch.available_rooms > 0 ? `${branch.available_rooms} Kamar Tersedia` : 'Kamar Penuh'}
                                        </span>
                                    </div>

                                    {/* Branch name overlay */}
                                    <div className="absolute bottom-5 left-6">
                                        <h2 className="text-white font-extrabold text-xl drop-shadow-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                            {branch.name.replace('Kospart PH 18 - ', '')}
                                        </h2>
                                        <p className="text-[rgba(250,247,242,0.8)] text-xs font-medium mt-0.5">Bandar Lampung</p>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-7 space-y-5">
                                    {/* Room stats */}
                                    <div className="flex items-center gap-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-[rgba(45,106,79,0.1)] flex items-center justify-center">
                                                <svg className="w-4 h-4 text-[#2d6a4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400 font-medium">Tersedia</div>
                                                <div className="font-bold text-forest text-sm">{branch.available_rooms} Unit</div>
                                            </div>
                                        </div>
                                        <div className="w-px h-8 bg-[rgba(201,168,76,0.2)]"></div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-[rgba(201,168,76,0.1)] flex items-center justify-center">
                                                <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400 font-medium">Total</div>
                                                <div className="font-bold text-forest text-sm">{branch.total_rooms} Unit</div>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="lux-divider" />

                                    {/* Address */}
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Alamat Lengkap</div>
                                            <p className="text-sm text-slate-600 leading-relaxed">{branch.address}</p>
                                        </div>
                                    </div>

                                    {/* Map Preview */}
                                    <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-100 h-32 relative">
                                        <iframe 
                                            src={`https://maps.google.com/maps?q=${encodeURIComponent(branch.name + ' ' + branch.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                            width="100%" 
                                            height="100%" 
                                            style={{ border: 0, position: 'absolute', top: 0, left: 0 }} 
                                            allowFullScreen="" 
                                            loading="lazy" 
                                            referrerPolicy="no-referrer-when-downgrade"
                                            title={`Peta lokasi ${branch.name}`}
                                        ></iframe>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <a
                                            href={branch.maps_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="lux-btn-outline px-4 py-3 text-center text-xs flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                                            Petunjuk Arah
                                        </a>
                                        <Link
                                            href={`/kamar?branch=${branch.id}`}
                                            className="lux-btn-primary px-4 py-3 text-center text-xs flex items-center justify-center gap-2"
                                        >
                                            Lihat Kamar
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                                        </Link>
                                    </div>

                                    {/* WhatsApp link */}
                                    <a
                                        href="https://wa.me/628980598327"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-[#2d6a4f] font-semibold transition-colors pt-1"
                                    >
                                        <svg className="w-3.5 h-3.5 text-[#25d366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                        WhatsApp: +62 898-0598-327
                                    </a>
                                </div>
                            </div>
                        </Reveal>
                    ))}

                    {/* Coming Soon Card */}
                    <Reveal delay={branches.length * 0.1}>
                        <div className="lux-card border-dashed border-2 border-[rgba(201,168,76,0.25)] bg-[rgba(250,247,242,0.5)]">
                            <div className="relative h-64 bg-gradient-to-br from-slate-50 to-[rgba(201,168,76,0.05)] rounded-t-[20px] flex flex-col items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[rgba(201,168,76,0.3)] flex items-center justify-center">
                                    <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"></path></svg>
                                </div>
                                <span className="lux-badge">Segera Hadir</span>
                            </div>
                            <div className="p-7 text-center space-y-3">
                                <h2 className="text-xl font-extrabold text-slate-400" style={{ fontFamily: "'Playfair Display', serif" }}>Cabang Baru</h2>
                                <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">Kami sedang menyiapkan lokasi baru dengan fasilitas lebih modern dan area yang lebih luas.</p>
                                <a href="https://wa.me/628980598327" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 text-xs font-bold text-gold hover:text-[#8a6914] transition-colors">
                                    Daftarkan Minat →
                                </a>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </main>

            {/* --- Contact Section --- */}
            <section id="contact" className="lux-section bg-forest">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-12 gap-12 items-center">
                        <div className="md:col-span-5 order-2 md:order-1 space-y-6">
                            <div>
                                <span className="text-gold text-[10px] font-bold tracking-[0.15em] uppercase block mb-3">Hubungi Kami</span>
                                <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Konsultasi Gratis dengan Admin Kami
                                </h2>
                            </div>
                            <p className="text-[rgba(250,247,242,0.7)] text-base leading-relaxed">
                                Punya pertanyaan? Tim admin Kospart siap membantu Anda memilih kamar yang paling sesuai dengan kebutuhan.
                            </p>
                            <div className="space-y-3">
                                {[
                                    { icon: '📱', label: 'WhatsApp', val: '+62 898-0598-327', href: 'https://wa.me/628980598327' },
                                    { icon: '📍', label: 'Alamat', val: 'Komplek PH 18, Palapa, Bandar Lampung', href: '#' },
                                ].map((c, i) => (
                                    <a key={i} href={c.href} target={c.href !== '#' ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group">
                                        <span className="text-xl">{c.icon}</span>
                                        <div>
                                            <div className="text-gold text-[10px] font-bold uppercase tracking-wider">{c.label}</div>
                                            <div className="text-white text-sm font-semibold">{c.val}</div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                            <a href="https://wa.me/628980598327?text=Halo%20Kospart%20PH%2018,%20saya%20ingin%20tanya%20tentang%20kamar%20kos." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 lux-btn-outline border-[rgba(201,168,76,0.5)] text-gold hover:bg-[rgba(201,168,76,0.1)] px-7 py-4 text-sm">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                Chat via WhatsApp
                            </a>
                        </div>
                        <div className="md:col-span-7 order-1 md:order-2">
                            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                                <iframe
                                    src="https://maps.google.com/maps?q=-5.416147,105.2535747&z=17&output=embed"
                                    className="w-full h-96 border-0"
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="lux-footer mt-auto py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-[rgba(201,168,76,0.3)]">
                            <img src="/images/logo 2.jpeg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-extrabold text-white/90 tracking-wide">KOSPART PH 18</span>
                    </div>
                    <p className="text-xs text-center text-white/40">
                        &copy; {new Date().getFullYear()} Kospart PH 18. All rights reserved.{' '}
                        <a href="https://api.whatsapp.com/send/?phone=6289528306239" target="_blank" rel="noopener noreferrer" className="text-gold/80 hover:text-gold font-semibold transition-colors">
                            Powered by Rifqi Bili.
                        </a>
                    </p>
                    <div className="flex gap-6 text-xs text-white/50">
                        <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
                        <Link href="/kamar" className="hover:text-white transition-colors">Cari Kamar</Link>
                        <Link href="/cabang" className="hover:text-white transition-colors">Cabang</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

