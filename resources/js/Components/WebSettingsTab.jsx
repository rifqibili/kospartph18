import React, { useState, useEffect } from 'react';

export default function WebSettingsTab({ authFetch }) {
    const [faqs, setFaqs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newItem, setNewItem] = useState({ question: '', answer: '', is_active: true, order: 0 });
    const [editingId, setEditingId] = useState(null);
    const questionInputRef = React.useRef(null);

    useEffect(() => {
        loadFaqs();
    }, []);

    const loadFaqs = async () => {
        try {
            const res = await authFetch('/api/faqs');
            const data = await res.json();
            setFaqs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await authFetch(`/api/faqs/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newItem)
                });
            } else {
                await authFetch('/api/faqs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newItem)
                });
            }
            setEditingId(null);
            setNewItem({ question: '', answer: '', is_active: true, order: 0 });
            loadFaqs();
            alert('Berhasil disimpan!');
        } catch (e) {
            alert('Terjadi kesalahan.');
        }
    };

    const handleEdit = (faq) => {
        setEditingId(faq.id);
        setNewItem({ question: faq.question, answer: faq.answer, is_active: faq.is_active, order: faq.order });
        if (questionInputRef.current) {
            questionInputRef.current.focus();
            questionInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus FAQ ini?')) return;
        try {
            await authFetch(`/api/faqs/${id}`, { method: 'DELETE' });
            loadFaqs();
        } catch (e) {
            alert('Gagal menghapus');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-lg text-slate-800 mb-4">{editingId ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500">Pertanyaan</label>
                        <input ref={questionInputRef} required type="text" value={newItem.question} onChange={e => setNewItem({...newItem, question: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="Cth: Apakah ada jam malam?" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500">Jawaban</label>
                        <textarea required rows="3" value={newItem.answer} onChange={e => setNewItem({...newItem, answer: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="Jawaban..." />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Urutan Tampil (Order)</label>
                            <input required type="number" value={newItem.order} onChange={e => setNewItem({...newItem, order: parseInt(e.target.value) || 0})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" />
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer px-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full hover:bg-slate-50 transition-all shadow-sm">
                                <input type="checkbox" checked={newItem.is_active} onChange={e => setNewItem({...newItem, is_active: e.target.checked})} className="rounded w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-all" />
                                Aktif & Tampil di Halaman Depan
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                        {editingId && (
                            <button type="button" onClick={() => { setEditingId(null); setNewItem({ question: '', answer: '', is_active: true, order: 0 }); }} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors border border-slate-200">
                                Batal Edit
                            </button>
                        )}
                        <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-colors">
                            {editingId ? 'Simpan Perubahan' : 'Tambah FAQ'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-lg text-slate-800 mb-4">Daftar FAQ (Pertanyaan Sering Diajukan)</h3>
                {isLoading ? (
                    <div className="text-center py-8 text-slate-500">Memuat data...</div>
                ) : faqs.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-medium">Belum ada FAQ.</div>
                ) : (
                    <div className="space-y-4">
                        {faqs.map(faq => (
                            <div key={faq.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                                    <div className="flex items-start gap-3">
                                        <span className="shrink-0 bg-emerald-50 text-emerald-700 text-[11px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-100 shadow-sm mt-0.5">
                                            #{faq.order}
                                        </span>
                                        <div>
                                            <h4 className="font-extrabold text-slate-800 text-sm leading-tight">
                                                {faq.question}
                                                {!faq.is_active && <span className="ml-2 bg-red-50 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-red-100 align-middle">Nonaktif</span>}
                                            </h4>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(faq)} className="px-2.5 py-1 bg-white text-slate-600 font-bold rounded-lg text-[11px] border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors shadow-sm flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(faq.id)} className="px-2.5 py-1 bg-white text-slate-600 font-bold rounded-lg text-[11px] border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors shadow-sm flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                                <div className="sm:pl-[2.15rem]">
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
