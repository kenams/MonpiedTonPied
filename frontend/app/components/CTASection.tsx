'use client';

import Link from 'next/link';
import { useLocale } from './LocaleProvider';

type CTASectionProps = {
    title?: string;
    subtitle?: string;
    primaryLabel?: string;
    primaryHref?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
};

export default function CTASection({
    title,
    subtitle,
    primaryLabel,
    primaryHref = '/auth/register',
    secondaryLabel,
    secondaryHref = '/auth/login',
}: CTASectionProps) {
    const { t } = useLocale();
    const resolvedTitle = title || t('cta.title');
    const resolvedSubtitle = subtitle || t('cta.subtitle');
    const resolvedPrimaryLabel = primaryLabel || t('cta.primary');
    const resolvedSecondaryLabel = secondaryLabel || t('cta.secondary');

    return (
        <section className="glass rounded-3xl p-10 grid grid-cols-1 md:grid-cols-[1.2fr,0.8fr] gap-8 items-center">
            <div className="space-y-4">
                <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                    {t('cta.eyebrow')}
                </p>
                <h2 className="text-3xl font-semibold text-[#f4ede3]">{resolvedTitle}</h2>
                <p className="text-[#b7ad9c]">{resolvedSubtitle}</p>
            </div>
            <div className="flex flex-col gap-3">
                <Link
                    href={primaryHref}
                    className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 text-sm font-semibold text-center"
                >
                    {resolvedPrimaryLabel}
                </Link>
                <Link
                    href={secondaryHref}
                    className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-[#d6cbb8] text-center"
                >
                    {resolvedSecondaryLabel}
                </Link>
                <p className="text-xs text-[#7f776a] text-center">{t('cta.adultOnly')}</p>
            </div>
        </section>
    );
}
