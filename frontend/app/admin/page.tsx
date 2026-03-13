'use client';

import { useEffect, useMemo, useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiUrl } from '../lib/api';
import { getAuthToken } from '../lib/auth';
import { useLocale } from '../components/LocaleProvider';

type AdminUser = {
    id: string;
    email: string;
    username: string;
    displayName?: string;
    role: string;
    subscriptionStatus?: string;
    passStatus?: string;
    premiumAccess?: boolean;
    isSuspended?: boolean;
    createdAt?: string;
};

type AdminSubscription = {
    id: string;
    user?: { id: string; email: string; username: string; displayName?: string };
    stripeSubscriptionId?: string;
    status?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    priceId?: string;
};

type AdminPayment = {
    id: string;
    user?: { id: string; email: string; username: string; displayName?: string };
    type: string;
    status: string;
    amount?: number;
    currency?: string;
    createdAt?: string;
};

type AdminAuditItem = {
    id: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
    createdAt?: string;
    admin?: { id: string; email: string; username: string; displayName?: string };
};

type AdminTab = 'users' | 'subscriptions' | 'payments' | 'audit';

const pageSize = 20;

const buildQueryString = (params: Record<string, string | number>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== '') {
            searchParams.set(key, String(value));
        }
    });
    return searchParams.toString();
};

