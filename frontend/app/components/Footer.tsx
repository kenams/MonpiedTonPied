'use client';

import Link from 'next/link';
import { useLocale } from './LocaleProvider';

export default function Footer() {
    const { t } = useLocale();

    return (
        <footer className="border-t border-white/10 pt-10 pb-8 mt-16">
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-[#b7ad9c]">
                <div className="space-y-2">
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                        MonPiedTonPied
                    </p>
                    <p>{t('footer.pitch')}</p>
                    <p className="text-xs text-[#7f776a]">
                        {t('footer.moderation')}
                    </p>
                    <p className="text-xs text-[#7f776a]">Developed by Kah-Digital.</p>
                </div>
                <div className="space-y-2">
                    <p className="text-[#f4ede3] font-semibold">{t('footer.legal')}</p>
                    <Link href="/legal/cgu" className="block hover:text-[#f0d8ac]">
                        CGU
                    </Link>
                    <Link href="/legal/cgv" className="block hover:text-[#f0d8ac]">
                        CGV
                    </Link>
                    <Link href="/legal/privacy" className="block hover:text-[#f0d8ac]">
                        {t('footer.privacy')}
                    </Link>
                </div>
                <div className="space-y-2">
                    <p className="text-[#f4ede3] font-semibold">{t('footer.contact')}</p>
                    <p>support@monpiedtonpied.com</p>
                    <p>Paris - 24/7</p>
                </div>
            </div>
        </footer>
    );
}
