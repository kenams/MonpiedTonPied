'use client';

import { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
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
            setMessage(data.message || 'Paiement simule.');
        }
    };

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="space-y-4">
                    <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                        Offres premium
                    </p>
                    <h1 className="text-4xl md:text-5xl font-semibold text-[#f4ede3]">
                        Acces total aux collections et au chat.
                    </h1>
                    <p className="text-lg text-[#b7ad9c] max-w-2xl">
                        3 photos visibles par creator. Le reste est floute jusqu&apos;au paiement.
                        Les creators ont 48h pour repondre aux demandes custom.
                    </p>
                </div>

                {message && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="rounded-3xl bg-white/5 p-8 shadow-lg border border-white/5 space-y-5">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                            Pass 30 jours
                        </p>
                        <h2 className="text-3xl font-semibold text-[#f4ede3]">5.99 EUR</h2>
                        <p className="text-[#b7ad9c]">
                            Acces complet aux collections pendant 30 jours.
                        </p>
                        <ul className="text-sm text-[#b7ad9c] space-y-2">
                            <li>Acces aux galeries</li>
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

                    <div className="rounded-3xl bg-white/5 p-8 shadow-lg border border-[#3a2c1a] space-y-5">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                            Abonnement
                        </p>
                        <h2 className="text-3xl font-semibold text-[#f4ede3]">11.99 EUR</h2>
                        <p className="text-[#b7ad9c]">
                            Acces complet + chat illimite avec tous les creators.
                        </p>
                        <ul className="text-sm text-[#b7ad9c] space-y-2">
                            <li>Acces aux galeries</li>
                            <li>Chat direct illimite</li>
                            <li>Acces prioritaire aux nouveautes</li>
                        </ul>
                        <button
                            onClick={() => redirectToCheckout('/api/stripe/checkout/subscription')}
                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 text-sm font-semibold"
                        >
                            S&apos;abonner
                        </button>
                    </div>

                    <div className="rounded-3xl bg-white/5 p-8 shadow-lg border border-white/5 space-y-5">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#d8c7a8]">
                            Demandes custom
                        </p>
                        <h2 className="text-2xl font-semibold text-[#f4ede3]">
                            Prix libre
                        </h2>
                        <p className="text-[#b7ad9c]">
                            L&apos;achat a l&apos;unite se fait avec le creator. Reponse sous 48h.
                        </p>
                        <ul className="text-sm text-[#b7ad9c] space-y-2">
                            <li>Prix defini par le creator</li>
                            <li>Commission plateforme 20%</li>
                            <li>Contenu uniquement autour des pieds</li>
                        </ul>
                        <button
                            onClick={() => redirectToCheckout('/api/stripe/checkout/request')}
                            className="rounded-full border border-[#3a2c1a] px-6 py-3 text-sm font-semibold text-[#f0d8ac]"
                        >
                            Faire une demande
                        </button>
                    </div>
                </div>

                <div className="rounded-3xl bg-white/5 p-8 shadow-lg border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-[#d8c7a8]">
                            Moderation
                        </p>
                        <p className="text-[#b7ad9c] text-sm">
                            Contenu verifie, signalement rapide, reponse sous 24h.
                        </p>
                    </div>
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-[#d8c7a8]">
                            Paiements
                        </p>
                        <p className="text-[#b7ad9c] text-sm">
                            Paiements securises et transparents. Facture disponible.
                        </p>
                    </div>
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-[#d8c7a8]">
                            Confidentialite
                        </p>
                        <p className="text-[#b7ad9c] text-sm">
                            Donnees protegees. Profil discret et controle d&apos;acces.
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
