import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';

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
    
    // Let the browser set Content-Type with the boundary if it's FormData
    if (!isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    return fetch(url, {
        ...options,
        headers,
    });
}
// ────────────────────────────────────────────────────────────────────────────

export default function Rooms({ branches, rooms, auth }) {
    // Helper to get query branch parameter
    const getQueryBranch = () => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('branch') || 'all';
        }
        return 'all';
    };

    // Filters state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBranch, setSelectedBranch] = useState(getQueryBranch());
    const [rentalType, setRentalType] = useState('all');
    const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedFacilities, setSelectedFacilities] = useState([]);

    // Detail & Booking Modal state
    const [showRoomDetail, setShowRoomDetail] = useState(null);
    const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
    
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        name: '',
        email: '',
        phone: '',
        start_date: '',
        end_date: '',
        rental_type: 'monthly',
        nik: '',
        ktp_photo: null,
        agree_tnc: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // UI steps: 'browse' | 'booking' | 'otp' | 'payment_proof' | 'success'
    const [bookingStep, setBookingStep] = useState('browse');
    const [bookingResponse, setBookingResponse] = useState(null);
    const [otpCodeInput, setOtpCodeInput] = useState('');
    const [otpError, setOtpError] = useState('');
    const [paymentProofInput, setPaymentProofInput] = useState(null);
    const [paidAmountInput, setPaidAmountInput] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Listen to query parameters updates
    useEffect(() => {
        const queryBranch = getQueryBranch();
        if (queryBranch !== 'all') {
            setSelectedBranch(queryBranch);
        }
    }, []);

    // Get all unique facilities from rooms to render checklist
    const allUniqueFacilities = Array.from(
        new Set(
            rooms.flatMap(room => {
                try {
                    return Array.isArray(room.facilities) 
                        ? room.facilities 
                        : (typeof room.facilities === 'string' ? JSON.parse(room.facilities) : []);
                } catch (e) {
                    return [];
                }
            })
        )
    ).filter(Boolean);

    // Media sources for a room
    const getRoomMedia = (room) => {
        if (!room) return [];
        let media = [];
        
        // Ambil dari database jika ada
        if (room.photos && room.photos.length > 0) {
            room.photos.forEach(photo => {
                media.push({ type: 'image', src: photo });
            });
        }
        if (room.videos && room.videos.length > 0) {
            room.videos.forEach(video => {
                media.push({ type: 'video', src: video });
            });
        }

        // Fallback jika tidak ada gambar yang diunggah
        if (media.length === 0) {
            media.push({ type: 'image', src: '/images/foto kamar 1.jpeg' });
            media.push({ type: 'image', src: '/images/ruang tamu.jpeg' });
            media.push({ type: 'video', src: '/images/kamar mandi.mp4' });
        }
        
        if (parseFloat(room.price_monthly) >= 2500000) {
            media.push({ type: 'video', src: '/images/suasana kamar 2.500.000.mp4' });
        }
        return media;
    };

    // Filter Logic
    const filteredRooms = rooms.filter(room => {
        // Search text
        const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Branch
        const matchesBranch = selectedBranch === 'all' || room.branch_id === parseInt(selectedBranch);
        
        // Rental Type
        const matchesRental = rentalType === 'all' || 
            (rentalType === 'daily' && parseFloat(room.price_daily) > 0) || 
            (rentalType === 'weekly' && parseFloat(room.price_weekly) > 0) || 
            (rentalType === 'monthly' && parseFloat(room.price_monthly) > 0) || 
            (rentalType === 'yearly' && parseFloat(room.price_yearly) > 0);
        
        // Availability
        const matchesAvailability = !showOnlyAvailable || room.status === 'available';
        
        // Min Price (check against daily rate if harian filter, or monthly rate if bulanan/all filter)
        const minP = parseFloat(minPrice);
        const matchesMinPrice = isNaN(minP) || (
            (rentalType === 'daily' && parseFloat(room.price_daily) >= minP) ||
            (rentalType === 'weekly' && parseFloat(room.price_weekly) >= minP) ||
            (rentalType === 'monthly' && parseFloat(room.price_monthly) >= minP) ||
            (rentalType === 'yearly' && parseFloat(room.price_yearly) >= minP) ||
            (rentalType === 'all' && (parseFloat(room.price_yearly) >= minP || parseFloat(room.price_monthly) >= minP || parseFloat(room.price_weekly) >= minP || parseFloat(room.price_daily) >= minP))
        );

        // Max Price
        const maxP = parseFloat(maxPrice);
        const matchesMaxPrice = isNaN(maxP) || (
            (rentalType === 'daily' && parseFloat(room.price_daily) <= maxP) ||
            (rentalType === 'weekly' && parseFloat(room.price_weekly) <= maxP) ||
            (rentalType === 'monthly' && parseFloat(room.price_monthly) <= maxP) ||
            (rentalType === 'yearly' && parseFloat(room.price_yearly) <= maxP) ||
            (rentalType === 'all' && (parseFloat(room.price_yearly) <= maxP || parseFloat(room.price_monthly) <= maxP || parseFloat(room.price_weekly) <= maxP || parseFloat(room.price_daily) <= maxP))
        );

        // Facilities Checklist
        const roomFacilities = (() => {
            try {
                return Array.isArray(room.facilities) 
                    ? room.facilities 
                    : (typeof room.facilities === 'string' ? JSON.parse(room.facilities) : []);
            } catch (e) {
                return [];
            }
        })();
        const matchesFacilities = selectedFacilities.every(fac => roomFacilities.includes(fac));

        return matchesSearch && matchesBranch && matchesRental && matchesAvailability && matchesMinPrice && matchesMaxPrice && matchesFacilities;
    });

    const handleFacilityChange = (fac) => {
        if (selectedFacilities.includes(fac)) {
            setSelectedFacilities(selectedFacilities.filter(f => f !== fac));
        } else {
            setSelectedFacilities([...selectedFacilities, fac]);
        }
    };

    const handleOpenBooking = (room) => {
        if (!auth.user) {
            alert('Anda harus memiliki akun atau login terlebih dahulu untuk melakukan booking.');
            window.location.href = '/kamar/pesan';
            return;
        }

        setSelectedRoom(room);
        const defaultRentalType = room.price_monthly > 0 ? 'monthly' : (room.price_yearly > 0 ? 'yearly' : (room.price_weekly > 0 ? 'weekly' : 'daily'));
        const endDate = new Date();
        if (defaultRentalType === 'daily') {
            endDate.setDate(endDate.getDate() + 1);
        } else if (defaultRentalType === 'weekly') {
            endDate.setDate(endDate.getDate() + 7);
        } else if (defaultRentalType === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        setBookingForm({
            ...bookingForm,
            name: auth.user.name || '',
            email: auth.user.email || '',
            phone: auth.user.phone || '',
            nik: auth.user.nik || '',
            ktp_photo: null,
            agree_tnc: false,
            room_id: room.id,
            rental_type: defaultRentalType,
            start_date: new Date().toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
        });
        setBookingStep('booking');
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
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
            if (bookingForm.ktp_photo) {
                formData.append('ktp_photo', bookingForm.ktp_photo);
            }

            const res = await authFetch('/api/bookings/store', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setBookingResponse(data);
                setBookingStep('otp');
            } else {
                alert(data.message || 'Terjadi kesalahan');
            }
        } catch (err) {
            console.error(err);
            alert('Gagal mengajukan pemesanan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setOtpError('');
        try {
            const res = await authFetch('/api/bookings/verify-otp', {
                method: 'POST',
                body: JSON.stringify({
                    booking_id: bookingResponse.booking_id,
                    otp_code: otpCodeInput
                })
            });
            const data = await res.json();
            if (res.ok) {
                setBookingResponse(prev => ({...prev, booking: data.booking}));
                setPaidAmountInput(data.booking.total_amount);
                setBookingStep('payment_proof');
            } else {
                setOtpError(data.message || 'OTP salah');
            }
        } catch (err) {
            console.error(err);
            setOtpError('Gagal memverifikasi OTP.');
        }
    };

    const handleUploadPayment = async (e) => {
        e.preventDefault();
        if (!paymentProofInput) {
            alert('Pilih file bukti pembayaran terlebih dahulu.');
            return;
        }
        
        try {
            const payload = new FormData();
            payload.append('payment_proof', paymentProofInput);
            payload.append('paid_amount', paidAmountInput);

            const res = await authFetch(`/api/bookings/${bookingResponse.booking_id}/payment-proof`, {
                method: 'POST',
                body: payload
            });
            const data = await res.json();
            if (res.ok) {
                setSuccessMessage(data.message);
                setBookingStep('success');
            } else {
                alert(data.message || 'Gagal mengunggah bukti');
            }
        } catch (err) {
            console.error(err);
            alert('Gagal mengunggah pembayaran.');
        }
    };

    const resetBookingModal = () => {
        setSelectedRoom(null);
        setBookingStep('browse');
        setBookingForm({ name: '', email: '', phone: '', start_date: '', end_date: '', rental_type: 'monthly' });
        setOtpCodeInput('');
        setOtpError('');
        setBookingResponse(null);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedBranch('all');
        setRentalType('all');
        setShowOnlyAvailable(false);
        setMinPrice('');
        setMaxPrice('');
        setSelectedFacilities([]);
    };

    return (
        <div className="min-h-screen bg-mesh-dark text-slate-300 flex flex-col font-sans selection:bg-emerald-600 selection:text-white relative overflow-hidden">
            {/* Glowing Orbs */}
            <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none animate-blob"></div>
            <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-2000"></div>
            <Head title="Cari Kamar Eksklusif - Kospart PH 18" />

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
                        <Link href="/kamar" className="text-emerald-400 font-semibold text-glow">Cari Kamar</Link>
                        <Link href="/cabang" className="hover:text-emerald-400 transition-colors">Cabang Kos</Link>
                        <Link href="/#contact" className="hover:text-emerald-400 transition-colors">Kontak</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {auth.user ? (
                            <Link href="/dashboard" className="hidden sm:inline-flex px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/10">
                                Masuk Dashboard
                            </Link>
                        ) : (
                            <div className="hidden md:flex items-center gap-4">
                                <Link href="/login" className="text-slate-300 hover:text-white text-sm font-semibold transition-colors">
                                    Login 
                                </Link>
                                <Link href="/register" className="px-5 py-2.5 glass-3d hover:bg-slate-800/60 text-white font-semibold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                    Daftar 
                                </Link>
                            </div>
                        )}

                        {/* Hamburger Button for Mobile */}
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-slate-300 hover:text-emerald-400 focus:outline-none transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-slate-950 shadow-2xl border-t border-slate-700/50 p-4 space-y-4 absolute w-full left-0 z-50">
                        <Link href="/" className="block text-slate-300 hover:text-emerald-400 font-semibold py-2">Beranda</Link>
                        <Link href="/kamar" className="block text-slate-300 hover:text-emerald-400 font-semibold py-2">Cari Kamar</Link>
                        <Link href="/cabang" className="block text-slate-300 hover:text-emerald-400 font-semibold py-2">Cabang Kos</Link>
                        <Link href="/#contact" onClick={() => setIsMobileMenuOpen(false)} className="block text-slate-300 hover:text-emerald-400 font-semibold py-2">Kontak</Link>
                        
                        <div className="pt-4 border-t border-slate-700/50 flex flex-col gap-3">
                            {auth.user ? (
                                <Link href="/dashboard" className="w-full text-center px-5 py-3 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all">
                                    Masuk Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="w-full text-center px-5 py-3 glass-3d hover:bg-slate-800 text-white font-bold rounded-xl transition-all">Login</Link>
                                    <Link href="/register" className="w-full text-center px-5 py-3 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all">Daftar Akun Baru</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Banner Section */}
            <section className="relative overflow-hidden py-12 bg-transparent border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-3d text-emerald-400 text-xs font-semibold border border-emerald-500/30 tracking-wide uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)] mb-3">
                                Pencarian Unit Kamar Terlengkap
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                                Temukan Kamar Impian Anda
                            </h1>
                            <p className="text-slate-400 text-sm mt-1 max-w-xl">
                                Gunakan filter di bawah untuk menyesuaikan cabang, fasilitas, budget, dan tipe sewa.
                            </p>
                        </div>
                        <div className="flex gap-4 self-start md:self-center glass-3d px-6 py-4 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                            <div>
                                <span className="text-slate-400 text-xs font-medium block">Total Kamar</span>
                                <span className="text-2xl font-extrabold text-white text-glow">{rooms.length} Unit</span>
                            </div>
                            <div className="w-px bg-slate-700/50 my-1"></div>
                            <div>
                                <span className="text-slate-400 text-xs font-medium block">Tersedia (Vacant)</span>
                                <span className="text-2xl font-extrabold text-emerald-400 text-glow">
                                    {rooms.filter(r => r.status === 'available').length} Unit
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="flex-grow py-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Filters Sidebar */}
                    <div className="w-full lg:w-72 shrink-0">
                        <div className="glass-3d rounded-2xl p-6 sticky top-24 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
                                <h2 className="text-lg font-bold text-white">Filter Kamar</h2>
                                <button 
                                    onClick={clearFilters}
                                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                    </svg>
                                    Reset
                                </button>
                            </div>

                            {/* Search */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cari Kamar</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        placeholder="No. kamar atau kata kunci..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="glass-21st-input rounded-xl pl-9 pr-4 py-2 text-xs w-full"
                                    />
                                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* Branch Selection */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cabang Lokasi</label>
                                <select 
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    className="glass-21st-input rounded-xl px-3 py-2 text-xs w-full font-medium"
                                >
                                    <option value="all" className="bg-slate-900 text-white">Semua Cabang</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id} className="bg-slate-900 text-white">{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Rental Type */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipe Sewa</label>
                                <select 
                                    value={rentalType}
                                    onChange={(e) => setRentalType(e.target.value)}
                                    className="glass-21st-input rounded-xl px-3 py-2 text-xs w-full font-medium"
                                >
                                    <option value="all" className="bg-slate-900 text-white">Semua Tipe Sewa</option>
                                    <option value="monthly" className="bg-slate-900 text-white">Hanya Bulanan</option>
                                    <option value="daily" className="bg-slate-900 text-white">Hanya Harian</option>
                                </select>
                            </div>

                            {/* Status Availability Toggle */}
                            <div className="flex items-center gap-2 pt-1">
                                <input 
                                    type="checkbox" 
                                    id="availableOnly" 
                                    checked={showOnlyAvailable} 
                                    onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                                    className="w-4 h-4 text-emerald-500 border-slate-600 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer bg-slate-800"
                                />
                                <label htmlFor="availableOnly" className="text-xs font-bold text-slate-300 cursor-pointer select-none">
                                    Hanya Kamar Kosong (Tersedia)
                                </label>
                            </div>

                            {/* Price range inputs */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Harga Maksimum (Rp)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        type="number"
                                        placeholder="Min"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        className="glass-21st-input rounded-xl px-3 py-2 text-xs w-full text-center"
                                    />
                                    <input 
                                        type="number"
                                        placeholder="Max"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        className="glass-21st-input rounded-xl px-3 py-2 text-xs w-full text-center"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Room Grid Section */}
                    <div className="flex-1 min-w-0 w-full">
                        {/* Results count header */}
                        <div className="flex items-center justify-between glass-3d px-6 py-4 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] mb-6">
                            <span className="text-sm font-semibold text-slate-400">
                                Menampilkan <strong className="text-white">{filteredRooms.length}</strong> unit kamar yang cocok
                            </span>
                            <span className="text-xs text-emerald-400/80 font-medium tracking-widest uppercase">Sistem Kelola Pintar Kospart</span>
                        </div>

                        {/* Rooms List */}
                        {filteredRooms.length > 0 ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredRooms.map(room => (
                                    <div 
                                        key={room.id} 
                                        onClick={() => {
                                            setShowRoomDetail(room);
                                            setActiveGalleryIndex(0);
                                        }}
                                        className="glass-3d rounded-2xl overflow-hidden flex flex-col relative group cursor-pointer"
                                    >
                                        {/* Status Badge overlay */}
                                        <div className="absolute top-4 left-4 z-10">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                                                room.status === 'available' ? 'bg-emerald-500/80 text-white border border-emerald-400/50 backdrop-blur-sm' :
                                                room.status === 'occupied' ? 'bg-red-500/80 text-white border border-red-400/50 backdrop-blur-sm' :
                                                room.status === 'booked' ? 'bg-amber-500/80 text-white border border-amber-400/50 backdrop-blur-sm' :
                                                'bg-slate-500/80 text-white border border-slate-400/50 backdrop-blur-sm'
                                            }`}>
                                                {room.status === 'available' ? 'Tersedia' : 
                                                 room.status === 'occupied' ? 'Penuh' : 
                                                 room.status === 'booked' ? 'Dibooking' : 'Maintenance'}
                                            </span>
                                        </div>

                                        {/* Room Image */}
                                        <div className="relative h-48 overflow-hidden bg-slate-900">
                                            <img 
                                                src={(room.photos && room.photos.length > 0) ? room.photos[0] : '/images/foto kamar 1.jpeg'} 
                                                alt={`Kamar ${room.room_number}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
                                            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                                                <h3 className="text-white font-extrabold text-xl font-mono drop-shadow-md">No. {room.room_number}</h3>
                                                <span className="text-[10px] text-white font-bold bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-md border border-white/20 shadow-sm">
                                                    {room.branch.name.replace('Kospart PH 18 - ', '')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="p-5 flex-grow flex flex-col justify-between space-y-5">
                                            <div className="space-y-3">
                                                <p className="text-slate-300 text-xs leading-relaxed font-medium line-clamp-2">{room.description}</p>
                                                
                                                {/* Facilities List */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {room.facilities && (() => {
                                                        const facArray = Array.isArray(room.facilities) 
                                                            ? room.facilities 
                                                            : JSON.parse(JSON.stringify(room.facilities));
                                                        return facArray.slice(0, 3).map((fac, idx) => (
                                                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded glass-3d text-slate-200 text-[10px]">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
                                                                {fac}
                                                            </span>
                                                        ));
                                                    })()}
                                                    {room.facilities && room.facilities.length > 3 && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded glass-3d text-emerald-400 text-[10px] font-semibold border-emerald-500/30">
                                                            +{room.facilities.length - 3} Lainnya
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price & Actions */}
                                            <div className="border-t border-slate-700/50 pt-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    {room.price_monthly > 0 && (
                                                        <div>
                                                            <span className="text-slate-400 text-[10px] font-medium block uppercase tracking-wider">Bulanan</span>
                                                            <span className="text-white font-extrabold text-sm sm:text-base">Rp {parseFloat(room.price_monthly).toLocaleString('id-ID')}</span>
                                                        </div>
                                                    )}
                                                    {room.price_daily > 0 && (
                                                        <div className="text-right">
                                                            <span className="text-slate-400 text-[10px] font-medium block uppercase tracking-wider">Harian</span>
                                                            <span className="text-emerald-400 text-glow font-extrabold text-sm sm:text-base">Rp {parseFloat(room.price_daily).toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">/hari</span></span>
                                                            {room.price_weekend > 0 && (
                                                                <span className="text-orange-400 font-bold text-[10px] block mt-0.5 whitespace-nowrap overflow-visible">Wknd: Rp {parseFloat(room.price_weekend).toLocaleString('id-ID')}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowRoomDetail(room);
                                                            setActiveGalleryIndex(0);
                                                        }}
                                                        className="py-2.5 glass-3d hover:bg-slate-800/60 text-white text-xs font-bold rounded-xl transition-all text-center border-slate-700/50"
                                                    >
                                                        Detail Unit
                                                    </button>
                                                    {room.status === 'available' ? (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenBooking(room);
                                                            }}
                                                            className="py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400/50 flex items-center justify-center gap-1"
                                                        >
                                                            Booking
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            disabled 
                                                            className="py-2.5 glass-3d text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed text-center border-slate-700/50"
                                                        >
                                                            Penuh
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Empty State
                            <div className="glass-3d rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto my-10 border border-slate-700/50">
                                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-extrabold text-white">Kamar Tidak Ditemukan</h3>
                                <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                                    Tidak ada unit kamar yang sesuai dengan kriteria penyaringan Anda. Coba kurangi filter atau atur ulang pencarian.
                                </p>
                                <button 
                                    onClick={clearFilters}
                                    className="px-6 py-2.5 glass-3d hover:bg-slate-800/60 text-emerald-400 font-bold rounded-xl text-xs transition-all shadow-sm border border-emerald-500/30"
                                >
                                    Atur Ulang Semua Filter
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Room Detail Modal */}
            {showRoomDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
                    <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 overflow-hidden shadow-2xl shadow-emerald-900/20 relative my-8" style={{ animation: 'modalIn 0.3s ease' }}>
                        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
                        {/* Header */}
                        <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100/50 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-2xl text-slate-800 tracking-tight">Kamar Nomor {showRoomDetail.room_number}</h3>
                                <span className="text-emerald-600 text-xs font-bold tracking-wide uppercase bg-emerald-100/50 px-2.5 py-1 rounded-full mt-1.5 inline-block">{showRoomDetail.branch?.name?.replace('Kospart PH 18 - ', 'KOSPART PH 18 - ')}</span>
                            </div>
                            <button onClick={() => setShowRoomDetail(null)} className="text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2.5 transition-all duration-300 hover:rotate-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
                            {/* Media Showcase */}
                            <div className="space-y-3">
                                <div className="relative h-64 rounded-2xl overflow-hidden border border-slate-200 bg-black group">
                                    {getRoomMedia(showRoomDetail)[activeGalleryIndex]?.type === 'image' ? (
                                        <img 
                                            src={getRoomMedia(showRoomDetail)[activeGalleryIndex]?.src} 
                                            alt={`Kamar ${showRoomDetail.room_number}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                        />
                                    ) : (
                                        <video 
                                            src={getRoomMedia(showRoomDetail)[activeGalleryIndex]?.src} 
                                            controls 
                                            className="w-full h-full object-contain"
                                        ></video>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
                                    <div className="absolute bottom-4 right-4 bg-white/95 px-3 py-1 rounded-md border border-slate-250 text-[10px] font-extrabold text-slate-800 uppercase pointer-events-none">
                                        {getRoomMedia(showRoomDetail)[activeGalleryIndex]?.type === 'video' ? 'Video Tour' : 'Foto'}
                                    </div>
                                </div>
                                
                                {/* Thumbnails */}
                                <div className="flex gap-2 overflow-x-auto py-1">
                                    {getRoomMedia(showRoomDetail).map((media, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => setActiveGalleryIndex(idx)}
                                            className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all relative ${
                                                activeGalleryIndex === idx ? 'border-emerald-500 scale-105' : 'border-slate-200 opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            {media.type === 'image' ? (
                                                <img src={media.src} alt="thumbnail" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.324-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                                                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[6px] text-white text-center font-bold tracking-tighter">VIDEO</span>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Deskripsi Kamar</h4>
                                <p className="text-slate-650 text-sm leading-relaxed font-medium">{showRoomDetail.description}</p>
                            </div>

                            {/* Facilities Detail */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Fasilitas Kamar</h4>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {showRoomDetail.facilities && (() => {
                                        const facArray = Array.isArray(showRoomDetail.facilities) 
                                            ? showRoomDetail.facilities 
                                            : JSON.parse(JSON.stringify(showRoomDetail.facilities));
                                        return facArray.map((fac, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-700 text-xs">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>
                                                <span className="font-semibold">{fac}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Pricing Detail */}
                            <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100/60 flex justify-between items-center">
                                {showRoomDetail.price_yearly > 0 && (
                                    <div>
                                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Sewa Tahunan</span>
                                        <strong className="text-slate-900 text-lg font-mono">Rp {parseFloat(showRoomDetail.price_yearly).toLocaleString('id-ID')}</strong>
                                    </div>
                                )}
                                {showRoomDetail.price_monthly > 0 && (
                                    <div>
                                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Sewa Bulanan</span>
                                        <strong className="text-slate-900 text-lg font-mono">Rp {parseFloat(showRoomDetail.price_monthly).toLocaleString('id-ID')}</strong>
                                    </div>
                                )}
                                {showRoomDetail.price_weekly > 0 && (
                                    <div>
                                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Sewa Mingguan</span>
                                        <strong className="text-slate-900 text-lg font-mono">Rp {parseFloat(showRoomDetail.price_weekly).toLocaleString('id-ID')}</strong>
                                    </div>
                                )}
                                {showRoomDetail.price_daily > 0 && (
                                    <div className="text-right">
                                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Sewa Harian</span>
                                        <strong className="text-emerald-700 text-lg font-mono">Rp {parseFloat(showRoomDetail.price_daily).toLocaleString('id-ID')} <span className="text-xs text-slate-500 font-normal">/hari</span></strong>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CTA Footer */}
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-between gap-4">
                            <button onClick={() => setShowRoomDetail(null)} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-colors">Kembali</button>
                            {showRoomDetail.status === 'available' ? (
                                <button onClick={() => { setShowRoomDetail(null); handleOpenBooking(showRoomDetail); }} className="px-8 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300">Sewa Kamar Ini</button>
                            ) : (
                                <button disabled className="px-8 py-2.5 rounded-xl bg-slate-200 text-slate-500 font-bold cursor-not-allowed">Tidak Tersedia</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal & Simulator */}
            {selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
                    <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 overflow-hidden shadow-2xl shadow-emerald-900/20 relative my-8" style={{ animation: 'modalIn 0.3s ease' }}>
                        {/* Header */}
                        <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100/50 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-2xl text-slate-800 tracking-tight">Formulir Pemesanan</h3>
                                <p className="text-emerald-600 text-xs font-bold tracking-wide uppercase bg-emerald-100/50 px-2.5 py-1 rounded-full mt-1.5 inline-block">Kamar {selectedRoom.room_number}</p>
                            </div>
                            <button onClick={resetBookingModal} className="text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2.5 transition-all duration-300 hover:rotate-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Step 1: Booking Form */}
                        {bookingStep === 'booking' && (
                            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={bookingForm.name}
                                        onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                                        className="bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-sm w-full font-medium transition-all"
                                        placeholder="Penyewa Baru"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={bookingForm.email}
                                        onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                                        className="bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-sm w-full font-medium transition-all"
                                        placeholder="penyewa@gmail.com"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">NIK (Nomor Induk Kependudukan)</label>
                                    <input 
                                        type="text" 
                                        required
                                        maxLength="16"
                                        minLength="16"
                                        pattern="\d{16}"
                                        title="Harus terdiri dari tepat 16 digit angka"
                                        value={bookingForm.nik}
                                        onChange={(e) => setBookingForm({...bookingForm, nik: e.target.value.replace(/\D/g, '')})}
                                        className="bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-sm w-full font-medium transition-all tracking-widest"
                                        placeholder="16 Digit NIK Anda"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Foto KTP Asli</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input 
                                                type="file" 
                                                required
                                                accept="image/*"
                                                onChange={(e) => setBookingForm({...bookingForm, ktp_photo: e.target.files[0]})}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="bg-slate-50 text-slate-700 rounded-xl px-4 py-2.5 text-xs w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-100 transition-all font-semibold">
                                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                <span className="truncate">{bookingForm.ktp_photo ? bookingForm.ktp_photo.name : 'Pilih File (Galeri)'}</span>
                                            </div>
                                        </div>
                                        <div className="relative flex-1">
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                capture="environment"
                                                onChange={(e) => setBookingForm({...bookingForm, ktp_photo: e.target.files[0]})}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="bg-emerald-50 text-emerald-700 rounded-xl px-4 py-2.5 text-xs w-full flex items-center justify-center gap-2 border border-emerald-200 hover:bg-emerald-100 transition-all font-semibold">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                <span>Buka Kamera</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Data NIK dan KTP dijamin kerahasiaannya dan hanya untuk keperluan administrasi Kos.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tipe Sewa</label>
                                        <select
                                            value={bookingForm.rental_type}
                                            onChange={(e) => {
                                                const newType = e.target.value;
                                                const start = new Date(bookingForm.start_date || new Date().toISOString().split('T')[0]);
                                                const end = new Date(start);
                                                if (newType === 'daily') end.setDate(end.getDate() + 1);
                                                else if (newType === 'weekly') end.setDate(end.getDate() + 7);
                                                else if (newType === 'monthly') end.setMonth(end.getMonth() + 1);
                                                else if (newType === 'yearly') end.setFullYear(end.getFullYear() + 1);
                                                setBookingForm({ ...bookingForm, rental_type: newType, end_date: end.toISOString().split('T')[0] });
                                            }}
                                            className="bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-sm w-full font-medium transition-all"
                                        >
                                            {selectedRoom.price_yearly > 0 && <option value="yearly">Tahunan</option>}
                                            {selectedRoom.price_monthly > 0 && <option value="monthly">Bulanan</option>}
                                            {selectedRoom.price_weekly > 0 && <option value="weekly">Mingguan</option>}
                                            {selectedRoom.price_daily > 0 && <option value="daily">Harian</option>}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mulai Sewa</label>
                                        <input 
                                            type="date"
                                            required
                                            value={bookingForm.start_date}
                                            onChange={(e) => {
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
                                            }}
                                            className="bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-sm w-full font-medium transition-all text-center"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Selesai Sewa</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={bookingForm.end_date}
                                        onChange={(e) => setBookingForm({...bookingForm, end_date: e.target.value})}
                                        className="bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-sm w-full font-medium transition-all text-center"
                                    />
                                </div>

                                <div className="pt-2 pb-2">
                                    <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="relative flex items-center justify-center mt-0.5">
                                            <input 
                                                type="checkbox" 
                                                required
                                                checked={bookingForm.agree_tnc}
                                                onChange={(e) => setBookingForm({...bookingForm, agree_tnc: e.target.checked})}
                                                className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer"
                                            />
                                            <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                        <span className="text-xs text-slate-600 leading-relaxed font-medium">
                                            Saya setuju dengan <a href="#" className="text-emerald-600 font-bold hover:underline">Syarat & Ketentuan</a> serta peraturan tata tertib Kospart PH 18. Saya menyatakan bahwa data yang saya berikan adalah benar.
                                        </span>
                                    </label>
                                </div>

                                {/* Dynamic Price Preview */}
                                <div className="mt-4 p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 flex justify-between items-center shadow-inner shadow-white">
                                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Total Harga Sewa</span>
                                    <span className="text-xl font-black text-emerald-600 drop-shadow-sm">
                                        Rp {(() => {
                                            const start = new Date(bookingForm.start_date);
                                            const end = new Date(bookingForm.end_date);
                                            let total = 0;
                                            if (start && end && start < end) {
                                                const diffTime = Math.abs(end - start);
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                if (bookingForm.rental_type === 'daily') {
                                                    // Weekend logic: Friday, Saturday, Sunday = 250,000
                                                    let totalDaily = 0;
                                                    let currentDate = new Date(start);
                                                    const daysCount = Math.max(1, diffDays);
                                                    for (let i = 0; i < daysCount; i++) {
                                                        const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
                                                        if ((dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) && selectedRoom.price_weekend > 0) {
                                                            totalDaily += parseFloat(selectedRoom.price_weekend);
                                                        } else {
                                                            totalDaily += parseFloat(selectedRoom.price_daily);
                                                        }
                                                        currentDate.setDate(currentDate.getDate() + 1);
                                                    }
                                                    total = totalDaily;
                                                } else if (bookingForm.rental_type === 'weekly') {
                                                    const diffWeeks = Math.ceil(diffDays / 7);
                                                    total = Math.max(1, diffWeeks) * selectedRoom.price_weekly;
                                                } else if (bookingForm.rental_type === 'monthly') {
                                                    const startMonth = start.getFullYear() * 12 + start.getMonth();
                                                    const endMonth = end.getFullYear() * 12 + end.getMonth();
                                                    let diffMonths = endMonth - startMonth;
                                                    if (end.getDate() > start.getDate()) diffMonths += 1;
                                                    total = Math.max(1, diffMonths) * selectedRoom.price_monthly;
                                                } else {
                                                    let diffYears = end.getFullYear() - start.getFullYear();
                                                    if (end.getMonth() > start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() > start.getDate())) diffYears += 1;
                                                    total = Math.max(1, diffYears) * selectedRoom.price_yearly;
                                                }
                                            }
                                            return total.toLocaleString('id-ID');
                                        })()}
                                    </span>
                                </div>

                                <button disabled={isSubmitting} type="submit" className={`w-full mt-4 py-3 font-bold rounded-xl text-sm transition-all shadow-lg ${isSubmitting ? 'bg-slate-400 text-slate-200 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 text-white'}`}>
                                    {isSubmitting ? 'Memproses...' : 'Kirim & Verifikasi OTP'}
                                </button>
                            </form>
                        )}

                        {/* Step 2: OTP WhatsApp Verification Simulator */}
                        {bookingStep === 'otp' && (
                            <div className="p-6 space-y-6">

                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div className="space-y-1.5 text-center">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Masukkan 6 Digit Kode OTP</label>
                                        <input 
                                            type="text" 
                                            maxLength="6"
                                            required
                                            value={otpCodeInput}
                                            onChange={(e) => setOtpCodeInput(e.target.value)}
                                            className="glass-21st-input rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest w-48 mx-auto block font-mono"
                                            placeholder="------"
                                        />
                                        {otpError && <p className="text-red-650 text-xs mt-1 font-semibold">{otpError}</p>}
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button type="button" onClick={() => setBookingStep('booking')} className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all border border-slate-200">Kembali</button>
                                        <button type="submit" className="flex-1 py-3 font-bold rounded-xl text-sm transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 text-white">Verifikasi OTP</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Step 3: Upload Payment Proof Simulator */}
                        {bookingStep === 'payment_proof' && (
                            <form onSubmit={handleUploadPayment} className="p-6 space-y-4">
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-850 leading-relaxed">
                                    <h4 className="font-extrabold mb-2 text-sm text-emerald-900 border-b border-emerald-200 pb-2">Pembayaran Sewa Kamar (Batas Waktu: 1 Jam)</h4>
                                    <p className="mb-2">Total yang harus dibayar: <strong className="text-emerald-700 text-sm">Rp {bookingResponse?.booking?.total_amount ? parseFloat(bookingResponse.booking.total_amount).toLocaleString('id-ID') : (bookingForm.rental_type === 'daily' ? selectedRoom.price_daily : selectedRoom.price_monthly).toLocaleString('id-ID')}</strong></p>
                                    <p>Silakan selesaikan pembayaran ke rekening berikut:</p>
                                    <ul className="list-disc pl-5 mt-2 mb-3 space-y-1 font-bold text-slate-800">
                                        <li>BCA: 8447060961</li>
                                    </ul>
                                    <p className="mb-3">ATAS NAMA: <strong className="text-emerald-900">PRAYOGA HERIYANTO</strong></p>
                                    <p>Masukkan nominal yang Anda transfer dan unggah bukti transfer di bawah ini.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-505 uppercase">Jumlah yang Ditransfer (Rp)</label>
                                    <input 
                                        type="number"
                                        required
                                        value={paidAmountInput}
                                        onChange={(e) => setPaidAmountInput(e.target.value)}
                                        className="glass-21st-input rounded-xl px-4 py-2.5 text-xs w-full"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-505 uppercase">Bukti Pembayaran (Foto/File)</label>
                                    <div className="border border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors relative overflow-hidden">
                                        <input 
                                            type="file" 
                                            accept="image/*,application/pdf"
                                            onChange={(e) => setPaymentProofInput(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            required
                                        />
                                        <div className="pointer-events-none">
                                            {paymentProofInput ? (
                                                <div className="text-emerald-600 font-bold text-sm">
                                                    File: {paymentProofInput.name}
                                                </div>
                                            ) : (
                                                <>
                                                    <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    <span className="text-xs font-semibold text-slate-600 block">Klik atau Seret file ke sini</span>
                                                    <span className="text-[10px] text-slate-400">Format: JPG, PNG, PDF (Maks. 2MB)</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setBookingStep('otp')} className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all border border-slate-200">
                                        Kembali
                                    </button>
                                    <button type="submit" className="flex-1 py-3 font-bold rounded-xl text-sm transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 text-white">
                                        Kirim Pembayaran
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 4: Success Feedback */}
                        {bookingStep === 'success' && (
                            <div className="p-6 text-center space-y-5">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-extrabold text-slate-900">Pemesanan Berhasil Diajukan!</h3>
                                    <p className="text-xs text-slate-550 leading-relaxed max-w-sm mx-auto">
                                        {successMessage || 'Pemesanan Anda telah diterima. Admin kami akan segera melakukan verifikasi pembayaran Anda melalui sistem.'}
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-1.5 font-medium text-slate-700">
                                    <div><span className="text-slate-450">Nomor Kamar:</span> <strong className="text-slate-900">No. {selectedRoom.room_number}</strong></div>
                                    <div><span className="text-slate-450">Tipe Sewa:</span> <strong className="text-slate-905">{bookingForm.rental_type === 'monthly' ? 'Bulanan' : 'Harian'}</strong></div>
                                    <div><span className="text-slate-450">Nama Penyewa:</span> <strong className="text-slate-905">{bookingForm.name}</strong></div>
                                    <div><span className="text-slate-450">Mulai Sewa:</span> <strong className="text-slate-905">{bookingForm.start_date}</strong></div>
                                </div>
                                <button 
                                    onClick={() => window.location.href = '/dashboard'}
                                    className="w-full py-3 font-bold rounded-xl text-sm transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 text-white"
                                >
                                    Menuju Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Footer */}
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
