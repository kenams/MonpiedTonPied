'use client';

import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import { apiUrl } from '../lib/api';
import { getAuthToken } from '../lib/auth';

type RequestItem = {
    id: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired' | 'delivered' | 'refunded';
    prompt: string;
    price: number;
    expiresAt: string;
    deliveryUrl?: string;
    deliveryNote?: string;
    refundStatus?: string;
    consumer?: { id: string; displayName: string };
    creator?: { id: string; displayName: string };
};

export default function RequestsPage() {
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [isCreator, setIsCreator] = useState(false);
    const [deliveryUrls, setDeliveryUrls] = useState<Record<string, string>>({});
    const [deliveryNotes, setDeliveryNotes] = useState<Record<string, string>>({});
    const [uploading, setUploading] = useState<Record<string, boolean>>({});

    const token = getAuthToken();

    const fetchRequests = async () => {
        if (!token) return;
        const response = await fetch(apiUrl('/api/requests'), {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
            setRequests(data);
        }
    };

    useEffect(() => {
        fetchRequests();
        if (token) {
            fetch(apiUrl('/api/users/me'), {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => setIsCreator(data.role === 'creator'))
                .catch(() => {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAction = async (id: string, action: 'accept' | 'decline') => {
        if (!token) return;
        setMessage(null);
        const response = await fetch(apiUrl(`/api/requests/${id}/${action}`), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setMessage(data.message || 'Action effectuée.');
        fetchRequests();
    };

    const handleUpload = async (id: string, file: File | null) => {
        if (!file || !token) return;
        setUploading((prev) => ({ ...prev, [id]: true }));
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(apiUrl('/api/uploads'), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        const data = await response.json();
        if (response.ok && data.url) {
            setDeliveryUrls((prev) => ({ ...prev, [id]: data.url }));
        } else {
            setMessage(data.message || 'Upload impossible.');
        }
        setUploading((prev) => ({ ...prev, [id]: false }));
    };

    const handleDeliver = async (id: string) => {
        if (!token) return;
        const deliveryUrl = deliveryUrls[id];
        if (!deliveryUrl) {
            setMessage('Lien de livraison requis.');
            return;
        }
        const response = await fetch(apiUrl(`/api/requests/${id}/deliver`), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                deliveryUrl,
                deliveryNote: deliveryNotes[id] || '',
            }),
        });
        const data = await response.json();
        setMessage(data.message || 'Livraison enregistrée.');
        fetchRequests();
    };

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
                <div className="space-y-4">
                    <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                        Demandes custom
                    </p>
                    <h1 className="text-4xl font-semibold text-[#f4ede3]">
                        Gérer les demandes
                    </h1>
                    <p className="text-[#b7ad9c]">
                        Les créateurs ont 48h pour accepter ou refuser.
                    </p>
                </div>

                {message && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {requests.length === 0 ? (
                        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-[#b7ad9c]">
                            Aucune demande pour le moment.
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div
                                key={req.id}
                                className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-[#b7ad9c]">
                                        {req.creator?.displayName
                                            ? `Créateur: ${req.creator.displayName}`
                                            : req.consumer?.displayName
                                            ? `Demandeur: ${req.consumer.displayName}`
                                            : 'Demande'}
                                    </p>
                                    <span className="text-xs rounded-full border border-[#3a2c1a] px-3 py-1 text-[#f0d8ac]">
                                        {req.status}
                                    </span>
                                </div>
                                <p className="text-[#f4ede3]">{req.prompt}</p>
                                <p className="text-sm text-[#b7ad9c]">
                                    Prix: {req.price}€ · Expire le{' '}
                                    {new Date(req.expiresAt).toLocaleDateString()}
                                </p>
                                {req.deliveryUrl && (
                                    <a
                                        href={req.deliveryUrl}
                                        className="text-sm text-[#f0d8ac] font-semibold"
                                    >
                                        Voir la livraison →
                                    </a>
                                )}
                                {req.deliveryNote && (
                                    <p className="text-sm text-[#b7ad9c]">
                                        Note: {req.deliveryNote}
                                    </p>
                                )}
                                {req.refundStatus && req.refundStatus !== 'none' && (
                                    <p className="text-xs text-[#b7ad9c]">
                                        Remboursement: {req.refundStatus}
                                    </p>
                                )}
                                {isCreator && req.status === 'pending' && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAction(req.id, 'accept')}
                                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-4 py-2 text-sm font-semibold"
                                        >
                                            Accepter
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'decline')}
                                            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-[#d6cbb8]"
                                        >
                                            Refuser
                                        </button>
                                    </div>
                                )}
                                {isCreator && req.status === 'accepted' && (
                                    <div className="space-y-3">
                                        <textarea
                                            value={deliveryNotes[req.id] || ''}
                                            onChange={(event) =>
                                                setDeliveryNotes((prev) => ({
                                                    ...prev,
                                                    [req.id]: event.target.value,
                                                }))
                                            }
                                            className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                            rows={3}
                                            placeholder="Message de livraison"
                                        />
                                        <input
                                            type="file"
                                            onChange={(event) =>
                                                handleUpload(
                                                    req.id,
                                                    event.target.files?.[0] || null
                                                )
                                            }
                                            className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                        />
                                        {deliveryUrls[req.id] && (
                                            <p className="text-xs text-[#b7ad9c]">
                                                Fichier prêt: {deliveryUrls[req.id]}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => handleDeliver(req.id)}
                                            disabled={uploading[req.id]}
                                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-4 py-2 text-sm font-semibold"
                                        >
                                            {uploading[req.id] ? 'Upload…' : 'Livrer'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
