'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiUrl } from '../lib/api';
import { getAuthToken } from '../lib/auth';

type UploadResult = {
    url: string;
    type: 'image' | 'video';
};

const guidelines = [
    'Format recommande: JPG, PNG ou MP4.',
    '3 photos visibles par createur, le reste est floute.',
    'Serie courte, propre, et lumiere soignee.',
    'Age requis: 18+ et verification obligatoire.',
];

export default function CreatePage() {
    const [token, setToken] = useState('');
    const [isCreator, setIsCreator] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const stored = getAuthToken();
        setToken(stored);
        if (stored) {
            fetch(apiUrl('/api/users/me'), {
                headers: { Authorization: `Bearer ${stored}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    setIsCreator(data.role === 'creator' || data.role === 'admin');
                })
                .catch(() => {});
        }
    }, []);

    const uploadFile = async (): Promise<UploadResult | null> => {
        if (!file) {
            return null;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(apiUrl('/api/uploads'), {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Upload error.');
        }

        return data as UploadResult;
    };

    const handleSubmit = async () => {
        setFormError(null);
        setFormSuccess(null);
        setSubmitting(true);

        try {
            if (!token) {
                throw new Error('Connecte-toi avant de publier.');
            }

            if (!title.trim()) {
                throw new Error('Le titre est requis.');
            }

            if (price.trim() && !Number.isFinite(Number(price))) {
                throw new Error('Le prix doit etre un nombre.');
            }

            const uploaded = await uploadFile();
            const priceValue = price.trim() ? Number(price) : undefined;

            const response = await fetch(apiUrl('/api/content'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    files: uploaded
                        ? [
                              {
                                  url: uploaded.url,
                                  type: uploaded.type,
                                  thumbnail: uploaded.url,
                                  price: Number.isFinite(priceValue) ? priceValue : undefined,
                              },
                          ]
                        : [],
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de la publication.');
            }

            setFormSuccess('Contenu publie.');
            setTitle('');
            setDescription('');
            setPrice('');
            setFile(null);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Erreur.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="glass rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center gap-8">
                    <div className="space-y-3">
                        <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                            Studio creator
                        </p>
                        <h1 className="text-4xl font-semibold text-[#f4ede3]">
                            Publie ta prochaine serie.
                        </h1>
                        <p className="text-[#b7ad9c] max-w-xl">
                            Charge tes photos ou videos, fixe un prix et partage ton univers.
                            Les contenus sont vendus a la piece ou via abonnement.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/profile"
                            className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-[#d6cbb8]"
                        >
                            Voir mon profil
                        </Link>
                        <Link
                            href="/browse"
                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 text-sm font-semibold"
                        >
                            Explorer le feed
                        </Link>
                    </div>
                </div>

                {!token && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-[#f0d8ac]">
                        Connecte-toi pour publier un contenu.{' '}
                        <Link href="/auth/login" className="font-semibold underline">
                            Se connecter
                        </Link>{' '}
                        ou{' '}
                        <Link href="/auth/register" className="font-semibold underline">
                            creer un compte
                        </Link>
                        .
                    </div>
                )}
                {token && !isCreator && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-[#f0d8ac]">
                        Ce compte est un profil consommateur.{' '}
                        <Link href="/auth/register/creator" className="font-semibold underline">
                            Cree un compte creator
                        </Link>{' '}
                        pour publier du contenu.
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
                    <div className="rounded-3xl bg-white/5 p-8 shadow-lg space-y-5 border border-white/5">
                        {formError && (
                            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                                {formError}
                            </div>
                        )}
                        {formSuccess && (
                            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-emerald-200">
                                {formSuccess}
                            </div>
                        )}

                        <label className="block space-y-2">
                            <span className="text-sm text-[#b7ad9c]">Titre</span>
                            <input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="Ex: Studio rose - Serie 01"
                                className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a]"
                            />
                        </label>

                        <label className="block space-y-2">
                            <span className="text-sm text-[#b7ad9c]">Description</span>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Ajoute quelques mots sur l'ambiance, la lumiere, le set..."
                                className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a]"
                                rows={5}
                            />
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="block space-y-2">
                                <span className="text-sm text-[#b7ad9c]">Prix (EUR)</span>
                                <input
                                    value={price}
                                    onChange={(event) => setPrice(event.target.value)}
                                    placeholder="14.00"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a]"
                                />
                            </label>
                            <label className="block space-y-2">
                                <span className="text-sm text-[#b7ad9c]">Fichier</span>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                                    className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                />
                            </label>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !token || !isCreator}
                            className="w-full rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] py-3 font-semibold shadow-lg disabled:opacity-60"
                        >
                            {submitting ? 'Publication...' : 'Publier'}
                        </button>

                        <p className="text-xs text-[#b7ad9c]">
                            Commission plateforme: 20%. Paiement au creator sous 48h apres validation.
                        </p>
                    </div>

                    <div className="rounded-3xl bg-white/5 p-8 shadow-lg space-y-6 border border-white/5">
                        <div>
                            <h2 className="text-xl font-semibold text-[#f4ede3]">
                                Conseils de publication
                            </h2>
                            <ul className="text-sm text-[#b7ad9c] space-y-3 mt-4">
                                {guidelines.map((item) => (
                                    <li key={item} className="flex items-start gap-2">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-[#c7a46a]" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-2xl bg-[#1a1510] px-4 py-4 text-sm text-[#f0d8ac] border border-[#3a2c1a]">
                            Pro tip: propose un prix d&apos;appel pour attirer de nouveaux fans.
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-[#b7ad9c]">
                            Demandes specifiques: reponse en 48h, contenu uniquement autour des pieds.
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
