'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import { apiUrl } from '../../../lib/api';
import { setAuthToken } from '../../../lib/auth';

export default function ConsumerRegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [password, setPassword] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const uploadAvatar = async (token: string) => {
        if (!avatarFile) return;
        const formData = new FormData();
        formData.append('file', avatarFile);
        await fetch(apiUrl('/api/uploads/avatar'), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(apiUrl('/api/auth/register/consumer'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    displayName,
                    email,
                    birthDate,
                    password,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Inscription impossible.');
            }

            setAuthToken(data.token);
            await uploadAvatar(data.token);
            router.push('/profile');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Inscription impossible.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                <div className="space-y-5">
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                        Compte consommateur
                    </p>
                    <h1 className="text-4xl font-semibold text-[#f4ede3]">
                        Decouvre les creators, en toute confiance.
                    </h1>
                    <p className="text-[#b7ad9c]">
                        Acces aux profils, 3 photos visibles par creator, puis contenu
                        floute. Le chat s&apos;ouvre apres abonnement.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 space-y-5">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#f4ede3]">
                            Inscription consommateur
                        </h2>
                        <p className="text-sm text-[#b7ad9c]">
                            Deja un compte ?{' '}
                            <Link href="/auth/login" className="text-[#f0d8ac] font-semibold">
                                Se connecter
                            </Link>
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                            {error}
                        </div>
                    )}

                    <label className="block space-y-2">
                        <span className="text-sm text-[#b7ad9c]">Pseudo public</span>
                        <input
                            value={displayName}
                            onChange={(event) => setDisplayName(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a]"
                            placeholder="Ex: Alex"
                            required
                        />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm text-[#b7ad9c]">Nom d&apos;utilisateur</span>
                        <input
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a]"
                            placeholder="ex: alex92"
                            required
                        />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm text-[#b7ad9c]">Email</span>
                        <input
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a]"
                            placeholder="hello@exemple.com"
                            required
                        />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm text-[#b7ad9c]">Date de naissance</span>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(event) => setBirthDate(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                            required
                        />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm text-[#b7ad9c]">Avatar</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                                setAvatarFile(event.target.files?.[0] || null)
                            }
                            className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                        />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm text-[#b7ad9c]">Mot de passe</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a]"
                            placeholder="Minimum 8 caracteres"
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] px-6 py-3 text-[#0b0a0f] font-semibold shadow-lg transition disabled:opacity-60"
                    >
                        {loading ? 'Creation...' : 'Creer mon compte consommateur'}
                    </button>
                </form>
            </div>
            <Footer />
        </div>
    );
}
