'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { apiUrl } from '../../lib/api';
import { setAuthToken } from '../../lib/auth';
import { useLocale } from '../../components/LocaleProvider';

function LoginContent() {
    const { t } = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams?.get('redirect') || '/';
    const [identifier, setIdentifier] = useState('consumer@monpiedtonpied.local');
    const [password, setPassword] = useState('demo1234');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(apiUrl('/api/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: identifier.includes('@') ? identifier : undefined,
                    username: !identifier.includes('@') ? identifier : undefined,
                    password,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || t('login.loginFailed'));
            }

            setAuthToken(data.token);
            router.push(redirectTo);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('login.loginFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-14 lg:grid-cols-2">
                <div className="space-y-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                        {t('login.eyebrow')}
                    </p>
                    <h1 className="text-4xl font-semibold text-[#f4ede3] md:text-5xl">
                        {t('login.title')}
                    </h1>
                    <p className="text-lg text-[#b7ad9c]">
                        {t('login.subtitle')}
                    </p>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#b7ad9c]">
                                    {t('login.demoAccount')}
                                </p>
                                <p className="font-semibold text-[#f4ede3]">
                                    consumer@monpiedtonpied.local
                                </p>
                            </div>
                            <span className="rounded-full border border-[#3a2c1a] bg-[#2a2218] px-3 py-1 text-xs text-[#f0d8ac]">
                                {t('login.passwordLabel')}: demo1234
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#f4ede3]">
                            {t('login.formTitle')}
                        </h2>
                        <p className="text-sm text-[#b7ad9c]">
                            {t('login.notRegistered')}{' '}
                            <Link
                                href="/auth/register"
                                className="font-semibold text-[#f0d8ac]"
                            >
                                {t('login.createAccount')}
                            </Link>
                        </p>
                        <Link
                            href="/auth/reset"
                            className="text-xs uppercase tracking-[0.2em] text-[#d8c7a8]"
                        >
                            {t('login.forgotPassword')}
                        </Link>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                            {error}
                        </div>
                    )}

                    <label className="block space-y-2">
                        <span className="text-sm text-[#b7ad9c]">
                            {t('login.emailOrUsername')}
                        </span>
                        <input
                            value={identifier}
                            onChange={(event) => setIdentifier(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a] focus:outline-none focus:ring-2 focus:ring-[#c7a46a]"
                            placeholder={t('login.emailPlaceholder')}
                            required
                        />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm text-[#b7ad9c]">{t('login.password')}</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a] focus:outline-none focus:ring-2 focus:ring-[#c7a46a]"
                            placeholder="********"
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] px-6 py-3 font-semibold text-[#0b0a0f] shadow-lg transition disabled:opacity-60"
                    >
                        {loading ? t('login.submitLoading') : t('login.submit')}
                    </button>
                </form>
            </div>
            <Footer />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    );
}
