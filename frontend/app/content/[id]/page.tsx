'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { apiUrl } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';

export const dynamic = 'force-dynamic';

type ContentFile = {
    url: string;
    type: string;
    thumbnail?: string;
    price?: number;
    isLocked?: boolean;
};

type ContentDetail = {
    _id: string;
    title: string;
    description: string;
    creator: { id?: string; username: string; displayName?: string };
    files: ContentFile[];
    canAccess: boolean;
    isPreview?: boolean;
};

export default function ContentPage({ params }: { params: { id: string } }) {
    const [content, setContent] = useState<ContentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [billingMessage, setBillingMessage] = useState<string | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');

    const token = getAuthToken();

    const fetchContent = useCallback(async () => {
        try {
            const response = await fetch(apiUrl(`/api/content/${params.id}`), {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Contenu introuvable.');
            }
            setContent(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur.');
        } finally {
            setLoading(false);
        }
    }, [params.id, token]);

    useEffect(() => {
        fetchContent();
        if (token) {
            fetch(apiUrl('/api/users/me'), {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => setIsSubscribed(Boolean(data.subscriptionActive)))
                .catch(() => {});
        }
    }, [fetchContent, token]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const canceled = params.get('canceled');

        if (success === 'content') {
            setBillingMessage('Paiement confirme. Acces debloque.');
            fetchContent();
        } else if (canceled === 'content') {
            setBillingMessage('Paiement annule. Contenu toujours verrouille.');
        }
    }, [fetchContent]);

    const handleChat = async () => {
        if (!content?.creator?.id) {
            setBillingMessage('Creator introuvable.');
            return;
        }
        if (!token) {
            setBillingMessage('Connecte-toi pour acceder au chat.');
            return;
        }
        if (!isSubscribed) {
            setBillingMessage('Abonnement requis pour le chat.');
            return;
        }
        const response = await fetch(apiUrl(`/api/chats/${content.creator.id}`), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
            setBillingMessage(data.message || 'Chat indisponible.');
            return;
        }
        window.location.href = `/chat/${data.id}`;
    };

    const handleReport = async () => {
        if (!token) {
            setBillingMessage('Connecte-toi pour signaler.');
            return;
        }
        if (!reportReason.trim()) {
            setBillingMessage('Raison requise.');
            return;
        }
        const response = await fetch(apiUrl('/api/reports'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                targetType: 'content',
                targetId: content?._id,
                reason: reportReason,
                details: reportDetails,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            setBillingMessage(data.message || 'Signalement impossible.');
            return;
        }
        setBillingMessage('Signalement envoye.');
        setReportOpen(false);
        setReportReason('');
        setReportDetails('');
    };

    const redirectToCheckout = async (path: string, body?: Record<string, unknown>) => {
        setBillingMessage(null);
        if (!token) {
            setBillingMessage('Connecte-toi avant de payer.');
            return;
        }

        try {
            const response = await fetch(apiUrl(path), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: body ? JSON.stringify(body) : undefined,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erreur de paiement.');
            }
            if (data.url) {
                window.location.href = data.url;
            } else {
                setBillingMessage(data.message || 'Paiement simule.');
                fetchContent();
            }
        } catch (err) {
            setBillingMessage(err instanceof Error ? err.message : 'Erreur de paiement.');
        }
    };

    const handlePurchase = async () => {
        if (!content) return;
        await redirectToCheckout('/api/stripe/checkout/content', {
            contentId: content._id,
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#c7a46a]"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !content) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="max-w-3xl mx-auto px-6 py-16">
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-[#f0d8ac]">
                        {error || 'Contenu introuvable.'}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const price = content.files?.[0]?.price;

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-1 space-y-3">
                        <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                            Collection
                        </p>
                        <h1 className="text-4xl font-semibold text-[#f4ede3]">
                            {content.title}
                        </h1>
                        <p className="text-[#b7ad9c]">{content.description}</p>
                        <p className="text-sm text-[#b7ad9c]">
                            Par {content.creator.displayName || content.creator.username}
                        </p>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-6 shadow-lg space-y-3 border border-white/5">
                        <p className="text-sm text-[#b7ad9c]">Acces</p>
                        <p className="text-2xl font-semibold text-[#f4ede3]">
                            {content.canAccess ? 'Debloque' : 'Verrouille'}
                        </p>
                        <Link
                            href="/browse"
                            className="inline-flex text-sm font-semibold text-[#f0d8ac]"
                        >
                            Retour au feed -&gt;
                        </Link>
                    </div>
                </div>

                {billingMessage && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {billingMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {content.files.map((file, index) => (
                                <div
                                    key={`${file.url}-${index}`}
                                    className="rounded-3xl bg-white/5 shadow-lg overflow-hidden border border-white/5"
                                >
                                    <div className="aspect-[4/3] bg-gradient-to-br from-[#1b1622] to-[#2a2018] flex items-center justify-center relative">
                                        {file.type.startsWith('video') ? (
                                            <video
                                                src={file.url}
                                                controls={!file.isLocked}
                                                className={`h-full w-full object-cover ${
                                                    file.isLocked ? 'blur-md' : ''
                                                }`}
                                            />
                                        ) : (
                                            <img
                                                src={file.url}
                                                alt={content.title}
                                                className={`h-full w-full object-cover ${
                                                    file.isLocked ? 'blur-md' : ''
                                                }`}
                                            />
                                        )}
                                        {file.isLocked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <span className="rounded-full bg-[#15131b] px-4 py-2 text-sm font-semibold text-[#f0d8ac] border border-white/10">
                                                    Debloquer pour voir
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 text-sm text-[#b7ad9c]">
                                        {index === 0
                                            ? 'Preview gratuite'
                                            : file.isLocked
                                            ? 'Verrouille'
                                            : 'Accessible'}
                                    </div>
                                </div>
                            ))}
                            {content.files.length === 0 && (
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-[#b7ad9c]">
                                    Aucun fichier associe.
                                </div>
                            )}
                        </div>
                        <div className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-[#f4ede3]">
                                    Moderation
                                </h3>
                                <button
                                    onClick={() => setReportOpen((prev) => !prev)}
                                    className="text-sm text-[#f0d8ac] font-semibold"
                                >
                                    Signaler
                                </button>
                            </div>
                            {reportOpen && (
                                <div className="space-y-3">
                                    <input
                                        value={reportReason}
                                        onChange={(event) =>
                                            setReportReason(event.target.value)
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                        placeholder="Raison (ex: contenu inapproprie)"
                                    />
                                    <textarea
                                        value={reportDetails}
                                        onChange={(event) =>
                                            setReportDetails(event.target.value)
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                        rows={3}
                                        placeholder="Details"
                                    />
                                    <button
                                        onClick={handleReport}
                                        className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-4 py-2 text-sm font-semibold"
                                    >
                                        Envoyer
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-3xl bg-white/5 p-6 shadow-lg space-y-4 border border-white/5">
                            <h2 className="text-xl font-semibold text-[#f4ede3]">
                                Debloquer l&apos;acces
                            </h2>
                            <p className="text-sm text-[#b7ad9c]">
                                Pass d&apos;acces 5.99 EUR ou abonnement 11.99 EUR / mois.
                                3 photos visibles par creator, le reste est floute.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => redirectToCheckout('/api/stripe/checkout/pass')}
                                    className="w-full rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] py-2 text-sm font-semibold"
                                >
                                    Activer le pass 5.99 EUR
                                </button>
                                <button
                                    onClick={() =>
                                        redirectToCheckout('/api/stripe/checkout/subscription')
                                    }
                                    className="w-full rounded-full border border-white/15 py-2 text-sm font-semibold text-[#d6cbb8]"
                                >
                                    S&apos;abonner 11.99 EUR
                                </button>
                                <button
                                    onClick={handleChat}
                                    className="w-full rounded-full border border-[#3a2c1a] py-2 text-sm font-semibold text-[#f0d8ac]"
                                >
                                    Ouvrir le chat (abonnement)
                                </button>
                                {typeof price === 'number' && price > 0 && (
                                    <button
                                        onClick={handlePurchase}
                                        className="w-full rounded-full border border-[#3a2c1a] py-2 text-sm font-semibold text-[#f0d8ac]"
                                    >
                                        Acheter ce contenu {price} EUR
                                    </button>
                                )}
                            </div>
                            <div className="text-xs text-[#b7ad9c] space-y-2">
                                <p>Pass valable 30 jours. Abonnement mensuel.</p>
                                <p>Les creators ont toujours acces a leurs contenus.</p>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white/5 p-6 shadow-lg space-y-3 border border-white/5">
                            <h3 className="text-lg font-semibold text-[#f4ede3]">
                                A propos du creator
                            </h3>
                            <p className="text-sm text-[#b7ad9c]">
                                {content.creator.username} publie regulierement de nouvelles
                                series exclusives. Suis son profil pour ne rien manquer.
                            </p>
                            <Link
                                href="/creators"
                                className="inline-flex text-sm font-semibold text-[#f0d8ac]"
                            >
                                Voir les creators -&gt;
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}


