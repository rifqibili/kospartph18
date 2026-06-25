import React, { useState, useEffect, useRef } from 'react';
import DragDropZone from '@/Components/DragDropZone';

export default function WebSettingsTab({ authFetch }) {
    const [activeSubTab, setActiveSubTab] = useState('faq');

    // --- FAQ State & Handlers ---
    const [faqs, setFaqs] = useState([]);
    const [isLoadingFaqs, setIsLoadingFaqs] = useState(true);
    const [faqForm, setFaqForm] = useState({ id: null, question: '', answer: '', is_active: true, order: 0 });
    const faqInputRef = useRef(null);

    const loadFaqs = async () => {
        setIsLoadingFaqs(true);
        try {
            const res = await authFetch('/api/faqs');
            setFaqs(await res.json());
        } catch (e) { console.error(e); }
        setIsLoadingFaqs(false);
    };

    const handleSaveFaq = async (e) => {
        e.preventDefault();
        try {
            if (faqForm.id) {
                await authFetch(`/api/faqs/${faqForm.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(faqForm)
                });
            } else {
                await authFetch('/api/faqs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(faqForm)
                });
            }
            setFaqForm({ id: null, question: '', answer: '', is_active: true, order: 0 });
            loadFaqs();
            alert('FAQ disimpan!');
        } catch (e) { alert('Terjadi kesalahan.'); }
    };

    const handleDeleteFaq = async (id) => {
        if (!confirm('Hapus FAQ ini?')) return;
        await authFetch(`/api/faqs/${id}`, { method: 'DELETE' });
        loadFaqs();
    };


    // --- Virtual Tour State & Handlers ---
    const [tours, setTours] = useState([]);
    const [isLoadingTours, setIsLoadingTours] = useState(true);
    const [tourForm, setTourForm] = useState({ id: null, title: '', video: null, is_active: true, order: 0 });
    const tourInputRef = useRef(null);

    const loadTours = async () => {
        setIsLoadingTours(true);
        try {
            const res = await authFetch('/api/virtual-tours');
            setTours(await res.json());
        } catch (e) { console.error(e); }
        setIsLoadingTours(false);
    };

    const handleSaveTour = async (e) => {
        e.preventDefault();
        try {
            const payload = new FormData();
            payload.append('title', tourForm.title);
            if (tourForm.video) payload.append('video', tourForm.video);
            payload.append('is_active', tourForm.is_active ? 1 : 0);
            payload.append('order', tourForm.order);

            if (tourForm.id) {
                await authFetch(`/api/virtual-tours/${tourForm.id}`, { method: 'POST', body: payload }); // Use POST for FormData PUT workaround
            } else {
                if (!tourForm.video) return alert("Video wajib diunggah untuk Tour baru.");
                await authFetch('/api/virtual-tours', { method: 'POST', body: payload });
            }
            setTourForm({ id: null, title: '', video: null, is_active: true, order: 0 });
            // reset file input
            const fileInput = document.getElementById('video-upload');
            if (fileInput) fileInput.value = '';
            loadTours();
            alert('Virtual Tour disimpan!');
        } catch (e) { alert('Terjadi kesalahan.'); }
    };

    const handleDeleteTour = async (id) => {
        if (!confirm('Hapus Tour ini?')) return;
        await authFetch(`/api/virtual-tours/${id}`, { method: 'DELETE' });
        loadTours();
    };


    // --- Testimonial State & Handlers ---
    const [testimonials, setTestimonials] = useState([]);
    const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);
    const [testimonialForm, setTestimonialForm] = useState({ id: null, name: '', role: '', avatar: '', rating: 5, date_text: '', text: '', badge: '', is_active: true, order: 0 });
    const testimoniInputRef = useRef(null);

    const loadTestimonials = async () => {
        setIsLoadingTestimonials(true);
        try {
            const res = await authFetch('/api/testimonials');
            setTestimonials(await res.json());
        } catch (e) { console.error(e); }
        setIsLoadingTestimonials(false);
    };

    const handleSaveTestimonial = async (e) => {
        e.preventDefault();
        try {
            if (testimonialForm.id) {
                await authFetch(`/api/testimonials/${testimonialForm.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testimonialForm)
                });
            } else {
                await authFetch('/api/testimonials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testimonialForm)
                });
            }
            setTestimonialForm({ id: null, name: '', role: '', avatar: '', rating: 5, date_text: '', text: '', badge: '', is_active: true, order: 0 });
            loadTestimonials();
            alert('Testimoni disimpan!');
        } catch (e) { alert('Terjadi kesalahan.'); }
    };

    const handleDeleteTestimonial = async (id) => {
        if (!confirm('Hapus Testimoni ini?')) return;
        await authFetch(`/api/testimonials/${id}`, { method: 'DELETE' });
        loadTestimonials();
    };


    // --- Pengaturan Umum State & Handlers ---
    const [generalSettings, setGeneralSettings] = useState({
        whatsapp_number: '',
        bank_account_name: '',
        bank_account_number: '',
        bank_account_holder: '',
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [settingsMsg, setSettingsMsg] = useState('');

    const loadSettings = async () => {
        try {
            const res = await authFetch('/api/settings');
            const data = await res.json();
            setGeneralSettings({
                whatsapp_number: data.whatsapp_number || '',
                bank_account_name: data.bank_account_name || '',
                bank_account_number: data.bank_account_number || '',
                bank_account_holder: data.bank_account_holder || '',
            });
        } catch (e) { console.error(e); }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSavingSettings(true);
        setSettingsMsg('');
        try {
            const settings = Object.entries(generalSettings).map(([key, value]) => ({ key, value }));
            const res = await authFetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });
            if (res.ok) {
                setSettingsMsg('Pengaturan berhasil disimpan! Refresh halaman untuk melihat perubahan.');
            } else {
                const d = await res.json();
                setSettingsMsg(d.message || 'Gagal menyimpan pengaturan.');
            }
        } catch (e) { setSettingsMsg('Terjadi kesalahan jaringan.'); }
        setIsSavingSettings(false);
    };


    useEffect(() => {
        if (activeSubTab === 'faq') loadFaqs();
        else if (activeSubTab === 'virtual_tour') loadTours();
        else if (activeSubTab === 'testimoni') loadTestimonials();
        else if (activeSubTab === 'general') loadSettings();
    }, [activeSubTab]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Sub-Tabs Nav */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                {[
                    { id: 'general', label: '⚙️ Pengaturan Umum' },
                    { id: 'faq', label: 'FAQ' },
                    { id: 'virtual_tour', label: 'Virtual Tour' },
                    { id: 'testimoni', label: 'Testimoni' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`px-4 py-2 text-sm font-bold rounded-t-xl transition-all ${activeSubTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Based on Active SubTab */}
            {activeSubTab === 'faq' && (
                <div className="space-y-6">
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-extrabold text-lg text-slate-800 mb-4">{faqForm.id ? 'Edit FAQ' : 'Tambah FAQ Baru'}</h3>
                        <form onSubmit={handleSaveFaq} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Pertanyaan</label>
                                <input ref={faqInputRef} required type="text" value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="Cth: Apakah ada jam malam?" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Jawaban</label>
                                <textarea required rows="3" value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="Jawaban..." />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Urutan Tampil (Order)</label>
                                    <input required type="number" value={faqForm.order} onChange={e => setFaqForm({...faqForm, order: parseInt(e.target.value) || 0})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer px-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full hover:bg-slate-50 transition-all shadow-sm">
                                        <input type="checkbox" checked={faqForm.is_active} onChange={e => setFaqForm({...faqForm, is_active: e.target.checked})} className="rounded w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-all" />
                                        Aktif & Tampil
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-2">
                                {faqForm.id && (
                                    <button type="button" onClick={() => setFaqForm({ id: null, question: '', answer: '', is_active: true, order: 0 })} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors border border-slate-200">
                                        Batal Edit
                                    </button>
                                )}
                                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-colors">
                                    {faqForm.id ? 'Simpan Perubahan' : 'Tambah FAQ'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-extrabold text-lg text-slate-800 mb-4">Daftar FAQ</h3>
                        {isLoadingFaqs ? <div className="text-center py-8 text-slate-500">Memuat data...</div> : (
                            <div className="space-y-4">
                                {faqs.map(faq => (
                                    <div key={faq.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between gap-3">
                                        <div>
                                            <div className="font-bold text-sm">#{faq.order} - {faq.question} {!faq.is_active && <span className="text-red-500 text-xs">(Nonaktif)</span>}</div>
                                            <div className="text-xs text-slate-500 mt-1">{faq.answer}</div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => { setFaqForm(faq); faqInputRef.current?.focus(); }} className="text-blue-600 hover:underline text-xs">Edit</button>
                                            <button onClick={() => handleDeleteFaq(faq.id)} className="text-red-600 hover:underline text-xs">Hapus</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeSubTab === 'virtual_tour' && (
                <div className="space-y-6">
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-extrabold text-lg text-slate-800 mb-4">{tourForm.id ? 'Edit Virtual Tour' : 'Tambah Virtual Tour'}</h3>
                        <form onSubmit={handleSaveTour} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Judul Video</label>
                                <input ref={tourInputRef} required type="text" value={tourForm.title} onChange={e => setTourForm({...tourForm, title: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="Cth: Tur Ruang Tunggu" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500">Unggah Video (.mp4)</label>
                                
                                {/* Preview Kecil */}
                                {(tourForm.video_path || tourForm.video) && (
                                    <div className="relative group w-24 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center mb-2">
                                        <svg className={`w-8 h-8 ${tourForm.video ? 'text-emerald-500' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                        {tourForm.video && (
                                            <button type="button" onClick={() => setTourForm({...tourForm, video: null})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">&times;</button>
                                        )}
                                    </div>
                                )}

                                <DragDropZone 
                                    accept="video/mp4,video/quicktime" 
                                    label="Tarik video ke sini atau klik"
                                    selectedFile={tourForm.video}
                                    onFileDrop={(file) => setTourForm({...tourForm, video: file})} 
                                />
                                {tourForm.id && <p className="text-[10px] text-slate-400 mt-1">Biarkan kosong jika tidak ingin mengganti video.</p>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Urutan Tampil</label>
                                    <input required type="number" value={tourForm.order} onChange={e => setTourForm({...tourForm, order: parseInt(e.target.value) || 0})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer px-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full hover:bg-slate-50 transition-all shadow-sm">
                                        <input type="checkbox" checked={tourForm.is_active} onChange={e => setTourForm({...tourForm, is_active: e.target.checked})} className="rounded w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-all" />
                                        Aktif & Tampil
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-2">
                                {tourForm.id && (
                                    <button type="button" onClick={() => setTourForm({ id: null, title: '', video: null, is_active: true, order: 0 })} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors border border-slate-200">Batal Edit</button>
                                )}
                                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-colors">
                                    {tourForm.id ? 'Simpan Perubahan' : 'Tambah Tour'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-extrabold text-lg text-slate-800 mb-4">Daftar Virtual Tour</h3>
                        {isLoadingTours ? <div className="text-center py-8 text-slate-500">Memuat data...</div> : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {tours.map(tour => (
                                    <div key={tour.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <video src={tour.video_path} className="w-full h-32 object-cover bg-slate-900" controls></video>
                                        <div className="p-3">
                                            <div className="font-bold text-sm flex justify-between">
                                                <span>#{tour.order} - {tour.title}</span>
                                                {!tour.is_active && <span className="text-red-500 text-[10px]">Nonaktif</span>}
                                            </div>
                                            <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                                                <button onClick={() => { setTourForm({...tour, video: null}); tourInputRef.current?.focus(); }} className="flex-1 text-center text-blue-600 hover:bg-blue-50 py-1 rounded text-xs font-bold transition-colors">Edit</button>
                                                <button onClick={() => handleDeleteTour(tour.id)} className="flex-1 text-center text-red-600 hover:bg-red-50 py-1 rounded text-xs font-bold transition-colors">Hapus</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeSubTab === 'testimoni' && (
                <div className="space-y-6">
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-extrabold text-lg text-slate-800 mb-4">{testimonialForm.id ? 'Edit Testimoni' : 'Tambah Testimoni'}</h3>
                        <form onSubmit={handleSaveTestimonial} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Nama</label>
                                    <input ref={testimoniInputRef} required type="text" value={testimonialForm.name} onChange={e => setTestimonialForm({...testimonialForm, name: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="Andi Pratama" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Peran / Status</label>
                                    <input required type="text" value={testimonialForm.role} onChange={e => setTestimonialForm({...testimonialForm, role: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="Mahasiswa Unila" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Avatar (Teks/Emoji)</label>
                                    <input type="text" value={testimonialForm.avatar} onChange={e => setTestimonialForm({...testimonialForm, avatar: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="🧑‍🎓" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Rating (1-5)</label>
                                    <input required type="number" min="1" max="5" value={testimonialForm.rating} onChange={e => setTestimonialForm({...testimonialForm, rating: parseInt(e.target.value)})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Badge</label>
                                    <input type="text" value={testimonialForm.badge} onChange={e => setTestimonialForm({...testimonialForm, badge: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="Penghuni Aktif" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Tanggal Teks</label>
                                    <input required type="text" value={testimonialForm.date_text} onChange={e => setTestimonialForm({...testimonialForm, date_text: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="Januari 2026" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Isi Testimoni</label>
                                <textarea required rows="3" value={testimonialForm.text} onChange={e => setTestimonialForm({...testimonialForm, text: e.target.value})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" placeholder="Kosnya bersih banget..." />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Urutan Tampil</label>
                                    <input required type="number" value={testimonialForm.order} onChange={e => setTestimonialForm({...testimonialForm, order: parseInt(e.target.value) || 0})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer px-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full hover:bg-slate-50 transition-all shadow-sm">
                                        <input type="checkbox" checked={testimonialForm.is_active} onChange={e => setTestimonialForm({...testimonialForm, is_active: e.target.checked})} className="rounded w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-all" />
                                        Aktif & Tampil
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-2">
                                {testimonialForm.id && (
                                    <button type="button" onClick={() => setTestimonialForm({ id: null, name: '', role: '', avatar: '', rating: 5, date_text: '', text: '', badge: '', is_active: true, order: 0 })} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors border border-slate-200">Batal Edit</button>
                                )}
                                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-colors">
                                    {testimonialForm.id ? 'Simpan Perubahan' : 'Tambah Testimoni'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-extrabold text-lg text-slate-800 mb-4">Daftar Testimoni</h3>
                        {isLoadingTestimonials ? <div className="text-center py-8 text-slate-500">Memuat data...</div> : (
                            <div className="space-y-4">
                                {testimonials.map(t => (
                                    <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                                        <div className="flex justify-between">
                                            <div className="font-bold text-sm">#{t.order} - {t.avatar} {t.name} ({t.rating} Bintang)</div>
                                            {!t.is_active && <span className="text-red-500 text-xs">Nonaktif</span>}
                                        </div>
                                        <div className="text-xs text-slate-600 italic">"{t.text}"</div>
                                        <div className="flex gap-2 justify-end border-t border-slate-100 pt-2 mt-1">
                                            <button onClick={() => { setTestimonialForm(t); testimoniInputRef.current?.focus(); }} className="text-blue-600 hover:underline text-xs font-bold">Edit</button>
                                            <button onClick={() => handleDeleteTestimonial(t.id)} className="text-red-600 hover:underline text-xs font-bold">Hapus</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {activeSubTab === 'general' && (
                <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm max-w-xl">
                    <h3 className="font-extrabold text-lg text-slate-800 mb-1">Pengaturan Umum</h3>
                    <p className="text-xs text-slate-500 mb-5">Ubah nomor WhatsApp admin dan rekening bank untuk pembayaran sewa.</p>
                    <form onSubmit={handleSaveSettings} className="space-y-5">
                        {/* WhatsApp */}
                        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-3">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                Kontak WhatsApp
                            </h4>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500">Nomor WhatsApp Admin <span className="text-slate-400">(format: 628xxx, tanpa + atau spasi)</span></label>
                                <input
                                    type="text"
                                    required
                                    value={generalSettings.whatsapp_number}
                                    onChange={e => setGeneralSettings({ ...generalSettings, whatsapp_number: e.target.value })}
                                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full font-mono"
                                    placeholder="628980598327"
                                />
                            </div>
                        </div>

                        {/* Bank Account */}
                        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-3">
                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                                Rekening Bank Pembayaran
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Nama Bank</label>
                                    <input
                                        type="text"
                                        required
                                        value={generalSettings.bank_account_name}
                                        onChange={e => setGeneralSettings({ ...generalSettings, bank_account_name: e.target.value })}
                                        className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                        placeholder="BCA"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">No. Rekening</label>
                                    <input
                                        type="text"
                                        required
                                        value={generalSettings.bank_account_number}
                                        onChange={e => setGeneralSettings({ ...generalSettings, bank_account_number: e.target.value })}
                                        className="glass-input rounded-xl px-4 py-2.5 text-sm w-full font-mono"
                                        placeholder="8447060961"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Atas Nama</label>
                                    <input
                                        type="text"
                                        required
                                        value={generalSettings.bank_account_holder}
                                        onChange={e => setGeneralSettings({ ...generalSettings, bank_account_holder: e.target.value })}
                                        className="glass-input rounded-xl px-4 py-2.5 text-sm w-full"
                                        placeholder="NAMA PEMILIK"
                                    />
                                </div>
                            </div>
                            {/* Live Preview */}
                            {(generalSettings.bank_account_name || generalSettings.bank_account_number) && (
                                <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-xs text-emerald-800 font-mono font-bold">
                                    Preview: {generalSettings.bank_account_name}: {generalSettings.bank_account_number} a.n {generalSettings.bank_account_holder}
                                </div>
                            )}
                        </div>

                        {settingsMsg && (
                            <div className={`p-3 rounded-xl text-xs font-semibold ${settingsMsg.includes('berhasil') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {settingsMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSavingSettings}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-colors flex items-center justify-center gap-2"
                        >
                            {isSavingSettings ? (
                                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Menyimpan...</>
                            ) : (
                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg> Simpan Pengaturan</>
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
