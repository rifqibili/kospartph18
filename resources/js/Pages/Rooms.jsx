import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';

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
        rental_type: 'monthly'
    });
    
    // UI steps: 'browse' | 'booking' | 'otp' | 'payment_proof' | 'success'
    const [bookingStep, setBookingStep] = useState('browse');
    const [bookingResponse, setBookingResponse] = useState(null);
    const [otpCodeInput, setOtpCodeInput] = useState('');
    const [otpError, setOtpError] = useState('');
    const [paymentProofInput, setPaymentProofInput] = useState('');
    const [paidAmountInput, setPaidAmountInput] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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
        const media = [
            { type: 'image', src: room.image || '/images/foto kamar 1.jpeg' },
            { type: 'image', src: '/images/ruang tamu.jpeg' },
            { type: 'image', src: '/images/ruang tunggu dan respsionis.jpeg' },
            { type: 'image', src: '/images/tampak depan.jpeg' },
            { type: 'video', src: '/images/kamar mandi.mp4' },
            { type: 'video', src: '/images/ruang tunggu, kursi pijat, resepsionis.mp4' }
        ];
        
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
            (rentalType === 'monthly' && parseFloat(room.price_monthly) > 0);
        
        // Availability
        const matchesAvailability = !showOnlyAvailable || room.status === 'available';
        
        // Min Price (check against daily rate if harian filter, or monthly rate if bulanan/all filter)
        const minP = parseFloat(minPrice);
        const matchesMinPrice = isNaN(minP) || (
            (rentalType === 'daily' && parseFloat(room.price_daily) >= minP) ||
            (rentalType === 'monthly' && parseFloat(room.price_monthly) >= minP) ||
            (rentalType === 'all' && (parseFloat(room.price_monthly) >= minP || parseFloat(room.price_daily) >= minP))
        );

        // Max Price
        const maxP = parseFloat(maxPrice);
        const matchesMaxPrice = isNaN(maxP) || (
            (rentalType === 'daily' && parseFloat(room.price_daily) <= maxP) ||
            (rentalType === 'monthly' && parseFloat(room.price_monthly) <= maxP) ||
            (rentalType === 'all' && (parseFloat(room.price_monthly) <= maxP || parseFloat(room.price_daily) <= maxP))
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
        setSelectedRoom(room);
        setBookingForm({
            ...bookingForm,
            room_id: room.id,
            rental_type: room.price_daily > 0 && room.price_monthly > 0 ? 'monthly' : (room.price_monthly > 0 ? 'monthly' : 'daily'),
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // default 30 days
        });
        setBookingStep('booking');
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/guest/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    room_id: selectedRoom.id,
                    rental_type: bookingForm.rental_type,
                    start_date: bookingForm.start_date,
                    end_date: bookingForm.end_date,
                    name: bookingForm.name,
                    email: bookingForm.email,
                    phone: bookingForm.phone,
                })
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
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setOtpError('');
        try {
            const res = await fetch('/api/guest/bookings/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    booking_id: bookingResponse.booking_id,
                    otp_code: otpCodeInput
                })
            });
            const data = await res.json();
            if (res.ok) {
                setPaidAmountInput(selectedRoom.price_monthly); // default suggest monthly price
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
        try {
            const res = await fetch(`/api/guest/bookings/${bookingResponse.booking_id}/payment-proof`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    payment_proof: 'proof_uploaded_simulation.png',
                    paid_amount: paidAmountInput
                })
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
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
            <Head title="Cari Kamar Eksklusif - Kospart PH 18" />

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
                        <Link href="/kamar" className="text-emerald-600 font-semibold">Cari Kamar</Link>
                        <Link href="/cabang" className="hover:text-emerald-600 transition-colors">Cabang Kos</Link>
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

            {/* Banner Section */}
            <section className="relative overflow-hidden py-12 bg-premium-dark border-b border-emerald-50">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-3">
                                Pencarian Unit Kamar Terlengkap
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                                Temukan Kamar Impian Anda
                            </h1>
                            <p className="text-slate-600 text-sm mt-1 max-w-xl">
                                Gunakan filter di bawah untuk menyesuaikan cabang, fasilitas, budget, dan tipe sewa.
                            </p>
                        </div>
                        <div className="flex gap-4 self-start md:self-center bg-white border border-slate-200 px-6 py-4 rounded-2xl shadow-sm">
                            <div>
                                <span className="text-slate-500 text-xs font-medium block">Total Kamar</span>
                                <span className="text-2xl font-extrabold text-slate-900">{rooms.length} Unit</span>
                            </div>
                            <div className="w-px bg-slate-200 my-1"></div>
                            <div>
                                <span className="text-slate-500 text-xs font-medium block">Tersedia (Vacant)</span>
                                <span className="text-2xl font-extrabold text-emerald-600">
                                    {rooms.filter(r => r.status === 'available').length} Unit
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="flex-grow py-10 w-full" style={{maxWidth:'1280px', margin:'0 auto', padding:'2.5rem 1.5rem'}}>
                <div style={{display:'flex', flexDirection:'row', gap:'2rem', alignItems:'flex-start'}}>
                    {/* Filters Sidebar */}
                    <div style={{width:'288px', minWidth:'288px', flexShrink:0}}>
                        <div className="glass-panel rounded-2xl p-6 border-glow-emerald sticky top-24 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <h2 className="text-lg font-bold text-slate-900">Filter Kamar</h2>
                                <button 
                                    onClick={clearFilters}
                                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                    </svg>
                                    Reset
                                </button>
                            </div>

                            {/* Search */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-505 uppercase tracking-wider">Cari Kamar</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        placeholder="No. kamar atau kata kunci..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="glass-input rounded-xl pl-9 pr-4 py-2 text-xs w-full"
                                    />
                                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* Branch Selection */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-505 uppercase tracking-wider">Cabang Lokasi</label>
                                <select 
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    className="glass-input rounded-xl px-3 py-2 text-xs w-full font-medium"
                                >
                                    <option value="all">Semua Cabang</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Rental Type */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-505 uppercase tracking-wider">Tipe Sewa</label>
                                <select 
                                    value={rentalType}
                                    onChange={(e) => setRentalType(e.target.value)}
                                    className="glass-input rounded-xl px-3 py-2 text-xs w-full font-medium"
                                >
                                    <option value="all">Semua Tipe Sewa</option>
                                    <option value="monthly">Hanya Bulanan</option>
                                    <option value="daily">Hanya Harian</option>
                                </select>
                            </div>

                            {/* Status Availability Toggle */}
                            <div className="flex items-center gap-2 pt-1">
                                <input 
                                    type="checkbox" 
                                    id="availableOnly" 
                                    checked={showOnlyAvailable} 
                                    onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 border-slate-350 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                                />
                                <label htmlFor="availableOnly" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                                    Hanya Kamar Kosong (Tersedia)
                                </label>
                            </div>

                            {/* Price range inputs */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-505 uppercase tracking-wider block">Harga Maksimum (Rp)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        type="number"
                                        placeholder="Min"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        className="glass-input rounded-xl px-3 py-2 text-xs w-full text-center"
                                    />
                                    <input 
                                        type="number"
                                        placeholder="Max"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        className="glass-input rounded-xl px-3 py-2 text-xs w-full text-center"
                                    />
                                </div>
                            </div>

                            {/* Facilities Checklist */}
                            <div className="space-y-2.5">
                                <label className="text-xs font-bold text-slate-550 uppercase tracking-wider block">Fasilitas Kamar</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {allUniqueFacilities.map((fac, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                id={`fac-${idx}`}
                                                checked={selectedFacilities.includes(fac)}
                                                onChange={() => handleFacilityChange(fac)}
                                                className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                            />
                                            <label htmlFor={`fac-${idx}`} className="text-xs font-medium text-slate-750 cursor-pointer select-none">
                                                {fac}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Room Grid Section */}
                    <div style={{flex:'1 1 0%', minWidth:0}}>
                        {/* Results count header */}
                        <div className="flex items-center justify-between bg-white border border-slate-200 px-6 py-4 rounded-2xl shadow-sm">
                            <span className="text-sm font-semibold text-slate-650">
                                Menampilkan <strong className="text-slate-900">{filteredRooms.length}</strong> unit kamar yang cocok
                            </span>
                            <span className="text-xs text-slate-400 font-medium">Sistem Kelola Pintar Kospart</span>
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
                                        className="glass-card rounded-2xl overflow-hidden flex flex-col relative group cursor-pointer"
                                    >
                                        {/* Status Badge overlay */}
                                        <div className="absolute top-4 left-4 z-10">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                                                room.status === 'available' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                room.status === 'occupied' ? 'bg-red-100 text-red-850 border border-red-200' :
                                                room.status === 'booked' ? 'bg-amber-100 text-amber-850 border border-amber-200' :
                                                'bg-slate-100 text-slate-650 border border-slate-200'
                                            }`}>
                                                {room.status === 'available' ? 'Tersedia' : 
                                                 room.status === 'occupied' ? 'Penuh' : 
                                                 room.status === 'booked' ? 'Dibooking' : 'Maintenance'}
                                            </span>
                                        </div>

                                        {/* Room Image */}
                                        <div className="relative h-48 overflow-hidden bg-slate-100">
                                            <img 
                                                src={room.image || '/images/foto kamar 1.jpeg'} 
                                                alt={`Kamar ${room.room_number}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                                            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                                                <h3 className="text-white font-extrabold text-xl font-mono">No. {room.room_number}</h3>
                                                <span className="text-[10px] text-slate-700 font-bold bg-white/90 px-2 py-0.5 rounded-md backdrop-blur-sm border border-slate-200 shadow-sm">
                                                    {room.branch.name.replace('Kospart PH 18 - ', '')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="p-5 flex-grow flex flex-col justify-between space-y-5">
                                            <div className="space-y-3">
                                                <p className="text-slate-600 text-xs leading-relaxed font-medium line-clamp-2">{room.description}</p>
                                                
                                                {/* Facilities List (max 3 tags inside card, with count if more) */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {room.facilities && (() => {
                                                        const facArray = Array.isArray(room.facilities) 
                                                            ? room.facilities 
                                                            : JSON.parse(JSON.stringify(room.facilities));
                                                        return facArray.slice(0, 3).map((fac, idx) => (
                                                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-700 text-[10px] border border-slate-200/80">
                                                                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                                                {fac}
                                                            </span>
                                                        ));
                                                    })()}
                                                    {room.facilities && room.facilities.length > 3 && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] border border-emerald-100 font-semibold">
                                                            +{room.facilities.length - 3} Lainnya
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price & Actions */}
                                            <div className="border-t border-slate-100 pt-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    {room.price_monthly > 0 && (
                                                        <div>
                                                            <span className="text-slate-400 text-[10px] font-medium block uppercase tracking-wider">Bulanan</span>
                                                            <span className="text-slate-900 font-extrabold text-sm sm:text-base">Rp {parseFloat(room.price_monthly).toLocaleString('id-ID')}</span>
                                                        </div>
                                                    )}
                                                    {room.price_daily > 0 && (
                                                        <div className="text-right">
                                                            <span className="text-slate-400 text-[10px] font-medium block uppercase tracking-wider">Harian</span>
                                                            <span className="text-emerald-600 font-extrabold text-sm sm:text-base">Rp {parseFloat(room.price_daily).toLocaleString('id-ID')} <span className="text-[10px] text-slate-500 font-normal">/hari</span></span>
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
                                                        className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200/80 text-center"
                                                    >
                                                        Detail Unit
                                                    </button>
                                                    {room.status === 'available' ? (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenBooking(room);
                                                            }}
                                                            className="py-2.5 bg-emerald-gradient hover:opacity-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                                                        >
                                                            Booking
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            disabled 
                                                            className="py-2.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed text-center"
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
                            <div className="glass-panel rounded-3xl p-12 text-center space-y-4 border border-slate-200 max-w-xl mx-auto my-10">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-extrabold text-slate-900">Kamar Tidak Ditemukan</h3>
                                <p className="text-slate-550 text-sm max-w-md mx-auto leading-relaxed">
                                    Tidak ada unit kamar yang sesuai dengan kriteria penyaringan Anda. Coba kurangi filter atau atur ulang pencarian.
                                </p>
                                <button 
                                    onClick={clearFilters}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl relative my-8">
                        {/* Header */}
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-outfit font-extrabold text-xl text-slate-900">Kamar Nomor {showRoomDetail.room_number}</h3>
                                <p className="text-xs text-emerald-600 font-bold tracking-wide uppercase mt-0.5">{showRoomDetail.branch.name}</p>
                            </div>
                            <button onClick={() => setShowRoomDetail(null)} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
                            {/* Media Showcase */}
                            <div className="space-y-3">
                                <div className="relative h-64 rounded-xl overflow-hidden border border-slate-200 bg-black group">
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
                                {showRoomDetail.price_monthly > 0 && (
                                    <div>
                                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Sewa Bulanan</span>
                                        <strong className="text-slate-900 text-lg font-mono">Rp {parseFloat(showRoomDetail.price_monthly).toLocaleString('id-ID')}</strong>
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
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-4">
                            <button 
                                onClick={() => setShowRoomDetail(null)} 
                                className="flex-1 py-3 bg-white hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl transition-all border border-slate-200 shadow-sm"
                            >
                                Kembali
                            </button>
                            {showRoomDetail.status === 'available' ? (
                                <button 
                                    onClick={() => {
                                        setShowRoomDetail(null);
                                        handleOpenBooking(showRoomDetail);
                                    }}
                                    className="flex-1 py-3 bg-emerald-gradient hover:opacity-95 text-white text-sm font-bold rounded-xl transition-all shadow-md"
                                >
                                    Sewa Kamar Ini
                                </button>
                            ) : (
                                <button 
                                    disabled 
                                    className="flex-1 py-3 bg-slate-100 border border-slate-200 text-slate-400 text-sm font-bold rounded-xl cursor-not-allowed"
                                >
                                    Unit Penuh
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal & Simulator */}
            {selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl relative my-8">
                        {/* Header */}
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-xl text-slate-900 font-outfit">Booking Kamar No. {selectedRoom.room_number}</h3>
                                <p className="text-xs text-emerald-600 font-bold tracking-wide uppercase mt-0.5">{selectedRoom.branch.name}</p>
                            </div>
                            <button onClick={resetBookingModal} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
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
                                        className="glass-input rounded-xl px-4 py-2.5 text-xs w-full"
                                        placeholder="Penyewa Baru"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={bookingForm.email}
                                        onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                                        className="glass-input rounded-xl px-4 py-2.5 text-xs w-full"
                                        placeholder="penyewa@gmail.com"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">No. WhatsApp</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={bookingForm.phone}
                                        onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                                        className="glass-input rounded-xl px-4 py-2.5 text-xs w-full"
                                        placeholder="08980598327"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Tipe Sewa</label>
                                        <select
                                            value={bookingForm.rental_type}
                                            onChange={(e) => setBookingForm({...bookingForm, rental_type: e.target.value})}
                                            className="glass-input rounded-xl px-3 py-2.5 text-xs w-full font-medium"
                                        >
                                            {selectedRoom.price_monthly > 0 && <option value="monthly">Bulanan</option>}
                                            {selectedRoom.price_daily > 0 && <option value="daily">Harian</option>}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Mulai Sewa</label>
                                        <input 
                                            type="date"
                                            required
                                            value={bookingForm.start_date}
                                            onChange={(e) => setBookingForm({...bookingForm, start_date: e.target.value})}
                                            className="glass-input rounded-xl px-3 py-2 text-xs w-full text-center"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Selesai Sewa</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={bookingForm.end_date}
                                        onChange={(e) => setBookingForm({...bookingForm, end_date: e.target.value})}
                                        className="glass-input rounded-xl px-3 py-2.5 text-xs w-full text-center"
                                    />
                                </div>

                                <button type="submit" className="w-full mt-4 py-3 bg-emerald-gradient hover:opacity-95 text-white font-bold rounded-xl text-sm transition-all shadow-sm">
                                    Kirim & Minta OTP Whatsapp
                                </button>
                            </form>
                        )}

                        {/* Step 2: OTP WhatsApp Verification Simulator */}
                        {bookingStep === 'otp' && (
                            <div className="p-6 space-y-6">
                                <div className="bg-slate-50 p-4 rounded-xl border border-emerald-100">
                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block mb-2">WhatsApp OTP Simulator</span>
                                    <p className="text-xs text-slate-600 leading-relaxed">Sistem mendeteksi pengajuan pendaftaran. Berikut adalah pesan WhatsApp simulasi yang dikirimkan ke nomor HP Anda:</p>
                                    
                                    {/* Mock WhatsApp Chat Box */}
                                    <div className="mt-3 bg-[#efeae2] p-3 rounded-lg border border-[#e9edef] max-w-sm mx-auto font-sans text-xs shadow-inner">
                                        <div className="flex items-center gap-2 border-b border-white pb-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-[9px] text-white">KP</div>
                                            <div>
                                                <span className="font-bold text-[#111b21] block text-[10px]">ADMIN KOSPART PH 18</span>
                                                <span className="text-[#667781] text-[8px]">Online</span>
                                            </div>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-lg rounded-tl-none text-[#111b21] inline-block max-w-[85%] relative border border-slate-100 shadow-sm">
                                            <p className="font-bold text-emerald-700 text-[10px] mb-1">Halo {bookingForm.name},</p>
                                            <p className="mb-2">Selanjutnya Anda perlu memverifikasi pemesanan Anda, silakan masukkan kode OTP berikut:</p>
                                            <p className="text-base font-bold text-center bg-[#f0fdf4] py-2 border border-emerald-200 rounded tracking-widest font-mono text-emerald-700">{bookingResponse?.otp_code_simulated}</p>
                                            <p className="text-[8px] text-[#667781] mt-2 text-right">Baru saja</p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div className="space-y-1.5 text-center">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Masukkan 6 Digit Kode OTP</label>
                                        <input 
                                            type="text" 
                                            maxLength="6"
                                            required
                                            value={otpCodeInput}
                                            onChange={(e) => setOtpCodeInput(e.target.value)}
                                            className="glass-input rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest w-48 mx-auto block font-mono"
                                            placeholder="------"
                                        />
                                        {otpError && <p className="text-red-650 text-xs mt-1 font-semibold">{otpError}</p>}
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button type="button" onClick={() => setBookingStep('booking')} className="flex-1 py-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 shadow-sm">
                                            Kembali
                                        </button>
                                        <button type="submit" className="flex-1 py-3 bg-emerald-gradient hover:opacity-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
                                            Verifikasi OTP
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Step 3: Upload Payment Proof Simulator */}
                        {bookingStep === 'payment_proof' && (
                            <form onSubmit={handleUploadPayment} className="p-6 space-y-4">
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-850 leading-relaxed">
                                    <h4 className="font-extrabold mb-1 text-emerald-900">Batas Waktu Pembayaran: 6 Jam</h4>
                                    Untuk mengaktifkan penyewaan kamar, silakan selesaikan pembayaran ke rekening <strong>BCA 1234-5678-90 a.n KOSPART PH 18</strong> dan unggah bukti transfer di bawah ini.
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-505 uppercase">Jumlah yang Ditransfer (Rp)</label>
                                    <input 
                                        type="number"
                                        required
                                        value={paidAmountInput}
                                        onChange={(e) => setPaidAmountInput(e.target.value)}
                                        className="glass-input rounded-xl px-4 py-2.5 text-xs w-full"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-505 uppercase">Bukti Pembayaran (Foto/File)</label>
                                    <div className="border border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors cursor-pointer">
                                        <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        <span className="text-xs font-semibold text-slate-600 block">Klik untuk simulasi unggah file</span>
                                        <span className="text-[10px] text-slate-400">Format: JPG, PNG, PDF (Maks. 2MB)</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setBookingStep('otp')} className="flex-1 py-3 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 shadow-sm">
                                        Kembali
                                    </button>
                                    <button type="submit" className="flex-1 py-3 bg-emerald-gradient hover:opacity-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
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
                                    onClick={resetBookingModal}
                                    className="w-full py-3 bg-emerald-gradient hover:opacity-95 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                                >
                                    Kembali ke Pencarian Kamar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
