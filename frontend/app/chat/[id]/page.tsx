'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { apiUrl } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';
import { useLocale } from '../../components/LocaleProvider';

type Message = {
    id: string;
    sender: string;
    text: string;
    createdAt: string;
};

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { locale } = useLocale();
    const copy =
        locale === 'fr'
            ? {
                  unavailable: 'Chat indisponible.',
                  sendFailed: 'Message non envoye.',
                  title: 'Chat direct',
                  subtitle: 'Abonnement requis. Moderation active contre les propos abusifs.',
                  loginRequired: 'Connecte-toi pour acceder au chat.',
                  subRequired: 'Abonnement requis pour le chat.',
                  empty: 'Aucun message pour le moment.',
                  placeholder: 'Ecris un message...',
                  send: 'Envoyer',
                  login: 'Se connecter',
                  subscribe: "S'abonner",
              }
            : {
                  unavailable: 'Chat unavailable.',
                  sendFailed: 'Message not sent.',
                  title: 'Direct chat',
                  subtitle: 'Subscription required. Active moderation against abusive messages.',
                  loginRequired: 'Log in to access chat.',
                  subRequired: 'A subscription is required for chat.',
                  empty: 'No messages yet.',
                  placeholder: 'Write a message...',
                  send: 'Send',
                  login: 'Log in',
                  subscribe: 'Subscribe',
              };
    const { id } = use(params);
    const token = getAuthToken();
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [premiumAccess, setPremiumAccess] = useState<boolean | null>(null);

    const fetchMessages = async () => {
        if (!token) return;
        const response = await fetch(apiUrl(`/api/chats/${id}/messages`), {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
            setMessages(data);
        } else {
            setError(data.message || copy.unavailable);
        }
    };

    useEffect(() => {
        fetchMessages();
        if (token) {
            fetch(apiUrl('/api/users/me'), {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => setPremiumAccess(Boolean(data.premiumAccess)))
                .catch(() => setPremiumAccess(false));
        } else {
            setPremiumAccess(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSend = async () => {
        if (!token || !text.trim()) return;
        setError(null);
        const response = await fetch(apiUrl(`/api/chats/${id}/messages`), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ text }),
        });
        const data = await response.json();
        if (!response.ok) {
            setError(data.message || copy.sendFailed);
            return;
        }
        setText('');
        fetchMessages();
    };

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
                <div className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5">
                    <h1 className="text-2xl font-semibold text-[#f4ede3]">{copy.title}</h1>
                    <p className="text-sm text-[#b7ad9c]">{copy.subtitle}</p>
                </div>

                {error && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {error}
                    </div>
                )}

                <div className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5 space-y-4">
                    {!token && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                            {copy.loginRequired}
                        </div>
                    )}
                    {token && premiumAccess === false && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                            {copy.subRequired}
                        </div>
                    )}
                    <div className="space-y-3 max-h-[420px] overflow-auto">
                        {messages.length === 0 && (
                            <p className="text-sm text-[#b7ad9c]">{copy.empty}</p>
                        )}
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className="rounded-2xl bg-[#15131b] px-4 py-3 text-sm text-[#f4ede3]"
                            >
                                {message.text}
                            </div>
                        ))}
                    </div>

                    {premiumAccess ? (
                        <div className="flex gap-3">
                            <input
                                value={text}
                                onChange={(event) => setText(event.target.value)}
                                className="flex-1 rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                placeholder={copy.placeholder}
                            />
                            <button
                                onClick={handleSend}
                                className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-5 py-3 text-sm font-semibold"
                            >
                                {copy.send}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-3">
                            {!token ? (
                                <Link
                                    href={`/auth/login?redirect=/chat/${id}`}
                                    className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-5 py-3 text-sm font-semibold text-center"
                                >
                                    {copy.login}
                                </Link>
                            ) : (
                                <Link
                                    href="/offers"
                                    className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-5 py-3 text-sm font-semibold text-center"
                                >
                                    {copy.subscribe}
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
