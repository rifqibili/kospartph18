import React from 'react';

export default function FinancesTab({
    currentRole,
    operatorBranches,
    branches,
    newFinance,
    setNewFinance,
    handleAddFinance,
    financeBranchFilter,
    setFinanceBranchFilter,
    financeTypeFilter,
    setFinanceTypeFilter,
    financeCategoryFilter,
    setFinanceCategoryFilter,
    financePaymentMethodFilter,
    setFinancePaymentMethodFilter,
    financeSearch,
    setFinanceSearch,
    financeDateFilterType,
    setFinanceDateFilterType,
    financeDateFilterStart,
    setFinanceDateFilterStart,
    financeDateFilterEnd,
    setFinanceDateFilterEnd,
    handleExportFinanceCSV,
    visibleFinances
}) {
    const totalIncome = visibleFinances.reduce((acc, f) => f.transaction_type === 'income' && !f.is_kasbon ? acc + parseFloat(f.amount) : acc, 0);
    const totalExpense = visibleFinances.reduce((acc, f) => f.transaction_type === 'expense' ? acc + parseFloat(f.amount) : acc, 0);
    const totalPendingKasbon = visibleFinances.reduce((acc, f) => f.is_kasbon ? acc + parseFloat(f.amount) : acc, 0);
    const netProfit = totalIncome - totalExpense;

    return (
        <div className="space-y-6">

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Arus Kas Form */}
                {['super_admin', 'operator'].includes(currentRole) && (
                    <div className="lg:col-span-4 glass-panel p-6 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-sm min-w-0">
                        <div>
                            <h3 className="font-extrabold text-lg text-slate-800 mb-4">Catat Keuangan Manual</h3>
                            <form onSubmit={handleAddFinance} className="space-y-4">
                                {/* Detail Utama */}
                                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-4">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                        Detail Transaksi
                                    </h4>
                                    
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Cabang *</label>
                                        <select 
                                            required
                                            value={newFinance.branch_id}
                                            onChange={(e) => setNewFinance({...newFinance, branch_id: e.target.value})}
                                            className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                        >
                                            <option value="">-- Pilih Cabang --</option>
                                            {branches.filter(b => currentRole === 'operator' ? operatorBranches.some(br => Number(br) === Number(b.id)) : true).map(b => (
                                                <option key={b.id} value={b.id}>{b.name.replace('Kospart PH 18 - ', '')}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500">Jenis *</label>
                                            <select 
                                                required
                                                value={newFinance.transaction_type}
                                                onChange={(e) => setNewFinance({...newFinance, transaction_type: e.target.value})}
                                                className={`glass-input rounded-xl px-4 py-2.5 text-sm w-full font-bold ${newFinance.transaction_type === 'income' ? 'text-emerald-700' : 'text-red-700'}`}
                                            >
                                                <option value="expense">Keluar (Pengeluaran)</option>
                                                <option value="income">Masuk (Pemasukan)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500">Jumlah Uang *</label>
                                            <input 
                                                type="number" 
                                                required
                                                value={newFinance.amount}
                                                onChange={(e) => setNewFinance({...newFinance, amount: e.target.value})}
                                                className="glass-input rounded-xl px-4 py-2.5 text-sm w-full font-mono font-bold"
                                                placeholder="250000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Kategori & Metode */}
                                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-4">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                                        Kategori & Metode
                                    </h4>
                                    
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Kategori *</label>
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

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500">Metode *</label>
                                            <select 
                                                required
                                                value={newFinance.payment_method || 'cash'}
                                                onChange={(e) => setNewFinance({...newFinance, payment_method: e.target.value})}
                                                className="glass-input rounded-xl px-3 py-2.5 text-sm w-full"
                                            >
                                                <option value="cash">Tunai (Cash)</option>
                                                <option value="transfer">Transfer</option>
                                                <option value="other">Lainnya</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500">Tanggal *</label>
                                            <input 
                                                type="date" 
                                                required
                                                value={newFinance.transaction_date}
                                                onChange={(e) => setNewFinance({...newFinance, transaction_date: e.target.value})}
                                                className="glass-input rounded-xl px-3 py-2.5 text-sm w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Keterangan & Bukti */}
                                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 block">Deskripsi</label>
                                        <textarea 
                                            value={newFinance.description}
                                            onChange={(e) => setNewFinance({...newFinance, description: e.target.value})}
                                            className="glass-input rounded-xl px-4 py-2 text-sm w-full h-14 resize-none"
                                            placeholder="Beli token listrik, dsb..."
                                        />
                                    </div>
                                    {newFinance.transaction_type === 'expense' && (
                                        <div className="space-y-1 pt-1 border-t border-slate-200">
                                            <label className="text-xs font-semibold text-slate-500 block mt-2 mb-1">Upload Struk (Wajib)</label>
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                required
                                                onChange={(e) => setNewFinance({...newFinance, receipt_file: e.target.files[0]})}
                                                className="glass-input rounded-xl px-4 py-2 text-xs w-full file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                            />
                                        </div>
                                    )}
                                </div>

                                <button type="submit" className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    Simpan Transaksi
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Arus Kas List */}
                <div className={`glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm min-w-0 flex flex-col gap-6 ${['super_admin', 'operator'].includes(currentRole) ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-extrabold text-lg text-slate-800 w-full sm:w-auto">Laporan Arus Kas</h3>

                            {/* Pilihan Cabang (Hanya untuk Admin / Operator yang memiliki akses multi-cabang) */}
                            {currentRole !== 'resident' && (
                                <select 
                                    value={financeBranchFilter} 
                                    onChange={e => setFinanceBranchFilter(e.target.value)}
                                    className="glass-input rounded-xl px-3 py-1.5 text-xs font-bold border-slate-200"
                                >
                                    {currentRole !== 'operator' && <option value="">Semua Cabang</option>}
                                    {branches.filter(b => currentRole === 'operator' ? operatorBranches.some(br => Number(br) === Number(b.id)) : true).map(b => (
                                        <option key={b.id} value={b.id}>{b.name.replace('Kospart PH 18 - ', '')}</option>
                                    ))}
                                </select>
                            )}

                            <select 
                                value={financeTypeFilter} 
                                onChange={e => setFinanceTypeFilter(e.target.value)}
                                className="glass-input rounded-xl px-3 py-1.5 text-xs font-bold border-slate-200"
                            >
                                <option value="all">Semua Laporan</option>
                                <option value="room">Kos / Kamar</option>
                                <option value="canteen">Kantin</option>
                            </select>

                            <select 
                                value={financeCategoryFilter} 
                                onChange={e => setFinanceCategoryFilter(e.target.value)}
                                className="glass-input rounded-xl px-3 py-1.5 text-xs font-bold border-slate-200"
                            >
                                <option value="all">Semua Kategori</option>
                                <option value="rental">Rental (Sewa)</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="electricity">Listrik</option>
                                <option value="internet">Internet</option>
                                <option value="salary">Gaji Karyawan</option>
                                <option value="canteen_purchase">Kulakan Kantin</option>
                                <option value="Kasbon Kantin">Kasbon Kantin</option>
                                <option value="pendapatan_kantin">Pendapatan Kantin</option>
                                <option value="other">Lainnya</option>
                            </select>

                            <select 
                                value={financePaymentMethodFilter} 
                                onChange={e => setFinancePaymentMethodFilter(e.target.value)}
                                className="glass-input rounded-xl px-3 py-1.5 text-xs font-bold border-slate-200"
                            >
                                <option value="all">Semua Metode Pembayaran</option>
                                <option value="cash">Tunai (Cash)</option>
                                <option value="transfer">Transfer Bank / QRIS</option>
                                <option value="debt">Kasbon / Hutang</option>
                                <option value="other">Lainnya</option>
                            </select>

                            <select 
                                value={financeDateFilterType} 
                                onChange={e => {
                                    setFinanceDateFilterType(e.target.value);
                                    setFinanceDateFilterStart('');
                                    setFinanceDateFilterEnd('');
                                }}
                                className="glass-input rounded-xl px-3 py-1.5 text-xs font-bold border-slate-200"
                            >
                                <option value="all">Semua Waktu</option>
                                <option value="daily">Harian</option>
                                <option value="monthly">Bulanan</option>
                                <option value="yearly">Tahunan</option>
                                <option value="custom">Rentang Tanggal</option>
                            </select>

                            {financeDateFilterType === 'daily' && (
                                <input type="date" value={financeDateFilterStart} onChange={e => setFinanceDateFilterStart(e.target.value)} className="glass-input rounded-xl px-3 py-1.5 text-xs border-slate-200" />
                            )}
                            {financeDateFilterType === 'monthly' && (
                                <input type="month" value={financeDateFilterStart} onChange={e => setFinanceDateFilterStart(e.target.value)} className="glass-input rounded-xl px-3 py-1.5 text-xs border-slate-200" />
                            )}
                            {financeDateFilterType === 'yearly' && (
                                <input type="number" placeholder="Tahun (e.g. 2026)" value={financeDateFilterStart} onChange={e => setFinanceDateFilterStart(e.target.value)} className="glass-input rounded-xl px-3 py-1.5 text-xs border-slate-200 w-28" />
                            )}
                            {financeDateFilterType === 'custom' && (
                                <div className="flex items-center gap-2">
                                    <input type="date" value={financeDateFilterStart} onChange={e => setFinanceDateFilterStart(e.target.value)} className="glass-input rounded-xl px-3 py-1.5 text-xs border-slate-200" />
                                    <span className="text-xs text-slate-500">s/d</span>
                                    <input type="date" value={financeDateFilterEnd} onChange={e => setFinanceDateFilterEnd(e.target.value)} className="glass-input rounded-xl px-3 py-1.5 text-xs border-slate-200" />
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <input 
                                    type="text" 
                                    placeholder="Cari kategori, deskripsi, penyewa..." 
                                    value={financeSearch} 
                                    onChange={(e) => setFinanceSearch(e.target.value)} 
                                    className="glass-input rounded-xl pl-10 pr-4 py-2 text-sm w-full border-slate-200 shadow-sm"
                                />
                                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            <button 
                                onClick={handleExportFinanceCSV}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Ringkasan Arus Kas (Berdasarkan Filter) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Total Pemasukan</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                </div>
                                <span className="text-emerald-600 font-extrabold text-lg block truncate">Rp {totalIncome.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Total Pengeluaran</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-red-700 shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                                </div>
                                <span className="text-red-600 font-extrabold text-lg block truncate">Rp {totalExpense.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 shadow-sm flex flex-col justify-between">
                            <span className="text-indigo-800/70 text-[10px] font-bold uppercase tracking-wider block">Laba Bersih</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${netProfit >= 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'}`}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <span className={`font-extrabold text-lg block truncate ${netProfit >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>Rp {netProfit.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-between">
                            <span className="text-orange-800/70 text-[10px] font-bold uppercase tracking-wider block">Kasbon (Tertunda)</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <span className="text-orange-600 font-extrabold text-lg block truncate">Rp {totalPendingKasbon.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-auto w-full max-h-[500px] border border-slate-200 rounded-xl relative">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="sticky top-0 z-10 shadow-sm">
                                <tr className="bg-slate-50 text-slate-600 font-bold text-xs uppercase border-b border-slate-200">
                                    <th className="p-3 pl-4">Tanggal</th>
                                    <th className="p-3">Kategori</th>
                                    <th className="p-3">Metode</th>
                                    <th className="p-3">Keterangan</th>
                                    <th className="p-3 text-right pr-4">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {visibleFinances.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-400">
                                            Belum ada data keuangan.
                                        </td>
                                    </tr>
                                ) : visibleFinances.map(f => (
                                    <tr key={f.id} className="">
                                        <td className="p-3 pl-4 font-mono text-xs">
                                            <div className="text-slate-600">{new Date(f.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                            {f.created_at && (
                                                <div className="text-slate-400 text-[10px] mt-0.5">{new Date(f.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span className={`capitalize text-xs font-bold px-2 py-0.5 rounded border ${f.is_kasbon ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{f.category}</span>
                                        </td>
                                        <td className="p-3">
                                            <span className="capitalize text-xs font-bold text-slate-500">
                                                {f.payment_method === 'cash' ? 'Tunai (Cash)' : 
                                                 f.payment_method === 'transfer' ? 'Transfer Bank' : 
                                                 f.payment_method === 'qris' ? 'QRIS' : 
                                                 f.payment_method === 'debt' ? 'Kasbon' : 
                                                 (f.payment_method || '-')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-600">
                                            <div className="truncate max-w-xs">{f.description}</div>
                                            {f.receipt_path && (
                                                <a href={`/${f.receipt_path}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                                    Lihat Struk
                                                </a>
                                            )}
                                            {f.is_kasbon && <span className="ml-2 text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 uppercase tracking-wider">Belum Lunas</span>}
                                        </td>
                                        <td className={`p-3 text-right pr-4 font-mono font-bold ${
                                            f.is_kasbon ? 'text-orange-600' : (f.transaction_type === 'income' ? 'text-emerald-600' : 'text-red-600')
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
    );
}

