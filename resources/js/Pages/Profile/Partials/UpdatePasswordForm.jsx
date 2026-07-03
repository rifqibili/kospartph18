import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

function PasswordField({ id, label, value, onChange, inputRef, placeholder, autoComplete }) {
    const [show, setShow] = useState(false);
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {label}
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <input
                    id={id}
                    ref={inputRef}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                >
                    {show ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}

function PasswordStrength({ password }) {
    const calc = (p) => {
        let score = 0;
        if (!p) return { score: 0, label: '', color: '' };
        if (p.length >= 8)  score++;
        if (p.length >= 12) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        if (score <= 1) return { score, label: 'Sangat Lemah', color: 'bg-red-500' };
        if (score === 2) return { score, label: 'Lemah', color: 'bg-orange-500' };
        if (score === 3) return { score, label: 'Cukup', color: 'bg-yellow-500' };
        if (score === 4) return { score, label: 'Kuat', color: 'bg-emerald-500' };
        return { score, label: 'Sangat Kuat', color: 'bg-emerald-600' };
    };

    const { score, label, color } = calc(password);
    if (!password) return null;

    return (
        <div className="mt-2 space-y-1">
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? color : 'bg-slate-200 dark:bg-slate-700'}`} />
                ))}
            </div>
            <p className={`text-[11px] font-bold ${
                score <= 1 ? 'text-red-500' : score === 2 ? 'text-orange-500' : score === 3 ? 'text-yellow-600' : 'text-emerald-500'
            }`}>{label}</p>
        </div>
    );
}

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <form onSubmit={updatePassword} className="space-y-5">
            <PasswordField
                id="current_password"
                label="Kata Sandi Saat Ini"
                value={data.current_password}
                onChange={(e) => setData('current_password', e.target.value)}
                inputRef={currentPasswordInput}
                placeholder="••••••••"
                autoComplete="current-password"
            />
            {errors.current_password && (
                <p className="text-xs text-red-500 font-medium -mt-3 flex items-center gap-1"><span>⚠</span>{errors.current_password}</p>
            )}

            <div>
                <PasswordField
                    id="password"
                    label="Kata Sandi Baru"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    inputRef={passwordInput}
                    placeholder="Min. 8 karakter"
                    autoComplete="new-password"
                />
                <PasswordStrength password={data.password} />
                {errors.password && (
                    <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1"><span>⚠</span>{errors.password}</p>
                )}
            </div>

            <PasswordField
                id="password_confirmation"
                label="Konfirmasi Kata Sandi"
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
                placeholder="Ulangi kata sandi baru"
                autoComplete="new-password"
            />
            {errors.password_confirmation && (
                <p className="text-xs text-red-500 font-medium -mt-3 flex items-center gap-1"><span>⚠</span>{errors.password_confirmation}</p>
            )}

            {/* Konfirmasi cocok */}
            {data.password && data.password_confirmation && (
                <p className={`text-xs font-bold flex items-center gap-1 -mt-3 ${data.password === data.password_confirmation ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {data.password === data.password_confirmation ? '✅ Kata sandi cocok' : '❌ Kata sandi tidak cocok'}
                </p>
            )}

            <div className="flex items-center gap-4 pt-1">
                <button
                    type="submit"
                    disabled={processing}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none flex items-center gap-2"
                >
                    {processing ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    Perbarui Sandi
                </button>

                <Transition
                    show={recentlySuccessful}
                    enter="transition ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                        🔒 Sandi diperbarui!
                    </span>
                </Transition>
            </div>
        </form>
    );
}
