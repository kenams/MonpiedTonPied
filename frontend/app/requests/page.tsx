'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiUrl } from '../lib/api';
import { getAuthToken } from '../lib/auth';
import { useLocale } from '../components/LocaleProvider';

export const dynamic = 'force-dynamic';

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
    const { locale } = useLocale();
    const copy =
        locale === 'fr'
            ? {
                  paid: 'Demande payee et envoyee au creator.',
                  canceled: 'Paiement annule. Demande non envoyee.',
                  actionDone: 'Action effectuee.',
                  uploadFailed: 'Upload impossible.',
                  deliveryRequired: 'Lien de livraison requis.',
                  deliverySaved: 'Livraison enregistree.',
                  eyebrow: 'Demandes custom',
                  title: 'Gerer les demandes',
                  subtitle:
                      'Les creators ont 48h pour accepter ou refuser. Contenu uniquement autour des pieds.',
                  empty: 'Aucune demande pour le moment.',
                  creator: 'Creator',
                  requester: 'Demandeur',
                  request: 'Demande',
                  price: 'Prix',
                  expires: 'Expire le',
                  delivery: 'Voir la livraison ->',
                  note: 'Note',
                  refund: 'Remboursement',
                  accept: 'Accepter',
                  decline: 'Refuser',
                  deliveryMessage: 'Message de livraison',
                  fileReady: 'Fichier pret',
                  uploading: 'Upload...',
                  deliver: 'Livrer',
              }
            : {
                  paid: 'Request paid and sent to creator.',
                  canceled: 'Payment canceled. Request not sent.',
                  actionDone: 'Action completed.',
                  uploadFailed: 'Upload failed.',
                  deliveryRequired: 'Delivery link is required.',
                  deliverySaved: 'Delivery recorded.',
                  eyebrow: 'Custom requests',
                  title: 'Manage requests',
                  subtitle:
                      'Creators have 48 hours to accept or decline. Feet-only content.',
                  empty: 'No requests right now.',
                  creator: 'Creator',
                  requester: 'Requester',
                  request: 'Request',
                  price: 'Price',
                  expires: 'Expires on',
                  delivery: 'View delivery ->',
                  note: 'Note',
                  refund: 'Refund',
                  accept: 'Accept',
                  decline: 'Decline',
                  deliveryMessage: 'Delivery message',
                  fileReady: 'File ready',
                  uploading: 'Uploading...',
                  deliver: 'Deliver',
              };
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [isCreator, setIsCreator] = useState(false);
    const [deliveryUrls, setDeliveryUrls] = useState<Record<string, string>>({});
    const [deliveryNotes, setDeliveryNotes] = useState<Record<string, string>>({});
    const [uploading, setUploading] = useState<Record<string, boolean>>({});

    const token = getAuthToken();

    const fetchRequests = useCallback(async () => {
        if (!token) return;
        const response = await fetch(apiUrl('/api/requests'), {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
            setRequests(data);
        }
    }, [token]);

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
    }, [fetchRequests, token]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const canceled = params.get('canceled');

        if (success === 'request') {
            setMessage(copy.paid);
            fetchRequests();
        } else if (canceled === 'request') {
            setMessage(copy.canceled);
        }
    }, [copy.canceled, copy.paid, fetchRequests]);

    const handleAction = async (id: string, action: 'accept' | 'decline') => {
        if (!token) return;
        setMessage(null);
        const response = await fetch(apiUrl(`/api/requests/${id}/${action}`), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setMessage(data.message || copy.actionDone);
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
            setMessage(data.message || copy.uploadFailed);
        }
        setUploading((prev) => ({ ...prev, [id]: false }));
    };

    const handleDeliver = async (id: string) => {
        if (!token) return;
        const deliveryUrl = deliveryUrls[id];
        if (!deliveryUrl) {
            setMessage(copy.deliveryRequired);
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
        setMessage(data.message || copy.deliverySaved);
        fetchRequests();
    };

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
                <div className="space-y-4">
                    <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                        {copy.eyebrow}
                    </p>
                    <h1 className="text-4xl font-semibold text-[#f4ede3]">{copy.title}</h1>
                    <p className="text-[#b7ad9c]">{copy.subtitle}</p>
                </div>

                {message && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {requests.length === 0 ? (
                        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-[#b7ad9c]">
                            {copy.empty}
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
                                            ? `${copy.creator}: ${req.creator.displayName}`
                                            : req.consumer?.displayName
                                              ? `${copy.requester}: ${req.consumer.displayName}`
                                              : copy.request}
                                    </p>
                                    <span className="text-xs rounded-full border border-[#3a2c1a] px-3 py-1 text-[#f0d8ac]">
                                        {req.status}
                                    </span>
                                </div>
                                <p className="text-[#f4ede3]">{req.prompt}</p>
                                <p className="text-sm text-[#b7ad9c]">
                                    {copy.price}: {req.price} EUR - {copy.expires}{' '}
                                    {new Date(req.expiresAt).toLocaleDateString()}
                                </p>
                                {req.deliveryUrl && (
                                    <a
                                        href={req.deliveryUrl}
                                        className="text-sm text-[#f0d8ac] font-semibold"
                                    >
                                        {copy.delivery}
                                    </a>
                                )}
                                {req.deliveryNote && (
                                    <p className="text-sm text-[#b7ad9c]">
                                        {copy.note}: {req.deliveryNote}
                                    </p>
                                )}
                                {req.refundStatus && req.refundStatus !== 'none' && (
                                    <p className="text-xs text-[#b7ad9c]">
                                        {copy.refund}: {req.refundStatus}
                                    </p>
                                )}
                                {isCreator && req.status === 'pending' && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAction(req.id, 'accept')}
                                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-4 py-2 text-sm font-semibold"
                                        >
                                            {copy.accept}
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'decline')}
                                            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-[#d6cbb8]"
                                        >
                                            {copy.decline}
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
                                            placeholder={copy.deliveryMessage}
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
                                                {copy.fileReady}: {deliveryUrls[req.id]}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => handleDeliver(req.id)}
                                            disabled={uploading[req.id]}
                                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-4 py-2 text-sm font-semibold"
                                        >
                                            {uploading[req.id] ? copy.uploading : copy.deliver}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
