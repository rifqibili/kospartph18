import React, { useState, useEffect, useRef } from 'react';

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


    useEffect(() => {
        if (activeSubTab === 'faq') loadFaqs();
        else if (activeSubTab === 'virtual_tour') loadTours();
        else if (activeSubTab === 'testimoni') loadTestimonials();
    }, [activeSubTab]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Sub-Tabs Nav */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
                {[
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
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Unggah Video (.mp4)</label>
                                <input id="video-upload" type="file" accept="video/mp4,video/quicktime" onChange={e => setTourForm({...tourForm, video: e.target.files[0]})} className="glass-input rounded-xl px-4 py-2.5 text-sm w-full" />
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
        </div>
    );
}
