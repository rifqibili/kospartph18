import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Head, usePage, Link } from '@inertiajs/react';
import Layout from '@/Layouts/AuthenticatedLayout';
import CanteenTab from '@/Components/CanteenTab';
import FinancesTab from '@/Components/DashboardTabs/FinancesTab';
import WebSettingsTab from '@/Components/WebSettingsTab';
import UsersManagementTab from '@/Components/UsersManagementTab';
import ThemeToggle from '@/Components/ThemeToggle';
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

export default function Dashboard() {
    const { auth } = usePage().props;
    
    const currentRole = auth.user.role;
    
    // Navigation inside Dashboard: 'overview' | 'branches' | 'rooms' | 'bookings' | 'finances' | 'complaints'
    const [activeTab, setActiveTab] = useState(currentRole === 'karyawan' ? 'canteen' : 'overview');

    // Data states
    const [stats, setStats] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [branches, setBranches] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [finances, setFinances] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [bookingSearch, setBookingSearch] = useState('');
    const [financeSearch, setFinanceSearch] = useState('');
    const [financeTypeFilter, setFinanceTypeFilter] = useState('all');
    const [financeBranchFilter, setFinanceBranchFilter] = useState(auth.user.role === 'operator' && auth.user.assigned_branches?.length > 0 ? String(auth.user.assigned_branches[0]) : '');
    const [financeCategoryFilter, setFinanceCategoryFilter] = useState('all');
    const [financePaymentMethodFilter, setFinancePaymentMethodFilter] = useState('all');
    const [financeDateFilterType, setFinanceDateFilterType] = useState('all');
    const [financeDateFilterStart, setFinanceDateFilterStart] = useState('');
    const [financeDateFilterEnd, setFinanceDateFilterEnd] = useState('');
    const [tenantPaymentSearch, setTenantPaymentSearch] = useState('');
    const [canteenItems, setCanteenItems] = useState([]);
    const [canteenOrders, setCanteenOrders] = useState([]);
    const [canteenCart, setCanteenCart] = useState([]);
    
    // Modal & Action states
    const [showInvoiceModal, setShowInvoiceModal] = useState(null);
    const [showChangeRoomModal, setShowChangeRoomModal] = useState(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(null);
    const [showExtendManualModal, setShowExtendManualModal] = useState(null);
    const [extendManualData, setExtendManualData] = useState({ duration: 1, payment_status: 'paid', payment_method: 'cash' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [showExtendTenantModal, setShowExtendTenantModal] = useState(false);
    const [extendDuration, setExtendDuration] = useState(1);
    const [extendType, setExtendType] = useState('');
    const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null });
    const showConfirm = (message, onConfirm) => setConfirmDialog({ isOpen: true, message, onConfirm });

    // Payment modal for tenant
    const [showPaymentModal, setShowPaymentModal] = useState(null);
    const [paymentData, setPaymentData] = useState({ paid_amount: '', payment_proof_file: null });
    const [paymentErrors, setPaymentErrors] = useState({});
    const [showVerifyPaymentModal, setShowVerifyPaymentModal] = useState(null);
    const [showManualPayModal, setShowManualPayModal] = useState(false);
    const [manualPayData, setManualPayData] = useState({ booking_id: '', paid_amount: '', payment_method: 'cash' });
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        }
        if (showNotifications) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showNotifications]);

    // Reset search and filter states when changing tabs
    useEffect(() => {
        setBookingSearch('');
        setFinanceSearch('');
        setTenantPaymentSearch('');
        setRoomStatusFilter('all');
    }, [activeTab]);

    const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);

    useEffect(() => {
        let timeout;
        let hasOpenModal = false;

        const checkModals = () => {
            // Cek apakah ada elemen modal form yang terbuka di DOM
            hasOpenModal = document.querySelectorAll('.fixed.inset-0.z-50, .fixed.inset-0.z-\\[60\\], .fixed.inset-0.z-\\[100\\]').length > 0;
            if (hasOpenModal) {
                setIsMobileNavVisible(false);
                document.body.style.overflow = 'hidden'; // Mengunci layar latar belakang
                clearTimeout(timeout);
            } else {
                document.body.style.overflow = ''; // Membuka kunci layar
                resetTimer();
            }
        };

        const resetTimer = () => {
            if (!hasOpenModal) {
                setIsMobileNavVisible(true);
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    setIsMobileNavVisible(false);
                }, 2000);
            }
        };

        // Check initially
        checkModals();

        // Setup MutationObserver to watch for modals being added/removed to the DOM
        const observer = new MutationObserver(() => {
            checkModals();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Event listeners untuk mendeteksi interaksi pengguna
        window.addEventListener('touchstart', resetTimer);
        window.addEventListener('scroll', resetTimer, true);
        window.addEventListener('click', resetTimer);

        return () => {
            clearTimeout(timeout);
            document.body.style.overflow = ''; // Clean up lock
            observer.disconnect();
            window.removeEventListener('touchstart', resetTimer);
            window.removeEventListener('scroll', resetTimer, true);
            window.removeEventListener('click', resetTimer);
        };
    }, []);
    const [showManualBookingModal, setShowManualBookingModal] = useState(false);
    const [manualBookingData, setManualBookingData] = useState({
        room_id: '',
        rental_type: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        name: '',
        phone: '',
        email: '',
        nik: '',
        ktp_photo: null,
        payment_status: 'paid'
    });
    
    // Auto-calculate end_date for manual booking when start_date or rental_type changes
    useEffect(() => {
        if (manualBookingData.start_date && manualBookingData.rental_type) {
            const start = new Date(manualBookingData.start_date);
            const end = new Date(start);
            if (manualBookingData.rental_type === 'daily') {
                end.setDate(end.getDate() + 1);
            } else if (manualBookingData.rental_type === 'weekly') {
                end.setDate(end.getDate() + 7);
            } else if (manualBookingData.rental_type === 'monthly') {
                end.setMonth(end.getMonth() + 1);
            } else if (manualBookingData.rental_type === 'yearly') {
                end.setFullYear(end.getFullYear() + 1);
            }
            const formattedEnd = end.toISOString().split('T')[0];
            if (manualBookingData.end_date !== formattedEnd) {
                setManualBookingData(prev => ({ ...prev, end_date: formattedEnd }));
            }
        }
    }, [manualBookingData.start_date, manualBookingData.rental_type]);

    // Form Inputs
    const [newBranch, setNewBranch] = useState({ name: '', address: '', maps_link: '', status: 'active', image: null, video: null });
    const [editBranch, setEditBranch] = useState(null);
    const [newRoom, setNewRoom] = useState({ branch_id: '', room_number: '', price_monthly: '', price_daily: '', price_weekly: '', price_yearly: '', price_weekend: '', status: 'available', facilities: '', description: '', photos: null, videos: null });
    const [editRoom, setEditRoom] = useState(null);
    const initialFinanceBranchId = auth.user.role === 'operator' && auth.user.assigned_branches && auth.user.assigned_branches.length > 0 ? String(auth.user.assigned_branches[0]) : '';
    const [newFinance, setNewFinance] = useState({ transaction_type: 'expense', amount: '', category: 'maintenance', transaction_date: new Date().toISOString().split('T')[0], description: '', branch_id: initialFinanceBranchId, payment_method: 'cash' });
    const [newComplaint, setNewComplaint] = useState({ room_id: '', title: '', description: '' });
    const [complaintResponse, setComplaintResponse] = useState({ id: null, status: 'processing', admin_response: '' });
    const [rescheduleData, setRescheduleData] = useState({ start_date: '', end_date: '' });
    const [newRoomIdInput, setNewRoomIdInput] = useState('');
    const [roomStatusFilter, setRoomStatusFilter] = useState('all');

    // Toast/Alert triggers
    const [toasts, setToasts] = useState([]);

    const addToast = (toastParams) => {
        const id = toastParams.id || Date.now() + Math.random();
        const toast = { ...toastParams, id };
        setToasts(prev => [toast, ...prev].slice(0, 3));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    // Chart ref
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Custom ringtone for incoming payments (Pembayaran Masuk)
    const playNotificationSound = () => {
        if (currentRole === 'resident') return;
        if (window.canteenAudioObj || window.canteenSoundInterval) return; // Already playing

        setIsCanteenRingtonePlaying(true);
        try {
            const audio = new Audio('/audio/pembayaran_masuk.mp3');
            audio.loop = true; // Terus berdering sampai dihentikan
            audio.play().catch(e => console.error('Autoplay blocked by browser', e));
            window.canteenAudioObj = audio;
        } catch(e) {
            console.error('Failed to play MP3 notification', e);
        }
    };

    const [isCanteenRingtonePlaying, setIsCanteenRingtonePlaying] = useState(false);

    // Specific ringtone for canteen orders (Ting-Ting! bell sound)
    const playCanteenRingtone = () => {
        if (currentRole === 'resident') return; // Matikan suara untuk penyewa
        if (window.canteenAudioObj || window.canteenSoundInterval) return; // Already playing

        setIsCanteenRingtonePlaying(true);

        try {
            const audio = new Audio('/audio/pesanan_masuk_voice.mp3');
            audio.loop = true; // Terus berdering sampai dihentikan
            audio.play().catch(e => console.error('Autoplay blocked by browser', e));
            window.canteenAudioObj = audio;
        } catch(e) {
            console.error('Failed to play MP3 audio', e);
        }
    };

    const stopCanteenRingtone = () => {
        if (window.canteenSoundInterval) {
            clearInterval(window.canteenSoundInterval);
            window.canteenSoundInterval = null;
        }
        if (window.canteenAudioObj) {
            window.canteenAudioObj.pause();
            window.canteenAudioObj.currentTime = 0;
            window.canteenAudioObj = null;
        }
        setIsCanteenRingtonePlaying(false);
    };

    // Trigger dummy/simulation notifications (real-time popups)
    const triggerSimulationNotification = (type) => {
        if (type === 'payment') {
            playNotificationSound();
        }
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
                color: 'border-blue-200 text-blue-800 bg-blue-50 shadow-lg'
            };
        } else if (type === 'complaint') {
            toast = {
                id: Date.now(),
                title: 'Komplain Baru Masuk (Real-Time)',
                message: 'Kamar 101 - Dani Trisna mengajukan aduan: "Kran Air Kamar Mandi Bocor". (Badge menu ter-update)',
                color: 'border-slate-200 text-slate-800 bg-slate-50 shadow-lg'
            };
        } else if (type === 'new_booking') {
            toast = {
                id: Date.now(),
                title: 'Penyewa Baru Masuk (Real-Time)',
                message: 'Penghuni Budi Santoso baru saja memesan Kamar 203. Menunggu verifikasi OTP dan pembayaran.',
                color: 'border-emerald-200 text-emerald-800 bg-emerald-50 shadow-lg'
            };
        }
        addToast(toast); // keep max 3 toasts and auto-remove after 3s
    };

    // Auto-detect and spawn toasts for REAL database notifications
    const prevNotifsRef = useRef([]);
    const isFirstLoadRef = useRef(true);

    useEffect(() => {
        // Hanya update ref, JANGAN putar suara di sini.
        // Suara dan toast ditangani di loadNotificationsOnly() saat polling.
        prevNotifsRef.current = notifications;
    }, [notifications]);

    // Load DB Data (parallel fetches)
    const loadAllData = async () => {
        try {
            const [statsRes, branchesRes, roomsRes, bookingsRes, complaintsRes, financesRes, canteenItemsRes, canteenOrdersRes] = await Promise.all([
                authFetch('/api/dashboard/data'),
                authFetch('/api/branches'),
                authFetch('/api/rooms'),
                authFetch('/api/bookings'),
                authFetch('/api/complaints'),
                authFetch('/api/finances'),
                authFetch('/api/canteen-items'),
                authFetch('/api/canteen-orders'),
            ]);
            
            const statsData      = await statsRes.json();
            const branchesData   = await branchesRes.json();
            const roomsData      = await roomsRes.json();
            const bookingsData   = await bookingsRes.json();
            const complaintsData = await complaintsRes.json();
            const financesData   = await financesRes.json();
            const canteenItemsData = await canteenItemsRes.json();
            const canteenOrdersData = await canteenOrdersRes.json();

            setStats(statsData.stats || {});
            setNotifications(statsData.notifications || []);
            setRecentBookings(statsData.recentBookings || []);
            setBranches(Array.isArray(branchesData) ? branchesData : []);
            setRooms(Array.isArray(roomsData) ? roomsData : []);
            setBookings(Array.isArray(bookingsData) ? bookingsData : []);
            setComplaints(Array.isArray(complaintsData) ? complaintsData : []);
            setFinances(Array.isArray(financesData) ? financesData : []);
            setCanteenItems(Array.isArray(canteenItemsData) ? canteenItemsData : []);
            setCanteenOrders(Array.isArray(canteenOrdersData) ? canteenOrdersData : []);
            prevCanteenOrdersRef.current = Array.isArray(canteenOrdersData) ? canteenOrdersData : [];
        } catch (err) {
            console.error('Error loading data', err);
        }
    };

    const prevCanteenOrdersRef = useRef([]);

    // Background polling for notifications every 10s
    const loadNotificationsOnly = async () => {
        try {
            const res  = await authFetch('/api/dashboard/data');
            const data = await res.json();
            setStats(data.stats || {});
            const freshNotifs = data.notifications || [];
            setNotifications(freshNotifs);
            
            // Deteksi notifikasi baru (hanya jika bukan load pertama kali)
            if (!isFirstLoadRef.current) {
                const newNotifs = freshNotifs.filter(n => !prevNotifsRef.current.find(p => p.id === n.id));
                
                if (newNotifs.length > 0) {
                    const hasNewCanteenOrder = newNotifs.some(n => (n.type === 'canteen_admin' && n.title === 'Pesanan Kantin Baru') || n.type === 'canteen_ready');
                    const hasNewPayment = newNotifs.some(n => n.type === 'payment_unverified' || n.type === 'new_booking');
                    
                    if (hasNewCanteenOrder) {
                        playCanteenRingtone();
                    } else if (hasNewPayment) {
                        playNotificationSound();
                    }
                    
                    // Tampilkan toast untuk notifikasi baru
                    newNotifs.forEach(n => {
                        let color = 'border-slate-200 text-slate-800 bg-white shadow-lg';
                        if (n.type === 'unpaid_bill' || n.type === 'payment_rejected') color = 'border-red-200 text-red-800 bg-red-50 shadow-lg';
                        else if (n.type === 'rental_expiry') color = 'border-amber-200 text-amber-800 bg-amber-50 shadow-lg';
                        else if (n.type === 'payment_unverified') color = 'border-blue-200 text-blue-800 bg-blue-50 shadow-lg';
                        else if (n.type === 'new_booking') color = 'border-emerald-200 text-emerald-800 bg-emerald-50 shadow-lg';
                        else if (n.type === 'new_complaint') color = 'border-slate-200 text-slate-800 bg-slate-50 shadow-lg';
                        else if (n.type === 'canteen_admin' || n.type === 'canteen_ready') color = 'border-fuchsia-200 text-fuchsia-800 bg-fuchsia-50 shadow-lg';
                        
                        addToast({
                            id: Date.now() + Math.random(),
                            title: n.title + ' (Sistem)',
                            message: n.message,
                            color: color
                        });
                    });
                }
            }
            // Tandai bahwa data awal sudah dimuat
            if (isFirstLoadRef.current) isFirstLoadRef.current = false;
            
            // Fetch canteen orders for real-time updates
            if (['super_admin', 'operator'].includes(currentRole)) {
                const canteenRes = await authFetch('/api/canteen-orders');
                const canteenData = await canteenRes.json();
                
                // Cek pesanan baru (hanya hitung yang masih aktif, abaikan yang otomatis completed/cancelled)
                const activeOrdersNow = canteenData.filter(o => !['completed', 'cancelled'].includes(o.status));
                const activeOrdersPrev = prevCanteenOrdersRef.current.filter(o => !['completed', 'cancelled'].includes(o.status));
                
                if (prevCanteenOrdersRef.current.length > 0 && activeOrdersNow.length > activeOrdersPrev.length) {
                    playCanteenRingtone();
                    addToast({
                        title: 'Pesanan Kantin Baru! 🍜',
                        message: 'Ada pesanan makanan/minuman baru dari penyewa.',
                        color: 'border-fuchsia-200 text-fuchsia-800 bg-fuchsia-50 shadow-lg'
                    });
                }
                prevCanteenOrdersRef.current = canteenData;
                setCanteenOrders(canteenData);
            }
        } catch (e) {
            console.error('Polling error', e);
        }
    };

    // Auto-refresh Dashboard data (Initial load based on role)
    useEffect(() => { loadAllData(); }, [currentRole]);
    
    // Temoporary disable dark mode during print
    useEffect(() => {
        const handleBeforePrint = () => {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                document.documentElement.dataset.wasDark = 'true';
            }
        };
        const handleAfterPrint = () => {
            if (document.documentElement.dataset.wasDark === 'true') {
                document.documentElement.classList.add('dark');
                delete document.documentElement.dataset.wasDark;
            }
        };
        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);
        return () => {
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(loadNotificationsOnly, 30000);
        return () => clearInterval(interval);
    }, [currentRole]);

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
        addToast({ title: `${icon} ${type === 'success' ? 'Berhasil' : 'Gagal'}`, message, color: colorMap[type] });
    };

    // Handle Forms
    const handleAddBranch = async (e) => {
        e.preventDefault();
        const payload = new FormData();
        payload.append('name', newBranch.name);
        payload.append('address', newBranch.address || '');
        payload.append('maps_link', newBranch.maps_link || '');
        payload.append('status', newBranch.status);
        if (newBranch.image) payload.append('image', newBranch.image);
        if (newBranch.video) payload.append('video', newBranch.video);

        const res = await authFetch('/api/branches', { method: 'POST', body: payload });
        if (res.ok) {
            setNewBranch({ name: '', address: '', maps_link: '', status: 'active', image: null, video: null });
            loadAllData();
            showToast('Cabang berhasil ditambahkan!');
        } else { const d = await res.json(); showToast(d.message || 'Gagal menambah cabang.', 'error'); }
    };

    const handleEditBranchSubmit = async (e) => {
        e.preventDefault();
        const payload = new FormData();
        payload.append('name', editBranch.name);
        payload.append('address', editBranch.address || '');
        payload.append('maps_link', editBranch.maps_link || '');
        payload.append('status', editBranch.status);
        if (editBranch.image) payload.append('image', editBranch.image);
        if (editBranch.video) payload.append('video', editBranch.video);
        if (editBranch.remove_image) payload.append('remove_image', '1');
        if (editBranch.remove_video) payload.append('remove_video', '1');
        payload.append('_method', 'PUT'); // For Laravel form spoofing

        const res = await authFetch(`/api/branches/${editBranch.id}`, { method: 'POST', body: payload });
        if (res.ok) {
            setEditBranch(null);
            loadAllData();
            showToast('Cabang berhasil diperbarui!');
        } else { const d = await res.json(); showToast(d.message || 'Gagal memperbarui cabang.', 'error'); }
    };

    const handleDeleteBranch = (id) => {
        showConfirm('Apakah Anda yakin ingin menghapus cabang ini?', async () => {
            const res = await authFetch(`/api/branches/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadAllData();
                showToast('Cabang berhasil dihapus!');
            } else { showToast('Gagal menghapus cabang.', 'error'); }
        });
    };

    const handleAddRoom = async (e) => {
        e.preventDefault();
        
        const payload = new FormData();
        payload.append('branch_id', newRoom.branch_id);
        payload.append('room_number', newRoom.room_number);
        payload.append('price_monthly', newRoom.price_monthly);
        payload.append('price_daily', newRoom.price_daily);
        payload.append('price_weekly', newRoom.price_weekly);
        payload.append('price_yearly', newRoom.price_yearly);
        payload.append('price_weekend', newRoom.price_weekend || 0);
        payload.append('status', newRoom.status);
        payload.append('description', newRoom.description || '');
        
        const facilitiesArray = newRoom.facilities.split(',').map(f => f.trim()).filter(Boolean);
        facilitiesArray.forEach((f, idx) => payload.append(`facilities[${idx}]`, f));

        if (newRoom.photos) {
            Array.from(newRoom.photos).forEach((file) => {
                payload.append('photos[]', file);
            });
        }
        
        if (newRoom.videos) {
            Array.from(newRoom.videos).forEach((file) => {
                payload.append('videos[]', file);
            });
        }

        const res = await authFetch('/api/rooms', { method: 'POST', body: payload });
        if (res.ok) {
            setNewRoom({ branch_id: '', room_number: '', price_monthly: '', price_daily: '', price_weekly: '', price_yearly: '', price_weekend: '', status: 'available', facilities: '', description: '', photos: null, videos: null });
            loadAllData();
            showToast('Kamar berhasil ditambahkan!');
        } else { const d = await res.json(); showToast(d.message || 'Gagal menambah kamar.', 'error'); }
    };
    
    const handleEditRoomSubmit = async (e) => {
        e.preventDefault();
        const payload = new FormData();
        payload.append('branch_id', editRoom.branch_id);
        payload.append('room_number', editRoom.room_number);
        payload.append('price_monthly', editRoom.price_monthly);
        payload.append('price_daily', editRoom.price_daily);
        payload.append('price_weekly', editRoom.price_weekly);
        payload.append('price_yearly', editRoom.price_yearly);
        payload.append('price_weekend', editRoom.price_weekend || 0);
        payload.append('status', editRoom.status);
        payload.append('description', editRoom.description || '');
        
        const facilitiesArray = typeof editRoom.facilities === 'string' 
            ? editRoom.facilities.split(',').map(f => f.trim()).filter(Boolean)
            : (Array.isArray(editRoom.facilities) ? editRoom.facilities : []);
            
        facilitiesArray.forEach((f, idx) => payload.append(`facilities[${idx}]`, f));

        if (editRoom.existing_photos) {
            editRoom.existing_photos.forEach((url) => {
                payload.append('existing_photos[]', url);
            });
        }
        
        if (editRoom.existing_videos) {
            editRoom.existing_videos.forEach((url) => {
                payload.append('existing_videos[]', url);
            });
        }

        if (editRoom.new_photos) {
            Array.from(editRoom.new_photos).forEach((file) => {
                payload.append('new_photos[]', file);
            });
        }
        
        if (editRoom.new_videos) {
            Array.from(editRoom.new_videos).forEach((file) => {
                payload.append('new_videos[]', file);
            });
        }
        
        payload.append('_method', 'PUT');

        const res = await authFetch(`/api/rooms/${editRoom.id}`, { method: 'POST', body: payload });
        if (res.ok) {
            setEditRoom(null);
            loadAllData();
            showToast('Kamar berhasil diperbarui!');
        } else { const d = await res.json(); showToast(d.message || 'Gagal memperbarui kamar.', 'error'); }
    };

    const handleDeleteRoom = (id) => {
        showConfirm('Apakah Anda yakin ingin menghapus kamar ini?', async () => {
            const res = await authFetch(`/api/rooms/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadAllData();
                showToast('Kamar berhasil dihapus!');
            } else { showToast('Gagal menghapus kamar.', 'error'); }
        });
    };

    const handleDeleteBooking = (id) => {
        showConfirm('Hapus log penyewaan ini beserta akun penghuninya secara permanen?', async () => {
            const res = await authFetch(`/api/bookings/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadAllData();
                showToast('Log penyewaan dan akun berhasil dihapus!');
            } else {
                const err = await res.json();
                showToast(err.error || 'Gagal menghapus log penyewaan.', 'error');
            }
        });
    };

    const handleFinishCleaning = (roomId) => {
        showConfirm('Tandai kamar ini selesai dibersihkan dan siap disewa?', async () => {
            const res = await authFetch(`/api/rooms/${roomId}/finish-cleaning`, { method: 'POST' });
            if (res.ok) {
                loadAllData();
                showToast('Pembersihan selesai. Kamar kini tersedia!');
            } else {
                const d = await res.json();
                showToast(d.message || 'Gagal mengubah status kamar.', 'error');
            }
        });
    };

    const handleExportCSV = () => {
        const headers = ['Kode Booking', 'Penyewa', 'Cabang', 'Kamar', 'Jenis Sewa', 'Tgl Mulai', 'Tgl Selesai', 'Sisa Tagihan', 'Status Sewa', 'Status Bayar'];
        
        const csvData = visibleBookings.map(b => {
            const statusSewa = b.status === 'active' ? 'Aktif' : b.status === 'completed' ? 'Selesai' : b.status === 'pending' ? 'Menunggu' : b.status === 'rejected' ? 'Ditolak' : 'Dibatalkan';
            const statusBayar = b.payment_status === 'paid' ? 'Lunas' : b.payment_status === 'unpaid' ? 'Belum Lunas' : b.payment_status === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi';
            const tagihan = `Rp ${Number(Math.max(0, b.total_amount - (b.paid_amount || 0))).toLocaleString('id-ID')}`;

            return [
                b.booking_code,
                b.tenant?.name || '-',
                b.room?.branch?.name?.replace('Kospart PH 18 - ', '') || '-',
                `Kamar ${b.room?.room_number || '-'}`,
                b.rental_type === 'daily' ? 'Harian' : (b.rental_type === 'weekly' ? 'Mingguan' : (b.rental_type === 'monthly' ? 'Bulanan' : 'Tahunan')),
                b.start_date,
                b.end_date,
                tagihan,
                statusSewa,
                statusBayar
            ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(';');
        });
        
        const csvContent = [headers.join(';'), ...csvData].join('\n');
        
        // Tambahkan BOM agar karakter terbaca baik di Excel
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Data_Penyewaan_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleExportFinanceCSV = () => {
        const headers = ['Tanggal', 'Kategori', 'Deskripsi', 'Metode Pembayaran', 'Jumlah', 'Tipe Transaksi', 'Kamar', 'Cabang', 'Penyewa'];
        const csvData = visibleFinances.map(f => {
            const amount = f.transaction_type === 'income' ? f.amount : -f.amount;
            const formattedAmount = `Rp ${Number(amount).toLocaleString('id-ID')}`;

            return [
                new Date(f.transaction_date).toLocaleDateString('id-ID'),
                f.category,
                f.description,
                f.payment_method === 'cash' ? 'Tunai (Cash)' : 
                f.payment_method === 'transfer' ? 'Transfer Bank' : 
                f.payment_method === 'qris' ? 'QRIS' : 
                f.payment_method === 'debt' ? 'Kasbon / Hutang' : 
                (f.payment_method || '-'),
                formattedAmount,
                f.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                f.booking ? `Kamar ${f.booking.room?.room_number || '-'}` : '-',
                f.branch?.name?.replace('Kospart PH 18 - ', '') || '-',
                f.booking?.tenant?.name || '-'
            ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(';');
        });
        const csvContent = [headers.join(';'), ...csvData].join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Export_Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleAddFinance = async (e) => {
        e.preventDefault();
        const res = await authFetch('/api/finances', { method: 'POST', body: JSON.stringify(newFinance) });
        if (res.ok) {
            setNewFinance({ transaction_type: 'expense', amount: '', category: 'maintenance', transaction_date: new Date().toISOString().split('T')[0], description: '', branch_id: initialFinanceBranchId, payment_method: 'cash' });
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
        
        setPaymentErrors({});

        const formData = new FormData();
        formData.append('paid_amount', paymentData.paid_amount);
        if (paymentData.payment_proof_file) {
            formData.append('payment_proof', paymentData.payment_proof_file);
        }

        const res  = await authFetch(`/api/bookings/${showPaymentModal.id}/pay`, { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
            setShowPaymentModal(null);
            setPaymentData({ paid_amount: '', payment_proof_file: null });
            setPaymentErrors({});
            loadAllData();
            showToast(data.message);
        } else { 
            if (data.errors) {
                setPaymentErrors(data.errors);
            } else {
                showToast(data.message || 'Gagal memproses pembayaran.', 'error'); 
            }
        }
    };

    const closeManualBookingModal = () => {
        setShowManualBookingModal(false);
        setManualBookingData({
            room_id: '',
            rental_type: 'monthly',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            name: '',
            phone: '',
            email: '',
            nik: '',
            ktp_photo: null,
            payment_status: 'paid'
        });
    };

    const handleManualBookingSubmit = async (e) => {
        e.preventDefault();
        if (!manualBookingData.room_id) {
            showToast('Silakan pilih kamar terlebih dahulu.', 'error');
            return;
        }
        const formData = new FormData();
        Object.keys(manualBookingData).forEach(key => {
            if (manualBookingData[key] !== null && manualBookingData[key] !== '') {
                formData.append(key, manualBookingData[key]);
            }
        });

        const res = await authFetch('/api/bookings/manual', {
            method: 'POST',
            body: formData
        });
        
        const data = await res.json();
        if (res.ok) {
            setShowManualBookingModal(false);
            setManualBookingData({
                room_id: '',
                rental_type: 'monthly',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                name: '',
                phone: '',
                email: '',
                nik: '',
                ktp_photo: null,
                payment_status: 'paid'
            });
            loadAllData();
            showToast(data.message);
        } else {
            showToast(data.message || 'Gagal menambah booking manual.', 'error');
        }
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

    const closeManualPayModal = () => {
        setShowManualPayModal(false);
        setManualPayData({ booking_id: '', paid_amount: '', payment_method: 'cash' });
    };

    const handleManualPaySubmit = async (e) => {
        e.preventDefault();
        if (!showManualPayModal || !manualPayData.booking_id) {
            showToast('Silakan pilih penghuni/kamar terlebih dahulu.', 'error');
            return;
        }
        
        const res = await authFetch(`/api/bookings/${manualPayData.booking_id}/pay-manual`, {
            method: 'POST',
            body: JSON.stringify({ paid_amount: manualPayData.paid_amount, payment_method: manualPayData.payment_method })
        });
        
        const data = await res.json();
        if (res.ok) {
            setShowManualPayModal(false);
            setManualPayData({ booking_id: '', paid_amount: '', payment_method: 'cash' });
            loadAllData();
            showToast(data.message);
        } else {
            showToast(data.message || 'Gagal memproses pembayaran manual.', 'error');
        }
    };

    const handleRejectPayment = (id) => {
        showConfirm('Tolak pembayaran ini? Tenant akan diminta untuk mengupload ulang bukti pembayaran.', async () => {
            const res = await authFetch(`/api/bookings/${id}/reject-payment`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setShowVerifyPaymentModal(null);
                loadAllData();
                showToast(data.message);
            } else { showToast(data.message || 'Gagal menolak pembayaran.', 'error'); }
        });
    };

    const handleApproveBooking = (id) => {
        showConfirm('Aktifkan penyewaan ini?', async () => {
            const res = await authFetch(`/api/bookings/${id}/approve`, { method: 'POST' });
            if (res.ok) { loadAllData(); showToast('Penyewaan disetujui & Kamar aktif ditempati.'); }
            else { const d = await res.json(); showToast(d.message || 'Gagal approve.', 'error'); }
        });
    };

    const handleCheckoutBooking = (id) => {
        showConfirm('Apakah penghuni akan checkout dan mengosongkan kamar?', async () => {
            const res = await authFetch(`/api/bookings/${id}/checkout`, { method: 'POST' });
            if (res.ok) { loadAllData(); showToast('Proses checkout selesai. Kamar kembali tersedia.'); }
            else { const d = await res.json(); showToast(d.message || 'Gagal checkout.', 'error'); }
        });
    };

    const handleSendReminder = (id) => {
        showConfirm('Kirim pesan otomatis reminder WhatsApp via Fonnte?', async () => {
            const res = await authFetch(`/api/bookings/${id}/remind`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message);
            } else {
                showToast(data.message || 'Gagal mengirim pesan via Fonnte.', 'error');
            }
        });
    };

    const handleExtendBooking = async (e) => {
        e.preventDefault();
        const activeBooking = bookings.find(b => Number(b.tenant_id) === auth.user.id && (b.status === 'active' || b.status === 'pending'));
        if (!activeBooking) return;
        
        const res = await authFetch(`/api/bookings/${activeBooking.id}/extend`, {
            method: 'POST',
            body: JSON.stringify({ duration: extendDuration, extend_type: extendType || activeBooking.rental_type })
        });
        const data = await res.json();
        if (res.ok) {
            setShowExtendTenantModal(false);
            setExtendDuration(1);
            loadAllData();
            showToast(data.message);
        } else {
            showToast(data.message || 'Gagal memperpanjang masa sewa.', 'error');
        }
    };

    const handleChangeRoom = async (e) => {
        e.preventDefault();
        const res = await authFetch(`/api/bookings/${showChangeRoomModal.id}/change-room`, { method: 'POST', body: JSON.stringify({ new_room_id: newRoomIdInput }) });
        const data = await res.json();
        if (res.ok) { setShowChangeRoomModal(null); setNewRoomIdInput(''); loadAllData(); showToast(data.message); }
        else { showToast(data.message || 'Gagal pindah kamar.', 'error'); }
    };

    const handleExtendManualSubmit = async (e) => {
        e.preventDefault();
        if (!showExtendManualModal) return;
        setIsProcessing(true);
        try {
            const response = await authFetch(`/api/bookings/${showExtendManualModal.id}/extend-manual`, {
                method: 'POST',
                body: JSON.stringify(extendManualData)
            });
            const data = await response.json();
            if (response.ok) {
                showToast(data.message || 'Sewa berhasil diperpanjang');
                setShowExtendManualModal(null);
                setExtendManualData({ duration: 1, payment_status: 'paid', payment_method: 'cash' });
                loadAllData();
            } else {
                showToast(data.message || 'Terjadi kesalahan saat memperpanjang sewa', 'error');
            }
        } catch (error) {
            console.error('Error extending manual:', error);
            showToast('Terjadi kesalahan sistem saat memproses permintaan', 'error');
        } finally {
            setIsProcessing(false);
        }
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
        if (currentRole === 'operator' && !operatorBranches.some(b => Number(b) === Number(r.branch_id))) return false;
        if (currentRole === 'resident') {
            const resId = auth.user.id;
            if (!bookings.some(b => Number(b.room_id) === Number(r.id) && Number(b.tenant_id) === resId && b.status === 'active')) return false;
        }
        if (roomStatusFilter !== 'all' && r.status !== roomStatusFilter) return false;
        return true;
    });

    const visibleBookings = bookings.filter(b => {
        if (currentRole === 'operator' && !operatorBranches.some(br => Number(br) === Number(b.room?.branch_id))) return false;
        if (currentRole === 'resident' && Number(b.tenant_id) !== auth.user.id) return false;
        
        if (bookingSearch) {
            const query = bookingSearch.toLowerCase();
            const codeMatch = b.booking_code && b.booking_code.toLowerCase().includes(query);
            const nameMatch = b.tenant?.name && b.tenant.name.toLowerCase().includes(query);
            const roomMatch = b.room?.room_number && b.room.room_number.toString().toLowerCase().includes(query);
            const verifMatch = (query.includes('verif') || query.includes('tunggu')) && parseFloat(b.unverified_amount) > 0;
            if (!codeMatch && !nameMatch && !roomMatch && !verifMatch) return false;
        }
        
        return true;
    }).sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return new Date(a.end_date) - new Date(b.end_date);
    });

    const [bookingPage, setBookingPage] = useState(1);
    const bookingsPerPage = 7;

    useEffect(() => {
        setBookingPage(1);
    }, [bookingSearch]);

    const paginatedBookings = useMemo(() => {
        const startIndex = (bookingPage - 1) * bookingsPerPage;
        return visibleBookings.slice(startIndex, startIndex + bookingsPerPage);
    }, [visibleBookings, bookingPage]);

    const totalBookingPages = Math.ceil(visibleBookings.length / bookingsPerPage);

    const visibleComplaints = complaints.filter(c => {
        if (currentRole === 'operator') return operatorBranches.some(br => Number(br) === Number(c.room?.branch_id));
        if (currentRole === 'resident') return Number(c.tenant_id) === auth.user.id;
        return true;
    });

    const checkDateFilter = (dateStr) => {
        if (!dateStr || financeDateFilterType === 'all') return true;
        const d = new Date(dateStr);
        if (isNaN(d)) return true;
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        const localMonthStr = `${year}-${month}`;

        if (financeDateFilterType === 'daily') {
            if (!financeDateFilterStart) return true;
            return localDateStr === financeDateFilterStart;
        } else if (financeDateFilterType === 'monthly') {
            if (!financeDateFilterStart) return true;
            return localMonthStr === financeDateFilterStart;
        } else if (financeDateFilterType === 'yearly') {
            if (!financeDateFilterStart) return true;
            return year.toString() === financeDateFilterStart.toString();
        } else if (financeDateFilterType === 'custom') {
            if (financeDateFilterStart && localDateStr < financeDateFilterStart) return false;
            if (financeDateFilterEnd && localDateStr > financeDateFilterEnd) return false;
            return true;
        }
        return true;
    };

    const baseVisibleFinances = finances.filter(f => {
        if (!checkDateFilter(f.transaction_date)) return false;

        if (financeBranchFilter !== '') {
            if (Number(f.branch_id) !== Number(financeBranchFilter)) return false;
        }

        const isCanteen = f.description && f.description.toLowerCase().includes('kantin');
        if (financeTypeFilter === 'room' && isCanteen) return false;
        if (financeTypeFilter === 'canteen' && !isCanteen) return false;
        if (financeCategoryFilter !== 'all' && f.category !== financeCategoryFilter) return false;
        if (financePaymentMethodFilter !== 'all') {
            const method = f.payment_method || 'other';
            if (financePaymentMethodFilter === 'transfer' && method === 'qris') {
                // let it pass, since transfer filter includes QRIS visually "Transfer Bank / QRIS"
            } else if (method !== financePaymentMethodFilter) {
                return false;
            }
        }

        if (!financeSearch) return true;
        const q = financeSearch.toLowerCase();
        return (
            (f.category && f.category.toLowerCase().includes(q)) ||
            (f.description && f.description.toLowerCase().includes(q)) ||
            (f.booking?.tenant?.name && f.booking.tenant.name.toLowerCase().includes(q))
        );
    });

    const kasbonFinances = canteenOrders
        .filter(o => o.payment_status === 'debt_unpaid')
        .filter(o => {
            if (!checkDateFilter(o.created_at)) return false;

            if (financeBranchFilter !== '') {
                if (Number(o.branch_id) !== Number(financeBranchFilter)) return false;
            }

            if (financeTypeFilter === 'room') return false;
            if (financeCategoryFilter !== 'all' && financeCategoryFilter !== 'Kasbon Kantin') return false;
            if (financePaymentMethodFilter !== 'all' && financePaymentMethodFilter !== 'debt') return false;
            
            if (!financeSearch) return true;
            const q = financeSearch.toLowerCase();
            return (
                'kasbon kantin'.includes(q) ||
                (o.order_code && o.order_code.toLowerCase().includes(q)) ||
                (o.tenant?.name && o.tenant.name.toLowerCase().includes(q))
            );
        })
        .map(o => ({
            id: `kasbon-${o.id}`,
            transaction_date: o.created_at,
            created_at: o.created_at,
            category: 'Kasbon Kantin',
            description: `Kasbon Kantin: ${o.order_code} - ${o.tenant?.name || 'Unknown'}`,
            transaction_type: 'income',
            amount: o.total_amount,
            is_kasbon: true,
            payment_method: 'debt'
        }));

    const visibleFinances = [...baseVisibleFinances, ...kasbonFinances].sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

    // For resident/operator: only click to navigate for unpaid/expiry/checkout/rejected
    const shouldClickToNavigate = (notif) => {
        if (currentRole === 'resident' || currentRole === 'operator') {
            if (['unpaid_bill', 'payment_rejected', 'rental_expiry', 'daily_checkout_today'].includes(notif.type)) return true;
        }
        return false;
    };

    const getSimulatedResidentName = () => {
        if (auth.user.role === 'resident') return auth.user.name;
        const resId = auth.user.id;
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
            if (['payment_unverified', 'new_booking'].includes(notif.type)) {
                const booking = bookings.find(b => b.id === notif.meta?.booking_id);
                return booking && operatorBranches.includes(booking.room?.branch_id);
            }
            return false;
        }
        if (currentRole === 'resident') {
            const resId = auth.user.id;
            if (notif.meta?.booking_code) {
                return bookings.find(b => b.booking_code === notif.meta.booking_code)?.tenant_id === resId;
            }
            if (notif.meta?.booking_id) {
                return bookings.find(b => b.id === notif.meta.booking_id)?.tenant_id === resId;
            }
            if (notif.meta?.complaint_id !== undefined) {
                return complaints.find(c => c.id === notif.meta.complaint_id)?.tenant_id === resId;
            }
            return false;
        }
        return true;
    });

    const pendingComplaintsBadgeCount = visibleComplaints.filter(c => !['completed', 'ready'].includes(c.status)).length;

    // Menghitung jumlah alert untuk Penyewaan/Sewa (semua notifikasi kecuali komplain)
    const urgentSewaCount = visibleNotifications.filter(n => n.type !== 'new_complaint').length;
    const urgentNotifCount = visibleNotifications.filter(n => ['unpaid_bill', 'payment_rejected', 'rental_expiry', 'daily_checkout_today'].includes(n.type)).length;

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans print:bg-white print:block">
            <Head title="Admin Dashboard - Kospart PH 18" />

            {/* Sidebar */}
            <aside className={`hidden lg:flex inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 z-50 print:hidden`}>
                {/* Logo */}
                <div className="h-20 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <img loading="lazy" src="/images/Gemini_Generated_Image_6gwojj6gwojj6gwo-removebg-preview.png" alt="Kospart Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                    <div>
                        <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white block">KOSPART</span>
                        <span className="text-emerald-605 text-[10px] font-bold uppercase tracking-widest block -mt-1 dark:text-emerald-500">ADMIN PANEL</span>
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <nav className="p-4 flex-1 overflow-y-auto space-y-2">
                    {currentRole !== 'karyawan' && (
                        <>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest px-4 mt-2 mb-2 block">Utama</span>
                            <button aria-label="Action Button"  
                                onClick={() => setActiveTab('overview')} 
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === 'overview' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40 ring-1 ring-emerald-500/50 scale-[1.02]' : 'text-slate-500 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"></path></svg>
                                {currentRole === 'resident' ? 'Sewa Saya' : 'Ringkasan'}
                            </button>
                        </>
                    )}

                    {['super_admin', 'operator'].includes(currentRole) && (
                        <>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest px-4 mt-6 mb-2 block">Data Master</span>
                            {currentRole === 'super_admin' && (
                                <button aria-label="Action Button"  
                                    onClick={() => setActiveTab('branches')} 
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                        activeTab === 'branches' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40 ring-1 ring-emerald-500/50 scale-[1.02]' : 'text-slate-500 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                    Master Cabang
                                </button>
                            )}

                            <button aria-label="Action Button"  
                                onClick={() => setActiveTab('rooms')} 
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === 'rooms' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40 ring-1 ring-emerald-500/50 scale-[1.02]' : 'text-slate-500 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
                                Master Kamar
                            </button>
                        </>
                    )}

                    <>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest px-4 mt-6 mb-2 block">Layanan & Transaksi</span>
                        {currentRole !== 'karyawan' && (
                            <>
                                <button aria-label="Action Button"  
                                    onClick={() => setActiveTab('bookings')} 
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                        activeTab === 'bookings' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40 ring-1 ring-emerald-500/50 scale-[1.02]' : 'text-slate-500 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                        {currentRole === 'resident' ? 'Riwayat Pembayaran' : 'Penyewaan / Sewa'}
                                    </div>
                                    {urgentSewaCount > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                            {urgentSewaCount}
                                        </span>
                                    )}
                                </button>

                                <button aria-label="Action Button"  
                                    onClick={() => setActiveTab('complaints')} 
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                        activeTab === 'complaints' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40 ring-1 ring-emerald-500/50 scale-[1.02]' : 'text-slate-500 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20'
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
                            </>
                        )}

                        <button aria-label="Action Button"  
                            onClick={() => setActiveTab('canteen')} 
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === 'canteen' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40 ring-1 ring-emerald-500/50 scale-[1.02]' : 'text-slate-500 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                {currentRole === 'resident' ? 'Kantin Kos' : 'Master Kantin'}
                            </div>
                            {currentRole !== 'resident' && canteenOrders.filter(o => o.status === 'pending_approval' || o.status === 'processing').length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {canteenOrders.filter(o => o.status === 'pending_approval' || o.status === 'processing').length}
                                </span>
                            )}
                        </button>
                    </>

                    {['super_admin', 'operator'].includes(currentRole) && (
                        <>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest px-4 mt-6 mb-2 block">Laporan</span>
                            <button aria-label="Action Button"  
                                onClick={() => setActiveTab('finances')} 
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === 'finances' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40 ring-1 ring-emerald-500/50 scale-[1.02]' : 'text-slate-500 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Laporan Keuangan
                            </button>
                        </>
                    )}

                    {currentRole === 'super_admin' && (
                        <>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest px-4 mt-6 mb-2 block">Pengaturan Sistem</span>
                            <button aria-label="Action Button"  
                                onClick={() => setActiveTab('web_settings')} 
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === 'web_settings' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40 ring-1 ring-emerald-500/50 scale-[1.02]' : 'text-slate-500 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                                Konten Website
                            </button>

                            <button aria-label="Action Button"  
                                onClick={() => setActiveTab('users')} 
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === 'users' ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30 dark:shadow-emerald-900/40 ring-1 ring-emerald-500/50 scale-[1.02]' : 'text-slate-500 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                Manajemen Pengguna
                            </button>
                        </>
                    )}
                </nav>

                {/* Footer / User Profile info */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                            {auth.user.name.charAt(0)}
                        </div>
                        <div>
                            <span className="font-semibold text-sm block truncate text-slate-800 dark:text-white">{auth.user.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-500 block truncate">{auth.user.email}</span>
                            <span className="inline-block px-1.5 py-0.5 mt-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[9px] rounded font-bold uppercase tracking-wider">
                                {currentRole === 'super_admin' ? 'Admin' : currentRole === 'operator' ? 'Operator' : 'Tenant'}
                            </span>
                        </div>
                    </div>
                    
                    <Link 
                        href="/logout" 
                        method="post" 
                        as="button" 
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                        Sign Out
                    </Link>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-grow flex flex-col min-w-0 print:hidden">
                {/* Dashboard Top Header */}
                <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-sm">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        {/* Mobile Hamburger Button Removed */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                                <img loading="lazy" src="/images/logo 2.jpeg" alt="Logo Kospart" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-lg tracking-tight text-emerald-800 block leading-tight">KOSPART</span>
                                <span className="text-amber-500 text-[10px] font-bold tracking-[0.2em] uppercase block">PH 18 LAMPUNG</span>
                            </div>
                        </div>
                    </div>

                    {/* Notification Bell, Theme Toggle & Mobile Logout */}
                    <div className="relative flex items-center gap-3 ml-auto" ref={notifRef}>
                        <ThemeToggle />
                        <button aria-label="Action Button"  
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 text-slate-500 hover:text-emerald-600 transition-colors bg-slate-50 hover:bg-emerald-50 rounded-full border border-slate-200 hover:border-emerald-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                            {visibleNotifications.length > 0 && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                            )}
                        </button>
                        
                        <Link 
                            href="/logout" 
                            method="post" 
                            as="button"
                            aria-label="Logout"
                            className="lg:hidden relative p-2 text-rose-500 hover:text-white transition-colors bg-rose-50 hover:bg-rose-500 rounded-full border border-rose-200 hover:border-rose-500 flex items-center justify-center"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        </Link>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 top-12 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <h4 className="font-bold text-sm text-slate-800">Notifikasi</h4>
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{visibleNotifications.length} Baru</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {visibleNotifications.length === 0 ? (
                                        <div className="p-6 text-center text-slate-500">
                                            <p className="text-xs">Tidak ada notifikasi baru</p>
                                        </div>
                                    ) : (
                                        visibleNotifications.map((notif, idx) => (
                                            <div key={idx} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors text-xs">
                                                <div className="flex gap-3">
                                                    <div className={`w-2 h-2 mt-1 rounded-full shrink-0 ${
                                                        ['unpaid_bill', 'payment_rejected', 'canteen_debt'].includes(notif.type) ? 'bg-red-500' :
                                                        ['rental_expiry', 'canteen_admin'].includes(notif.type) ? 'bg-amber-500' :
                                                        ['payment_unverified'].includes(notif.type) ? 'bg-blue-500' :
                                                        'bg-emerald-500'
                                                    }`}></div>
                                                    <div>
                                                        <strong className="block font-bold text-slate-800 mb-0.5">{notif.title}</strong>
                                                        <span className="block text-slate-500 leading-relaxed">{notif.message}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Toast Notification Container */}
                <div className="fixed top-24 right-8 z-50 flex flex-col gap-3 max-w-sm">
                    {toasts.map(toast => (
                        <div key={toast.id} onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className={`p-4 rounded-xl border shadow-xl flex gap-3 animate-float cursor-pointer hover:opacity-90 transition-opacity ${toast.color}`}>
                            <div className="shrink-0 mt-0.5">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                            </div>
                            <div>
                                <h4 className="font-extrabold text-xs uppercase tracking-wider">{toast.title}</h4>
                                <p className="text-slate-650 text-[11px] mt-1 leading-relaxed font-medium">{toast.message}</p>
                                <span className="text-[10px] text-slate-500 dark:text-slate-500 block mt-2 font-bold underline uppercase">Klik untuk menutup</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dashboard Workspace */}
                <main className="flex-grow p-4 md:p-8 overflow-y-auto pb-24 lg:pb-8">
                    
                    {/* Ringkasan Dashboard (Tab: Overview) */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Summary Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {currentRole === 'resident' ? (
                                    <>
                                        {/* Card 1: Kamar Saya */}
                                        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Kamar Saya</span>
                                                <span className="text-slate-900 font-extrabold text-2xl block mt-1">
                                                    {(() => {
                                                        const resId = auth.user.id;
                                                        const activeBooking = bookings.find(b => b.tenant_id === resId && b.status === 'active');
                                                        const booking = activeBooking || bookings.find(b => b.tenant_id === resId);
                                                        return booking ? `Kamar ${booking.room?.room_number || '-'}` : 'Belum Ada';
                                                    })()}
                                                </span>
                                                <span className="text-xs text-slate-500 block mt-1">
                                                    {(() => {
                                                        const resId = auth.user.id;
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
                                                        const resId = auth.user.id;
                                                        const activeBooking = bookings.find(b => b.tenant_id === resId && b.status === 'active');
                                                        const booking = activeBooking || bookings.find(b => b.tenant_id === resId);
                                                        return booking ? (booking.status === 'active' ? 'Aktif' : booking.status === 'pending' ? 'Pending' : 'Selesai') : 'Tidak Aktif';
                                                    })()}
                                                </span>
                                                <span className="text-xs text-slate-500 block mt-1">
                                                    {(() => {
                                                        const resId = auth.user.id;
                                                        const activeBooking = bookings.find(b => b.tenant_id === resId && b.status === 'active');
                                                        const booking = activeBooking || bookings.find(b => b.tenant_id === resId);
                                                        return booking ? `Sewa ${booking.rental_type === 'daily' ? 'Harian' : (booking.rental_type === 'weekly' ? 'Mingguan' : (booking.rental_type === 'monthly' ? 'Bulanan' : 'Tahunan'))}` : 'Hubungi pengelola';
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
                                                        const resId = auth.user.id;
                                                        const activeBooking = bookings.find(b => b.tenant_id === resId && b.status === 'active');
                                                        const booking = activeBooking || bookings.find(b => b.tenant_id === resId);
                                                        return booking ? `Rp ${parseFloat(booking.total_amount).toLocaleString('id-ID')}` : 'Rp 0';
                                                    })()}
                                                </span>
                                                <span className="text-xs font-bold block mt-1">
                                                    {(() => {
                                                        const resId = auth.user.id;
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
                                                    {visibleComplaints.filter(c => !['completed', 'ready'].includes(c.status)).length}
                                                </span>
                                                <span className="text-xs text-slate-500 block mt-1">Aduan dalam proses</span>
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
                                                <span className="text-slate-900 font-extrabold text-3xl block mt-1">{stats.availableRooms || 0} <span className="text-xs text-slate-500 font-normal">/ {stats.totalRooms || 0}</span></span>
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
                                    <div className="lg:col-span-12 glass-panel p-6 rounded-2xl flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-extrabold text-lg text-slate-900">Grafik Keuangan Laba Rugi</h3>
                                            <p className="text-xs text-slate-550">Menampilkan grafik pemasukan vs pengeluaran 6 bulan terakhir.</p>
                                        </div>
                                        <div className="h-72 mt-6 relative">
                                            <canvas ref={chartRef}></canvas>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── RIWAYAT & PROGRESS khusus TENANT ── */}
                            {currentRole === 'resident' && (() => {
                                const resId = auth.user.id;
                                const myBookings = bookings.filter(b => b.tenant_id === resId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                                const activeBooking = myBookings.find(b => b.status === 'active') || myBookings.find(b => b.status === 'pending');
                                const myComplaints = visibleComplaints.filter(c => c.tenant_id === resId);
                                const paid  = parseFloat(activeBooking?.paid_amount || 0);
                                const total = parseFloat(activeBooking?.total_amount || 0);
                                const progressPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                                const today    = new Date();
                                const endDate  = activeBooking ? new Date(activeBooking.end_date) : null;
                                if (endDate && activeBooking.rental_type === 'daily') {
                                    endDate.setHours(14, 0, 0, 0); // Checkout 14:00
                                }
                                const diffMs = endDate ? (endDate - today) : null;
                                const sisaHari = endDate ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : null;

                                let sisaText = '';
                                if (activeBooking && endDate) {
                                    if (activeBooking.rental_type === 'daily') {
                                        if (diffMs > 0) {
                                            const h = Math.floor(diffMs / (1000 * 60 * 60));
                                            const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                            sisaText = `${h} Jam ${m} Menit`;
                                        } else {
                                            sisaText = 'Waktu Checkout Telah Tiba';
                                        }
                                    } else {
                                        sisaText = sisaHari > 0 ? `${sisaHari} hari lagi` : sisaHari === 0 ? 'Berakhir hari ini!' : 'Sudah berakhir';
                                    }
                                }

                                return (
                                    <div className="grid lg:grid-cols-12 gap-6 mt-2">

                                        {/* Progress Pembayaran + Detail Kamar */}
                                        <div className="lg:col-span-5 min-w-0 glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
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
                                                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
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
                                                        <div className="flex justify-between gap-2"><span className="text-slate-500 text-xs shrink-0">Kamar</span><span className="font-bold text-slate-800 text-right truncate">No. {activeBooking.room?.room_number}</span></div>
                                                        <div className="flex justify-between gap-2"><span className="text-slate-500 text-xs shrink-0">Cabang</span><span className="font-semibold text-slate-700 text-xs text-right truncate">{(activeBooking.room?.branch?.name || '').replace('Kospart PH 18 - ', '')}</span></div>
                                                        <div className="flex justify-between gap-2"><span className="text-slate-500 text-xs shrink-0">Tipe Sewa</span><span className="font-semibold text-slate-700 text-xs text-right truncate">{activeBooking.rental_type === 'daily' ? 'Harian' : (activeBooking.rental_type === 'weekly' ? 'Mingguan' : (activeBooking.rental_type === 'monthly' ? 'Bulanan' : 'Tahunan'))}</span></div>
                                                        <div className="flex justify-between gap-2 border-t border-slate-200 pt-2"><span className="text-slate-500 text-xs shrink-0">Check-in</span><span className="font-semibold text-slate-700 text-xs text-right truncate">{new Date(activeBooking.start_date).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}</span></div>
                                                        <div className="flex justify-between gap-2"><span className="text-slate-500 text-xs shrink-0">Check-out</span><span className="font-semibold text-slate-700 text-xs text-right truncate">{endDate.toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}{activeBooking.rental_type === 'daily' ? ' 14:00' : ''}</span></div>
                                                        {sisaText !== '' && (
                                                            <div className={`flex justify-between border-t border-slate-200 pt-2 text-xs font-bold ${diffMs <= (3 * 24 * 60 * 60 * 1000) ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                <span>Sisa Masa Sewa</span>
                                                                <span>{sisaText}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                                                        {activeBooking.payment_status !== 'paid' && (
                                                            parseFloat(activeBooking.unverified_amount) > 0 ? (
                                                                <button aria-label="Action Button" 
                                                                    disabled
                                                                    className="w-full py-2.5 bg-slate-100 text-slate-500 font-bold rounded-xl text-sm border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed"
                                                                >
                                                                    ⏳ Verifikasi
                                                                </button>
                                                            ) : (
                                                                <button aria-label="Action Button" 
                                                                    onClick={() => { setShowPaymentModal(activeBooking); setPaymentData({ paid_amount: String(Math.max(0, total - paid)), payment_proof_file: null }); setPaymentErrors({}); }}
                                                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2"
                                                                >
                                                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                                    Bayar
                                                                </button>
                                                            )
                                                        )}
                                                        <button aria-label="Action Button"  onClick={() => setShowExtendTenantModal(true)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-700/20 flex items-center justify-center gap-2">
                                                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                            Perpanjang
                                                        </button>
                                                        <button aria-label="Action Button"  onClick={() => setShowInvoiceModal(activeBooking)} className="w-full py-2.5 bg-white text-slate-700 font-bold rounded-xl text-sm border border-slate-200 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center">
                                                            Invoice
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center py-8 text-slate-500">
                                                    <div className="text-4xl mb-2">🏠</div>
                                                    <p className="text-sm font-semibold">Belum ada hunian aktif</p>
                                                    <p className="text-xs mt-1">Hubungi pengelola untuk proses booking</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Riwayat Pembayaran */}
                                        <div className="lg:col-span-4 min-w-0 glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 mb-4">💳 Riwayat Pembayaran</h3>
                                            {(() => {
                                                const myFinances = finances.filter(f => f.booking_id === activeBooking?.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                                                return myFinances.length === 0 ? (
                                                    <div className="text-center py-8 text-slate-500">
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
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="text-xs font-bold text-slate-800">Rp {parseFloat(f.amount).toLocaleString('id-ID')}</p>
                                                                                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{f.description}</p>
                                                                                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{new Date(f.transaction_date).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}</p>
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
                                            <button aria-label="Action Button"  onClick={() => setActiveTab('bookings')} className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-all">
                                                Ke Pembayaran →
                                            </button>
                                        </div>

                                        {/* Status Komplain */}
                                        <div className="lg:col-span-3 min-w-0 glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-extrabold text-base text-slate-800">🔧 Komplain</h3>
                                                {myComplaints.filter(c => !['completed', 'ready'].includes(c.status)).length > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                                        {myComplaints.filter(c => !['completed', 'ready'].includes(c.status)).length}
                                                    </span>
                                                )}
                                            </div>
                                            {myComplaints.length === 0 ? (
                                                <div className="text-center py-6 text-slate-500">
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
                                                                <div className="mt-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 rounded-lg p-2">
                                                                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wide">Respon Pengelola:</p>
                                                                    <p className="text-xs text-emerald-900 dark:text-emerald-200 mt-1 leading-relaxed">{c.admin_response}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <button aria-label="Action Button"  onClick={() => setActiveTab('complaints')} className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-sm">
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
                                <h3 className="font-extrabold text-lg text-slate-900 mb-4 border-b border-slate-100 pb-3">Tambah Cabang Kos Baru</h3>
                                <form onSubmit={handleAddBranch} className="space-y-5">
                                    {/* Kategori: Informasi Umum */}
                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            Informasi Cabang
                                        </h4>
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 block mb-2">Nama Cabang *</label>
                                                <input 
                                                    type="text" 
                                                    required 
                                                    value={newBranch.name} 
                                                    onChange={(e) => setNewBranch({...newBranch, name: e.target.value})} 
                                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                    placeholder="Kospart PH 18 - Executive"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 block mb-2">Alamat Cabang *</label>
                                                <input 
                                                    type="text" 
                                                    required 
                                                    value={newBranch.address} 
                                                    onChange={(e) => setNewBranch({...newBranch, address: e.target.value})} 
                                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                    placeholder="Jl. PH H. Mustofa No. 20"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 block mb-2">Link Google Maps</label>
                                                <input 
                                                    type="url" 
                                                    value={newBranch.maps_link} 
                                                    onChange={(e) => setNewBranch({...newBranch, maps_link: e.target.value})} 
                                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                    placeholder="https://maps.app.goo.gl/..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Kategori: Media & Dokumentasi */}
                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            Media & Dokumentasi
                                        </h4>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 block mb-2">Foto Cabang</label>
                                                
                                                {/* Image Preview */}
                                                {newBranch.image && (
                                                    <div className="relative group w-24 h-16 rounded-xl overflow-hidden border border-emerald-200 bg-slate-100 flex items-center justify-center mb-2">
                                                        <img loading="lazy" src={URL.createObjectURL(newBranch.image)} alt="preview" className="w-full h-full object-cover" />
                                                        <button aria-label="Action Button"  type="button" onClick={() => setNewBranch({...newBranch, image: null})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">&times;</button>
                                                    </div>
                                                )}

                                                <DragDropZone
                                                    accept="image/*"
                                                    label="Tarik & Lepas Foto Cabang"
                                                    selectedFile={newBranch.image}
                                                    onFileDrop={(file) => setNewBranch({ ...newBranch, image: file })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 block mb-2">Video Cabang (Opsional)</label>
                                                
                                                {/* Video Preview */}
                                                {newBranch.video && (
                                                    <div className="relative group w-24 h-16 rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50 flex items-center justify-center mb-2">
                                                        <svg className="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                        <button aria-label="Action Button"  type="button" onClick={() => setNewBranch({...newBranch, video: null})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">&times;</button>
                                                    </div>
                                                )}

                                                <DragDropZone
                                                    accept="video/mp4,video/x-m4v,video/*"
                                                    label="Tarik & Lepas Video Cabang"
                                                    selectedFile={newBranch.video}
                                                    onFileDrop={(file) => setNewBranch({ ...newBranch, video: file })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-slate-100">
                                        <button aria-label="Action Button"  type="submit" className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300">
                                            Simpan Cabang Baru
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* List Cabang */}
                            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                <div className="overflow-x-auto w-full"><table className="w-full whitespace-nowrap min-w-max text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                                            <th className="p-4 pl-6">ID</th>
                                            <th className="p-4">Nama Cabang</th>
                                            <th className="p-4">Alamat</th>
                                            <th className="p-4">Media</th>
                                            <th className="p-4">Maps Link</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 pr-6">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {branches.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="p-8 text-center text-slate-500">
                                                    Belum ada data cabang.
                                                </td>
                                            </tr>
                                        ) : branches.map(b => (
                                            <tr key={b.id} className="hover:bg-slate-50">
                                                <td className="p-4 pl-6 font-mono text-slate-500">{b.id}</td>
                                                <td className="p-4 font-bold text-slate-800">{b.name}</td>
                                                <td className="p-4 text-slate-600">{b.address || '-'}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {b.image_path ? (
                                                            <a href={b.image_path} target="_blank" rel="noopener noreferrer">
                                                                <img loading="lazy" src={b.image_path} alt="Foto Cabang" className="w-10 h-10 object-cover rounded-lg border border-slate-200 hover:scale-110 transition-transform" />
                                                            </a>
                                                        ) : <span className="text-xs text-slate-500">No Image</span>}
                                                        
                                                        {b.video_path && (
                                                            <a href={b.video_path} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Lihat Video">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {b.maps_link ? (
                                                        <a href={b.maps_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline">Buka Maps</a>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-4"><span className={`px-2.5 py-0.5 border text-xs rounded-full font-semibold ${b.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>{b.status === 'active' ? 'Aktif' : 'Tidak Aktif'}</span></td>
                                                <td className="p-4 pr-6 flex gap-2">
                                                    <button aria-label="Action Button"  onClick={() => setEditBranch({ ...b, image: null, video: null, remove_image: false, remove_video: false })} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-xs">Edit</button>
                                                    <button aria-label="Action Button"  onClick={() => handleDeleteBranch(b.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-xs">Hapus</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table></div>
                            </div>
                            
                            {/* Modal Edit Cabang */}
                            {editBranch && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto" style={{ animation: 'modalIn 0.3s ease' }}>
                                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full shadow-2xl shadow-emerald-900/20 border border-white/60 max-h-[90vh] overflow-y-auto">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-extrabold text-2xl text-slate-800 dark:text-white tracking-tight">Edit Cabang Kos</h3>
                                            <button aria-label="Action Button"  onClick={() => setEditBranch(null)} className="text-slate-500 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2 transition-all duration-300 hover:rotate-90">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            </button>
                                        </div>
                                        <form onSubmit={handleEditBranchSubmit} className="space-y-5">
                                            {/* Kategori: Informasi Umum */}
                                            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    Informasi Cabang
                                                </h4>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Nama Cabang</label>
                                                        <input 
                                                            type="text" 
                                                            required 
                                                            value={editBranch.name} 
                                                            onChange={(e) => setEditBranch({...editBranch, name: e.target.value})} 
                                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Status</label>
                                                        <select 
                                                            value={editBranch.status} 
                                                            onChange={(e) => setEditBranch({...editBranch, status: e.target.value})} 
                                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                        >
                                                            <option value="active">Aktif</option>
                                                            <option value="inactive">Tidak Aktif</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1 md:col-span-2">
                                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Alamat Cabang</label>
                                                        <input 
                                                            type="text" 
                                                            required 
                                                            value={editBranch.address} 
                                                            onChange={(e) => setEditBranch({...editBranch, address: e.target.value})} 
                                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1 md:col-span-2">
                                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Link Google Maps</label>
                                                        <input 
                                                            type="url" 
                                                            value={editBranch.maps_link} 
                                                            onChange={(e) => setEditBranch({...editBranch, maps_link: e.target.value})} 
                                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Kategori: Media & Dokumentasi */}
                                            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    Media & Dokumentasi
                                                </h4>
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 block">Foto Cabang</label>
                                                {(editBranch.image_path || editBranch.image) && !editBranch.remove_image && (
                                                    <div className="relative group w-24 h-16 rounded-xl overflow-hidden border border-slate-200 mb-2">
                                                        {editBranch.image ? (
                                                            <img loading="lazy" src={URL.createObjectURL(editBranch.image)} alt="new" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <img loading="lazy" src={editBranch.image_path} alt="existing" className="w-full h-full object-cover" />
                                                        )}
                                                        <button aria-label="Action Button"  type="button" onClick={() => {
                                                            if (editBranch.image) setEditBranch({...editBranch, image: null});
                                                            else setEditBranch({...editBranch, remove_image: true});
                                                        }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">&times;</button>
                                                    </div>
                                                )}

                                                <div className="flex-1">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Ubah Foto Cabang (Opsional)</label>
                                                    <DragDropZone
                                                        accept="image/*"
                                                        label="Tarik & Lepas Foto Baru"
                                                        selectedFile={editBranch.image}
                                                        onFileDrop={(file) => setEditBranch({ ...editBranch, image: file, remove_image: false })}
                                                    />
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-sm text-slate-500 truncate max-w-[150px]">
                                                            {editBranch.remove_image ? <span className="text-red-500 font-semibold italic">Akan dihapus</span> : 
                                                             editBranch.image ? <span className="text-emerald-600 font-semibold">{editBranch.image.name}</span> : 
                                                             (editBranch.image_path && <span className="text-slate-500">Ada foto tersimpan</span>)}
                                                        </span>
                                                        {editBranch.image_path && !editBranch.remove_image && (
                                                            <button aria-label="Action Button"  type="button" onClick={() => setEditBranch({...editBranch, remove_image: true, image: null})} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors">
                                                                Hapus Foto
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 block">Video Cabang (Opsional)</label>

                                                {(editBranch.video_path || editBranch.video) && !editBranch.remove_video && (
                                                    <div className="relative group w-24 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center mb-2">
                                                        <svg className={`w-8 h-8 ${editBranch.video ? 'text-emerald-400' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                        <button aria-label="Action Button"  type="button" onClick={() => {
                                                            if (editBranch.video) setEditBranch({...editBranch, video: null});
                                                            else setEditBranch({...editBranch, remove_video: true});
                                                        }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">&times;</button>
                                                    </div>
                                                )}

                                                <div className="flex-1">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Ubah Video Cabang (Opsional)</label>
                                                    <DragDropZone
                                                        accept="video/mp4,video/x-m4v,video/*"
                                                        label="Tarik & Lepas Video Baru"
                                                        selectedFile={editBranch.video}
                                                        onFileDrop={(file) => setEditBranch({ ...editBranch, video: file, remove_video: false })}
                                                    />
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-sm text-slate-500 truncate max-w-[150px]">
                                                            {editBranch.remove_video ? <span className="text-red-500 font-semibold italic">Akan dihapus</span> : 
                                                             editBranch.video ? <span className="text-emerald-600 font-semibold">{editBranch.video.name}</span> : 
                                                             (editBranch.video_path && <span className="text-slate-500">Ada video tersimpan</span>)}
                                                        </span>
                                                        {editBranch.video_path && !editBranch.remove_video && (
                                                            <button aria-label="Action Button"  type="button" onClick={() => setEditBranch({...editBranch, remove_video: true, video: null})} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors">
                                                                Hapus Video
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            </div>
                                            </div>
                                            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                                                <button aria-label="Action Button"  type="button" onClick={() => setEditBranch(null)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">Batal</button>
                                                <button aria-label="Action Button"  type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all">Simpan Perubahan</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Master Kamar (Tab: Rooms) */}
                    {activeTab === 'rooms' && ['super_admin', 'operator'].includes(currentRole) && (
                        <div className="space-y-8">
                            {/* Form Tambah */}
                            {currentRole === 'super_admin' && (
                                <div className="glass-panel p-8 rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50">
                                <h3 className="font-extrabold text-2xl text-slate-800 dark:text-white tracking-tight mb-4 border-b border-slate-100 pb-4">Tambah Kamar Baru</h3>
                                <form onSubmit={handleAddRoom} className="space-y-5">
                                    {/* Kategori: Informasi Dasar */}
                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                            Informasi Dasar
                                        </h4>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 block mb-2">Pilih Cabang *</label>
                                                <select 
                                                    required
                                                    value={newRoom.branch_id}
                                                    onChange={(e) => setNewRoom({...newRoom, branch_id: e.target.value})}
                                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                >
                                                    <option value="">-- Pilih Cabang --</option>
                                                    {branches.map(b => (
                                                        <option key={b.id} value={b.id}>{b.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 block mb-2">Nomor Kamar *</label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={newRoom.room_number}
                                                    onChange={(e) => setNewRoom({...newRoom, room_number: e.target.value})}
                                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                    placeholder="105"
                                                />
                                            </div>
                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-xs font-semibold text-slate-500 block mb-2">Fasilitas (pisahkan dengan koma)</label>
                                                <input 
                                                    type="text" 
                                                    value={newRoom.facilities}
                                                    onChange={(e) => setNewRoom({...newRoom, facilities: e.target.value})}
                                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                    placeholder="AC, Wi-Fi, Kamar Mandi Dalam, Kasur Springbed"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Kategori: Pengaturan Harga */}
                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            Pengaturan Harga Sewa
                                        </h4>
                                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 block mb-2">Harga Harian (Rp) *</label>
                                                <input 
                                                    type="number" 
                                                    required
                                                    value={newRoom.price_daily}
                                                    onChange={(e) => setNewRoom({...newRoom, price_daily: e.target.value})}
                                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                    placeholder="150000"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 block mb-2">Harga Mingguan (Rp) *</label>
                                                <input 
                                                    type="number" 
                                                    required
                                                    value={newRoom.price_weekly}
                                                    onChange={(e) => setNewRoom({...newRoom, price_weekly: e.target.value})}
                                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                    placeholder="850000"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 block mb-2">Harga Bulanan (Rp) *</label>
                                                <input 
                                                    type="number" 
                                                    required
                                                    value={newRoom.price_monthly}
                                                    onChange={(e) => setNewRoom({...newRoom, price_monthly: e.target.value})}
                                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                    placeholder="1200000"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-500 block mb-2">Harga Tahunan (Rp) *</label>
                                                <input 
                                                    type="number" 
                                                    required
                                                    value={newRoom.price_yearly}
                                                    onChange={(e) => setNewRoom({...newRoom, price_yearly: e.target.value})}
                                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                    placeholder="12000000"
                                                />
                                            </div>
                                            <div className="space-y-1 lg:col-span-4">
                                                <label className="text-xs font-semibold text-slate-500 block mb-2">Harga Weekend (Opsional)</label>
                                                <input 
                                                    type="number" 
                                                    value={newRoom.price_weekend}
                                                    onChange={(e) => setNewRoom({...newRoom, price_weekend: e.target.value})}
                                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white lg:w-1/4"
                                                    placeholder="opsional"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Kategori: Media & Dokumentasi */}
                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            Media & Dokumentasi
                                        </h4>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 block mb-2">Upload Foto Kamar (Bisa lebih dari 1)</label>
                                            
                                            {/* Previews */}
                                            {newRoom.photos?.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {Array.from(newRoom.photos).map((file, idx) => (
                                                        <div key={`new-photo-${idx}`} className="relative group w-24 h-16 rounded-xl overflow-hidden border border-emerald-200">
                                                            <img loading="lazy" src={URL.createObjectURL(file)} alt="new" className="w-full h-full object-cover" />
                                                            <button aria-label="Action Button"  type="button" onClick={() => setNewRoom({...newRoom, photos: Array.from(newRoom.photos).filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">&times;</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <DragDropZone
                                                accept="image/*"
                                                multiple={true}
                                                label="Tarik & Lepas Foto (Bisa lebih dari 1)"
                                                selectedFile={newRoom.photos}
                                                onFileDrop={(files) => {
                                                    const existingFiles = newRoom.photos ? Array.from(newRoom.photos) : [];
                                                    setNewRoom({...newRoom, photos: [...existingFiles, ...files]});
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 block">Upload Video (Opsional, max 20MB)</label>
                                            
                                            {/* Previews */}
                                            {newRoom.videos?.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {Array.from(newRoom.videos).map((file, idx) => (
                                                        <div key={`new-video-${idx}`} className="relative group w-24 h-16 rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50 flex items-center justify-center">
                                                            <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                            <button aria-label="Action Button"  type="button" onClick={() => setNewRoom({...newRoom, videos: Array.from(newRoom.videos).filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">&times;</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <DragDropZone
                                                accept="video/mp4,video/x-m4v,video/*"
                                                multiple={true}
                                                label="Tarik & Lepas Video (Opsional, Bisa lebih dari 1)"
                                                selectedFile={newRoom.videos}
                                                onFileDrop={(files) => {
                                                    const existingFiles = newRoom.videos ? Array.from(newRoom.videos) : [];
                                                    setNewRoom({...newRoom, videos: [...existingFiles, ...files]});
                                                }}
                                            />
                                        </div>
                                    </div>
                                    </div>
                                    <div className="flex justify-end pt-4 mt-2 border-t border-slate-100">
                                        <button aria-label="Action Button"  type="submit" className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300">
                                            Simpan Kamar Baru
                                        </button>
                                    </div>
                                    </form>
                                </div>
                            )}

                            {/* List Kamar */}
                            <div className="flex justify-between items-center mb-4 mt-8">
                                <h3 className="font-extrabold text-xl text-slate-800 dark:text-white tracking-tight">Daftar Kamar</h3>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-slate-500 hidden sm:block">Filter Status:</span>
                                    <select 
                                        value={roomStatusFilter} 
                                        onChange={(e) => setRoomStatusFilter(e.target.value)}
                                        className="glass-input rounded-xl px-4 py-2 text-sm bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white border border-slate-200 shadow-sm focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                                    >
                                        <option value="all">Semua Kamar</option>
                                        <option value="available">Tersedia</option>
                                        <option value="occupied">Penuh / Dihuni</option>
                                        <option value="cleaning">Sedang Dibersihkan</option>
                                    </select>
                                </div>
                            </div>
                            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                <div className="overflow-x-auto w-full"><table className="w-full whitespace-nowrap min-w-max text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                                            <th className="p-4 pl-6">No. Kamar</th>
                                            <th className="p-4">Cabang</th>
                                            <th className="p-4">Sewa Bulanan</th>
                                            <th className="p-4">Sewa Harian</th>
                                            <th className="p-4">Media</th>
                                            <th className="p-4">Fasilitas</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 pr-6">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {visibleRooms.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="p-8 text-center text-slate-500">
                                                    Belum ada data kamar.
                                                </td>
                                            </tr>
                                        ) : visibleRooms.map(room => (
                                            <tr key={room.id} className="hover:bg-slate-50">
                                                <td className="p-4 pl-6 font-bold text-slate-800 font-mono">No. {room.room_number}</td>
                                                <td className="p-4 text-slate-600">{room.branch.name.replace('Kospart PH 18 - ', '')}</td>
                                                <td className="p-4 font-mono text-slate-700">Rp {parseFloat(room.price_monthly).toLocaleString('id-ID')}</td>
                                                <td className="p-4 font-mono text-emerald-600">Rp {parseFloat(room.price_daily).toLocaleString('id-ID')}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {room.photos && room.photos.length > 0 ? (
                                                            <a href={room.photos[0]} target="_blank" rel="noopener noreferrer">
                                                                <img loading="lazy" src={room.photos[0]} alt={`Kamar ${room.room_number}`} className="w-10 h-10 object-cover rounded-lg border border-slate-200 hover:scale-110 transition-transform" />
                                                            </a>
                                                        ) : <span className="text-xs text-slate-500">No Image</span>}
                                                        
                                                        {room.videos && room.videos.length > 0 && room.videos.map((vid, idx) => (
                                                            <a key={`vid-${idx}`} href={vid} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title={`Lihat Video ${idx+1}`}>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                                        {room.facilities && JSON.parse(JSON.stringify(room.facilities)).map((fac, idx) => (
                                                            <span key={idx} className="bg-slate-50 border border-slate-100 text-[10px] px-1.5 py-0.5 rounded text-slate-600 font-medium">{fac}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-2">
                                                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${
                                                            room.status === 'available' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                            room.status === 'occupied' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                            room.status === 'booked' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                            room.status === 'maintenance' ? 'bg-slate-700 text-white border border-slate-800' :
                                                            room.status === 'cleaning' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                            'bg-slate-50 text-slate-500 border border-slate-200'
                                                        }`}>
                                                            {room.status === 'available' ? 'Tersedia' : 
                                                             room.status === 'occupied' ? 'Terisi' : 
                                                             room.status === 'booked' ? 'Dibooking' : 
                                                             room.status === 'maintenance' ? 'Maintenance' : 
                                                             room.status === 'cleaning' ? 'Pembersihan' : room.status}
                                                        </span>
                                                        
                                                        {room.status === 'cleaning' && ['super_admin', 'operator'].includes(currentRole) && (
                                                            <button aria-label="Action Button" 
                                                                onClick={() => handleFinishCleaning(room.id)}
                                                                className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded-lg transition-colors"
                                                            >
                                                                Selesai Bersihkan
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 pr-6 flex gap-2">
                                                    {currentRole === 'super_admin' ? (
                                                        <>
                                                            <button aria-label="Action Button"  onClick={() => setEditRoom({ ...room, facilities: room.facilities.join(', '), existing_photos: room.photos || [], existing_videos: room.videos || [], new_photos: [], new_videos: [] })} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold text-xs">Edit</button>
                                                            <button aria-label="Action Button"  onClick={() => handleDeleteRoom(room.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-xs">Hapus</button>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-slate-500 italic">Read-only</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table></div>
                            </div>
                            
                            {/* Modal Edit Kamar */}
                            {editRoom && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto" style={{ animation: 'modalIn 0.3s ease' }}>
                                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-4xl w-full shadow-2xl shadow-emerald-900/20 border border-white/60 max-h-[90vh] overflow-y-auto">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-extrabold text-2xl text-slate-800 dark:text-white tracking-tight">Edit Kamar</h3>
                                            <button aria-label="Action Button"  onClick={() => setEditRoom(null)} className="text-slate-500 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2 transition-all duration-300 hover:rotate-90">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            </button>
                                        </div>
                                        <form onSubmit={handleEditRoomSubmit} className="space-y-5">
                                            {/* Kategori: Informasi Dasar */}
                                            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                                    Informasi Dasar
                                                </h4>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Cabang</label>
                                                        <select 
                                                            required
                                                            value={editRoom.branch_id}
                                                            onChange={(e) => setEditRoom({...editRoom, branch_id: e.target.value})}
                                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                        >
                                                            {branches.map(b => (
                                                                <option key={b.id} value={b.id}>{b.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Nomor Kamar</label>
                                                        <input 
                                                            type="text" 
                                                            required
                                                            value={editRoom.room_number}
                                                            onChange={(e) => setEditRoom({...editRoom, room_number: e.target.value})}
                                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1 md:col-span-2">
                                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Status</label>
                                                        <select 
                                                            value={editRoom.status}
                                                            onChange={(e) => setEditRoom({...editRoom, status: e.target.value})}
                                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                        >
                                                            <option value="available">Tersedia</option>
                                                            <option value="occupied">Terisi</option>
                                                            <option value="booked">Dibooking</option>
                                                            <option value="maintenance">Maintenance</option>
                                                            <option value="cleaning">Pembersihan</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1 md:col-span-2">
                                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Fasilitas (pisahkan dengan koma)</label>
                                                        <input 
                                                            type="text" 
                                                            value={editRoom.facilities}
                                                            onChange={(e) => setEditRoom({...editRoom, facilities: e.target.value})}
                                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Kategori: Pengaturan Harga */}
                                            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    Pengaturan Harga Sewa
                                                </h4>
                                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Harga Harian (Rp)</label>
                                                        <input 
                                                            type="number" 
                                                            required
                                                            value={editRoom.price_daily}
                                                            onChange={(e) => setEditRoom({...editRoom, price_daily: e.target.value})}
                                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Harga Mingguan (Rp)</label>
                                                        <input 
                                                            type="number" 
                                                            required
                                                            value={editRoom.price_weekly}
                                                            onChange={(e) => setEditRoom({...editRoom, price_weekly: e.target.value})}
                                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Harga Bulanan (Rp)</label>
                                                        <input 
                                                            type="number" 
                                                            required
                                                            value={editRoom.price_monthly}
                                                            onChange={(e) => setEditRoom({...editRoom, price_monthly: e.target.value})}
                                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Harga Tahunan (Rp)</label>
                                                        <input 
                                                            type="number" 
                                                            required
                                                            value={editRoom.price_yearly}
                                                            onChange={(e) => setEditRoom({...editRoom, price_yearly: e.target.value})}
                                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-1 lg:col-span-4">
                                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Harga Weekend (Jumat-Minggu)</label>
                                                        <input 
                                                            type="number" 
                                                            value={editRoom.price_weekend || ''}
                                                            onChange={(e) => setEditRoom({...editRoom, price_weekend: e.target.value})}
                                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white lg:w-1/4"
                                                            placeholder="opsional"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Kategori: Media & Dokumentasi */}
                                            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    Media & Dokumentasi
                                                </h4>
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 block">Upload Foto (Opsional, menambahkan ke foto lama)</label>
                                                
                                                {/* Previews */}
                                                {(editRoom.existing_photos?.length > 0 || editRoom.new_photos?.length > 0) && (
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {editRoom.existing_photos?.map((url, idx) => (
                                                            <div key={`exist-photo-${idx}`} className="relative group w-24 h-16 rounded-xl overflow-hidden border border-slate-200">
                                                                <img loading="lazy" src={url} alt="existing" className="w-full h-full object-cover" />
                                                                <button aria-label="Action Button"  type="button" onClick={() => setEditRoom({...editRoom, existing_photos: editRoom.existing_photos.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">&times;</button>
                                                            </div>
                                                        ))}
                                                        {editRoom.new_photos?.map((file, idx) => (
                                                            <div key={`new-photo-${idx}`} className="relative group w-24 h-16 rounded-xl overflow-hidden border border-emerald-200">
                                                                <img loading="lazy" src={URL.createObjectURL(file)} alt="new" className="w-full h-full object-cover" />
                                                                <button aria-label="Action Button"  type="button" onClick={() => setEditRoom({...editRoom, new_photos: editRoom.new_photos.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">&times;</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <DragDropZone
                                                    accept="image/*"
                                                    multiple={true}
                                                    label="Tarik & Lepas Foto (Bisa lebih dari 1)"
                                                    selectedFile={editRoom.new_photos}
                                                    onFileDrop={(files) => {
                                                        const existingFiles = editRoom.new_photos ? Array.from(editRoom.new_photos) : [];
                                                        setEditRoom({...editRoom, new_photos: [...existingFiles, ...files]});
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 block">Upload Video (Opsional, menambahkan ke video lama)</label>

                                                {/* Previews */}
                                                {(editRoom.existing_videos?.length > 0 || editRoom.new_videos?.length > 0) && (
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {editRoom.existing_videos?.map((url, idx) => (
                                                            <div key={`exist-video-${idx}`} className="relative group w-24 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                                                                <svg className="w-8 h-8 text-slate-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                                <button aria-label="Action Button"  type="button" onClick={() => setEditRoom({...editRoom, existing_videos: editRoom.existing_videos.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">&times;</button>
                                                            </div>
                                                        ))}
                                                        {editRoom.new_videos?.map((file, idx) => (
                                                            <div key={`new-video-${idx}`} className="relative group w-24 h-16 rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50 flex items-center justify-center">
                                                                <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                                <button aria-label="Action Button"  type="button" onClick={() => setEditRoom({...editRoom, new_videos: editRoom.new_videos.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">&times;</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <DragDropZone
                                                    accept="video/mp4,video/x-m4v,video/*"
                                                    multiple={true}
                                                    label="Tarik & Lepas Video Baru (Opsional, Bisa lebih dari 1)"
                                                    selectedFile={editRoom.new_videos}
                                                    onFileDrop={(files) => {
                                                        const existingFiles = editRoom.new_videos ? Array.from(editRoom.new_videos) : [];
                                                        setEditRoom({...editRoom, new_videos: [...existingFiles, ...files]});
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                            <div className="flex gap-4 pt-4 border-t border-slate-100 justify-end">
                                                <button aria-label="Action Button"  type="button" onClick={() => setEditRoom(null)} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all">Batal</button>
                                                <button aria-label="Action Button"  type="submit" className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300">Simpan Perubahan</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Penyewaan / Transaksi Booking (Tab: Bookings) */}
                    {activeTab === 'bookings' && (
                        <div className="space-y-8">
                            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                {currentRole === 'resident' ? (() => {
                                    const resId = auth.user.id;
                                    const myBookings = bookings.filter(b => Number(b.tenant_id) === resId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                                    const activeBooking = myBookings.find(b => b.status === 'active') || myBookings.find(b => b.status === 'pending');
                                    // Modified to show payment history for ALL bookings of the tenant, per account.
                                    const myFinances = finances.filter(f => myBookings.some(b => Number(b.id) === Number(f.booking_id))).sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
                                    
                                    const visibleTenantPayments = myFinances.filter(f => {
                                        if (!tenantPaymentSearch) return true;
                                        const q = tenantPaymentSearch.toLowerCase();
                                        return (
                                            (f.description && f.description.toLowerCase().includes(q)) ||
                                            (f.booking?.room?.room_number && String(f.booking.room.room_number).toLowerCase().includes(q))
                                        );
                                    });
                                    
                                    return (
                                        <div className="flex flex-col">
                                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                                                <button aria-label="Action Button"  
                                                    onClick={() => {
                                                        const headers = ['Tanggal', 'Kamar', 'Deskripsi', 'Nominal'];
                                                        const csvData = visibleTenantPayments.map(f => {
                                                            const formattedAmount = `Rp ${Number(f.amount).toLocaleString('id-ID')}`;
                                                            return [
                                                                new Date(f.transaction_date).toLocaleDateString('id-ID'),
                                                                `Kamar ${f.booking?.room?.room_number || '-'}`,
                                                                f.description,
                                                                formattedAmount
                                                            ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(';');
                                                        });
                                                        const csvContent = [headers.join(';'), ...csvData].join('\n');
                                                        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
                                                        const link = document.createElement('a');
                                                        link.href = URL.createObjectURL(blob);
                                                        const safeName = (auth.user?.name || 'User').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                                                        const roomNumber = visibleTenantPayments.length > 0 && visibleTenantPayments[0].booking?.room?.room_number 
                                                            ? visibleTenantPayments[0].booking.room.room_number 
                                                            : '';
                                                        link.download = `riwayat_pembayaran_${safeName}${roomNumber ? '_' + roomNumber : ''}.csv`;
                                                        link.click();
                                                    }}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                    Export Spreadsheet
                                                </button>
                                                <div className="relative w-full sm:w-72">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Cari deskripsi, atau nomor kamar..." 
                                                        value={tenantPaymentSearch} 
                                                        onChange={(e) => setTenantPaymentSearch(e.target.value)} 
                                                        className="glass-input rounded-xl pl-10 pr-4 py-2 text-sm w-full border-slate-200 shadow-sm"
                                                    />
                                                    <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                                </div>
                                            </div>
                                        <div className="overflow-auto w-full max-h-[700px] relative">
                                            <table className="w-full whitespace-nowrap min-w-max text-left border-collapse">
                                                <thead className="sticky top-0 z-10 shadow-sm">
                                                        <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                                                            <th className="p-4 pl-6">Tanggal</th>
                                                            <th className="p-4">Kamar</th>
                                                            <th className="p-4">Deskripsi</th>
                                                            <th className="p-4 pr-6 text-right">Nominal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-sm">
                                                        {visibleTenantPayments.map(f => (
                                                    <tr key={f.id} className="hover:bg-slate-50">
                                                        <td className="p-4 pl-6 font-mono text-slate-600 text-xs">
                                                            {new Date(f.transaction_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                                        </td>
                                                        <td className="p-4 font-semibold text-slate-700">
                                                            Kamar {f.booking?.room?.room_number || '-'}
                                                        </td>
                                                        <td className="p-4 font-semibold text-slate-800">{f.description}</td>
                                                        <td className="p-4 pr-6 text-right font-mono font-bold text-emerald-600">
                                                            Rp {parseFloat(f.amount).toLocaleString('id-ID')}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {visibleTenantPayments.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="p-8 text-center text-slate-500">
                                                            Belum ada riwayat pembayaran yang sesuai.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        </div>
                                    </div>
                                    );
                                })() : (
                                    <div className="flex flex-col">
                                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 w-full sm:w-auto">
                                                <button aria-label="Action Button"  
                                                    onClick={() => setShowManualBookingModal(true)}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                                    Tambah Booking Manual
                                                </button>
                                                <button aria-label="Action Button"  
                                                    onClick={() => setShowManualPayModal(true)}
                                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    Terima Bayar
                                                </button>
                                                <button aria-label="Action Button"  
                                                    onClick={handleExportCSV}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                    Export Spreadsheet
                                                </button>
                                            </div>
                                            <div className="relative w-full sm:w-72">
                                                <input 
                                                    type="text" 
                                                    placeholder="Cari kode, penyewa, atau kamar..." 
                                                    value={bookingSearch} 
                                                    onChange={(e) => setBookingSearch(e.target.value)} 
                                                    className="glass-input rounded-xl pl-10 pr-4 py-2 text-sm w-full border-slate-200 shadow-sm"
                                                />
                                                <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                            </div>
                                        </div>
                                        <div className="overflow-auto w-full max-h-[700px] relative">
                                            <table className="w-full whitespace-nowrap min-w-max text-left border-collapse">
                                                <thead className="sticky top-0 z-10 shadow-sm">
                                            <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                                                <th className="p-4 pl-6">Kode Booking</th>
                                                <th className="p-4">Tenant / Kamar</th>
                                                <th className="p-4">Jenis Sewa</th>
                                                <th className="p-4">Periode</th>
                                                <th className="p-4">Sisa Tagihan</th>
                                                <th className="p-4">Status / Bayar</th>
                                                <th className="p-4 pr-6 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {paginatedBookings.map(b => (
                                                <tr key={b.id} className="hover:bg-slate-50">
                                                    <td className="p-4 pl-6 font-mono font-bold text-slate-800">{b.booking_code}</td>
                                                    <td className="p-4">
                                                        <div className="font-semibold text-slate-800">{b.tenant.name}</div>
                                                        <div className="text-xs text-slate-500">{b.room.branch.name.replace('Kospart PH 18 - ', '')} (Kamar {b.room.room_number})</div>
                                                    </td>
                                                    <td className="p-4 uppercase text-xs font-bold tracking-wider text-emerald-600">{b.rental_type === 'daily' ? 'Harian' : (b.rental_type === 'weekly' ? 'Mingguan' : (b.rental_type === 'monthly' ? 'Bulanan' : 'Tahunan'))}</td>
                                                    <td className="p-4 font-mono text-slate-600 text-xs">
                                                        {new Date(b.start_date).toLocaleDateString('id-ID')} s.d <br />
                                                        {new Date(b.end_date).toLocaleDateString('id-ID')} <br />
                                                        {b.status === 'active' && (() => {
                                                            const isDaily = b.rental_type === 'daily';
                                                            const checkoutDate = new Date(b.end_date);
                                                            if (isDaily) checkoutDate.setHours(14, 0, 0, 0);
                                                            const diffMs = checkoutDate - new Date();
                                                            const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                                                            
                                                            let badgeColor = '';
                                                            if (isDaily) {
                                                                badgeColor = diffMs > (24 * 60 * 60 * 1000) ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                                             diffMs >= 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-red-100 text-red-700 border border-red-200 animate-pulse';
                                                            } else {
                                                                badgeColor = days > 3 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                                                                             days >= 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-red-100 text-red-700 border border-red-200 animate-pulse';
                                                            }

                                                            let text = '';
                                                            if (isDaily) {
                                                                if (diffMs < 0) text = 'WAKTU HABIS';
                                                                else {
                                                                    const h = Math.floor(diffMs / (1000 * 60 * 60));
                                                                    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                                                    text = `SISA ${h}J ${m}M`;
                                                                }
                                                            } else {
                                                                if (days > 0) text = `SISA ${days} HARI`;
                                                                else if (days === 0) text = 'HARI INI TERAKHIR';
                                                                else text = `LEWAT ${Math.abs(days)} HARI`;
                                                            }

                                                            return (
                                                                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${badgeColor}`}>
                                                                    {text}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="p-4 font-mono font-semibold text-slate-800">Rp {Math.max(0, parseFloat(b.total_amount) - parseFloat(b.paid_amount || 0)).toLocaleString('id-ID')}</td>
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
                                                            {parseFloat(b.unverified_amount) > 0 && (
                                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse shadow-sm">
                                                                    Menunggu Verifikasi
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 pr-6 text-right space-y-2">
                                                        {['super_admin', 'operator'].includes(currentRole) && (
                                                            <div className="flex flex-wrap gap-2 justify-end items-center">
                                                                {parseFloat(b.unverified_amount) > 0 && (
                                                                    <button aria-label="Action Button"  onClick={() => setShowVerifyPaymentModal(b)} className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg transition-colors animate-pulse shadow-sm shadow-indigo-500/50 flex items-center gap-1.5 whitespace-nowrap">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                        Verifikasi
                                                                    </button>
                                                                )}

                                                                {/* Primary Actions */}
                                                                {(b.status === 'active' || b.status === 'pending' || b.payment_status !== 'paid') && (
                                                                    <button aria-label="Action Button"  onClick={() => handleSendReminder(b.id)} className={`px-2.5 py-1.5 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap ${b.payment_status === 'paid' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`} title={b.payment_status === 'paid' ? 'Kirim Notifikasi Batas Sewa' : 'Kirim Reminder Tagihan'}>
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                                        {b.payment_status === 'paid' ? 'Notif Sewa' : 'Reminder'}
                                                                    </button>
                                                                )}

                                                                <button aria-label="Action Button"  onClick={() => setShowInvoiceModal(b)} className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] rounded-lg transition-colors border border-slate-200 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                                                                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                                                    Invoice
                                                                </button>

                                                                {/* Options Menu */}
                                                                <Menu as="div" className="relative inline-block text-left">
                                                                    <div>
                                                                        <Menu.Button className="px-2 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] rounded-lg transition-colors border border-slate-200 shadow-sm flex items-center justify-center">
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                                                        </Menu.Button>
                                                                    </div>
                                                                    <Transition
                                                                        as={React.Fragment}
                                                                        enter="transition ease-out duration-100"
                                                                        enterFrom="transform opacity-0 scale-95"
                                                                        enterTo="transform opacity-100 scale-100"
                                                                        leave="transition ease-in duration-75"
                                                                        leaveFrom="transform opacity-100 scale-100"
                                                                        leaveTo="transform opacity-0 scale-95"
                                                                    >
                                                                        <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden border border-slate-100">
                                                                            <div className="py-1">
                                                                                {b.status === 'pending' && (
                                                                                    <Menu.Item>
                                                                                        {({ active }) => (
                                                                                            <button aria-label="Action Button"  onClick={() => handleApproveBooking(b.id)} className={`${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'} flex w-full items-center px-4 py-2.5 text-xs font-bold transition-colors`}>
                                                                                                <svg className="w-4 h-4 mr-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                                                                Approve Penyewaan
                                                                                            </button>
                                                                                        )}
                                                                                    </Menu.Item>
                                                                                )}
                                                                                
                                                                                <Menu.Item>
                                                                                    {({ active }) => (
                                                                                        <a href={`/api/bookings/${b.id}/contract`} className={`${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'} flex w-full items-center px-4 py-2.5 text-xs font-semibold transition-colors`}>
                                                                                            <svg className="w-4 h-4 mr-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                                                            Surat Kontrak (DOC)
                                                                                        </a>
                                                                                    )}
                                                                                </Menu.Item>

                                                                                {b.status === 'active' && (
                                                                                    <>
                                                                                        <Menu.Item>
                                                                                            {({ active }) => (
                                                                                                <button aria-label="Action Button"  onClick={() => { setShowExtendManualModal(b); setExtendManualData({ duration: 1, payment_status: 'paid', payment_method: 'cash', rental_type: b.rental_type }); setCalendarMonthOffset(0); }} className={`${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'} flex w-full items-center px-4 py-2.5 text-xs font-semibold transition-colors`}>
                                                                                                    <svg className="w-4 h-4 mr-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                                                    Perpanjang Sewa
                                                                                                </button>
                                                                                            )}
                                                                                        </Menu.Item>
                                                                                        <div className="border-t border-slate-100 my-1"></div>
                                                                                        <Menu.Item>
                                                                                            {({ active }) => (
                                                                                                <button aria-label="Action Button"  onClick={() => handleCheckoutBooking(b.id)} className={`${active ? 'bg-red-50 text-red-700' : 'text-slate-700'} flex w-full items-center px-4 py-2.5 text-xs font-bold transition-colors`}>
                                                                                                    <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                                                                                    Checkout
                                                                                                </button>
                                                                                            )}
                                                                                        </Menu.Item>
                                                                                    </>
                                                                                )}

                                                                                {b.status !== 'active' && b.status !== 'pending' && (
                                                                                    <>
                                                                                        <div className="border-t border-slate-100 my-1"></div>
                                                                                        <Menu.Item>
                                                                                            {({ active }) => (
                                                                                                <button aria-label="Action Button"  onClick={() => handleDeleteBooking(b.id)} className={`${active ? 'bg-red-50 text-red-700' : 'text-slate-700'} flex w-full items-center px-4 py-2.5 text-xs font-bold transition-colors`}>
                                                                                                    <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                                                    Hapus Log
                                                                                                </button>
                                                                                            )}
                                                                                        </Menu.Item>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </Menu.Items>
                                                                    </Transition>
                                                                </Menu>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {paginatedBookings.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="p-8 text-center text-slate-500">
                                                        {bookingSearch ? 'Tidak ada transaksi yang cocok dengan pencarian Anda.' : 'Belum ada data penyewaan / transaksi.'}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    </div>
                                    {totalBookingPages > 1 && (
                                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center rounded-b-2xl">
                                            <span className="text-xs text-slate-500">
                                                Menampilkan {((bookingPage - 1) * bookingsPerPage) + 1} - {Math.min(bookingPage * bookingsPerPage, visibleBookings.length)} dari {visibleBookings.length} data
                                            </span>
                                            <div className="flex gap-1">
                                                <button aria-label="Action Button" 
                                                    onClick={() => setBookingPage(p => Math.max(1, p - 1))}
                                                    disabled={bookingPage === 1}
                                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Sebelumnya
                                                </button>
                                                <button aria-label="Action Button" 
                                                    onClick={() => setBookingPage(p => Math.min(totalBookingPages, p + 1))}
                                                    disabled={bookingPage === totalBookingPages}
                                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Selanjutnya
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Laporan Keuangan (Tab: Finances) */}
                    {activeTab === 'finances' && (
                        <FinancesTab
                            currentRole={currentRole}
                            operatorBranches={operatorBranches}
                            branches={branches}
                            newFinance={newFinance}
                            setNewFinance={setNewFinance}
                            handleAddFinance={handleAddFinance}
                            financeBranchFilter={financeBranchFilter}
                            setFinanceBranchFilter={setFinanceBranchFilter}
                            financeTypeFilter={financeTypeFilter}
                            setFinanceTypeFilter={setFinanceTypeFilter}
                            financeCategoryFilter={financeCategoryFilter}
                            setFinanceCategoryFilter={setFinanceCategoryFilter}
                            financePaymentMethodFilter={financePaymentMethodFilter}
                            setFinancePaymentMethodFilter={setFinancePaymentMethodFilter}
                            financeSearch={financeSearch}
                            setFinanceSearch={setFinanceSearch}
                            financeDateFilterType={financeDateFilterType}
                            setFinanceDateFilterType={setFinanceDateFilterType}
                            financeDateFilterStart={financeDateFilterStart}
                            setFinanceDateFilterStart={setFinanceDateFilterStart}
                            financeDateFilterEnd={financeDateFilterEnd}
                            setFinanceDateFilterEnd={setFinanceDateFilterEnd}
                            handleExportFinanceCSV={handleExportFinanceCSV}
                            visibleFinances={visibleFinances}
                        />
                    )}

                    {/* Canteen Tab */}
                    {activeTab === 'canteen' && (
                        <CanteenTab 
                            stopCanteenRingtone={stopCanteenRingtone}
                            currentRole={currentRole}
                            auth={auth}
                            branches={branches}
                            operatorBranches={operatorBranches}
                            canteenItems={canteenItems}
                            setCanteenItems={setCanteenItems}
                            canteenOrders={canteenOrders}
                            setCanteenOrders={setCanteenOrders}
                            canteenCart={canteenCart}
                            setCanteenCart={setCanteenCart}
                            bookings={bookings}
                            showToast={showToast}
                            loadAllData={loadAllData}
                            authFetch={authFetch}
                        />
                    )}

                    {/* Komplain & Perbaikan (Tab: Complaints) */}
                    {activeTab === 'complaints' && (
                        <div className="space-y-8">
                            {/* Resident view: Submit Complaint */}
                            {currentRole === 'resident' && (
                                (() => {
                                    const resId = auth.user.id;
                                    const residentOccupiedRooms = rooms.filter(r => 
                                        bookings.some(b => b.room_id === r.id && b.tenant_id === resId && b.status === 'active')
                                    );

                                    if (residentOccupiedRooms.length === 0) {
                                        return (
                                            <div className="glass-panel p-8 rounded-2xl border border-slate-200 text-center max-w-2xl mx-auto shadow-sm">
                                                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                                                    <span className="text-4xl">🔧</span>
                                                </div>
                                                <h3 className="font-extrabold text-2xl text-slate-800 mb-2 font-outfit tracking-tight">Fitur Komplain Belum Tersedia</h3>
                                                <p className="text-slate-500 mb-6 leading-relaxed">Anda harus memiliki pesanan kamar yang aktif untuk dapat menggunakan layanan pengaduan dan perbaikan Kospart PH 18.</p>
                                                <a href="/kamar" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg">
                                                    Cari Kamar Sekarang
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                                                </a>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="glass-panel p-6 rounded-2xl max-w-xl border border-slate-200 shadow-sm">
                                            <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 mb-4">Laporkan Komplain / Kerusakan</h3>
                                            <form onSubmit={handleAddComplaint} className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500 block mb-2">Pilih Kamar Anda</label>
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
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-slate-500 block mb-2">Judul Aduan</label>
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
                                                    <label className="text-xs font-semibold text-slate-500 block mb-2">Deskripsi Lengkap Kendala</label>
                                                    <textarea 
                                                        required
                                                        value={newComplaint.description}
                                                        onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                                                        className="glass-input rounded-xl px-4 py-2.5 text-sm w-full h-24"
                                                        placeholder="Detail kendala yang dialami secara lengkap..."
                                                    />
                                                </div>
                                                <button aria-label="Action Button"  type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all">
                                                    Ajukan Pengaduan
                                                </button>
                                            </form>
                                        </div>
                                    );
                                })()
                            )}

                            {/* List Komplain (Admin & Resident view) */}
                            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                <div className="overflow-x-auto w-full"><table className="w-full whitespace-nowrap min-w-max text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                                            <th className="p-4 pl-6">Tanggal</th>
                                            <th className="p-4">Tenant / Kamar</th>
                                            <th className="p-4">Kendala</th>
                                            <th className="p-4">Status</th>
                                            {['super_admin', 'operator'].includes(currentRole) && (
                                                <th className="p-4 pr-6 text-right">Aksi</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {visibleComplaints.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center text-slate-500">
                                                    Belum ada data komplain.
                                                </td>
                                            </tr>
                                        ) : visibleComplaints.map(c => (
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
                                                        <div className="mt-2 bg-emerald-50/80 dark:bg-emerald-900/30 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50 text-[11px] text-emerald-900 dark:text-emerald-200">
                                                            <strong className="block text-[10px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">Respon Pengelola:</strong>
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
                                                {['super_admin', 'operator'].includes(currentRole) && (
                                                    <td className="p-4 pr-6 text-right">
                                                        {!['completed', 'ready'].includes(c.status) ? (
                                                            <button aria-label="Action Button"  
                                                                onClick={() => setComplaintResponse({ id: c.id, status: c.status, admin_response: c.admin_response || '' })}
                                                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-md transition-colors"
                                                            >
                                                                Ubah Status
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Selesai</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table></div>
                            </div>

                        </div>
                    )}

                    {/* Konten Website (Tab: Web Settings) */}
                    {activeTab === 'web_settings' && currentRole === 'super_admin' && (
                        <WebSettingsTab authFetch={authFetch} />
                    )}

                    {/* Manajemen Pengguna (Tab: Users) */}
                    {activeTab === 'users' && currentRole === 'super_admin' && (
                        <UsersManagementTab branches={branches} authFetch={authFetch} showToast={addToast} />
                    )}
                </main>
            </div>

            {/* ── Complaint Response Modal (root-level, always mounted) ── */}
            {complaintResponse.id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto" style={{ animation: 'modalIn 0.3s ease' }}>
                    <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 p-6 space-y-4 shadow-2xl shadow-emerald-900/20 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">Perbarui Status Komplain</h3>
                            <button aria-label="Action Button"  onClick={() => setComplaintResponse({ id: null, status: 'processing', admin_response: '' })} className="text-slate-500 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2 transition-all duration-300 hover:rotate-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateComplaintStatus} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 block mb-2">Pilih Status Kerja</label>
                                <select value={complaintResponse.status} onChange={(e) => setComplaintResponse({...complaintResponse, status: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full">
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Dikonfirmasi (Antre)</option>
                                    <option value="processing">Proses Pengerjaan</option>
                                    <option value="completed">Selesai diperbaiki</option>
                                    <option value="ready">Ready (Konfirmasi Kamar Siap)</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 block mb-2">Pesan Respon Pengelola</label>
                                <textarea required value={complaintResponse.admin_response} onChange={(e) => setComplaintResponse({...complaintResponse, admin_response: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full h-24" placeholder="Tulis instruksi/info ke tenant terkait perbaikan..." />
                            </div>
                            <div className="flex gap-4 pt-4 mt-2 border-t border-slate-100">
                                <button aria-label="Action Button"  type="button" onClick={() => setComplaintResponse({ id: null, status: 'processing', admin_response: '' })} className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm border border-slate-200 transition-all">Batal</button>
                                <button aria-label="Action Button"  type="submit" className="flex-1 py-2.5 font-bold rounded-xl text-sm transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 text-white">Simpan Status</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Room Modal Dialog */}
            {showChangeRoomModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto" style={{ animation: 'modalIn 0.3s ease' }}>
                    <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 p-6 space-y-4 shadow-2xl shadow-emerald-900/20 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">Pindah Kamar</h3>
                            <button aria-label="Action Button"  onClick={() => setShowMoveRoom(false)} className="text-slate-500 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2 transition-all duration-300 hover:rotate-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <p className="text-xs text-slate-600">Pindahkan penghuni <strong>{showChangeRoomModal.tenant.name}</strong> dari Kamar {showChangeRoomModal.room.room_number} ke Kamar baru yang kosong.</p>
                        <form onSubmit={handleChangeRoom} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 block mb-2">Pilih Kamar Baru (Tersedia)</label>
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
                            <div className="flex gap-4 pt-4 mt-2 border-t border-slate-100">
                                <button aria-label="Action Button"  type="button" onClick={() => setShowChangeRoomModal(null)} className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm border border-slate-200 transition-all">
                                    Batal
                                </button>
                                <button aria-label="Action Button"  type="submit" className="flex-1 py-2.5 font-bold rounded-xl text-sm transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 text-white">
                                    Konfirmasi Pindah
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reschedule Bill Modal Dialog */}
            {showRescheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto" style={{ animation: 'modalIn 0.3s ease' }}>
                    <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 p-6 space-y-4 shadow-2xl shadow-emerald-900/20 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">Reschedule Sewa</h3>
                            <button aria-label="Action Button"  onClick={() => setShowReschedule(false)} className="text-slate-500 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2 transition-all duration-300 hover:rotate-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <p className="text-xs text-slate-600">Reset tanggal mulai & selesai sewa untuk <strong>{showRescheduleModal.tenant.name}</strong>. Jumlah tagihan sewa akan otomatis dihitung ulang secara real-time.</p>
                        <form onSubmit={handleRescheduleBill} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 block mb-2">Tanggal Mulai Baru</label>
                                <input 
                                    type="date"
                                    required
                                    value={rescheduleData.start_date}
                                    onChange={(e) => setRescheduleData({...rescheduleData, start_date: e.target.value})}
                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 block mb-2">Tanggal Selesai Baru</label>
                                <input 
                                    type="date"
                                    required
                                    value={rescheduleData.end_date}
                                    onChange={(e) => setRescheduleData({...rescheduleData, end_date: e.target.value})}
                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                />
                            </div>
                            <div className="flex gap-4 pt-4 mt-2 border-t border-slate-100">
                                <button aria-label="Action Button"  type="button" onClick={() => setShowRescheduleModal(null)} className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm border border-slate-200 transition-all">
                                    Batal
                                </button>
                                <button aria-label="Action Button"  type="submit" className="flex-1 py-2.5 font-bold rounded-xl text-sm transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 text-white">
                                    Simpan Reschedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Verification Modal (Admin/Operator) */}
            {showVerifyPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto" style={{ animation: 'modalIn 0.3s ease' }}>
                    <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl shadow-emerald-900/20 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100/50 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-2xl text-slate-800 dark:text-white tracking-tight">Verifikasi Pembayaran</h3>
                                <p className="text-emerald-600 text-xs font-bold tracking-wide uppercase bg-emerald-100/50 px-2.5 py-1 rounded-full mt-1.5 inline-block">Kode: {showVerifyPaymentModal.booking_code}</p>
                            </div>
                            <button aria-label="Action Button"  onClick={() => setShowVerifyPaymentModal(null)} className="text-slate-500 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2.5 transition-all duration-300 hover:rotate-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
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
                                    {(() => {
                                        let proofUrl = showVerifyPaymentModal.unverified_proof;
                                        if (proofUrl && !proofUrl.startsWith('data:') && !proofUrl.startsWith('http') && !proofUrl.startsWith('/')) {
                                            proofUrl = `/storage/${proofUrl}`;
                                        }
                                        return proofUrl ? (
                                            <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center" title="Klik untuk memperbesar">
                                                <img loading="lazy" 
                                                    src={proofUrl} 
                                                    alt="Bukti Transfer" 
                                                    className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                                                />
                                            </a>
                                        ) : (
                                            <div className="text-center text-slate-500">
                                                <svg className="w-8 h-8 mx-auto mb-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                <span className="text-xs font-medium bg-slate-200 px-2.5 py-1 rounded-md text-slate-600 block">Bukti Tidak Tersedia</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-4 justify-end">
                            <button aria-label="Action Button"  onClick={() => handleRejectPayment(showVerifyPaymentModal.id)} className="px-6 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-xl text-sm border border-rose-200 transition-all">
                                Tolak
                            </button>
                            <button aria-label="Action Button"  onClick={() => handleVerifyPayment(showVerifyPaymentModal.id)} className="px-8 py-2.5 font-bold rounded-xl text-sm transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 text-white">
                                Setujui Pembayaran
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Payment Modal (Admin/Operator) */}
            {showManualPayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto" style={{ animation: 'modalIn 0.3s ease' }}>
                    <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl shadow-emerald-900/20 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100/50 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-2xl text-slate-800 dark:text-white tracking-tight">Terima Pembayaran Manual</h3>
                                <p className="text-emerald-600 text-xs font-bold tracking-wide uppercase bg-emerald-100/50 px-2.5 py-1 rounded-full mt-1.5 inline-block">Penghuni Belum Lunas</p>
                            </div>
                            <button aria-label="Action Button"  onClick={closeManualPayModal} className="text-slate-500 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2.5 transition-all duration-300 hover:rotate-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleManualPaySubmit} className="p-6 space-y-5">
                            {/* Kategori: Pilih Penghuni */}
                            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    Pilih Penghuni
                                </h4>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 block mb-2">Pilih Penghuni / Kamar *</label>
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                                        {bookings.filter(b => ['unpaid', 'dp'].includes(b.payment_status) && parseFloat(b.unverified_amount || 0) === 0).length === 0 ? (
                                            <div className="p-3 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700/30">Tidak ada penghuni yang belum lunas.</div>
                                        ) : bookings.filter(b => ['unpaid', 'dp'].includes(b.payment_status) && parseFloat(b.unverified_amount || 0) === 0).map(b => (
                                            <div 
                                                key={b.id} 
                                                onClick={() => {
                                                    if (manualPayData.booking_id === b.id) {
                                                        setManualPayData({...manualPayData, booking_id: '', paid_amount: ''});
                                                    } else {
                                                        const remaining = Math.max(0, parseFloat(b.total_amount) - parseFloat(b.paid_amount || 0));
                                                        setManualPayData({...manualPayData, booking_id: b.id, paid_amount: remaining});
                                                    }
                                                }}
                                                className={`cursor-pointer p-3 rounded-xl border transition-all ${manualPayData.booking_id == b.id ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 shadow-sm' : 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:shadow-sm'}`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-800">{b.tenant?.name}</p>
                                                        <p className="text-xs text-slate-500">Kamar {b.room?.room_number}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Sisa Tagihan</p>
                                                        <p className="font-bold text-rose-600 text-sm">Rp {Math.max(0, parseFloat(b.total_amount) - parseFloat(b.paid_amount || 0)).toLocaleString('id-ID')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Kategori: Detail Pembayaran */}
                            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Detail Pembayaran
                                </h4>
                                {manualPayData.booking_id && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Nominal Pembayaran (Rp)</label>
                                        <input type="number" required min="1" value={manualPayData.paid_amount} onChange={(e) => setManualPayData({...manualPayData, paid_amount: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white" />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 block mb-2">Metode Pembayaran</label>
                                    <select value={manualPayData.payment_method} onChange={(e) => setManualPayData({...manualPayData, payment_method: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full bg-white dark:bg-slate-900/50 dark:border-slate-700/50 dark:text-white">
                                        <option value="cash">Uang Tunai / Cash</option>
                                        <option value="transfer">Transfer Langsung (Tanpa Aplikasi)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end">
                                <button aria-label="Action Button"  type="submit" disabled={!manualPayData.booking_id} className={`px-8 py-3 text-white font-bold rounded-xl text-sm shadow-lg transition-all ${manualPayData.booking_id ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5' : 'bg-slate-300 cursor-not-allowed'}`}>
                                    Simpan Pembayaran
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invoice Print Preview Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0 print:block" style={{ animation: 'modalIn 0.3s ease' }}>
                    <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-2xl shadow-emerald-900/20 max-h-[90vh] overflow-y-auto text-slate-900 relative print:max-w-none print:w-full print:shadow-none print:border-none print:rounded-none print:bg-white print:p-12 print:max-h-none print:overflow-visible">
                        <button aria-label="Action Button"  onClick={() => setShowInvoiceModal(null)} className="absolute top-4 right-4 text-slate-500 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2.5 transition-all duration-300 hover:rotate-90 print:hidden">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                        {/* Printable Area */}
                        <div className="space-y-6">
                            {/* Invoice Header */}
                            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                                <div>
                                    <img loading="lazy" src="/images/logo 1.jpeg" alt="KOSPART Logo" className="h-16 w-auto mb-3 object-contain rounded-xl" />
                                    <h2 className="font-extrabold text-2xl tracking-tight text-emerald-800 uppercase">KOSPART PH 18</h2>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Nota Invoice Tagihan Kos</span>
                                    <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">{showInvoiceModal.room.branch.name}<br />{showInvoiceModal.room.branch.address}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-500 uppercase font-semibold">Nomor Invoice</span>
                                    <span className="block font-mono font-bold text-sm text-slate-800">{showInvoiceModal.booking_code}</span>
                                    <span className="text-[10px] text-slate-500 block mt-2">Dibuat: {new Date(showInvoiceModal.created_at).toLocaleDateString('id-ID')}</span>
                                </div>
                            </div>

                            {/* Details Row */}
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px] print:text-slate-500">Ditagihkan Kepada:</span>
                                    <strong className="text-slate-800 text-sm block mt-1 print:text-black">{showInvoiceModal.tenant.name}</strong>
                                    <span className="text-slate-500 block print:text-slate-600">{showInvoiceModal.tenant.email}</span>
                                    <span className="text-slate-500 block print:text-slate-600">{showInvoiceModal.tenant.phone}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px] print:text-slate-500">Rincian Hunian:</span>
                                    <strong className="text-slate-800 text-sm block mt-1 print:text-black">Kamar {showInvoiceModal.room.room_number} ({showInvoiceModal.rental_type === 'daily' ? 'Harian' : (showInvoiceModal.rental_type === 'weekly' ? 'Mingguan' : (showInvoiceModal.rental_type === 'monthly' ? 'Bulanan' : 'Tahunan'))})</strong>
                                    <span className="text-slate-500 block print:text-slate-600">Check-in: {new Date(showInvoiceModal.start_date).toLocaleDateString('id-ID')}</span>
                                    <span className="text-slate-500 block print:text-slate-600">Check-out: {new Date(showInvoiceModal.end_date).toLocaleDateString('id-ID')}</span>
                                </div>
                            </div>

                            {/* Billing Summary Table */}
                            <div className="overflow-x-auto w-full"><table className="w-full whitespace-nowrap min-w-max text-left text-xs border-collapse border border-slate-200 mt-4 print:border-slate-300">
                                <thead>
                                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9px] tracking-wider print:bg-slate-100 print:text-black">
                                        <th className="p-3">Item Deskripsi</th>
                                        <th className="p-3 text-right">Total Tagihan</th>
                                        <th className="p-3 text-right">Total Pembayaran</th>
                                        <th className="p-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const start = new Date(showInvoiceModal.start_date);
                                        const end = new Date(showInvoiceModal.end_date);
                                        const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
                                        
                                        let items = [];
                                        let remainingDays = diffDays;
                                        let currentStart = new Date(start);
                                        
                                        const addPeriod = (days, label, unitPrice) => {
                                            const itemStart = new Date(currentStart);
                                            currentStart.setDate(currentStart.getDate() + days);
                                            let itemEnd = new Date(currentStart);
                                            if (itemEnd > end) itemEnd = new Date(end);
                                            
                                            items.push({
                                                label: label,
                                                start: itemStart,
                                                end: itemEnd,
                                                price: unitPrice
                                            });
                                            remainingDays -= days;
                                        };

                                        let priceDaily = parseFloat(showInvoiceModal.price_daily) || parseFloat(showInvoiceModal.room?.price_daily) || 0;
                                        let priceWeekly = parseFloat(showInvoiceModal.price_weekly) || parseFloat(showInvoiceModal.room?.price_weekly) || 0;
                                        let priceMonthly = parseFloat(showInvoiceModal.price_monthly) || parseFloat(showInvoiceModal.room?.price_monthly) || 0;
                                        let priceYearly = parseFloat(showInvoiceModal.price_yearly) || parseFloat(showInvoiceModal.room?.price_yearly) || 0;
                                        let priceWeekend = parseFloat(showInvoiceModal.price_weekend) || parseFloat(showInvoiceModal.room?.price_weekend) || 0;

                                        let baseRentalType = showInvoiceModal.rental_type;
                                        let actualTotal = parseFloat(showInvoiceModal.total_amount);
                                        
                                        // Auto-detect correct base rental type for old bookings that were overwritten to 'daily'
                                        if (baseRentalType === 'daily' && remainingDays >= 7) {
                                            let wCount = Math.floor(remainingDays / 7);
                                            let dCount = remainingDays % 7;
                                            
                                            let pWeekly = priceWeekly > 0 ? priceWeekly : ((actualTotal - (dCount * priceDaily)) / wCount);
                                            // Prevent negative inferred prices
                                            if (pWeekly < 0) pWeekly = priceDaily * 7;
                                            
                                            let expWeekly = wCount * pWeekly + dCount * priceDaily;
                                            let expDaily = remainingDays * priceDaily;
                                            
                                            if (Math.abs(expWeekly - actualTotal) < Math.abs(expDaily - actualTotal) || (priceWeekly === 0 && actualTotal < expDaily)) {
                                                baseRentalType = 'weekly';
                                                priceWeekly = pWeekly;
                                            } else if (remainingDays >= 30) {
                                                let mCount = Math.floor(remainingDays / 30);
                                                let left = remainingDays % 30;
                                                let ewCount = Math.floor(left / 7);
                                                let edCount = left % 7;
                                                
                                                let pMonthly = priceMonthly > 0 ? priceMonthly : ((actualTotal - (ewCount * pWeekly) - (edCount * priceDaily)) / mCount);
                                                if (pMonthly < 0) pMonthly = priceDaily * 30;
                                                
                                                let expMonthly = mCount * pMonthly + ewCount * pWeekly + edCount * priceDaily;
                                                if (Math.abs(expMonthly - actualTotal) < Math.abs(expDaily - actualTotal) || (priceMonthly === 0 && actualTotal < expDaily)) {
                                                    baseRentalType = 'monthly';
                                                    priceMonthly = pMonthly;
                                                }
                                            }
                                        }

                                        const addExactPeriod = (nextDate, label, unitPrice) => {
                                            const itemStart = new Date(currentStart);
                                            currentStart = new Date(nextDate);
                                            let itemEnd = new Date(currentStart);
                                            if (itemEnd > end) itemEnd = new Date(end);
                                            
                                            const daysSpanned = Math.round((itemEnd - itemStart) / (1000 * 60 * 60 * 24));
                                            if (daysSpanned <= 0) return;
                                            
                                            items.push({
                                                label: label,
                                                start: itemStart,
                                                end: itemEnd,
                                                price: unitPrice
                                            });
                                            remainingDays -= daysSpanned;
                                        };

                                        if (baseRentalType === 'yearly') {
                                            let i = 0;
                                            while (true) {
                                                let nextDate = new Date(currentStart);
                                                nextDate.setFullYear(nextDate.getFullYear() + 1);
                                                if (nextDate.getTime() > end.getTime()) break;
                                                addExactPeriod(nextDate, `Tahun ke-${i+1}`, priceYearly);
                                                i++;
                                            }
                                        }
                                        if (baseRentalType === 'monthly' || (baseRentalType === 'yearly' && remainingDays >= 28)) {
                                            let i = 0;
                                            while (true) {
                                                let nextDate = new Date(currentStart);
                                                nextDate.setMonth(nextDate.getMonth() + 1);
                                                if (currentStart.getDate() > 28 && nextDate.getDate() < currentStart.getDate()) {
                                                    nextDate.setDate(0);
                                                }
                                                if (nextDate.getTime() > end.getTime()) break;
                                                addExactPeriod(nextDate, `Bulan ke-${i+1}`, priceMonthly);
                                                i++;
                                            }
                                        }
                                        if (baseRentalType === 'weekly' || (['yearly', 'monthly'].includes(baseRentalType) && remainingDays >= 7)) {
                                            let count = Math.floor(remainingDays / 7);
                                            for(let i=0; i<count; i++) {
                                                let nextDate = new Date(currentStart);
                                                nextDate.setDate(nextDate.getDate() + 7);
                                                addExactPeriod(nextDate, `Minggu ke-${i+1}`, priceWeekly);
                                            }
                                        }
                                        
                                        if (remainingDays > 0) {
                                            let count = remainingDays;
                                            let isExtension = items.length > 0;
                                            for(let i=0; i<count; i++) {
                                                let dayOfWeek = currentStart.getDay();
                                                let isWeekend = (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6);
                                                let priceToUse = (isWeekend && priceWeekend > 0) ? priceWeekend : priceDaily;
                                                
                                                let nextDate = new Date(currentStart);
                                                nextDate.setDate(nextDate.getDate() + 1);
                                                let label = isExtension ? `Hari ke-${i+1} (Tambahan)` : `Hari ke-${i+1}`;
                                                addExactPeriod(nextDate, label, priceToUse);
                                            }
                                        }
                                        
                                        let calculatedTotal = items.reduce((sum, item) => sum + item.price, 0);
                                        
                                        if (calculatedTotal > 0 && Math.abs(calculatedTotal - actualTotal) > 1) {
                                            let ratio = actualTotal / calculatedTotal;
                                            items.forEach(item => {
                                                item.price = item.price * ratio;
                                            });
                                        }

                                        let paidAmount = parseFloat(showInvoiceModal.paid_amount || 0);

                                        return items.filter(item => Math.round(item.price) > 0).map((item, i, filteredItems) => {
                                            let status = 'Belum Lunas';
                                            let statusClass = 'bg-red-100 text-red-800';
                                            let kurangAmount = item.price;
                                            let rowPaidAmount = 0;
                                            
                                            let amountCoveredBeforeThis = filteredItems.slice(0, i).reduce((sum, it) => sum + it.price, 0);
                                            let amountCoveredAfterThis = amountCoveredBeforeThis + item.price;
                                            
                                            if (paidAmount >= amountCoveredAfterThis - 0.01) {
                                                status = 'Lunas';
                                                statusClass = 'bg-emerald-100 text-emerald-800';
                                                kurangAmount = 0;
                                                rowPaidAmount = item.price;
                                            } else if (paidAmount > amountCoveredBeforeThis + 0.01) {
                                                status = 'DP/Sebagian';
                                                statusClass = 'bg-amber-100 text-amber-800';
                                                kurangAmount = amountCoveredAfterThis - paidAmount;
                                                rowPaidAmount = paidAmount - amountCoveredBeforeThis;
                                            }
                                            
                                            return (
                                                <tr key={i} className="border-b border-slate-200 print:border-slate-300">
                                                    <td className="p-3 font-semibold text-slate-800 print:text-black">
                                                        Sewa Kamar {showInvoiceModal.room.room_number} - {item.label} <br />
                                                        <span className="text-[10px] text-slate-500 font-normal print:text-slate-600">
                                                            {item.start.toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'})} s.d {item.end.toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'})}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right font-mono text-slate-600 print:text-black">
                                                        Rp {Math.round(item.price).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-bold text-slate-800 print:text-black">
                                                        Rp {Math.round(rowPaidAmount).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`px-2 py-1 font-bold uppercase text-[9px] rounded-md ${statusClass} print:bg-transparent print:border print:border-slate-300 print:text-black`}>
                                                                {status}
                                                            </span>
                                                            {kurangAmount > 0 && (
                                                                <span className="text-[9px] text-red-500 font-bold tracking-tight print:text-slate-600">
                                                                    Kurang Rp {Math.round(kurangAmount).toLocaleString('id-ID')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table></div>

                            {/* Total Balance info */}
                            <div className="flex justify-between items-end pt-4">
                                {/* Barcode Simulation */}
                                <div className="text-center space-y-1">
                                    <div className="bg-slate-900 text-white font-mono text-[9px] tracking-[6px] px-3 py-1.5 inline-block">
                                        *KP-{showInvoiceModal.booking_code.substring(3, 9)}*
                                    </div>
                                    <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Verifikasi Invoice Asli</span>
                                </div>
                                <div className="text-right space-y-1.5 text-xs">
                                    <div>
                                        <span className="text-slate-500 font-semibold uppercase text-[10px] mr-4">Total Biaya:</span>
                                        <strong className="font-mono text-slate-800">Rp {parseFloat(showInvoiceModal.total_amount).toLocaleString('id-ID')}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 font-semibold uppercase text-[10px] mr-4">Telah Dibayar:</span>
                                        <strong className="font-mono text-emerald-600">Rp {parseFloat(showInvoiceModal.paid_amount).toLocaleString('id-ID')}</strong>
                                    </div>
                                    <div className="border-t border-slate-200 pt-1">
                                        <span className="text-slate-500 font-bold uppercase text-[10px] mr-4">Status Tagihan:</span>
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
                        <div className="flex justify-end gap-4 border-t border-slate-200 pt-6 mt-6 print:hidden">
                            <button aria-label="Action Button"  onClick={() => setShowInvoiceModal(null)} className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all">Tutup Invoice</button>
                            <button aria-label="Action Button"  onClick={() => {
                                const originalTitle = document.title;
                                const safeName = showInvoiceModal.tenant.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
                                const safeRoom = showInvoiceModal.room.room_number.replace(/[^a-zA-Z0-9]/g, '_');
                                document.title = `Invoice_${safeName}_Kamar_${safeRoom}`;
                                window.print();
                                setTimeout(() => { document.title = originalTitle; }, 1000);
                            }} className="px-8 py-2.5 font-bold rounded-xl text-sm transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 text-white flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                Cetak / Simpan PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* ── Payment Modal for Tenant (root-level) ── */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div>
                            <h3 className="font-extrabold text-lg text-slate-800">💳 Bayar Tagihan Sewa</h3>
                            <p className="text-xs text-slate-500 mt-1">Booking: <span className="font-mono font-bold text-slate-700">{showPaymentModal.booking_code}</span></p>
                        </div>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Kamar</span><span className="font-bold text-slate-800">No. {showPaymentModal.room?.room_number} ({showPaymentModal.rental_type === 'daily' ? 'Harian' : (showPaymentModal.rental_type === 'weekly' ? 'Mingguan' : (showPaymentModal.rental_type === 'monthly' ? 'Bulanan' : 'Tahunan'))})</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Periode</span><span className="font-semibold text-slate-700 text-xs">{new Date(showPaymentModal.start_date).toLocaleDateString('id-ID')} – {new Date(showPaymentModal.end_date).toLocaleDateString('id-ID')}</span></div>
                            <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Total Tagihan</span><span className="font-extrabold text-slate-900">Rp {parseFloat(showPaymentModal.total_amount).toLocaleString('id-ID')}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Sudah Dibayar</span><span className="font-bold text-emerald-600">Rp {parseFloat(showPaymentModal.paid_amount || 0).toLocaleString('id-ID')}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500 font-semibold">Sisa Tagihan</span><span className="font-extrabold text-red-600">Rp {Math.max(0, parseFloat(showPaymentModal.total_amount) - parseFloat(showPaymentModal.paid_amount || 0)).toLocaleString('id-ID')}</span></div>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-800 leading-relaxed mt-4">
                            <h4 className="font-bold mb-2 text-sm border-b border-emerald-200 pb-2">Metode Pembayaran</h4>
                            <p className="mb-2">Selesaikan pembayaran ke rekening berikut:</p>
                            <ul className="list-disc pl-5 space-y-1 mb-1">
                                <li><strong>BCA:</strong> 8447060951 a.n PRAYOGA HERIYANTO</li>
                            </ul>
                        </div>
                        <form onSubmit={handleTenantPayment} className="space-y-4 mt-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 block mb-2">Jumlah yang Dibayarkan (Rp)</label>
                                <input type="number" required min="1" value={paymentData.paid_amount} onChange={(e) => setPaymentData({...paymentData, paid_amount: e.target.value})} className={`glass-input rounded-xl px-4 py-2.5 text-sm w-full ${paymentErrors?.paid_amount ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' : ''}`} placeholder={`Maks Rp ${parseFloat(showPaymentModal.total_amount).toLocaleString('id-ID')}`} />
                                {paymentErrors?.paid_amount && <p className="text-red-500 text-xs mt-1 font-medium">{paymentErrors.paid_amount[0]}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 mb-1 block">Bukti Pembayaran / Transfer</label>
                                <DragDropZone
                                    accept="image/*,video/*"
                                    label="Tarik & Lepas Bukti (Maks 10MB)"
                                    selectedFile={paymentData.payment_proof_file}
                                    onFileDrop={(file) => setPaymentData({ ...paymentData, payment_proof_file: file })}
                                    error={!!paymentErrors?.payment_proof}
                                />
                                {paymentErrors?.payment_proof && <p className="text-red-500 text-xs mt-1 font-medium">{paymentErrors.payment_proof[0]}</p>}
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button aria-label="Action Button"  type="button" onClick={() => { setShowPaymentModal(null); setPaymentErrors({}); }} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm border border-slate-200 transition-all">Batal</button>
                                <button aria-label="Action Button"  type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-700/20 transition-all">Konfirmasi Bayar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showExtendTenantModal && (() => {
                const activeBooking = bookings.find(b => Number(b.tenant_id) === auth.user.id && (b.status === 'active' || b.status === 'pending'));
                if (!activeBooking) return null;
                
                const room = activeBooking.room || {};
                const currentType = extendType || activeBooking.rental_type;
                const typeLabel = currentType === 'daily' ? 'Hari' : (currentType === 'weekly' ? 'Minggu' : (currentType === 'monthly' ? 'Bulan' : 'Tahun'));
                
                const lockedPriceDaily = parseFloat(activeBooking.price_daily) || parseFloat(room.price_daily) || 0;
                const lockedPriceWeekly = parseFloat(activeBooking.price_weekly) || parseFloat(room.price_weekly) || 0;
                const lockedPriceMonthly = parseFloat(activeBooking.price_monthly) || parseFloat(room.price_monthly) || 0;
                const lockedPriceYearly = parseFloat(activeBooking.price_yearly) || parseFloat(room.price_yearly) || 0;
                const lockedPriceWeekend = parseFloat(activeBooking.price_weekend) || parseFloat(room.price_weekend) || 0;

                // Calculate projected end date and additional cost
                let projectedEndDate = new Date(activeBooking.end_date);
                let additionalCost = 0;
                let weekendDaysCount = 0;
                let regularDaysCount = 0;

                const durationNum = parseInt(extendDuration) || 1;

                if (currentType === 'daily') {
                    for (let i = 0; i < durationNum; i++) {
                        const dayOfWeek = projectedEndDate.getDay();
                        if ((dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) && lockedPriceWeekend > 0) {
                            additionalCost += lockedPriceWeekend;
                            weekendDaysCount++;
                        } else {
                            additionalCost += lockedPriceDaily;
                            regularDaysCount++;
                        }
                        projectedEndDate.setDate(projectedEndDate.getDate() + 1);
                    }
                } else if (currentType === 'weekly') {
                    projectedEndDate.setDate(projectedEndDate.getDate() + (durationNum * 7));
                    additionalCost = durationNum * lockedPriceWeekly;
                } else if (currentType === 'monthly') {
                    projectedEndDate.setMonth(projectedEndDate.getMonth() + durationNum);
                    additionalCost = durationNum * lockedPriceMonthly;
                } else if (currentType === 'yearly') {
                    projectedEndDate.setFullYear(projectedEndDate.getFullYear() + durationNum);
                    additionalCost = durationNum * lockedPriceYearly;
                }

                // Calendar Logic
                const baseDate = new Date(activeBooking.end_date);
                baseDate.setHours(0,0,0,0);
                const projectedDateOnly = new Date(projectedEndDate);
                projectedDateOnly.setHours(0,0,0,0);

                const viewingDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + calendarMonthOffset, 1);
                const startOfViewMonth = new Date(viewingDate.getFullYear(), viewingDate.getMonth(), 1);
                const firstDayIndex = startOfViewMonth.getDay();
                const daysInMonth = new Date(viewingDate.getFullYear(), viewingDate.getMonth() + 1, 0).getDate();
                
                const calendarDays = [];
                for(let i=0; i<firstDayIndex; i++) calendarDays.push(null);
                for(let i=1; i<=daysInMonth; i++) calendarDays.push(new Date(viewingDate.getFullYear(), viewingDate.getMonth(), i));
                
                let nextMonthDay = 1;
                while(calendarDays.length < 42) {
                    calendarDays.push(new Date(viewingDate.getFullYear(), viewingDate.getMonth() + 1, nextMonthDay++));
                }

                return (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{ animation: 'modalIn 0.3s ease' }}>
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-900/20 w-full max-w-sm overflow-hidden border border-white/60 max-h-[90vh] overflow-y-auto">
                            <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100/50 flex justify-between items-center">
                                <h3 className="font-extrabold text-slate-800 dark:text-white text-2xl tracking-tight">Perpanjang Sewa</h3>
                                <button aria-label="Action Button"  onClick={() => { setShowExtendTenantModal(false); setExtendType(''); setCalendarMonthOffset(0); }} className="text-slate-500 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2.5 transition-all duration-300 hover:rotate-90">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <form onSubmit={handleExtendBooking} className="p-5 space-y-4">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Sewa berakhir pada <strong className="text-slate-800">{new Date(activeBooking.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                                </p>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Tipe Perpanjangan</label>
                                    <select 
                                        value={extendType || activeBooking.rental_type}
                                        onChange={(e) => { setExtendType(e.target.value); setExtendDuration(1); }}
                                        className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 font-semibold text-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:text-white dark:border-slate-700/50 text-sm"
                                    >
                                        <option value="daily">Harian</option>
                                        {lockedPriceWeekly > 0 && <option value="weekly">Mingguan</option>}
                                        {lockedPriceMonthly > 0 && <option value="monthly">Bulanan</option>}
                                        {lockedPriceYearly > 0 && <option value="yearly">Tahunan</option>}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Durasi ({typeLabel})</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        required
                                        value={extendDuration} 
                                        onChange={(e) => setExtendDuration(e.target.value)}
                                        className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 font-bold text-slate-800 bg-slate-50"
                                    />
                                </div>

                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 space-y-2 mt-4 shadow-inner">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-emerald-800 font-medium">Tagihan Tambahan:</span>
                                        <span className="text-emerald-700 font-extrabold">Rp {additionalCost.toLocaleString('id-ID')}</span>
                                    </div>
                                    
                                    {currentType === 'daily' && lockedPriceWeekend > 0 && durationNum > 0 && (
                                        <div className="text-[10px] text-emerald-600 space-y-0.5 pt-1 border-t border-emerald-200/60 mt-1">
                                            {regularDaysCount > 0 && <div className="flex justify-between"><span>{regularDaysCount} hari reguler (Sen-Kam):</span> <span>Rp {(regularDaysCount * lockedPriceDaily).toLocaleString('id-ID')}</span></div>}
                                            {weekendDaysCount > 0 && <div className="flex justify-between"><span>{weekendDaysCount} hari weekend (Jum-Min):</span> <span>Rp {(weekendDaysCount * lockedPriceWeekend).toLocaleString('id-ID')}</span></div>}
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-emerald-200/60 mt-2">
                                        <span className="text-xs text-emerald-800 font-medium block mb-1">Masa sewa baru berakhir pada:</span>
                                        <strong className="text-emerald-700 text-base">{projectedEndDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}</strong>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider hidden sm:block">Kalender</h4>
                                            <div className="flex bg-slate-100 rounded-md p-0.5">
                                                <button aria-label="Action Button"  type="button" onClick={(e) => { e.preventDefault(); setCalendarMonthOffset(c => c - 1); }} className="px-2 py-0.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded shadow-sm text-xs font-bold transition-all">&lt;</button>
                                                <button aria-label="Action Button"  type="button" onClick={(e) => { e.preventDefault(); setCalendarMonthOffset(0); }} className="px-2 py-0.5 text-slate-500 hover:text-slate-800 text-[10px] font-bold transition-all">Hari Ini</button>
                                                <button aria-label="Action Button"  type="button" onClick={(e) => { e.preventDefault(); setCalendarMonthOffset(c => c + 1); }} className="px-2 py-0.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded shadow-sm text-xs font-bold transition-all">&gt;</button>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 text-[9px] font-medium hidden sm:flex">
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500"></div> Awal</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-200 border border-emerald-300"></div> Reguler</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-orange-300 border border-orange-400"></div> Weekend</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm select-none">
                                        <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-bold text-slate-500">
                                            <div className="text-rose-500">Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div className="text-emerald-600">Jum</div><div className="text-emerald-600">Sab</div>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {calendarDays.map((date, idx) => {
                                                if(!date) return <div key={idx} className="h-6"></div>;
                                                
                                                date.setHours(0,0,0,0);
                                                const t = date.getTime();
                                                const isStart = t === baseDate.getTime();
                                                const isInRange = t > baseDate.getTime() && t <= projectedDateOnly.getTime();
                                                const isWeekend = date.getDay() === 0 || date.getDay() === 5 || date.getDay() === 6;
                                                const isOtherMonth = date.getMonth() !== viewingDate.getMonth();
                                                const isValidClick = t > baseDate.getTime();
                                                
                                                let bgClass = "bg-white border-slate-100 text-slate-600";
                                                if(isStart) bgClass = "bg-emerald-500 text-white border-emerald-600 font-bold shadow-md z-10 scale-[1.15]";
                                                else if(isInRange) {
                                                    if(isWeekend && currentType === 'daily') bgClass = "bg-orange-300 text-orange-900 border-orange-400 font-bold";
                                                    else bgClass = "bg-emerald-200 text-emerald-900 border-emerald-300 font-bold";
                                                } else if (isOtherMonth) {
                                                    bgClass = "bg-slate-50/50 text-slate-500 border-transparent";
                                                }

                                                const handleDateClick = () => {
                                                    if(!isValidClick) return;
                                                    const diffTime = t - baseDate.getTime();
                                                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                                                    setExtendType('daily');
                                                    setExtendDuration(diffDays);
                                                };

                                                return (
                                                    <div 
                                                        key={idx} 
                                                        onClick={handleDateClick}
                                                        className={`h-6 flex items-center justify-center rounded-md border text-[10px] transition-all duration-300 ${isValidClick ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:shadow-sm' : 'cursor-not-allowed opacity-70'} ${bgClass}`}
                                                    >
                                                        {date.getDate()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-center text-[10px] text-slate-500 mt-2 font-bold tracking-wide uppercase">
                                            {startOfViewMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex justify-end mt-4">
                                    <button aria-label="Action Button"  type="submit" className="px-8 py-3 text-white font-bold rounded-xl text-sm shadow-lg transition-all bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 w-full">
                                        Konfirmasi Perpanjangan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}
            {showManualBookingModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ animation: 'modalIn 0.3s ease' }}>
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-900/20 w-full max-w-lg overflow-hidden border border-white/60 my-8">
                        <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100/50 flex justify-between items-center">
                            <h3 className="font-extrabold text-slate-800 dark:text-white text-2xl tracking-tight">Booking Manual</h3>
                            <button aria-label="Action Button"  onClick={closeManualBookingModal} className="text-slate-500 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2.5 transition-all duration-300 hover:rotate-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleManualBookingSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Kategori: Pilih Kamar */}
                            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                    Pilih Kamar Sewa
                                </h4>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 block mb-2">Pilih Kamar *</label>
                                    <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                                        {rooms.filter(r => r.status === 'available').length === 0 ? (
                                            <div className="col-span-2 p-4 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-700/30">Tidak ada kamar tersedia.</div>
                                        ) : rooms.filter(r => r.status === 'available').map(r => (
                                            <div 
                                                key={r.id} 
                                                onClick={() => {
                                                    if (manualBookingData.room_id === r.id) {
                                                        setManualBookingData({...manualBookingData, room_id: ''});
                                                    } else {
                                                        setManualBookingData({...manualBookingData, room_id: r.id});
                                                    }
                                                }}
                                                className={`cursor-pointer p-3 rounded-xl border transition-all ${manualBookingData.room_id == r.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 shadow-sm' : 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:shadow-sm'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">Kamar {r.room_number}</span>
                                                    <span className="text-[10px] text-slate-500 truncate max-w-[100px]" title={r.branch?.name}>{r.branch?.name?.replace('Kospart PH 18 - ', '')}</span>
                                                </div>
                                                <p className="font-bold text-sm text-slate-800">Rp {parseFloat(r.price_monthly).toLocaleString('id-ID')}<span className="text-[10px] text-slate-500 font-normal">/bln</span></p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Kategori: Detail Booking */}
                            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    Detail Booking
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Tipe Sewa *</label>
                                        <select required value={manualBookingData.rental_type} onChange={(e) => setManualBookingData({...manualBookingData, rental_type: e.target.value})} className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900/50 dark:text-white dark:border-slate-700/50 text-sm">
                                            <option value="yearly">Tahunan</option>
                                            <option value="monthly">Bulanan</option>
                                            <option value="weekly">Mingguan</option>
                                            <option value="daily">Harian</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Status Pembayaran *</label>
                                        <select required value={manualBookingData.payment_status} onChange={(e) => setManualBookingData({...manualBookingData, payment_status: e.target.value})} className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900/50 dark:text-white dark:border-slate-700/50 text-sm">
                                            <option value="paid">Lunas</option>
                                            <option value="unpaid">Belum Lunas</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Tanggal Check-in *</label>
                                        <input type="date" required value={manualBookingData.start_date} onChange={(e) => setManualBookingData({...manualBookingData, start_date: e.target.value})} className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900/50 dark:text-white dark:border-slate-700/50 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Tanggal Check-out *</label>
                                        <input type="date" required value={manualBookingData.end_date} onChange={(e) => setManualBookingData({...manualBookingData, end_date: e.target.value})} className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900/50 dark:text-white dark:border-slate-700/50 text-sm" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Kategori: Data Penyewa */}
                            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    Data Penyewa
                                </h4>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 block mb-2">Nama Lengkap *</label>
                                        <input type="text" required placeholder="Nama sesuai KTP" value={manualBookingData.name} onChange={(e) => setManualBookingData({...manualBookingData, name: e.target.value})} className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900/50 dark:text-white dark:border-slate-700/50 text-sm" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 block mb-2">No. WhatsApp *</label>
                                            <input type="text" required placeholder="Contoh: 0812..." value={manualBookingData.phone} onChange={(e) => setManualBookingData({...manualBookingData, phone: e.target.value})} className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900/50 dark:text-white dark:border-slate-700/50 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 block mb-2">Email *</label>
                                            <input type="email" required placeholder="Email aktif" value={manualBookingData.email} onChange={(e) => setManualBookingData({...manualBookingData, email: e.target.value})} className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900/50 dark:text-white dark:border-slate-700/50 text-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 block mb-2">NIK (Nomor Induk Kependudukan) *</label>
                                        <input type="text" required placeholder="16 digit NIK" minLength="16" maxLength="16" value={manualBookingData.nik} onChange={(e) => setManualBookingData({...manualBookingData, nik: e.target.value})} className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900/50 dark:text-white dark:border-slate-700/50 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 mb-1 block">Foto KTP *</label>
                                        <DragDropZone
                                            accept="image/*"
                                            label="Tarik & Lepas Foto KTP"
                                            selectedFile={manualBookingData.ktp_photo}
                                            onFileDrop={(file) => setManualBookingData({ ...manualBookingData, ktp_photo: file })}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Estimasi Harga */}
                            {(() => {
                                if (!manualBookingData.room_id || !manualBookingData.start_date || !manualBookingData.end_date) return null;
                                const room = rooms.find(r => r.id == manualBookingData.room_id);
                                if (!room) return null;
                                
                                const start = new Date(manualBookingData.start_date);
                                const end = new Date(manualBookingData.end_date);
                                const diffTime = end.getTime() - start.getTime();
                                if (diffTime <= 0) return null;

                                const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                let totalAmount = 0;

                                if (manualBookingData.rental_type === 'daily') {
                                    let currentDate = new Date(start);
                                    for (let i = 0; i < days; i++) {
                                        const dayOfWeek = currentDate.getDay();
                                        if ((dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) && parseFloat(room.price_weekend) > 0) {
                                            totalAmount += parseFloat(room.price_weekend);
                                        } else {
                                            totalAmount += parseFloat(room.price_daily);
                                        }
                                        currentDate.setDate(currentDate.getDate() + 1);
                                    }
                                } else if (manualBookingData.rental_type === 'weekly') {
                                    const weeks = Math.ceil(days / 7) || 1;
                                    totalAmount = weeks * parseFloat(room.price_weekly);
                                } else if (manualBookingData.rental_type === 'monthly') {
                                    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                                    if (end.getDate() > start.getDate()) months++;
                                    if (months < 1) months = 1;
                                    totalAmount = months * parseFloat(room.price_monthly);
                                } else if (manualBookingData.rental_type === 'yearly') {
                                    let years = end.getFullYear() - start.getFullYear();
                                    if (end.getMonth() > start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() > start.getDate())) years++;
                                    if (years < 1) years = 1;
                                    totalAmount = years * parseFloat(room.price_yearly);
                                }

                                return (
                                    <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex justify-between items-center mb-4">
                                        <div>
                                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Estimasi Total Harga</p>
                                            <p className="text-xs text-emerald-500/80 dark:text-emerald-500/70 mt-0.5">Berdasarkan durasi & tipe sewa</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">Rp {totalAmount.toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="pt-6 flex gap-4 mt-2 border-t border-slate-100">
                                <button aria-label="Action Button"  type="button" onClick={closeManualBookingModal} className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all">Batal</button>
                                <button aria-label="Action Button"  type="submit" className="flex-1 py-2.5 font-bold rounded-xl text-sm transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 text-white">Simpan Booking</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating button to stop annoying canteen ringtone manually */}
            {isCanteenRingtonePlaying && (
                <button aria-label="Action Button" 
                    onClick={stopCanteenRingtone}
                    className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-bounce flex items-center gap-2"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                    Matikan Suara Kantin
                </button>
            )}

            {/* Extend Rent Manual Modal */}
            {showExtendManualModal && (() => {
                const activeBooking = showExtendManualModal;
                const room = activeBooking.room || {};
                const currentType = extendManualData.rental_type || activeBooking.rental_type;
                const typeLabel = currentType === 'daily' ? 'Hari' : (currentType === 'weekly' ? 'Minggu' : (currentType === 'monthly' ? 'Bulan' : 'Tahun'));
                
                const lockedPriceDaily = parseFloat(activeBooking.price_daily) || parseFloat(room.price_daily) || 0;
                const lockedPriceWeekly = parseFloat(activeBooking.price_weekly) || parseFloat(room.price_weekly) || 0;
                const lockedPriceMonthly = parseFloat(activeBooking.price_monthly) || parseFloat(room.price_monthly) || 0;
                const lockedPriceYearly = parseFloat(activeBooking.price_yearly) || parseFloat(room.price_yearly) || 0;
                const lockedPriceWeekend = parseFloat(activeBooking.price_weekend) || parseFloat(room.price_weekend) || 0;

                // Calculate projected end date and additional cost
                let projectedEndDate = new Date(activeBooking.end_date);
                let additionalCost = 0;
                let weekendDaysCount = 0;
                let regularDaysCount = 0;

                const durationNum = parseInt(extendManualData.duration) || 1;

                if (currentType === 'daily') {
                    for (let i = 0; i < durationNum; i++) {
                        const dayOfWeek = projectedEndDate.getDay();
                        if ((dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) && lockedPriceWeekend > 0) {
                            additionalCost += lockedPriceWeekend;
                            weekendDaysCount++;
                        } else {
                            additionalCost += lockedPriceDaily;
                            regularDaysCount++;
                        }
                        projectedEndDate.setDate(projectedEndDate.getDate() + 1);
                    }
                } else if (currentType === 'weekly') {
                    projectedEndDate.setDate(projectedEndDate.getDate() + (durationNum * 7));
                    additionalCost = durationNum * lockedPriceWeekly;
                } else if (currentType === 'monthly') {
                    projectedEndDate.setMonth(projectedEndDate.getMonth() + durationNum);
                    additionalCost = durationNum * lockedPriceMonthly;
                } else if (currentType === 'yearly') {
                    projectedEndDate.setFullYear(projectedEndDate.getFullYear() + durationNum);
                    additionalCost = durationNum * lockedPriceYearly;
                }

                // Calendar Logic
                const baseDate = new Date(activeBooking.end_date);
                baseDate.setHours(0,0,0,0);
                const projectedDateOnly = new Date(projectedEndDate);
                projectedDateOnly.setHours(0,0,0,0);

                const viewingDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + calendarMonthOffset, 1);
                const startOfViewMonth = new Date(viewingDate.getFullYear(), viewingDate.getMonth(), 1);
                const firstDayIndex = startOfViewMonth.getDay();
                const daysInMonth = new Date(viewingDate.getFullYear(), viewingDate.getMonth() + 1, 0).getDate();
                
                const calendarDays = [];
                for(let i=0; i<firstDayIndex; i++) calendarDays.push(null);
                for(let i=1; i<=daysInMonth; i++) calendarDays.push(new Date(viewingDate.getFullYear(), viewingDate.getMonth(), i));
                
                let nextMonthDay = 1;
                while(calendarDays.length < 42) {
                    calendarDays.push(new Date(viewingDate.getFullYear(), viewingDate.getMonth() + 1, nextMonthDay++));
                }

                return (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{ animation: 'modalIn 0.3s ease' }}>
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-900/20 w-full max-w-sm overflow-hidden border border-white/60 max-h-[90vh] overflow-y-auto">
                            <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100/50 flex justify-between items-center">
                                <h3 className="font-extrabold text-slate-800 dark:text-white text-2xl tracking-tight">Perpanjang Sewa</h3>
                                <button aria-label="Action Button"  onClick={() => { setShowExtendManualModal(null); setCalendarMonthOffset(0); }} className="text-slate-500 hover:bg-rose-50 hover:text-rose-500 rounded-full p-2.5 transition-all duration-300 hover:rotate-90">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <form onSubmit={handleExtendManualSubmit} className="p-5 space-y-4">
                                <p className="text-xs text-slate-600">Perpanjang sewa untuk <strong>{activeBooking.tenant?.name}</strong> (Kamar {room?.room_number}).</p>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Sewa berakhir pada <strong className="text-slate-800">{new Date(activeBooking.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
                                </p>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Tipe Perpanjangan</label>
                                    <select 
                                        value={currentType}
                                        onChange={(e) => setExtendManualData({...extendManualData, rental_type: e.target.value, duration: 1})}
                                        className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 font-semibold text-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:text-white dark:border-slate-700/50 text-sm"
                                    >
                                        <option value="daily">Harian</option>
                                        {lockedPriceWeekly > 0 && <option value="weekly">Mingguan</option>}
                                        {lockedPriceMonthly > 0 && <option value="monthly">Bulanan</option>}
                                        {lockedPriceYearly > 0 && <option value="yearly">Tahunan</option>}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Durasi ({typeLabel})</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        required
                                        value={extendManualData.duration} 
                                        onChange={(e) => setExtendManualData({...extendManualData, duration: e.target.value})}
                                        className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 font-bold text-slate-800 bg-slate-50"
                                    />
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Status Pembayaran</label>
                                    <select 
                                        value={extendManualData.payment_status}
                                        onChange={(e) => setExtendManualData({...extendManualData, payment_status: e.target.value})}
                                        className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 font-semibold text-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:text-white dark:border-slate-700/50 text-sm"
                                    >
                                        <option value="paid">Lunas (Bayar Penuh Sesuai Tagihan)</option>
                                        <option value="dp">DP / Sebagian (Input Nominal)</option>
                                        <option value="unpaid">Belum Lunas (Masuk Tagihan)</option>
                                    </select>
                                </div>

                                {['paid', 'dp'].includes(extendManualData.payment_status) && (
                                    <div className="space-y-4">
                                        {extendManualData.payment_status === 'dp' && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Nominal Uang Diterima</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                                                    <input 
                                                        type="number"
                                                        min="1"
                                                        required
                                                        value={extendManualData.paid_amount || ''}
                                                        onChange={(e) => setExtendManualData({...extendManualData, paid_amount: e.target.value})}
                                                        className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 font-bold text-slate-800 bg-slate-50 pl-11"
                                                        placeholder={`Maks: ${additionalCost.toLocaleString('id-ID')}`}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Metode Pembayaran</label>
                                            <select 
                                                value={extendManualData.payment_method}
                                                onChange={(e) => setExtendManualData({...extendManualData, payment_method: e.target.value})}
                                                className="w-full border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 font-semibold text-slate-800 bg-slate-50 dark:bg-slate-800/50 dark:text-white dark:border-slate-700/50 text-sm"
                                            >
                                                <option value="cash">Tunai / Cash</option>
                                                <option value="transfer">Transfer Bank (Langsung ke Admin)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 space-y-2 mt-4 shadow-inner">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-emerald-800 font-medium">Tagihan Tambahan:</span>
                                        <span className="text-emerald-700 font-extrabold">Rp {additionalCost.toLocaleString('id-ID')}</span>
                                    </div>
                                    
                                    {currentType === 'daily' && lockedPriceWeekend > 0 && durationNum > 0 && (
                                        <div className="text-[10px] text-emerald-600 space-y-0.5 pt-1 border-t border-emerald-200/60 mt-1">
                                            {regularDaysCount > 0 && <div className="flex justify-between"><span>{regularDaysCount} hari reguler (Sen-Kam):</span> <span>Rp {(regularDaysCount * lockedPriceDaily).toLocaleString('id-ID')}</span></div>}
                                            {weekendDaysCount > 0 && <div className="flex justify-between"><span>{weekendDaysCount} hari weekend (Jum-Min):</span> <span>Rp {(weekendDaysCount * lockedPriceWeekend).toLocaleString('id-ID')}</span></div>}
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-emerald-200/60 mt-2">
                                        <span className="text-xs text-emerald-800 font-medium block mb-1">Masa sewa baru berakhir pada:</span>
                                        <strong className="text-emerald-700 text-base">{projectedEndDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}</strong>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider hidden sm:block">Kalender</h4>
                                            <div className="flex bg-slate-100 rounded-md p-0.5">
                                                <button aria-label="Action Button"  type="button" onClick={(e) => { e.preventDefault(); setCalendarMonthOffset(c => c - 1); }} className="px-2 py-0.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded shadow-sm text-xs font-bold transition-all">&lt;</button>
                                                <button aria-label="Action Button"  type="button" onClick={(e) => { e.preventDefault(); setCalendarMonthOffset(0); }} className="px-2 py-0.5 text-slate-500 hover:text-slate-800 text-[10px] font-bold transition-all">Hari Ini</button>
                                                <button aria-label="Action Button"  type="button" onClick={(e) => { e.preventDefault(); setCalendarMonthOffset(c => c + 1); }} className="px-2 py-0.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded shadow-sm text-xs font-bold transition-all">&gt;</button>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 text-[9px] font-medium hidden sm:flex">
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500"></div> Awal</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-200 border border-emerald-300"></div> Reguler</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-orange-300 border border-orange-400"></div> Weekend</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm select-none">
                                        <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-bold text-slate-500">
                                            <div className="text-rose-500">Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div className="text-emerald-600">Jum</div><div className="text-emerald-600">Sab</div>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {calendarDays.map((date, idx) => {
                                                if(!date) return <div key={idx} className="h-6"></div>;
                                                
                                                date.setHours(0,0,0,0);
                                                const t = date.getTime();
                                                const isStart = t === baseDate.getTime();
                                                const isInRange = t > baseDate.getTime() && t <= projectedDateOnly.getTime();
                                                const isWeekend = date.getDay() === 0 || date.getDay() === 5 || date.getDay() === 6;
                                                const isOtherMonth = date.getMonth() !== viewingDate.getMonth();
                                                const isValidClick = t > baseDate.getTime();
                                                
                                                let bgClass = "bg-white border-slate-100 text-slate-600";
                                                if(isStart) bgClass = "bg-emerald-500 text-white border-emerald-600 font-bold shadow-md z-10 scale-[1.15]";
                                                else if(isInRange) {
                                                    if(isWeekend && currentType === 'daily') bgClass = "bg-orange-300 text-orange-900 border-orange-400 font-bold";
                                                    else bgClass = "bg-emerald-200 text-emerald-900 border-emerald-300 font-bold";
                                                } else if (isOtherMonth) {
                                                    bgClass = "bg-slate-50/50 text-slate-500 border-transparent";
                                                }

                                                const handleDateClick = () => {
                                                    if(!isValidClick) return;
                                                    const diffTime = t - baseDate.getTime();
                                                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                                                    setExtendManualData({...extendManualData, rental_type: 'daily', duration: diffDays});
                                                };

                                                return (
                                                    <div 
                                                        key={idx} 
                                                        onClick={handleDateClick}
                                                        className={`h-6 flex items-center justify-center rounded-md border text-[10px] transition-all duration-300 ${isValidClick ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:shadow-sm' : 'cursor-not-allowed opacity-70'} ${bgClass}`}
                                                    >
                                                        {date.getDate()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-center text-[10px] text-slate-500 mt-2 font-bold tracking-wide uppercase">
                                            {startOfViewMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex justify-end mt-4 gap-3">
                                    <button aria-label="Action Button"  type="button" onClick={() => setShowExtendManualModal(null)} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm transition-all hover:bg-slate-200">
                                        Batal
                                    </button>
                                    <button aria-label="Action Button"  type="submit" disabled={isProcessing} className="flex-1 py-3 text-white font-bold rounded-xl text-sm shadow-lg transition-all bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed">
                                        {isProcessing ? 'Memproses...' : 'Simpan Perpanjangan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}

            {/* Custom Confirm Dialog Modal */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-800 mb-2">Konfirmasi Aksi</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">{confirmDialog.message}</p>
                        <div className="flex w-full gap-3">
                            <button aria-label="Action Button"  onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all">Batal</button>
                            <button aria-label="Action Button"  onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/30">Ya, Lanjutkan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation Bar */}
            <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[90] lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe transform transition-transform duration-300 ${isMobileNavVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="flex overflow-x-auto show-scrollbar px-3 pt-2 pb-3 gap-2 items-center w-full snap-x snap-mandatory">
                    <button aria-label="Action Button" onClick={() => setActiveTab('overview')} className={`flex-1 snap-center flex flex-col items-center justify-center min-w-[72px] px-1 py-2 rounded-xl transition-all ${activeTab === 'overview' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
                        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        <span className="text-[10px] font-bold tracking-tight">{currentRole === 'resident' ? 'Informasi' : 'Beranda'}</span>
                    </button>

                    {currentRole === 'super_admin' && (
                        <button aria-label="Action Button" onClick={() => setActiveTab('branches')} className={`flex-1 snap-center flex flex-col items-center justify-center min-w-[72px] px-1 py-2 rounded-xl transition-all ${activeTab === 'branches' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                            <span className="text-[10px] font-bold tracking-tight">Cabang</span>
                        </button>
                    )}

                    {['super_admin', 'operator'].includes(currentRole) && (
                        <button aria-label="Action Button" onClick={() => setActiveTab('rooms')} className={`flex-1 snap-center flex flex-col items-center justify-center min-w-[72px] px-1 py-2 rounded-xl transition-all ${activeTab === 'rooms' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            <span className="text-[10px] font-bold tracking-tight">Kamar</span>
                        </button>
                    )}

                    <button aria-label="Action Button" onClick={() => setActiveTab('bookings')} className={`flex-1 snap-center flex flex-col items-center justify-center min-w-[72px] px-1 py-2 rounded-xl transition-all ${activeTab === 'bookings' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
                        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        <span className="text-[10px] font-bold tracking-tight">Transaksi</span>
                    </button>

                    <button aria-label="Action Button" onClick={() => setActiveTab('canteen')} className={`flex-1 snap-center flex flex-col items-center justify-center min-w-[72px] px-1 py-2 rounded-xl transition-all ${activeTab === 'canteen' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
                        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        <span className="text-[10px] font-bold tracking-tight">Kantin</span>
                    </button>

                    <button aria-label="Action Button" onClick={() => setActiveTab('complaints')} className={`flex-1 snap-center flex flex-col items-center justify-center min-w-[72px] px-1 py-2 rounded-xl transition-all ${activeTab === 'complaints' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
                        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        <span className="text-[10px] font-bold tracking-tight">Komplain</span>
                    </button>

                    {['super_admin', 'operator'].includes(currentRole) && (
                        <button aria-label="Action Button" onClick={() => setActiveTab('finances')} className={`flex-1 snap-center flex flex-col items-center justify-center min-w-[72px] px-1 py-2 rounded-xl transition-all ${activeTab === 'finances' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span className="text-[10px] font-bold tracking-tight">Keuangan</span>
                        </button>
                    )}

                    {currentRole === 'super_admin' && (
                        <button aria-label="Action Button" onClick={() => setActiveTab('users')} className={`flex-1 snap-center flex flex-col items-center justify-center min-w-[72px] px-1 py-2 rounded-xl transition-all ${activeTab === 'users' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            <span className="text-[10px] font-bold tracking-tight">Penghuni</span>
                        </button>
                    )}

                    {currentRole === 'super_admin' && (
                        <button aria-label="Action Button" onClick={() => setActiveTab('web_settings')} className={`flex-1 snap-center flex flex-col items-center justify-center min-w-[72px] px-1 py-2 rounded-xl transition-all ${activeTab === 'web_settings' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50'}`}>
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span className="text-[10px] font-bold tracking-tight">Web</span>
                        </button>
                    )}
                </div>
            </nav>
        </div>
    );
}




