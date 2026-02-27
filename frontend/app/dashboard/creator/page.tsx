'use client';

import { useEffect, useState } from 'react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { apiUrl } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';

type DashboardData = {
    contentCount: number;
    totalSales: number;
    totalPlatformFees: number;
    totalCreatorRevenue: number;
    requestStats: Record<string, number>;
    latestRequests: Array<{
        id: string;
        status: string;
        price: number;
        createdAt: string;
    }>;
};

export default function CreatorDashboardPage() {
    const token = getAuthToken();
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        fetch(apiUrl('/api/dashboard/creator'), {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
            .then(({ ok, json }) => {
                if (!ok) {
                    setError(json.message || 'Acces refuse.');
                    return;
                }
                setData(json);
            })
            .catch(() => setError('Erreur de chargement.'));
    }, [token]);

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="space-y-4">
                    <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                        Dashboard creator
                    </p>
                    <h1 className="text-4xl font-semibold text-[#f4ede3]">
                        Performance et revenus
                    </h1>
                    <p className="text-[#b7ad9c]">
                        Suis tes ventes, demandes custom et revenus nets. Commission plateforme 20%.
                    </p>
                </div>

                {error && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {error}
                    </div>
                )}

                {!data ? (
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-[#b7ad9c]">
                        Chargement...
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Contenus', value: data.contentCount },
                                { label: 'Ventes brutes', value: `${data.totalSales} EUR` },
                                {
                                    label: 'Revenus creator',
                                    value: `${data.totalCreatorRevenue} EUR`,
                                },
                                {
                                    label: 'Commission plateforme',
                                    value: `${data.totalPlatformFees} EUR`,
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-2xl bg-white/5 p-6 shadow-lg border border-white/5"
                                >
                                    <p className="text-sm text-[#b7ad9c]">{item.label}</p>
                                    <p className="text-3xl font-semibold text-[#f4ede3]">
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5 space-y-3">
                                <h2 className="text-xl font-semibold text-[#f4ede3]">
                                    Statut des demandes
                                </h2>
                                <div className="grid grid-cols-2 gap-3 text-sm text-[#b7ad9c]">
                                    {Object.entries(data.requestStats || {}).map(
                                        ([key, value]) => (
                                            <div
                                                key={key}
                                                className="rounded-xl border border-white/10 px-3 py-2"
                                            >
                                                {key}: {value}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5 space-y-3">
                                <h2 className="text-xl font-semibold text-[#f4ede3]">
                                    Dernieres demandes
                                </h2>
                                {data.latestRequests.length === 0 ? (
                                    <p className="text-sm text-[#b7ad9c]">
                                        Aucune demande recente.
                                    </p>
                                ) : (
                                    <ul className="text-sm text-[#b7ad9c] space-y-2">
                                        {data.latestRequests.map((req) => (
                                            <li
                                                key={req.id}
                                                className="flex justify-between"
                                            >
                                                <span>{req.status}</span>
                                                <span>{req.price} EUR</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
}
