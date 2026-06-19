import React, { useState, useEffect, useMemo } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';

export default function UsersManagementTab({ branches, authFetch, showToast }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'operator',
        assigned_branches: []
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await authFetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                showToast('Gagal memuat data pengguna', 'error');
            }
        } catch (e) {
            showToast('Kesalahan jaringan', 'error');
        }
        setLoading(false);
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setModalMode('edit');
            setFormData({
                id: user.id,
                name: user.name || '',
                email: user.email || '',
                password: '',
                phone: user.phone || '',
                role: user.role || 'resident',
                assigned_branches: Array.isArray(user.assigned_branches) 
                    ? user.assigned_branches.map(String) 
                    : []
            });
        } else {
            setModalMode('create');
            setFormData({
                id: null,
                name: '',
                email: '',
                password: '',
                phone: '',
                role: 'operator',
                assigned_branches: []
            });
        }
        setShowModal(true);
    };

    const handleBranchToggle = (branchId) => {
        setFormData(prev => {
            const branches = prev.assigned_branches || [];
            if (branches.includes(branchId)) {
                return { ...prev, assigned_branches: branches.filter(id => id !== branchId) };
            } else {
                return { ...prev, assigned_branches: [...branches, branchId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const url = modalMode === 'create' ? '/api/users' : `/api/users/${formData.id}`;
        const method = modalMode === 'create' ? 'POST' : 'PUT';
        
        const payload = { ...formData };
        if (modalMode === 'edit' && !payload.password) {
            delete payload.password;
        }

        try {
            const res = await authFetch(url, {
                method,
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.ok) {
                showToast(data.message);
                setShowModal(false);
                fetchUsers();
            } else {
                showToast(data.message || 'Gagal menyimpan data', 'error');
            }
        } catch (e) {
            showToast('Kesalahan jaringan', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan.')) return;
        
        try {
            const res = await authFetch(`/api/users/${id}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (res.ok) {
                showToast(data.message);
                fetchUsers();
            } else {
                showToast(data.message || 'Gagal menghapus pengguna', 'error');
            }
        } catch (e) {
            showToast('Kesalahan jaringan', 'error');
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesRole = filterRole === 'all' || u.role === filterRole;
            const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (u.phone || '').includes(searchTerm);
            return matchesRole && matchesSearch;
        });
    }, [users, filterRole, searchTerm]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterRole]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredUsers, currentPage]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const getRoleBadge = (role) => {
        switch(role) {
            case 'super_admin':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">👑 Super Admin</span>;
            case 'operator':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">👨‍💻 Operator</span>;
            case 'resident':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">🏠 Penghuni</span>;
            case 'karyawan':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">🛠️ Karyawan</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">{role}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Controls */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Manajemen Pengguna</h3>
                    <p className="text-sm text-slate-500 mt-1">Kelola data admin, operator cabang, dan akun penghuni kos.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama, email, atau HP..."
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition duration-150 ease-in-out"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <select 
                        className="block w-full sm:w-40 py-2 pl-3 pr-10 text-sm border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl transition duration-150 ease-in-out"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                    >
                        <option value="all">Semua Peran</option>
                        <option value="resident">Penghuni</option>
                        <option value="operator">Operator</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="karyawan">Karyawan</option>
                    </select>

                    <PrimaryButton onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap shadow-md shadow-emerald-500/20 py-2.5 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Tambah Akun
                    </PrimaryButton>
                </div>
            </div>

            {/* Users List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-500 font-medium animate-pulse">Memuat data pengguna...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-auto w-full max-h-[700px] relative">
                        <table className="w-full whitespace-nowrap min-w-max text-left text-sm text-slate-600">
                            <thead className="sticky top-0 z-10 shadow-sm">
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold tracking-wide uppercase text-[10px]">
                                    <th className="p-4 pl-6">Profil Pengguna</th>
                                    <th className="p-4">Kontak</th>
                                    <th className="p-4">Peran (Role)</th>
                                    <th className="p-4">Akses / Status Kamar</th>
                                    <th className="p-4 pr-6 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                                <p className="text-base font-medium text-slate-600">Tidak ada pengguna ditemukan.</p>
                                                <p className="text-sm mt-1">Coba sesuaikan kata kunci pencarian atau filter peran.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedUsers.map(user => {
                                    const activeBooking = user.bookings?.find(b => b.status === 'active' || b.status === 'pending');
                                    
                                    return (
                                    <tr key={user.id} className="transition-colors group hover:bg-transparent dark:hover:bg-transparent">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shadow-sm border border-emerald-200 overflow-hidden flex-shrink-0">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=fff&bold=true`} alt={user.name} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{user.name}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                                <span className="font-medium">{user.phone || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="p-4 min-w-[200px] whitespace-normal">
                                            {['operator', 'karyawan'].includes(user.role) ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {user.assigned_branches && user.assigned_branches.length > 0 ? (
                                                        user.assigned_branches.map(bid => {
                                                            const b = branches.find(br => br.id === Number(bid));
                                                            return <span key={bid} className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm">{b ? b.name : 'Unknown'}</span>;
                                                        })
                                                    ) : <span className="text-xs text-red-500 font-medium italic">Belum ada cabang</span>}
                                                </div>
                                            ) : user.role === 'super_admin' ? (
                                                <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                                    Akses Penuh (Semua Cabang)
                                                </span>
                                            ) : activeBooking ? (
                                                <div className="text-xs">
                                                    <div className="font-bold text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded border border-emerald-100">
                                                        Kamar {activeBooking.room?.room_number}
                                                    </div>
                                                    <div className="text-slate-500 mt-1">{activeBooking.room?.branch?.name}</div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Tidak ada sewa aktif</span>
                                            )}
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-100 lg:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                                                <button onClick={() => handleOpenModal(user)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors tooltip" title="Edit Akun">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                </button>
                                                <button onClick={() => handleDelete(user.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors tooltip" title="Hapus Akun">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                            <span className="text-xs text-slate-500">
                                Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} dari {filteredUsers.length} pengguna
                            </span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Form Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-slide-up transform transition-all">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h3 className="font-extrabold text-xl text-slate-800">
                                {modalMode === 'create' ? 'Tambah Akun Pengguna' : 'Edit Detail Akun'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                            <form id="userForm" onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <InputLabel value="Nama Lengkap" className="font-bold text-slate-700" />
                                    <TextInput type="text" className="w-full mt-1.5 shadow-sm rounded-xl border-slate-300" placeholder="Contoh: Budi Santoso" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <InputLabel value="Alamat Email" className="font-bold text-slate-700" />
                                        <TextInput type="email" className="w-full mt-1.5 shadow-sm rounded-xl border-slate-300" placeholder="admin@kospart.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                                    </div>
                                    <div>
                                        <InputLabel value="Nomor WhatsApp" className="font-bold text-slate-700" />
                                        <TextInput type="text" className="w-full mt-1.5 shadow-sm rounded-xl border-slate-300" placeholder="081234567890" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel value={modalMode === 'create' ? 'Password Akses' : 'Password Baru (Opsional)'} className="font-bold text-slate-700" />
                                    <TextInput type="password" className="w-full mt-1.5 shadow-sm rounded-xl border-slate-300" placeholder={modalMode === 'create' ? 'Minimal 6 karakter' : 'Biarkan kosong jika tidak diganti'} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={modalMode === 'create'} />
                                </div>

                                <div>
                                    <InputLabel value="Hak Akses / Peran" className="font-bold text-slate-700" />
                                    <select className="w-full mt-1.5 border-slate-300 rounded-xl shadow-sm bg-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                        <option value="resident">🏠 Penghuni / Resident</option>
                                        <option value="operator">👨‍💻 Operator Cabang</option>
                                        <option value="super_admin">👑 Super Admin</option>
                                        <option value="karyawan">🛠️ Karyawan (Kantin)</option>
                                    </select>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {formData.role === 'super_admin' ? 'Memiliki akses penuh ke seluruh fitur dan pengaturan cabang.' :
                                         formData.role === 'operator' ? 'Hanya dapat mengelola transaksi, komplain, dan tenant pada cabang yang ditugaskan.' :
                                         formData.role === 'karyawan' ? 'Karyawan yang bisa mengambil stok kantin secara gratis.' :
                                         'Akun untuk penyewa kamar. Dapat melihat tagihan dan mengajukan komplain.'}
                                    </p>
                                </div>

                                {['operator', 'karyawan'].includes(formData.role) && (
                                    <div className="p-5 bg-white border border-slate-200 rounded-xl mt-4 shadow-sm animate-fade-in">
                                        <div className="flex items-center gap-2 mb-3">
                                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                            <p className="text-sm font-extrabold text-slate-800">Penugasan Cabang Kos</p>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-4">Pilih satu atau beberapa cabang yang akan dikelola oleh operator ini.</p>
                                        
                                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {branches.length === 0 ? (
                                                <p className="text-sm text-red-500 italic">Belum ada cabang terdaftar.</p>
                                            ) : branches.map(branch => {
                                                const isChecked = (formData.assigned_branches || []).includes(branch.id.toString());
                                                return (
                                                <label key={branch.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                                                    <div className="flex items-center h-5 mt-0.5">
                                                        <input 
                                                            type="checkbox" 
                                                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 transition-colors"
                                                            checked={isChecked}
                                                            onChange={() => handleBranchToggle(branch.id.toString())}
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className={`text-sm font-bold block ${isChecked ? 'text-emerald-800' : 'text-slate-700'}`}>{branch.name}</span>
                                                        <span className="text-[10px] text-slate-500 block truncate max-w-[250px]">{branch.address}</span>
                                                    </div>
                                                </label>
                                            )})}
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
                            <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batalkan</button>
                            <PrimaryButton form="userForm" type="submit" className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/30 py-2.5 rounded-xl px-6 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                {modalMode === 'create' ? 'Buat Akun Sekarang' : 'Simpan Perubahan'}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
}


