'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiUrl, API_BASE } from '../lib/api';
import { getAuthToken } from '../lib/auth';
import { getPushStatus, registerPush, unregisterPush } from '../lib/push';

type NotificationItem = {
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: string;
    readAt?: string | null;
};

export default function NotificationsPage() {
    const token = getAuthToken();
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [pushMessage, setPushMessage] = useState<string | null>(null);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushConfigured, setPushConfigured] = useState(false);
    const [pushBusy, setPushBusy] = useState(false);

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await fetch(apiUrl('/api/notifications'), {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Erreur.');
            }
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur.');
        }
    };

    const refreshPushStatus = async () => {
        if (!token) return;
        try {
            const result = await getPushStatus();
            setPushConfigured(Boolean(result.configured));
            setPushEnabled(Boolean(result.enabled));
            if (!result.ok && result.message) {
                setPushMessage(result.message);
            }
        } catch {
            setPushMessage('Statut push indisponible.');
        }
    };

    useEffect(() => {
        fetchNotifications();
        refreshPushStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!token) return;
        let socket: Socket | null = null;
        try {
            socket = io(API_BASE, {
                auth: { token },
                transports: ['websocket'],
            });
            socket.emit('join_notifications');
            socket.on('notification', (payload: NotificationItem & { user?: string }) => {
                setItems((prev) => [payload, ...prev]);
            });
        } catch {
            // ignore
        }
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [token]);

    const markAllRead = async () => {
        if (!token || items.length === 0) return;
        await fetch(apiUrl('/api/notifications/read'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ids: items.map((item) => item.id) }),
        });
        setItems((prev) => prev.map((item) => ({ ...item, readAt: new Date().toISOString() })));
    };

    const togglePush = async () => {
        setPushBusy(true);
        try {
            const result = pushEnabled ? await unregisterPush() : await registerPush();
            setPushMessage(result.message);
            setPushEnabled(Boolean(result.enabled));
            if (typeof result.configured === 'boolean') {
                setPushConfigured(result.configured);
            }
        } finally {
            setPushBusy(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Navigation />
            <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-semibold text-[#f4ede3]">Notifications</h1>
                    {items.length > 0 && (
                        <button
                            onClick={markAllRead}
                            className="rounded-full border border-[#3a2c1a] px-4 py-2 text-xs font-semibold text-[#f0d8ac]"
                        >
                            Tout marquer lu
                        </button>
                    )}
                </div>

                {pushMessage && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {pushMessage}
                    </div>
                )}

                {!token && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        Connecte-toi pour voir tes notifications.
                    </div>
                )}

                {error && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    {token && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-[#f4ede3]">
                                        Notifications navigateur
                                    </p>
                                    <p className="text-xs text-[#b7ad9c]">
                                        {pushConfigured
                                            ? pushEnabled
                                                ? 'Actives sur cet appareil.'
                                                : 'Desactivees sur cet appareil.'
                                            : 'Service push non configure sur le serveur.'}
                                    </p>
                                </div>
                                <button
                                    disabled={!pushConfigured || pushBusy}
                                    onClick={togglePush}
                                    className="rounded-full border border-[#3a2c1a] px-4 py-2 text-xs font-semibold text-[#f0d8ac] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {pushBusy ? 'Mise a jour...' : pushEnabled ? 'Desactiver' : 'Activer'}
                                </button>
                            </div>
                        </div>
                    )}

                    {items.length === 0 && token && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#b7ad9c]">
                            Aucune notification pour le moment.
                        </div>
                    )}

                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-2xl border border-white/10 bg-[#15131b] px-4 py-3"
                        >
                            <p className="font-semibold text-[#f4ede3]">{item.title}</p>
                            <p className="text-sm text-[#b7ad9c]">{item.message}</p>
                            <p className="text-xs text-[#6f675a]">
                                {new Date(item.createdAt).toLocaleString()}
                                {item.readAt ? ' - lu' : ''}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
}
