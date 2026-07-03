import React, { useState } from 'react';

export default function CanteenTab({ 
    stopCanteenRingtone,
    currentRole, 
    auth, 
    branches, 
    operatorBranches, 
    canteenItems, 
    setCanteenItems, 
    canteenOrders, 
    setCanteenOrders, 
                            canteenCart, 
                            setCanteenCart, 
                            bookings,
                            showToast, 
                            loadAllData,
                            authFetch,
                            showConfirm
                        }) {
    // Admin/Operator States
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [showManualOrderModal, setShowManualOrderModal] = useState(false);
    const [manualOrderData, setManualOrderData] = useState({ branch_id: '', tenant_id: '', customer_name: '', payment_method: 'cash', payment_status: 'paid' });
    const [manualCart, setManualCart] = useState([]);
    const [newItem, setNewItem] = useState({ branch_id: '', name: '', category: 'food', price: '', stock: '', is_sellable: true, description: '', add_to_finance: false, total_cost: '' });
    const [editItem, setEditItem] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [selectedBranchFilter, setSelectedBranchFilter] = useState(currentRole === 'operator' && operatorBranches && operatorBranches.length > 0 ? String(operatorBranches[0]) : '');
    const [adminSearch, setAdminSearch] = useState('');

    // Tenant States
    const [checkoutModal, setCheckoutModal] = useState(false);
    const [checkoutData, setCheckoutData] = useState({ delivery_method: 'pickup', payment_method: 'qris', notes: '' });
    const [limitWarningData, setLimitWarningData] = useState(null);
    const [tenantCategoryFilter, setTenantCategoryFilter] = useState('');
    const [tenantSearch, setTenantSearch] = useState('');
    const [paymentProof, setPaymentProof] = useState(null);
    const [showPayDebtModal, setShowPayDebtModal] = useState(null);
    const [verifyOrderModal, setVerifyOrderModal] = useState(null);
    const [debtPaymentMethod, setDebtPaymentMethod] = useState('qris');
    const [selectedItemInfo, setSelectedItemInfo] = useState(null);
    const [receivePay, setReceivePay] = useState(null); // { order } for admin accept payment modal
    const [receivePayMethod, setReceivePayMethod] = useState('cash');
    const [receivePayProof, setReceivePayProof] = useState(null);

    // Helper functions
    const formatCurrency = (amount) => `Rp ${parseFloat(amount).toLocaleString('id-ID')}`;
    const translateCategory = (cat) => {
        switch(cat) {
            case 'food': return 'Makanan';
            case 'drink': return 'Minuman';
            case 'snack': return 'Cemilan';
            case 'ice_cream': return 'Es Krim';
            case 'ingredient': return 'Bahan Baku';
            default: return cat;
        }
    };

    // === ADMIN / OPERATOR LOGIC ===
    const handleSaveItem = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(newItem).forEach(key => {
            if (key === 'form_type' || key === 'recipes' || key === 'image') return;
            let val = newItem[key];
            if (typeof val === 'boolean') val = val ? 1 : 0;
            if (val !== null && val !== undefined) formData.append(key, val);
        });
        if (newItem.recipes && newItem.recipes.length > 0) {
            formData.append('recipes', JSON.stringify(newItem.recipes));
            formData.set('stock', '9999'); // Set dummy stock for menu with recipes
        }
        if (imageFile) formData.append('image', imageFile);

        const url = editItem ? `/api/canteen-items/${editItem.id}` : '/api/canteen-items';
        if (editItem) formData.append('_method', 'PUT');

        const res = await authFetch(url, {
            method: 'POST', // using POST with _method=PUT for multipart/form-data
            body: formData,
            headers: {} // Remove Content-Type to let browser set boundary
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message);
            setShowAddItemModal(false);
            setEditItem(null);
            setNewItem({ branch_id: '', name: '', category: 'food', price: '', stock: '', is_sellable: true, description: '', add_to_finance: false, total_cost: '' });
            setImageFile(null);
            loadAllData();
        } else {
            showToast(data.message || 'Gagal menyimpan item.', 'error');
        }
    };

    const handleDeleteItem = async (id) => {
        if (!confirm('Hapus item ini?')) return;
        const res = await authFetch(`/api/canteen-items/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Item berhasil dihapus.');
            loadAllData();
        }
    };

    const handleUpdateOrderStatus = async (id, status) => {
        if (stopCanteenRingtone) stopCanteenRingtone();
        const res = await authFetch(`/api/canteen-orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            showToast('Status pesanan diperbarui.');
            loadAllData();
        } else {
            const data = await res.json();
            showToast(data.message || 'Gagal memperbarui status.', 'error');
        }
    };

    const handleVerifyPayment = async (id, status) => {
        if (stopCanteenRingtone) stopCanteenRingtone();
        const res = await authFetch(`/api/canteen-orders/${id}/payment`, {
            method: 'PUT',
            body: JSON.stringify({ payment_status: status })
        });
        if (res.ok) {
            showToast('Status pembayaran diperbarui.');
            loadAllData();
            setVerifyOrderModal(prev => prev?.id === id ? null : prev);
        } else {
            const data = await res.json();
            showToast(data.message || 'Terjadi kesalahan.', 'error');
        }
    };

    const handleSendBulkReminders = () => {
        showConfirm('Kirim reminder WhatsApp ke semua penghuni yang memiliki kasbon belum dibayar?', async () => {
            const res = await authFetch('/api/canteen-orders/remind-bulk-debt', {
                method: 'POST',
                body: JSON.stringify({ branch_id: selectedBranchFilter }),
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await res.json();
            if (res.ok) {
                showToast(data.message);
            } else {
                showToast(data.message || 'Gagal mengirim reminder.', 'error');
            }
        });
    };

    const addToManualCart = (item) => {
        const existing = manualCart.find(c => c.id === item.id);
        if (existing) {
            if (existing.quantity >= item.stock && (!item.recipes || item.recipes.length === 0)) {
                showToast('Stok tidak mencukupi!', 'error');
                return;
            }
            setManualCart(manualCart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setManualCart([...manualCart, { ...item, quantity: 1 }]);
        }
    };

    const removeFromManualCart = (id) => {
        setManualCart(manualCart.filter(c => c.id !== id));
    };

    const manualCartTotal = manualCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleManualOrderSubmit = async (e) => {
        e.preventDefault();
        if (manualCart.length === 0) return showToast('Keranjang kosong!', 'error');
        if (!manualOrderData.branch_id) return showToast('Pilih cabang!', 'error');
        if (manualOrderData.payment_method === 'debt') {
            if (!manualOrderData.tenant_id) {
                return showToast('Metode Kasbon hanya bisa digunakan jika terhubung ke penghuni.', 'error');
            }
            const existingDebt = canteenOrders.filter(o => o.tenant_id === parseInt(manualOrderData.tenant_id) && o.payment_status === 'debt_unpaid').reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
            if (existingDebt + manualCartTotal > 250000) {
                return setLimitWarningData({
                    existingDebt: existingDebt,
                    newOrder: manualCartTotal,
                    message: "Silakan minta penghuni melunasi kasbon terlebih dahulu atau ubah metode pembayaran."
                });
            }
        }

        const payload = {
            branch_id: manualOrderData.branch_id,
            payment_method: manualOrderData.payment_method,
            payment_status: manualOrderData.payment_status,
            tenant_id: manualOrderData.tenant_id || null,
            customer_name: manualOrderData.customer_name || null,
            items: manualCart.map(item => ({ id: item.id, quantity: item.quantity }))
        };

        const res = await authFetch('/api/canteen-orders/manual', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (res.ok) {
            showToast(data.message);
            setShowManualOrderModal(false);
            setManualCart([]);
            setManualOrderData({ branch_id: '', tenant_id: '', customer_name: '', payment_method: 'cash', payment_status: 'paid' });
            loadAllData();
        } else {
            showToast(data.message || 'Gagal membuat pesanan.', 'error');
        }
    };

    // === TENANT LOGIC ===
    const addToCart = (item) => {
        const existing = canteenCart.find(c => c.id === item.id);
        if (existing) {
            if (existing.quantity >= item.stock) {
                showToast('Stok tidak mencukupi!', 'error');
                return;
            }
            setCanteenCart(canteenCart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
        } else {
            setCanteenCart([...canteenCart, { ...item, quantity: 1 }]);
        }
        showToast(`${item.name} ditambahkan ke keranjang.`);
    };

    const removeFromCart = (id) => {
        setCanteenCart(canteenCart.filter(c => c.id !== id));
    };

    const cartTotal = canteenCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tenantDebt = canteenOrders.filter(o => o.payment_status === 'debt_unpaid' && o.status !== 'cancelled' && o.tenant_id === auth.user.id).reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (canteenCart.length === 0) return;

        if (checkoutData.payment_method === 'debt') {
            if (tenantDebt + cartTotal > 250000) {
                return setLimitWarningData({
                    existingDebt: tenantDebt,
                    newOrder: cartTotal,
                    message: "Silakan lunasi kasbon Anda terlebih dahulu atau gunakan metode pembayaran Transfer QRIS."
                });
            }
        }
        
        if (checkoutData.payment_method === 'qris' && !paymentProof) {
            return showToast('Upload bukti QRIS terlebih dahulu.', 'error');
        }

        const formData = new FormData();
        // Since we need to send arrays in FormData for Laravel
        formData.append('branch_id', canteenCart[0].branch_id); // Assuming all items from same branch
        formData.append('payment_method', checkoutData.payment_method);
        formData.append('delivery_method', checkoutData.delivery_method);
        formData.append('notes', checkoutData.notes);
        
        canteenCart.forEach((item, index) => {
            formData.append(`items[${index}][id]`, item.id);
            formData.append(`items[${index}][quantity]`, item.quantity);
        });

        if (checkoutData.payment_method === 'qris' && paymentProof) {
            formData.append('payment_proof', paymentProof);
        }

        const res = await authFetch('/api/canteen-orders', {
            method: 'POST',
            body: formData,
            headers: {}
        });

        const data = await res.json();
        if (res.ok) {
            showToast(data.message);
            setCanteenCart([]);
            setCheckoutModal(false);
            setPaymentProof(null);
            loadAllData();
        } else {
            showToast(data.message || 'Gagal membuat pesanan.', 'error');
        }
    };

    const handlePayDebt = async (e) => {
        e.preventDefault();
        if (debtPaymentMethod === 'qris' && !paymentProof) return showToast('Pilih bukti QRIS dulu.', 'error');
        
        const formData = new FormData();
        formData.append('payment_method', debtPaymentMethod);
        if (paymentProof) {
            formData.append('payment_proof', paymentProof);
        }
        
        const url = showPayDebtModal.isBulk 
            ? '/api/canteen-orders/pay-bulk-debt' 
            : `/api/canteen-orders/${showPayDebtModal.id}/pay-debt`;

        const res = await authFetch(url, {
            method: 'POST',
            body: formData,
            headers: {}
        });
        
        if (res.ok) {
            showToast(debtPaymentMethod === 'qris' ? 'Bukti QRIS terkirim. Menunggu verifikasi.' : 'Pengajuan pelunasan tunai terkirim.');
            setShowPayDebtModal(null);
            setPaymentProof(null);
            setDebtPaymentMethod('qris');
            loadAllData();
        } else {
            showToast('Gagal mengirim pengajuan pelunasan.', 'error');
        }
    };

    // Render logic separation
    const limitWarningModalUI = limitWarningData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
                <div className="bg-red-500 p-6 flex flex-col items-center justify-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-center">Transaksi Ditolak!</h3>
                    <p className="text-red-100 text-center text-sm mt-1">Batas Maksimal Kasbon: Rp 250.000</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Utang Saat Ini</span>
                            <span className="font-semibold text-slate-800">Rp {limitWarningData.existingDebt.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Pesanan Baru</span>
                            <span className="font-semibold text-slate-800">Rp {limitWarningData.newOrder.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold">
                            <span className="text-slate-800">Total Keseluruhan</span>
                            <span className="text-red-600">Rp {(limitWarningData.existingDebt + limitWarningData.newOrder).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    <p className="text-sm text-center text-slate-600 leading-relaxed px-2">
                        {limitWarningData.message}
                    </p>
                    <button
                        onClick={() => setLimitWarningData(null)}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 mt-2"
                    >
                        Mengerti & Tutup
                    </button>
                </div>
            </div>
        </div>
    );

    const verifyOrderModalUI = verifyOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md" style={{ animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800 transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-full">
                
                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex justify-between items-start">
                    <div>
                        <h3 className="font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">Verifikasi Kasbon</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Order ID:</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{verifyOrderModal.order_code}</span>
                        </div>
                    </div>
                    <button onClick={() => setVerifyOrderModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 p-2.5 rounded-full transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 pb-2 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Amount Card */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-700/30 rounded-2xl p-5 flex flex-col justify-center items-center text-center relative overflow-hidden shadow-inner">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-400/10 dark:bg-amber-500/10 rounded-full blur-xl"></div>
                        <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-orange-400/10 dark:bg-orange-500/10 rounded-full blur-xl"></div>
                        <div className="font-bold text-amber-800/70 dark:text-amber-500 mb-1 relative z-10 text-sm">Total Tagihan Kasbon</div>
                        <div className="font-outfit text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight relative z-10">
                            {formatCurrency(verifyOrderModal.total_amount)}
                        </div>
                    </div>
                    
                    {/* Proof Image */}
                    <div className="space-y-2.5">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">Bukti Pembayaran</label>
                        <div className="w-full h-56 bg-slate-50 dark:bg-slate-800/50 rounded-2xl ring-1 ring-slate-200/60 dark:ring-slate-700/50 overflow-hidden relative group flex items-center justify-center">
                            {verifyOrderModal.payment_proof ? (
                                <>
                                    <a href={`/storage/${verifyOrderModal.payment_proof}`} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 p-2" title="Klik untuk melihat ukuran penuh">
                                        <img loading="lazy" src={`/storage/${verifyOrderModal.payment_proof}`} alt="Bukti Kasbon" className="max-w-full max-h-full object-contain rounded-xl drop-shadow-sm group-hover:scale-[1.02] transition-transform duration-300" />
                                    </a>
                                    <div className="absolute bottom-3 right-3 bg-slate-900/70 backdrop-blur px-2.5 py-1.5 rounded-lg text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1.5 shadow-lg">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                        Perbesar
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-slate-400 dark:text-slate-500 flex flex-col items-center">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 shadow-inner">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider">Tidak Ada Bukti</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-4 flex gap-3 mt-auto">
                    <button onClick={() => handleVerifyPayment(verifyOrderModal.id, 'debt_unpaid')} className="flex-1 py-3.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-sm border border-rose-200/50 dark:border-rose-500/20 transition-all active:scale-[0.98]">
                        Tolak
                    </button>
                    <button onClick={() => handleVerifyPayment(verifyOrderModal.id, 'paid')} className="flex-[1.5] py-3.5 font-bold rounded-xl text-sm transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25 dark:shadow-emerald-900/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-white">
                        Setujui Pembayaran
                    </button>
                </div>
            </div>
        </div>
    );

    if (['super_admin', 'operator'].includes(currentRole)) {
        const filteredItems = canteenItems.filter(item => {
            const matchBranch = selectedBranchFilter === '' || Number(item.branch_id) === Number(selectedBranchFilter);
            const matchSearch = item.name.toLowerCase().includes(adminSearch.toLowerCase());
            return matchBranch && matchSearch;
        });
        const filteredOrders = canteenOrders.filter(order => selectedBranchFilter === '' || Number(order.branch_id) === Number(selectedBranchFilter));

        return (
            <div className="space-y-8">
                {/* Operator/Admin View */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="font-extrabold text-2xl text-slate-800">Master Data Kantin</h3>
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full md:w-auto">
                        <select 
                            value={selectedBranchFilter} 
                            onChange={e => setSelectedBranchFilter(e.target.value)}
                            className="glass-input rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 bg-white w-full md:w-auto"
                        >
                            {currentRole !== 'operator' && <option value="">Semua Cabang</option>}
                            {branches.filter(b => currentRole === 'operator' ? operatorBranches.some(br => Number(br) === Number(b.id)) : true).map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            <button 
                                onClick={() => {
                                    setEditItem(null);
                                    setImageFile(null);
                                    setNewItem({ branch_id: selectedBranchFilter || (operatorBranches || [])[0] || '', name: '', category: 'food', price: '', stock: '', unit: '', is_sellable: true, description: '', add_to_finance: false, total_cost: '', form_type: 'menu', recipes: [] });
                                    setShowAddItemModal(true);
                                }}
                                className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-sm hover:bg-emerald-700 flex-1 md:flex-none text-center text-xs sm:text-sm whitespace-nowrap"
                            >
                                + Tambah Menu
                            </button>
                            <button 
                                onClick={() => {
                                    setEditItem(null);
                                    setImageFile(null);
                                    setNewItem({ branch_id: selectedBranchFilter || (operatorBranches || [])[0] || '', name: '', category: 'ingredient', price: '0', stock: '', unit: 'pcs', is_sellable: false, description: '', add_to_finance: false, total_cost: '', form_type: 'barang', recipes: [] });
                                    setShowAddItemModal(true);
                                }}
                                className="px-3 sm:px-4 py-2 bg-slate-800 dark:bg-slate-600 text-white rounded-xl font-bold shadow-sm hover:bg-slate-900 flex-1 md:flex-none text-center text-xs sm:text-sm whitespace-nowrap"
                            >
                                + Tambah Barang
                            </button>
                            <button 
                                onClick={() => {
                                    setManualOrderData({ branch_id: selectedBranchFilter || (operatorBranches || [])[0] || '', tenant_id: '', customer_name: '', payment_method: 'cash', payment_status: 'paid' });
                                    setManualCart([]);
                                    setShowManualOrderModal(true);
                                }}
                                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 w-full md:w-auto text-center text-xs sm:text-sm"
                            >
                                Buat Pesanan Manual
                            </button>
                        </div>
                    </div>
                </div>

                {/* Orders Grid */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Incoming Orders */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-200 min-w-0">
                        <h4 className="font-bold text-lg text-slate-800 mb-4">Pesanan Aktif</h4>
                        <div className="space-y-4">
                            {filteredOrders.filter(o => !['completed', 'cancelled'].includes(o.status)).map(order => (
                                <div key={order.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                    <div className="flex justify-between items-start mb-3 gap-2">
                                        <div className="flex flex-wrap gap-1.5 items-center flex-1">
                                            <span className="font-bold text-slate-800 text-sm">{order.order_code}</span>
                                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full whitespace-nowrap">{order.tenant?.name || order.customer_name || 'Pelanggan'}</span>
                                            {order.tenant?.bookings?.[0]?.room?.room_number && (
                                                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">Kamar {order.tenant.bookings[0].room.room_number}</span>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-bold text-emerald-600 mb-1">{formatCurrency(order.total_amount)}</div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap">{order.payment_method}</div>
                                                <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap ${order.delivery_method === 'delivery' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-orange-50 border border-orange-200 text-orange-700'}`}>
                                                    {order.delivery_method === 'delivery' ? 'Diantar Ke Kamar' : 'Ambil Sendiri'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-600 mb-3 space-y-1">
                                        {order.items.map(oi => (
                                            <div key={oi.id}>- {oi.quantity}x {oi.item?.name}</div>
                                        ))}
                                        {order.notes && (
                                            <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100 text-amber-800 italic">
                                                Catatan: {order.notes}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200">
                                        {order.status === 'pending_approval' && (
                                            <button onClick={() => handleUpdateOrderStatus(order.id, 'processing')} className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg">Proses Pesanan</button>
                                        )}
                                        {order.status === 'processing' && (
                                            <button onClick={() => handleUpdateOrderStatus(order.id, 'ready')} className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg">Pesanan Siap</button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button onClick={() => handleUpdateOrderStatus(order.id, 'completed')} className="px-3 py-1 bg-slate-800 dark:bg-slate-600 text-white text-xs font-bold rounded-lg">Selesai</button>
                                        )}
                                        {order.payment_status === 'pending' && order.payment_method !== 'cash' && (
                                            <button onClick={() => setVerifyOrderModal(order)} className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg border border-emerald-700">Verifikasi QRIS</button>
                                        )}
                                        {order.payment_status === 'pending' && order.payment_method === 'cash' && (
                                            <button onClick={() => handleVerifyPayment(order.id, 'paid')} className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg border border-emerald-700">Terima Uang Cash</button>
                                        )}
                                        <button onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')} className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">Batal</button>
                                    </div>
                                </div>
                            ))}
                            {filteredOrders.filter(o => !['completed', 'cancelled'].includes(o.status)).length === 0 && (
                                <p className="text-sm text-slate-500">Tidak ada pesanan aktif.</p>
                            )}
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="glass-panel p-4 md:p-6 rounded-2xl border border-slate-200 lg:col-span-2 min-w-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <h4 className="font-bold text-lg text-slate-800">Daftar Menu Kantin</h4>
                            <div className="relative w-full sm:w-64">
                                <input 
                                    type="text" 
                                    placeholder="Cari menu / barang..." 
                                    value={adminSearch}
                                    onChange={(e) => setAdminSearch(e.target.value)}
                                    className="glass-input rounded-xl px-4 py-2 text-sm w-full border border-slate-200"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto w-full pb-2 relative">
                            <table className="w-full whitespace-nowrap min-w-[600px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500">
                                        <th className="pb-2">Foto & Nama</th>
                                        <th className="pb-2">Kategori</th>
                                        <th className="pb-2">Stok</th>
                                        <th className="pb-2">Harga</th>
                                        <th className="pb-2">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.filter(item => item.is_sellable).length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-slate-400">
                                                Belum ada data menu kantin.
                                            </td>
                                        </tr>
                                    ) : filteredItems.filter(item => item.is_sellable).map(item => (
                                        <tr key={item.id} className="border-b border-slate-100">
                                            <td className="py-2 flex items-center gap-3">
                                                {item.image ? (
                                                    <img src={`/storage/${item.image}`} alt={item.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    </div>
                                                )}
                                                <div className="font-semibold text-slate-800">{item.name}</div>
                                            </td>
                                            <td className="py-2 capitalize">{translateCategory(item.category)}</td>
                                            <td className="py-2">
                                                {item.recipes?.length > 0 ? (
                                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Resep</span>
                                                ) : (
                                                    <span className={`font-bold ${item.stock < 5 ? 'text-red-500' : 'text-slate-700'}`}>{item.stock} {item.unit || ''}</span>
                                                )}
                                            </td>
                                            <td className="py-2">{formatCurrency(item.price)}</td>
                                            <td className="py-2">
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditItem(item); setImageFile(null); setNewItem({...item, add_to_finance: false, form_type: item.unit ? 'barang' : 'menu', recipes: item.recipes || []}); setShowAddItemModal(true); }} className="text-blue-500 hover:text-blue-700 text-xs font-bold">Edit</button>
                                                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Hapus</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Inventory Items */}
                    <div className="glass-panel p-4 md:p-6 rounded-2xl border border-slate-200 lg:col-span-2 min-w-0">
                        <h4 className="font-bold text-lg text-slate-800 mb-4">Stok Barang Internal & Bahan Baku</h4>
                        <div className="overflow-x-auto w-full pb-2 relative">
                            <table className="w-full whitespace-nowrap min-w-[600px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500">
                                        <th className="pb-2">Nama Barang</th>
                                        <th className="pb-2">Kategori</th>
                                        <th className="pb-2">Stok</th>
                                        <th className="pb-2">Nilai Modal</th>
                                        <th className="pb-2">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.filter(item => !item.is_sellable).length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-slate-400">
                                                Belum ada data stok barang.
                                            </td>
                                        </tr>
                                    ) : filteredItems.filter(item => !item.is_sellable).map(item => (
                                        <tr key={item.id} className="border-b border-slate-100">
                                            <td className="py-2">
                                                <div className="font-semibold text-slate-800">{item.name}</div>
                                            </td>
                                            <td className="py-2 capitalize">{translateCategory(item.category)}</td>
                                            <td className="py-2">
                                                <span className={`font-bold ${item.stock < 5 ? 'text-red-500' : 'text-slate-700'}`}>{item.stock} {item.unit || ''}</span>
                                            </td>
                                            <td className="py-2">{formatCurrency(item.price)}</td>
                                            <td className="py-2">
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditItem(item); setImageFile(null); setNewItem({...item, add_to_finance: false, form_type: item.unit ? 'barang' : 'menu', recipes: item.recipes || []}); setShowAddItemModal(true); }} className="text-blue-500 hover:text-blue-700 text-xs font-bold">Edit</button>
                                                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Hapus</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Admin Kasbon View */}
                {filteredOrders.filter(o => o.status !== 'cancelled' && (o.payment_status === 'debt_unpaid' || (o.payment_status === 'pending' && o.status === 'completed'))).length > 0 && (
                    <div className="glass-panel p-6 rounded-2xl border border-slate-200 mt-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Daftar Kasbon & Verifikasi
                            </h4>
                            <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto justify-between sm:justify-end">
                                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-600">
                                    Total: {formatCurrency(filteredOrders.filter(o => o.payment_status === 'debt_unpaid' && o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total_amount), 0))}
                                </span>
                                <button onClick={handleSendBulkReminders} className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm whitespace-nowrap">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                    Kirim Reminder
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto w-full pb-2 relative">
                            <table className="w-full whitespace-nowrap min-w-[600px] text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase border-b border-slate-200">
                                        <th className="p-3">Penghuni / Kode</th>
                                        <th className="p-3">Kamar & Cabang</th>
                                        <th className="p-3">Tanggal</th>
                                        <th className="p-3 text-right">Jumlah Kasbon</th>
                                        <th className="p-3 text-right">Status / Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredOrders.filter(o => o.status !== 'cancelled' && (o.payment_status === 'debt_unpaid' || (o.payment_status === 'pending' && o.status === 'completed'))).map(order => (
                                        <tr key={order.id} className="">
                                            <td className="p-3">
                                                <div className="font-bold text-slate-800">{order.tenant?.name || 'Unknown'}</div>
                                                <div className="text-xs text-slate-500">{order.order_code}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="font-semibold text-slate-700">{order.tenant?.bookings?.[0]?.room?.room_number ? 'Kamar ' + order.tenant.bookings[0].room.room_number : '-'}</div>
                                                <div className="text-xs text-slate-500">{order.branch?.name?.replace('Kospart PH 18 - ', '')}</div>
                                            </td>
                                            <td className="p-3 text-slate-500 text-xs">{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                                            <td className="p-3 text-right font-bold text-red-600">{formatCurrency(order.total_amount)}</td>
                                            <td className="p-3 text-right">
                                                {order.payment_status === 'debt_unpaid' && (
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className="font-bold text-red-600 text-xs uppercase bg-red-50 px-2 py-1 rounded-md border border-red-100">Belum Dibayar</span>
                                                        <button
                                                            onClick={() => { setReceivePay(order); setReceivePayMethod('cash'); setReceivePayProof(null); }}
                                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-colors shadow-sm"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                                            Terima Bayar
                                                        </button>
                                                    </div>
                                                )}
                                                {order.payment_status === 'pending' && (
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">Menunggu Verifikasi</span>
                                                        <div className="flex gap-2 justify-end mt-1">
                                                            <button onClick={() => setVerifyOrderModal(order)} className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg whitespace-nowrap hover:bg-emerald-700">
                                                                Verifikasi Kasbon
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modal Add/Edit Item */}
                {showAddItemModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                            <h3 className="font-extrabold text-2xl text-slate-800 mb-6">{editItem ? 'Edit Item' : (newItem.form_type === 'barang' ? 'Tambah Barang Baru' : 'Tambah Menu Baru')}</h3>
                            <form onSubmit={handleSaveItem} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Cabang</label>
                                    <select required value={newItem.branch_id} onChange={e => setNewItem({...newItem, branch_id: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full">
                                        <option value="">Pilih Cabang</option>
                                        {branches.filter(b => currentRole === 'operator' ? operatorBranches.some(br => Number(br) === Number(b.id)) : true).map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Nama Barang</label>
                                    <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" />
                                </div>
                                {newItem.form_type === 'menu' && (
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">Foto Menu (Opsional)</label>
                                        <input type="file" accept="image/*" capture="camera" onChange={e => setImageFile(e.target.files[0])} className="glass-input rounded-xl px-4 py-2 text-sm w-full bg-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">Kategori</label>
                                        <select required value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full">
                                            {newItem.form_type !== 'barang' && (
                                                <>
                                                    <option value="food">Makanan</option>
                                                    <option value="drink">Minuman</option>
                                                    <option value="snack">Cemilan</option>
                                                    <option value="ice_cream">Es Krim</option>
                                                </>
                                            )}
                                            {newItem.form_type === 'barang' && (
                                                <option value="ingredient">Bahan Baku / Barang</option>
                                            )}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        {!(newItem.form_type === 'menu' && newItem.recipes?.length > 0) && (
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold text-slate-500">Stok Tersedia</label>
                                                <input required type="number" min="0" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" />
                                            </div>
                                        )}
                                        {newItem.form_type === 'barang' && (
                                            <div className="flex-1">
                                                <label className="text-xs font-semibold text-slate-500">Satuan</label>
                                                <select required value={newItem.unit || 'pcs'} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full">
                                                    <option value="pcs">pcs</option>
                                                    <option value="box">box / dus</option>
                                                    <option value="pack">pack</option>
                                                    <option value="kg">kg</option>
                                                    <option value="liter">liter</option>
                                                    <option value="gram">gram</option>
                                                    <option value="botol">botol</option>
                                                    <option value="kaleng">kaleng</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Deskripsi (Opsional)</label>
                                    <textarea rows="2" value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="Tambahkan penjelasan singkat tentang menu/barang ini..."></textarea>
                                </div>
                                {newItem.form_type === 'menu' && (
                                    <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-700">Resep / Bahan Baku (Opsional)</label>
                                            <button type="button" onClick={() => setNewItem({...newItem, recipes: [...(newItem.recipes || []), {ingredient_item_id: '', quantity: 1}]})} className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 font-bold">+ Tambah Bahan</button>
                                        </div>
                                        {newItem.recipes?.length > 0 && <p className="text-[10px] text-slate-500">Jika ditambahkan, stok menu ini akan dianggap tidak terbatas, namun stok bahan bakunya akan otomatis dipotong saat dibeli.</p>}
                                        {(newItem.recipes || []).map((recipe, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <select required value={recipe.ingredient_item_id} onChange={e => {
                                                    const newRecipes = [...newItem.recipes];
                                                    newRecipes[index].ingredient_item_id = e.target.value;
                                                    setNewItem({...newItem, recipes: newRecipes});
                                                }} className="glass-input rounded-xl px-3 py-2 text-xs flex-1">
                                                    <option value="">Pilih Bahan Baku</option>
                                                    {canteenItems.filter(i => i.category === 'ingredient' && (!newItem.branch_id || Number(i.branch_id) === Number(newItem.branch_id))).map(i => (
                                                        <option key={i.id} value={i.id}>{i.name} ({i.unit || 'pcs'})</option>
                                                    ))}
                                                </select>
                                                <input required type="number" min="0.01" step="0.01" value={recipe.quantity} onChange={e => {
                                                    const newRecipes = [...newItem.recipes];
                                                    newRecipes[index].quantity = e.target.value;
                                                    setNewItem({...newItem, recipes: newRecipes});
                                                }} className="glass-input rounded-xl px-3 py-2 text-xs w-20" placeholder="Qty" />
                                                <button type="button" onClick={() => {
                                                    const newRecipes = newItem.recipes.filter((_, i) => i !== index);
                                                    setNewItem({...newItem, recipes: newRecipes});
                                                }} className="text-red-500 font-extrabold px-2 text-lg hover:text-red-700">&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">
                                        {newItem.form_type === 'barang' ? 'Harga / Nilai Barang (Rp)' : 'Harga Jual (Rp)'}
                                    </label>
                                    <input required type="number" min="0" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" />
                                </div>
                                {newItem.form_type !== 'barang' && (
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                                            <input type="checkbox" checked={newItem.is_sellable} onChange={e => setNewItem({...newItem, is_sellable: e.target.checked})} className="rounded text-emerald-600 focus:ring-emerald-500" />
                                            Menu ini bisa dibeli oleh penghuni (Tampil di menu kantin)
                                        </label>
                                    </div>
                                )}
                                
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                                        <input type="checkbox" checked={newItem.add_to_finance} onChange={e => setNewItem({...newItem, add_to_finance: e.target.checked})} className="rounded text-emerald-600 focus:ring-emerald-500" />
                                        Catat belanja stok ini ke Laporan Keuangan (Arus Kas Keluar)
                                    </label>
                                    {newItem.add_to_finance && (
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500">Total Modal Belanja Stok (Rp)</label>
                                            <input required={newItem.add_to_finance} type="number" min="0" value={newItem.total_cost} onChange={e => setNewItem({...newItem, total_cost: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="Total pengeluaran beli stok ini" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowAddItemModal(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Batal</button>
                                    <button type="submit" className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Manual Order */}
                {showManualOrderModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] flex flex-col md:flex-row gap-6">
                            <div className="flex-1 overflow-y-auto pr-2">
                                <h3 className="font-extrabold text-2xl text-slate-800 mb-6">Pilih Menu untuk Manual</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {canteenItems.filter(item => item.is_sellable && (manualOrderData.branch_id === '' || Number(item.branch_id) === Number(manualOrderData.branch_id))).map(item => (
                                        <div key={item.id} className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:border-blue-300 transition-colors cursor-pointer" onClick={() => addToManualCart(item)}>
                                            <div>
                                                <h5 className="font-bold text-sm">{item.name}</h5>
                                                <span className="text-xs text-slate-500">{formatCurrency(item.price)}</span>
                                            </div>
                                            <div className="text-[10px] mt-2 font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">+ Tambah</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-50 p-6 rounded-2xl flex flex-col">
                                <h3 className="font-extrabold text-xl text-slate-800 mb-4">Detail Pesanan</h3>
                                <form onSubmit={handleManualOrderSubmit} className="space-y-4 flex-grow overflow-y-auto pr-2">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">Cabang</label>
                                        <select required value={manualOrderData.branch_id} onChange={e => setManualOrderData({...manualOrderData, branch_id: e.target.value})} className="glass-input rounded-xl px-3 py-2 text-sm w-full">
                                            <option value="">Pilih Cabang</option>
                                            {branches.filter(b => currentRole === 'operator' ? operatorBranches.some(br => Number(br) === Number(b.id)) : true).map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500">Metode Pembayaran</label>
                                            <select required value={manualOrderData.payment_method} onChange={e => setManualOrderData({...manualOrderData, payment_method: e.target.value})} className="glass-input rounded-xl px-3 py-2 text-sm w-full">
                                                <option value="cash">Tunai (Cash)</option>
                                                <option value="qris">QRIS</option>
                                                <option value="debt">Kasbon (Hutang)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500">Status Pembayaran</label>
                                            <select required value={manualOrderData.payment_status} onChange={e => setManualOrderData({...manualOrderData, payment_status: e.target.value})} className="glass-input rounded-xl px-3 py-2 text-sm w-full">
                                                <option value="paid">Lunas</option>
                                                <option value="pending">Menunggu Bayar</option>
                                                {manualOrderData.payment_method === 'debt' && <option value="debt_unpaid">Belum Lunas (Kasbon)</option>}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    {manualOrderData.payment_method === 'debt' ? (
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500">Pilih Penghuni (Wajib untuk Kasbon)</label>
                                            <select required value={manualOrderData.tenant_id} onChange={e => setManualOrderData({...manualOrderData, tenant_id: e.target.value})} className="glass-input rounded-xl px-3 py-2 text-sm w-full">
                                                <option value="">Pilih Penghuni Aktif...</option>
                                                {(() => {
                                                    const activeTenants = bookings
                                                        .filter(b => !['completed', 'cancelled'].includes(b.status) && (manualOrderData.branch_id === '' || Number(b.room?.branch_id) === Number(manualOrderData.branch_id)))
                                                        .map(b => b.tenant)
                                                        .filter((v, i, a) => v && a.findIndex(t => t && t.id === v.id) === i);
                                                    return activeTenants.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ));
                                                })()}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500">Pilih Penghuni (Opsional)</label>
                                                <select value={manualOrderData.tenant_id} onChange={e => setManualOrderData({...manualOrderData, tenant_id: e.target.value, customer_name: ''})} className="glass-input rounded-xl px-3 py-2 text-sm w-full">
                                                    <option value="">Bukan Penghuni</option>
                                                    {(() => {
                                                        const activeTenants = bookings
                                                            .filter(b => !['completed', 'cancelled'].includes(b.status) && (manualOrderData.branch_id === '' || Number(b.room?.branch_id) === Number(manualOrderData.branch_id)))
                                                            .map(b => b.tenant)
                                                            .filter((v, i, a) => v && a.findIndex(t => t && t.id === v.id) === i);
                                                        return activeTenants.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ));
                                                    })()}
                                                </select>
                                            </div>
                                            {!manualOrderData.tenant_id && (
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-500">Nama Tamu</label>
                                                    <input type="text" required value={manualOrderData.customer_name} onChange={e => setManualOrderData({...manualOrderData, customer_name: e.target.value})} className="glass-input rounded-xl px-3 py-2 text-sm w-full" placeholder="Nama Tamu" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-4 border-t border-slate-200 pt-4">
                                        <h4 className="text-xs font-bold text-slate-700 mb-2">Keranjang ({manualCart.length} item)</h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {manualCart.map(c => (
                                                <div key={c.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-1">
                                                    <div>
                                                        <span className="font-semibold text-slate-800">{c.name}</span>
                                                        <span className="text-xs text-slate-500 block">{c.quantity} x {formatCurrency(c.price)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-emerald-600">{formatCurrency(c.price * c.quantity)}</span>
                                                        <button type="button" onClick={() => removeFromManualCart(c.id)} className="text-red-500 hover:text-red-700">&times;</button>
                                                    </div>
                                                </div>
                                            ))}
                                            {manualCart.length === 0 && <p className="text-xs text-slate-400">Belum ada item dipilih.</p>}
                                        </div>
                                        <div className="mt-3 flex justify-between font-extrabold text-lg text-slate-800">
                                            <span>Total</span>
                                            <span>{formatCurrency(manualCartTotal)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3 pt-4 mt-auto">
                                        <button type="button" onClick={() => setShowManualOrderModal(false)} className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold">Batal</button>
                                        <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Buat Pesanan</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
                {limitWarningModalUI}
                {verifyOrderModalUI}

                {/* Modal Terima Bayar Kasbon (Admin) */}
                {receivePay && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease' }}>
                        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800 flex flex-col">
                            {/* Header */}
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    </div>
                                    <button onClick={() => setReceivePay(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <h3 className="font-extrabold text-xl tracking-tight">Terima Pembayaran Kasbon</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-emerald-100 text-xs font-semibold">{receivePay.order_code}</span>
                                    <span className="text-emerald-200 text-xs">•</span>
                                    <span className="text-emerald-100 text-xs font-semibold">{receivePay.tenant?.name || 'Unknown'}</span>
                                </div>
                                <div className="mt-4 bg-white/15 rounded-2xl p-4 text-center">
                                    <div className="text-emerald-100 text-xs font-bold mb-1">Total Tagihan</div>
                                    <div className="font-extrabold text-3xl tracking-tight">{formatCurrency(receivePay.total_amount)}</div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-5">
                                {/* Metode Pembayaran */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Metode Pembayaran Diterima</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['cash', 'qris'].map(method => (
                                            <button
                                                key={method}
                                                type="button"
                                                onClick={() => { setReceivePayMethod(method); setReceivePayProof(null); }}
                                                className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                                                    receivePayMethod === method
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                                }`}
                                            >
                                                {method === 'cash' ? '💵 Tunai' : '📱 QRIS'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Upload bukti jika QRIS */}
                                {receivePayMethod === 'qris' && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Bukti Transfer QRIS</label>
                                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                                            receivePayProof ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/50'
                                        }`}>
                                            <input type="file" accept="image/*" className="hidden" onChange={e => setReceivePayProof(e.target.files[0])} />
                                            {receivePayProof ? (
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    <span className="text-xs font-bold text-emerald-700">{receivePayProof.name}</span>
                                                    <span className="text-[10px] text-emerald-500">Klik untuk ganti</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1.5 text-slate-400">
                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    <span className="text-xs font-semibold">Upload Bukti QRIS</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                )}

                                {/* Info */}
                                <p className="text-xs text-slate-500 leading-relaxed text-center">
                                    {receivePayMethod === 'cash'
                                        ? 'Konfirmasi bahwa uang tunai telah diterima secara langsung. Kasbon akan langsung ditandai Lunas.'
                                        : 'Upload bukti transfer QRIS yang sudah diterima. Kasbon akan langsung ditandai Lunas.'
                                    }
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-6 flex gap-3">
                                <button
                                    onClick={() => setReceivePay(null)}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={async () => {
                                        if (receivePayMethod === 'qris' && !receivePayProof) {
                                            return showToast('Upload bukti QRIS terlebih dahulu.', 'error');
                                        }
                                        const formData = new FormData();
                                        formData.append('payment_status', 'paid');
                                        formData.append('payment_method_received', receivePayMethod);
                                        if (receivePayProof) {
                                            formData.append('payment_proof', receivePayProof);
                                        }

                                        const res = await authFetch(`/api/canteen-orders/${receivePay.id}/payment`, {
                                            method: 'POST',
                                            body: formData,
                                            headers: {}
                                        });
                                        const data = await res.json();
                                        if (res.ok) {
                                            showToast('Pembayaran kasbon berhasil diterima & dicatat sebagai Lunas! ✓');
                                            setReceivePay(null);
                                            setReceivePayProof(null);
                                            setReceivePayMethod('cash');
                                            loadAllData();
                                        } else {
                                            showToast(data.message || 'Gagal memproses pembayaran.', 'error');
                                        }
                                    }}
                                    className="flex-[1.5] py-3 font-bold rounded-xl text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    ✓ Konfirmasi Lunas
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // === TENANT VIEW ===
    const activeTenantBookings = bookings?.filter(b => b.status === 'active') || [];
    const hasActiveBooking = activeTenantBookings.length > 0;

    if (!hasActiveBooking) {
        return (
            <div className="glass-panel p-8 rounded-2xl border border-slate-200 text-center max-w-2xl mx-auto mt-10 shadow-sm">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                    <span className="text-4xl">🍽️</span>
                </div>
                <h3 className="font-extrabold text-2xl text-slate-800 mb-2 font-outfit tracking-tight">Akses Kantin Belum Tersedia</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">Anda harus memiliki pesanan kamar yang aktif untuk dapat memesan makanan dan minuman dari kantin Kospart PH 18.</p>
                <a href="/kamar" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg">
                    Cari Kamar Sekarang
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                </a>
            </div>
        );
    }

    const sidebarContent = (
        <>
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 sticky top-6 shadow-sm">
                <h4 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    Keranjang Anda
                </h4>
                
                {canteenCart.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">Keranjang masih kosong</div>
                ) : (
                    <div className="space-y-4">
                        {canteenCart.map(item => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-700">{item.quantity}x</span>
                                    <span className="text-slate-600">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-800">{formatCurrency(item.price * item.quantity)}</span>
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="border-t border-slate-200 pt-4 mt-4 flex justify-between items-center font-extrabold text-lg">
                            <span>Total</span>
                            <span className="text-emerald-600">{formatCurrency(cartTotal)}</span>
                        </div>
                        <button onClick={() => setCheckoutModal(true)} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md">
                            Checkout Pesanan
                        </button>
                    </div>
                )}
            </div>

            {(() => {
                const activeOrDebtOrders = canteenOrders.filter(o => o.status !== 'cancelled' && (o.payment_status === 'debt_unpaid' || o.payment_status === 'pending' || o.status !== 'completed'));
                if (activeOrDebtOrders.length === 0) return null;

                const debtOrders = activeOrDebtOrders.filter(o => o.payment_status === 'debt_unpaid');
                const totalDebt = debtOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
                
                let debtColorClass = 'bg-emerald-500';
                let debtTextColor = 'text-emerald-600';
                if (totalDebt >= 250000) {
                    debtColorClass = 'bg-rose-600 animate-pulse';
                    debtTextColor = 'text-rose-600';
                } else if (totalDebt > 200000) {
                    debtColorClass = 'bg-red-500';
                    debtTextColor = 'text-red-600';
                } else if (totalDebt > 125000) {
                    debtColorClass = 'bg-amber-500';
                    debtTextColor = 'text-amber-600';
                }
                
                const maxDebtVisual = 250000;
                const debtPercentage = Math.min((totalDebt / maxDebtVisual) * 100, 100);

                return (
                    <div className="glass-panel p-6 rounded-2xl border border-slate-200 mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"></path></svg>
                                Kasbon & Pesanan
                            </h4>
                            {totalDebt > 0 && (
                                <span className={`text-xs font-bold px-3 py-1 rounded-full bg-slate-100 ${debtTextColor}`}>
                                    Total Kasbon: {formatCurrency(totalDebt)}
                                </span>
                            )}
                        </div>

                        {totalDebt > 0 && (
                            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-slate-600">Maksimal Kasbon: Rp 250.000</span>
                                    <span className={debtTextColor}>{Math.round(debtPercentage)}%</span>
                                </div>
                                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden mb-4">
                                    <div className={`h-full ${debtColorClass} transition-all duration-500`} style={{ width: `${debtPercentage}%` }}></div>
                                </div>
                                <button 
                                    onClick={() => setShowPayDebtModal({ isBulk: true, total_amount: totalDebt })} 
                                    className="w-full py-3 bg-slate-800 dark:bg-slate-600 hover:bg-slate-700 dark:hover:bg-slate-500 text-white rounded-xl text-sm font-bold transition-colors shadow-md"
                                >
                                    Lunasi Semua Kasbon ({formatCurrency(totalDebt)})
                                </button>
                                {totalDebt >= 100000 && (
                                    <p className="text-xs text-red-500 font-bold mt-2 text-center">Peringatan: Kasbon sudah mencapai limit. Harap segera melunasi.</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-4">
                            {activeOrDebtOrders.map(order => (
                                <div key={order.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-bold text-slate-800 block">{order.order_code}</span>
                                            <span className="text-xs text-slate-500">Status Pesanan: <span className="font-bold uppercase text-slate-700">{order.status === 'completed' ? 'Selesai' : order.status === 'ready' ? 'Siap' : order.status === 'processing' ? 'Diproses' : order.status === 'pending_approval' ? 'Menunggu Approval' : order.status === 'cancelled' ? 'Dibatalkan' : order.status}</span></span>
                                        </div>
                                        <span className="font-bold text-slate-800">{formatCurrency(order.total_amount)}</span>
                                    </div>
                                    
                                    {order.items && order.items.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                                            {order.items.map((oi, idx) => (
                                                <div key={idx} className="flex justify-between text-xs text-slate-600">
                                                    <span>{oi.quantity}x {oi.item?.name || 'Item dihapus'}</span>
                                                    <span>{formatCurrency(oi.quantity * oi.price_at_time)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {order.payment_status === 'debt_unpaid' && (
                                        <div className="mt-4">
                                            <div className="flex justify-between text-xs items-center bg-red-50 text-red-700 px-3 py-2 rounded-lg font-semibold border border-red-100">
                                                <span>Belum Dibayar (Kasbon)</span>
                                            </div>
                                        </div>
                                    )}
                                    {order.payment_status === 'pending' && order.payment_method === 'qris' && order.payment_proof && (
                                        <div className="text-xs text-blue-600 font-semibold text-center mt-3 bg-blue-50 py-2 rounded-lg border border-blue-100">Menunggu verifikasi admin</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}
            {/* Verify Canteen Payment Modal */}
            {verifyOrderModalUI}
        </>
    );

    return (
        <div className="space-y-8">
            {currentRole === 'resident' && tenantDebt >= 200000 && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-xl text-red-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>
                    <div>
                        <h4 className="font-bold text-red-800">Peringatan: Utang Kantin Menumpuk</h4>
                        <p className="text-sm text-red-700">Total kasbon kantin Anda sudah mencapai <b>{formatCurrency(tenantDebt)}</b>. Mohon segera lunasi agar pencatatan keuangan tetap rapi.</p>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Storefront Grid */}
                <div className="lg:col-span-8 space-y-6 min-w-0">
                    <div className="flex flex-col gap-4 mb-2 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="font-extrabold text-2xl text-slate-800">Menu Kantin Kos</h3>
                            <input
                                type="text"
                                placeholder="Cari menu..."
                                value={tenantSearch}
                                onChange={(e) => setTenantSearch(e.target.value)}
                                className="glass-input rounded-xl px-4 py-2 text-sm w-full sm:w-64 border border-slate-200 shadow-sm focus:ring-2 focus:ring-emerald-500/20"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 w-full mt-1">
                            {[
                                { value: '', label: 'Semua Menu', icon: '🍽️' },
                                { value: 'food', label: 'Makanan', icon: '🍱' },
                                { value: 'drink', label: 'Minuman', icon: '🥤' },
                                { value: 'snack', label: 'Cemilan', icon: '🍿' },
                                { value: 'ice_cream', label: 'Es Krim', icon: '🍦' }
                            ].map(cat => (
                                <button
                                    key={cat.value}
                                    onClick={() => setTenantCategoryFilter(cat.value)}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all border ${tenantCategoryFilter === cat.value ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 shadow-sm'}`}
                                >
                                    <span className="text-sm">{cat.icon}</span>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="block lg:hidden space-y-6 mb-6">
                        {sidebarContent}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {canteenItems.filter(i => i.is_sellable && (tenantCategoryFilter === '' || i.category === tenantCategoryFilter) && (tenantSearch === '' || i.name.toLowerCase().includes(tenantSearch.toLowerCase()))).map(item => (
                            <div key={item.id} className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                                <div onClick={() => setSelectedItemInfo(item)} className="cursor-pointer group">
                                    <div className="w-full h-32 bg-slate-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-[1.02]">
                                        {item.image ? <img src={`/storage/${item.image}`} alt={item.name} className="object-cover w-full h-full" /> : <span className="text-4xl text-slate-300">🍴</span>}
                                    </div>
                                    <h4 className="font-bold text-slate-800 leading-tight mb-1 group-hover:text-emerald-600 transition-colors">{item.name}</h4>
                                    <div className="text-sm font-bold text-emerald-600">{formatCurrency(item.price)}</div>
                                    <div className="text-xs text-slate-500 mb-3">Stok: {item.stock > 0 ? `${item.stock} ${item.unit || ''}` : <span className="text-red-500 font-bold">Habis</span>}</div>
                                </div>
                                <button 
                                    onClick={() => addToCart(item)}
                                    disabled={item.stock <= 0}
                                    className="w-full py-2 bg-slate-800 dark:bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                >
                                    {item.stock > 0 ? '+ Tambah' : 'Habis'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cart & History Sidebar */}
                <div className="lg:col-span-4 space-y-0 hidden lg:block">
                    {sidebarContent}
                </div>
            </div>

            {/* Checkout Modal */}
            {checkoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="font-extrabold text-2xl text-slate-800 mb-6">Selesaikan Pesanan</h3>
                        <form onSubmit={handleCheckout} className="space-y-5">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-2 block">Metode Pengiriman</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`cursor-pointer border p-3 rounded-xl text-center font-bold text-sm transition-all ${checkoutData.delivery_method === 'pickup' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>
                                        <input type="radio" name="delivery" value="pickup" className="hidden" checked={checkoutData.delivery_method === 'pickup'} onChange={() => setCheckoutData({...checkoutData, delivery_method: 'pickup'})} />
                                        Ambil Sendiri
                                    </label>
                                    <label className={`cursor-pointer border p-3 rounded-xl text-center font-bold text-sm transition-all ${checkoutData.delivery_method === 'delivery' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>
                                        <input type="radio" name="delivery" value="delivery" className="hidden" checked={checkoutData.delivery_method === 'delivery'} onChange={() => setCheckoutData({...checkoutData, delivery_method: 'delivery'})} />
                                        Antar ke Kamar
                                    </label>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-2 block">Metode Pembayaran</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <label className={`cursor-pointer border p-3 rounded-xl text-center font-bold text-sm transition-all ${checkoutData.payment_method === 'qris' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-slate-50'}`}>
                                        <input type="radio" name="payment_method" value="qris" className="hidden" checked={checkoutData.payment_method === 'qris'} onChange={() => setCheckoutData({...checkoutData, payment_method: 'qris'})} />
                                        QRIS
                                    </label>
                                    <label className={`cursor-pointer border p-3 rounded-xl text-center font-bold text-sm transition-all flex flex-col justify-center ${checkoutData.payment_method === 'cash' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-slate-50'}`}>
                                        <input type="radio" name="payment_method" value="cash" className="hidden" checked={checkoutData.payment_method === 'cash'} onChange={() => setCheckoutData({...checkoutData, payment_method: 'cash'})} />
                                        <span>Bayar Tunai</span>
                                    </label>
                                    <label className={`cursor-pointer border p-3 rounded-xl text-center font-bold text-sm transition-all flex flex-col justify-center ${checkoutData.payment_method === 'debt' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-slate-50'}`}>
                                        <input type="radio" name="payment_method" value="debt" className="hidden" checked={checkoutData.payment_method === 'debt'} onChange={() => setCheckoutData({...checkoutData, payment_method: 'debt'})} />
                                        <span>Catat Dulu</span>
                                        <span className="text-[10px] font-semibold opacity-70">(Kasbon)</span>
                                    </label>
                                </div>
                            </div>

                            {checkoutData.payment_method === 'qris' && (
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3">
                                    <div className="text-xs font-semibold text-emerald-800 text-center mb-2">Scan QRIS di bawah ini untuk membayar.</div>
                                    <div className="flex justify-center">
                                        <img src="/images/Qris.jpeg" alt="QRIS Kantin" className="w-48 h-48 object-contain rounded-xl shadow-sm border border-emerald-200" />
                                    </div>
                                    <div className="text-xs font-semibold text-emerald-800 mt-2">Lalu upload bukti QRIS di sini:</div>
                                    {paymentProof ? (
                                        <div className="relative group w-full h-32 rounded-xl overflow-hidden border border-emerald-300 bg-emerald-100 flex items-center justify-center mb-2 shadow-inner">
                                            <img loading="lazy" src={URL.createObjectURL(paymentProof)} alt="preview" className="w-full h-full object-cover" />
                                            <button aria-label="Action Button" type="button" onClick={() => setPaymentProof(null)} className="absolute top-2 right-2 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-100 transition-opacity shadow-md">&times;</button>
                                        </div>
                                    ) : (
                                        <div className="mt-1">
                                            <label className="flex flex-col items-center justify-center gap-2 p-3 border-2 border-emerald-200/50 border-dashed rounded-xl bg-white hover:bg-slate-50 cursor-pointer transition-colors text-slate-500 hover:text-blue-600 hover:border-blue-300">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                <span className="text-[10px] font-bold text-center leading-tight">Pilih Galeri</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files[0]) setPaymentProof(e.target.files[0]) }} />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-1 block">Catatan Pesanan (Opsional)</label>
                                <input type="text" placeholder="Misal: pedas, jangan pakai es..." value={checkoutData.notes} onChange={e => setCheckoutData({...checkoutData, notes: e.target.value})} className="glass-input rounded-xl px-4 py-3 text-sm w-full" />
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setCheckoutModal(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Batal</button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold">Pesan Sekarang</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pay Debt Modal */}
            {showPayDebtModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="font-extrabold text-2xl text-slate-800 mb-2">Lunasi Kasbon Kantin</h3>
                        <p className="text-sm text-slate-500 mb-6">Total Tagihan: <span className="font-bold text-slate-800">{formatCurrency(showPayDebtModal.total_amount)}</span></p>
                        
                        <form onSubmit={handlePayDebt} className="space-y-5">
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <label className="text-xs font-semibold text-slate-700 block">Metode Pembayaran</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                                            <input type="radio" value="qris" checked={debtPaymentMethod === 'qris'} onChange={(e) => setDebtPaymentMethod(e.target.value)} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                                            QRIS
                                        </label>
                                        <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                                            <input type="radio" value="cash" checked={debtPaymentMethod === 'cash'} onChange={(e) => setDebtPaymentMethod(e.target.value)} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                                            Tunai (Titip ke Pengelola)
                                        </label>
                                    </div>
                                </div>
                                
                                {debtPaymentMethod === 'qris' && (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                        <div className="text-xs font-semibold text-slate-700 text-center mb-2">Scan QRIS di bawah ini untuk melunasi kasbon.</div>
                                        <div className="flex justify-center">
                                            <img src="/images/Qris.jpeg" alt="QRIS Kantin" className="w-40 h-40 object-contain rounded-xl shadow-sm border border-slate-300" />
                                        </div>
                                        <label className="text-xs font-semibold text-slate-700 block mt-2">Lalu Upload Bukti QRIS</label>
                                        {paymentProof ? (
                                            <div className="relative group w-full h-32 rounded-xl overflow-hidden border border-slate-300 bg-slate-100 flex items-center justify-center mb-2 shadow-inner">
                                                <img loading="lazy" src={URL.createObjectURL(paymentProof)} alt="preview" className="w-full h-full object-cover" />
                                                <button aria-label="Action Button" type="button" onClick={() => setPaymentProof(null)} className="absolute top-2 right-2 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-100 transition-opacity shadow-md">&times;</button>
                                            </div>
                                        ) : (
                                            <div className="mt-1">
                                                <label className="flex flex-col items-center justify-center gap-2 p-3 border-2 border-slate-300 border-dashed rounded-xl bg-white hover:bg-slate-100 cursor-pointer transition-colors text-slate-500 hover:text-blue-600 hover:border-blue-300">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                    <span className="text-[10px] font-bold text-center leading-tight">Pilih dari Galeri</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files[0]) setPaymentProof(e.target.files[0]) }} />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => { setShowPayDebtModal(null); setPaymentProof(null); setDebtPaymentMethod('qris'); }} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Batal</button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-slate-800 dark:bg-slate-600 text-white rounded-xl font-bold">Ajukan Pelunasan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Item Info Modal */}
            {selectedItemInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setSelectedItemInfo(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                        
                        <div className="w-full h-48 bg-slate-100 rounded-2xl mb-6 flex items-center justify-center overflow-hidden">
                            {selectedItemInfo.image ? <img src={`/storage/${selectedItemInfo.image}`} alt={selectedItemInfo.name} className="object-cover w-full h-full" /> : <span className="text-5xl text-slate-300">🍴</span>}
                        </div>
                        
                        <h3 className="font-extrabold text-2xl text-slate-800 mb-2">{selectedItemInfo.name}</h3>
                        <div className="text-xl font-bold text-emerald-600 mb-4">{formatCurrency(selectedItemInfo.price)}</div>
                        
                        <div className="space-y-4 text-sm text-slate-600">
                            <div>
                                <span className="font-bold text-slate-800">Kategori:</span> <span className="capitalize">{translateCategory(selectedItemInfo.category)}</span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-800">Sisa Stok:</span> {selectedItemInfo.stock > 0 ? `${selectedItemInfo.stock} ${selectedItemInfo.unit || ''}` : <span className="text-red-500 font-bold">Habis</span>}
                            </div>
                            
                            {selectedItemInfo.description && (
                                <div>
                                    <span className="font-bold text-slate-800 block mb-1">Deskripsi:</span>
                                    <p className="bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedItemInfo.description}</p>
                                </div>
                            )}

                            {selectedItemInfo.recipes?.length > 0 && (
                                <div>
                                    <span className="font-bold text-slate-800 block mb-1">Komposisi Bahan:</span>
                                    <ul className="list-disc pl-5 space-y-1 bg-amber-50 p-3 rounded-xl border border-amber-100 text-amber-800">
                                        {selectedItemInfo.recipes.map(r => (
                                            <li key={r.id}>{r.ingredient?.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => { addToCart(selectedItemInfo); setSelectedItemInfo(null); }}
                            disabled={selectedItemInfo.stock <= 0}
                            className="w-full mt-8 py-3 bg-slate-800 dark:bg-slate-600 text-white font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        >
                            {selectedItemInfo.stock > 0 ? '+ Tambah ke Keranjang' : 'Stok Habis'}
                        </button>
                    </div>
                </div>
            )}

            {/* Limit Warning Modal */}
            {limitWarningData && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
                        <div className="bg-red-500 p-6 flex flex-col items-center justify-center text-white">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-center">Transaksi Ditolak!</h3>
                            <p className="text-red-100 text-center text-sm mt-1">Batas Maksimal Kasbon: Rp 250.000</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Utang Saat Ini</span>
                                    <span className="font-semibold text-slate-800">Rp {limitWarningData.existingDebt.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Pesanan Baru</span>
                                    <span className="font-semibold text-slate-800">Rp {limitWarningData.newOrder.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold">
                                    <span className="text-slate-800">Total Keseluruhan</span>
                                    <span className="text-red-600">Rp {(limitWarningData.existingDebt + limitWarningData.newOrder).toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                            <p className="text-sm text-center text-slate-600 leading-relaxed px-2">
                                {limitWarningData.message}
                            </p>
                            <button
                                onClick={() => setLimitWarningData(null)}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 mt-2"
                            >
                                Mengerti & Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {limitWarningModalUI}
        </div>
    );
}


