import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';

/* ─── Scroll-reveal hook ─── */
function useReveal() {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        if (!ref.current) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.12 }
        );
        obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return [ref, visible];
}

/* ─── Animated wrapper components ─── */
const FadeUp = ({ children, delay = 0, className = '' }) => {
    const [ref, visible] = useReveal();
    return (
        <div ref={ref} className={className} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(32px)',
            transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`
        }}>
            {children}
        </div>
    );
};

const SlideIn = ({ children, from = 'left', delay = 0, className = '' }) => {
    const [ref, visible] = useReveal();
    const tx = from === 'left' ? '-40px' : '40px';
    return (
        <div ref={ref} className={className} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : `translateX(${tx})`,
            transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`
        }}>
            {children}
        </div>
    );
};

const ScaleIn = ({ children, delay = 0, className = '' }) => {
    const [ref, visible] = useReveal();
    return (
        <div ref={ref} className={className} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1)' : 'scale(0.88)',
            transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`
        }}>
            {children}
        </div>
    );
};

export default function Welcome({ branches, rooms, auth }) {
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [rentalType, setRentalType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        name: '', email: '', phone: '', start_date: '', end_date: '', rental_type: 'monthly'
    });
    const [bookingStep, setBookingStep] = useState('browse');
    const [bookingResponse, setBookingResponse] = useState(null);
    const [otpCodeInput, setOtpCodeInput] = useState('');
    const [otpError, setOtpError] = useState('');
    const [paidAmountInput, setPaidAmountInput] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showRoomDetail, setShowRoomDetail] = useState(null);
    const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

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

    const filteredRooms = rooms.filter(room => {
        const matchesBranch = selectedBranch === 'all' || room.branch_id === parseInt(selectedBranch);
        const matchesType = rentalType === 'all' ||
            (rentalType === 'daily' && parseFloat(room.price_daily) > 0) ||
            (rentalType === 'monthly' && parseFloat(room.price_monthly) > 0);
        const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesBranch && matchesType && matchesSearch;
    });

    const handleOpenBooking = (room) => {
        setSelectedRoom(room);
        setBookingForm({
            ...bookingForm,
            room_id: room.id,
            rental_type: room.price_daily > 0 && room.price_monthly > 0 ? 'monthly' : (room.price_monthly > 0 ? 'monthly' : 'daily'),
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
                    room_id: selectedRoom.id, rental_type: bookingForm.rental_type,
                    start_date: bookingForm.start_date, end_date: bookingForm.end_date,
                    name: bookingForm.name, email: bookingForm.email, phone: bookingForm.phone,
                })
            });
            const data = await res.json();
            if (res.ok) { setBookingResponse(data); setBookingStep('otp'); }
            else { alert(data.message || 'Terjadi kesalahan'); }
        } catch (err) { console.error(err); alert('Gagal mengajukan pemesanan.'); }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault(); setOtpError('');
        try {
            const res = await fetch('/api/guest/bookings/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ booking_id: bookingResponse.booking_id, otp_code: otpCodeInput })
            });
            const data = await res.json();
            if (res.ok) { setPaidAmountInput(selectedRoom.price_monthly); setBookingStep('payment_proof'); }
            else { setOtpError(data.message || 'OTP salah'); }
        } catch (err) { console.error(err); setOtpError('Gagal memverifikasi OTP.'); }
    };

    const handleUploadPayment = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/guest/bookings/${bookingResponse.booking_id}/payment-proof`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ payment_proof: 'proof_uploaded_simulation.png', paid_amount: paidAmountInput })
            });
            const data = await res.json();
            if (res.ok) { setSuccessMessage(data.message); setBookingStep('success'); }
            else { alert(data.message || 'Gagal mengunggah bukti'); }
        } catch (err) { console.error(err); alert('Gagal mengunggah pembayaran.'); }
    };

    const resetBookingModal = () => {
        setSelectedRoom(null); setBookingStep('browse');
        setBookingForm({ name: '', email: '', phone: '', start_date: '', end_date: '', rental_type: 'monthly' });
        setOtpCodeInput(''); setOtpError(''); setBookingResponse(null);
    };

    const features = [
        { icon: '❄️', title: 'AC & TV Android', desc: 'Kamar privat dengan pendingin ruangan dan hiburan TV streaming' },
        { icon: '🚿', title: 'Kamar Mandi Dalam', desc: 'Water heater & WC duduk di setiap kamar, nyaman seperti hotel' },
        { icon: '🛋️', title: 'Lounge & Kursi Pijat', desc: 'Area bersantai luas & kursi pijat premium hanya Rp30.000/sesi' },
        { icon: '🍽️', title: 'Resto Rumahan', desc: 'Hidangan lezat & higienis tersedia setiap hari di dalam kos' },
        { icon: '📶', title: 'Wi-Fi Super Cepat', desc: 'Koneksi internet serat optik kecepatan tinggi tanpa gangguan' },
        { icon: '👔', title: 'Laundry Praktis', desc: 'Layanan cuci & setrika pakaian langsung di dalam kompleks' },
    ];

    const stats = [
        { value: '2+', label: 'Lokasi Cabang', color: '#059669' },
        { value: 'Rp30K', label: 'Kursi Pijat / Sesi', color: '#d97706' },
        { value: '24/7', label: 'Keamanan CCTV', color: '#3b82f6' },
        { value: '100%', label: 'Kepuasan Penghuni', color: '#059669' },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
            <Head title="Beranda – Kospart PH 18 | Hunian Eksklusif Lampung" />

            {/* ─── HEADER ─── */}
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
                        <Link href="/" className="text-emerald-600 font-semibold">Beranda</Link>
                        <Link href="/kamar" className="hover:text-emerald-600 transition-colors">Cari Kamar</Link>
                        <Link href="/cabang" className="hover:text-emerald-600 transition-colors">Cabang Kos</Link>
                        <a href="#contact" className="hover:text-emerald-600 transition-colors">Kontak</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        {auth.user ? (
                            <Link href="/dashboard" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md">
                                Masuk Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">Login Admin</Link>
                                <Link href="/register" className="hidden sm:inline-block px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-all border border-slate-200 shadow-sm">
                                    Daftar Akun
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ─── HERO ─── */}
            <section className="relative overflow-hidden py-24 bg-premium-dark border-b border-emerald-50">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid md:grid-cols-12 gap-12 items-center">
                    {/* Left copy — hero always visible, no reveal needed */}
                    <div className="md:col-span-7 space-y-6 text-left">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 tracking-wide uppercase">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            Kost Eksklusif Terbaik di Lampung
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
                            Hunian Nyaman,<br />Strategis, &{' '}
                            <span className="text-emerald-600 text-glow-emerald">Premium</span>
                        </h1>
                        <p className="text-slate-600 text-base sm:text-lg max-w-xl leading-relaxed font-medium">
                            Nikmati fasilitas lengkap sekelas hotel di Kospart PH 18 — AC, TV Android, kamar mandi dalam, lounge, resto, laundry, dan kursi pijat premium dalam satu tempat.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <Link href="/kamar" className="px-7 py-4 bg-emerald-gradient hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5">
                                Pesan Kamar Sekarang
                            </Link>
                            <a href="#contact" className="px-7 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl shadow-sm transition-all">
                                Tanya Admin (WA)
                            </a>
                        </div>
                    </div>

                    <div className="md:col-span-5 relative animate-float">
                        <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-xl">
                            <img src="/images/tampak depan.jpeg" alt="Kospart PH 18 Tampak Depan" className="w-full h-80 object-cover object-center" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                            <div className="absolute bottom-5 left-5">
                                <span className="text-white font-extrabold text-xl block drop-shadow">Kospart PH 18</span>
                                <span className="text-emerald-300 text-xs font-semibold">Bandar Lampung</span>
                            </div>
                        </div>
                        {/* Floating badge */}
                        <div className="absolute -top-4 -right-4 bg-white border border-emerald-100 rounded-2xl px-4 py-2 shadow-lg text-center">
                            <div className="text-2xl font-extrabold text-emerald-600">{rooms.filter(r => r.status === 'available').length}</div>
                            <div className="text-xs text-slate-500 font-semibold">Kamar Tersedia</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── TENTANG / PROFIL ─── */}
            <section id="tentang" className="py-20 border-t border-slate-100" style={{ background: 'linear-gradient(160deg,#f0fdf4 0%,#ffffff 60%,#f8fafc 100%)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Heading */}
                    <FadeUp className="text-center max-w-3xl mx-auto mb-14 space-y-3">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 tracking-widest uppercase">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                            Tentang Kospart PH 18
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                            Selamat Datang di <span className="text-emerald-600">Kospart PH 18</span>
                        </h2>
                        <p className="text-slate-500 font-medium text-base">Hunian Modern dengan Fasilitas Kelas Atas</p>
                    </FadeUp>

                    {/* 2-col: teks kiri, kartu kanan */}
                    <div className="grid md:grid-cols-2 gap-14 items-center mb-16">
                        <SlideIn from="left" className="space-y-5">
                            <p className="text-slate-700 text-base leading-relaxed">
                                Kospart PH 18 hadir sebagai solusi hunian eksklusif yang memadukan <strong className="text-emerald-700">kenyamanan maksimal</strong> dan kemudahan hidup modern. Setiap kamar dirancang secara privat lengkap dengan AC, TV Android, kamar mandi dalam dengan water heater serta WC duduk, lemari pakaian, dan meja rias yang elegan.
                            </p>
                            <p className="text-slate-700 text-base leading-relaxed">
                                Tak hanya kenyamanan di dalam kamar, kami memanjakan Anda dengan fasilitas bersama yang mewah — laundry praktis, Wi-Fi super cepat, serta area Lounge yang luas untuk bersantai atau bekerja.
                            </p>
                            <p className="text-slate-700 text-base leading-relaxed">
                                Butuh relaksasi? Manfaatkan <strong className="text-emerald-700">kursi pijat premium</strong> hanya Rp30.000/sesi. Resto makanan rumahan siap menyajikan hidangan lezat setiap hari. Rasakan pengalaman <strong className="text-emerald-700">nge-kos rasa apartemen</strong> hanya di Kospart PH 18!
                            </p>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <a href="#rooms" className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-md">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    Lihat Kamar Tersedia
                                </a>
                                <a href="https://wa.me/628980598327" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 transition-all shadow-sm">
                                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    Hubungi Admin WA
                                </a>
                            </div>
                        </SlideIn>

                        {/* Feature cards kanan */}
                        <SlideIn from="right">
                            <div className="grid grid-cols-2 gap-4">
                                {features.map((item, idx) => (
                                    <ScaleIn key={idx} delay={idx * 0.07}>
                                        <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2 hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-default h-full">
                                            <span className="text-2xl">{item.icon}</span>
                                            <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{item.title}</h4>
                                            <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                                        </div>
                                    </ScaleIn>
                                ))}
                            </div>
                        </SlideIn>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {stats.map((s, idx) => (
                            <FadeUp key={idx} delay={idx * 0.1}>
                                <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                    <div className="text-3xl font-extrabold mb-1" style={{ color: s.color }}>{s.value}</div>
                                    <div className="text-slate-600 text-xs font-semibold">{s.label}</div>
                                </div>
                            </FadeUp>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── KAMAR / ROOM LISTING ─── */}
            <main id="rooms" className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
                <FadeUp className="space-y-3 text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 tracking-widest uppercase">Unit Kamar Pilihan</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Kamar Tersedia Untuk Anda</h2>
                    <p className="text-slate-600 font-medium">Pilih cabang terdekat dan tipe sewa (Harian/Bulanan) sesuai kebutuhan Anda.</p>
                </FadeUp>

                {/* Filters */}
                <FadeUp delay={0.1}>
                    <div className="glass-panel rounded-2xl p-6 mb-12 flex flex-wrap gap-4 items-center justify-between border-glow-emerald">
                        <div className="flex flex-wrap gap-4 flex-grow md:flex-none">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Cabang</label>
                                <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="glass-input rounded-xl px-4 py-2.5 text-sm font-medium w-48">
                                    <option value="all">Semua Cabang</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Tipe Sewa</label>
                                <select value={rentalType} onChange={(e) => setRentalType(e.target.value)} className="glass-input rounded-xl px-4 py-2.5 text-sm font-medium w-40">
                                    <option value="all">Semua Tipe</option>
                                    <option value="monthly">Bulanan saja</option>
                                    <option value="daily">Harian saja</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 w-full md:w-80">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Pencarian</label>
                            <div className="relative">
                                <input type="text" placeholder="Cari nomor kamar/fasilitas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm w-full" />
                                <svg className="w-5 h-5 text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                        </div>
                    </div>
                </FadeUp>

                {/* Rooms Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredRooms.slice(0, 3).map((room, idx) => (
                        <FadeUp key={room.id} delay={idx * 0.06}>
                            <div
                                onClick={() => { setShowRoomDetail(room); setActiveGalleryIndex(0); }}
                                className="glass-card rounded-2xl overflow-hidden flex flex-col relative group cursor-pointer h-full"
                            >
                                <div className="absolute top-4 left-4 z-10">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        room.status === 'available' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                        room.status === 'occupied' ? 'bg-red-100 text-red-800 border border-red-200' :
                                        room.status === 'booked' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                        'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                        {room.status === 'available' ? 'Tersedia' : room.status === 'occupied' ? 'Penuh' : room.status === 'booked' ? 'Dibooking' : 'Maintenance'}
                                    </span>
                                </div>

                                <div className="relative h-56 overflow-hidden">
                                    <img src={room.image || '/images/foto kamar 1.jpeg'} alt={`Kamar ${room.room_number}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                                        <h3 className="text-white font-extrabold text-2xl font-mono">No. {room.room_number}</h3>
                                        <span className="text-slate-700 text-xs font-semibold bg-white/80 px-2.5 py-1 rounded-md backdrop-blur-sm border border-slate-200">
                                            {room.branch.name.replace('Kospart PH 18 - ', '')}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 flex-grow flex flex-col justify-between space-y-5">
                                    <div className="space-y-3">
                                        <p className="text-slate-600 text-sm leading-relaxed font-medium line-clamp-2">{room.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {room.facilities && JSON.parse(JSON.stringify(room.facilities)).slice(0, 4).map((fac, i) => (
                                                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 text-xs border border-slate-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{fac}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            {room.price_monthly > 0 && (
                                                <div>
                                                    <span className="text-slate-500 text-xs font-medium block">Sewa Bulanan</span>
                                                    <span className="text-slate-900 font-extrabold text-lg">Rp {parseFloat(room.price_monthly).toLocaleString('id-ID')}</span>
                                                </div>
                                            )}
                                            {room.price_daily > 0 && (
                                                <div className="text-right">
                                                    <span className="text-slate-500 text-xs font-medium block">Sewa Harian</span>
                                                    <span className="text-emerald-600 font-extrabold text-lg">Rp {parseFloat(room.price_daily).toLocaleString('id-ID')} <span className="text-xs text-slate-500 font-normal">/hari</span></span>
                                                </div>
                                            )}
                                        </div>
                                        {room.status === 'available' ? (
                                            <button onClick={(e) => { e.stopPropagation(); handleOpenBooking(room); }} className="w-full py-3 bg-emerald-gradient hover:opacity-90 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                Booking Online
                                            </button>
                                        ) : (
                                            <button disabled className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-400 text-sm font-bold rounded-xl cursor-not-allowed">
                                                Kamar Tidak Tersedia
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </FadeUp>
                    ))}
                </div>

                {filteredRooms.length === 0 && (
                    <FadeUp className="py-16 text-center">
                        <div className="text-4xl mb-3">🔍</div>
                        <h3 className="text-xl font-extrabold text-slate-800 mb-1">Kamar tidak ditemukan</h3>
                        <p className="text-slate-500 text-sm">Coba ubah filter pencarian Anda.</p>
                    </FadeUp>
                )}

                {/* CTA ke halaman kamar lengkap */}
                <FadeUp delay={0.2} className="text-center mt-14">
                    <Link href="/kamar" className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-gradient hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 text-sm">
                        Lihat Semua Kamar & Filter Lengkap
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </Link>
                </FadeUp>
            </main>

            {/* ─── VIDEO TOUR ─── */}
            <section id="video-tour" className="py-20 bg-premium-dark border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <FadeUp className="space-y-3 text-center max-w-2xl mx-auto">
                        <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 tracking-wide uppercase">Video Virtual Tour</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Virtual Tour Kos & Fasilitas</h2>
                        <p className="text-slate-600 font-medium">Saksikan suasana ruang tunggu, kursi pijat, dan kamar eksklusif secara langsung.</p>
                    </FadeUp>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <SlideIn from="left">
                            <div className="space-y-3">
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">Tur Resepsionis & Ruang Tunggu</span>
                                <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-2xl aspect-video">
                                    <video src="/images/ruang tunggu, kursi pijat, resepsionis.mp4" controls className="w-full h-full object-cover"></video>
                                </div>
                            </div>
                        </SlideIn>
                        <SlideIn from="right" delay={0.1}>
                            <div className="space-y-3">
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">Tur Suasana Kamar Eksklusif</span>
                                <div className="rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-2xl aspect-video">
                                    <video src="/images/suasana kamar 2.500.000.mp4" controls className="w-full h-full object-cover"></video>
                                </div>
                            </div>
                        </SlideIn>
                    </div>
                </div>
            </section>

            {/* ─── TESTIMONI ─── */}
            <section id="testimoni" className="py-20 border-t border-slate-100 overflow-hidden" style={{ background: 'linear-gradient(160deg,#f0fdf4 0%,#ffffff 50%,#f8fafc 100%)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Heading */}
                    <FadeUp className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 tracking-widest uppercase">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Testimoni Penghuni
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                            Apa Kata Mereka tentang <span className="text-emerald-600">Kospart PH 18?</span>
                        </h2>
                        <p className="text-slate-500 font-medium">Ribuan penghuni telah merasakan kenyamanan hunian kami. Ini adalah cerita mereka.</p>
                    </FadeUp>

                    {/* Rating summary bar */}
                    <FadeUp delay={0.1} className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-14">
                        <div className="text-center">
                            <div className="text-6xl font-extrabold text-slate-900 leading-none">4.9</div>
                            <div className="flex gap-1 justify-center mt-2 mb-1">
                                {[1,2,3,4,5].map(s => (
                                    <svg key={s} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                ))}
                            </div>
                            <div className="text-slate-500 text-xs font-semibold">dari 200+ ulasan</div>
                        </div>
                        <div className="w-px h-16 bg-slate-200 hidden sm:block"></div>
                        <div className="flex flex-col gap-2 w-48">
                            {[['5 bintang', 92], ['4 bintang', 6], ['3 bintang', 2]].map(([label, pct]) => (
                                <div key={label} className="flex items-center gap-2 text-xs">
                                    <span className="text-slate-500 w-16 shrink-0">{label}</span>
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%`, transition: 'width 1s ease' }}></div>
                                    </div>
                                    <span className="text-slate-600 font-bold w-8 text-right">{pct}%</span>
                                </div>
                            ))}
                        </div>
                    </FadeUp>

                    {/* Cards grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {[
                            {
                                name: 'Andi Pratama',
                                role: 'Mahasiswa Unila',
                                avatar: '🧑‍🎓',
                                rating: 5,
                                date: 'Januari 2026',
                                text: 'Kosnya bersih banget, fasilitas lengkap dari AC, TV Android, sampai kamar mandi dalam. Yang bikin betah ada kursi pijatnya di lounge — cocok banget abis kuliah seharian!',
                                badge: 'Penghuni Aktif'
                            },
                            {
                                name: 'Siti Rahayu',
                                role: 'Karyawan Swasta',
                                avatar: '👩‍💼',
                                rating: 5,
                                date: 'Maret 2026',
                                text: 'Sudah 6 bulan tinggal di sini, dan saya sangat puas. Wi-Fi-nya cepat banget untuk kerja remote. Resto rumahannya enak dan harganya ramah di kantong. Recommended banget!',
                                badge: 'Verified'
                            },
                            {
                                name: 'Rizky Firmansyah',
                                role: 'Wirausahawan Muda',
                                avatar: '👨‍💻',
                                rating: 5,
                                date: 'April 2026',
                                text: 'Pas pertama lihat langsung jatuh cinta sama suasananya. Rasanya kayak tinggal di apartemen, bukan kos biasa. Proses booking online-nya juga mudah dan cepat!',
                                badge: 'Penghuni Lama'
                            },
                            {
                                name: 'Dewi Anggraeni',
                                role: 'Guru Sekolah',
                                avatar: '👩‍🏫',
                                rating: 5,
                                date: 'Februari 2026',
                                text: 'Lokasinya strategis banget, dekat Mall Kartini dan akses transportasi mudah. Keamanan 24 jam dengan CCTV bikin saya dan keluarga tenang. Pokoknya juara!',
                                badge: 'Verified'
                            },
                            {
                                name: 'Bagas Nugroho',
                                role: 'Mahasiswa Pascasarjana',
                                avatar: '🧑‍💻',
                                rating: 5,
                                date: 'Mei 2026',
                                text: 'Laundry dalam kos, resto enak, lounge buat kerja — semua ada di satu tempat. Saya bisa fokus belajar tanpa pusing mikirin urusan sehari-hari. Nilainya sempurna!',
                                badge: 'Penghuni Aktif'
                            },
                            {
                                name: 'Nabila Putri',
                                role: 'Fresh Graduate',
                                avatar: '👩‍🎓',
                                rating: 5,
                                date: 'Juni 2026',
                                text: 'Staf adminnya ramah dan responsif di WhatsApp. Kamar selalu terjaga kebersihannya. Water heater di kamar mandi jadi nilai plus buat saya. Sangat worth it!',
                                badge: 'Baru Pindah'
                            },
                        ].map((t, idx) => (
                            <ScaleIn key={idx} delay={idx * 0.07}>
                                <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-100 transition-all duration-300 h-full flex flex-col">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl shrink-0">
                                                {t.avatar}
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-slate-900 text-sm">{t.name}</div>
                                                <div className="text-slate-500 text-xs">{t.role}</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">{t.badge}</span>
                                    </div>

                                    {/* Stars */}
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: t.rating }).map((_, i) => (
                                            <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        ))}
                                    </div>

                                    {/* Quote */}
                                    <p className="text-slate-600 text-sm leading-relaxed flex-grow">
                                        <span className="text-emerald-400 text-2xl leading-none font-serif mr-1">"</span>
                                        {t.text}
                                        <span className="text-emerald-400 text-2xl leading-none font-serif ml-1">"</span>
                                    </p>

                                    {/* Date */}
                                    <div className="text-slate-400 text-xs font-medium pt-1 border-t border-slate-50">{t.date}</div>
                                </div>
                            </ScaleIn>
                        ))}
                    </div>

                    {/* CTA */}
                    <FadeUp delay={0.15} className="text-center">
                        <a href="https://wa.me/628980598327" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 shadow-sm transition-all hover:-translate-y-0.5">
                            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            Bagikan Pengalaman Anda via WhatsApp
                        </a>
                    </FadeUp>
                </div>
            </section>

            {/* ─── KONTAK / LOKASI ─── */}
            <section id="contact" className="py-20 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-12">
                    <SlideIn from="left" className="md:col-span-5 space-y-6">
                        <FadeUp>
                            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 tracking-widest uppercase mb-2">Lokasi & Kontak</span>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kunjungi Lokasi Kami</h2>
                            <p className="text-slate-600 text-sm leading-relaxed font-medium mt-3">
                                Kami terbuka untuk melayani survei kamar secara langsung. Silakan atur jadwal kunjungan dengan menghubungi admin WhatsApp kami.
                            </p>
                        </FadeUp>

                        <div className="space-y-4 text-sm">
                            <div className="flex gap-3 items-start p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <svg className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <div>
                                    <strong className="text-slate-900 block mb-1">Alamat Kospart PH 18:</strong>
                                    <span className="text-slate-600 text-xs leading-relaxed block">Samping BNI Kartini, di komplek perukoan belakang Mall Kartini (masuk dari samping Halte Kartini), Palapa, Kec. Tj. Karang Pusat, Kota Bandar Lampung, Lampung 35118</span>
                                </div>
                            </div>
                            <div className="flex gap-3 items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                <div>
                                    <strong className="text-slate-900 block">WhatsApp Admin:</strong>
                                    <a href="https://wa.me/628980598327" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 font-bold">+62 898-0598-327</a>
                                </div>
                            </div>
                        </div>

                        <a
                            href="https://www.google.com/maps/place/kospart+PH+18/@-5.4164332,105.2538444,19.18z/data=!4m9!3m8!1s0x2e40dbb43262d9df:0xa1cf05d7be03bb72!5m2!4m1!1i2!8m2!3d-5.416147!4d105.2535747!16s%2Fg%2F11yspfw7t2?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D"
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald-gradient hover:opacity-90 text-white font-bold text-sm rounded-xl transition-all shadow-md"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            Buka Petunjuk Arah
                        </a>
                    </SlideIn>

                    <SlideIn from="right" className="md:col-span-7">
                        <div className="h-96 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl">
                            <iframe
                                src="https://maps.google.com/maps?q=-5.416147,105.2535747&z=17&output=embed"
                                className="w-full h-full border-0"
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                    </SlideIn>
                </div>
            </section>

            {/* ─── ROOM DETAIL MODAL ─── */}
            {showRoomDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl relative my-6" style={{ animation: 'modalIn 0.3s ease' }}>
                        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.94) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-xl text-slate-900">Detail Kamar {showRoomDetail.room_number}</h3>
                                <p className="text-xs text-emerald-600 font-semibold">{showRoomDetail.branch.name}</p>
                            </div>
                            <button onClick={() => setShowRoomDetail(null)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
                            <div className="space-y-3">
                                <div className="relative h-60 rounded-xl overflow-hidden border border-slate-200 bg-black group">
                                    {getRoomMedia(showRoomDetail)[activeGalleryIndex]?.type === 'image' ? (
                                        <img src={getRoomMedia(showRoomDetail)[activeGalleryIndex]?.src} alt={`Kamar ${showRoomDetail.room_number}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <video src={getRoomMedia(showRoomDetail)[activeGalleryIndex]?.src} controls className="w-full h-full object-contain"></video>
                                    )}
                                    <div className="absolute bottom-3 right-3 bg-white/95 px-2.5 py-1 rounded-md text-xs font-bold text-slate-800 uppercase pointer-events-none">
                                        {getRoomMedia(showRoomDetail)[activeGalleryIndex]?.type === 'video' ? 'Video Tour' : 'Foto'}
                                    </div>
                                </div>
                                <div className="flex gap-2 overflow-x-auto py-1">
                                    {getRoomMedia(showRoomDetail).map((media, idx) => (
                                        <button key={idx} onClick={() => setActiveGalleryIndex(idx)} className={`w-16 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition-all relative ${activeGalleryIndex === idx ? 'border-emerald-500 scale-105' : 'border-slate-200 opacity-60 hover:opacity-100'}`}>
                                            {media.type === 'image' ? (
                                                <img src={media.src} alt="thumb" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.324-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                                                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[6px] text-white text-center font-bold">VIDEO</span>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi</h4>
                                <p className="text-slate-700 text-sm leading-relaxed">{showRoomDetail.description}</p>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fasilitas Kamar</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {showRoomDetail.facilities && JSON.parse(JSON.stringify(showRoomDetail.facilities)).map((fac, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                            <span className="font-semibold text-slate-700">{fac}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
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

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                            <button onClick={() => setShowRoomDetail(null)} className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all border border-slate-200">Kembali</button>
                            {showRoomDetail.status === 'available' ? (
                                <button onClick={() => { setShowRoomDetail(null); handleOpenBooking(showRoomDetail); }} className="flex-1 py-3 bg-emerald-gradient hover:opacity-95 text-white text-sm font-bold rounded-xl transition-all shadow-md">Sewa Kamar Ini</button>
                            ) : (
                                <button disabled className="flex-1 py-3 bg-slate-100 border border-slate-200 text-slate-400 text-sm font-bold rounded-xl cursor-not-allowed">Tidak Tersedia</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── BOOKING MODAL ─── */}
            {selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl relative my-6" style={{ animation: 'modalIn 0.3s ease' }}>
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-xl text-slate-900">Booking Kamar {selectedRoom.room_number}</h3>
                                <p className="text-xs text-emerald-600 font-semibold">{selectedRoom.branch.name}</p>
                            </div>
                            <button onClick={resetBookingModal} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {bookingStep === 'booking' && (
                            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                                {[
                                    { label: 'Nama Lengkap', key: 'name', type: 'text', placeholder: 'Dani Trisna' },
                                    { label: 'Email', key: 'email', type: 'email', placeholder: 'dani@gmail.com' },
                                    { label: 'No. WhatsApp', key: 'phone', type: 'text', placeholder: '085712345678' },
                                ].map(f => (
                                    <div key={f.key} className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">{f.label}</label>
                                        <input type={f.type} required value={bookingForm[f.key]} onChange={(e) => setBookingForm({ ...bookingForm, [f.key]: e.target.value })} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder={f.placeholder} />
                                    </div>
                                ))}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Tipe Sewa</label>
                                        <select value={bookingForm.rental_type} onChange={(e) => setBookingForm({ ...bookingForm, rental_type: e.target.value })} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full">
                                            {selectedRoom.price_monthly > 0 && <option value="monthly">Bulanan</option>}
                                            {selectedRoom.price_daily > 0 && <option value="daily">Harian</option>}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Mulai Sewa</label>
                                        <input type="date" required value={bookingForm.start_date} onChange={(e) => setBookingForm({ ...bookingForm, start_date: e.target.value })} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Selesai Sewa</label>
                                    <input type="date" required value={bookingForm.end_date} onChange={(e) => setBookingForm({ ...bookingForm, end_date: e.target.value })} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" />
                                </div>
                                <button type="submit" className="w-full mt-2 py-3 bg-emerald-gradient hover:opacity-90 text-white font-bold rounded-xl text-sm transition-all">
                                    Kirim & Minta OTP WhatsApp
                                </button>
                            </form>
                        )}

                        {bookingStep === 'otp' && (
                            <div className="p-6 space-y-6">
                                <div className="bg-slate-50 p-4 rounded-xl border border-emerald-100">
                                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-2">WhatsApp OTP Simulator</span>
                                    <div className="bg-[#efeae2] p-3 rounded-lg border border-[#e9edef] max-w-sm mx-auto text-xs">
                                        <div className="flex items-center gap-2 border-b border-white pb-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-[10px] text-white">KP</div>
                                            <div><span className="font-bold text-[#111b21] block text-[11px]">ADMIN KOSPART PH 18</span><span className="text-[#667781] text-[9px]">Online</span></div>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-lg rounded-tl-none inline-block max-w-[85%] border border-slate-100 shadow-sm">
                                            <p className="font-semibold text-emerald-700 text-[11px] mb-1">Halo {bookingForm.name},</p>
                                            <p className="mb-2">Masukkan kode OTP berikut untuk memverifikasi pemesanan Anda:</p>
                                            <p className="text-base font-bold text-center bg-[#f0fdf4] py-2 border border-emerald-200 rounded tracking-widest font-mono text-emerald-700">{bookingResponse?.otp_code_simulated}</p>
                                        </div>
                                    </div>
                                </div>
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div className="space-y-1.5 text-center">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Masukkan 6 Digit Kode OTP</label>
                                        <input type="text" maxLength="6" required value={otpCodeInput} onChange={(e) => setOtpCodeInput(e.target.value)} className="glass-input rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest w-48 mx-auto block font-mono" placeholder="------" />
                                        {otpError && <p className="text-red-600 text-xs mt-1">{otpError}</p>}
                                    </div>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setBookingStep('booking')} className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200">Kembali</button>
                                        <button type="submit" className="flex-1 py-3 bg-emerald-gradient hover:opacity-90 text-white text-xs font-bold rounded-xl">Verifikasi OTP</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {bookingStep === 'payment_proof' && (
                            <form onSubmit={handleUploadPayment} className="p-6 space-y-4">
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-800 leading-relaxed">
                                    <h4 className="font-bold mb-1">Batas Waktu Pembayaran: 6 Jam</h4>
                                    Selesaikan pembayaran ke rekening <strong>BCA 1234-5678-90 a.n KOSPART PH 18</strong> dan unggah bukti transfer di bawah ini.
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Jumlah yang Ditransfer (Rp)</label>
                                    <input type="number" required value={paidAmountInput} onChange={(e) => setPaidAmountInput(e.target.value)} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" />
                                </div>
                                <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                    <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    <span className="text-xs text-slate-600 font-medium block">Klik untuk simulasi unggah file</span>
                                    <span className="text-[10px] text-slate-400">PNG, JPG, PDF (Maks. 2MB)</span>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setBookingStep('otp')} className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200">Kembali</button>
                                    <button type="submit" className="flex-1 py-3 bg-emerald-gradient hover:opacity-90 text-white text-xs font-bold rounded-xl">Kirim Pembayaran</button>
                                </div>
                            </form>
                        )}

                        {bookingStep === 'success' && (
                            <div className="p-6 text-center space-y-5">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto" style={{ animation: 'scaleIn 0.4s ease' }}>
                                    <style>{`@keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }`}</style>
                                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-2xl text-slate-900">Pembayaran Diterima!</h3>
                                    <p className="text-slate-600 text-sm mt-1">{successMessage || 'Penyewaan kamar Anda telah aktif. Selamat datang di Kospart PH 18!'}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-200 space-y-1.5 font-mono text-xs text-slate-700">
                                    <div><span className="text-slate-400">KODE:</span> {bookingResponse?.booking_code}</div>
                                    <div><span className="text-slate-400">KAMAR:</span> {selectedRoom.room_number}</div>
                                    <div><span className="text-slate-400">CABANG:</span> {selectedRoom.branch.name}</div>
                                    <div><span className="text-slate-400">MASA:</span> {bookingForm.start_date} s.d {bookingForm.end_date}</div>
                                </div>
                                <button onClick={resetBookingModal} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all">Selesai</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── FOOTER ─── */}
            <footer className="mt-auto bg-white border-t border-slate-200 py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100">
                            <img src="/images/logo 2.jpeg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-extrabold text-slate-900">KOSPART PH 18</span>
                    </div>
                    <p className="text-xs text-center">© {new Date().getFullYear()} Kospart PH 18. All rights reserved. <span className="text-emerald-600 font-semibold">Powered by Rifqi Bili.</span></p>
                    <div className="flex gap-4 text-xs">
                        <a href="#tentang" className="hover:text-emerald-600 transition-colors">Tentang Kami</a>
                        <Link href="/kamar" className="hover:text-emerald-600 transition-colors">Cari Kamar</Link>
                        <a href="#contact" className="hover:text-emerald-600 transition-colors">Kontak</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
