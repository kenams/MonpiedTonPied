'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { apiUrl } from '../../lib/api';
import { setAuthToken } from '../../lib/auth';

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(apiUrl('/api/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: identifier.includes('@') ? identifier : undefined,
                    username: !identifier.includes('@') ? identifier : undefined,
                    password,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Connexion impossible.');
            }

            setAuthToken(data.token);
            router.push('/profile');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Connexion impossible.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                        MonPiedTonPied
                    </p>
                    <h1 className="text-4xl md:text-5xl font-semibold text-[#f4ede3]">
                        Heureux de te revoir.
                    </h1>
                    <p className="text-lg text-[#b7ad9c]">
                        Accede a tes collections, retrouve tes creators favoris et prepare
                        tes prochaines publications.
                    </p>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[#b7ad9c]">Compte demo</p>
                                <p className="font-semibold text-[#f4ede3]">
                                    demo@monpiedtonpied.local
                                </p>
                            </div>
                            <span className="text-xs rounded-full bg-[#2a2218] px-3 py-1 text-[#f0d8ac] border border-[#3a2c1a]">
                                mot de passe: demo1234
                            </span>
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="glass rounded-3xl p-8 space-y-6"
                >
                    <div>
                        <h2 className="text-2xl font-semibold text-[#f4ede3]">
                            Connexion
                        </h2>
                        <p className="text-sm text-[#b7ad9c]">
                            Pas encore inscrit ?{' '}
                            <Link
                                href="/auth/register"
                                className="text-[#f0d8ac] font-semibold"
                            >
                                Creer un compte
                            </Link>
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                            {error}
                        </div>
                    )}

                    <label className="block space-y-2">
                        <span className="text-sm text-[#b7ad9c]">Email ou pseudo</span>
                        <input
                            value={identifier}
                            onChange={(event) => setIdentifier(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a] focus:outline-none focus:ring-2 focus:ring-[#c7a46a]"
                            placeholder="ex: marie@pied.com"
                            required
                        />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm text-[#b7ad9c]">Mot de passe</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a] focus:outline-none focus:ring-2 focus:ring-[#c7a46a]"
                            placeholder="********"
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] px-6 py-3 text-[#0b0a0f] font-semibold shadow-lg transition disabled:opacity-60"
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>
            </div>
            <Footer />
        </div>
    );
}
