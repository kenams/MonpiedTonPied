'use client';
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiUrl } from '../lib/api';
import { clearAuthToken, getAuthToken } from '../lib/auth';
import { useLocale } from '../components/LocaleProvider';

export const dynamic = 'force-dynamic';

type UserProfile = {
    id: string;
    username: string;
    role: 'consumer' | 'creator' | 'admin';
    displayName: string;
    bio?: string;
    avatarUrl?: string;
    ageVerified: boolean;
    emailVerified?: boolean;
    accessPassActive?: boolean;
    subscriptionActive?: boolean;
    subscriptionStatus?: string;
    passStatus?: string;
    premiumAccess?: boolean;
    verifiedCreator?: boolean;
    isSuspended?: boolean;
    stripeConnectAccountId?: string | null;
    stripeConnectPayoutReady?: boolean;
};

export default function ProfilePage() {
    const { t, locale } = useLocale();
    const payoutCopy =
        locale === 'fr'
            ? {
                  title: 'Paiements createur',
                  body: 'Stripe Connect gere automatiquement les reversements sur les ventes et demandes custom.',
                  ready: 'Compte Stripe actif. Les reversements automatiques sont disponibles.',
                  pending: 'Configuration Stripe incomplete.',
                  setup: 'Configurer Stripe',
                  dashboard: 'Ouvrir Stripe',
                  updated: 'Configuration Stripe mise a jour.',
              }
            : {
                  title: 'Creator payouts',
                  body: 'Stripe Connect automatically handles payouts on sales and custom requests.',
                  ready: 'Stripe account active. Automatic payouts are available.',
                  pending: 'Stripe setup is incomplete.',
                  setup: 'Set up Stripe',
                  dashboard: 'Open Stripe',
                  updated: 'Stripe setup updated.',
              };

    const [token, setToken] = useState(() => getAuthToken());
    const [user, setUser] = useState<UserProfile | null>(null);
    const [formState, setFormState] = useState({
        displayName: '',
        bio: '',
        avatarUrl: '',
    });
    const [message, setMessage] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const loadProfile = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(apiUrl('/api/users/me'), {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) return;
            setUser(data);
            setFormState({
                displayName: data.displayName || '',
                bio: data.bio || '',
                avatarUrl: data.avatarUrl || '',
            });
        } catch {
            // ignore
        }
    }, [token]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const canceled = params.get('canceled');
        const stripeState = params.get('stripe');

        if (success === 'pass') {
            setMessage(t('profile.passActive'));
            loadProfile();
        } else if (success === 'subscription') {
            setMessage(t('profile.subscriptionActive'));
            loadProfile();
        } else if (stripeState === 'return' || stripeState === 'refresh') {
            setMessage(payoutCopy.updated);
            loadProfile();
        } else if (canceled === 'pass' || canceled === 'subscription') {
            setMessage(t('profile.paymentCanceled'));
        }
    }, [loadProfile, payoutCopy.updated, t]);

    const handleLogout = () => {
        clearAuthToken();
        setToken('');
        setUser(null);
    };

    const handleSave = async () => {
        if (!token) return;
        setMessage(null);
        const response = await fetch(apiUrl('/api/users/me'), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formState),
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || t('profile.saveError'));
            return;
        }
        setUser(data);
        setMessage(t('profile.profileUpdated'));
    };

    const handleAvatarUpload = async (file: File | null) => {
        if (!file || !token) return;
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(apiUrl('/api/uploads/avatar'), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || t('profile.uploadFailed'));
        } else {
            setFormState((prev) => ({ ...prev, avatarUrl: data.url }));
            setUser((prev) => (prev ? { ...prev, avatarUrl: data.url } : prev));
            setMessage(t('profile.avatarUpdated'));
        }
        setUploadingAvatar(false);
    };

    const handleManageSubscription = async () => {
        if (!token) return;
        setMessage(null);
        const response = await fetch(apiUrl('/api/stripe/portal'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                returnUrl: `${window.location.origin}/profile`,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || t('profile.stripeUnavailable'));
            return;
        }
        if (data.url) {
            window.location.href = data.url;
        }
    };

    const handleStripeOnboarding = async () => {
        if (!token) return;
        setMessage(null);
        const response = await fetch(apiUrl('/api/stripe/connect/onboarding'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                returnUrl: `${window.location.origin}/profile?stripe=return`,
                refreshUrl: `${window.location.origin}/profile?stripe=refresh`,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || t('profile.stripeUnavailable'));
            return;
        }
        if (data.url) {
            window.location.href = data.url;
        }
    };

    const handleStripeDashboard = async () => {
        if (!token) return;
        setMessage(null);
        const response = await fetch(apiUrl('/api/stripe/connect/dashboard-link'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await response.json();
        if (!response.ok) {
            setMessage(data.message || t('profile.stripeUnavailable'));
            return;
        }
        if (data.url) {
            window.location.href = data.url;
        }
    };

    const planLabel =
        user?.subscriptionStatus === 'active'
            ? t('profile.activeSubscription')
            : user?.passStatus === 'active'
              ? t('profile.activePass')
              : user?.subscriptionStatus === 'pending'
                ? t('profile.pendingSubscription')
                : user?.subscriptionStatus === 'expired'
                  ? t('profile.expiredSubscription')
                  : user?.subscriptionStatus === 'canceled'
                    ? t('profile.canceledSubscription')
                    : user?.subscriptionStatus === 'suspended'
                      ? t('profile.suspendedAccount')
                      : t('profile.noActivePlan');

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="glass rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                    <div className="space-y-3">
                        <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                            {t('profile.memberArea')}
                        </p>
                        <h1 className="text-4xl font-semibold text-[#f4ede3]">
                            {user ? user.displayName : t('profile.personalProfile')}
                        </h1>
                        <p className="text-[#b7ad9c] max-w-xl">
                            {user?.role === 'creator'
                                ? t('profile.creatorIntro')
                                : t('profile.consumerIntro')}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {user?.role === 'creator' && (
                            <Link
                                href="/create"
                                className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 font-semibold text-sm"
                            >
                                {t('profile.publish')}
                            </Link>
                        )}
                        {user?.role === 'creator' && (
                            <Link
                                href="/dashboard/creator"
                                className="rounded-full border border-white/15 px-6 py-3 font-semibold text-sm text-[#d6cbb8]"
                            >
                                {t('profile.dashboard')}
                            </Link>
                        )}
                        {token ? (
                            <button
                                onClick={handleLogout}
                                className="rounded-full border border-white/15 px-6 py-3 font-semibold text-sm text-[#d6cbb8]"
                            >
                                {t('profile.logout')}
                            </button>
                        ) : (
                            <Link
                                href="/auth/login"
                                className="rounded-full border border-white/15 px-6 py-3 font-semibold text-sm text-[#d6cbb8]"
                            >
                                {t('profile.login')}
                            </Link>
                        )}
                    </div>
                </div>

                {!token && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-[#f0d8ac]">
                        {t('profile.notLogged')}{' '}
                        <Link href="/auth/login" className="font-semibold underline">
                            {t('profile.loginPrompt')}
                        </Link>{' '}
                        {t('profile.accessProfile')}
                    </div>
                )}

                {user && (
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
                        <div className="rounded-3xl bg-white/5 p-8 shadow-lg space-y-5 border border-white/5">
                            <h2 className="text-2xl font-semibold text-[#f4ede3]">
                                {t('profile.publicInfo')}
                            </h2>
                            {message && (
                                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                                    {message}
                                </div>
                            )}
                            <label className="block space-y-2">
                                <span className="text-sm text-[#b7ad9c]">{t('profile.username')}</span>
                                <input
                                    value={formState.displayName}
                                    onChange={(event) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            displayName: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                />
                            </label>
                            <div className="space-y-3">
                                <span className="text-sm text-[#b7ad9c]">{t('profile.avatar')}</span>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-2xl bg-[#15131b] overflow-hidden border border-white/10">
                                        {formState.avatarUrl ? (
                                            <img
                                                src={formState.avatarUrl}
                                                alt="Avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : null}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) =>
                                            handleAvatarUpload(event.target.files?.[0] || null)
                                        }
                                        className="flex-1 rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                    />
                                </div>
                                <input
                                    value={formState.avatarUrl}
                                    onChange={(event) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            avatarUrl: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                    placeholder={t('profile.pasteUrl')}
                                />
                                {uploadingAvatar && (
                                    <p className="text-xs text-[#b7ad9c]">{t('profile.uploading')}</p>
                                )}
                            </div>
                            <label className="block space-y-2">
                                <span className="text-sm text-[#b7ad9c]">{t('profile.bio')}</span>
                                <textarea
                                    value={formState.bio}
                                    onChange={(event) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            bio: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                    rows={4}
                                />
                            </label>
                            <button
                                onClick={handleSave}
                                className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-2 text-sm font-semibold"
                            >
                                {t('profile.save')}
                            </button>
                        </div>

                        <div className="rounded-3xl bg-white/5 p-8 shadow-lg space-y-4 border border-white/5">
                            <h3 className="text-lg font-semibold text-[#f4ede3]">
                                {t('profile.status')}
                            </h3>
                            <div className="space-y-2 text-sm text-[#b7ad9c]">
                                <p>{t('profile.ageVerified')}: {user.ageVerified ? t('profile.yes') : t('profile.no')}</p>
                                <p>{t('profile.emailVerified')}: {user.emailVerified ? t('profile.yes') : t('profile.no')}</p>
                                <p>{t('profile.plan')}: {planLabel}</p>
                                <p>{t('profile.role')}: {user.role}</p>
                                {user.role === 'creator' && (
                                    <p>{t('profile.creatorVerified')}: {user.verifiedCreator ? t('profile.yes') : t('profile.no')}</p>
                                )}
                            </div>
                            {user.role === 'creator' && (
                                <div className="rounded-2xl border border-[#3a2c1a] bg-[#1a1510] px-4 py-4 space-y-3">
                                    <div>
                                        <h4 className="text-sm font-semibold text-[#f4ede3]">
                                            {payoutCopy.title}
                                        </h4>
                                        <p className="mt-1 text-sm text-[#b7ad9c]">
                                            {payoutCopy.body}
                                        </p>
                                    </div>
                                    <p className="text-sm text-[#f0d8ac]">
                                        {user.stripeConnectPayoutReady
                                            ? payoutCopy.ready
                                            : payoutCopy.pending}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={handleStripeOnboarding}
                                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] px-4 py-2 text-sm font-semibold text-[#0b0a0f]"
                                        >
                                            {payoutCopy.setup}
                                        </button>
                                        {user.stripeConnectAccountId && (
                                            <button
                                                onClick={handleStripeDashboard}
                                                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-[#d6cbb8]"
                                            >
                                                {payoutCopy.dashboard}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            {!user.emailVerified && (
                                <Link
                                    href="/auth/verify"
                                    className="inline-flex text-sm font-semibold text-[#f0d8ac]"
                                >
                                    {t('profile.verifyEmail')}
                                </Link>
                            )}
                            {user.isSuspended && (
                                <p className="text-sm text-[#f0d8ac]">
                                    {t('profile.temporarilySuspended')}
                                </p>
                            )}
                            {user.subscriptionStatus === 'active' && (
                                <button
                                    onClick={handleManageSubscription}
                                    className="rounded-full border border-[#3a2c1a] px-5 py-2 text-sm font-semibold text-[#f0d8ac] mt-2"
                                >
                                    {t('profile.manageSubscription')}
                                </button>
                            )}
                            {user.role === 'creator' ? (
                                <Link
                                    href="/requests"
                                    className="inline-flex text-sm font-semibold text-[#f0d8ac]"
                                >
                                    {t('profile.viewCustomRequests')}
                                </Link>
                            ) : (
                                <Link
                                    href="/offers"
                                    className="inline-flex text-sm font-semibold text-[#f0d8ac]"
                                >
                                    {t('profile.viewOffers')}
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
