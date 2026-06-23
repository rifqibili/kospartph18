import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Kospart PH 18" />

            {/* Header Form */}
            <div className="mb-10 text-center">
                <h2 className="text-3xl font-extrabold text-forest tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Lupa Password</h2>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Masukkan email terdaftar Anda untuk menerima tautan reset password.
                </p>
            </div>

            {status && (
                <div className="mb-6 p-3 bg-green-50 border border-green-200 text-sm font-bold text-forest rounded-xl text-center">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-bold text-forest uppercase tracking-wider block">
                        Alamat Email
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5 text-gold">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                        </div>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            className="pl-11 pr-4 py-3 rounded-2xl border border-gold/30 bg-white/50 backdrop-blur-sm w-full focus:border-gold focus:ring-4 focus:ring-gold/20 transition-all duration-300 text-sm text-slate-800 placeholder-slate-400 font-medium hover:border-gold"
                            placeholder="nama@email.com"
                            required
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1" />
                </div>

                <div className="pt-2">
                    <button aria-label="Action Button" 
                        type="submit"
                        className="w-full py-3.5 lux-btn-primary rounded-2xl text-sm transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                        disabled={processing}
                    >
                        {processing ? 'Mengirim Tautan...' : 'Kirim Link Reset Password'}
                    </button>
                </div>

                <div className="text-center mt-4 pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-500">Ingat password Anda? </span>
                    <a
                        href={route('login')}
                        className="text-xs font-bold text-gold hover:text-[#8a6914] transition-colors focus:outline-none focus:underline"
                    >
                        Kembali ke Halaman Masuk
                    </a>
                </div>
            </form>
        </GuestLayout>
    );
}

