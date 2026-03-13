'use client';

import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useLocale } from '../../components/LocaleProvider';

export default function RegisterChoicePage() {
    const { t } = useLocale();
    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-14 space-y-10">
                <div className="space-y-4">
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                        {t('registerChoice.eyebrow')}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-semibold text-[#f4ede3]">
                        {t('registerChoice.title')}
                    </h1>
                    <p className="text-lg text-[#b7ad9c] max-w-2xl">
                        {t('registerChoice.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link
                        href="/auth/register/creator"
                        className="rounded-3xl bg-white/5 p-8 shadow-lg border border-white/5 hover:border-[#3a2c1a] transition"
                    >
                        <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                            {t('registerChoice.creator')}
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold text-[#f4ede3]">
                            {t('registerChoice.creatorTitle')}
                        </h2>
                        <p className="text-[#b7ad9c] mt-3">
                            {t('registerChoice.creatorBody')}
                        </p>
                        <span className="mt-6 inline-flex items-center gap-2 text-[#f0d8ac] font-semibold">
                            {t('registerChoice.creatorAction')}
                        </span>
                    </Link>

                    <Link
                        href="/auth/register/consumer"
                        className="rounded-3xl bg-white/5 p-8 shadow-lg border border-white/5 hover:border-[#3a2c1a] transition"
                    >
                        <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                            {t('registerChoice.consumer')}
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold text-[#f4ede3]">
                            {t('registerChoice.consumerTitle')}
                        </h2>
                        <p className="text-[#b7ad9c] mt-3">
                            {t('registerChoice.consumerBody')}
                        </p>
                        <span className="mt-6 inline-flex items-center gap-2 text-[#f0d8ac] font-semibold">
                            {t('registerChoice.consumerAction')}
                        </span>
                    </Link>
                </div>
            </div>
            <Footer />
        </div>
    );
}
