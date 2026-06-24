import React from 'react';
import { Head } from '@inertiajs/react';

export default function Invoice({ booking }) {
    // Determine status logic similar to Dashboard
    let paidAmount = parseFloat(booking.paid_amount || 0);
    
    // We can just use booking.invoice_items directly since backend generates it now
    let items = [];
    if (booking.invoice_items && booking.invoice_items.length > 0) {
        items = booking.invoice_items.map(it => ({
            ...it,
            start: new Date(it.start),
            end: new Date(it.end),
            price: parseFloat(it.price)
        }));
    } else {
        // Fallback for very old bookings
        items = [{
            label: `Sewa ${booking.rental_type === 'daily' ? 'Harian' : (booking.rental_type === 'weekly' ? 'Mingguan' : (booking.rental_type === 'monthly' ? 'Bulanan' : 'Tahunan'))}`,
            start: new Date(booking.start_date),
            end: new Date(booking.end_date),
            price: parseFloat(booking.total_amount)
        }];
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md print:bg-white print:p-0 print:block">
            <Head title={`Invoice_${booking.tenant?.name?.replace(/[^a-zA-Z0-9]/g, '_')}_Kamar_${booking.room?.room_number}`} />
            
            <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-2xl shadow-emerald-900/20 text-slate-900 relative print:max-w-none print:w-full print:shadow-none print:border-none print:rounded-none print:bg-white print:p-12 print:max-h-none print:overflow-visible mx-auto my-8">
                
                {/* Printable Area */}
                <div className="space-y-6">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                        <div>
                            <img loading="lazy" src="/images/logo 1.jpeg" alt="KOSPART Logo" className="h-16 w-auto mb-3 object-contain rounded-xl" />
                            <h2 className="font-extrabold text-2xl tracking-tight text-emerald-800 uppercase">KOSPART PH 18</h2>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Nota Invoice Tagihan Kos</span>
                            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">{booking.room?.branch?.name}<br />{booking.room?.branch?.address}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-slate-500 uppercase font-semibold">Nomor Invoice</span>
                            <span className="block font-mono font-bold text-sm text-slate-800">{booking.booking_code}</span>
                            <span className="text-[10px] text-slate-500 block mt-2">Dibuat: {new Date(booking.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Details Row */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px] print:text-slate-500">Ditagihkan Kepada:</span>
                            <strong className="text-slate-800 text-sm block mt-1 print:text-black">{booking.tenant?.name}</strong>
                            <span className="text-slate-500 block print:text-slate-600">{booking.tenant?.email}</span>
                            <span className="text-slate-500 block print:text-slate-600">{booking.tenant?.phone}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px] print:text-slate-500">Rincian Hunian:</span>
                            <strong className="text-slate-800 text-sm block mt-1 print:text-black">Kamar {booking.room?.room_number} ({booking.rental_type === 'daily' ? 'Harian' : (booking.rental_type === 'weekly' ? 'Mingguan' : (booking.rental_type === 'monthly' ? 'Bulanan' : 'Tahunan'))})</strong>
                            <span className="text-slate-500 block print:text-slate-600">Check-in: {new Date(booking.start_date).toLocaleDateString('id-ID')}</span>
                            <span className="text-slate-500 block print:text-slate-600">Check-out: {new Date(booking.end_date).toLocaleDateString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Billing Summary Table */}
                    <div className="overflow-x-auto w-full">
                        <table className="w-full whitespace-nowrap min-w-max text-left text-xs border-collapse border border-slate-200 mt-4 print:border-slate-300">
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9px] tracking-wider print:bg-slate-100 print:text-black">
                                    <th className="p-3">Item Deskripsi</th>
                                    <th className="p-3 text-right">Total Tagihan</th>
                                    <th className="p-3 text-right">Total Pembayaran</th>
                                    <th className="p-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.filter(item => Math.round(item.price) > 0).map((item, i, filteredItems) => {
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
                                                Sewa Kamar {booking.room?.room_number} - {item.label} <br />
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
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Total Balance info */}
                    <div className="flex justify-between items-end pt-4">
                        {/* Barcode Simulation */}
                        <div className="text-center space-y-1">
                            <div className="bg-slate-900 text-white font-mono text-[9px] tracking-[6px] px-3 py-1.5 inline-block">
                                *KP-{booking.booking_code.substring(3, 9)}*
                            </div>
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Verifikasi Invoice Asli</span>
                        </div>
                        <div className="text-right space-y-1.5 text-xs">
                            <div>
                                <span className="text-slate-500 font-semibold uppercase text-[10px] mr-4">Total Biaya:</span>
                                <strong className="font-mono text-slate-800">Rp {parseFloat(booking.total_amount).toLocaleString('id-ID')}</strong>
                            </div>
                            <div>
                                <span className="text-slate-500 font-semibold uppercase text-[10px] mr-4">Telah Dibayar:</span>
                                <strong className="font-mono text-emerald-600">Rp {parseFloat(booking.paid_amount).toLocaleString('id-ID')}</strong>
                            </div>
                            <div className="border-t border-slate-200 pt-1">
                                <span className="text-slate-500 font-bold uppercase text-[10px] mr-4">Status Tagihan:</span>
                                <span className={`px-2 py-0.5 font-bold uppercase text-[9px] rounded ${
                                    booking.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                    booking.payment_status === 'unpaid' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                    {booking.payment_status === 'paid' ? 'Lunas' : booking.payment_status === 'unpaid' ? 'Belum Lunas' : 'DP / Sebagian'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex justify-end gap-4 border-t border-slate-200 pt-6 mt-6 print:hidden">
                    <button aria-label="Action Button"  onClick={() => window.print()} className="px-8 py-2.5 font-bold rounded-xl text-sm transition-all shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 hover:-translate-y-0.5 text-white flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Cetak / Simpan PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
