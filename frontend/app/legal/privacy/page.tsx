'use client';

import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useLocale } from '../../components/LocaleProvider';

export default function PrivacyPage() {
    const { t } = useLocale();
    return (
        <div className="min-h-screen">
            <Navigation />
            <div className="max-w-4xl mx-auto px-6 py-14 space-y-8">
                <div className="space-y-3">
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">{t('legalCommon.legal')}</p>
                    <h1 className="text-4xl font-semibold text-[#f4ede3]">{t('legalPrivacy.title')}</h1>
                    <p className="text-[#b7ad9c]">{t('legalCommon.updated')}</p>
                </div>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">{t('legalPrivacy.s1')}</h2>
                    <p className="text-[#b7ad9c]">{t('legalPrivacy.s1Body')}</p>
                    <ul className="text-sm text-[#b7ad9c] space-y-2">
                        <li>{t('legalPrivacy.s1b1')}</li>
                        <li>{t('legalPrivacy.s1b2')}</li>
                        <li>{t('legalPrivacy.s1b3')}</li>
                    </ul>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">{t('legalPrivacy.s2')}</h2>
                    <p className="text-[#b7ad9c]">{t('legalPrivacy.s2Body')}</p>
                    <ul className="text-sm text-[#b7ad9c] space-y-2">
                        <li>{t('legalPrivacy.s2b1')}</li>
                        <li>{t('legalPrivacy.s2b2')}</li>
                        <li>{t('legalPrivacy.s2b3')}</li>
                    </ul>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">{t('legalPrivacy.s3')}</h2>
                    <p className="text-[#b7ad9c]">{t('legalPrivacy.s3Body')}</p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">{t('legalPrivacy.s4')}</h2>
                    <p className="text-[#b7ad9c]">{t('legalPrivacy.s4Body')}</p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">{t('legalPrivacy.s5')}</h2>
                    <p className="text-[#b7ad9c]">{t('legalPrivacy.s5Body')}</p>
                </section>
            </div>
            <Footer />
        </div>
    );
}
