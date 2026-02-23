'use client';

import { useState } from 'react';
import Navigation from '../components/Navigation';
import { apiUrl } from '../lib/api';
import { getAuthToken } from '../lib/auth';

export default function OffersPage() {
    const token = getAuthToken();
    const [message, setMessage] = useState<string | null>(null);

    const redirectToCheckout = async (path: string) => {
        setMessage(null);
        if (!token) {
            setMessage('Connecte-toi pour souscrire.');
            return;
        }
        const response = await fetch(apiUrl(path), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || 'Paiement impossible.');
            return;
        }
        if (data.url) {
            window.location.href = data.url;
        } else {
            setMessage(data.message || 'Paiement simulé.');
        }
    };

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="space-y-4">
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                        Offres premium
                    </p>
                    <h1 className="text-4xl md:text-5xl font-semibold text-[#f4ede3]">
                        Accès au contenu et chat illimité.
                    </h1>
                    <p className="text-lg text-[#b7ad9c] max-w-2xl">
                        La première photo de chaque créateur est visible. Le reste est flouté
                        jusqu’au paiement.
                    </p>
                </div>

                {message && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-3xl bg-white/5 p-8 shadow-lg border border-white/5 space-y-5">
                        <h2 className="text-2xl font-semibold text-[#f4ede3]">
                            Pass 5,99€
                        </h2>
                        <p className="text-[#b7ad9c]">
                            Accès complet au contenu pendant 30 jours. Le chat n’est pas
                            inclus.
                        </p>
                        <ul className="text-sm text-[#b7ad9c] space-y-2">
                            <li>Accès aux galeries</li>
                            <li>3 photos visibles avant achat</li>
                            <li>Pas de chat</li>
                        </ul>
                        <button
                            onClick={() => redirectToCheckout('/api/stripe/checkout/pass')}
                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 text-sm font-semibold"
                        >
                            Activer le pass
                        </button>
                    </div>

                    <div className="rounded-3xl bg-white/5 p-8 shadow-lg border border-white/5 space-y-5">
                        <h2 className="text-2xl font-semibold text-[#f4ede3]">
                            Abonnement 11,99€
                        </h2>
                        <p className="text-[#b7ad9c]">
                            Accès complet + chat illimité avec tous les créateurs.
                        </p>
                        <ul className="text-sm text-[#b7ad9c] space-y-2">
                            <li>Accès aux galeries</li>
                            <li>Chat direct illimité</li>
                            <li>Accès prioritaire aux nouveautés</li>
                        </ul>
                        <button
                            onClick={() =>
                                redirectToCheckout('/api/stripe/checkout/subscription')
                            }
                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 text-sm font-semibold"
                        >
                            S’abonner
                        </button>
                    </div>
                </div>

                <div className="rounded-3xl bg-white/5 p-8 shadow-lg border border-white/5">
                    <h3 className="text-xl font-semibold text-[#f4ede3]">
                        Demandes personnalisées
                    </h3>
                    <p className="text-[#b7ad9c] mt-2">
                        Les demandes custom restent à l’unité. Commission plateforme 20%.
                        Le créateur a 48h pour répondre.
                    </p>
                </div>
            </div>
        </div>
    );
}