export default function AdminPage() {
    const { locale } = useLocale();
    const copy =
        locale === 'fr'
            ? {
                  admin: 'Admin',
                  title: 'Console de moderation',
                  loginRequired: "Connecte-toi pour acceder a l'admin.",
                  accessDenied: 'Acces admin refuse.',
                  adminError: 'Erreur admin.',
                  loadError: 'Impossible de charger les donnees admin.',
                  actionError: 'Action impossible.',
                  suspendError: 'Impossible de modifier le statut.',
                  downloadError: 'Download impossible',
                  exportError: 'Export CSV impossible.',
                  page: 'page',
                  prev: 'Prev',
                  next: 'Next',
                  users: 'Utilisateurs',
                  subscriptions: 'Abonnements',
                  payments: 'Paiements',
                  audit: 'Audit trail',
                  exportCsv: 'Export CSV filtre',
                  userSearch: 'Recherche email, pseudo ou nom',
                  allRoles: 'Tous les roles',
                  premiumAll: 'Premium: tous',
                  premiumYes: 'Premium: oui',
                  premiumNo: 'Premium: non',
                  subscriptionsAll: 'Abonnement: tous',
                  passAll: 'Pass: tous',
                  emailAll: 'Email: tous',
                  emailVerified: 'Email: verifie',
                  emailUnverified: 'Email: non verifie',
                  suspensionAll: 'Suspension: tous',
                  suspended: 'Suspendu',
                  active: 'Actif',
                  subscriptionLabel: 'Abonnement',
                  passLabel: 'Pass',
                  reactivate: 'Re-activer',
                  suspend: 'Suspendre',
                  userFallback: 'Utilisateur',
                  status: 'Statut',
                  end: 'Fin',
                  na: 'n/a',
                  paymentSearch: 'Recherche session, intent ou facture',
                  allTypes: 'Type: tous',
                  allStatuses: 'Statut: tous',
                  auditSearch: 'Recherche action, cible ou id',
                  auditAction: 'Action exacte ex: user.suspend',
                  adminLabel: 'Admin',
                  unknown: 'Inconnu',
                  target: 'Cible',
                  usersCount: 'utilisateurs',
                  subscriptionsCount: 'abonnements',
                  paymentsCount: 'paiements',
                  logsCount: 'logs',
              }
            : {
                  admin: 'Admin',
                  title: 'Moderation console',
                  loginRequired: 'Sign in to access admin.',
                  accessDenied: 'Admin access denied.',
                  adminError: 'Admin error.',
                  loadError: 'Unable to load admin data.',
                  actionError: 'Action unavailable.',
                  suspendError: 'Unable to update status.',
                  downloadError: 'Download unavailable.',
                  exportError: 'CSV export unavailable.',
                  page: 'page',
                  prev: 'Prev',
                  next: 'Next',
                  users: 'Users',
                  subscriptions: 'Subscriptions',
                  payments: 'Payments',
                  audit: 'Audit trail',
                  exportCsv: 'Export filtered CSV',
                  userSearch: 'Search email, username, or name',
                  allRoles: 'All roles',
                  premiumAll: 'Premium: all',
                  premiumYes: 'Premium: yes',
                  premiumNo: 'Premium: no',
                  subscriptionsAll: 'Subscription: all',
                  passAll: 'Pass: all',
                  emailAll: 'Email: all',
                  emailVerified: 'Email: verified',
                  emailUnverified: 'Email: unverified',
                  suspensionAll: 'Suspension: all',
                  suspended: 'Suspended',
                  active: 'Active',
                  subscriptionLabel: 'Subscription',
                  passLabel: 'Pass',
                  reactivate: 'Reactivate',
                  suspend: 'Suspend',
                  userFallback: 'User',
                  status: 'Status',
                  end: 'End',
                  na: 'n/a',
                  paymentSearch: 'Search session, intent, or invoice',
                  allTypes: 'Type: all',
                  allStatuses: 'Status: all',
                  auditSearch: 'Search action, target, or id',
                  auditAction: 'Exact action e.g. user.suspend',
                  adminLabel: 'Admin',
                  unknown: 'Unknown',
                  target: 'Target',
                  usersCount: 'users',
                  subscriptionsCount: 'subscriptions',
                  paymentsCount: 'payments',
                  logsCount: 'logs',
              };
    const token = getAuthToken();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [usersTotal, setUsersTotal] = useState(0);
    const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
    const [subscriptionsTotal, setSubscriptionsTotal] = useState(0);
    const [payments, setPayments] = useState<AdminPayment[]>([]);
    const [paymentsTotal, setPaymentsTotal] = useState(0);
    const [auditLogs, setAuditLogs] = useState<AdminAuditItem[]>([]);
    const [auditTotal, setAuditTotal] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<AdminTab>('users');

    const [userQuery, setUserQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [subscriptionFilter, setSubscriptionFilter] = useState('');
    const [passFilter, setPassFilter] = useState('');
    const [premiumFilter, setPremiumFilter] = useState('');
    const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('');
    const [suspendedFilter, setSuspendedFilter] = useState('');

    const [paymentQuery, setPaymentQuery] = useState('');
    const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

    const [auditQuery, setAuditQuery] = useState('');
    const [auditActionFilter, setAuditActionFilter] = useState('');

    const [userPage, setUserPage] = useState(1);
    const [subPage, setSubPage] = useState(1);
    const [payPage, setPayPage] = useState(1);
    const [auditPage, setAuditPage] = useState(1);

    const headers = useMemo(
        () => (token ? { Authorization: `Bearer ${token}` } : undefined),
        [token]
    );

    const userQueryString = useMemo(
        () =>
            buildQueryString({
                limit: pageSize,
                page: userPage,
                q: userQuery,
                role: roleFilter,
                subscriptionStatus: subscriptionFilter,
                passStatus: passFilter,
                premiumAccess: premiumFilter,
                emailVerified: emailVerifiedFilter,
                suspended: suspendedFilter,
            }),
        [
            emailVerifiedFilter,
            passFilter,
            premiumFilter,
            roleFilter,
            subscriptionFilter,
            suspendedFilter,
            userPage,
            userQuery,
        ]
    );

    const paymentQueryString = useMemo(
        () =>
            buildQueryString({
                limit: pageSize,
                page: payPage,
                q: paymentQuery,
                type: paymentTypeFilter,
                status: paymentStatusFilter,
            }),
        [payPage, paymentQuery, paymentStatusFilter, paymentTypeFilter]
    );

    const auditQueryString = useMemo(
        () =>
            buildQueryString({
                limit: pageSize,
                page: auditPage,
                q: auditQuery,
                action: auditActionFilter,
            }),
        [auditActionFilter, auditPage, auditQuery]
    );

    useEffect(() => {
        if (!token) {
            setIsAdmin(false);
            return;
        }
        fetch(apiUrl('/api/users/me'), {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setIsAdmin(data.role === 'admin');
            })
            .catch(() => setIsAdmin(false));
    }, [token]);

    useEffect(() => {
        if (!headers || !isAdmin) return;
        setError(null);

        const fetchCurrentTab = async () => {
            try {
                if (activeTab === 'users') {
                    const response = await fetch(apiUrl(`/api/admin/users?${userQueryString}`), {
                        headers,
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.message || copy.adminError);
                    }
                    setUsers(Array.isArray(data.items) ? data.items : []);
                    setUsersTotal(Number(data.total || 0));
                    return;
                }

                if (activeTab === 'subscriptions') {
                    const response = await fetch(
                        apiUrl(`/api/admin/subscriptions?limit=${pageSize}&page=${subPage}`),
                        { headers }
                    );
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.message || copy.adminError);
                    }
                    setSubscriptions(Array.isArray(data.items) ? data.items : []);
                    setSubscriptionsTotal(Number(data.total || 0));
                    return;
                }

                if (activeTab === 'payments') {
                    const response = await fetch(
                        apiUrl(`/api/admin/payments?${paymentQueryString}`),
                        { headers }
                    );
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.message || copy.adminError);
                    }
                    setPayments(Array.isArray(data.items) ? data.items : []);
                    setPaymentsTotal(Number(data.total || 0));
                    return;
                }

                const response = await fetch(apiUrl(`/api/admin/audit-logs?${auditQueryString}`), {
                    headers,
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || copy.adminError);
                }
                setAuditLogs(Array.isArray(data.items) ? data.items : []);
                setAuditTotal(Number(data.total || 0));
            } catch (fetchError) {
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : copy.loadError
                );
            }
        };

        fetchCurrentTab();
    }, [
        activeTab,
        auditQueryString,
        copy.adminError,
        copy.loadError,
        headers,
        isAdmin,
        paymentQueryString,
        subPage,
        userQueryString,
    ]);

    const toggleSuspend = async (user: AdminUser) => {
        if (!token) return;
        try {
            const response = await fetch(apiUrl(`/api/admin/users/${user.id}/suspend`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ suspended: !user.isSuspended }),
            });
            if (!response.ok) {
                throw new Error(copy.actionError);
            }
            setUsers((prev) =>
                prev.map((item) =>
                    item.id === user.id ? { ...item, isSuspended: !user.isSuspended } : item
                )
            );
        } catch {
            setError(copy.suspendError);
        }
    };

    const downloadCsv = async (path: string, filename: string) => {
        if (!token) return;
        try {
            const response = await fetch(apiUrl(path), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error(copy.downloadError);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            setError(copy.exportError);
        }
    };

    const renderPager = (
        total: number,
        page: number,
        setPage: (value: number | ((prev: number) => number)) => void,
        label: string
    ) => (
        <div className="flex items-center justify-between text-xs text-[#b7ad9c]">
            <span>
                {total} {label} - {copy.page} {page}
            </span>
            <div className="flex gap-2">
                <button
                    onClick={() => setPage((prev) => Math.max(Number(prev) - 1, 1))}
                    className="rounded-full border border-white/10 px-3 py-1"
                >
                    {copy.prev}
                </button>
                <button
                    onClick={() =>
                        setPage((prev) =>
                            Number(prev) * pageSize < total ? Number(prev) + 1 : Number(prev)
                        )
                    }
                    className="rounded-full border border-white/10 px-3 py-1"
                >
                    {copy.next}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen">
            <Navigation />
            <div className="mx-auto max-w-6xl space-y-6 px-6 py-12">
                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.35em] text-[#d8c7a8]">{copy.admin}</p>
                    <h1 className="text-3xl font-semibold text-[#f4ede3]">{copy.title}</h1>
                </div>
                {!token && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {copy.loginRequired}
                    </div>
                )}
                {isAdmin === false && token && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {copy.accessDenied}
                    </div>
                )}
                {error && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {error}
                    </div>
                )}

                {isAdmin && (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-3">
                            {(['users', 'subscriptions', 'payments', 'audit'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                                        activeTab === tab
                                            ? 'border-[#c7a46a] text-[#f0d8ac]'
                                            : 'border-white/10 text-[#d6cbb8]'
                                    }`}
                                >
                                    {copy[tab]}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'users' && (
                            <div className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-6 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-[#f4ede3]">
                                        {copy.users}
                                    </h2>
                                    <button
                                        onClick={() =>
                                            downloadCsv(
                                                `/api/admin/users.csv?${userQueryString}`,
                                                'users.csv'
                                            )
                                        }
                                        className="rounded-full border border-[#3a2c1a] px-4 py-2 text-xs font-semibold text-[#f0d8ac]"
                                    >
                                        {copy.exportCsv}
                                    </button>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <input
                                            value={userQuery}
                                            onChange={(event) => {
                                                setUserQuery(event.target.value);
                                                setUserPage(1);
                                            }}
                                            placeholder={copy.userSearch}
                                            className="flex-1 rounded-xl border border-white/10 bg-[#101016] px-4 py-2 text-sm text-[#f4ede3]"
                                        />
                                        <select
                                            value={roleFilter}
                                            onChange={(event) => {
                                                setRoleFilter(event.target.value);
                                                setUserPage(1);
                                            }}
                                            className="rounded-xl border border-white/10 bg-[#101016] px-4 py-2 text-sm text-[#f4ede3]"
                                        >
                                            <option value="">{copy.allRoles}</option>
                                            <option value="consumer">consumer</option>
                                            <option value="creator">creator</option>
                                            <option value="admin">admin</option>
                                        </select>
                                        <select
                                            value={premiumFilter}
                                            onChange={(event) => {
                                                setPremiumFilter(event.target.value);
                                                setUserPage(1);
                                            }}
                                            className="rounded-xl border border-white/10 bg-[#101016] px-4 py-2 text-sm text-[#f4ede3]"
                                        >
                                            <option value="">{copy.premiumAll}</option>
                                            <option value="true">{copy.premiumYes}</option>
                                            <option value="false">{copy.premiumNo}</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <select
                                            value={subscriptionFilter}
                                            onChange={(event) => {
                                                setSubscriptionFilter(event.target.value);
                                                setUserPage(1);
                                            }}
                                            className="rounded-xl border border-white/10 bg-[#101016] px-4 py-2 text-sm text-[#f4ede3]"
                                        >
                                            <option value="">{copy.subscriptionsAll}</option>
                                            <option value="active">active</option>
                                            <option value="pending">pending</option>
                                            <option value="expired">expired</option>
                                            <option value="canceled">canceled</option>
                                            <option value="none">none</option>
                                            <option value="suspended">suspended</option>
                                        </select>
                                        <select
                                            value={passFilter}
                                            onChange={(event) => {
                                                setPassFilter(event.target.value);
                                                setUserPage(1);
                                            }}
                                            className="rounded-xl border border-white/10 bg-[#101016] px-4 py-2 text-sm text-[#f4ede3]"
                                        >
                                            <option value="">{copy.passAll}</option>
                                            <option value="active">active</option>
                                            <option value="expired">expired</option>
                                            <option value="none">none</option>
                                            <option value="suspended">suspended</option>
                                        </select>
                                        <select
                                            value={emailVerifiedFilter}
                                            onChange={(event) => {
                                                setEmailVerifiedFilter(event.target.value);
                                                setUserPage(1);
                                            }}
                                            className="rounded-xl border border-white/10 bg-[#101016] px-4 py-2 text-sm text-[#f4ede3]"
                                        >
                                            <option value="">{copy.emailAll}</option>
                                            <option value="true">{copy.emailVerified}</option>
                                            <option value="false">{copy.emailUnverified}</option>
                                        </select>
                                        <select
                                            value={suspendedFilter}
                                            onChange={(event) => {
                                                setSuspendedFilter(event.target.value);
                                                setUserPage(1);
                                            }}
                                            className="rounded-xl border border-white/10 bg-[#101016] px-4 py-2 text-sm text-[#f4ede3]"
                                        >
                                            <option value="">{copy.suspensionAll}</option>
                                            <option value="true">{copy.suspended}</option>
                                            <option value="false">{copy.active}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#15131b] p-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div>
                                                <p className="font-semibold text-[#f4ede3]">
                                                    {user.displayName || user.username}
                                                </p>
                                                <p className="text-xs text-[#b7ad9c]">
                                                    {user.email} - {user.role}
                                                </p>
                                                <p className="text-xs text-[#b7ad9c]">
                                                    {copy.subscriptionLabel}: {user.subscriptionStatus || 'none'} - {copy.passLabel}:{' '}
                                                    {user.passStatus || 'none'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => toggleSuspend(user)}
                                                className="rounded-full border border-[#3a2c1a] px-4 py-2 text-xs font-semibold text-[#f0d8ac]"
                                            >
                                                {user.isSuspended ? copy.reactivate : copy.suspend}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {renderPager(usersTotal, userPage, setUserPage, copy.usersCount)}
                            </div>
                        )}

                        {activeTab === 'subscriptions' && (
                            <div className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-6 shadow-lg">
                                <h2 className="text-xl font-semibold text-[#f4ede3]">
                                    {copy.subscriptions}
                                </h2>
                                <div className="space-y-3">
                                    {subscriptions.map((sub) => (
                                        <div
                                            key={sub.id}
                                            className="rounded-2xl border border-white/10 bg-[#15131b] p-4"
                                        >
                                            <p className="font-semibold text-[#f4ede3]">
                                                {sub.user?.displayName || sub.user?.email || copy.userFallback}
                                            </p>
                                            <p className="text-xs text-[#b7ad9c]">
                                                {copy.status}: {sub.status} - {copy.end}:{' '}
                                                {sub.currentPeriodEnd
                                                    ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                                                    : copy.na}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                {renderPager(
                                    subscriptionsTotal,
                                    subPage,
                                    setSubPage,
                                    copy.subscriptionsCount
                                )}
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-6 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-[#f4ede3]">
                                        {copy.payments}
                                    </h2>
                                    <button
                                        onClick={() =>
                                            downloadCsv(
                                                `/api/admin/payments.csv?${paymentQueryString}`,
                                                'payments.csv'
                                            )
                                        }
                                        className="rounded-full border border-[#3a2c1a] px-4 py-2 text-xs font-semibold text-[#f0d8ac]"
                                    >
                                        {copy.exportCsv}
                                    </button>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <input
                                        value={paymentQuery}
                                        onChange={(event) => {
                                            setPaymentQuery(event.target.value);
                                            setPayPage(1);
                                        }}
                                        placeholder={copy.paymentSearch}
                                        className="flex-1 rounded-xl border border-white/10 bg-[#101016] px-4 py-2 text-sm text-[#f4ede3]"
                                    />
                                    <select
                                        value={paymentTypeFilter}
                                        onChange={(event) => {
                                            setPaymentTypeFilter(event.target.value);
                                            setPayPage(1);
                                        }}
                                        className="rounded-xl border border-white/10 bg-[#101016] px-4 py-2 text-sm text-[#f4ede3]"
                                    >
                                        <option value="">{copy.allTypes}</option>
                                        <option value="subscription">subscription</option>
                                        <option value="pass">pass</option>
                                        <option value="content_purchase">content_purchase</option>
                                        <option value="request">request</option>
                                    </select>
                                    <select
                                        value={paymentStatusFilter}
                                        onChange={(event) => {
                                            setPaymentStatusFilter(event.target.value);
                                            setPayPage(1);
                                        }}
                                        className="rounded-xl border border-white/10 bg-[#101016] px-4 py-2 text-sm text-[#f4ede3]"
                                    >
                                        <option value="">{copy.allStatuses}</option>
                                        <option value="pending">pending</option>
                                        <option value="paid">paid</option>
                                        <option value="failed">failed</option>
                                        <option value="refunded">refunded</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    {payments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="rounded-2xl border border-white/10 bg-[#15131b] p-4"
                                        >
                                            <p className="font-semibold text-[#f4ede3]">
                                                {payment.user?.displayName || payment.user?.email || copy.userFallback}
                                            </p>
                                            <p className="text-xs text-[#b7ad9c]">
                                                {payment.type} - {payment.status} - {payment.amount}{' '}
                                                {payment.currency?.toUpperCase()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                {renderPager(paymentsTotal, payPage, setPayPage, copy.paymentsCount)}
                            </div>
                        )}

                        {activeTab === 'audit' && (
                            <div className="space-y-4 rounded-3xl border border-white/5 bg-white/5 p-6 shadow-lg">
                                <h2 className="text-xl font-semibold text-[#f4ede3]">
                                    {copy.audit}
                                </h2>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <input
                                        value={auditQuery}
                                        onChange={(event) => {
                                            setAuditQuery(event.target.value);
                                            setAuditPage(1);
                                        }}
                                        placeholder={copy.auditSearch}
                                        className="flex-1 rounded-xl border border-white/10 bg-[#101016] px-4 py-2 text-sm text-[#f4ede3]"
                                    />
                                    <input
                                        value={auditActionFilter}
                                        onChange={(event) => {
                                            setAuditActionFilter(event.target.value);
                                            setAuditPage(1);
                                        }}
                                        placeholder={copy.auditAction}
                                        className="rounded-xl border border-white/10 bg-[#101016] px-4 py-2 text-sm text-[#f4ede3]"
                                    />
                                </div>
                                <div className="space-y-3">
                                    {auditLogs.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="rounded-2xl border border-white/10 bg-[#15131b] p-4"
                                        >
                                            <p className="font-semibold text-[#f4ede3]">
                                                {entry.action}
                                            </p>
                                            <p className="text-xs text-[#b7ad9c]">
                                                {copy.adminLabel}:{' '}
                                                {entry.admin?.displayName ||
                                                    entry.admin?.email ||
                                                    copy.unknown}
                                            </p>
                                            <p className="text-xs text-[#b7ad9c]">
                                                {copy.target}: {entry.targetType || copy.na} -{' '}
                                                {entry.targetId || copy.na}
                                            </p>
                                            {entry.details && (
                                                <pre className="mt-2 overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-[#8f8778]">
                                                    {JSON.stringify(entry.details, null, 2)}
                                                </pre>
                                            )}
                                            <p className="mt-2 text-xs text-[#6f675a]">
                                                {entry.createdAt
                                                    ? new Date(entry.createdAt).toLocaleString()
                                                    : copy.na}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                {renderPager(auditTotal, auditPage, setAuditPage, copy.logsCount)}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
