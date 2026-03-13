'use client';

import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useLocale } from '../../components/LocaleProvider';

export default function CGUPage() {
    const { t } = useLocale();
    return (
        <div className="min-h-screen">
            <Navigation />
            <div className="max-w-4xl mx-auto px-6 py-14 space-y-8">
                <div className="space-y-3">
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">{t('legalCommon.legal')}</p>
                    <h1 className="text-4xl font-semibold text-[#f4ede3]">{t('legalCgu.title')}</h1>
                    <p className="text-[#b7ad9c]">{t('legalCommon.updated')}</p>
                </div>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">{t('legalCgu.s1')}</h2>
                    <p className="text-[#b7ad9c]">{t('legalCgu.s1Body')}</p>
                    <ul className="text-sm text-[#b7ad9c] space-y-2">
                        <li>{t('legalCgu.s1b1')}</li>
                        <li>{t('legalCgu.s1b2')}</li>
                        <li>{t('legalCgu.s1b3')}</li>
                    </ul>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">{t('legalCgu.s2')}</h2>
                    <p className="text-[#b7ad9c]">{t('legalCgu.s2Body')}</p>
                    <ul className="text-sm text-[#b7ad9c] space-y-2">
                        <li>{t('legalCgu.s2b1')}</li>
                        <li>{t('legalCgu.s2b2')}</li>
                        <li>{t('legalCgu.s2b3')}</li>
                    </ul>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">{t('legalCgu.s3')}</h2>
                    <p className="text-[#b7ad9c]">{t('legalCgu.s3Body')}</p>
                    <ul className="text-sm text-[#b7ad9c] space-y-2">
                        <li>{t('legalCgu.s3b1')}</li>
                        <li>{t('legalCgu.s3b2')}</li>
                        <li>{t('legalCgu.s3b3')}</li>
                    </ul>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">{t('legalCgu.s4')}</h2>
                    <p className="text-[#b7ad9c]">{t('legalCgu.s4Body')}</p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">{t('legalCgu.s5')}</h2>
                    <p className="text-[#b7ad9c]">{t('legalCgu.s5Body')}</p>
                </section>

                <section className="glass rounded-3xl p-8 space-y-4">
                    <h2 className="text-2xl font-semibold text-[#f4ede3]">{t('legalCgu.s6')}</h2>
                    <p className="text-[#b7ad9c]">{t('legalCgu.s6Body')}</p>
                </section>
            </div>
            <Footer />
        </div>
    );
}
