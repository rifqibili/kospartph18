import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';

// ── CSRF-aware fetch helper ──────────────────────────────────────────────────
function getCsrfToken() {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}
async function authFetch(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-XSRF-TOKEN': getCsrfToken(),
            ...(options.headers || {}),
        },
    });
}
// ────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const { auth } = usePage().props;
    
    // Multi-role simulation state (initialized with user's actual role)
    const [currentRole, setCurrentRole] = useState(auth.user.role || 'super_admin');
    
    // Navigation inside Dashboard: 'overview' | 'branches' | 'rooms' | 'bookings' | 'finances' | 'complaints'
    const [activeTab, setActiveTab] = useState('overview');

    // Data states
    const [stats, setStats] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [branches, setBranches] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [finances, setFinances] = useState([]);
    const [complaints, setComplaints] = useState([]);
    
    // Modal & Action states
    const [showInvoiceModal, setShowInvoiceModal] = useState(null);
    const [showChangeRoomModal, setShowChangeRoomModal] = useState(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(null);
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    // Payment modal for tenant
    const [showPaymentModal, setShowPaymentModal] = useState(null);
    const [paymentData, setPaymentData] = useState({ paid_amount: '', payment_proof: 'BUKTI_BAYAR_SIMULASI' });
    const [showVerifyPaymentModal, setShowVerifyPaymentModal] = useState(null);
    
    // Form Inputs
    const [newBranch, setNewBranch] = useState({ name: '', address: '', maps_link: '', status: 'active' });
    const [newRoom, setNewRoom] = useState({ branch_id: '', room_number: '', price_monthly: '', price_daily: '', status: 'available', facilities: '', description: '' });
    const [newFinance, setNewFinance] = useState({ transaction_type: 'expense', amount: '', category: 'maintenance', transaction_date: new Date().toISOString().split('T')[0], description: '' });
    const [newComplaint, setNewComplaint] = useState({ room_id: '', title: '', description: '' });
    const [complaintResponse, setComplaintResponse] = useState({ id: null, status: 'processing', admin_response: '' });
    const [rescheduleData, setRescheduleData] = useState({ start_date: '', end_date: '' });
    const [newRoomIdInput, setNewRoomIdInput] = useState('');

    // Toast/Alert triggers
    const [toasts, setToasts] = useState([]);

    // Chart ref
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Dynamic alert sound using Web Audio API (No files required!)
    const playNotificationSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            // Nice synthesized notifications sound (ping-pong sound)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
            
            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
                gain2.gain.setValueAtTime(0.1, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                osc2.start(ctx.currentTime);
                osc2.stop(ctx.currentTime + 0.5);
            }, 120);
        } catch (e) {
            console.error('AudioContext not supported or blocked', e);
        }
    };

    // Trigger dummy/simulation notifications (real-time popups)
    const triggerSimulationNotification = (type) => {
        playNotificationSound();
        let toast = {};
        if (type === 'unpaid') {
            toast = {
                id: Date.now(),
                title: 'Tagihan UNPAID Terdeteksi (Real-Time)',
                message: 'Tagihan sewa bulanan Kamar 201 (Rian Aditya) belum lunas dari bulan sebelumnya. (Notif Pop-up UNPAID)',
                color: 'border-red-200 text-red-800 bg-red-50 shadow-lg'
            };
        } else if (type === 'expiry') {
            toast = {
                id: Date.now(),
                title: 'Penyewaan Berakhir H-3 (Real-Time)',
                message: 'Penyewaan Harian Kamar 102 (Dani Trisna) akan berakhir dalam 3 hari. Segera tindaklanjuti.',
                color: 'border-amber-200 text-amber-800 bg-amber-50 shadow-lg'
            };
        } else if (type === 'payment') {
            toast = {
                id: Date.now(),
                title: 'Pembayaran Masuk Real-Time',
                message: 'Penghuni Dani Trisna baru saja mengunggah bukti bayar Rp 300.000 untuk Kamar 102. (WhatsApp Notif terkirim ke Owner)',
                color: 'border-emerald-200 text-emerald-800 bg-emerald-50 shadow-lg'
            };
        } else if (type === 'complaint') {
            toast = {
                id: Date.now(),
                title: 'Komplain Baru Masuk (Real-Time)',
                message: 'Kamar 101 - Dani Trisna mengajukan aduan: "Kran Air Kamar Mandi Bocor". (Badge menu ter-update)',
                color: 'border-blue-200 text-blue-800 bg-blue-50 shadow-lg'
            };
        }
        setToasts(prev => [toast, ...prev].slice(0, 3)); // keep max 3 toasts
    };

    // Load DB Data (parallel fetches)
    const loadAllData = async () => {
        try {
            const [statsRes, branchesRes, roomsRes, bookingsRes, complaintsRes] = await Promise.all([
                fetch('/api/dashboard/data'),
                fetch('/api/branches'),
                fetch('/api/rooms'),
                fetch('/api/bookings'),
                fetch('/api/complaints'),
            ]);
            const statsData      = await statsRes.json();
            const branchesData   = await branchesRes.json();
            const roomsData      = await roomsRes.json();
            const bookingsData   = await bookingsRes.json();
            const complaintsData = await complaintsRes.json();

            setStats(statsData.stats || {});
            setNotifications(statsData.notifications || []);
            setRecentBookings(statsData.recentBookings || []);
            setBranches(Array.isArray(branchesData) ? branchesData : []);
            setRooms(Array.isArray(roomsData) ? roomsData : []);
            setBookings(Array.isArray(bookingsData) ? bookingsData : []);
            setComplaints(Array.isArray(complaintsData) ? complaintsData : []);

            const financesRes  = await fetch('/api/finances');
            const financesData = await financesRes.json();
            setFinances(Array.isArray(financesData) ? financesData : []);
        } catch (err) {
            console.error('Error loading data', err);
        }
    };

    // Background polling for notifications every 60s
    const loadNotificationsOnly = async () => {
        try {
            const res  = await fetch('/api/dashboard/data');
            const data = await res.json();
            setStats(data.stats || {});
            setNotifications(data.notifications || []);
        } catch (_) { /* silent */ }
    };

    useEffect(() => { loadAllData(); }, [currentRole]);

    useEffect(() => {
        const interval = setInterval(loadNotificationsOnly, 60000);
        return () => clearInterval(interval);
    }, []);

    // Initialize Chart.js
    const initChart = async () => {
        try {
            const chartDataRes = await fetch('/api/finances/chart');
            const chartData = await chartDataRes.json();

            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            if (chartRef.current) {
                const ctx = chartRef.current.getContext('2d');
                chartInstance.current = new window.Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: chartData.map(d => d.name),
                        datasets: [
                            {
                                label: 'Pemasukan',
                                data: chartData.map(d => d.Income),
                                backgroundColor: '#198754',
                                borderRadius: 6,
                            },
                            {
                                label: 'Pengeluaran',
                                data: chartData.map(d => d.Expense),
                                backgroundColor: '#ef4444',
                                borderRadius: 6,
                            },
                            {
                                label: 'Laba Bersih',
                                type: 'line',
                                data: chartData.map(d => d.Profit),
                                borderColor: '#ffc107',
                                borderWidth: 3,
                                fill: false,
                                tension: 0.3,
                                pointBackgroundColor: '#ffc107'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                labels: { color: '#94a3b8', font: { family: 'Inter', weight: 'bold' } }
                            }
                        },
                        scales: {
                            y: {
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: { color: '#94a3b8' }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: '#94a3b8' }
                            }
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Error drawing chart', err);
        }
    };

    // Draw Chart when activeTab is overview or finances and Chart.js is loaded
    useEffect(() => {
        if (activeTab === 'overview' || activeTab === 'finances') {
            if (!window.Chart) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
                script.async = true;
                script.onload = () => initChart();
                document.body.appendChild(script);
            } else {
                initChart();
            }
        }
    }, [activeTab, finances]);

    // ── Toast helper ─────────────────────────────────────────────────────────
    const showToast = (message, type = 'success') => {
        const colorMap = {
            success: 'border-emerald-200 text-emerald-800 bg-emerald-50 shadow-lg',
            error:   'border-red-200 text-red-800 bg-red-50 shadow-lg',
        };
        const icon = type === 'success' ? '✅' : '❌';
        setToasts(prev => [{ id: Date.now(), title: `${icon} ${type === 'success' ? 'Berhasil' : 'Gagal'}`, message, color: colorMap[type] }, ...prev].slice(0, 3));
    };

    // Handle Forms
    const handleAddBranch = async (e) => {
        e.preventDefault();
        const res = await authFetch('/api/branches', { method: 'POST', body: JSON.stringify(newBranch) });
        if (res.ok) {
            setNewBranch({ name: '', address: '', maps_link: '', status: 'active' });
            loadAllData();
            showToast('Cabang berhasil ditambahkan!');
        } else { const d = await res.json(); showToast(d.message || 'Gagal menambah cabang.', 'error'); }
    };

    const handleAddRoom = async (e) => {
        e.preventDefault();
        const res = await authFetch('/api/rooms', { method: 'POST', body: JSON.stringify({ ...newRoom, facilities: newRoom.facilities.split(',').map(f => f.trim()) }) });
        if (res.ok) {
            setNewRoom({ branch_id: '', room_number: '', price_monthly: '', price_daily: '', status: 'available', facilities: '', description: '' });
            loadAllData();
            showToast('Kamar berhasil ditambahkan!');
        } else { const d = await res.json(); showToast(d.message || 'Gagal menambah kamar.', 'error'); }
    };

    const handleAddFinance = async (e) => {
        e.preventDefault();
        const res = await authFetch('/api/finances', { method: 'POST', body: JSON.stringify(newFinance) });
        if (res.ok) {
            setNewFinance({ transaction_type: 'expense', amount: '', category: 'maintenance', transaction_date: new Date().toISOString().split('T')[0], description: '' });
            loadAllData();
            showToast('Transaksi kas berhasil dicatat!');
        } else { const d = await res.json(); showToast(d.message || 'Gagal mencatat transaksi.', 'error'); }
    };

    const handleAddComplaint = async (e) => {
        e.preventDefault();
        const res = await authFetch('/api/complaints', { method: 'POST', body: JSON.stringify(newComplaint) });
        if (res.ok) {
            setNewComplaint({ room_id: '', title: '', description: '' });
            loadAllData();
            showToast('Komplain berhasil diajukan! Pengelola akan segera menindaklanjuti.');
        } else { const d = await res.json(); showToast(d.message || 'Pastikan Anda memiliki booking aktif.', 'error'); }
    };

    const handleUpdateComplaintStatus = async (e) => {
        e.preventDefault();
        const res = await authFetch(`/api/complaints/${complaintResponse.id}/status`, {
            method: 'POST',
            body: JSON.stringify({ status: complaintResponse.status, admin_response: complaintResponse.admin_response, repair_photo: 'repair_done.png' })
        });
        if (res.ok) {
            setComplaintResponse({ id: null, status: 'processing', admin_response: '' });
            loadAllData();
            showToast('Status komplain berhasil diperbarui!');
        } else { const d = await res.json(); showToast(d.message || 'Gagal memperbarui status.', 'error'); }
    };

    // Tenant payment from dashboard
    const handleTenantPayment = async (e) => {
        e.preventDefault();
        if (!showPaymentModal) return;
        const res  = await authFetch(`/api/bookings/${showPaymentModal.id}/pay`, { method: 'POST', body: JSON.stringify(paymentData) });
        const data = await res.json();
        if (res.ok) {
            setShowPaymentModal(null);
            setPaymentData({ paid_amount: '', payment_proof: 'BUKTI_BAYAR_SIMULASI' });
            loadAllData();
            showToast(data.message);
        } else { showToast(data.message || 'Gagal memproses pembayaran.', 'error'); }
    };

    const handleVerifyPayment = async (id) => {
        const res = await authFetch(`/api/bookings/${id}/verify-payment`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            setShowVerifyPaymentModal(null);
            loadAllData();
            showToast(data.message);
        } else { showToast(data.message || 'Gagal verifikasi pembayaran.', 'error'); }
    };

    const handleRejectPayment = async (id) => {
        if (!confirm('Tolak pembayaran ini? Tenant akan diminta untuk mengupload ulang bukti pembayaran.')) return;
        const res = await authFetch(`/api/bookings/${id}/reject-payment`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            setShowVerifyPaymentModal(null);
            loadAllData();
            showToast(data.message);
        } else { showToast(data.message || 'Gagal menolak pembayaran.', 'error'); }
    };

    const handleApproveBooking = async (id) => {
        if (!confirm('Aktifkan penyewaan ini?')) return;
        const res = await authFetch(`/api/bookings/${id}/approve`, { method: 'POST' });
        if (res.ok) { loadAllData(); showToast('Penyewaan disetujui & Kamar aktif ditempati.'); }
        else { const d = await res.json(); showToast(d.message || 'Gagal approve.', 'error'); }
    };

    const handleCheckoutBooking = async (id) => {
        if (!confirm('Apakah penghuni akan checkout dan mengosongkan kamar?')) return;
        const res = await authFetch(`/api/bookings/${id}/checkout`, { method: 'POST' });
        if (res.ok) { loadAllData(); showToast('Proses checkout selesai. Kamar kembali tersedia.'); }
        else { const d = await res.json(); showToast(d.message || 'Gagal checkout.', 'error'); }
    };

    const handleChangeRoom = async (e) => {
        e.preventDefault();
        const res = await authFetch(`/api/bookings/${showChangeRoomModal.id}/change-room`, { method: 'POST', body: JSON.stringify({ new_room_id: newRoomIdInput }) });
        const data = await res.json();
        if (res.ok) { setShowChangeRoomModal(null); setNewRoomIdInput(''); loadAllData(); showToast(data.message); }
        else { showToast(data.message || 'Gagal pindah kamar.', 'error'); }
    };

    const handleRescheduleBill = async (e) => {
        e.preventDefault();
        const res = await authFetch(`/api/bookings/${showRescheduleModal.id}/reschedule-bill`, { method: 'POST', body: JSON.stringify(rescheduleData) });
        const data = await res.json();
        if (res.ok) { setShowRescheduleModal(null); setRescheduleData({ start_date: '', end_date: '' }); loadAllData(); showToast(data.message); }
        else { showToast(data.message || 'Gagal reschedule.', 'error'); }
    };

    // Operator branches: real for actual operator, first branch when simulating
    const operatorBranches = auth.user.role === 'operator'
        ? (auth.user.assigned_branches || [])
        : currentRole === 'operator'
            ? branches.slice(0, 1).map(b => b.id)
            : [];

    // Helper to get simulated resident ID
    const getSimulatedResidentId = () => {
        if (auth.user.role === 'resident') return auth.user.id;
        const firstResidentBooking = bookings.find(b => b.tenant_id && b.tenant);
        return firstResidentBooking ? firstResidentBooking.tenant_id : auth.user.id;
    };

    // Use optional chaining to prevent crashes when related data not yet loaded
    const visibleRooms = rooms.filter(r => {
        if (currentRole === 'operator') return operatorBranches.includes(r.branch_id);
        if (currentRole === 'resident') {
            const resId = getSimulatedResidentId();
            return bookings.some(b => b.room_id === r.id && b.tenant_id === resId && b.status === 'active');
        }
        return true;
    });

    const visibleBookings = bookings.filter(b => {
        if (currentRole === 'operator') return operatorBranches.includes(b.room?.branch_id);
        if (currentRole === 'resident') return b.tenant_id === getSimulatedResidentId();
        return true;
    });

    const visibleComplaints = complaints.filter(c => {
        if (currentRole === 'operator') return operatorBranches.includes(c.room?.branch_id);
        if (currentRole === 'resident') return c.tenant_id === getSimulatedResidentId();
        return true;
    });

    const getSimulatedResidentName = () => {
        if (auth.user.role === 'resident') return auth.user.name;
        const resId = getSimulatedResidentId();
        return bookings.find(b => b.tenant_id === resId)?.tenant?.name || auth.user.name;
    };

    const visibleNotifications = notifications.filter(notif => {
        if (currentRole === 'operator') {
            if (['unpaid_bill', 'rental_expiry', 'daily_checkout_today'].includes(notif.type)) {
                const booking = bookings.find(b => b.booking_code === notif.meta?.booking_code);
                return booking && operatorBranches.includes(booking.room?.branch_id);
            }
            if (notif.type === 'new_complaint') {
                const complaint = complaints.find(c => c.id === notif.meta?.complaint_id);
                return complaint && operatorBranches.includes(complaint.room?.branch_id);
            }
            return false;
        }
        if (currentRole === 'resident') {
            const resId = getSimulatedResidentId();
            if (notif.meta?.booking_code) {
                return bookings.find(b => b.booking_code === notif.meta.booking_code)?.tenant_id === resId;
            }
            if (notif.meta?.complaint_id !== undefined) {
                return complaints.find(c => c.id === notif.meta.complaint_id)?.tenant_id === resId;
            }
            return false;
        }
        return true;
    });

    const pendingComplaintsBadgeCount = visibleComplaints.filter(c => c.status === 'pending').length;
    const urgentNotifCount = visibleNotifications.filter(n => ['unpaid_bill', 'rental_expiry', 'daily_checkout_today'].includes(n.type)).length;

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans">
            <Head title="Admin Dashboard - Kospart PH 18" />

            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
                {/* Logo */}
                <div className="h-20 px-6 border-b border-slate-200 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-gradient rounded-lg flex items-center justify-center border border-emerald-500/20">
                        <span className="text-white font-extrabold text-lg">KP</span>
                    </div>
                    <div>
                        <span className="font-extrabold text-lg tracking-tight text-slate-900 block">KOSPART</span>
                        <span className="text-emerald-605 text-[10px] font-bold uppercase tracking-widest block -mt-1">ADMIN PANEL</span>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className="p-4 flex-grow space-y-1">
                    <button 
                        onClick={() => setActiveTab('overview')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === 'overview' ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"></path></svg>
                        Ringkasan
                    </button>

                    {currentRole === 'super_admin' && (
                        <button 
                            onClick={() => setActiveTab('branches')} 
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === 'branches' ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                            Master Cabang
                        </button>
                    )}

                    {['super_admin', 'operator'].includes(currentRole) && (
                        <button 
                            onClick={() => setActiveTab('rooms')} 
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === 'rooms' ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
                            Master Kamar
                        </button>
                    )}

                    <button 
                        onClick={() => setActiveTab('bookings')} 
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === 'bookings' ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                        {currentRole === 'resident' ? 'Riwayat Pembayaran' : 'Penyewaan / Sewa'}
                    </button>

                    <button 
                        onClick={() => setActiveTab('complaints')} 
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === 'complaints' ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            {currentRole === 'resident' ? 'Komplain Saya' : 'Komplain & Aduan'}
                        </div>
                        {pendingComplaintsBadgeCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                {pendingComplaintsBadgeCount}
                            </span>
                        )}
                    </button>

                    {['super_admin', 'operator'].includes(currentRole) && (
                        <button 
                            onClick={() => setActiveTab('finances')} 
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === 'finances' ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Laporan Keuangan
                        </button>
                    )}
                </nav>

                {/* Footer / User Profile info */}
                <div className="p-4 border-t border-slate-200 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                            {auth.user.name.charAt(0)}
                        </div>
                        <div>
                            <span className="font-semibold text-sm block truncate text-slate-800">{auth.user.name}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{auth.user.email}</span>
                            <span className="inline-block px-1.5 py-0.5 mt-1 bg-slate-100 text-slate-600 border border-slate-200 text-[9px] rounded font-bold uppercase tracking-wider">
                                {currentRole === 'super_admin' ? 'Admin' : currentRole === 'operator' ? 'Operator' : 'Tenant'}
                            </span>
                        </div>
                    </div>
                    
                    <Link 
                        href="/logout" 
                        method="post" 
                        as="button" 
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-xs font-semibold transition-colors"
                    >
                        Sign Out
                    </Link>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-grow flex flex-col min-w-0">
                {/* Dashboard Top Header */}
                <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm">
                    <div>
                        <h2 className="font-extrabold text-2xl text-slate-900">
                            {activeTab === 'overview' ? 'Ringkasan Dashboard' : 
                             activeTab === 'branches' ? 'Master Cabang Kos' :
                             activeTab === 'rooms' ? 'Master Kamar Kos' :
                             activeTab === 'bookings' ? (currentRole === 'resident' ? 'Riwayat Pembayaran' : 'Log Transaksi Penyewaan') :
                             activeTab === 'complaints' ? 'Pengaduan Komplain & Perbaikan' : 'Laporan Keuangan'}
                        </h2>
                    </div>

                    {/* Role Switcher for Simulation (Only visible to real super_admin) */}
                    {auth.user.role === 'super_admin' && (
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs">
                                <span className="text-slate-500 font-semibold">Simulasi Role:</span>
                                <div className="flex gap-1">
                                    {['super_admin', 'operator', 'resident'].map(role => (
                                        <button 
                                            key={role}
                                            onClick={() => {
                                                setCurrentRole(role);
                                                setActiveTab('overview');
                                            }}
                                            className={`px-2.5 py-1 rounded-md font-bold uppercase transition-all ${
                                                currentRole === role ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            {role === 'super_admin' ? 'Admin' : role === 'operator' ? 'Operator' : 'Tenant'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Real-time Simulator buttons */}
                            {['super_admin', 'operator'].includes(currentRole) && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => triggerSimulationNotification('unpaid')}
                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-all"
                                        title="Notifikasi tagihan bulanan tidak lunas"
                                    >
                                        Unpaid Notif
                                    </button>
                                    <button 
                                        onClick={() => triggerSimulationNotification('expiry')}
                                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl border border-amber-200 transition-all"
                                        title="Notifikasi sewa berakhir H-3"
                                    >
                                        Expiry Notif
                                    </button>
                                    <button 
                                        onClick={() => triggerSimulationNotification('payment')}
                                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-all"
                                        title="Notifikasi pembayaran masuk dari tenant"
                                    >
                                        Payment Notif
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </header>

                {/* Toast Notification Container */}
                <div className="fixed top-24 right-8 z-50 flex flex-col gap-3 max-w-sm">
                    {toasts.map(toast => (
                        <div key={toast.id} className={`p-4 rounded-xl border shadow-xl flex gap-3 animate-float ${toast.color}`}>
                            <div className="shrink-0 mt-0.5">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                            </div>
                            <div>
                                <h4 className="font-extrabold text-xs uppercase tracking-wider">{toast.title}</h4>
                                <p className="text-slate-650 text-[11px] mt-1 leading-relaxed font-medium">{toast.message}</p>
                                <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-[10px] text-slate-500 hover:text-slate-800 block mt-2 font-bold underline uppercase">Tutup</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dashboard Workspace */}
                <main className="flex-grow p-8 overflow-y-auto">
                    
                    {/* Ringkasan Dashboard (Tab: Overview) */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Summary Stats Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {currentRole === 'resident' ? (
                                    <>
                                        {/* Card 1: Kamar Saya */}
                                        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Kamar Saya</span>
                                                <span className="text-slate-900 font-extrabold text-2xl block mt-1">
                                                    {(() => {
                                                        const resId = getSimulatedResidentId();
                                                        const activeBooking = bookings.find(b => b.tenant_id === resId && b.status === 'active');
                                                        const booking = activeBooking || bookings.find(b => b.tenant_id === resId);
                                                        return booking ? `Kamar ${booking.room?.room_number || '-'}` : 'Belum Ada';
                                                    })()}
                                                </span>
                                                <span className="text-xs text-slate-400 block mt-1">
                                                    {(() => {
                                                        const resId = getSimulatedResidentId();
                                                        const activeBooking = bookings.find(b => b.tenant_id === resId && b.status === 'active');
                                                        const booking = activeBooking || bookings.find(b => b.tenant_id === resId);
                                                        return booking ? (booking.room?.branch?.name || '').replace('Kospart PH 18 - ', '') : 'Tidak ada hunian aktif';
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                            </div>
                                        </div>

                                        {/* Card 2: Status Hunian */}
                                        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Status Hunian</span>
                                                <span className="text-slate-900 font-extrabold text-2xl block mt-1 uppercase">
                                                    {(() => {
                                                        const resId = getSimulatedResidentId();
                                                        const activeBooking = bookings.find(b => b.tenant_id === resId && b.status === 'active');
                                                        const booking = activeBooking || bookings.find(b => b.tenant_id === resId);
                                                        return booking ? (booking.status === 'active' ? 'Aktif' : booking.status === 'pending' ? 'Pending' : 'Selesai') : 'Tidak Aktif';
                                                    })()}
                                                </span>
                                                <span className="text-xs text-slate-400 block mt-1">
                                                    {(() => {
                                                        const resId = getSimulatedResidentId();
                                                        const activeBooking = bookings.find(b => b.tenant_id === resId && b.status === 'active');
                                                        const booking = activeBooking || bookings.find(b => b.tenant_id === resId);
                                                        return booking ? `Sewa ${booking.rental_type === 'daily' ? 'Harian' : 'Bulanan'}` : 'Hubungi pengelola';
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                            </div>
                                        </div>

                                        {/* Card 3: Biaya Sewa */}
                                        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Biaya Sewa</span>
                                                <span className="text-slate-900 font-extrabold text-2xl block mt-1">
                                                    {(() => {
                                                        const resId = getSimulatedResidentId();
                                                        const activeBooking = bookings.find(b => b.tenant_id === resId && b.status === 'active');
                                                        const booking = activeBooking || bookings.find(b => b.tenant_id === resId);
                                                        return booking ? `Rp ${parseFloat(booking.total_amount).toLocaleString('id-ID')}` : 'Rp 0';
                                                    })()}
                                                </span>
                                                <span className="text-xs font-bold block mt-1">
                                                    {(() => {
                                                        const resId = getSimulatedResidentId();
                                                        const activeBooking = bookings.find(b => b.tenant_id === resId && b.status === 'active');
                                                        const booking = activeBooking || bookings.find(b => b.tenant_id === resId);
                                                        if (!booking) return '-';
                                                        return (
                                                            <span className={booking.payment_status === 'paid' ? 'text-emerald-600' : 'text-red-500'}>
                                                                {booking.payment_status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
                                                            </span>
                                                        );
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                            </div>
                                        </div>

                                        {/* Card 4: Aduan Aktif */}
                                        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Aduan Aktif</span>
                                                <span className="text-slate-900 font-extrabold text-3xl block mt-1">
                                                    {visibleComplaints.filter(c => c.status !== 'completed').length}
                                                </span>
                                                <span className="text-xs text-slate-400 block mt-1">Aduan dalam proses</span>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-800">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Kamar Tersedia</span>
                                                <span className="text-slate-900 font-extrabold text-3xl block mt-1">{stats.availableRooms || 0} <span className="text-xs text-slate-400 font-normal">/ {stats.totalRooms || 0}</span></span>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            </div>
                                        </div>
                                        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Kamar Terisi</span>
                                                <span className="text-slate-900 font-extrabold text-3xl block mt-1">{stats.occupiedRooms || 0}</span>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-800">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                            </div>
                                        </div>
                                        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Pemasukan Bulan Ini</span>
                                                <span className="text-slate-900 font-extrabold text-xl block mt-1">Rp {(stats.incomeThisMonth || 0).toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-850">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            </div>
                                        </div>
                                        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Komplain Pending</span>
                                                <span className="text-slate-900 font-extrabold text-3xl block mt-1">{stats.pendingComplaints || 0}</span>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Charts & Notifications Row */}
                            <div className="grid lg:grid-cols-12 gap-8">
                                {/* Chart */}
                                {['super_admin', 'operator'].includes(currentRole) && (
                                    <div className="lg:col-span-8 glass-panel p-6 rounded-2xl flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-extrabold text-lg text-slate-900">Grafik Keuangan Laba Rugi</h3>
                                            <p className="text-xs text-slate-550">Menampilkan grafik pemasukan vs pengeluaran 6 bulan terakhir.</p>
                                        </div>
                                        <div className="h-72 mt-6 relative">
                                            <canvas ref={chartRef}></canvas>
                                        </div>
                                    </div>
                                )}

                                {/* Real-time Alerts Panel */}
                                <div className={`glass-panel p-6 rounded-2xl flex flex-col ${['super_admin', 'operator'].includes(currentRole) ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
                                    <div className="border-b border-slate-205 pb-4 mb-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-extrabold text-lg text-slate-900">Notifikasi Alert Real-Time</h3>
                                            <p className="text-xs text-slate-550">Pop-up notifikasi realtime pembayaran, jatuh tempo, & sewa harian.</p>
                                        </div>
                                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">Active</span>
                                    </div>
                                    <div className="flex-grow space-y-4 overflow-y-auto max-h-[300px] pr-1">
                                        {visibleNotifications.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                <span className="text-xs font-semibold">Tidak ada peringatan aktif</span>
                                            </div>
                                        ) : (
                                            visibleNotifications.map((notif, idx) => (
                                                <div key={idx} className={`p-3 rounded-xl border flex gap-3 text-xs leading-relaxed ${
                                                    notif.type === 'unpaid_bill' ? 'border-red-200 bg-red-50 text-red-805' :
                                                    notif.type === 'rental_expiry' ? 'border-amber-200 bg-amber-50 text-amber-805' :
                                                    notif.type === 'daily_checkout_today' ? 'border-emerald-200 bg-emerald-50 text-emerald-805' :
                                                    'border-blue-200 bg-blue-50 text-blue-805'
                                                }`}>
                                                    <div className="shrink-0 mt-0.5">
                                                        <span className="w-2 h-2 rounded-full bg-current block"></span>
                                                    </div>
                                                    <div>
                                                        <strong className="block font-bold">{notif.title}</strong>
                                                        <span className="mt-1 block text-slate-600 text-[11px] font-medium">{notif.message}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── RIWAYAT & PROGRESS khusus TENANT ── */}
                            {currentRole === 'resident' && (() => {
                                const resId = getSimulatedResidentId();
                                const myBookings = bookings.filter(b => b.tenant_id === resId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                                const activeBooking = myBookings.find(b => b.status === 'active') || myBookings.find(b => b.status === 'pending');
                                const myComplaints = visibleComplaints.filter(c => c.tenant_id === resId);
                                const paid  = parseFloat(activeBooking?.paid_amount || 0);
                                const total = parseFloat(activeBooking?.total_amount || 0);
                                const progressPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                                const today    = new Date();
                                const endDate  = activeBooking ? new Date(activeBooking.end_date) : null;
                                const sisaHari = endDate ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)) : null;

                                return (
                                    <div className="grid lg:grid-cols-12 gap-6 mt-2">

                                        {/* Progress Pembayaran + Detail Kamar */}
                                        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-extrabold text-base text-slate-800">📊 Progress Pembayaran</h3>
                                                {activeBooking && (
                                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                                        activeBooking.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                        activeBooking.payment_status === 'dp'   ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                        'bg-red-100 text-red-700 border-red-200'
                                                    }`}>
                                                        {activeBooking.payment_status === 'paid' ? 'LUNAS' : activeBooking.payment_status === 'dp' ? 'DP / Sebagian' : 'BELUM BAYAR'}
                                                    </span>
                                                )}
                                            </div>

                                            {activeBooking ? (
                                                <>
                                                    <div>
                                                        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                                                            <span>Dibayar: <strong className="text-emerald-600">Rp {paid.toLocaleString('id-ID')}</strong></span>
                                                            <span className="font-bold text-slate-700">{progressPct}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                            <div
                                                                className={`h-3 rounded-full transition-all duration-700 ${progressPct === 100 ? 'bg-emerald-500' : progressPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                style={{ width: `${progressPct}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                                            <span>Rp 0</span>
                                                            <span>Total: Rp {total.toLocaleString('id-ID')}</span>
                                                        </div>
                                                        {total - paid > 0 && (
                                                            <p className="text-xs text-red-500 font-semibold mt-2">
                                                                Sisa tagihan: <strong>Rp {(total - paid).toLocaleString('id-ID')}</strong>
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm">
                                                        <div className="flex justify-between"><span className="text-slate-500 text-xs">Kamar</span><span className="font-bold text-slate-800">No. {activeBooking.room?.room_number}</span></div>
                                                        <div className="flex justify-between"><span className="text-slate-500 text-xs">Cabang</span><span className="font-semibold text-slate-700 text-xs">{(activeBooking.room?.branch?.name || '').replace('Kospart PH 18 - ', '')}</span></div>
                                                        <div className="flex justify-between"><span className="text-slate-500 text-xs">Tipe Sewa</span><span className="font-semibold text-slate-700 text-xs">{activeBooking.rental_type === 'daily' ? 'Harian' : 'Bulanan'}</span></div>
                                                        <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500 text-xs">Check-in</span><span className="font-semibold text-slate-700 text-xs">{new Date(activeBooking.start_date).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}</span></div>
                                                        <div className="flex justify-between"><span className="text-slate-500 text-xs">Check-out</span><span className="font-semibold text-slate-700 text-xs">{new Date(activeBooking.end_date).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}</span></div>
                                                        {sisaHari !== null && (
                                                            <div className={`flex justify-between border-t border-slate-200 pt-2 text-xs font-bold ${sisaHari <= 3 ? 'text-red-600' : sisaHari <= 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                                <span>Sisa Masa Sewa</span>
                                                                <span>{sisaHari > 0 ? `${sisaHari} hari lagi` : sisaHari === 0 ? 'Berakhir hari ini!' : 'Sudah berakhir'}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {activeBooking.payment_status !== 'paid' && (
                                                            parseFloat(activeBooking.unverified_amount) > 0 ? (
                                                                <button
                                                                    disabled
                                                                    className="w-full py-2.5 bg-slate-100 text-slate-500 font-bold rounded-xl text-sm border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed"
                                                                >
                                                                    ⏳ Menunggu Verifikasi
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => { setShowPaymentModal(activeBooking); setPaymentData({ paid_amount: String(Math.max(0, total - paid)), payment_proof: 'BUKTI_BAYAR_SIMULASI' }); }}
                                                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                                    Bayar
                                                                </button>
                                                            )
                                                        )}
                                                        <button onClick={() => setShowInvoiceModal(activeBooking)} className="w-full py-2.5 bg-white text-slate-700 font-bold rounded-xl text-sm border border-slate-200 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center">
                                                            Cetak Invoice
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-8 text-slate-400">
                                                    <div className="text-4xl mb-2">🏠</div>
                                                    <p className="text-sm font-semibold">Belum ada hunian aktif</p>
                                                    <p className="text-xs mt-1">Hubungi pengelola untuk proses booking</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Riwayat Pembayaran */}
                                        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <h3 className="font-extrabold text-base text-slate-800 mb-4">💳 Riwayat Pembayaran</h3>
                                            {(() => {
                                                const myFinances = finances.filter(f => f.booking?.tenant_id === resId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                                                return myFinances.length === 0 ? (
                                                    <div className="text-center py-8 text-slate-400">
                                                        <div className="text-3xl mb-2">📭</div>
                                                        <p className="text-xs font-semibold">Belum ada riwayat pembayaran</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-0 overflow-y-auto max-h-64 pr-1">
                                                        {myFinances.map((f, idx) => {
                                                            const isIncome = f.transaction_type === 'income';
                                                            const isLast = idx === myFinances.length - 1;
                                                            return (
                                                                <div key={f.id} className="flex gap-3">
                                                                    <div className="flex flex-col items-center shrink-0">
                                                                        <div className={`w-3 h-3 rounded-full border-2 mt-1 shrink-0 ${isIncome ? 'bg-emerald-500 border-emerald-400 shadow shadow-emerald-200' : 'bg-red-500 border-red-400 shadow shadow-red-200'}`} />
                                                                        {!isLast && <div className="w-0.5 flex-grow bg-slate-200 my-1 min-h-[16px]" />}
                                                                    </div>
                                                                    <div className="pb-4 flex-grow min-w-0">
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div className="min-w-0">
                                                                                <p className="text-xs font-bold text-slate-800">Rp {parseFloat(f.amount).toLocaleString('id-ID')}</p>
                                                                                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{f.description}</p>
                                                                                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{new Date(f.transaction_date).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}</p>
                                                                            </div>
                                                                            <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                                {isIncome ? 'Sewa' : 'Pengeluaran'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                            <button onClick={() => setActiveTab('bookings')} className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-all">
                                                Ke Pembayaran →
                                            </button>
                                        </div>

                                        {/* Status Komplain */}
                                        <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-extrabold text-base text-slate-800">🔧 Komplain</h3>
                                                {myComplaints.filter(c => c.status !== 'completed').length > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                                        {myComplaints.filter(c => c.status !== 'completed').length}
                                                    </span>
                                                )}
                                            </div>
                                            {myComplaints.length === 0 ? (
                                                <div className="text-center py-6 text-slate-400">
                                                    <div className="text-3xl mb-2">✅</div>
                                                    <p className="text-xs font-semibold">Tidak ada aduan aktif</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 overflow-y-auto max-h-48">
                                                    {myComplaints.slice(0, 4).map(c => (
                                                        <div key={c.id} className="border border-slate-200 rounded-xl p-3 bg-white">
                                                            <div className="flex items-start justify-between gap-1 mb-1">
                                                                <p className="text-xs font-bold text-slate-800 leading-tight truncate flex-1">{c.title}</p>
                                                                <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                                                    c.status === 'pending'    ? 'bg-red-100 text-red-700' :
                                                                    c.status === 'confirmed'  ? 'bg-amber-100 text-amber-700' :
                                                                    c.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-emerald-100 text-emerald-700'
                                                                }`}>{c.status === 'pending' ? 'Pending' : c.status === 'confirmed' ? 'Konfirmasi' : c.status === 'processing' ? 'Proses' : 'Selesai'}</span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 truncate">{c.description}</p>
                                                            {c.admin_response && (
                                                                <div className="mt-1.5 bg-emerald-50 border border-emerald-100 rounded-lg p-1.5">
                                                                    <p className="text-[9px] text-emerald-700 font-bold">Respon Pengelola:</p>
                                                                    <p className="text-[9px] text-emerald-800 mt-0.5 leading-relaxed">{c.admin_response}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <button onClick={() => setActiveTab('complaints')} className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-sm">
                                                + Ajukan Komplain
                                            </button>
                                        </div>

                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Master Cabang (Tab: Branches) */}
                    {activeTab === 'branches' && currentRole === 'super_admin' && (
                        <div className="space-y-8">
                            {/* Form Tambah */}
                            <div className="glass-panel p-6 rounded-2xl">
                                <h3 className="font-extrabold text-lg text-slate-900 mb-4">Tambah Cabang Kos Baru</h3>
                                <form onSubmit={handleAddBranch} className="grid md:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Nama Cabang</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={newBranch.name} 
                                            onChange={(e) => setNewBranch({...newBranch, name: e.target.value})} 
                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                            placeholder="Kospart PH 18 - Executive"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Alamat Cabang</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={newBranch.address} 
                                            onChange={(e) => setNewBranch({...newBranch, address: e.target.value})} 
                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                            placeholder="Jl. PH H. Mustofa No. 20"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-505">Link Google Maps</label>
                                        <input 
                                            type="text" 
                                            value={newBranch.maps_link} 
                                            onChange={(e) => setNewBranch({...newBranch, maps_link: e.target.value})} 
                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                            placeholder="https://maps.app.goo.gl/..."
                                        />
                                    </div>
                                    <button type="submit" className="py-2.5 bg-emerald-600 hover:bg-emerald-505 text-white font-bold rounded-xl text-sm transition-all">
                                        Simpan Cabang
                                    </button>
                                </form>
                            </div>

                            {/* List Cabang */}
                            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                                            <th className="p-4 pl-6">ID</th>
                                            <th className="p-4">Nama Cabang</th>
                                            <th className="p-4">Alamat</th>
                                            <th className="p-4">Maps Link</th>
                                            <th className="p-4 pr-6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {branches.map(b => (
                                            <tr key={b.id} className="hover:bg-slate-50">
                                                <td className="p-4 pl-6 font-mono text-slate-400">{b.id}</td>
                                                <td className="p-4 font-bold text-slate-800">{b.name}</td>
                                                <td className="p-4 text-slate-600">{b.address}</td>
                                                <td className="p-4"><a href={b.maps_link} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold underline">Buka Maps</a></td>
                                                <td className="p-4 pr-6"><span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs rounded-full font-semibold">Aktif</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Master Kamar (Tab: Rooms) */}
                    {activeTab === 'rooms' && ['super_admin', 'operator'].includes(currentRole) && (
                        <div className="space-y-8">
                            {/* Form Tambah */}
                            <div className="glass-panel p-6 rounded-2xl">
                                <h3 className="font-extrabold text-lg text-slate-900 mb-4">Tambah Kamar Baru</h3>
                                <form onSubmit={handleAddRoom} className="grid md:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Pilih Cabang</label>
                                        <select 
                                            required
                                            value={newRoom.branch_id}
                                            onChange={(e) => setNewRoom({...newRoom, branch_id: e.target.value})}
                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                        >
                                            <option value="">-- Pilih Cabang --</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Nomor Kamar</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={newRoom.room_number}
                                            onChange={(e) => setNewRoom({...newRoom, room_number: e.target.value})}
                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                            placeholder="105"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Harga Bulanan (Rp)</label>
                                        <input 
                                            type="number" 
                                            required
                                            value={newRoom.price_monthly}
                                            onChange={(e) => setNewRoom({...newRoom, price_monthly: e.target.value})}
                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                            placeholder="1200000"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-505">Harga Harian (Rp)</label>
                                        <input 
                                            type="number" 
                                            required
                                            value={newRoom.price_daily}
                                            onChange={(e) => setNewRoom({...newRoom, price_daily: e.target.value})}
                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                            placeholder="100000"
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-3">
                                        <label className="text-xs font-semibold text-slate-500">Fasilitas (pisahkan dengan koma)</label>
                                        <input 
                                            type="text" 
                                            value={newRoom.facilities}
                                            onChange={(e) => setNewRoom({...newRoom, facilities: e.target.value})}
                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                            placeholder="AC, Wi-Fi, Kamar Mandi Dalam, Kasur Springbed"
                                        />
                                    </div>
                                    <button type="submit" className="py-2.5 bg-emerald-600 hover:bg-emerald-505 text-white font-bold rounded-xl text-sm transition-all">
                                        Simpan Kamar
                                    </button>
                                </form>
                            </div>

                            {/* List Kamar */}
                            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                                            <th className="p-4 pl-6">No. Kamar</th>
                                            <th className="p-4">Cabang</th>
                                            <th className="p-4">Sewa Bulanan</th>
                                            <th className="p-4">Sewa Harian</th>
                                            <th className="p-4">Fasilitas</th>
                                            <th className="p-4 pr-6">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {visibleRooms.map(room => (
                                            <tr key={room.id} className="hover:bg-slate-50">
                                                <td className="p-4 pl-6 font-bold text-slate-800 font-mono">No. {room.room_number}</td>
                                                <td className="p-4 text-slate-600">{room.branch.name.replace('Kospart PH 18 - ', '')}</td>
                                                <td className="p-4 font-mono text-slate-700">Rp {parseFloat(room.price_monthly).toLocaleString('id-ID')}</td>
                                                <td className="p-4 font-mono text-emerald-600">Rp {parseFloat(room.price_daily).toLocaleString('id-ID')}</td>
                                                <td className="p-4">
                                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                                        {room.facilities && JSON.parse(JSON.stringify(room.facilities)).map((fac, idx) => (
                                                            <span key={idx} className="bg-slate-50 border border-slate-100 text-[10px] px-1.5 py-0.5 rounded text-slate-600 font-medium">{fac}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4 pr-6">
                                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${
                                                        room.status === 'available' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                        room.status === 'occupied' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                        room.status === 'booked' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                        'bg-slate-50 text-slate-500 border border-slate-200'
                                                    }`}>
                                                        {room.status === 'available' ? 'Tersedia' : 
                                                         room.status === 'occupied' ? 'Terisi' : 
                                                         room.status === 'booked' ? 'Dibooking' : 'Maintenance'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Penyewaan / Transaksi Booking (Tab: Bookings) */}
                    {activeTab === 'bookings' && (
                        <div className="space-y-8">
                            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                {currentRole === 'resident' ? (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                                                <th className="p-4 pl-6">Tanggal</th>
                                                <th className="p-4">Deskripsi</th>
                                                <th className="p-4 pr-6 text-right">Nominal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {finances.filter(f => f.booking?.tenant_id === getSimulatedResidentId()).sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)).map(f => (
                                                <tr key={f.id} className="hover:bg-slate-50">
                                                    <td className="p-4 pl-6 font-mono text-slate-600 text-xs">
                                                        {new Date(f.transaction_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                                    </td>
                                                    <td className="p-4 font-semibold text-slate-800">{f.description}</td>
                                                    <td className="p-4 pr-6 text-right font-mono font-bold text-emerald-600">
                                                        Rp {parseFloat(f.amount).toLocaleString('id-ID')}
                                                    </td>
                                                </tr>
                                            ))}
                                            {finances.filter(f => f.booking?.tenant_id === getSimulatedResidentId()).length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="p-8 text-center text-slate-400">
                                                        Belum ada riwayat pembayaran.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                                                <th className="p-4 pl-6">Kode Booking</th>
                                                <th className="p-4">Tenant / Kamar</th>
                                                <th className="p-4">Jenis Sewa</th>
                                                <th className="p-4">Periode</th>
                                                <th className="p-4">Tagihan</th>
                                                <th className="p-4">Status / Bayar</th>
                                                <th className="p-4 pr-6 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {visibleBookings.map(b => (
                                                <tr key={b.id} className="hover:bg-slate-50">
                                                    <td className="p-4 pl-6 font-mono font-bold text-slate-800">{b.booking_code}</td>
                                                    <td className="p-4">
                                                        <div className="font-semibold text-slate-800">{b.tenant.name}</div>
                                                        <div className="text-xs text-slate-500">{b.room.branch.name.replace('Kospart PH 18 - ', '')} (Kamar {b.room.room_number})</div>
                                                    </td>
                                                    <td className="p-4 uppercase text-xs font-bold tracking-wider text-emerald-600">{b.rental_type === 'daily' ? 'Harian' : 'Bulanan'}</td>
                                                    <td className="p-4 font-mono text-slate-600 text-xs">
                                                        {new Date(b.start_date).toLocaleDateString('id-ID')} s.d <br />
                                                        {new Date(b.end_date).toLocaleDateString('id-ID')}
                                                    </td>
                                                    <td className="p-4 font-mono font-semibold text-slate-800">Rp {parseFloat(b.total_amount).toLocaleString('id-ID')}</td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                                                                b.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                                b.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                                'bg-slate-100 text-slate-600 border border-slate-200'
                                                            }`}>
                                                                {b.status === 'active' ? 'Aktif' : b.status === 'pending' ? 'Pending' : 'Checkout'}
                                                            </span>
                                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                                                                b.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                                b.payment_status === 'unpaid' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                                'bg-amber-100 text-amber-800 border border-amber-200'
                                                            }`}>
                                                                {b.payment_status === 'paid' ? 'Lunas' : b.payment_status === 'unpaid' ? 'Belum Lunas' : 'DP / Sebagian'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 pr-6 text-right space-y-1.5">
                                                        {['super_admin', 'operator'].includes(currentRole) && (
                                                            <div className="flex flex-wrap gap-2 justify-end">
                                                                {parseFloat(b.unverified_amount) > 0 && (
                                                                    <button onClick={() => setShowVerifyPaymentModal(b)} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-md transition-colors animate-pulse shadow-sm shadow-indigo-500/50">
                                                                        Verifikasi Bayar
                                                                    </button>
                                                                )}
                                                                {b.status === 'pending' && (
                                                                    <button onClick={() => handleApproveBooking(b.id)} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-md transition-colors">
                                                                        Approve
                                                                    </button>
                                                                )}
                                                                {b.status === 'active' && (
                                                                    <>
                                                                        <button onClick={() => setShowChangeRoomModal(b)} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-md transition-colors" title="Pindah/Perubahan Kamar">
                                                                            Pindah Kamar
                                                                        </button>
                                                                        <button onClick={() => setShowRescheduleModal(b)} className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-md transition-colors" title="Reschedule tagihan / masa sewa">
                                                                            Reschedule
                                                                        </button>
                                                                        <button onClick={() => handleCheckoutBooking(b.id)} className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-md transition-colors">
                                                                            Checkout
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        <button onClick={() => setShowInvoiceModal(b)} className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-md transition-colors border border-slate-200 w-full sm:w-auto shadow-sm">
                                                            Cetak Invoice
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Laporan Keuangan (Tab: Finances) */}
                    {activeTab === 'finances' && (
                        <div className="space-y-8">
                            <div className="grid lg:grid-cols-12 gap-8">
                                {/* Arus Kas Form */}
                                {['super_admin', 'operator'].includes(currentRole) && (
                                    <div className="lg:col-span-4 glass-panel p-6 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-sm">
                                        <div>
                                            <h3 className="font-extrabold text-lg text-slate-800 mb-4">Catat Keuangan Manual</h3>
                                            <form onSubmit={handleAddFinance} className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500">Jenis Transaksi</label>
                                                    <select 
                                                        required
                                                        value={newFinance.transaction_type}
                                                        onChange={(e) => setNewFinance({...newFinance, transaction_type: e.target.value})}
                                                        className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                                    >
                                                        <option value="expense">Pengeluaran (Kas Keluar)</option>
                                                        <option value="income">Pemasukan (Kas Masuk)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500">Jumlah Uang (Rp)</label>
                                                    <input 
                                                        type="number" 
                                                        required
                                                        value={newFinance.amount}
                                                        onChange={(e) => setNewFinance({...newFinance, amount: e.target.value})}
                                                        className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                                        placeholder="250000"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500">Kategori</label>
                                                    <select 
                                                        required
                                                        value={newFinance.category}
                                                        onChange={(e) => setNewFinance({...newFinance, category: e.target.value})}
                                                        className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                                    >
                                                        <option value="maintenance">Perawatan Fasilitas</option>
                                                        <option value="electricity">Listrik & Air</option>
                                                        <option value="salary">Gaji Operator</option>
                                                        <option value="internet">Internet/Wi-Fi</option>
                                                        <option value="rental">Sewa Kamar</option>
                                                        <option value="other">Lain-lain</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500">Tanggal</label>
                                                    <input 
                                                        type="date" 
                                                        required
                                                        value={newFinance.transaction_date}
                                                        onChange={(e) => setNewFinance({...newFinance, transaction_date: e.target.value})}
                                                        className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500">Deskripsi</label>
                                                    <textarea 
                                                        value={newFinance.description}
                                                        onChange={(e) => setNewFinance({...newFinance, description: e.target.value})}
                                                        className="glass-input rounded-xl px-4 py-2.5 text-sm w-full h-16 resize-none"
                                                        placeholder="Beli token listrik atau keran toilet bocor..."
                                                    />
                                                </div>
                                                <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all">
                                                    Catat Arus Kas
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                {/* Arus Kas List */}
                                <div className={`glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm ${['super_admin', 'operator'].includes(currentRole) ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                                    <h3 className="font-extrabold text-lg text-slate-800 mb-4">Laporan Arus Kas Keluar & Masuk</h3>
                                    <div className="overflow-hidden border border-slate-200 rounded-xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase border-b border-slate-200">
                                                    <th className="p-3 pl-4">Tanggal</th>
                                                    <th className="p-3">Kategori</th>
                                                    <th className="p-3">Keterangan</th>
                                                    <th className="p-3 text-right pr-4">Jumlah</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {finances.map(f => (
                                                    <tr key={f.id} className="hover:bg-slate-50">
                                                        <td className="p-3 pl-4 font-mono text-slate-500 text-xs">{new Date(f.transaction_date).toLocaleDateString('id-ID')}</td>
                                                        <td className="p-3">
                                                            <span className="capitalize text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{f.category}</span>
                                                        </td>
                                                        <td className="p-3 text-slate-600 truncate max-w-xs">{f.description}</td>
                                                        <td className={`p-3 text-right pr-4 font-mono font-bold ${
                                                            f.transaction_type === 'income' ? 'text-emerald-600' : 'text-red-600'
                                                        }`}>
                                                            {f.transaction_type === 'income' ? '+' : '-'} Rp {parseFloat(f.amount).toLocaleString('id-ID')}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Komplain & Perbaikan (Tab: Complaints) */}
                    {activeTab === 'complaints' && (
                        <div className="space-y-8">
                            {/* Resident view: Submit Complaint */}
                            {currentRole === 'resident' && (
                                <div className="glass-panel p-6 rounded-2xl max-w-xl border border-slate-200 shadow-sm">
                                    <h3 className="font-extrabold text-lg text-slate-800 mb-4">Laporkan Komplain / Kerusakan</h3>
                                    <form onSubmit={handleAddComplaint} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500">Pilih Kamar Anda</label>
                                            {(() => {
                                                const resId = getSimulatedResidentId();
                                                const residentOccupiedRooms = rooms.filter(r => 
                                                    bookings.some(b => b.room_id === r.id && b.tenant_id === resId && b.status === 'active')
                                                );

                                                if (residentOccupiedRooms.length === 0) {
                                                    return (
                                                        <div className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-200 font-semibold mt-1">
                                                            Anda belum menempati kamar aktif. Hubungi pengelola untuk proses check-in.
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <select 
                                                        required
                                                        value={newComplaint.room_id}
                                                        onChange={(e) => setNewComplaint({...newComplaint, room_id: e.target.value})}
                                                        className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                                    >
                                                        <option value="">-- Pilih Kamar --</option>
                                                        {residentOccupiedRooms.map(r => (
                                                            <option key={r.id} value={r.id}>Kamar {r.room_number} ({r.branch?.name?.replace('Kospart PH 18 - ', '') || ''})</option>
                                                        ))}
                                                    </select>
                                                );
                                            })()}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500">Judul Aduan</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={newComplaint.title}
                                                onChange={(e) => setNewComplaint({...newComplaint, title: e.target.value})}
                                                className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                                placeholder="Contoh: Lampu Kamar Mandi Mati"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500">Deskripsi Lengkap Kendala</label>
                                            <textarea 
                                                required
                                                value={newComplaint.description}
                                                onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                                                className="glass-input rounded-xl px-4 py-2.5 text-sm w-full h-24"
                                                placeholder="Detail kendala yang dialami secara lengkap..."
                                            />
                                        </div>
                                        <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all">
                                            Ajukan Pengaduan
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* List Komplain (Admin & Resident view) */}
                            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                                            <th className="p-4 pl-6">Tanggal</th>
                                            <th className="p-4">Tenant / Kamar</th>
                                            <th className="p-4">Kendala</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 pr-6 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {visibleComplaints.map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50">
                                                <td className="p-4 pl-6 font-mono text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString('id-ID')}</td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-slate-800">{c.tenant.name}</div>
                                                    <div className="text-xs text-slate-500">Kamar {c.room.room_number} ({c.room.branch.name.replace('Kospart PH 18 - ', '')})</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800">{c.title}</div>
                                                    <div className="text-xs text-slate-600 max-w-sm leading-relaxed">{c.description}</div>
                                                    {c.admin_response && (
                                                        <div className="mt-2 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-100 text-[11px] text-emerald-800">
                                                            <strong className="block text-[10px] text-emerald-600 uppercase">Respon Pengelola:</strong>
                                                            {c.admin_response}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${
                                                        c.status === 'pending' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                        c.status === 'confirmed' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                        c.status === 'processing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                        c.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                        'bg-slate-100 text-slate-600 border border-slate-200' // 'ready'
                                                    }`}>
                                                        {c.status === 'pending' ? 'Pending' : 
                                                         c.status === 'confirmed' ? 'Dikonfirmasi' : 
                                                         c.status === 'processing' ? 'Proses Kerja' : 
                                                         c.status === 'completed' ? 'Selesai' : 'Ready'}
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    {['super_admin', 'operator'].includes(currentRole) && (
                                                        <button 
                                                            onClick={() => setComplaintResponse({ id: c.id, status: c.status, admin_response: c.admin_response || '' })}
                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-md transition-colors"
                                                        >
                                                            Ubah Status
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    )}
                </main>
            </div>

            {/* ── Complaint Response Modal (root-level, always mounted) ── */}
            {complaintResponse.id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-2xl">
                        <h3 className="font-extrabold text-lg text-slate-800">Perbarui Status Penanganan Komplain</h3>
                        <form onSubmit={handleUpdateComplaintStatus} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Pilih Status Kerja</label>
                                <select value={complaintResponse.status} onChange={(e) => setComplaintResponse({...complaintResponse, status: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full">
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Dikonfirmasi (Antre)</option>
                                    <option value="processing">Proses Pengerjaan</option>
                                    <option value="completed">Selesai diperbaiki</option>
                                    <option value="ready">Ready (Konfirmasi Kamar Siap)</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Pesan Respon Pengelola</label>
                                <textarea required value={complaintResponse.admin_response} onChange={(e) => setComplaintResponse({...complaintResponse, admin_response: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full h-24" placeholder="Tulis instruksi/info ke tenant terkait perbaikan..." />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setComplaintResponse({ id: null, status: 'processing', admin_response: '' })} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm border border-slate-200">Batal</button>
                                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm">Simpan Status</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Room Modal Dialog */}
            {showChangeRoomModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-2xl">
                        <h3 className="font-extrabold text-lg text-slate-800">Pindah Kamar (Sewa Pindah)</h3>
                        <p className="text-xs text-slate-600">Pindahkan penghuni <strong>{showChangeRoomModal.tenant.name}</strong> dari Kamar {showChangeRoomModal.room.room_number} ke Kamar baru yang kosong.</p>
                        <form onSubmit={handleChangeRoom} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Pilih Kamar Baru (Tersedia)</label>
                                <select 
                                    required
                                    value={newRoomIdInput}
                                    onChange={(e) => setNewRoomIdInput(e.target.value)}
                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                >
                                    <option value="">-- Pilih Kamar --</option>
                                    {rooms.filter(r => r.status === 'available' && r.branch_id === showChangeRoomModal.room.branch_id).map(r => (
                                        <option key={r.id} value={r.id}>Kamar {r.room_number} (Rp {parseFloat(r.price_monthly).toLocaleString('id-ID')})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setShowChangeRoomModal(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm border border-slate-200">
                                    Batal
                                </button>
                                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm">
                                    Pindahkan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reschedule Bill Modal Dialog */}
            {showRescheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-2xl">
                        <h3 className="font-extrabold text-lg text-slate-800">Reschedule Masa Sewa / Tagihan</h3>
                        <p className="text-xs text-slate-600">Reset tanggal mulai & selesai sewa untuk <strong>{showRescheduleModal.tenant.name}</strong>. Jumlah tagihan sewa akan otomatis dihitung ulang secara real-time.</p>
                        <form onSubmit={handleRescheduleBill} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Tanggal Mulai Baru</label>
                                <input 
                                    type="date"
                                    required
                                    value={rescheduleData.start_date}
                                    onChange={(e) => setRescheduleData({...rescheduleData, start_date: e.target.value})}
                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Tanggal Selesai Baru</label>
                                <input 
                                    type="date"
                                    required
                                    value={rescheduleData.end_date}
                                    onChange={(e) => setRescheduleData({...rescheduleData, end_date: e.target.value})}
                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setShowRescheduleModal(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm border border-slate-200">
                                    Batal
                                </button>
                                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm">
                                    Reschedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Verification Modal (Admin/Operator) */}
            {showVerifyPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-800">Verifikasi Pembayaran</h3>
                                <p className="text-xs text-slate-500 mt-1">Kode: <strong className="text-slate-700 font-mono">{showVerifyPaymentModal.booking_code}</strong></p>
                            </div>
                            <button onClick={() => setShowVerifyPaymentModal(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm hover:shadow transition-all border border-slate-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-sm text-amber-800">
                                <div className="font-bold mb-1">Menunggu Verifikasi:</div>
                                <div className="font-mono text-xl text-amber-600 font-extrabold">Rp {parseFloat(showVerifyPaymentModal.unverified_amount).toLocaleString('id-ID')}</div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Bukti Transfer:</label>
                                <div className="w-full h-48 bg-slate-100 rounded-xl border border-slate-200 border-dashed flex items-center justify-center overflow-hidden relative group">
                                    {showVerifyPaymentModal.unverified_proof?.startsWith('data:') || showVerifyPaymentModal.unverified_proof?.startsWith('http') ? (
                                        <img src={showVerifyPaymentModal.unverified_proof} alt="Bukti Transfer" className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <div className="text-center text-slate-500">
                                            <svg className="w-8 h-8 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <span className="text-xs font-medium bg-slate-200 px-2.5 py-1 rounded-md text-slate-600 block">{showVerifyPaymentModal.unverified_proof || 'Bukti Tidak Tersedia'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button onClick={() => handleRejectPayment(showVerifyPaymentModal.id)} className="flex-1 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-sm border border-red-200 transition-colors">
                                Tolak
                            </button>
                            <button onClick={() => handleVerifyPayment(showVerifyPaymentModal.id)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-colors">
                                Setujui
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Print Preview Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-lg bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl p-8 border border-slate-200">
                        {/* Printable Area */}
                        <div className="space-y-6">
                            {/* Invoice Header */}
                            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                                <div>
                                    <h2 className="font-extrabold text-2xl tracking-tight text-emerald-800 uppercase">KOSPART PH 18</h2>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Nota Invoice Tagihan Kos</span>
                                    <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">{showInvoiceModal.room.branch.name}<br />{showInvoiceModal.room.branch.address}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-400 uppercase font-semibold">Nomor Invoice</span>
                                    <span className="block font-mono font-bold text-sm text-slate-800">{showInvoiceModal.booking_code}</span>
                                    <span className="text-[10px] text-slate-400 block mt-2">Dibuat: {new Date(showInvoiceModal.created_at).toLocaleDateString('id-ID')}</span>
                                </div>
                            </div>

                            {/* Details Row */}
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Ditagihkan Kepada:</span>
                                    <strong className="text-slate-800 text-sm block mt-1">{showInvoiceModal.tenant.name}</strong>
                                    <span className="text-slate-500 block">{showInvoiceModal.tenant.email}</span>
                                    <span className="text-slate-500 block">{showInvoiceModal.tenant.phone}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Rincian Hunian:</span>
                                    <strong className="text-slate-800 text-sm block mt-1">Kamar {showInvoiceModal.room.room_number} ({showInvoiceModal.rental_type === 'daily' ? 'Harian' : 'Bulanan'})</strong>
                                    <span className="text-slate-500 block">Check-in: {new Date(showInvoiceModal.start_date).toLocaleDateString('id-ID')}</span>
                                    <span className="text-slate-500 block">Check-out: {new Date(showInvoiceModal.end_date).toLocaleDateString('id-ID')}</span>
                                </div>
                            </div>

                            {/* Billing Summary Table */}
                            <table className="w-full text-left text-xs border-collapse border border-slate-200 mt-4">
                                <thead>
                                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9px] tracking-wider">
                                        <th className="p-3">Item Deskripsi</th>
                                        <th className="p-3 text-right">Harga Satuan</th>
                                        <th className="p-3 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-200">
                                        <td className="p-3 font-semibold text-slate-800">
                                            Sewa Kamar {showInvoiceModal.room.room_number} - {showInvoiceModal.rental_type === 'daily' ? 'Harian' : 'Bulanan'} <br />
                                            <span className="text-[10px] text-slate-400 font-normal">Periode: {showInvoiceModal.start_date} s.d {showInvoiceModal.end_date}</span>
                                        </td>
                                        <td className="p-3 text-right font-mono">
                                            Rp {showInvoiceModal.rental_type === 'daily' ? parseFloat(showInvoiceModal.room.price_daily).toLocaleString('id-ID') : parseFloat(showInvoiceModal.room.price_monthly).toLocaleString('id-ID')}
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold text-slate-800">Rp {parseFloat(showInvoiceModal.total_amount).toLocaleString('id-ID')}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Total Balance info */}
                            <div className="flex justify-between items-end pt-4">
                                {/* Barcode Simulation */}
                                <div className="text-center space-y-1">
                                    <div className="bg-slate-900 text-white font-mono text-[9px] tracking-[6px] px-3 py-1.5 inline-block">
                                        *KP-{showInvoiceModal.booking_code.substring(3, 9)}*
                                    </div>
                                    <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Verifikasi Invoice Asli</span>
                                </div>
                                <div className="text-right space-y-1.5 text-xs">
                                    <div>
                                        <span className="text-slate-400 font-semibold uppercase text-[10px] mr-4">Total Biaya:</span>
                                        <strong className="font-mono text-slate-800">Rp {parseFloat(showInvoiceModal.total_amount).toLocaleString('id-ID')}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 font-semibold uppercase text-[10px] mr-4">Telah Dibayar:</span>
                                        <strong className="font-mono text-emerald-600">Rp {parseFloat(showInvoiceModal.paid_amount).toLocaleString('id-ID')}</strong>
                                    </div>
                                    <div className="border-t border-slate-200 pt-1">
                                        <span className="text-slate-400 font-bold uppercase text-[10px] mr-4">Status Tagihan:</span>
                                        <span className={`px-2 py-0.5 font-bold uppercase text-[9px] rounded ${
                                            showInvoiceModal.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                            showInvoiceModal.payment_status === 'unpaid' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {showInvoiceModal.payment_status === 'paid' ? 'Lunas' : showInvoiceModal.payment_status === 'unpaid' ? 'Belum Lunas' : 'DP / Sebagian'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex gap-4 border-t border-slate-200 pt-6 mt-6">
                            <button 
                                onClick={() => setShowInvoiceModal(null)} 
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                            >
                                Tutup Invoice
                            </button>
                            <button 
                                onClick={() => window.print()} 
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-700/20"
                            >
                                Cetak (PDF / Kertas)
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Payment Modal for Tenant (root-level) ── */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5 shadow-2xl">
                        <div>
                            <h3 className="font-extrabold text-lg text-slate-800">💳 Bayar Tagihan Sewa</h3>
                            <p className="text-xs text-slate-500 mt-1">Booking: <span className="font-mono font-bold text-slate-700">{showPaymentModal.booking_code}</span></p>
                        </div>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Kamar</span><span className="font-bold text-slate-800">No. {showPaymentModal.room?.room_number} ({showPaymentModal.rental_type === 'daily' ? 'Harian' : 'Bulanan'})</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Periode</span><span className="font-semibold text-slate-700 text-xs">{new Date(showPaymentModal.start_date).toLocaleDateString('id-ID')} – {new Date(showPaymentModal.end_date).toLocaleDateString('id-ID')}</span></div>
                            <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Total Tagihan</span><span className="font-extrabold text-slate-900">Rp {parseFloat(showPaymentModal.total_amount).toLocaleString('id-ID')}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Sudah Dibayar</span><span className="font-bold text-emerald-600">Rp {parseFloat(showPaymentModal.paid_amount || 0).toLocaleString('id-ID')}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500 font-semibold">Sisa Tagihan</span><span className="font-extrabold text-red-600">Rp {Math.max(0, parseFloat(showPaymentModal.total_amount) - parseFloat(showPaymentModal.paid_amount || 0)).toLocaleString('id-ID')}</span></div>
                        </div>
                        <form onSubmit={handleTenantPayment} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Jumlah yang Dibayarkan (Rp)</label>
                                <input type="number" required min="1" value={paymentData.paid_amount} onChange={(e) => setPaymentData({...paymentData, paid_amount: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder={`Maks Rp ${parseFloat(showPaymentModal.total_amount).toLocaleString('id-ID')}`} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Bukti Pembayaran (Simulasi)</label>
                                <input type="text" required value={paymentData.payment_proof} onChange={(e) => setPaymentData({...paymentData, payment_proof: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="Nama file / URL bukti transfer" />
                                <p className="text-[10px] text-slate-400">Isi dengan nama file atau URL gambar bukti transfer (simulasi).</p>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowPaymentModal(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm border border-slate-200 transition-all">Batal</button>
                                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-700/20 transition-all">Konfirmasi Bayar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
