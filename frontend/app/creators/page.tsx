'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiUrl } from '../lib/api';

type CreatorItem = {
    id: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    verified: boolean;
    isSuspended?: boolean;
};

export default function CreatorsPage() {
    const [creators, setCreators] = useState<CreatorItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        fetch(apiUrl('/api/creators'))
            .then((res) => {
                if (!res.ok) {
                    throw new Error('HTTP error');
                }
                return res.json();
            })
            .then((data) => {
                if (isMounted) {
                    setCreators(data || []);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setError('Impossible de charger les creators pour le moment.');
                }
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="space-y-4">
                    <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                        Creators
                    </p>
                    <h1 className="text-4xl md:text-5xl font-semibold text-[#f4ede3]">
                        Les profils les plus demandes.
                    </h1>
                    <p className="text-lg text-[#b7ad9c] max-w-2xl">
                        Parcours des univers exclusifs et choisis les creators que tu
                        veux soutenir.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                    <div className="glass rounded-3xl p-8 space-y-4">
                        <p className="text-sm uppercase tracking-[0.3em] text-[#d8c7a8]">
                            Selection premium
                        </p>
                        <h2 className="text-2xl font-semibold text-[#f4ede3]">
                            Portfolios soignes, presence continue.
                        </h2>
                        <p className="text-sm text-[#b7ad9c]">
                            Chaque creator est verifie, suivi et accompagne. Les fans
                            accedent aux collections completes apres paiement.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-[#f0d8ac]">
                            <span className="rounded-full border border-[#3a2c1a] bg-[#1b1510] px-3 py-1">
                                Verified
                            </span>
                            <span className="rounded-full border border-[#3a2c1a] bg-[#1b1510] px-3 py-1">
                                Support direct
                            </span>
                            <span className="rounded-full border border-[#3a2c1a] bg-[#1b1510] px-3 py-1">
                                Moderation active
                            </span>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 space-y-4">
                        <p className="text-sm uppercase tracking-[0.3em] text-[#d8c7a8]">
                            Devenir creator
                        </p>
                        <p className="text-2xl font-semibold text-[#f4ede3]">
                            Lance ta boutique et propose tes series.
                        </p>
                        <p className="text-sm text-[#b7ad9c]">
                            Profil complet, bio courte, photo avatar, verification age.
                            Publie tes contenus en quelques minutes.
                        </p>
                        <Link
                            href="/auth/register/creator"
                            className="inline-flex rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-5 py-2 text-sm font-semibold"
                        >
                            Creer un compte creator
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={`creator-skeleton-${index}`}
                                className="h-44 rounded-3xl border border-white/5 bg-white/5 animate-pulse"
                            />
                        ))}
                    </div>
                ) : creators.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-[#b7ad9c]">
                        Aucun creator disponible pour le moment.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {creators.map((creator) => (
                            <Link
                                key={creator.id}
                                href={`/creators/${creator.id}`}
                                className="group rounded-3xl bg-white/5 p-6 shadow-lg hover:shadow-2xl transition border border-white/5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] flex items-center justify-center text-lg font-semibold overflow-hidden">
                                        {creator.avatarUrl ? (
                                            <img
                                                src={creator.avatarUrl}
                                                alt={creator.displayName}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            creator.displayName
                                                .split(' ')
                                                .map((part) => part[0])
                                                .join('')
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-[#f4ede3]">
                                            {creator.displayName}
                                        </p>
                                        <p className="text-sm text-[#b7ad9c] line-clamp-2">
                                            {creator.bio || 'Creator premium'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {creator.verified && (
                                        <span className="inline-flex items-center gap-2 rounded-full border border-[#3a2c1a] bg-[#1b1510] px-3 py-1 text-xs text-[#f0d8ac]">
                                            Creator verifie
                                        </span>
                                    )}
                                    {creator.isSuspended && (
                                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#b7ad9c]">
                                            Profil suspendu
                                        </span>
                                    )}
                                </div>
                                <div className="mt-6 flex items-center gap-2 text-[#f0d8ac] font-semibold text-sm">
                                    Voir le profil
                                    <span className="transition group-hover:translate-x-1">-&gt;</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

