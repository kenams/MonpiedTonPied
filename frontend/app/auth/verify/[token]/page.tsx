'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../../../components/Navigation';
import Footer from '../../../components/Footer';
import { apiUrl } from '../../../lib/api';

export default function VerifyEmailPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = use(params);
    const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        fetch(apiUrl('/api/auth/email/verify'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        })
            .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                setStatus(ok ? 'ok' : 'error');
                setMessage(data.message || (ok ? 'Email verifie.' : 'Erreur.'));
            })
            .catch(() => {
                setStatus('error');
                setMessage('Erreur.');
            });
    }, [token]);

    return (
        <div className="min-h-screen">
            <Navigation />
            <div className="max-w-xl mx-auto px-6 py-16 space-y-6">
                <h1 className="text-3xl font-semibold text-[#f4ede3]">
                    Verification email
                </h1>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                    {status === 'loading' ? 'Verification en cours...' : message}
                </div>
                <Link href="/auth/login" className="text-sm text-[#f0d8ac] font-semibold">
                    Retour a la connexion
                </Link>
            </div>
            <Footer />
        </div>
    );
}
