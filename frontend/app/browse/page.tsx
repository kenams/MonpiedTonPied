'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import CTASection from '../components/CTASection';
import { apiUrl } from '../lib/api';
import { getAuthToken } from '../lib/auth';
import { resolveMediaUrl } from '../lib/media';
import WatermarkOverlay from '../components/WatermarkOverlay';
import { useLocale } from '../components/LocaleProvider';

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

type CreatorBrowseCard = {
    creatorId: string;
    creatorName: string;
    creatorAvatarUrl?: string;
    title: string;
    description: string;
    previewUrl?: string | null;
    isPreview?: boolean;
    unlocked?: boolean;
};

const filters = {
    fr: [
        { label: 'Tout', hint: 'Tout le feed' },
        { label: 'Nouveautes', hint: 'Dernieres sorties' },
        { label: 'Tendance', hint: 'Top cette semaine' },
        { label: 'Collection', hint: 'Series premium' },
        { label: 'Favoris', hint: 'Tes choix' },
    ],
    en: [
        { label: 'All', hint: 'Entire feed' },
        { label: 'New', hint: 'Latest releases' },
        { label: 'Trending', hint: 'Top this week' },
        { label: 'Collection', hint: 'Premium series' },
        { label: 'Favorites', hint: 'Your picks' },
    ],
} as const;

