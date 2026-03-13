'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import { apiUrl } from '../../../lib/api';

export default function ResetPasswordPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = use(params);
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const response = await fetch(apiUrl('/api/auth/password/reset'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Reset impossible.');
            }
            setMessage('Mot de passe mis a jour. Connecte-toi.');
            setPassword('');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Erreur.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Navigation />
            <div className="max-w-xl mx-auto px-6 py-16 space-y-6">
                <h1 className="text-3xl font-semibold text-[#f4ede3]">
                    Nouveau mot de passe
                </h1>
                <p className="text-sm text-[#b7ad9c]">
                    Choisis un mot de passe d&apos;au moins 8 caracteres.
                </p>
                {message && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {message}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 space-y-4">
                    <label className="block space-y-2">
                        <span className="text-sm text-[#b7ad9c]">Mot de passe</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                            required
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] px-6 py-3 text-sm font-semibold text-[#0b0a0f] disabled:opacity-60"
                    >
                        {loading ? 'Mise a jour...' : 'Mettre a jour'}
                    </button>
                </form>
                <Link href="/auth/login" className="text-sm text-[#f0d8ac] font-semibold">
                    Retour a la connexion
                </Link>
            </div>
            <Footer />
        </div>
    );
}
