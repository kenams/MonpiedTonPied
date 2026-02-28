'use client';
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiUrl } from '../lib/api';
import { clearAuthToken, getAuthToken } from '../lib/auth';

export const dynamic = 'force-dynamic';

type UserProfile = {
    id: string;
    username: string;
    role: 'consumer' | 'creator' | 'admin';
    displayName: string;
    bio?: string;
    avatarUrl?: string;
    ageVerified: boolean;
    accessPassActive?: boolean;
    subscriptionActive?: boolean;
    verifiedCreator?: boolean;
    isSuspended?: boolean;
};

export default function ProfilePage() {
    const [token, setToken] = useState(() => getAuthToken());
    const [user, setUser] = useState<UserProfile | null>(null);
    const [formState, setFormState] = useState({
        displayName: '',
        bio: '',
        avatarUrl: '',
    });
    const [message, setMessage] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const loadProfile = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(apiUrl('/api/users/me'), {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) return;
            setUser(data);
            setFormState({
                displayName: data.displayName || '',
                bio: data.bio || '',
                avatarUrl: data.avatarUrl || '',
            });
        } catch {
            // ignore
        }
    }, [token]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const canceled = params.get('canceled');

        if (success === 'pass') {
            setMessage('Pass active. Acces premium 30 jours.');
            loadProfile();
        } else if (success === 'subscription') {
            setMessage('Abonnement active. Chat et contenu debloques.');
            loadProfile();
        } else if (canceled === 'pass' || canceled === 'subscription') {
            setMessage('Paiement annule. Aucun changement applique.');
        }
    }, [loadProfile]);

    const handleLogout = () => {
        clearAuthToken();
        setToken('');
        setUser(null);
    };

    const handleSave = async () => {
        if (!token) return;
        setMessage(null);
        const response = await fetch(apiUrl('/api/users/me'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formState),
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || 'Erreur de sauvegarde.');
            return;
        }
        setUser(data);
        setMessage('Profil mis a jour.');
    };

    const handleAvatarUpload = async (file: File | null) => {
        if (!file || !token) return;
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(apiUrl('/api/uploads/avatar'), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || 'Upload impossible.');
        } else {
            setFormState((prev) => ({ ...prev, avatarUrl: data.url }));
            setUser((prev) => (prev ? { ...prev, avatarUrl: data.url } : prev));
            setMessage('Avatar mis a jour.');
        }
        setUploadingAvatar(false);
    };

    const handleManageSubscription = async () => {
        if (!token) return;
        setMessage(null);
        const response = await fetch(apiUrl('/api/stripe/portal'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                returnUrl: `${window.location.origin}/profile`,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || 'Portail Stripe indisponible.');
            return;
        }
        if (data.url) {
            window.location.href = data.url;
        }
    };

    const planLabel = user?.subscriptionActive
        ? 'Abonnement actif'
        : user?.accessPassActive
        ? 'Pass actif'
        : 'Aucun plan actif';

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="glass rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                    <div className="space-y-3">
                        <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                            Espace personnel
                        </p>
                        <h1 className="text-4xl font-semibold text-[#f4ede3]">
                            {user ? user.displayName : 'Profil personnel'}
                        </h1>
                        <p className="text-[#b7ad9c] max-w-xl">
                            {user?.role === 'creator'
                                ? 'Gere ta vitrine publique, tes demandes custom et tes revenus.'
                                : 'Gere tes favoris, tes acces premium et tes achats.'}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {user?.role === 'creator' && (
                            <Link
                                href="/create"
                                className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 font-semibold text-sm"
                            >
                                Publier un contenu
                            </Link>
                        )}
                        {user?.role === 'creator' && (
                            <Link
                                href="/dashboard/creator"
                                className="rounded-full border border-white/15 px-6 py-3 font-semibold text-sm text-[#d6cbb8]"
                            >
                                Dashboard
                            </Link>
                        )}
                        {token ? (
                            <button
                                onClick={handleLogout}
                                className="rounded-full border border-white/15 px-6 py-3 font-semibold text-sm text-[#d6cbb8]"
                            >
                                Se deconnecter
                            </button>
                        ) : (
                            <Link
                                href="/auth/login"
                                className="rounded-full border border-white/15 px-6 py-3 font-semibold text-sm text-[#d6cbb8]"
                            >
                                Se connecter
                            </Link>
                        )}
                    </div>
                </div>

                {!token && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-[#f0d8ac]">
                        Tu n&apos;es pas connecte.{' '}
                        <Link href="/auth/login" className="font-semibold underline">
                            Connecte-toi
                        </Link>{' '}
                        pour acceder a ton profil.
                    </div>
                )}

                {user && (
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
                        <div className="rounded-3xl bg-white/5 p-8 shadow-lg space-y-5 border border-white/5">
                            <h2 className="text-2xl font-semibold text-[#f4ede3]">
                                Informations publiques
                            </h2>
                            {message && (
                                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                                    {message}
                                </div>
                            )}
                            <label className="block space-y-2">
                                <span className="text-sm text-[#b7ad9c]">Pseudo</span>
                                <input
                                    value={formState.displayName}
                                    onChange={(event) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            displayName: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                />
                            </label>
                            <div className="space-y-3">
                                <span className="text-sm text-[#b7ad9c]">Avatar</span>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-2xl bg-[#15131b] overflow-hidden border border-white/10">
                                        {formState.avatarUrl ? (
                                            <img
                                                src={formState.avatarUrl}
                                                alt="Avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : null}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) =>
                                            handleAvatarUpload(
                                                event.target.files?.[0] || null
                                            )
                                        }
                                        className="flex-1 rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                    />
                                </div>
                                <input
                                    value={formState.avatarUrl}
                                    onChange={(event) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            avatarUrl: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                    placeholder="ou colle une URL"
                                />
                                {uploadingAvatar && (
                                    <p className="text-xs text-[#b7ad9c]">Upload en cours...</p>
                                )}
                            </div>
                            {user.role === 'creator' && (
                                <label className="block space-y-2">
                                    <span className="text-sm text-[#b7ad9c]">Bio</span>
                                    <textarea
                                        value={formState.bio}
                                        onChange={(event) =>
                                            setFormState((prev) => ({
                                                ...prev,
                                                bio: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                        rows={4}
                                    />
                                </label>
                            )}
                            <button
                                onClick={handleSave}
                                className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-2 text-sm font-semibold"
                            >
                                Enregistrer
                            </button>
                        </div>

                        <div className="rounded-3xl bg-white/5 p-8 shadow-lg space-y-4 border border-white/5">
                            <h3 className="text-lg font-semibold text-[#f4ede3]">
                                Statut
                            </h3>
                            <div className="space-y-2 text-sm text-[#b7ad9c]">
                                <p>Age verifie: {user.ageVerified ? 'oui' : 'non'}</p>
                                <p>Plan: {planLabel}</p>
                                <p>Role: {user.role}</p>
                                {user.role === 'creator' && (
                                    <p>Creator verifie: {user.verifiedCreator ? 'oui' : 'non'}</p>
                                )}
                            </div>
                            {user.isSuspended && (
                                <p className="text-sm text-[#f0d8ac]">
                                    Profil suspendu temporairement
                                </p>
                            )}
                            {user.subscriptionActive && (
                                <button
                                    onClick={handleManageSubscription}
                                    className="rounded-full border border-[#3a2c1a] px-5 py-2 text-sm font-semibold text-[#f0d8ac] mt-2"
                                >
                                    Gerer mon abonnement
                                </button>
                            )}
                            {user.role === 'creator' ? (
                                <Link
                                    href="/requests"
                                    className="inline-flex text-sm font-semibold text-[#f0d8ac]"
                                >
                                    Voir les demandes custom -&gt;
                                </Link>
                            ) : (
                                <Link
                                    href="/offers"
                                    className="inline-flex text-sm font-semibold text-[#f0d8ac]"
                                >
                                    Voir les offres -&gt;
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}



