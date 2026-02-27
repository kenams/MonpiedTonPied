'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { apiUrl } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';

type CreatorContent = {
    id: string;
    title: string;
    description: string;
    previewUrl: string | null;
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

type ViewerStatus = {
    subscriptionActive?: boolean;
};

export default function CreatorProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const token = getAuthToken();
    const isLoggedIn = Boolean(token);
    const [creator, setCreator] = useState<CreatorDetail | null>(null);
    const [viewer, setViewer] = useState<ViewerStatus | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [requestPrompt, setRequestPrompt] = useState('');
    const [requestPrice, setRequestPrice] = useState('');
    const [reportOpen, setReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');

    useEffect(() => {
        fetch(apiUrl(`/api/creators/${params.id}`), {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
            .then((res) => res.json())
            .then((data) => {
                if (data?.message) {
                    setMessage(data.message);
                }
                setCreator({
                    ...data,
                    contents: Array.isArray(data.contents) ? data.contents : [],
                });
            })
            .catch(() => {});

        if (token) {
            fetch(apiUrl('/api/users/me'), {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => setViewer(data))
                .catch(() => {});
        }
    }, [params.id, token]);

    const handleChat = async () => {
        setMessage(null);
        if (!token) {
            setMessage('Connecte-toi pour acceder au chat.');
            return;
        }
        if (!viewer?.subscriptionActive) {
            setMessage('Abonnement requis pour le chat.');
            return;
        }
        const response = await fetch(apiUrl(`/api/chats/${params.id}`), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || 'Chat indisponible.');
            return;
        }
        router.push(`/chat/${data.id}`);
    };

    const handleRequest = async () => {
        setMessage(null);
        if (!token) {
            setMessage('Connecte-toi pour faire une demande.');
            return;
        }
        const response = await fetch(apiUrl('/api/stripe/checkout/request'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                creatorId: params.id,
                prompt: requestPrompt,
                price: requestPrice,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || 'Demande impossible.');
            return;
        }
        if (data.url) {
            window.location.href = data.url;
        } else {
            setMessage(data.message || 'Demande enregistree.');
            setRequestPrompt('');
            setRequestPrice('');
        }
    };

    const handleSubscribe = async () => {
        if (!token) {
            setMessage('Connecte-toi pour t\'abonner.');
            return;
        }
        const response = await fetch(apiUrl('/api/stripe/checkout/subscription'), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || 'Abonnement impossible.');
            return;
        }
        if (data.url) {
            window.location.href = data.url;
        } else {
            setMessage(data.message || 'Abonnement active.');
            setViewer((prev) => ({ ...(prev || {}), subscriptionActive: true }));
        }
    };

    const handleReport = async () => {
        if (!token) {
            setMessage('Connecte-toi pour signaler.');
            return;
        }
        if (!reportReason.trim()) {
            setMessage('Raison requise.');
            return;
        }
        const response = await fetch(apiUrl('/api/reports'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                targetType: 'user',
                targetId: params.id,
                reason: reportReason,
                details: reportDetails,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || 'Signalement impossible.');
            return;
        }
        setMessage('Signalement envoye.');
        setReportOpen(false);
        setReportReason('');
        setReportDetails('');
    };

    if (!creator) {
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

    if (creator.isSuspended) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="max-w-4xl mx-auto px-6 py-16">
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-[#f0d8ac]">
                        Ce profil est temporairement suspendu.
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
                <div className="glass rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center gap-8">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] flex items-center justify-center text-3xl font-semibold overflow-hidden">
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
                    <div className="flex-1 space-y-2">
                        <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                            Profil creator
                        </p>
                        <h1 className="text-4xl font-semibold text-[#f4ede3]">
                            {creator.displayName}
                        </h1>
                        {creator.verified && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#3a2c1a] bg-[#1b1510] px-3 py-1 text-xs text-[#f0d8ac]">
                                Creator verifie
                            </span>
                        )}
                        <p className="text-[#b7ad9c] max-w-2xl">{creator.bio}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleChat}
                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 font-semibold text-sm text-center"
                        >
                            Ouvrir le chat
                        </button>
                        {!isLoggedIn && (
                            <Link
                                href="/auth/login"
                                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-[#d6cbb8] text-center"
                            >
                                Se connecter
                            </Link>
                        )}
                    </div>
                </div>

                {message && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold text-[#f4ede3]">
                                Galerie
                            </h2>
                            <span className="text-sm text-[#b7ad9c]">
                                3 photos visibles, le reste floute
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {creator.contents.length === 0 && (
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-[#b7ad9c]">
                                    Aucun contenu publie pour le moment.
                                </div>
                            )}
                            {creator.contents.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-2xl bg-white/5 shadow-lg overflow-hidden border border-white/5"
                                >
                                    <div className="aspect-[4/3] bg-gradient-to-br from-[#1b1622] to-[#2a2018] relative">
                                        {item.previewUrl ? (
                                            <img
                                                src={item.previewUrl}
                                                alt={item.title}
                                                className={`h-full w-full object-cover ${
                                                    !item.unlocked ? 'blur-md' : ''
                                                }`}
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-sm text-[#b7ad9c]">
                                                Preview
                                            </div>
                                        )}
                                        {!item.unlocked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <span className="rounded-full bg-[#15131b] px-4 py-2 text-xs font-semibold text-[#f0d8ac] border border-white/10">
                                                    Contenu verrouille
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 space-y-2">
                                        <p className="font-semibold text-[#f4ede3]">
                                            {item.title}
                                        </p>
                                        <p className="text-sm text-[#b7ad9c] line-clamp-2">
                                            {item.description}
                                        </p>
                                        <Link
                                            href={`/content/${item.id}`}
                                            className="inline-flex text-sm font-semibold text-[#f0d8ac]"
                                        >
                                            Voir la fiche -&gt;
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5 space-y-4">
                            <h3 className="text-lg font-semibold text-[#f4ede3]">
                                Demande personnalisee
                            </h3>
                            <p className="text-sm text-[#b7ad9c]">
                                Decris ta demande (pieds uniquement). Le creator a 48h pour repondre.
                            </p>
                            <textarea
                                value={requestPrompt}
                                onChange={(event) => setRequestPrompt(event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                rows={4}
                                placeholder="Ex: video pied sur drap satin..."
                            />
                            <input
                                value={requestPrice}
                                onChange={(event) => setRequestPrice(event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                placeholder="Prix propose (ex: 29.99)"
                            />
                            <button
                                onClick={handleRequest}
                                className="w-full rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] py-2 text-sm font-semibold"
                            >
                                Envoyer la demande
                            </button>
                            <p className="text-xs text-[#b7ad9c]">
                                Commission plateforme: 20%.
                            </p>
                        </div>
                        <div className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5 space-y-3">
                            <h3 className="text-lg font-semibold text-[#f4ede3]">
                                Abonnement
                            </h3>
                            <p className="text-sm text-[#b7ad9c]">
                                Abonnement = acces complet + chat illimite.
                            </p>
                            <button
                                onClick={handleSubscribe}
                                className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-5 py-2 text-sm font-semibold"
                            >
                                S&apos;abonner 11.99 EUR
                            </button>
                            <Link
                                href="/offers"
                                className="inline-flex text-sm font-semibold text-[#f0d8ac]"
                            >
                                Voir les offres -&gt;
                            </Link>
                        </div>
                        <div className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5 space-y-3">
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
                                        placeholder="Raison (ex: comportement abusif)"
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
                </div>
            </div>
            <Footer />
        </div>
    );
}

