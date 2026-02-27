'use client';

import { useEffect, useState } from 'react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { apiUrl } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';

type Message = {
    id: string;
    sender: string;
    text: string;
    createdAt: string;
};

export default function ChatPage({ params }: { params: { id: string } }) {
    const token = getAuthToken();
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchMessages = async () => {
        if (!token) return;
        const response = await fetch(apiUrl(`/api/chats/${params.id}/messages`), {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
            setMessages(data);
        } else {
            setError(data.message || 'Chat indisponible.');
        }
    };

    useEffect(() => {
        fetchMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    const handleSend = async () => {
        if (!token || !text.trim()) return;
        setError(null);
        const response = await fetch(apiUrl(`/api/chats/${params.id}/messages`), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ text }),
        });
        const data = await response.json();
        if (!response.ok) {
            setError(data.message || 'Message non envoye.');
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
                    <h1 className="text-2xl font-semibold text-[#f4ede3]">
                        Chat direct
                    </h1>
                    <p className="text-sm text-[#b7ad9c]">
                        Abonnement requis. Moderation active contre les propos abusifs.
                    </p>
                </div>

                {error && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {error}
                    </div>
                )}

                <div className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5 space-y-4">
                    <div className="space-y-3 max-h-[420px] overflow-auto">
                        {messages.length === 0 && (
                            <p className="text-sm text-[#b7ad9c]">
                                Aucun message pour le moment.
                            </p>
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

                    <div className="flex gap-3">
                        <input
                            value={text}
                            onChange={(event) => setText(event.target.value)}
                            className="flex-1 rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                            placeholder="Ecris un message..."
                        />
                        <button
                            onClick={handleSend}
                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-5 py-3 text-sm font-semibold"
                        >
                            Envoyer
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
