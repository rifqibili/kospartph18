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

export default function Welcome({ branches, rooms, faqs, virtualTours = [], testimonials = [], auth }) {
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [rentalType, setRentalType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        name: '', email: '', phone: '', start_date: '', end_date: '', rental_type: 'monthly', nik: '', ktp_photo: null, agree_tnc: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingStep, setBookingStep] = useState('browse');
    const [bookingResponse, setBookingResponse] = useState(null);
    const [otpCodeInput, setOtpCodeInput] = useState('');
    const [otpError, setOtpError] = useState('');
    const [paidAmountInput, setPaidAmountInput] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showRoomDetail, setShowRoomDetail] = useState(null);
    const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
    const [activeTourIndex, setActiveTourIndex] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


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
            media.push({ type: 'image', src: (room.photos && room.photos.length > 0) ? room.photos[0] : '/images/foto kamar 1.jpeg' });
        }
        
        return media;
    };

    const filteredRooms = rooms.filter(room => {
        const matchesBranch = selectedBranch === 'all' || room.branch_id === parseInt(selectedBranch);
        const matchesType = rentalType === 'all' ||
            (rentalType === 'daily' && parseFloat(room.price_daily) > 0) ||
            (rentalType === 'weekly' && parseFloat(room.price_weekly) > 0) ||
            (rentalType === 'monthly' && parseFloat(room.price_monthly) > 0) ||
            (rentalType === 'yearly' && parseFloat(room.price_yearly) > 0);
        const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesBranch && matchesType && matchesSearch;
    });

    const handleOpenBooking = (room) => {
        if (!auth?.user) {
            alert('Anda harus memiliki akun atau login terlebih dahulu untuk melakukan booking.');
            window.location.href = '/login';
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

            const res = await fetch('/api/bookings/store', {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData
            });
            const data = await res.json();
            if (res.ok) { setBookingResponse(data); setBookingStep('otp'); }
            else { alert(data.message || 'Terjadi kesalahan'); }
        } catch (err) { console.error(err); alert('Gagal mengajukan pemesanan.'); }
        finally { setIsSubmitting(false); }
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
            if (res.ok) { 
                setBookingResponse(prev => ({...prev, booking: data.booking}));
                setPaidAmountInput(data.booking.total_amount); 
                setBookingStep('payment_proof'); 
            }
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
        setBookingForm({ name: '', email: '', phone: '', start_date: '', end_date: '', rental_type: 'monthly', nik: '', ktp_photo: null, agree_tnc: false });
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
        <div className="min-h-screen bg-mesh-dark text-slate-300 flex flex-col font-sans selection:bg-emerald-600 selection:text-white relative overflow-hidden">
            {/* ─── Glowing Orbs (21st Glass Background) ─── */}
            <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none animate-blob"></div>
            <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-2000"></div>
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-700/10 rounded-full blur-[150px] pointer-events-none animate-blob animation-delay-4000"></div>

            <Head title="Beranda – Kospart PH 18 | Hunian Eksklusif Lampung" />

            {/* ─── HEADER ─── */}
            <header className="sticky top-0 z-40 glass-3d border-b-0 shadow-lg">
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
                        <Link href="/" className="text-emerald-400 font-semibold text-glow">Beranda</Link>
                        <Link href="/kamar" className="hover:text-emerald-400 transition-colors">Cari Kamar</Link>
                        <Link href="/cabang" className="hover:text-emerald-400 transition-colors">Cabang Kos</Link>
                        <a href="#contact" className="hover:text-emerald-400 transition-colors">Kontak</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        {auth.user ? (
                            <Link href="/dashboard" className="hidden sm:inline-flex px-5 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-400/30">
                                Masuk Dashboard
                            </Link>
                        ) : (
                            <div className="hidden md:flex items-center gap-4">
                                <Link href="/login" className="text-slate-300 hover:text-white text-sm font-semibold transition-colors">Login</Link>
                                <Link href="/register" className="px-5 py-2.5 glass-3d hover:bg-slate-800/60 text-white font-semibold rounded-xl text-sm transition-all">
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
                        <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="block text-slate-300 hover:text-emerald-400 font-semibold py-2">Kontak</a>
                        
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

            {/* ─── HERO ─── */}
            <section className="relative overflow-hidden py-24 bg-transparent border-b border-slate-800/50 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid md:grid-cols-12 gap-12 items-center">
                    {/* Left copy — hero always visible, no reveal needed */}
                    <div className="md:col-span-7 space-y-6 text-left">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-3d text-emerald-400 text-xs font-semibold border border-emerald-500/30 tracking-wide uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            Kost Eksklusif Terbaik di Lampung
                        </span>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                            Hunian Nyaman,<br />Strategis, &{' '}
                            <span className="text-emerald-400 text-glow">Premium</span>
                        </h1>
                        <p className="text-slate-600 text-base sm:text-lg max-w-xl leading-relaxed font-medium">
                            Nikmati fasilitas lengkap sekelas hotel di Kospart PH 18 — AC, TV Android, kamar mandi dalam, lounge, resto, laundry, dan kursi pijat premium dalam satu tempat.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <Link href="/kamar" className="px-7 py-4 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/50 transition-all transform hover:-translate-y-0.5">
                                Pesan Kamar Sekarang
                            </Link>
                            <a href="#contact" className="px-7 py-4 glass-3d hover:bg-slate-800/60 text-white font-bold rounded-xl transition-all">
                                Tanya Admin (WA)
                            </a>
                        </div>
                    </div>

                    <div className="md:col-span-5 relative animate-float">
                        <div className="relative rounded-2xl overflow-hidden glass-3d shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <img src="/images/ruang tamu.jpeg" alt="Kospart PH 18 Ruang Tamu" className="w-full h-80 object-cover object-center mix-blend-overlay opacity-90" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-5 left-5">
                                <span className="text-white font-extrabold text-xl block drop-shadow-lg">Kospart PH 18</span>
                                <span className="text-emerald-400 text-xs font-semibold">Bandar Lampung</span>
                            </div>
                        </div>
                        {/* Floating badge */}
                        <div className="absolute -top-4 -right-4 glass-3d rounded-2xl px-4 py-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] text-center border border-emerald-500/30">
                            <div className="text-2xl font-extrabold text-emerald-400 text-glow">{rooms.filter(r => r.status === 'available').length}</div>
                            <div className="text-xs text-slate-300 font-semibold">Kamar Tersedia</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 📢 RUNNING TEXT / MARQUEE */}
            <div className="bg-emerald-600/20 border-y border-emerald-500/30 overflow-hidden relative backdrop-blur-md flex items-center h-12 z-20 shadow-lg">
                <div className="flex w-full">
                    <div className="flex-shrink-0 flex items-center whitespace-nowrap animate-marquee text-base font-extrabold text-emerald-300 tracking-[0.2em] uppercase">
                        KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; 
                    </div>
                    <div className="flex-shrink-0 flex items-center whitespace-nowrap animate-marquee text-base font-extrabold text-emerald-300 tracking-[0.2em] uppercase" aria-hidden="true">
                        KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; KOSPART PH 18 &nbsp; ✨ &nbsp; 
                    </div>
                </div>
            </div>

            {/* ─── TENTANG / PROFIL ─── */}
            <section id="tentang" className="py-20 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Heading */}
                    <FadeUp className="text-center max-w-3xl mx-auto mb-14 space-y-3">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-3d text-emerald-400 text-xs font-bold border border-emerald-500/30 tracking-widest uppercase shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                            Tentang Kospart PH 18
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                            Selamat Datang di <span className="text-emerald-400 text-glow">Kospart PH 18</span>
                        </h2>
                        <p className="text-slate-400 font-medium text-base">Hunian Modern dengan Fasilitas Kelas Atas</p>
                    </FadeUp>

                    {/* 2-col: teks kiri, kartu kanan */}
                    <div className="grid md:grid-cols-2 gap-14 items-center mb-16">
                        <SlideIn from="left" className="space-y-5">
                            <p className="text-slate-300 text-base leading-relaxed">
                                Kospart PH 18 hadir sebagai solusi hunian eksklusif yang memadukan <strong className="text-emerald-400">kenyamanan maksimal</strong> dan kemudahan hidup modern. Setiap kamar dirancang secara privat lengkap dengan AC, TV Android, kamar mandi dalam dengan water heater serta WC duduk, lemari pakaian, dan meja rias yang elegan.
                            </p>
                            <p className="text-slate-300 text-base leading-relaxed">
                                Tak hanya kenyamanan di dalam kamar, kami memanjakan Anda dengan fasilitas bersama yang mewah — laundry praktis, Wi-Fi super cepat, serta area Lounge yang luas untuk bersantai atau bekerja.
                            </p>
                            <p className="text-slate-300 text-base leading-relaxed">
                                Butuh relaksasi? Manfaatkan <strong className="text-emerald-400">kursi pijat premium</strong> hanya Rp30.000/sesi. Resto makanan rumahan siap menyajikan hidangan lezat setiap hari. Rasakan pengalaman <strong className="text-emerald-400">nge-kos rasa apartemen</strong> hanya di Kospart PH 18!
                            </p>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <a href="#rooms" className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400/50">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    Lihat Kamar Tersedia
                                </a>
                                <a href="https://wa.me/628980598327" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 glass-3d hover:bg-slate-800/60 text-white font-bold text-sm rounded-xl transition-all">
                                    <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    Hubungi Admin WA
                                </a>
                            </div>
                        </SlideIn>

                        {/* Feature cards kanan */}
                        <SlideIn from="right">
                            <div className="grid grid-cols-2 gap-4">
                                {features.map((item, idx) => (
                                    <ScaleIn key={idx} delay={idx * 0.07}>
                                        <div className="glass-3d rounded-2xl p-4 space-y-2 cursor-default h-full">
                                            <span className="text-2xl drop-shadow-md">{item.icon}</span>
                                            <h4 className="font-extrabold text-white text-sm leading-snug">{item.title}</h4>
                                            <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                                        </div>
                                    </ScaleIn>
                                ))}
                            </div>
                        </SlideIn>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {stats.map((s, idx) => (
                            <FadeUp key={idx} delay={idx * 0.1}>
                                <div className="glass-3d rounded-2xl p-6 text-center hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300 border-t border-slate-700/50">
                                    <div className="text-3xl font-extrabold mb-1" style={{ color: s.color, textShadow: `0 0 15px ${s.color}66` }}>{s.value}</div>
                                    <div className="text-slate-300 text-xs font-semibold">{s.label}</div>
                                </div>
                            </FadeUp>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── KAMAR / ROOM LISTING ─── */}
            <main id="rooms" className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full relative z-10">
                <FadeUp className="space-y-3 text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-block px-4 py-1.5 rounded-full glass-3d text-emerald-400 text-xs font-bold border border-emerald-500/30 tracking-widest uppercase shadow-[0_0_10px_rgba(16,185,129,0.1)]">Unit Kamar Pilihan</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Kamar Tersedia Untuk Anda</h2>
                    <p className="text-slate-400 font-medium">Pilih cabang terdekat dan tipe sewa (Harian/Bulanan) sesuai kebutuhan Anda.</p>
                </FadeUp>

                {/* Filters */}
                <FadeUp delay={0.1}>
                    <div className="glass-3d rounded-2xl p-6 mb-12 flex flex-wrap gap-4 items-center justify-between border-t border-slate-700/50">
                        <div className="flex flex-wrap gap-4 flex-grow md:flex-none">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Cabang</label>
                                <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="glass-3d-input rounded-xl px-4 py-2.5 text-sm font-medium w-48">
                                    <option value="all" className="bg-slate-900 text-white">Semua Cabang</option>
                                    {branches.map(b => <option key={b.id} value={b.id} className="bg-slate-900 text-white">{b.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Tipe Sewa</label>
                                <select value={rentalType} onChange={(e) => setRentalType(e.target.value)} className="glass-3d-input rounded-xl px-4 py-2.5 text-sm font-medium w-40">
                                    <option value="all" className="bg-slate-900 text-white">Semua Tipe</option>
                                    <option value="monthly" className="bg-slate-900 text-white">Bulanan saja</option>
                                    <option value="daily" className="bg-slate-900 text-white">Harian saja</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 w-full md:w-80">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Pencarian</label>
                            <div className="relative">
                                <input type="text" placeholder="Cari nomor kamar/fasilitas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="glass-3d-input rounded-xl pl-10 pr-4 py-2.5 text-sm w-full" />
                                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
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
                                className="glass-3d rounded-2xl overflow-hidden flex flex-col relative group cursor-pointer h-full"
                            >
                                <div className="absolute top-4 left-4 z-10">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg ${
                                        room.status === 'available' ? 'bg-emerald-500/80 text-white border border-emerald-400/50 backdrop-blur-sm' :
                                        room.status === 'occupied' ? 'bg-red-500/80 text-white border border-red-400/50 backdrop-blur-sm' :
                                        room.status === 'booked' ? 'bg-amber-500/80 text-white border border-amber-400/50 backdrop-blur-sm' :
                                        'bg-slate-500/80 text-white border border-slate-400/50 backdrop-blur-sm'
                                    }`}>
                                        {room.status === 'available' ? 'Tersedia' : room.status === 'occupied' ? 'Penuh' : room.status === 'booked' ? 'Dibooking' : 'Maintenance'}
                                    </span>
                                </div>

                                <div className="relative h-56 overflow-hidden">
                                    <img src={(room.photos && room.photos.length > 0) ? room.photos[0] : (room.image || '/images/foto kamar 1.jpeg')} alt={`Kamar ${room.room_number}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-overlay opacity-80" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                                        <h3 className="text-white font-extrabold text-2xl font-mono drop-shadow-md">No. {room.room_number}</h3>
                                        <span className="text-white text-xs font-semibold glass-3d px-2.5 py-1 rounded-md">
                                            {room.branch.name.replace('Kospart PH 18 - ', '')}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 flex-grow flex flex-col justify-between space-y-5">
                                    <div className="space-y-3">
                                        <p className="text-slate-300 text-sm leading-relaxed font-medium line-clamp-2">{room.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {room.facilities && JSON.parse(JSON.stringify(room.facilities)).slice(0, 4).map((fac, i) => (
                                                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md glass-3d text-slate-200 text-xs">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>{fac}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-700/50 pt-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            {room.price_monthly > 0 && (
                                                <div>
                                                    <span className="text-slate-400 text-xs font-medium block">Sewa Bulanan</span>
                                                    <span className="text-white font-extrabold text-lg">Rp {parseFloat(room.price_monthly).toLocaleString('id-ID')}</span>
                                                </div>
                                            )}
                                            {room.price_daily > 0 && (
                                                <div className="text-right">
                                                    <span className="text-slate-400 text-xs font-medium block">Sewa Harian</span>
                                                    <span className="text-emerald-400 font-extrabold text-lg text-glow">Rp {parseFloat(room.price_daily).toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">/hari</span></span>
                                                    {room.price_weekend > 0 && (
                                                        <span className="text-orange-400 font-bold text-[10px] block mt-0.5 whitespace-nowrap overflow-visible">Wknd: Rp {parseFloat(room.price_weekend).toLocaleString('id-ID')}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {room.status === 'available' ? (
                                            <button onClick={(e) => { e.stopPropagation(); handleOpenBooking(room); }} className="w-full py-3 bg-emerald-600/90 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400/50 flex items-center justify-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                Booking Online
                                            </button>
                                        ) : (
                                            <button disabled className="w-full py-3 glass-3d border-slate-700/50 text-slate-500 text-sm font-bold rounded-xl cursor-not-allowed">
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
                        <div className="text-4xl mb-3 drop-shadow-md">🔍</div>
                        <h3 className="text-xl font-extrabold text-white mb-1">Kamar tidak ditemukan</h3>
                        <p className="text-slate-400 text-sm">Coba ubah filter pencarian Anda.</p>
                    </FadeUp>
                )}

                {/* CTA ke halaman kamar lengkap */}
                <FadeUp delay={0.2} className="text-center mt-14">
                    <Link href="/kamar" className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/50 transition-all transform hover:-translate-y-0.5 text-sm">
                        Lihat Semua Kamar & Filter Lengkap
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </Link>
                </FadeUp>
            </main>


            {/* ─── VIDEO TOUR ─── */}
            {virtualTours && virtualTours.length > 0 && (
            <section id="video-tour" className="py-20 relative z-10 border-t border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <FadeUp className="space-y-3 text-center max-w-2xl mx-auto">
                        <span className="px-3.5 py-1.5 rounded-full glass-3d text-emerald-400 text-xs font-semibold border border-emerald-500/30 tracking-wide uppercase shadow-[0_0_10px_rgba(16,185,129,0.1)]">Video Virtual Tour</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Virtual Tour Kos & Fasilitas</h2>
                        <p className="text-slate-400 font-medium">Saksikan suasana fasilitas kami secara langsung.</p>
                    </FadeUp>

                    <div className="max-w-4xl mx-auto relative group">
                        <FadeUp>
                            <div className="space-y-4">
                                <div className="text-center">
                                    <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest block text-glow">
                                        {virtualTours[activeTourIndex]?.title}
                                    </span>
                                </div>
                                <div className="rounded-3xl overflow-hidden glass-3d shadow-[0_0_40px_rgba(0,0,0,0.6)] border border-slate-700/50 aspect-video p-1.5 relative">
                                    <video 
                                        key={activeTourIndex}
                                        src={virtualTours[activeTourIndex]?.video_path} 
                                        controls 
                                        className="w-full h-full object-cover rounded-2xl bg-slate-950"
                                    ></video>
                                    
                                    {virtualTours.length > 1 && (
                                        <>
                                            <button 
                                                onClick={() => setActiveTourIndex(prev => prev === 0 ? virtualTours.length - 1 : prev - 1)}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-3d flex items-center justify-center text-white hover:text-emerald-400 border border-slate-600/50 hover:border-emerald-500/50 shadow-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={() => setActiveTourIndex(prev => prev === virtualTours.length - 1 ? 0 : prev + 1)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-3d flex items-center justify-center text-white hover:text-emerald-400 border border-slate-600/50 hover:border-emerald-500/50 shadow-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                </svg>
                                            </button>
                                        </>
                                    )}
                                </div>
                                
                                {/* Indicators */}
                                {virtualTours.length > 1 && (
                                    <div className="flex items-center justify-center gap-3 pt-4">
                                        {virtualTours.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveTourIndex(idx)}
                                                className={`h-2.5 rounded-full transition-all duration-300 ${activeTourIndex === idx ? 'w-8 bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'w-2.5 bg-slate-600 hover:bg-slate-500'}`}
                                                aria-label={`Go to slide ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </FadeUp>
                    </div>
                </div>
            </section>
            )}

            {/* ─── TESTIMONI ─── */}
            {testimonials && testimonials.length > 0 && (
            <section id="testimoni" className="py-20 relative z-10 border-t border-slate-800/50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeUp className="text-center max-w-2xl mx-auto mb-14 space-y-3">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-3d text-amber-400 text-xs font-bold border border-amber-500/30 tracking-widest uppercase shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                            Testimoni Penghuni
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                            Apa Kata Mereka tentang <span className="text-emerald-400 text-glow">Kospart PH 18?</span>
                        </h2>
                    </FadeUp>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {testimonials.map((t, idx) => (
                            <ScaleIn key={t.id || idx} delay={idx * 0.07}>
                                <div className="glass-3d rounded-2xl p-6 space-y-4 h-full flex flex-col">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-xl shrink-0">
                                                {t.avatar || '👤'}
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-white text-sm">{t.name}</div>
                                                <div className="text-slate-400 text-xs">{t.role}</div>
                                            </div>
                                        </div>
                                        {t.badge && <span className="text-[10px] font-bold px-2 py-1 rounded-full glass-3d text-emerald-400 border border-emerald-500/30 shrink-0">{t.badge}</span>}
                                    </div>
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: t.rating || 5 }).map((_, i) => (
                                            <svg key={i} className="w-4 h-4 text-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.8)]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        ))}
                                    </div>
                                    <p className="text-slate-300 text-sm leading-relaxed flex-grow">
                                        "{t.text}"
                                    </p>
                                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t.date_text}</div>
                                </div>
                            </ScaleIn>
                        ))}
                    </div>
                </div>
            </section>
            )}

            {/* ─── FAQ SECTION ─── */}
            <div className="py-24 relative z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeUp>
                        <div className="text-center mb-12">
                            <h2 className="font-extrabold text-3xl md:text-5xl text-white tracking-tight mb-4 text-glow">
                                Pertanyaan Seputar Kos
                            </h2>
                            <p className="text-slate-400 text-lg">Jawaban cepat untuk hal-hal yang sering ditanyakan calon penghuni.</p>
                        </div>
                    </FadeUp>
                    <div className="space-y-4">
                        {(faqs || []).map((faq, index) => (
                            <FadeUp key={faq.id || index} delay={0.1 * index}>
                                <details className="group glass-3d border border-slate-700/50 rounded-2xl overflow-hidden cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                                    <summary className="flex justify-between items-center font-bold text-lg text-slate-200 p-6 hover:bg-slate-800/40 transition-colors">
                                        {faq.question}
                                        <span className="transition group-open:rotate-180 bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg shrink-0 ml-4">
                                            <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
                                        </span>
                                    </summary>
                                    <div className="text-slate-300 px-6 pb-6 pt-5 leading-relaxed border-t border-slate-700/50 bg-slate-800/20 whitespace-pre-line text-base">
                                        {faq.answer}
                                    </div>
                                </details>
                            </FadeUp>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── KONTAK / LOKASI ─── */}
            <section id="contact" className="py-20 relative z-10 border-t border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-12">
                    <SlideIn from="left" className="md:col-span-5 space-y-6">
                        <FadeUp>
                            <span className="inline-block px-4 py-1.5 rounded-full glass-3d text-emerald-400 text-xs font-bold border border-emerald-500/30 tracking-widest uppercase shadow-[0_0_10px_rgba(16,185,129,0.1)] mb-2">Lokasi & Kontak</span>
                            <h2 className="text-3xl font-extrabold text-white tracking-tight">Kunjungi Lokasi Kami</h2>
                            <p className="text-slate-400 text-sm leading-relaxed font-medium mt-3">
                                Kami terbuka untuk melayani survei kamar secara langsung. Silakan atur jadwal kunjungan dengan menghubungi admin WhatsApp kami.
                            </p>
                        </FadeUp>

                        <div className="space-y-4 text-sm">
                            <div className="flex gap-3 items-start p-4 glass-3d rounded-2xl border border-slate-700/50 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                                <svg className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <div>
                                    <strong className="text-white block mb-1">Alamat Kospart PH 18:</strong>
                                    <span className="text-slate-400 text-xs leading-relaxed block">Samping BNI Kartini, di komplek perukoan belakang Mall Kartini (masuk dari samping Halte Kartini), Palapa, Kec. Tj. Karang Pusat, Kota Bandar Lampung, Lampung 35118</span>
                                </div>
                            </div>
                            <div className="flex gap-3 items-center p-4 glass-3d rounded-2xl border border-slate-700/50 shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                <div>
                                    <strong className="text-white block">WhatsApp Admin:</strong>
                                    <a href="https://wa.me/628980598327" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-bold text-glow">+62 898-0598-327</a>
                                </div>
                            </div>
                        </div>

                        <a
                            href="https://www.google.com/maps/place/kospart+PH+18/@-5.4164332,105.2538444,19.18z/data=!4m9!3m8!1s0x2e40dbb43262d9df:0xa1cf05d7be03bb72!5m2!4m1!1i2!8m2!3d-5.416147!4d105.2535747!16s%2Fg%2F11yspfw7t2?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D"
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400/50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            Buka Petunjuk Arah
                        </a>
                    </SlideIn>

                    <SlideIn from="right" className="md:col-span-7">
                        <div className="h-96 rounded-2xl overflow-hidden glass-3d shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-slate-700/50 p-1">
                            <iframe
                                src="https://maps.google.com/maps?q=-5.416147,105.2535747&z=17&output=embed"
                                className="w-full h-full border-0 rounded-xl mix-blend-luminosity hover:mix-blend-normal transition-all duration-500"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
                    <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 overflow-hidden shadow-2xl shadow-emerald-900/20 relative my-6" style={{ animation: 'modalIn 0.3s ease' }}>
                        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
                        <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100/50 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-2xl text-slate-800 tracking-tight">Kamar Nomor {showRoomDetail.room_number}</h3>
                                <span className="text-emerald-600 text-xs font-bold tracking-wide uppercase bg-emerald-100/50 px-2.5 py-1 rounded-full mt-1.5 inline-block">{showRoomDetail.branch?.name?.replace('Kospart PH 18 - ', 'KOSPART PH 18 - ')}</span>
                            </div>
                            <button onClick={() => setShowRoomDetail(null)} className="text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2.5 transition-all duration-300 hover:rotate-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
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

            {/* ─── BOOKING MODAL ─── */}
            {selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
                    <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 overflow-hidden shadow-2xl shadow-emerald-900/20 relative my-6" style={{ animation: 'modalIn 0.3s ease' }}>
                        <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100/50 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-2xl text-slate-800 tracking-tight">Formulir Pemesanan</h3>
                                <p className="text-emerald-600 text-xs font-bold tracking-wide uppercase bg-emerald-100/50 px-2.5 py-1 rounded-full mt-1.5 inline-block">Kamar {selectedRoom.room_number}</p>
                            </div>
                            <button onClick={resetBookingModal} className="text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2.5 transition-all duration-300 hover:rotate-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
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
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{f.label}</label>
                                        <input type={f.type} required value={bookingForm[f.key]} onChange={(e) => setBookingForm({ ...bookingForm, [f.key]: e.target.value })} className="bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-sm w-full font-medium transition-all" placeholder={f.placeholder} />
                                    </div>
                                ))}
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
                                        }} className="bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-sm w-full font-medium transition-all text-center" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Selesai Sewa</label>
                                    <input type="date" required value={bookingForm.end_date} onChange={(e) => setBookingForm({ ...bookingForm, end_date: e.target.value })} className="bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-sm w-full font-medium transition-all text-center" />
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
                                                    let days = Math.max(1, diffDays);
                                                    total = 0;
                                                    let iterDate = new Date(start);
                                                    for (let i = 0; i < days; i++) {
                                                        let dayOfWeek = iterDate.getDay();
                                                        if ((dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) && selectedRoom.price_weekend > 0) {
                                                            total += parseFloat(selectedRoom.price_weekend);
                                                        } else {
                                                            total += parseFloat(selectedRoom.price_daily);
                                                        }
                                                        iterDate.setDate(iterDate.getDate() + 1);
                                                    }
                                                } else if (bookingForm.rental_type === 'weekly') {
                                                    const diffWeeks = Math.floor(diffDays / 7);
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

                        {bookingStep === 'otp' && (
                            <div className="p-6 space-y-6">
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div className="space-y-1.5 text-center">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Masukkan 6 Digit Kode OTP</label>
                                        <input type="text" maxLength="6" required value={otpCodeInput} onChange={(e) => setOtpCodeInput(e.target.value)} className="glass-input rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest w-48 mx-auto block font-mono" placeholder="------" />
                                        {otpError && <p className="text-red-600 text-xs mt-1">{otpError}</p>}
                                    </div>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setBookingStep('booking')} className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-all border border-slate-200">Kembali</button>
                                        <button type="submit" className="flex-1 py-3 font-bold rounded-xl text-sm transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 text-white">Verifikasi OTP</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {bookingStep === 'payment_proof' && (
                            <form onSubmit={handleUploadPayment} className="p-6 space-y-4">
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-800 leading-relaxed">
                                    <h4 className="font-bold mb-2 text-sm border-b border-emerald-200 pb-2">Informasi Pembayaran (Batas Waktu: 1 Jam)</h4>
                                    <p className="mb-2">Total yang harus dibayar: <strong className="text-emerald-700 text-sm">Rp {bookingResponse?.booking?.total_amount ? parseFloat(bookingResponse.booking.total_amount).toLocaleString('id-ID') : (bookingForm.rental_type === 'daily' ? selectedRoom.price_daily : selectedRoom.price_monthly).toLocaleString('id-ID')}</strong></p>
                                    <p>Selesaikan pembayaran ke rekening berikut:</p>
                                    <ul className="list-disc pl-5 mt-2 mb-3 space-y-1 font-bold text-slate-800">
                                        <li>BCA: 8447060961</li>
                                    </ul>
                                    <p className="mb-3">ATAS NAMA: <strong className="text-emerald-900">PRAYOGA HERIYANTO</strong></p>
                                    <p>Masukkan nominal yang Anda transfer dan unggah bukti transfer di bawah ini.</p>
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
            <footer className="mt-auto glass-3d border-t border-slate-800/50 py-10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            <img src="/images/logo 2.jpeg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-extrabold text-white text-glow">KOSPART PH 18</span>
                    </div>
                    <p className="text-xs text-center">© {new Date().getFullYear()} Kospart PH 18. All rights reserved. <a href="https://api.whatsapp.com/send/?phone=6289528306239&text&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-semibold text-glow hover:text-emerald-300 transition-colors">Powered by Rifqi Bili.</a></p>
                    <div className="flex gap-4 text-xs">
                        <a href="#tentang" className="hover:text-emerald-400 transition-colors">Tentang Kami</a>
                        <Link href="/kamar" className="hover:text-emerald-400 transition-colors">Cari Kamar</Link>
                        <a href="#contact" className="hover:text-emerald-400 transition-colors">Kontak</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
