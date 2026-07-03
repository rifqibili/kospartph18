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
        user.role === 'super_admin' ? 'Super Admin' :
        user.role === 'operator'    ? 'Operator'    :
        user.role === 'karyawan'    ? 'Karyawan'    : 'Penghuni';

    const roleColor =
        user.role === 'super_admin' ? 'from-violet-600 to-purple-600' :
        user.role === 'operator'    ? 'from-blue-600 to-cyan-500'     :
        user.role === 'karyawan'    ? 'from-amber-500 to-orange-500'  : 'from-emerald-600 to-teal-500';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Head title="Pengaturan Profil – Kospart PH 18" />

            {/* ── Top Bar ──────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-semibold"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali
                    </Link>
                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-slate-800 dark:text-white font-extrabold text-base tracking-tight">Pengaturan Profil</span>
                </div>
            </div>

            {/* ── Hero Banner ──────────────────────────────────────── */}
            <div className={`bg-gradient-to-br ${roleColor} relative overflow-hidden`}>
                {/* Decorative blobs */}
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 relative flex items-center gap-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shrink-0 select-none">
                        {initials}
                    </div>
                    <div>
                        <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-1">Akun Pengguna</p>
                        <h1 className="text-white font-extrabold text-2xl leading-tight drop-shadow">{user.name}</h1>
                        <p className="text-white/80 text-sm mt-0.5">{user.email}</p>
                        <span className="inline-block mt-2 px-2.5 py-0.5 bg-white/20 border border-white/30 text-white text-[11px] font-bold uppercase tracking-wider rounded-full">
                            {roleLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Content ──────────────────────────────────────────── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Card 1 – Info Akun */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
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
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </div>
                </div>

                {/* Card 2 – Ubah Sandi */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
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
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 flex items-center gap-3">
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
