import React from 'react';

export default function FinancesTab({
    currentRole,
    operatorBranches,
    branches,
    newFinance,
    setNewFinance,
    handleAddFinance,
    financeTypeFilter,
    setFinanceTypeFilter,
    financeCategoryFilter,
    setFinanceCategoryFilter,
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
    const totalIncome = visibleFinances.reduce((acc, f) => f.transaction_type === 'income' ? acc + parseFloat(f.amount) : acc, 0);
    const totalExpense = visibleFinances.reduce((acc, f) => f.transaction_type === 'expense' ? acc + parseFloat(f.amount) : acc, 0);
    const netProfit = totalIncome - totalExpense;

    return (
        <div className="space-y-6">
            {/* Ringkasan Arus Kas (Berdasarkan Filter) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between bg-white">
                    <div>
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Total Pemasukan</span>
                        <span className="text-emerald-600 font-extrabold text-2xl block mt-1">Rp {totalIncome.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between bg-white">
                    <div>
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">Total Pengeluaran</span>
                        <span className="text-red-600 font-extrabold text-2xl block mt-1">Rp {totalExpense.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between bg-gradient-to-br from-indigo-50 to-blue-50">
                    <div>
                        <span className="text-slate-600 text-xs font-semibold uppercase tracking-wider block">Laba Bersih</span>
                        <span className={`font-extrabold text-2xl block mt-1 ${netProfit >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>Rp {netProfit.toLocaleString('id-ID')}</span>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${netProfit >= 0 ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-red-100 border-red-200 text-red-700'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>
            </div>
            <div className="grid lg:grid-cols-12 gap-8">
                {/* Arus Kas Form */}
                {['super_admin', 'operator'].includes(currentRole) && (
                    <div className="lg:col-span-4 glass-panel p-6 rounded-2xl flex flex-col justify-between border border-slate-200 shadow-sm">
                        <div>
                            <h3 className="font-extrabold text-lg text-slate-800 mb-4">Catat Keuangan Manual</h3>
                            <form onSubmit={handleAddFinance} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Cabang</label>
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-extrabold text-lg text-slate-800 w-full sm:w-auto">Laporan Arus Kas</h3>
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
                                {visibleFinances.map(f => (
                                    <tr key={f.id} className="hover:bg-slate-50">
                                        <td className="p-3 pl-4 font-mono text-slate-500 text-xs">{new Date(f.transaction_date).toLocaleDateString('id-ID')}</td>
                                        <td className="p-3">
                                            <span className={`capitalize text-xs font-bold px-2 py-0.5 rounded border ${f.is_kasbon ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{f.category}</span>
                                        </td>
                                        <td className="p-3 text-slate-600 truncate max-w-xs">
                                            {f.description}
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
