'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiUrl } from '../lib/api';
import { getAuthToken } from '../lib/auth';
import { useLocale } from '../components/LocaleProvider';

export default function PremiumPage() {
    const { t } = useLocale();
    const token = getAuthToken();
    const [premiumAccess, setPremiumAccess] = useState<boolean | null>(
        token ? null : false
    );

    useEffect(() => {
        const loadAccess = async () => {
            if (!token) {
                setPremiumAccess(false);
                return;
            }
            try {
                const res = await fetch(apiUrl('/api/users/me'), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setPremiumAccess(Boolean(data.premiumAccess));
            } catch {
                setPremiumAccess(false);
            }
        };

        loadAccess();
    }, [token]);

    return (
        <div className="min-h-screen">
            <Navigation />
            <div className="mx-auto max-w-5xl space-y-8 px-6 py-12">
                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.35em] text-[#d8c7a8]">
                        {t('premium.eyebrow')}
                    </p>
                    <h1 className="text-4xl font-semibold text-[#f4ede3]">{t('premium.title')}</h1>
                    <p className="text-[#b7ad9c]">
                        {t('premium.subtitle')}
                    </p>
                </div>

                {!token && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {t('premium.loginRequired')}
                    </div>
                )}

                {token && premiumAccess === false && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {t('premium.subscriptionRequired')}
                    </div>
                )}

                {premiumAccess ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Link
                            href="/browse"
                            className="rounded-3xl border border-white/10 bg-white/5 p-6 font-semibold text-[#f4ede3]"
                        >
                            {t('premium.gallery')}
                        </Link>
                        <Link
                            href="/creators"
                            className="rounded-3xl border border-white/10 bg-white/5 p-6 font-semibold text-[#f4ede3]"
                        >
                            {t('premium.models')}
                        </Link>
                        <Link
                            href="/profile"
                            className="rounded-3xl border border-white/10 bg-white/5 p-6 font-semibold text-[#f4ede3]"
                        >
                            {t('premium.manage')}
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 sm:flex-row">
                        {!token ? (
                            <Link
                                href="/auth/login?redirect=/premium"
                                className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] px-6 py-3 text-center text-sm font-semibold text-[#0b0a0f]"
                            >
                                {t('premium.login')}
                            </Link>
                        ) : (
                            <Link
                                href="/offers"
                                className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] px-6 py-3 text-center text-sm font-semibold text-[#0b0a0f]"
                            >
                                {t('premium.subscribe')}
                            </Link>
                        )}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
