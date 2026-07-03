import { Head, Link, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const initials = user.name
        ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    const roleLabel =
        user.role === 'super_admin' ? 'Admin' :
        user.role === 'operator'    ? 'Operator' :
        user.role === 'karyawan'    ? 'Karyawan' : 'Penghuni';

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
            <Head title="Pengaturan Profil – Kospart PH 18" />

            {/* ── Top Bar — sama persis seperti header dashboard ──── */}
            <div className="h-20 bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 shadow-sm shrink-0">
                            <img loading="lazy" src="/images/logo 2.jpeg" alt="Logo Kospart" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-extrabold text-lg tracking-tight text-emerald-800 dark:text-emerald-400 block leading-tight">KOSPART</span>
                            <span className="text-amber-500 text-[10px] font-bold tracking-[0.2em] uppercase block">PH 18 LAMPUNG</span>
                        </div>
                    </div>
                </div>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl text-sm font-semibold transition-colors border border-slate-200 dark:border-gray-600"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Kembali ke Dashboard
                </Link>
            </div>

            {/* ── Hero Banner — identik dengan welcome banner dashboard ── */}
            <div className="relative overflow-hidden">
                {/* Background gradient sama dengan dashboard */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-900 dark:via-teal-900 dark:to-slate-900" />
                {/* Decorative blobs — sama dengan dashboard */}
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-teal-300/20 dark:bg-teal-400/10 blur-2xl" />
                <div className="absolute top-2 right-20 w-16 h-16 rounded-full bg-cyan-300/20 blur-xl" />
                {/* Dot pattern — sama dengan dashboard */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                {/* Content */}
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 flex items-center gap-5">
                    {/* Avatar — sama gaya dengan welcome banner dashboard */}
                    <div className="w-14 h-14 rounded-2xl bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-2xl font-extrabold shadow shrink-0 select-none">
                        {initials}
                    </div>
                    <div>
                        <p className="text-white/70 text-xs font-medium tracking-wide">Pengaturan Profil 👤</p>
                        <p className="text-white font-extrabold text-xl leading-tight drop-shadow-sm">{user.name}</p>
                        <p className="text-white/80 text-sm mt-0.5">{user.email}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-white/20 border border-white/30 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                            {roleLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Content Cards — gaya glass-panel sesuai dashboard ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

                {/* Card 1 – Info Akun */}
                <div className="glass-panel bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-extrabold text-slate-800 dark:text-white text-base leading-tight">Informasi Akun</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Perbarui nama dan alamat email</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} />
                    </div>
                </div>

                {/* Card 2 – Ubah Sandi */}
                <div className="glass-panel bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-extrabold text-slate-800 dark:text-white text-base leading-tight">Ubah Kata Sandi</h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Gunakan kata sandi yang kuat dan unik</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <UpdatePasswordForm />
                    </div>
                </div>

                {/* Card 3 – Hapus Akun */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-extrabold text-red-700 dark:text-red-400 text-base leading-tight">Zona Berbahaya</h2>
                            <p className="text-xs text-red-400 dark:text-red-500">Tindakan ini tidak dapat dibatalkan</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <DeleteUserForm />
                    </div>
                </div>

            </div>
        </div>
    );
}
