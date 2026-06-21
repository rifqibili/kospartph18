import React, { useState } from 'react';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const handleQuickLogin = (email, password) => {
        setData('email', email);
        setData('password', password);
        router.post(route('login'), {
            email,
            password,
            remember: false
        });
    };

    const quickLogins = [
        { name: 'Admin', role: 'Super Admin', email: 'admin@kospart.com', password: 'admin123', bg: 'bg-red-50 border-red-200 text-red-750 hover:bg-red-100' },
        { name: 'Budi', role: 'Operator (Utama)', email: 'budi@kospart.com', password: 'operator123', bg: 'bg-blue-50 border-blue-200 text-blue-750 hover:bg-blue-100' },
        { name: 'Siti', role: 'Operator (Exec)', email: 'siti@kospart.com', password: 'operator123', bg: 'bg-indigo-50 border-indigo-200 text-indigo-750 hover:bg-indigo-100' },
        { name: 'Dani', role: 'Tenant (No. HP)', email: '085712345678', password: 'tenant123', bg: 'bg-emerald-50 border-emerald-200 text-emerald-750 hover:bg-emerald-100' },
        { name: 'Rian', role: 'Tenant (Email)', email: 'rian@gmail.com', password: 'tenant123', bg: 'bg-amber-50 border-amber-200 text-amber-750 hover:bg-amber-100' }
    ];

    return (
        <GuestLayout>
            <Head title="Masuk Akun - Kospart PH 18" />

            {/* Header Form */}
            <div className="mb-10 text-center">
                <h2 className="text-3xl font-extrabold text-forest tracking-tight font-outfit mb-2">Selamat Datang</h2>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Masuk dengan email atau nomor WhatsApp terdaftar.
                </p>
            </div>

            {status && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-sm font-bold text-forest rounded-xl">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                {/* Field: Email / Phone */}
                <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-bold text-forest uppercase tracking-wider block">
                        Email atau Nomor Telepon
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 text-gold">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        </div>
                        <input
                            id="email"
                            type="text"
                            name="email"
                            value={data.email}
                            autoComplete="username"
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            className="pl-11 pr-4 py-3 rounded-2xl border border-gold/30 bg-white/50 backdrop-blur-sm w-full focus:border-gold focus:ring-4 focus:ring-gold/20 transition-all duration-300 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-gold"
                            placeholder="Email atau No. WA"
                            required
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1" />
                </div>

                {/* Field: Password */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <label htmlFor="password" className="text-xs font-bold text-forest uppercase tracking-wider block">
                            Password
                        </label>
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="text-xs font-bold text-gold hover:text-[#8a6914] transition-colors focus:outline-none focus:underline"
                            >
                                Lupa Password?
                            </Link>
                        )}
                    </div>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 text-gold">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                        </div>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            className="pl-11 pr-10 py-3 rounded-2xl border border-gold/30 bg-white/50 backdrop-blur-sm w-full focus:border-gold focus:ring-4 focus:ring-gold/20 transition-all duration-300 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-gold"
                            placeholder="••••••••"
                            required
                        />
                        <button aria-label="Action Button" 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-gold focus:outline-none"
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

                {/* Field: Remember Me */}
                <div className="flex items-center">
                    <input
                        id="remember"
                        type="checkbox"
                        name="remember"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="rounded border-gold/50 text-forest shadow-sm focus:ring-forest transition-colors"
                    />
                    <label htmlFor="remember" className="ms-2 text-xs font-bold text-forest cursor-pointer select-none">
                        Ingat Saya
                    </label>
                </div>

                {/* Submit Button */}
                <div className="pt-3">
                    <button aria-label="Action Button" 
                        type="submit"
                        className="w-full py-3.5 lux-btn-primary rounded-2xl text-sm transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                        disabled={processing}
                    >
                        {processing ? 'Memproses Masuk...' : 'Masuk Sekarang'}
                    </button>
                </div>

                {/* Navigation to Register */}
                <div className="text-center mt-4 pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-500">Belum punya akun? </span>
                    <Link
                        href={route('register')}
                        className="text-xs font-bold text-gold hover:text-[#8a6914] transition-colors focus:outline-none focus:underline"
                    >
                        Daftar Baru di Sini
                    </Link>
                </div>
            </form>

            {/* Quick Login Section */}
           
        </GuestLayout>
    );
}

