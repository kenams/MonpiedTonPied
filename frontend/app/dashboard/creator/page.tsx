'use client';

import { useEffect, useState } from 'react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { apiUrl } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';
import { useLocale } from '../../components/LocaleProvider';

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
    const { locale } = useLocale();
    const copy =
        locale === 'fr'
            ? {
                  accessDenied: 'Acces refuse.',
                  loadError: 'Erreur de chargement.',
                  eyebrow: 'Dashboard creator',
                  title: 'Performance et revenus',
                  subtitle:
                      'Suis tes ventes, demandes custom et revenus nets. Commission plateforme 20%.',
                  loading: 'Chargement...',
                  content: 'Contenus',
                  grossSales: 'Ventes brutes',
                  creatorRevenue: 'Revenus creator',
                  platformFees: 'Commission plateforme',
                  requestStatus: 'Statut des demandes',
                  latestRequests: 'Dernieres demandes',
                  noRecent: 'Aucune demande recente.',
              }
            : {
                  accessDenied: 'Access denied.',
                  loadError: 'Loading error.',
                  eyebrow: 'Creator dashboard',
                  title: 'Performance and revenue',
                  subtitle:
                      'Track your sales, custom requests, and net revenue. Platform fee: 20%.',
                  loading: 'Loading...',
                  content: 'Content',
                  grossSales: 'Gross sales',
                  creatorRevenue: 'Creator revenue',
                  platformFees: 'Platform fee',
                  requestStatus: 'Request status',
                  latestRequests: 'Latest requests',
                  noRecent: 'No recent requests.',
              };
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
                    setError(json.message || copy.accessDenied);
                    return;
                }
                setData(json);
            })
            .catch(() => setError(copy.loadError));
    }, [copy.accessDenied, copy.loadError, token]);

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="space-y-4">
                    <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                        {copy.eyebrow}
                    </p>
                    <h1 className="text-4xl font-semibold text-[#f4ede3]">{copy.title}</h1>
                    <p className="text-[#b7ad9c]">{copy.subtitle}</p>
                </div>

                {error && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {error}
                    </div>
                )}

                {!data ? (
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-[#b7ad9c]">
                        {copy.loading}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: copy.content, value: data.contentCount },
                                { label: copy.grossSales, value: `${data.totalSales} EUR` },
                                {
                                    label: copy.creatorRevenue,
                                    value: `${data.totalCreatorRevenue} EUR`,
                                },
                                {
                                    label: copy.platformFees,
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
                                    {copy.requestStatus}
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
                                    {copy.latestRequests}
                                </h2>
                                {data.latestRequests.length === 0 ? (
                                    <p className="text-sm text-[#b7ad9c]">{copy.noRecent}</p>
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
