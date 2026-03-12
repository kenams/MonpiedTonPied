'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import { apiUrl } from './lib/api';
import { resolveMediaUrl } from './lib/media';
import WatermarkOverlay from './components/WatermarkOverlay';
import { getAuthToken } from './lib/auth';

type CreatorItem = {
    id: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    verified: boolean;
    isSuspended?: boolean;
    online?: boolean;
};

type CreatorContent = {
    id: string;
    title: string;
    description: string;
    previewUrl: string | null;
    previewType?: string | null;
    price?: number | null;
    unlocked: boolean;
    isPreview: boolean;
};

type CreatorDetail = {
    id: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    verified: boolean;
    isSuspended?: boolean;
    contents: CreatorContent[];
};

const PREVIEW_SECONDS = 10;

const isVideoPreview = (item?: CreatorContent | null) => {
    if (!item) return false;
    if (item.previewType) {
        return item.previewType.startsWith('video');
    }
    if (!item.previewUrl) return false;
    return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(item.previewUrl);
};

const getInitials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

export default function Home() {
    const token = getAuthToken();
    const [creators, setCreators] = useState<CreatorItem[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<CreatorDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const fetchCreators = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(apiUrl('/api/creators'));
            if (!res.ok) {
                throw new Error('HTTP error');
            }
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            setCreators(list);
            setSelectedId((prev) => prev || list[0]?.id || null);
        } catch {
            setError('Impossible de charger les models pour le moment.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCreators();
    }, [fetchCreators]);

    useEffect(() => {
        if (!selectedId) return;
        setDetailLoading(true);
        fetch(apiUrl(`/api/creators/${selectedId}`), {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
            .then((res) => res.json())
            .then((data) => {
                setSelectedDetail({
                    ...data,
                    contents: Array.isArray(data.contents) ? data.contents : [],
                });
            })
            .catch(() => {
                setSelectedDetail(null);
            })
            .finally(() => setDetailLoading(false));
    }, [selectedId, token]);

    const selectedCreator = useMemo(
        () => creators.find((creator) => creator.id === selectedId) || null,
        [creators, selectedId]
    );
    const previewItem = selectedDetail?.contents?.[0] || null;
    const previewIsVideo = isVideoPreview(previewItem);
    const previewUrl = resolveMediaUrl(previewItem?.previewUrl);
    const canOpenPreview = Boolean(previewUrl);

    return (
        <div className="min-h-screen">
            <Navigation />

            <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
                <section className="grid grid-cols-1 lg:grid-cols-[1.05fr,0.95fr] gap-10 items-start">
                    <div className="space-y-6">
                        <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                            Vitrine premium
                        </p>
                        <h1 className="text-4xl md:text-5xl font-semibold text-[#f4ede3]">
                            Acces direct aux models, apercu immediat, chat apres paiement.
                        </h1>
                        <p className="text-lg text-[#b7ad9c]">
                            Choisis un model, vois une photo gratuite ou 10s de video, puis
                            debloque l&apos;experience complete.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/offers"
                                className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-8 py-3 font-semibold text-sm shadow-lg"
                            >
                                Debloquer l&apos;acces
                            </Link>
                            <Link
                                href="/auth/register/creator"
                                className="rounded-full border border-white/15 px-8 py-3 font-semibold text-sm text-[#d6cbb8]"
                            >
                                Devenir creator
                            </Link>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-xs uppercase tracking-[0.35em] text-[#d8c7a8]">
                            <span>Edition luxe</span>
                            <span>Preview rapide</span>
                            <span>Chat premium</span>
                            <span>18+ uniquement</span>
                        </div>
                    </div>

                    <div className="glass rounded-3xl p-6 space-y-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                            Parcours
                        </p>
                        <div className="space-y-3 text-sm text-[#b7ad9c]">
                            <div className="flex items-center gap-3">
                                <span className="h-7 w-7 rounded-full bg-[#15131b] border border-white/10 text-xs text-[#f0d8ac] flex items-center justify-center">
                                    1
                                </span>
                                Selectionne un model et consulte son apercu.
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="h-7 w-7 rounded-full bg-[#15131b] border border-white/10 text-xs text-[#f0d8ac] flex items-center justify-center">
                                    2
                                </span>
                                1 photo ou 10s de video gratuites.
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="h-7 w-7 rounded-full bg-[#15131b] border border-white/10 text-xs text-[#f0d8ac] flex items-center justify-center">
                                    3
                                </span>
                                Paiement, acces complet et chat.
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold text-[#f4ede3]">
                                Models disponibles
                            </h2>
                            <Link
                                href="/creators"
                                className="text-sm text-[#f0d8ac] font-semibold"
                            >
                                Voir tout
                            </Link>
                        </div>

                        {error && (
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div
                                        key={`creator-skeleton-${index}`}
                                        className="h-24 rounded-3xl border border-white/5 bg-white/5 animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : creators.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-[#b7ad9c]">
                                Aucun model disponible pour le moment.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {creators.map((creator) => {
                                    const isSelected = creator.id === selectedId;
                                    return (
                                        <button
                                            key={creator.id}
                                            onClick={() => setSelectedId(creator.id)}
                                            className="text-left"
                                        >
                                            <div
                                                className={`rounded-3xl p-[1px] transition ${
                                                    isSelected
                                                        ? 'bg-gradient-to-r from-[#c7a46a] to-[#8f6b39]'
                                                        : 'bg-white/10'
                                                }`}
                                            >
                                            <div className="rounded-3xl bg-[#14121a] p-4 border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] flex items-center justify-center text-sm font-semibold overflow-hidden">
                                                        {creator.avatarUrl ? (
                                                            <img
                                                                src={creator.avatarUrl}
                                                                alt={creator.displayName}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            getInitials(
                                                                creator.displayName
                                                            )
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-lg font-semibold text-[#f4ede3]">
                                                            {creator.displayName}
                                                        </p>
                                                        <p className="text-xs text-[#b7ad9c] line-clamp-2">
                                                            {creator.bio ||
                                                                'Creator premium'}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`inline-flex items-center gap-2 text-xs font-semibold ${
                                                            creator.online
                                                                ? 'text-emerald-300'
                                                                : 'text-[#b7ad9c]'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`h-2.5 w-2.5 rounded-full ${
                                                                creator.online
                                                                    ? 'bg-emerald-400'
                                                                    : 'bg-white/20'
                                                            }`}
                                                        />
                                                        {creator.online ? 'En ligne' : 'Hors ligne'}
                                                    </span>
                                                </div>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {creator.verified && (
                                                            <span className="inline-flex items-center gap-2 rounded-full border border-[#3a2c1a] bg-[#1b1510] px-3 py-1 text-xs text-[#f0d8ac]">
                                                                Verifie
                                                            </span>
                                                        )}
                                                        {creator.isSuspended && (
                                                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#b7ad9c]">
                                                                Profil suspendu
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="glass rounded-3xl p-6 space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] flex items-center justify-center text-lg font-semibold overflow-hidden">
                                {selectedCreator?.avatarUrl ? (
                                    <img
                                        src={selectedCreator.avatarUrl}
                                        alt={selectedCreator.displayName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : selectedCreator ? (
                                    getInitials(selectedCreator.displayName)
                                ) : (
                                    '?'
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                                    Model selectionne
                                </p>
                                <p className="text-xl font-semibold text-[#f4ede3]">
                                    {selectedCreator?.displayName || 'Selectionne un model'}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (canOpenPreview) setPreviewOpen(true);
                            }}
                            className={`relative h-48 w-full rounded-3xl bg-white/5 border border-white/5 overflow-hidden ${
                                canOpenPreview ? 'cursor-zoom-in' : 'cursor-default'
                            }`}
                        >
                            {detailLoading ? (
                                <div className="h-full w-full animate-pulse bg-white/10" />
                            ) : previewUrl ? (
                                previewIsVideo ? (
                                    <video
                                        src={previewUrl}
                                        muted
                                        playsInline
                                        disablePictureInPicture
                                        onContextMenu={(event) => event.preventDefault()}
                                        onTimeUpdate={(event) => {
                                            if (
                                                event.currentTarget.currentTime >
                                                PREVIEW_SECONDS
                                            ) {
                                                event.currentTarget.pause();
                                                event.currentTarget.currentTime = 0;
                                            }
                                        }}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <img
                                        src={previewUrl}
                                        alt={previewItem?.title || 'Apercu'}
                                        className="h-full w-full object-cover"
                                    />
                                )
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-sm text-[#b7ad9c]">
                                    Apercu indisponible
                                </div>
                            )}
                            {previewItem && (
                                <div className="absolute left-4 top-4 rounded-full bg-[#15131b] px-3 py-1 text-xs font-semibold text-[#f0d8ac] border border-white/10">
                                    {previewIsVideo
                                        ? `Apercu ${PREVIEW_SECONDS}s`
                                        : 'Photo gratuite'}
                                </div>
                            )}
                            {previewIsVideo && <WatermarkOverlay />}
                            {canOpenPreview && (
                                <div className="absolute inset-0 flex items-end justify-end p-4">
                                    <span className="rounded-full bg-[#15131b] px-3 py-1 text-xs font-semibold text-[#f0d8ac] border border-white/10">
                                        Agrandir
                                    </span>
                                </div>
                            )}
                        </button>

                        <div className="flex items-center justify-between text-xs text-[#b7ad9c]">
                            <span>Apercu gratuit, acces complet apres paiement.</span>
                            {selectedId && (
                                <Link
                                    href={`/creators/${selectedId}`}
                                    className="text-[#f0d8ac] font-semibold"
                                >
                                    Voir la galerie -&gt;
                                </Link>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Link
                                href={selectedId ? `/creators/${selectedId}` : '/creators'}
                                className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-[#d6cbb8] text-center"
                            >
                                Voir le profil
                            </Link>
                            <Link
                                href={selectedId ? `/creators/${selectedId}` : '/offers'}
                                className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-5 py-2 text-sm font-semibold text-center"
                            >
                                Debloquer + chat
                            </Link>
                        </div>
                    </div>
                </section>

                <Footer />
            </main>

            {previewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/70"
                        onClick={() => setPreviewOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-4xl">
                        <div className="glass rounded-3xl p-4 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm uppercase tracking-[0.3em] text-[#d8c7a8]">
                                    Apercu grand format
                                </p>
                                <button
                                    onClick={() => setPreviewOpen(false)}
                                    className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-[#d6cbb8]"
                                >
                                    Fermer
                                </button>
                            </div>
                            <div className="aspect-video rounded-2xl bg-black/40 overflow-hidden border border-white/10">
                                {previewUrl ? (
                                    previewIsVideo ? (
                                        <video
                                            src={previewUrl}
                                            muted
                                            playsInline
                                            controls
                                            controlsList="nodownload noplaybackrate noremoteplayback"
                                            disablePictureInPicture
                                            onContextMenu={(event) => event.preventDefault()}
                                            onTimeUpdate={(event) => {
                                                if (
                                                    event.currentTarget.currentTime >
                                                    PREVIEW_SECONDS
                                                ) {
                                                    event.currentTarget.pause();
                                                    event.currentTarget.currentTime = 0;
                                                }
                                            }}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <img
                                            src={previewUrl}
                                            alt={previewItem?.title || 'Apercu'}
                                            className="h-full w-full object-cover"
                                        />
                                    )
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-sm text-[#b7ad9c]">
                                        Apercu indisponible
                                    </div>
                                )}
                                {previewIsVideo && <WatermarkOverlay />}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
