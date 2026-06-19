import React, { useState } from 'react';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Pendaftaran Akun - Kospart PH 18" />

            {/* Header Form */}
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-800 bg-clip-text text-transparent tracking-tight font-outfit mb-2">Daftar Akun Baru</h2>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Bergabunglah bersama Kospart PH 18 untuk memesan kamar premium pilihan Anda secara online.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                {/* Field: Name */}
                <div className="space-y-1">
                    <label htmlFor="name" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                        Nama Lengkap
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 text-slate-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        </div>
                        <input
                            id="name"
                            name="name"
                            value={data.name}
                            autoComplete="name"
                            autoFocus
                            onChange={(e) => setData('name', e.target.value)}
                            className="pl-11 pr-4 py-3 rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-sm w-full focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-emerald-300"
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <InputError message={errors.name} className="mt-1" />
                </div>

                {/* Field: Email */}
                <div className="space-y-1">
                    <label htmlFor="email" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                        Alamat Email
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 text-slate-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                        </div>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            className="pl-11 pr-4 py-3 rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-sm w-full focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-emerald-300"
                            placeholder="rianaditya@gmail.com"
                            required
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1" />
                </div>

                {/* Field: Phone (WhatsApp) */}
                <div className="space-y-1">
                    <label htmlFor="phone" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                        Nomor WhatsApp
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5 text-slate-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.28-5.116-3.572-6.396-6.396l1.293-.97c.362-.271.527-.733.417-1.173L6.763 3.84a1.25 1.25 0 0 0-1.091-.852H4.378A2.25 2.25 0 0 0 2.25 5.25v1.5Z" />
                            </svg>
                        </div>
                        <input
                            id="phone"
                            type="text"
                            name="phone"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className="pl-11 pr-4 py-3 rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-sm w-full focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-emerald-300"
                            placeholder="Contoh: 089876543210"
                            required
                        />
                    </div>
                    <InputError message={errors.phone} className="mt-1" />
                </div>

                {/* Field: Password */}
                <div className="space-y-1">
                    <label htmlFor="password" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                        Password
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 text-slate-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                        </div>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            className="pl-11 pr-10 py-3 rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-sm w-full focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-emerald-300"
                            placeholder="Minimal 8 karakter"
                            required
                        />
                        <button aria-label="Action Button" 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-600 focus:outline-none"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3.15 3.15m-3.15-3.15-2.096-2.096M9.433 9.433l1.83 1.83m-1.83-1.83a3 3 0 0 0 4.243 4.242" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-1" />
                </div>

                {/* Field: Confirm Password */}
                <div className="space-y-1">
                    <label htmlFor="password_confirmation" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                        Konfirmasi Password
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 text-slate-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                        </div>
                        <input
                            id="password_confirmation"
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="password_confirmation"
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="pl-11 pr-10 py-3 rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-sm w-full focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-emerald-300"
                            placeholder="Ulangi password"
                            required
                        />
                        <button aria-label="Action Button" 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-600 focus:outline-none"
                        >
                            {showConfirmPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3.15 3.15m-3.15-3.15-2.096-2.096M9.433 9.433l1.83 1.83m-1.83-1.83a3 3 0 0 0 4.243 4.242" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <InputError message={errors.password_confirmation} className="mt-1" />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button aria-label="Action Button" 
                        type="submit"
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-emerald-600/25 active:scale-[0.98] hover:shadow-xl hover:shadow-emerald-600/40 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-50"
                        disabled={processing}
                    >
                        {processing ? 'Memproses Pendaftaran...' : 'Daftar Akun Sekarang'}
                    </button>
                </div>

                <div className="text-center mt-4 pt-4 border-t border-slate-100 font-sans">
                    <span className="text-xs text-slate-500">Sudah punya akun? </span>
                    <Link
                        href={route('login')}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors focus:outline-none focus:underline"
                    >
                        Masuk di Sini
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}

