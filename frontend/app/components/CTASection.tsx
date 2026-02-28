import Link from 'next/link';

type CTASectionProps = {
    title?: string;
    subtitle?: string;
    primaryLabel?: string;
    primaryHref?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
};

export default function CTASection({
    title = 'Pret a rejoindre le club ?',
    subtitle = 'Cree ton compte et accede aux collections premium des creators verifies.',
    primaryLabel = 'Creer un compte',
    primaryHref = '/auth/register',
    secondaryLabel = 'Se connecter',
    secondaryHref = '/auth/login',
}: CTASectionProps) {
    return (
        <section className="glass rounded-3xl p-10 grid grid-cols-1 md:grid-cols-[1.2fr,0.8fr] gap-8 items-center">
            <div className="space-y-4">
                <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                    Acces prive
                </p>
                <h2 className="text-3xl font-semibold text-[#f4ede3]">{title}</h2>
                <p className="text-[#b7ad9c]">{subtitle}</p>
            </div>
            <div className="flex flex-col gap-3">
                <Link
                    href={primaryHref}
                    className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 text-sm font-semibold text-center"
                >
                    {primaryLabel}
                </Link>
                <Link
                    href={secondaryHref}
                    className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-[#d6cbb8] text-center"
                >
                    {secondaryLabel}
                </Link>
                <p className="text-xs text-[#7f776a] text-center">18+ uniquement</p>
            </div>
        </section>
    );
}
