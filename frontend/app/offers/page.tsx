'use client';

import { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import CTASection from '../components/CTASection';
import { apiUrl } from '../lib/api';
import { getAuthToken } from '../lib/auth';
import { useLocale } from '../components/LocaleProvider';

export default function OffersPage() {
    const { t } = useLocale();
    const token = getAuthToken();
    const [message, setMessage] = useState<string | null>(null);
    const paywallMode = process.env.NEXT_PUBLIC_PAYWALL_MODE || 'live';

    const redirectToCheckout = async (path: string) => {
        setMessage(null);
        if (!token) {
            setMessage(t('offers.loginRequired'));
            return;
        }
        const response = await fetch(apiUrl(path), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || t('offers.paymentFailed'));
            return;
        }
        if (data.url) {
            window.location.href = data.url;
        } else {
            setMessage(data.message || t('offers.paymentSimulated'));
        }
    };

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="space-y-4">
                    <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                        {t('offers.eyebrow')}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-semibold text-[#f4ede3]">
                        {t('offers.title')}
                    </h1>
                    <p className="text-lg text-[#b7ad9c] max-w-2xl">
                        {t('offers.subtitle')}
                    </p>
                </div>

                {message && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {message}
                    </div>
                )}
                {paywallMode === 'staging' && (
                    <div className="rounded-2xl border border-[#3a2c1a] bg-[#1b1510] px-4 py-3 text-xs text-[#f0d8ac]">
                        {t('offers.staging')}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="rounded-3xl bg-white/5 p-8 shadow-lg border border-white/5 space-y-5">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                            {t('offers.passLabel')}
                        </p>
                        <h2 className="text-3xl font-semibold text-[#f4ede3]">5.99 EUR</h2>
                        <p className="text-[#b7ad9c]">
                            {t('offers.passBody')}
                        </p>
                        <ul className="text-sm text-[#b7ad9c] space-y-2">
                            <li>{t('offers.passFeature1')}</li>
                            <li>{t('offers.passFeature2')}</li>
                            <li>{t('offers.passFeature3')}</li>
                        </ul>
                        <button
                            onClick={() => redirectToCheckout('/api/stripe/checkout/pass')}
                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 text-sm font-semibold"
                        >
                            {t('offers.activatePass')}
                        </button>
                    </div>

                    <div className="rounded-3xl bg-white/5 p-8 shadow-lg border border-[#3a2c1a] space-y-5">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                            {t('offers.subscriptionLabel')}
                        </p>
                        <h2 className="text-3xl font-semibold text-[#f4ede3]">11.99 EUR</h2>
                        <p className="text-[#b7ad9c]">
                            {t('offers.subscriptionBody')}
                        </p>
                        <ul className="text-sm text-[#b7ad9c] space-y-2">
                            <li>{t('offers.subscriptionFeature1')}</li>
                            <li>{t('offers.subscriptionFeature2')}</li>
                            <li>{t('offers.subscriptionFeature3')}</li>
                        </ul>
                        <button
                            onClick={() => redirectToCheckout('/api/stripe/checkout/subscription')}
                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 text-sm font-semibold"
                        >
                            {t('offers.subscribe')}
                        </button>
                    </div>

                    <div className="rounded-3xl bg-white/5 p-8 shadow-lg border border-white/5 space-y-5">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                            {t('offers.customLabel')}
                        </p>
                        <h2 className="text-2xl font-semibold text-[#f4ede3]">
                            {t('offers.customTitle')}
                        </h2>
                        <p className="text-[#b7ad9c]">
                            {t('offers.customBody')}
                        </p>
                        <ul className="text-sm text-[#b7ad9c] space-y-2">
                            <li>{t('offers.customFeature1')}</li>
                            <li>{t('offers.customFeature2')}</li>
                            <li>{t('offers.customFeature3')}</li>
                        </ul>
                        <button
                            onClick={() => redirectToCheckout('/api/stripe/checkout/request')}
                            className="rounded-full border border-[#3a2c1a] px-6 py-3 text-sm font-semibold text-[#f0d8ac]"
                        >
                            {t('offers.customAction')}
                        </button>
                    </div>
                </div>

                <div className="rounded-3xl bg-white/5 p-8 shadow-lg border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-[#d8c7a8]">
                            {t('offers.moderation')}
                        </p>
                        <p className="text-[#b7ad9c] text-sm">
                            {t('offers.moderationBody')}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-[#d8c7a8]">
                            {t('offers.payments')}
                        </p>
                        <p className="text-[#b7ad9c] text-sm">
                            {t('offers.paymentsBody')}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-[#d8c7a8]">
                            {t('offers.privacy')}
                        </p>
                        <p className="text-[#b7ad9c] text-sm">
                            {t('offers.privacyBody')}
                        </p>
                    </div>
                </div>
                <CTASection
                    title={t('offers.ctaTitle')}
                    subtitle={t('offers.ctaSubtitle')}
                    primaryLabel={t('cta.primary')}
                    primaryHref="/auth/register"
                />
            </div>
            <Footer />
        </div>
    );
}
