'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import CTASection from '../components/CTASection';
import { apiUrl } from '../lib/api';
import { getAuthToken } from '../lib/auth';

type ContentItem = {
    _id: string;
    title: string;
    description: string;
    creator: {
        id?: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
    };
    previewUrl?: string | null;
    price?: number | null;
    unlocked?: boolean;
    isPreview?: boolean;
    stats: {
        views: number;
        likes: number;
    };
};

const filters = [
    { label: 'Tout', hint: 'Tout le feed' },
    { label: 'Nouveautes', hint: 'Dernieres sorties' },
    { label: 'Tendance', hint: 'Top cette semaine' },
    { label: 'Collection', hint: 'Series premium' },
    { label: 'Favoris', hint: 'Tes choix' },
];

export default function BrowsePage() {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchContent = async () => {
            try {
                const token = getAuthToken();
                const response = await fetch(apiUrl('/api/content'), {
                    method: 'GET',
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = (await response.json()) as ContentItem[];
                if (isMounted) {
                    setContent(data);
                }
            } catch (err) {
                console.error('Error fetching content:', err);
                if (isMounted) {
                    setError('Impossible de charger le contenu pour le moment.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchContent();

        return () => {
            isMounted = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="max-w-6xl mx-auto px-6 py-16">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                        <div className="h-6 w-40 bg-white/10 rounded-full" />
                        <div className="mt-4 h-10 w-72 bg-white/10 rounded-2xl" />
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={`skeleton-${index}`}
                                    className="h-72 rounded-3xl border border-white/5 bg-white/5 animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="space-y-4">
                    <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                        Feed premium
                    </p>
                    <h1 className="text-4xl md:text-5xl font-semibold text-[#f4ede3]">
                        Decouvre les collections du moment.
                    </h1>
                    <p className="text-lg text-[#b7ad9c] max-w-2xl">
                        Selection sobre, contenus verifies et acces direct aux createurs
                        les plus demandes.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
                    <div className="glass rounded-3xl p-8 space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                            {filters.map((filter) => (
                                <button
                                    key={filter.label}
                                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[#d6cbb8] hover:border-[#c7a46a] hover:text-[#f0d8ac] transition"
                                    type="button"
                                    title={filter.hint}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm uppercase tracking-[0.3em] text-[#d8c7a8]">
                                    Acces premium
                                </p>
                                <p className="text-lg text-[#f4ede3] font-semibold">
                                    3 photos visibles par createur, le reste est floute.
                                </p>
                                <p className="text-sm text-[#b7ad9c]">
                                    Pass 5.99 EUR (30 jours) ou abonnement 11.99 EUR.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Link
                                    href="/auth/register"
                                    className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-[#d6cbb8]"
                                >
                                    Creer un compte
                                </Link>
                                <Link
                                    href="/auth/login"
                                    className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-5 py-2 text-sm font-semibold"
                                >
                                    Se connecter
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 space-y-4">
                        <div className="text-sm uppercase tracking-[0.3em] text-[#d8c7a8]">
                            Mode collection
                        </div>
                        <div className="text-2xl font-semibold text-[#f4ede3]">
                            Une interface sobre, un contenu exigeant.
                        </div>
                        <p className="text-sm text-[#b7ad9c]">
                            Chaque creator est verifie. Les previews restent delicats,
                            les collections completes sont reservees aux membres.
                        </p>
                        <div className="flex gap-2 text-xs text-[#f0d8ac]">
                            <span className="rounded-full border border-[#3a2c1a] bg-[#1b1510] px-3 py-1">Confidentialite</span>
                            <span className="rounded-full border border-[#3a2c1a] bg-[#1b1510] px-3 py-1">Moderation</span>
                            <span className="rounded-full border border-[#3a2c1a] bg-[#1b1510] px-3 py-1">Paiements securises</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {error}
                    </div>
                )}

                {content.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-[#b7ad9c]">
                        Aucun contenu disponible pour le moment.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {content.map((item) => {
                            const imageUrl = item.previewUrl || '';
                            const hasImage = imageUrl && !imageUrl.includes('placeholder-image');
                            const isLocked = !item.unlocked;

                            return (
                                <div
                                    key={item._id}
                                    className="rounded-3xl bg-white/5 shadow-lg overflow-hidden hover:shadow-2xl transition border border-white/5"
                                >
                                    <div className="aspect-[4/3] bg-gradient-to-br from-[#1b1622] to-[#2a2018] flex items-center justify-center relative">
                                        {hasImage ? (
                                            <img
                                                src={imageUrl}
                                                alt={item.title}
                                                className={`h-full w-full object-cover ${isLocked ? 'blur-md' : ''}`}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="text-sm text-[#b7ad9c]">Preview</div>
                                        )}
                                        {isLocked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <span className="rounded-full bg-[#15131b] px-4 py-2 text-xs font-semibold text-[#f0d8ac] border border-white/10">
                                                    Floute
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center justify-between text-sm text-[#b7ad9c]">
                                            {item.creator.id ? (
                                                <Link
                                                    href={`/creators/${item.creator.id}`}
                                                    className="hover:text-[#f0d8ac]"
                                                >
                                                    {item.creator.displayName || item.creator.username}
                                                </Link>
                                            ) : (
                                                <span>
                                                    {item.creator.displayName || item.creator.username}
                                                </span>
                                            )}
                                            {typeof item.price === 'number' && (
                                                <span className="rounded-full bg-[#2a2218] px-3 py-1 text-[#f0d8ac] border border-[#3a2c1a]">
                                                    {item.price} EUR
                                                </span>
                                            )}
                                        </div>
                                        {item.isPreview && (
                                            <span className="inline-flex rounded-full bg-[#1b1510] px-3 py-1 text-xs text-[#f0d8ac] border border-[#3a2c1a]">
                                                Preview gratuite
                                            </span>
                                        )}
                                        <h3 className="text-lg font-semibold text-[#f4ede3]">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-[#b7ad9c] line-clamp-2">
                                            {item.description}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-[#b7ad9c]">
                                            <span>{item.stats.views} vues</span>
                                            <span>{item.stats.likes} likes</span>
                                        </div>
                                        <Link
                                            href={`/content/${item._id}`}
                                            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] py-2 text-sm font-semibold"
                                        >
                                            {item.unlocked ? 'Voir le contenu' : 'Debloquer'}
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <CTASection
                    title="Accede aux collections completes."
                    subtitle="Le pass ou l'abonnement debloquent les series premium et le chat."
                    primaryLabel="Voir les offres"
                    primaryHref="/offers"
                />
            </div>
            <Footer />
        </div>
    );
}