export default function BrowsePage() {
    const { locale } = useLocale();
    const copy =
        locale === 'fr'
            ? {
                  loadError: 'Impossible de charger le contenu pour le moment.',
                  creatorsOnly: 'Un seul apercu par modele',
                  eyebrow: 'Feed premium',
                  title: 'Decouvre les profils du moment.',
                  subtitle:
                      'Une miniature par modele en vitrine. Pour voir la galerie complete floutee et debloquer le contenu, ouvre le profil du modele.',
                  premiumAccess: 'Acces premium',
                  premiumLine: '1 photo ou 10s de video gratuits par createur.',
                  premiumPrice: 'Pass 5.99 EUR (30 jours) ou abonnement 11.99 EUR.',
                  createAccount: 'Creer un compte',
                  login: 'Se connecter',
                  collectionMode: 'Mode collection',
                  collectionTitle: 'Une vitrine simple, un tunnel clair.',
                  collectionBody:
                      'La page liste montre seulement une miniature par modele. Le profil centralise ensuite la galerie floutee, le paywall et les demandes de videos personnalisees.',
                  privacy: 'Confidentialite',
                  moderation: 'Moderation',
                  securePayments: 'Paiements securises',
                  retry: 'Reessayer',
                  empty: 'Aucun modele disponible pour le moment.',
                  preview: 'Preview',
                  freePreview: 'Preview gratuite',
                  openProfile: 'Voir le profil',
                  requestInfo: 'Demandes personnalisees dispo sur le profil',
                  ctaTitle: 'Accede aux collections completes.',
                  ctaSubtitle:
                      "Le pass ou l'abonnement debloquent les series premium et le chat.",
                  ctaPrimary: 'Voir les offres',
              }
            : {
                  loadError: 'Unable to load content right now.',
                  creatorsOnly: 'One preview per model',
                  eyebrow: 'Premium feed',
                  title: 'Discover the featured profiles.',
                  subtitle:
                      'One public thumbnail per model on the listing page. Open the profile to see the blurred full gallery and unlock premium access.',
                  premiumAccess: 'Premium access',
                  premiumLine: '1 free photo or 10 seconds of video per creator.',
                  premiumPrice: '5.99 EUR pass (30 days) or 11.99 EUR subscription.',
                  createAccount: 'Create account',
                  login: 'Log in',
                  collectionMode: 'Collection mode',
                  collectionTitle: 'Simple storefront, clear funnel.',
                  collectionBody:
                      'The listing page only shows one thumbnail per model. The profile then centralizes the blurred gallery, paywall, and custom video requests.',
                  privacy: 'Privacy',
                  moderation: 'Moderation',
                  securePayments: 'Secure payments',
                  retry: 'Retry',
                  empty: 'No model available right now.',
                  preview: 'Preview',
                  freePreview: 'Free preview',
                  openProfile: 'Open profile',
                  requestInfo: 'Custom requests available on the profile',
                  ctaTitle: 'Unlock full collections.',
                  ctaSubtitle:
                      'The pass or subscription unlocks premium series and chat.',
                  ctaPrimary: 'View offers',
              };
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContent = useCallback(async () => {
        setLoading(true);
        setError(null);
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
            setContent(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching content:', err);
            setError(copy.loadError);
        } finally {
            setLoading(false);
        }
    }, [copy.loadError]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const creatorCards = useMemo<CreatorBrowseCard[]>(() => {
        const seen = new Set<string>();
        const cards: CreatorBrowseCard[] = [];

        for (const item of content) {
            const creatorId = item.creator.id;
            if (!creatorId || seen.has(creatorId)) continue;
            seen.add(creatorId);
            cards.push({
                creatorId,
                creatorName: item.creator.displayName || item.creator.username,
                creatorAvatarUrl: item.creator.avatarUrl,
                title: item.title,
                description: item.description,
                previewUrl: item.previewUrl,
                isPreview: item.isPreview,
                unlocked: item.unlocked,
            });
        }

        return cards;
    }, [content]);

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
                        {copy.eyebrow}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-semibold text-[#f4ede3]">
                        {copy.title}
                    </h1>
                    <p className="text-lg text-[#b7ad9c] max-w-2xl">{copy.subtitle}</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
                    <div className="glass rounded-3xl p-8 space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full border border-[#3a2c1a] bg-[#1b1510] px-4 py-2 text-xs font-semibold text-[#f0d8ac]">
                                {copy.creatorsOnly}
                            </span>
                            {filters[locale].map((filter) => (
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
                                    {copy.premiumAccess}
                                </p>
                                <p className="text-lg text-[#f4ede3] font-semibold">
                                    {copy.premiumLine}
                                </p>
                                <p className="text-sm text-[#b7ad9c]">{copy.premiumPrice}</p>
                            </div>
                            <div className="flex gap-3">
                                <Link
                                    href="/auth/register"
                                    className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-[#d6cbb8]"
                                >
                                    {copy.createAccount}
                                </Link>
                                <Link
                                    href="/auth/login"
                                    className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-5 py-2 text-sm font-semibold"
                                >
                                    {copy.login}
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 space-y-4">
                        <div className="text-sm uppercase tracking-[0.3em] text-[#d8c7a8]">
                            {copy.collectionMode}
                        </div>
                        <div className="text-2xl font-semibold text-[#f4ede3]">
                            {copy.collectionTitle}
                        </div>
                        <p className="text-sm text-[#b7ad9c]">{copy.collectionBody}</p>
                        <div className="flex gap-2 text-xs text-[#f0d8ac]">
                            <span className="rounded-full border border-[#3a2c1a] bg-[#1b1510] px-3 py-1">{copy.privacy}</span>
                            <span className="rounded-full border border-[#3a2c1a] bg-[#1b1510] px-3 py-1">{copy.moderation}</span>
                            <span className="rounded-full border border-[#3a2c1a] bg-[#1b1510] px-3 py-1">{copy.securePayments}</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <span>{error}</span>
                        <button
                            onClick={fetchContent}
                            className="rounded-full border border-[#3a2c1a] px-4 py-2 text-xs font-semibold text-[#f0d8ac]"
                        >
                            {copy.retry}
                        </button>
                    </div>
                )}

                {creatorCards.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-[#b7ad9c]">
                        {copy.empty}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {creatorCards.map((item) => {
                            const imageUrl = resolveMediaUrl(item.previewUrl);
                            const hasImage = imageUrl && !imageUrl.includes('placeholder-image');
                            const isVideo = Boolean(imageUrl) && /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(imageUrl);

                            return (
                                <div
                                    key={item.creatorId}
                                    className="rounded-3xl bg-white/5 shadow-lg overflow-hidden hover:shadow-2xl transition border border-white/5"
                                >
                                    <div className="relative aspect-square w-full bg-gradient-to-br from-[#1b1622] to-[#2a2018] flex items-center justify-center">
                                        {hasImage ? (
                                            isVideo ? (
                                                <video
                                                    src={imageUrl}
                                                    muted
                                                    playsInline
                                                    disablePictureInPicture
                                                    onContextMenu={(event) => event.preventDefault()}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={imageUrl || undefined}
                                                    alt={item.creatorName}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            )
                                        ) : (
                                            <div className="text-sm text-[#b7ad9c]">{copy.preview}</div>
                                        )}
                                        {isVideo && <WatermarkOverlay />}
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-[#b7ad9c]">
                                            <div className="h-10 w-10 rounded-2xl overflow-hidden bg-[#15131b] border border-white/10">
                                                {item.creatorAvatarUrl ? (
                                                    <img
                                                        src={item.creatorAvatarUrl}
                                                        alt={item.creatorName}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : null}
                                            </div>
                                            <span>{item.creatorName}</span>
                                        </div>
                                        {item.isPreview && (
                                            <span className="inline-flex rounded-full bg-[#1b1510] px-3 py-1 text-xs text-[#f0d8ac] border border-[#3a2c1a]">
                                                {copy.freePreview}
                                            </span>
                                        )}
                                        <h3 className="text-lg font-semibold text-[#f4ede3]">
                                            {item.creatorName}
                                        </h3>
                                        <p className="text-sm text-[#b7ad9c] line-clamp-2">
                                            {item.description || item.title}
                                        </p>
                                        <p className="text-xs text-[#b7ad9c]">
                                            {copy.requestInfo}
                                        </p>
                                        <Link
                                            href={`/creators/${item.creatorId}`}
                                            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] py-2 text-sm font-semibold"
                                        >
                                            {copy.openProfile}
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <CTASection
                    title={copy.ctaTitle}
                    subtitle={copy.ctaSubtitle}
                    primaryLabel={copy.ctaPrimary}
                    primaryHref="/offers"
                />
            </div>
            <Footer />
        </div>
    );
}
