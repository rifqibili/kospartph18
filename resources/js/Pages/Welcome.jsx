import React, { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import DragDropZone from '@/Components/DragDropZone';
import WaveBackground from '@/Components/WaveBackground';
import { CardStack } from '@/Components/ui/card-stack';
import { CTASection } from '@/Components/ui/hero-dithering-card';
import { ElegantPatternBg } from '@/Components/ui/elegant-dark-pattern';
import { TestimonialsSection } from '@/Components/ui/testimonial-v2';
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

const SlideReveal = ({ children, from = 'left', delay = 0, className = '' }) => {
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

export default function Welcome({ branches, rooms, faqs, virtualTours = [], testimonials = [], auth }) {
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [rentalType, setRentalType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        name: '', email: '', phone: '', start_date: '', end_date: '', rental_type: 'monthly', nik: '', ktp_photo: null, agree_tnc: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingError, setBookingError] = useState('');
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
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const headerRef = useRef(null);

    useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (isMobileMenuOpen && headerRef.current && !headerRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isMobileMenuOpen]);


    const getRoomMedia = (room) => {
        if (!room) return [];
        let media = [];
        if (room.photos && room.photos.length > 0) {
            room.photos.forEach(photo => { media.push({ type: 'image', src: photo }); });
        }
        if (room.videos && room.videos.length > 0) {
            room.videos.forEach(video => { media.push({ type: 'video', src: video }); });
        }
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
            setShowLoginPrompt(true);
            return;
        }
        setSelectedRoom(room);
        const defaultRentalType = room.price_monthly > 0 ? 'monthly' : (room.price_yearly > 0 ? 'yearly' : (room.price_weekly > 0 ? 'weekly' : 'daily'));
        const endDate = new Date();
        if (defaultRentalType === 'daily') { endDate.setDate(endDate.getDate() + 1); }
        else if (defaultRentalType === 'weekly') { endDate.setDate(endDate.getDate() + 7); }
        else if (defaultRentalType === 'monthly') { endDate.setMonth(endDate.getMonth() + 1); }
        else { endDate.setFullYear(endDate.getFullYear() + 1); }
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
        setBookingError('');
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
            if (bookingForm.ktp_photo) { formData.append('ktp_photo', bookingForm.ktp_photo); }
            const res = await fetch('/api/bookings/store', { method: 'POST', headers: { 'Accept': 'application/json' }, body: formData });
            const data = await res.json();
            if (res.ok) { setBookingResponse(data); setBookingStep('otp'); }
            else {
                if (data.errors && data.errors.nik) {
                    setBookingError(data.errors.nik[0]);
                } else {
                    setBookingError(data.message || 'Terjadi kesalahan saat memproses pesanan Anda.');
                }
            }
        } catch (err) { console.error(err); setBookingError('Gagal mengajukan pemesanan. Silakan coba lagi.'); }
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
            if (res.ok) { setBookingResponse(prev => ({...prev, booking: data.booking})); setPaidAmountInput(data.booking.total_amount); setBookingStep('payment_proof'); }
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

    const dummyTestimonials = [
        { name: "Budi Santoso", role: "Karyawan Swasta", text: "Kospart PH 18 benar-benar memberikan kenyamanan seperti hotel. Fasilitas lounge dan kursinya luar biasa. Sangat direkomendasikan untuk profesional!", rating: 5 },
        { name: "Sarah Aulia", role: "Mahasiswi", text: "Bersih, aman, dan estetik! Kamar mandinya selalu wangi, AC dingin, dan adminnya ramah-ramah. Betah banget tinggal di sini.", rating: 5 },
        { name: "Reza Pratama", role: "Freelancer", text: "Internetnya kencang banget, cocok buat saya yang sering WFH. Suasananya tenang dan damai, the best kos in Bandar Lampung!", rating: 5 },
    ];
    
    const displayTestimonials = testimonials && testimonials.length > 0 ? testimonials : dummyTestimonials;

    return (
        <div className="min-h-screen bg-lux text-slate-700 flex flex-col font-sans selection:bg-[#2d6a4f] selection:text-white overflow-x-hidden" style={{ position: 'relative' }}>
            <style>{`
                @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
                @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
                @keyframes lux-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .lux-marquee-inner { animation: lux-marquee 60s linear infinite; }
                @keyframes lux-float-slow { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.05); } }
                @keyframes lux-float-slow2 { 0%,100% { transform: translateY(0) scale(1) rotate(0deg); } 50% { transform: translateY(20px) scale(0.96) rotate(6deg); } }
                .lux-blob-1 { animation: lux-float-slow 14s ease-in-out infinite; }
                .lux-blob-2 { animation: lux-float-slow2 18s ease-in-out infinite; }
                .lux-blob-3 { animation: lux-float-slow 22s ease-in-out infinite reverse; }
                .lux-orb { position:fixed; border-radius:50%; pointer-events:none; z-index:0; }
            `}</style>

            {/* ── GLOBAL DECORATIVE BLOBS (fixed, behind everything) ── */}
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

            <Head title="Beranda – Kospart PH 18 | Hunian Eksklusif Lampung" />


            {/* ── HEADER ── */}
            <header ref={headerRef} className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl transition-all duration-300">
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md rounded-full border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.1)] pointer-events-none -z-10"></div>
                <div className="px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between relative z-10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-white/50 shadow-sm">
                            <img loading="lazy" src="/images/logo 2.jpeg" alt="Logo Kospart" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <span className="font-extrabold text-xl tracking-tight text-forest block" style={{ fontFamily: "'Outfit', sans-serif" }}>KOSPART</span>
                            <span className="text-gold text-[10px] font-bold tracking-[0.2em] uppercase block -mt-0.5">PH 18 LAMPUNG</span>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/" className="lux-nav-link active">Beranda</Link>
                        <Link href="/kamar" className="lux-nav-link">Cari Kamar</Link>
                        <Link href="/cabang" className="lux-nav-link">Cabang Kos</Link>
                        <a href="#contact" className="lux-nav-link">Kontak</a>
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
                            <Link href="/" className="block text-forest hover:bg-forest/5 px-4 py-3 rounded-2xl transition-colors font-bold text-[15px]">Beranda</Link>
                            <Link href="/kamar" className="block text-slate-600 hover:text-forest hover:bg-forest/5 px-4 py-3 rounded-2xl transition-colors font-semibold text-[15px]">Cari Kamar</Link>
                            <Link href="/cabang" className="block text-slate-600 hover:text-forest hover:bg-forest/5 px-4 py-3 rounded-2xl transition-colors font-semibold text-[15px]">Cabang Kos</Link>
                            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="block text-slate-600 hover:text-forest hover:bg-forest/5 px-4 py-3 rounded-2xl transition-colors font-semibold text-[15px]">Kontak</a>
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

            {/* ── HERO ── */}
            <section className="relative overflow-hidden border-b border-[rgba(201,168,76,0.1)] bg-cover bg-center min-h-screen flex items-center" style={{ backgroundImage: "url('/images/ruang tamu.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-20">
                    <Reveal className="max-w-2xl space-y-6">
                        
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight drop-shadow-xl uppercase" style={{ fontFamily: "'Playfair Display', serif", textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                            KOST NYAMAN, <br />
                            <span className="text-gold italic drop-shadow-xl">RASA APARTEMEN.</span>
                        </h1>
                        
                        <p className="text-white/95 text-lg sm:text-xl font-medium leading-relaxed max-w-xl drop-shadow-lg" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
                            Lebih dari sekadar tempat singgah. Temukan standar baru kos-kosan elit dengan fasilitas premium, privasi maksimal, dan pelayanan bintang lima.
                        </p>
                        
                        <div className="flex flex-wrap gap-4 pt-4">
                            <a href="#rooms" className="lux-btn-primary px-8 py-4 text-base flex items-center gap-2 group hover:scale-105 transition-transform shadow-lg shadow-black/20">
                                Jelajahi Kamar
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                            </a>
                            <a href="https://wa.me/628980598327" target="_blank" rel="noopener noreferrer" className="bg-black/20 backdrop-blur-md border border-white/30 text-white hover:bg-black/40 px-8 py-4 rounded-full font-bold text-base flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-black/20">
                                Tanya Admin
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ── MARQUEE ── */}
            <div className="bg-forest border-y border-[rgba(201,168,76,0.3)] overflow-hidden h-14 sm:h-16 flex items-center">
                <div className="flex whitespace-nowrap lux-marquee-inner">
                    {[...Array(40)].map((_, i) => (
                        <span key={i} className="text-sm sm:text-base font-extrabold text-[rgba(201,168,76,0.9)] tracking-[0.25em] uppercase px-10">
                            KOSPART PH 18 &nbsp;✦&nbsp;
                        </span>
                    ))}
                </div>
            </div>

            {/* ── TENTANG ── */}
            <section id="tentang" className="lux-section">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                        <span className="lux-section-label">Tentang Kospart PH 18</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-forest leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Selamat Datang di <span className="italic text-gold">Kospart PH 18</span>
                        </h2>
                        <p className="text-slate-500 font-medium text-base">Hunian Modern dengan Fasilitas Kelas Atas</p>
                    </Reveal>

                    <div className="grid md:grid-cols-2 gap-14 items-center mb-16">
                        <SlideReveal from="left" className="space-y-5">
                            <p className="text-slate-600 text-base leading-relaxed">
                                Kospart PH 18 hadir sebagai solusi hunian eksklusif yang memadukan <strong className="text-forest">kenyamanan maksimal</strong> dan kemudahan hidup modern. Setiap kamar dirancang secara privat lengkap dengan AC, TV Android, kamar mandi dalam dengan water heater serta WC duduk, lemari pakaian, dan meja rias yang elegan.
                            </p>
                            <p className="text-slate-600 text-base leading-relaxed">
                                Tak hanya kenyamanan di dalam kamar, kami memanjakan Anda dengan fasilitas bersama — laundry praktis, Wi-Fi super cepat, serta area Lounge yang luas untuk bersantai atau bekerja.
                            </p>
                            <p className="text-slate-600 text-base leading-relaxed">
                                Butuh relaksasi? Manfaatkan <strong className="text-forest">kursi pijat premium</strong> hanya Rp30.000/sesi. Resto rumahan siap menyajikan hidangan lezat setiap hari. Rasakan pengalaman <strong className="text-forest">NG-KOS RASA APARTEMEN</strong> hanya di Kospart PH 18!
                            </p>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <a href="#rooms" className="lux-btn-primary px-5 py-3 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    Lihat Kamar Tersedia
                                </a>
                                <a href="https://wa.me/628980598327" target="_blank" rel="noopener noreferrer" className="lux-btn-outline px-5 py-3 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                    Hubungi Admin WA
                                </a>
                            </div>
                        </SlideReveal>

                        {/* Feature cards */}
                        <SlideReveal from="right">
                            <div className="grid grid-cols-2 gap-4">
                                {features.map((item, idx) => (
                                    <Reveal key={idx} delay={idx * 0.07}>
                                        <div className="lux-card p-4 space-y-2 cursor-default">
                                            <span className="text-2xl drop-shadow-sm">{item.icon}</span>
                                            <h4 className="font-bold text-forest text-sm leading-snug">{item.title}</h4>
                                            <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </SlideReveal>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {[
                            { value: '2+', label: 'Lokasi Cabang', color: '#2d6a4f' },
                            { value: 'Rp30K', label: 'Kursi Pijat / Sesi', color: '#c9a84c' },
                            { value: '24/7', label: 'Keamanan CCTV', color: '#1a3d2b' },
                            { value: '100%', label: 'Kepuasan Penghuni', color: '#2d6a4f' },
                        ].map((s, idx) => (
                            <Reveal key={idx} delay={idx * 0.1}>
                                <div className="lux-card p-6 text-center">
                                    <div className="text-3xl font-extrabold mb-1" style={{ color: s.color, fontFamily: "'Outfit', sans-serif" }}>{s.value}</div>
                                    <div className="text-slate-500 text-xs font-semibold">{s.label}</div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ROOMS ── */}
            <section id="rooms" className="relative lux-section overflow-hidden bg-gradient-to-b from-[#faf7f2] via-white to-[#faf7f2] border-y border-[rgba(201,168,76,0.08)]">
                {/* Decorative Interactive Background */}
                <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
                    <WaveBackground />
                    <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[rgba(201,168,76,0.04)] blur-[100px] animate-pulse" style={{ animationDuration: '6s' }}></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[rgba(26,61,43,0.04)] blur-[120px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
                    <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-[rgba(201,168,76,0.03)] blur-[80px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }}></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <Reveal className="text-center max-w-2xl mx-auto mb-12 space-y-4">
                        <span className="lux-section-label">Unit Kamar Pilihan</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-forest" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Kamar Tersedia Untuk Anda
                        </h2>
                        <p className="text-slate-500 font-medium">Pilih cabang terdekat dan tipe sewa sesuai kebutuhan Anda.</p>
                    </Reveal>

                    {/* Filters */}
                    <Reveal delay={0.1}>
                        <div className="bg-white rounded-2xl border border-[rgba(201,168,76,0.15)] shadow-sm p-4 sm:p-6 mb-10 flex flex-col md:flex-row gap-4 items-end justify-between">
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                                    <label className="lux-section-label" style={{ fontSize: '10px' }}>Cabang</label>
                                    <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="lux-select px-4 py-2.5 w-full sm:w-48">
                                        <option value="all">Semua Cabang</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name.replace('Kospart PH 18 - ', '')}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                                    <label className="lux-section-label" style={{ fontSize: '10px' }}>Tipe Sewa</label>
                                    <select value={rentalType} onChange={(e) => setRentalType(e.target.value)} className="lux-select px-4 py-2.5 w-full sm:w-40">
                                        <option value="all">Semua Tipe</option>
                                        <option value="monthly">Bulanan</option>
                                        <option value="daily">Harian</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5 w-full md:w-72">
                                <label className="lux-section-label" style={{ fontSize: '10px' }}>Pencarian</label>
                                <div className="relative w-full">
                                    <input type="text" placeholder="Cari kamar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="lux-input pl-10 pr-4 py-2.5 w-full" />
                                    <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    {/* Room Cards */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.slice(0, 3).map((room, idx) => (
                            <Reveal key={room.id} delay={idx * 0.06}>
                                <div
                                    onClick={() => { setShowRoomDetail(room); setActiveGalleryIndex(0); }}
                                    className="lux-card group cursor-pointer flex flex-row sm:flex-col transform transition-all duration-500 hover:-translate-y-4 hover:scale-[1.02] hover:shadow-[0_35px_60px_-15px_rgba(26,61,43,0.25)] hover:border-[rgba(201,168,76,0.4)] bg-white/90 backdrop-blur-sm"
                                >
                                    {/* Room Image */}
                                    <div className="relative w-[38%] sm:w-full sm:h-48 shrink-0 overflow-hidden rounded-tl-[20px] rounded-bl-[20px] sm:rounded-b-none sm:rounded-t-[20px] bg-slate-100">
                                        <img loading="lazy"
                                            src={(room.photos && room.photos.length > 0) ? room.photos[0] : '/images/foto kamar 1.jpeg'}
                                            alt={`Kamar ${room.room_number}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="sm:absolute sm:top-3 sm:left-3 hidden sm:block">
                                            <span className={`${
                                                room.status === 'available' ? 'lux-status-available' :
                                                room.status === 'occupied' ? 'lux-status-occupied' :
                                                room.status === 'booked' ? 'lux-status-booked' :
                                                'lux-status-occupied'
                                            }`}>
                                                {room.status === 'available' ? 'Tersedia' :
                                                 room.status === 'occupied' ? 'Penuh' :
                                                 room.status === 'booked' ? 'Dipesan' : 'Maintenance'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between">
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-forest font-bold text-sm sm:text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>Kamar {room.room_number}</h3>
                                                    <span className="text-[10px] text-gold font-bold bg-[rgba(201,168,76,0.1)] px-2 py-0.5 rounded-md border border-[rgba(201,168,76,0.2)] mt-1 inline-block">
                                                        {room.branch.name.replace('Kospart PH 18 - ', '')}
                                                    </span>
                                                </div>
                                                <span className={`sm:hidden text-[8px] ${
                                                    room.status === 'available' ? 'lux-status-available' :
                                                    room.status === 'occupied' ? 'lux-status-occupied' :
                                                    'lux-status-booked'
                                                }`}>
                                                    {room.status === 'available' ? 'Kosong' : 'Penuh'}
                                                </span>
                                            </div>

                                            <p className="text-slate-500 text-[10px] sm:text-xs leading-relaxed line-clamp-2">{room.description}</p>

                                            {/* Facilities */}
                                            <div className="flex flex-wrap gap-1">
                                                {room.facilities && (() => {
                                                    const facArray = Array.isArray(room.facilities) ? room.facilities : JSON.parse(JSON.stringify(room.facilities));
                                                    return facArray.slice(0, 2).map((fac, idx) => (
                                                        <span key={idx} className="lux-pill text-[8px] sm:text-[10px]">
                                                            <span className="lux-dot" style={{ width: 5, height: 5 }}></span>
                                                            {fac}
                                                        </span>
                                                    ));
                                                })()}
                                                {room.facilities && room.facilities.length > 2 && (
                                                    <span className="lux-pill text-[8px] sm:text-[10px] text-gold border-[rgba(201,168,76,0.2)]">+{room.facilities.length - 2}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Price & actions */}
                                        <div className="border-t border-[rgba(201,168,76,0.1)] pt-3 mt-3">
                                            <div className="flex justify-between items-end mb-3">
                                                {room.price_monthly > 0 && (
                                                    <div>
                                                        <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider block">Bulanan</span>
                                                        <span className="lux-price text-sm sm:text-base">Rp {parseFloat(room.price_monthly).toLocaleString('id-ID')}</span>
                                                    </div>
                                                )}
                                                {room.price_daily > 0 && (
                                                    <div className="text-right">
                                                        <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider block">Harian</span>
                                                        <span className="text-gold font-extrabold text-sm sm:text-base" style={{ fontFamily: "'Outfit', sans-serif" }}>Rp {parseFloat(room.price_daily).toLocaleString('id-ID')}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button aria-label="Action Button" 
                                                    onClick={(e) => { e.stopPropagation(); setShowRoomDetail(room); setActiveGalleryIndex(0); }}
                                                    className="py-2 lux-btn-outline text-xs sm:text-xs font-bold text-center"
                                                >
                                                    Detail
                                                </button>
                                                {room.status === 'available' ? (
                                                    <button aria-label="Action Button" 
                                                        onClick={(e) => { e.stopPropagation(); handleOpenBooking(room); }}
                                                        className="py-2 lux-btn-primary text-xs sm:text-xs font-bold text-center"
                                                    >
                                                        Booking
                                                    </button>
                                                ) : (
                                                    <button aria-label="Action Button"  disabled className="py-2 text-xs bg-slate-100 text-slate-500 font-bold rounded-xl cursor-not-allowed">
                                                        Penuh
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>

                    {filteredRooms.length === 0 && (
                        <Reveal className="py-16 text-center">
                            <div className="text-4xl mb-3">🔍</div>
                            <h3 className="text-xl font-bold text-forest mb-1">Kamar tidak ditemukan</h3>
                            <p className="text-slate-500 text-sm">Coba ubah filter pencarian Anda.</p>
                        </Reveal>
                    )}

                    <Reveal delay={0.2} className="text-center mt-12">
                        <Link href="/kamar" className="lux-btn-primary inline-flex items-center gap-2 px-8 py-4 text-sm">
                            Lihat Semua Kamar & Filter Lengkap
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </Link>
                    </Reveal>
                </div>
            </section>

            {/* ── VIDEO TOUR ── */}
            {virtualTours && virtualTours.length > 0 && (
                <ElegantPatternBg id="video-tour" className="lux-section border-y border-[#F5F5DC]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <Reveal className="text-center max-w-2xl mx-auto space-y-4">
                            <span className="lux-section-label">Video Virtual Tour</span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-forest" style={{ fontFamily: "'Playfair Display', serif" }}>Tur Virtual Kos & Fasilitas</h2>
                            <p className="text-slate-500 font-medium">Saksikan suasana fasilitas kami secara langsung dengan tampilan yang elegan.</p>
                        </Reveal>
                        <div className="max-w-4xl mx-auto pt-10 pb-20">
                            <Reveal>
                                <CardStack
                                    items={virtualTours.map((t, i) => ({
                                        id: i,
                                        title: t.title,
                                        description: "",
                                        videoSrc: t.video_path
                                    }))}
                                    initialIndex={0}
                                    autoAdvance={false}
                                    intervalMs={3000}
                                    pauseOnHover={true}
                                    showDots={true}
                                />
                            </Reveal>
                        </div>
                    </div>
                </ElegantPatternBg>
            )}

            {/* ── TESTIMONIALS ── */}
            <TestimonialsSection testimonials={displayTestimonials} />

            {/* ── FAQ ── */}
            {faqs && faqs.length > 0 && (
                <section id="faq" className="lux-section bg-white border-t border-[#F5F5DC] relative overflow-hidden">
                    {/* Amber/Gold Glow Background from bottom */}
                    <div
                        className="absolute inset-0 z-0 pointer-events-none opacity-60"
                        style={{
                            backgroundImage: "radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #c9a84c 100%)",
                            backgroundSize: "100% 100%",
                        }}
                    />
                    <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
                        <Reveal className="text-center mb-12 space-y-4">
                            <span className="lux-section-label">Pertanyaan Umum</span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-forest" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Ada yang Ingin Anda Tanyakan?
                            </h2>
                        </Reveal>
                        <div className="space-y-3">
                            {faqs.map((faq, idx) => (
                                <Reveal key={faq.id || idx} delay={idx * 0.05}>
                                    <div className="lux-card p-5">
                                        <h3 className="font-bold text-forest text-sm mb-2">{faq.question}</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">{faq.answer}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── CONTACT ── */}
            <CTASection />

            {/* ── ROOM DETAIL MODAL ── */}
            {showRoomDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(26,61,43,0.4)] backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl relative my-6" style={{ animation: 'modalIn 0.3s ease' }}>
                        <div className="px-6 py-5 bg-gradient-to-r from-[rgba(201,168,76,0.05)] to-white border-b border-[rgba(201,168,76,0.1)] flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-xl text-forest" style={{ fontFamily: "'Outfit', sans-serif" }}>Kamar {showRoomDetail.room_number}</h3>
                                <span className="text-gold text-[10px] font-bold tracking-wider uppercase bg-[rgba(201,168,76,0.1)] px-2.5 py-1 rounded-full mt-1.5 inline-block border border-[rgba(201,168,76,0.2)]">
                                    {showRoomDetail.branch?.name?.replace('Kospart PH 18 - ', '')}
                                </span>
                            </div>
                            <button aria-label="Action Button"  onClick={() => setShowRoomDetail(null)} className="text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-full p-2.5 transition-all hover:rotate-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
                            <div className="space-y-3">
                                <div className="relative h-60 rounded-xl overflow-hidden bg-slate-100 group">
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
                                        <button aria-label="Action Button"  key={idx} onClick={() => setActiveGalleryIndex(idx)} className={`w-16 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition-all relative ${activeGalleryIndex === idx ? 'border-[#c9a84c] scale-105' : 'border-slate-200 opacity-60 hover:opacity-100'}`}>
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
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi</h4>
                                <p className="text-slate-600 text-sm leading-relaxed">{showRoomDetail.description}</p>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Fasilitas Kamar</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {showRoomDetail.facilities && JSON.parse(JSON.stringify(showRoomDetail.facilities)).map((fac, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-[rgba(45,106,79,0.05)] border border-[rgba(45,106,79,0.1)] text-xs">
                                            <span className="lux-dot" style={{ width: 6, height: 6 }}></span>
                                            <span className="font-semibold text-forest">{fac}</span>
                                        </div>
                                    ))}
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
                    <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative my-6" style={{ animation: 'modalIn 0.3s ease' }}>
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
                                {bookingError && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs font-semibold flex items-start gap-3 mb-2 animate-[modalIn_0.3s_ease]">
                                        <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                        <span className="leading-relaxed">{bookingError}</span>
                                    </div>
                                )}
                                {[
                                    { label: 'Nama Lengkap', key: 'name', type: 'text', placeholder: 'Dani Trisna' },
                                    { label: 'Email', key: 'email', type: 'email', placeholder: 'dani@gmail.com' },
                                    { label: 'No. WhatsApp', key: 'phone', type: 'text', placeholder: '085712345678' },
                                ].map(f => (
                                    <div key={f.key} className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{f.label}</label>
                                        <input type={f.type} required value={bookingForm[f.key]} onChange={(e) => setBookingForm({ ...bookingForm, [f.key]: e.target.value })} className="lux-input px-4 py-2.5 w-full" placeholder={f.placeholder} />
                                    </div>
                                ))}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">NIK (16 Digit)</label>
                                    <input type="text" required maxLength="16" minLength="16" pattern="\d{16}" value={bookingForm.nik} onChange={(e) => setBookingForm({...bookingForm, nik: e.target.value.replace(/\D/g, '')})} className="lux-input px-4 py-2.5 w-full tracking-widest" placeholder="16 Digit NIK Anda" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Foto KTP</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input type="file" required accept="image/*" onChange={(e) => setBookingForm({...bookingForm, ktp_photo: e.target.files[0]})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <div className="lux-input px-4 py-2.5 text-xs w-full flex items-center justify-center gap-2 font-semibold cursor-pointer">
                                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                <span className="truncate">{bookingForm.ktp_photo ? bookingForm.ktp_photo.name : 'Pilih dari Galeri'}</span>
                                            </div>
                                        </div>
                                        <div className="relative flex-1">
                                            <input type="file" accept="image/*" capture="environment" onChange={(e) => setBookingForm({...bookingForm, ktp_photo: e.target.files[0]})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <div className="bg-[rgba(45,106,79,0.08)] border-[1.5px] border-[rgba(45,106,79,0.2)] rounded-xl px-4 py-2.5 text-xs w-full flex items-center justify-center gap-2 font-semibold text-[#2d6a4f] cursor-pointer">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                Kamera
                                            </div>
                                        </div>
                                    </div>
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
                                        }} className="lux-select px-4 py-2.5 w-full">
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
                                        }} className="lux-input px-4 py-2.5 w-full text-center" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Selesai Sewa</label>
                                    <input type="date" required value={bookingForm.end_date} onChange={(e) => setBookingForm({ ...bookingForm, end_date: e.target.value })} className="lux-input px-4 py-2.5 w-full text-center" />
                                </div>
                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-[rgba(201,168,76,0.2)]">
                                    <div className="relative flex items-center justify-center mt-0.5">
                                        <input type="checkbox" required checked={bookingForm.agree_tnc} onChange={(e) => setBookingForm({...bookingForm, agree_tnc: e.target.checked})} className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-[#2d6a4f] checked:border-[#2d6a4f] transition-all cursor-pointer" />
                                        <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <span className="text-xs text-slate-500 leading-relaxed">Saya setuju dengan <a href="/Syarat_dan_Ketentuan_Kospart_PH_18.pdf" target="_blank" rel="noopener noreferrer" className="text-[#2d6a4f] font-bold underline hover:text-emerald-700">Syarat & Ketentuan</a> dan peraturan Kospart PH 18.</span>
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
                                                if (bookingForm.rental_type === 'daily') { total = diffDays * parseFloat(selectedRoom.price_daily); }
                                                else if (bookingForm.rental_type === 'weekly') { total = Math.max(1, Math.floor(diffDays / 7)) * selectedRoom.price_weekly; }
                                                else if (bookingForm.rental_type === 'monthly') {
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
                            <div className="p-8 flex flex-col items-center justify-center animate-[modalIn_0.3s_ease]">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm mb-6">
                                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                </div>
                                <div className="text-center space-y-2 mb-8">
                                    <h3 className="font-extrabold text-2xl text-slate-800 tracking-tight">Verifikasi OTP</h3>
                                    <p className="text-sm text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                                        Kami telah mengirimkan 6 digit kode OTP ke nomor WhatsApp <strong className="text-slate-700">{bookingForm.phone}</strong>.
                                    </p>
                                </div>
                                
                                <form onSubmit={handleVerifyOtp} className="w-full max-w-sm space-y-8">
                                    <div className="space-y-2 text-center">
                                        <div className="flex justify-center gap-2" onPaste={(e) => {
                                            e.preventDefault();
                                            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                                            setOtpCodeInput(pastedData);
                                            if (pastedData.length === 6) {
                                                document.getElementById('otp-welcome-5')?.focus();
                                            }
                                        }}>
                                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                                <input
                                                    key={index}
                                                    id={`otp-welcome-${index}`}
                                                    type="text"
                                                    maxLength="1"
                                                    required={index === 0 && otpCodeInput.length < 6}
                                                    value={otpCodeInput[index] || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        let newOtp = otpCodeInput.split('');
                                                        newOtp[index] = val;
                                                        setOtpCodeInput(newOtp.join(''));
                                                        if (val && index < 5) document.getElementById(`otp-welcome-${index + 1}`)?.focus();
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Backspace' && !otpCodeInput[index] && index > 0) {
                                                            document.getElementById(`otp-welcome-${index - 1}`)?.focus();
                                                        }
                                                    }}
                                                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-slate-200 bg-slate-50 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none text-emerald-800"
                                                />
                                            ))}
                                        </div>
                                        {otpError && (
                                            <div className="text-rose-500 text-xs font-bold mt-2 flex items-center justify-center gap-1.5 animate-[modalIn_0.2s_ease]">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                {otpError}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button aria-label="Action Button" type="button" onClick={() => setBookingStep('booking')} className="flex-1 py-3.5 bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all shadow-sm">
                                            Kembali
                                        </button>
                                        <button aria-label="Action Button" type="submit" className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-500/20">
                                            Verifikasi OTP
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {bookingStep === 'payment_proof' && (
                            <form onSubmit={handleUploadPayment} className="p-6 space-y-4">
                                <div className="bg-[rgba(45,106,79,0.06)] p-4 rounded-xl border border-[rgba(45,106,79,0.15)] text-xs text-[#1a3d2b] leading-relaxed">
                                    <h4 className="font-bold mb-2 text-sm border-b border-[rgba(45,106,79,0.15)] pb-2">Informasi Pembayaran</h4>
                                    <p className="mb-2">Total: <strong className="text-[#2d6a4f]">Rp {bookingResponse?.booking?.total_amount ? parseFloat(bookingResponse.booking.total_amount).toLocaleString('id-ID') : '-'}</strong></p>
                                    <p>Transfer ke rekening:</p>
                                    <ul className="list-disc pl-5 mt-1 mb-2 space-y-1 font-bold"><li>BCA: 8447060961 a.n PRAYOGA HERIYANTO</li></ul>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah Transfer (Rp)</label>
                                    <input type="number" required value={paidAmountInput} onChange={(e) => setPaidAmountInput(e.target.value)} className="lux-input px-4 py-2.5 w-full" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bukti Pembayaran</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input type="file" required accept="image/*,application/pdf" onChange={(e) => setPaymentProofInput(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <div className="bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-xs w-full flex flex-col items-center justify-center gap-1.5 font-semibold text-slate-600 cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all text-center h-full">
                                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                <span className="truncate w-full block px-1 leading-snug">{paymentProofInput ? paymentProofInput.name : 'Pilih File / Galeri'}</span>
                                            </div>
                                        </div>
                                        <div className="relative flex-1">
                                            <input type="file" accept="image/*" capture="environment" onChange={(e) => setPaymentProofInput(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-xl px-4 py-3 text-xs w-full flex flex-col items-center justify-center gap-1.5 font-semibold text-emerald-700 cursor-pointer hover:bg-emerald-100 transition-all text-center h-full">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                <span>Ambil Foto</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 block text-center mt-1.5 font-medium">Format: JPG, PNG, PDF (Maks. 2MB)</span>
                                </div>
                                <div className="flex gap-3">
                                    <button aria-label="Action Button"  type="button" onClick={() => setBookingStep('otp')} className="flex-1 py-3 lux-btn-outline text-xs font-bold">Kembali</button>
                                    <button aria-label="Action Button"  type="submit" className="flex-1 py-3 lux-btn-primary text-xs font-bold">Kirim Pembayaran</button>
                                </div>
                            </form>
                        )}

                        {bookingStep === 'success' && (
                            <div className="p-6 text-center space-y-5">
                                <div className="w-16 h-16 bg-[rgba(45,106,79,0.1)] rounded-full flex items-center justify-center mx-auto" style={{ animation: 'scaleIn 0.4s ease' }}>
                                    <svg className="w-8 h-8 text-[#2d6a4f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-xl text-forest" style={{ fontFamily: "'Outfit', sans-serif" }}>Pembayaran Diterima!</h3>
                                    <p className="text-slate-500 text-sm mt-1">{successMessage || 'Selamat datang di Kospart PH 18!'}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl text-left border border-[rgba(201,168,76,0.15)] space-y-1.5 font-mono text-xs text-slate-600">
                                    <div><span className="text-slate-500">KODE:</span> {bookingResponse?.booking_code}</div>
                                    <div><span className="text-slate-500">KAMAR:</span> {selectedRoom.room_number}</div>
                                    <div><span className="text-slate-500">MASA:</span> {bookingForm.start_date} s.d {bookingForm.end_date}</div>
                                </div>
                                <button aria-label="Action Button"  onClick={resetBookingModal} className="w-full py-3 lux-btn-primary text-sm font-bold">Selesai</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

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



