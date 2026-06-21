import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { CTASection } from '@/Components/ui/hero-dithering-card';
import DragDropZone from '@/Components/DragDropZone';


// ── CSRF-aware fetch helper ──────────────────────────────────────────────────
function getCsrfToken() {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}
async function authFetch(url, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = {
        'Accept': 'application/json',
        'X-XSRF-TOKEN': getCsrfToken(),
        ...(options.headers || {}),
    };
    if (!isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    return fetch(url, { ...options, headers });
}
// ────────────────────────────────────────────────────────────────────────────

export default function Rooms({ branches, rooms, auth }) {
    const getQueryBranch = () => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('branch') || 'all';
        }
        return 'all';
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBranch, setSelectedBranch] = useState(getQueryBranch());
    const [rentalType, setRentalType] = useState('all');
    const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedFacilities, setSelectedFacilities] = useState([]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [visibleCount, setVisibleCount] = useState(9);

    const [showRoomDetail, setShowRoomDetail] = useState(null);
    const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

    const [selectedRoom, setSelectedRoom] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        name: '', email: '', phone: '', start_date: '', end_date: '',
        rental_type: 'monthly', nik: '', ktp_photo: null, agree_tnc: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingStep, setBookingStep] = useState('browse');
    const [bookingResponse, setBookingResponse] = useState(null);
    const [otpCodeInput, setOtpCodeInput] = useState('');
    const [otpError, setOtpError] = useState('');
    const [paymentProofInput, setPaymentProofInput] = useState(null);
    const [paidAmountInput, setPaidAmountInput] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);


    useEffect(() => {
        const queryBranch = getQueryBranch();
        if (queryBranch !== 'all') setSelectedBranch(queryBranch);
    }, []);

    useEffect(() => { setVisibleCount(9); }, [searchQuery, selectedBranch, rentalType, showOnlyAvailable, minPrice, maxPrice, selectedFacilities]);

    const allUniqueFacilities = Array.from(
        new Set(rooms.flatMap(room => {
            try { return Array.isArray(room.facilities) ? room.facilities : (typeof room.facilities === 'string' ? JSON.parse(room.facilities) : []); }
            catch (e) { return []; }
        }))
    ).filter(Boolean);

    const getRoomMedia = (room) => {
        if (!room) return [];
        let media = [];
        if (room.photos && room.photos.length > 0) room.photos.forEach(p => media.push({ type: 'image', src: p }));
        if (room.videos && room.videos.length > 0) room.videos.forEach(v => media.push({ type: 'video', src: v }));
        if (media.length === 0) {
            media.push({ type: 'image', src: '/images/foto kamar 1.jpeg' });
            media.push({ type: 'image', src: '/images/ruang tamu.jpeg' });
        }
        return media;
    };

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBranch = selectedBranch === 'all' || room.branch_id === parseInt(selectedBranch);
        const matchesRental = rentalType === 'all' ||
            (rentalType === 'daily' && parseFloat(room.price_daily) > 0) ||
            (rentalType === 'weekly' && parseFloat(room.price_weekly) > 0) ||
            (rentalType === 'monthly' && parseFloat(room.price_monthly) > 0) ||
            (rentalType === 'yearly' && parseFloat(room.price_yearly) > 0);
        const matchesAvailability = !showOnlyAvailable || room.status === 'available';
        const minP = parseFloat(minPrice);
        const matchesMinPrice = isNaN(minP) || (
            (rentalType === 'daily' && parseFloat(room.price_daily) >= minP) ||
            (rentalType === 'monthly' && parseFloat(room.price_monthly) >= minP) ||
            (rentalType === 'all' && (parseFloat(room.price_monthly) >= minP || parseFloat(room.price_daily) >= minP))
        );
        const maxP = parseFloat(maxPrice);
        const matchesMaxPrice = isNaN(maxP) || (
            (rentalType === 'daily' && parseFloat(room.price_daily) <= maxP) ||
            (rentalType === 'monthly' && parseFloat(room.price_monthly) <= maxP) ||
            (rentalType === 'all' && (parseFloat(room.price_monthly) <= maxP || parseFloat(room.price_daily) <= maxP))
        );
        const roomFacilities = (() => {
            try { return Array.isArray(room.facilities) ? room.facilities : (typeof room.facilities === 'string' ? JSON.parse(room.facilities) : []); }
            catch (e) { return []; }
        })();
        const matchesFacilities = selectedFacilities.every(fac => roomFacilities.includes(fac));
        return matchesSearch && matchesBranch && matchesRental && matchesAvailability && matchesMinPrice && matchesMaxPrice && matchesFacilities;
    });

    const handleFacilityChange = (fac) => {
        if (selectedFacilities.includes(fac)) setSelectedFacilities(selectedFacilities.filter(f => f !== fac));
        else setSelectedFacilities([...selectedFacilities, fac]);
    };

    const handleOpenBooking = (room) => {
        if (!auth.user) {
            setShowLoginPrompt(true);
            return;
        }
        setSelectedRoom(room);
        const defaultRentalType = room.price_monthly > 0 ? 'monthly' : (room.price_yearly > 0 ? 'yearly' : (room.price_weekly > 0 ? 'weekly' : 'daily'));
        const endDate = new Date();
        if (defaultRentalType === 'daily') endDate.setDate(endDate.getDate() + 1);
        else if (defaultRentalType === 'weekly') endDate.setDate(endDate.getDate() + 7);
        else if (defaultRentalType === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
        else endDate.setFullYear(endDate.getFullYear() + 1);
        setBookingForm({
            ...bookingForm,
            name: auth.user.name || '', email: auth.user.email || '', phone: auth.user.phone || '',
            nik: auth.user.nik || '', ktp_photo: null, agree_tnc: false, room_id: room.id,
            rental_type: defaultRentalType, start_date: new Date().toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
        });
        setBookingStep('booking');
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('room_id', selectedRoom.id);
            formData.append('rental_type', bookingForm.rental_type);
            formData.append('start_date', bookingForm.start_date);
            formData.append('end_date', bookingForm.end_date);
            formData.append('name', bookingForm.name);
            formData.append('email', bookingForm.email);
            formData.append('phone', bookingForm.phone);
            formData.append('nik', bookingForm.nik);
            if (bookingForm.ktp_photo) formData.append('ktp_photo', bookingForm.ktp_photo);
            const res = await authFetch('/api/bookings/store', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) { setBookingResponse(data); setBookingStep('otp'); }
            else alert(data.message || 'Terjadi kesalahan');
        } catch (err) { console.error(err); alert('Gagal mengajukan pemesanan.'); }
        finally { setIsSubmitting(false); }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault(); setOtpError('');
        try {
            const res = await authFetch('/api/bookings/verify-otp', {
                method: 'POST',
                body: JSON.stringify({ booking_id: bookingResponse.booking_id, otp_code: otpCodeInput })
            });
            const data = await res.json();
            if (res.ok) { setBookingResponse(prev => ({...prev, booking: data.booking})); setPaidAmountInput(data.booking.total_amount); setBookingStep('payment_proof'); }
            else setOtpError(data.message || 'OTP salah');
        } catch (err) { console.error(err); setOtpError('Gagal memverifikasi OTP.'); }
    };

    const handleUploadPayment = async (e) => {
        e.preventDefault();
        if (!paymentProofInput) { alert('Pilih file bukti pembayaran terlebih dahulu.'); return; }
        try {
            const payload = new FormData();
            payload.append('payment_proof', paymentProofInput);
            payload.append('paid_amount', paidAmountInput);
            const res = await authFetch(`/api/bookings/${bookingResponse.booking_id}/payment-proof`, { method: 'POST', body: payload });
            const data = await res.json();
            if (res.ok) { setSuccessMessage(data.message); setBookingStep('success'); }
            else alert(data.message || 'Gagal mengunggah bukti');
        } catch (err) { console.error(err); alert('Gagal mengunggah pembayaran.'); }
    };

    const resetBookingModal = () => {
        setSelectedRoom(null); setBookingStep('browse');
        setBookingForm({ name: '', email: '', phone: '', start_date: '', end_date: '', rental_type: 'monthly', nik: '', ktp_photo: null, agree_tnc: false });
        setOtpCodeInput(''); setOtpError(''); setBookingResponse(null); setPaymentProofInput(null);
    };

    const clearFilters = () => {
        setSearchQuery(''); setSelectedBranch('all'); setRentalType('all');
        setShowOnlyAvailable(false); setMinPrice(''); setMaxPrice(''); setSelectedFacilities([]);
    };

    const activeFilterCount = [
        selectedBranch !== 'all', rentalType !== 'all', showOnlyAvailable,
        minPrice !== '', maxPrice !== '', selectedFacilities.length > 0
    ].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-lux text-slate-700 flex flex-col font-sans selection:bg-[#2d6a4f] selection:text-white" style={{ position: 'relative' }}>
            <style>{`
                @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
                @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
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

            <Head title="Cari Kamar – Kospart PH 18 | Hunian Premium Lampung" />

            {/* ── HEADER ── */}
            <header className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl transition-all duration-300">
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md rounded-full border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.1)] pointer-events-none -z-10"></div>
                <div className="px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between relative z-10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-white/50 shadow-sm">
                            <img loading="lazy" src="/images/logo 2.jpeg" alt="Logo Kospart" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-forest block leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>KOSPART</span>
                            <span className="text-gold text-[8px] sm:text-[10px] font-bold tracking-[0.2em] uppercase block mt-0.5">PH 18 LAMPUNG</span>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                        <Link href="/" className="lux-nav-link">Beranda</Link>
                        <Link href="/kamar" className="lux-nav-link active">Cari Kamar</Link>
                        <Link href="/cabang" className="lux-nav-link">Cabang Kos</Link>
                        <a href="/#contact" className="lux-nav-link">Kontak</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <Link href="/dashboard" className="hidden sm:inline-flex lux-btn-primary px-5 py-2.5 text-sm">Dashboard</Link>
                        ) : (
                            <div className="hidden md:flex items-center gap-3">
                                <Link href="/login" className="lux-nav-link text-sm">Masuk</Link>
                                <Link href="/register" className="lux-btn-primary px-5 py-2.5 text-sm">Daftar</Link>
                            </div>
                        )}
                        <button aria-label="Toggle Menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden relative w-10 h-10 flex flex-col justify-center items-center gap-[5px] p-2 rounded-xl border border-[#2d6a4f] hover:bg-[#2d6a4f]/10 transition-colors duration-300 focus:outline-none">
                            <span className={`block h-[2px] w-5 bg-[#2d6a4f] rounded-full transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'rotate-45 translate-y-[7px] bg-gold' : ''}`} />
                            <span className={`block h-[2px] w-5 bg-[#2d6a4f] rounded-full transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-0 translate-x-3' : ''}`} />
                            <span className={`block h-[2px] w-5 bg-[#2d6a4f] rounded-full transition-all duration-300 ease-in-out ${isMobileMenuOpen ? '-rotate-45 -translate-y-[7px] bg-gold' : ''}`} />
                        </button>
                    </div>
                </div>
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute left-0 right-0 top-[110%] mx-auto w-full px-2 z-50">
                        <div className="bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.1)] rounded-3xl p-5 flex flex-col gap-1">
                            <Link href="/" className="block text-slate-600 hover:text-forest hover:bg-forest/5 px-4 py-3 rounded-2xl transition-colors font-semibold text-[15px]">Beranda</Link>
                            <Link href="/kamar" className="block text-forest hover:bg-forest/5 px-4 py-3 rounded-2xl transition-colors font-bold text-[15px]">Cari Kamar</Link>
                            <Link href="/cabang" className="block text-slate-600 hover:text-forest hover:bg-forest/5 px-4 py-3 rounded-2xl transition-colors font-semibold text-[15px]">Cabang Kos</Link>
                            <a href="/#contact" onClick={() => setIsMobileMenuOpen(false)} className="block text-slate-600 hover:text-forest hover:bg-forest/5 px-4 py-3 rounded-2xl transition-colors font-semibold text-[15px]">Kontak</a>
                            <div className="pt-4 mt-2 border-t border-white/40 flex flex-row gap-3">
                                {auth.user ? (
                                    <Link href="/dashboard" className="lux-btn-primary flex-1 py-3 rounded-2xl text-center text-sm font-bold shadow-md">Dashboard</Link>
                                ) : (
                                    <>
                                        <Link href="/login" className="lux-btn-outline flex-1 py-3 rounded-2xl text-center text-sm font-bold bg-white/40">Masuk</Link>
                                        <Link href="/register" className="lux-btn-primary flex-1 py-3 rounded-2xl text-center text-sm font-bold shadow-md">Daftar</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* ── HERO BANNER ── */}
            <section className="relative border-b border-[rgba(201,168,76,0.1)] pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img loading="lazy" src="/images/ruang%20tamu.png" alt="Hero Background" className="w-full h-full object-cover object-center" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-xl" style={{ fontFamily: "'Playfair Display', serif", textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                        Temukan Kamar <span className="text-gold italic">Impian Anda</span>
                    </h1>
                    <p className="text-white/95 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow-lg" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
                        Filter berdasarkan cabang, fasilitas, budget, dan tipe sewa untuk pengalaman pencarian yang lebih mudah.
                    </p>

                    {/* Stats bar */}
                    <div className="mt-10 inline-flex items-center gap-8 bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.3)] px-8 py-5 mx-auto">
                        <div className="text-center">
                            <div className="text-2xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{rooms.length}</div>
                            <div className="text-xs text-white/80 font-semibold uppercase tracking-wider mt-1">Total Unit</div>
                        </div>
                        <div className="w-px h-10 bg-white/30"></div>
                        <div className="text-center">
                            <div className="text-2xl font-extrabold text-gold" style={{ fontFamily: "'Outfit', sans-serif" }}>{rooms.filter(r => r.status === 'available').length}</div>
                            <div className="text-xs text-white/80 font-semibold uppercase tracking-wider mt-1">Tersedia</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── MAIN ── */}
            <main className="flex-grow py-8 sm:py-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* SIDEBAR FILTERS */}
                    <div className="w-full lg:w-72 shrink-0">
                        <div className="bg-white rounded-2xl border border-[rgba(201,168,76,0.15)] shadow-sm p-5 lg:sticky top-24 space-y-5">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-[rgba(201,168,76,0.1)] pb-4">
                                <h2 className="font-bold text-forest flex items-center gap-2 text-sm">
                                    <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                                    Filter Kamar
                                    {activeFilterCount > 0 && (
                                        <span className="text-[10px] bg-[#2d6a4f] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">{activeFilterCount}</span>
                                    )}
                                </h2>
                                {activeFilterCount > 0 && (
                                    <button aria-label="Action Button"  onClick={clearFilters} className="text-xs text-gold hover:text-[#8a6914] font-bold transition-colors flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        Reset
                                    </button>
                                )}
                            </div>

                            {/* Search */}
                            <div className="space-y-1.5">
                                <label className="lux-section-label" style={{ fontSize: '10px' }}>Cari Kata Kunci</label>
                                <div className="relative">
                                    <input type="text" placeholder="No. kamar atau fasilitas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="lux-input pl-9 pr-4 py-2.5 w-full text-xs" />
                                    <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>
                            </div>

                            {/* Mobile toggle */}
                            <button aria-label="Action Button" 
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className="lg:hidden w-full flex items-center justify-between lux-input px-4 py-3 text-sm font-bold text-forest"
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                                    Filter Lanjutan {activeFilterCount > 0 && !showMobileFilters ? `(${activeFilterCount} Aktif)` : ''}
                                </span>
                                <svg className={`w-4 h-4 transition-transform duration-300 ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                            </button>

                            {/* Advanced Filters */}
                            <div className={`space-y-4 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>

                                <div className="space-y-1.5">
                                    <label className="lux-section-label" style={{ fontSize: '10px' }}>Cabang Lokasi</label>
                                    <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="lux-select px-4 py-2.5 w-full text-xs">
                                        <option value="all">Semua Cabang</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name.replace('Kospart PH 18 - ', '')}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="lux-section-label" style={{ fontSize: '10px' }}>Tipe Sewa</label>
                                    <select value={rentalType} onChange={(e) => setRentalType(e.target.value)} className="lux-select px-4 py-2.5 w-full text-xs">
                                        <option value="all">Semua Tipe</option>
                                        <option value="monthly">Bulanan</option>
                                        <option value="daily">Harian</option>
                                        <option value="weekly">Mingguan</option>
                                        <option value="yearly">Tahunan</option>
                                    </select>
                                </div>

                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <div className="relative">
                                        <input type="checkbox" id="availableOnly" checked={showOnlyAvailable} onChange={(e) => setShowOnlyAvailable(e.target.checked)} className="peer appearance-none w-4 h-4 border-2 border-slate-300 rounded checked:bg-[#2d6a4f] checked:border-[#2d6a4f] transition-all cursor-pointer" />
                                        <svg className="absolute top-0.5 left-0.5 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">Hanya Kamar Kosong</span>
                                </label>

                                <div className="space-y-2">
                                    <label className="lux-section-label" style={{ fontSize: '10px' }}>Rentang Harga (Rp)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="lux-input px-3 py-2 w-full text-xs text-center" />
                                        <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="lux-input px-3 py-2 w-full text-xs text-center" />
                                    </div>
                                </div>


                            </div>
                        </div>
                    </div>

                    {/* ROOM GRID */}
                    <div className="flex-1 min-w-0 w-full">
                        {/* Results header */}
                        <div className="bg-white rounded-2xl border border-[rgba(201,168,76,0.12)] shadow-sm px-5 py-3.5 mb-6 flex items-center justify-between">
                            <span className="text-sm text-slate-500 font-medium">
                                Menampilkan <strong className="text-forest">{Math.min(visibleCount, filteredRooms.length)}</strong> dari <strong className="text-forest">{filteredRooms.length}</strong> unit
                            </span>
                            <span className="lux-section-label hidden sm:block">Kospart PH 18</span>
                        </div>

                        {filteredRooms.length > 0 ? (
                            <div className="space-y-8">
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                    {filteredRooms.slice(0, visibleCount).map((room, idx) => (
                                        <div
                                            key={room.id}
                                            onClick={() => { setShowRoomDetail(room); setActiveGalleryIndex(0); }}
                                            className="lux-card group cursor-pointer flex flex-row sm:flex-col"
                                        >
                                            {/* Image */}
                                            <div className="relative w-[38%] sm:w-full sm:h-48 shrink-0 overflow-hidden rounded-tl-[20px] rounded-bl-[20px] sm:rounded-bl-none sm:rounded-t-[20px] bg-slate-100">
                                                <img loading="lazy"
                                                    src={(room.photos && room.photos.length > 0) ? room.photos[0] : '/images/foto kamar 1.jpeg'}
                                                    alt={`Kamar ${room.room_number}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#1a3d2b]/30 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-500"></div>
                                                <div className="hidden sm:block absolute top-3 left-3">
                                                    <span className={`${
                                                        room.status === 'available' ? 'lux-status-available' :
                                                        room.status === 'occupied' ? 'lux-status-occupied' :
                                                        'lux-status-booked'
                                                    } backdrop-blur-sm`}>
                                                        {room.status === 'available' ? 'Tersedia' : room.status === 'occupied' ? 'Penuh' : room.status === 'booked' ? 'Dipesan' : 'Maintenance'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between">
                                                <div className="space-y-2 sm:space-y-3">
                                                    <div className="flex items-start justify-between gap-1">
                                                        <div>
                                                            <h3 className="text-forest font-bold text-sm sm:text-base leading-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Kamar {room.room_number}</h3>
                                                            <span className="text-[9px] sm:text-[10px] text-gold font-bold bg-[rgba(201,168,76,0.1)] px-2 py-0.5 rounded-md border border-[rgba(201,168,76,0.2)] mt-1 inline-block">
                                                                {room.branch.name.replace('Kospart PH 18 - ', '')}
                                                            </span>
                                                        </div>
                                                        <span className={`sm:hidden text-[8px] shrink-0 ${
                                                            room.status === 'available' ? 'lux-status-available' :
                                                            room.status === 'occupied' ? 'lux-status-occupied' : 'lux-status-booked'
                                                        }`} style={{ padding: '2px 6px' }}>
                                                            {room.status === 'available' ? 'Kosong' : 'Penuh'}
                                                        </span>
                                                    </div>

                                                    <p className="text-slate-500 text-[9px] sm:text-[11px] leading-relaxed line-clamp-2">{room.description}</p>

                                                    <div className="flex flex-wrap gap-1">
                                                        {room.facilities && (() => {
                                                            const facArray = Array.isArray(room.facilities) ? room.facilities : JSON.parse(JSON.stringify(room.facilities));
                                                            return facArray.slice(0, 2).map((fac, i) => (
                                                                <span key={i} className="lux-pill" style={{ fontSize: '8px', padding: '2px 7px' }}>
                                                                    <span className="lux-dot" style={{ width: 4, height: 4 }}></span>
                                                                    {fac}
                                                                </span>
                                                            ));
                                                        })()}
                                                        {room.facilities && room.facilities.length > 2 && (
                                                            <span className="lux-pill text-gold" style={{ fontSize: '8px', padding: '2px 7px', background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.2)' }}>
                                                                +{room.facilities.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="border-t border-[rgba(201,168,76,0.1)] pt-3 mt-3">
                                                    <div className="flex justify-between items-end mb-2.5">
                                                        {room.price_monthly > 0 && (
                                                            <div>
                                                                <span className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider block">Bulanan</span>
                                                                <span className="lux-price text-xs sm:text-sm">Rp {parseFloat(room.price_monthly).toLocaleString('id-ID')}</span>
                                                            </div>
                                                        )}
                                                        {room.price_daily > 0 && (
                                                            <div className="text-right">
                                                                <span className="text-[8px] text-slate-500 font-semibold uppercase tracking-wider block">Harian</span>
                                                                <span className="font-extrabold text-xs sm:text-sm" style={{ color: '#c9a84c', fontFamily: "'Outfit', sans-serif" }}>Rp {parseFloat(room.price_daily).toLocaleString('id-ID')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button aria-label="Action Button" 
                                                            onClick={(e) => { e.stopPropagation(); setShowRoomDetail(room); setActiveGalleryIndex(0); }}
                                                            className="py-2 lux-btn-outline text-[10px] sm:text-xs font-bold text-center"
                                                        >Detail</button>
                                                        {room.status === 'available' ? (
                                                            <button aria-label="Action Button" 
                                                                onClick={(e) => { e.stopPropagation(); handleOpenBooking(room); }}
                                                                className="py-2 lux-btn-primary text-[10px] sm:text-xs font-bold text-center"
                                                            >Booking</button>
                                                        ) : (
                                                            <button aria-label="Action Button"  disabled className="py-2 text-[10px] sm:text-xs font-bold rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed text-center">Penuh</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {filteredRooms.length > visibleCount && (
                                    <div className="flex justify-center pt-2 pb-6">
                                        <button aria-label="Action Button"  onClick={() => setVisibleCount(prev => prev + 9)} className="lux-btn-outline px-8 py-4 text-sm font-bold flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                                            Muat Lebih Banyak ({filteredRooms.length - visibleCount} Unit Tersisa)
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="lux-card rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto my-10">
                                <div className="w-16 h-16 bg-[rgba(201,168,76,0.08)] rounded-full flex items-center justify-center mx-auto">
                                    <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold text-forest" style={{ fontFamily: "'Playfair Display', serif" }}>Kamar Tidak Ditemukan</h3>
                                <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                                    Tidak ada unit kamar yang sesuai dengan filter Anda. Coba kurangi filter atau atur ulang pencarian.
                                </p>
                                <button aria-label="Action Button"  onClick={clearFilters} className="lux-btn-primary px-6 py-2.5 text-sm mx-auto inline-flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                    Atur Ulang Semua Filter
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ── ROOM DETAIL MODAL ── */}
            {showRoomDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(26,61,43,0.4)] backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl relative my-8" style={{ animation: 'modalIn 0.3s ease' }}>
                        <div className="px-6 py-5 bg-gradient-to-r from-[rgba(201,168,76,0.05)] to-white border-b border-[rgba(201,168,76,0.1)] flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-xl text-forest" style={{ fontFamily: "'Outfit', sans-serif" }}>Kamar Nomor {showRoomDetail.room_number}</h3>
                                <span className="text-gold text-[10px] font-bold tracking-wider uppercase bg-[rgba(201,168,76,0.1)] px-2.5 py-1 rounded-full mt-1.5 inline-block border border-[rgba(201,168,76,0.2)]">
                                    {showRoomDetail.branch?.name?.replace('Kospart PH 18 - ', '')}
                                </span>
                            </div>
                            <button aria-label="Action Button"  onClick={() => setShowRoomDetail(null)} className="text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-full p-2.5 transition-all hover:rotate-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-3">
                                <div className="relative h-64 rounded-2xl overflow-hidden bg-slate-100 group">
                                    {getRoomMedia(showRoomDetail)[activeGalleryIndex]?.type === 'image' ? (
                                        <img loading="lazy" src={getRoomMedia(showRoomDetail)[activeGalleryIndex]?.src} alt={`Kamar ${showRoomDetail.room_number}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <video src={getRoomMedia(showRoomDetail)[activeGalleryIndex]?.src} controls className="w-full h-full object-contain"></video>
                                    )}
                                    <div className="absolute bottom-3 right-3 bg-white/90 px-2.5 py-1 rounded-lg text-[10px] font-bold text-forest uppercase">
                                        {getRoomMedia(showRoomDetail)[activeGalleryIndex]?.type === 'video' ? 'Video Tour' : 'Foto'}
                                    </div>
                                </div>
                                <div className="flex gap-2 overflow-x-auto py-1">
                                    {getRoomMedia(showRoomDetail).map((media, idx) => (
                                        <button aria-label="Action Button"  key={idx} onClick={() => setActiveGalleryIndex(idx)} className={`w-16 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${activeGalleryIndex === idx ? 'border-[#c9a84c] scale-105' : 'border-slate-200 opacity-60 hover:opacity-100'}`}>
                                            {media.type === 'image' ? (
                                                <img loading="lazy" src={media.src} alt="thumb" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-[#2d6a4f]" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.324-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi Kamar</h4>
                                <p className="text-slate-600 text-sm leading-relaxed">{showRoomDetail.description}</p>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Fasilitas Kamar</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {showRoomDetail.facilities && (() => {
                                        const facArray = Array.isArray(showRoomDetail.facilities) ? showRoomDetail.facilities : JSON.parse(JSON.stringify(showRoomDetail.facilities));
                                        return facArray.map((fac, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-[rgba(45,106,79,0.05)] border border-[rgba(45,106,79,0.1)] text-xs">
                                                <span className="lux-dot" style={{ width: 6, height: 6 }}></span>
                                                <span className="font-semibold text-forest">{fac}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            <div className="bg-[rgba(201,168,76,0.06)] p-4 rounded-xl border border-[rgba(201,168,76,0.15)] flex flex-wrap justify-between items-center gap-3">
                                {showRoomDetail.price_yearly > 0 && (
                                    <div><span className="text-slate-500 text-[10px] uppercase font-bold block">Tahunan</span><strong className="text-forest text-lg font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>Rp {parseFloat(showRoomDetail.price_yearly).toLocaleString('id-ID')}</strong></div>
                                )}
                                {showRoomDetail.price_monthly > 0 && (
                                    <div><span className="text-slate-500 text-[10px] uppercase font-bold block">Bulanan</span><strong className="text-forest text-lg font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>Rp {parseFloat(showRoomDetail.price_monthly).toLocaleString('id-ID')}</strong></div>
                                )}
                                {showRoomDetail.price_daily > 0 && (
                                    <div><span className="text-slate-500 text-[10px] uppercase font-bold block">Harian</span><strong className="text-gold text-lg font-extrabold" style={{ fontFamily: "'Outfit', sans-serif" }}>Rp {parseFloat(showRoomDetail.price_daily).toLocaleString('id-ID')}<span className="text-xs text-slate-500 font-normal">/hr</span></strong></div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-[rgba(201,168,76,0.1)] flex justify-between gap-4">
                            <button aria-label="Action Button"  onClick={() => setShowRoomDetail(null)} className="lux-btn-outline px-6 py-2.5">Kembali</button>
                            {showRoomDetail.status === 'available' ? (
                                <button aria-label="Action Button"  onClick={() => { setShowRoomDetail(null); handleOpenBooking(showRoomDetail); }} className="lux-btn-primary px-8 py-2.5">Sewa Kamar Ini</button>
                            ) : (
                                <button aria-label="Action Button"  disabled className="px-8 py-2.5 bg-slate-200 text-slate-500 font-bold rounded-xl cursor-not-allowed">Tidak Tersedia</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── BOOKING MODAL ── */}
            {selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(26,61,43,0.4)] backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative my-8" style={{ animation: 'modalIn 0.3s ease' }}>
                        <div className="px-6 py-5 bg-gradient-to-r from-[rgba(201,168,76,0.05)] to-white border-b border-[rgba(201,168,76,0.1)] flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-xl text-forest" style={{ fontFamily: "'Outfit', sans-serif" }}>Formulir Pemesanan</h3>
                                <span className="text-gold text-[10px] font-bold tracking-wider uppercase bg-[rgba(201,168,76,0.1)] px-2.5 py-1 rounded-full mt-1.5 inline-block border border-[rgba(201,168,76,0.2)]">Kamar {selectedRoom.room_number}</span>
                            </div>
                            <button aria-label="Action Button"  onClick={resetBookingModal} className="text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-full p-2.5 transition-all hover:rotate-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {bookingStep === 'booking' && (
                            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                                    <input type="text" required value={bookingForm.name} onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})} className="lux-input px-4 py-2.5 w-full" placeholder="Nama Anda" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
                                    <input type="email" required value={bookingForm.email} onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})} className="lux-input px-4 py-2.5 w-full" placeholder="email@gmail.com" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">NIK (16 Digit)</label>
                                    <input type="text" required maxLength="16" minLength="16" pattern="\d{16}" value={bookingForm.nik} onChange={(e) => setBookingForm({...bookingForm, nik: e.target.value.replace(/\D/g, '')})} className="lux-input px-4 py-2.5 w-full tracking-widest" placeholder="16 Digit NIK Anda" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Foto KTP</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input type="file" required accept="image/*" onChange={(e) => setBookingForm({...bookingForm, ktp_photo: e.target.files[0]})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <div className="lux-input px-4 py-2.5 text-xs w-full flex items-center justify-center gap-2 font-semibold cursor-pointer text-slate-500">
                                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                <span className="truncate">{bookingForm.ktp_photo ? bookingForm.ktp_photo.name : 'Pilih Galeri'}</span>
                                            </div>
                                        </div>
                                        <div className="relative flex-1">
                                            <input type="file" accept="image/*" capture="environment" onChange={(e) => setBookingForm({...bookingForm, ktp_photo: e.target.files[0]})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <div className="bg-[rgba(45,106,79,0.08)] border-[1.5px] border-[rgba(45,106,79,0.2)] rounded-xl px-4 py-2.5 text-xs w-full flex items-center justify-center gap-1.5 font-semibold text-[#2d6a4f] cursor-pointer">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                Kamera
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-500 mt-0.5">Data KTP dijamin kerahasiaannya untuk keperluan administrasi kos.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipe Sewa</label>
                                        <select value={bookingForm.rental_type} onChange={(e) => {
                                            const newType = e.target.value;
                                            const start = new Date(bookingForm.start_date || new Date().toISOString().split('T')[0]);
                                            const end = new Date(start);
                                            if (newType === 'daily') end.setDate(end.getDate() + 1);
                                            else if (newType === 'weekly') end.setDate(end.getDate() + 7);
                                            else if (newType === 'monthly') end.setMonth(end.getMonth() + 1);
                                            else if (newType === 'yearly') end.setFullYear(end.getFullYear() + 1);
                                            setBookingForm({ ...bookingForm, rental_type: newType, end_date: end.toISOString().split('T')[0] });
                                        }} className="lux-select px-4 py-2.5 w-full text-xs">
                                            {selectedRoom.price_yearly > 0 && <option value="yearly">Tahunan</option>}
                                            {selectedRoom.price_monthly > 0 && <option value="monthly">Bulanan</option>}
                                            {selectedRoom.price_weekly > 0 && <option value="weekly">Mingguan</option>}
                                            {selectedRoom.price_daily > 0 && <option value="daily">Harian</option>}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mulai Sewa</label>
                                        <input type="date" required value={bookingForm.start_date} onChange={(e) => {
                                            const newStartStr = e.target.value;
                                            if (!newStartStr) { setBookingForm({ ...bookingForm, start_date: '' }); return; }
                                            const start = new Date(newStartStr);
                                            const end = new Date(start);
                                            const type = bookingForm.rental_type;
                                            if (type === 'daily') end.setDate(end.getDate() + 1);
                                            else if (type === 'weekly') end.setDate(end.getDate() + 7);
                                            else if (type === 'monthly') end.setMonth(end.getMonth() + 1);
                                            else if (type === 'yearly') end.setFullYear(end.getFullYear() + 1);
                                            setBookingForm({ ...bookingForm, start_date: newStartStr, end_date: end.toISOString().split('T')[0] });
                                        }} className="lux-input px-4 py-2.5 w-full text-xs text-center" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Selesai Sewa</label>
                                    <input type="date" required value={bookingForm.end_date} onChange={(e) => setBookingForm({ ...bookingForm, end_date: e.target.value })} className="lux-input px-4 py-2.5 w-full text-xs text-center" />
                                </div>
                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-[rgba(201,168,76,0.2)] transition-all">
                                    <div className="relative flex-shrink-0 mt-0.5">
                                        <input type="checkbox" required checked={bookingForm.agree_tnc} onChange={(e) => setBookingForm({...bookingForm, agree_tnc: e.target.checked})} className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-[#2d6a4f] checked:border-[#2d6a4f] transition-all cursor-pointer" />
                                        <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <span className="text-xs text-slate-500 leading-relaxed">Saya setuju dengan <a href="#" className="text-[#2d6a4f] font-bold">Syarat & Ketentuan</a> dan peraturan tata tertib Kospart PH 18. Data yang saya berikan adalah benar.</span>
                                </label>
                                <div className="p-4 rounded-xl bg-[rgba(201,168,76,0.06)] border border-[rgba(201,168,76,0.15)] flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Harga</span>
                                    <span className="text-xl font-extrabold text-forest" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                        Rp {(() => {
                                            const start = new Date(bookingForm.start_date);
                                            const end = new Date(bookingForm.end_date);
                                            let total = 0;
                                            if (start && end && start < end) {
                                                const diffTime = Math.abs(end - start);
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                if (bookingForm.rental_type === 'daily') {
                                                    let totalDaily = 0;
                                                    let currentDate = new Date(start);
                                                    const daysCount = Math.max(1, diffDays);
                                                    for (let i = 0; i < daysCount; i++) {
                                                        const dayOfWeek = currentDate.getDay();
                                                        if ((dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) && selectedRoom.price_weekend > 0) totalDaily += parseFloat(selectedRoom.price_weekend);
                                                        else totalDaily += parseFloat(selectedRoom.price_daily);
                                                        currentDate.setDate(currentDate.getDate() + 1);
                                                    }
                                                    total = totalDaily;
                                                } else if (bookingForm.rental_type === 'weekly') {
                                                    total = Math.max(1, Math.ceil(diffDays / 7)) * selectedRoom.price_weekly;
                                                } else if (bookingForm.rental_type === 'monthly') {
                                                    const sm = start.getFullYear() * 12 + start.getMonth();
                                                    const em = end.getFullYear() * 12 + end.getMonth();
                                                    let dm = em - sm;
                                                    if (end.getDate() > start.getDate()) dm += 1;
                                                    total = Math.max(1, dm) * selectedRoom.price_monthly;
                                                } else {
                                                    let dy = end.getFullYear() - start.getFullYear();
                                                    if (end.getMonth() > start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() > start.getDate())) dy += 1;
                                                    total = Math.max(1, dy) * selectedRoom.price_yearly;
                                                }
                                            }
                                            return total.toLocaleString('id-ID');
                                        })()}
                                    </span>
                                </div>
                                <button aria-label="Action Button"  disabled={isSubmitting} type="submit" className={`w-full py-3 font-bold rounded-xl text-sm transition-all ${isSubmitting ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'lux-btn-primary'}`}>
                                    {isSubmitting ? 'Memproses...' : 'Kirim & Verifikasi OTP'}
                                </button>
                            </form>
                        )}

                        {bookingStep === 'otp' && (
                            <div className="p-6 space-y-6">
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div className="space-y-1.5 text-center">
                                        <p className="text-sm text-slate-500 font-medium">Masukkan 6 digit OTP yang dikirim ke email Anda</p>
                                        <input type="text" maxLength="6" required value={otpCodeInput} onChange={(e) => setOtpCodeInput(e.target.value)} className="lux-input px-4 py-3 text-center text-xl font-bold tracking-widest w-48 mx-auto block" placeholder="——————" />
                                        {otpError && <p className="text-red-500 text-xs mt-1 font-semibold">{otpError}</p>}
                                    </div>
                                    <div className="flex gap-3">
                                        <button aria-label="Action Button"  type="button" onClick={() => setBookingStep('booking')} className="flex-1 py-3 lux-btn-outline text-sm font-bold">Kembali</button>
                                        <button aria-label="Action Button"  type="submit" className="flex-1 py-3 lux-btn-primary text-sm font-bold">Verifikasi OTP</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {bookingStep === 'payment_proof' && (
                            <form onSubmit={handleUploadPayment} className="p-6 space-y-4">
                                <div className="bg-[rgba(45,106,79,0.06)] p-4 rounded-xl border border-[rgba(45,106,79,0.15)] text-xs text-[#1a3d2b] leading-relaxed">
                                    <h4 className="font-bold mb-2 text-sm border-b border-[rgba(45,106,79,0.15)] pb-2">Pembayaran Sewa Kamar (Batas Waktu: 1 Jam)</h4>
                                    <p className="mb-2">Total: <strong className="text-[#2d6a4f]">Rp {bookingResponse?.booking?.total_amount ? parseFloat(bookingResponse.booking.total_amount).toLocaleString('id-ID') : '-'}</strong></p>
                                    <p>Transfer ke rekening:</p>
                                    <ul className="list-disc pl-5 mt-1 mb-2 space-y-1 font-bold text-slate-800"><li>BCA: 8447060961 a.n PRAYOGA HERIYANTO</li></ul>
                                    <p>Masukkan nominal dan unggah bukti transfer.</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah yang Ditransfer (Rp)</label>
                                    <input type="number" required value={paidAmountInput} onChange={(e) => setPaidAmountInput(e.target.value)} className="lux-input px-4 py-2.5 w-full" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bukti Pembayaran</label>
                                    <div className="border-2 border-dashed border-[rgba(201,168,76,0.3)] rounded-xl p-5 text-center bg-[rgba(201,168,76,0.02)] hover:bg-[rgba(201,168,76,0.05)] transition-colors relative">
                                        <input type="file" accept="image/*,application/pdf" onChange={(e) => setPaymentProofInput(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                                        <div className="pointer-events-none">
                                            {paymentProofInput ? (
                                                <div className="text-[#2d6a4f] font-bold text-xs">{paymentProofInput.name}</div>
                                            ) : (
                                                <>
                                                    <svg className="w-7 h-7 text-slate-300 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    <span className="text-xs font-semibold text-slate-500 block">Klik atau seret file ke sini</span>
                                                    <span className="text-[10px] text-slate-500">JPG, PNG, PDF (Maks. 2MB)</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button aria-label="Action Button"  type="button" onClick={() => setBookingStep('otp')} className="flex-1 py-3 lux-btn-outline text-sm font-bold">Kembali</button>
                                    <button aria-label="Action Button"  type="submit" className="flex-1 py-3 lux-btn-primary text-sm font-bold">Kirim Pembayaran</button>
                                </div>
                            </form>
                        )}

                        {bookingStep === 'success' && (
                            <div className="p-6 text-center space-y-5">
                                <div className="w-16 h-16 bg-[rgba(45,106,79,0.1)] rounded-full flex items-center justify-center mx-auto" style={{ animation: 'scaleIn 0.4s ease' }}>
                                    <svg className="w-8 h-8 text-[#2d6a4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-xl text-forest" style={{ fontFamily: "'Outfit', sans-serif" }}>Pemesanan Berhasil!</h3>
                                    <p className="text-slate-500 text-sm mt-1">{successMessage || 'Admin kami akan segera memverifikasi pembayaran Anda.'}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-[rgba(201,168,76,0.15)] text-left text-xs space-y-1.5 text-slate-600">
                                    <div><span className="text-slate-500">Kamar:</span> <strong className="text-forest">No. {selectedRoom.room_number}</strong></div>
                                    <div><span className="text-slate-500">Tipe Sewa:</span> <strong>{bookingForm.rental_type === 'monthly' ? 'Bulanan' : bookingForm.rental_type === 'daily' ? 'Harian' : 'Tahunan'}</strong></div>
                                    <div><span className="text-slate-500">Nama:</span> <strong>{bookingForm.name}</strong></div>
                                    <div><span className="text-slate-500">Mulai:</span> <strong>{bookingForm.start_date}</strong></div>
                                </div>
                                <button aria-label="Action Button"  onClick={() => window.location.href = '/dashboard'} className="w-full py-3 lux-btn-primary text-sm font-bold">Menuju Dashboard</button>
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* ── CONTACT ── */}
            <CTASection />

            {/* ── FOOTER ── */}
            <footer className="lux-footer mt-auto py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-[rgba(201,168,76,0.3)]">
                            <img loading="lazy" src="/images/logo 2.jpeg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-extrabold text-white/90 tracking-wide" style={{ fontFamily: "'Outfit', sans-serif" }}>KOSPART PH 18</span>
                    </div>
                    <p className="text-xs text-center text-white/70">
                        &copy; {new Date().getFullYear()} Kospart PH 18. All rights reserved.{' '}
                        <a href="https://api.whatsapp.com/send/?phone=6289528306239" target="_blank" rel="noopener noreferrer" className="text-gold/80 hover:text-gold font-semibold transition-colors">
                            Powered by Rifqi Bili.
                        </a>
                    </p>
                    <div className="flex gap-6 text-xs text-white/70">
                        <a href="#tentang" className="hover:text-white transition-colors">Tentang</a>
                        <Link href="/kamar" className="hover:text-white transition-colors">Cari Kamar</Link>
                        <a href="#contact" className="hover:text-white transition-colors">Kontak</a>
                    </div>
                </div>
            </footer>
            {/* ── LOGIN PROMPT MODAL ── */}
            {showLoginPrompt && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[rgba(26,61,43,0.4)] backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative" style={{ animation: 'modalIn 0.3s ease' }}>
                        <div className="p-6 text-center space-y-5">
                            <div className="w-16 h-16 bg-[rgba(201,168,76,0.1)] rounded-full flex items-center justify-center mx-auto mb-2">
                                <svg className="w-8 h-8 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            </div>
                            <h3 className="font-extrabold text-xl text-[#1a3d2b]" style={{ fontFamily: "'Outfit', sans-serif" }}>Akses Terbatas</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">Anda harus masuk atau mendaftar akun terlebih dahulu untuk melakukan booking kamar.</p>
                            
                            <div className="flex flex-col gap-3 pt-2">
                                <Link href="/login" className="lux-btn-primary py-3 text-sm font-bold w-full text-center block">Masuk Sekarang</Link>
                                <button aria-label="Action Button"  onClick={() => setShowLoginPrompt(false)} className="lux-btn-outline py-3 text-sm font-bold w-full text-center">Batal</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



