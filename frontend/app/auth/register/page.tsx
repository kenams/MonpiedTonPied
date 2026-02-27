'use client';

import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function RegisterChoicePage() {
    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-14 space-y-10">
                <div className="space-y-4">
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                        Inscription
                    </p>
                    <h1 className="text-4xl md:text-5xl font-semibold text-[#f4ede3]">
                        Choisis ton type de compte
                    </h1>
                    <p className="text-lg text-[#b7ad9c] max-w-2xl">
                        Les creators publient du contenu. Les consommateurs decouvrent,
                        achetent et discutent avec leurs creators favoris.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link
                        href="/auth/register/creator"
                        className="rounded-3xl bg-white/5 p-8 shadow-lg border border-white/5 hover:border-[#3a2c1a] transition"
                    >
                        <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                            Creator
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold text-[#f4ede3]">
                            Je publie des photos et videos
                        </h2>
                        <p className="text-[#b7ad9c] mt-3">
                            Bio, avatar, profil public, demandes personnalisees.
                        </p>
                        <span className="mt-6 inline-flex items-center gap-2 text-[#f0d8ac] font-semibold">
                            Creer un compte creator -&gt;
                        </span>
                    </Link>

                    <Link
                        href="/auth/register/consumer"
                        className="rounded-3xl bg-white/5 p-8 shadow-lg border border-white/5 hover:border-[#3a2c1a] transition"
                    >
                        <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                            Consommateur
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold text-[#f4ede3]">
                            Je decouvre et j&apos;achete
                        </h2>
                        <p className="text-[#b7ad9c] mt-3">
                            Acces aux profils, preview gratuit, chat apres abonnement.
                        </p>
                        <span className="mt-6 inline-flex items-center gap-2 text-[#f0d8ac] font-semibold">
                            Creer un compte consommateur -&gt;
                        </span>
                    </Link>
                </div>
            </div>
            <Footer />
        </div>
    );
}
