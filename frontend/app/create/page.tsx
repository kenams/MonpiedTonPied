'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { apiUrl } from '../lib/api';
import { getAuthToken } from '../lib/auth';
import { useLocale } from '../components/LocaleProvider';

type UploadResult = {
    url: string;
    type: 'image' | 'video';
};

type CreatorPayoutState = {
    accountId: string | null;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    payoutReady: boolean;
};

export default function CreatePage() {
    const { locale } = useLocale();
    const copy =
        locale === 'fr'
            ? {
                  guidelines: [
                      'Format recommande: JPG, PNG ou MP4.',
                      '1 photo ou 10s de video gratuits par createur, le reste est floute.',
                      'Serie courte, propre, et lumiere soignee.',
                      'Age requis: 18+ et verification obligatoire.',
                  ],
                  uploadError: 'Upload error.',
                  loginFirst: 'Connecte-toi avant de publier.',
                  titleRequired: 'Le titre est requis.',
                  priceNumber: 'Le prix doit etre un nombre.',
                  stripeSetupRequired:
                      'Complete ton onboarding Stripe avant de publier du contenu payant.',
                  stripeStatusTitle: 'Paiements createur',
                  stripeStatusBody:
                      'Pour automatiser les ventes et reversements, termine le setup Stripe Connect.',
                  stripeReady: 'Compte Stripe actif. Les ventes sont reversees automatiquement.',
                  stripePending: 'Setup Stripe en attente.',
                  stripeAction: 'Configurer Stripe',
                  stripeDashboard: 'Ouvrir Stripe',
                  publishError: 'Erreur lors de la publication.',
                  success: 'Contenu publie.',
                  genericError: 'Erreur.',
                  eyebrow: 'Studio creator',
                  title: 'Publie ta prochaine serie.',
                  subtitle:
                      'Charge tes photos ou videos, fixe un prix et partage ton univers. Les contenus sont vendus a la piece ou via abonnement.',
                  seeProfile: 'Voir mon profil',
                  explore: 'Explorer le feed',
                  loginToPublish: 'Connecte-toi pour publier un contenu.',
                  login: 'Se connecter',
                  or: 'ou',
                  createAccount: 'creer un compte',
                  consumerWarning: 'Ce compte est un profil consommateur.',
                  createCreator: 'Cree un compte creator',
                  createCreatorSuffix: 'pour publier du contenu.',
                  titleLabel: 'Titre',
                  titlePlaceholder: 'Ex: Studio rose - Serie 01',
                  descriptionLabel: 'Description',
                  descriptionPlaceholder:
                      "Ajoute quelques mots sur l'ambiance, la lumiere, le set...",
                  priceLabel: 'Prix (EUR)',
                  fileLabel: 'Fichier',
                  publishing: 'Publication...',
                  publish: 'Publier',
                  commission:
                      'Commission plateforme: 20%. Reversement automatique via Stripe Connect.',
                  publishingTips: 'Conseils de publication',
                  proTip:
                      "Pro tip: propose un prix d'appel pour attirer de nouveaux fans.",
                  requestInfo:
                      'Demandes specifiques: reponse en 48h, contenu uniquement autour des pieds.',
              }
            : {
                  guidelines: [
                      'Recommended format: JPG, PNG, or MP4.',
                      '1 free photo or 10 seconds of video per creator, the rest stays blurred.',
                      'Keep it short, clean, and well lit.',
                      'Required age: 18+ with mandatory verification.',
                  ],
                  uploadError: 'Upload error.',
                  loginFirst: 'Log in before publishing.',
                  titleRequired: 'Title is required.',
                  priceNumber: 'Price must be numeric.',
                  stripeSetupRequired:
                      'Complete Stripe onboarding before publishing paid content.',
                  stripeStatusTitle: 'Creator payouts',
                  stripeStatusBody:
                      'To automate sales and payouts, complete your Stripe Connect setup.',
                  stripeReady: 'Stripe account active. Sales are split automatically.',
                  stripePending: 'Stripe setup pending.',
                  stripeAction: 'Set up Stripe',
                  stripeDashboard: 'Open Stripe',
                  publishError: 'Publishing failed.',
                  success: 'Content published.',
                  genericError: 'Error.',
                  eyebrow: 'Creator studio',
                  title: 'Publish your next series.',
                  subtitle:
                      'Upload your photos or videos, set a price, and share your world. Content is sold individually or through subscription.',
                  seeProfile: 'View my profile',
                  explore: 'Explore the feed',
                  loginToPublish: 'Log in to publish content.',
                  login: 'Log in',
                  or: 'or',
                  createAccount: 'create an account',
                  consumerWarning: 'This account is a consumer profile.',
                  createCreator: 'Create a creator account',
                  createCreatorSuffix: 'to publish content.',
                  titleLabel: 'Title',
                  titlePlaceholder: 'Ex: Pink studio - Series 01',
                  descriptionLabel: 'Description',
                  descriptionPlaceholder: 'Add a few words about mood, light, and setup...',
                  priceLabel: 'Price (EUR)',
                  fileLabel: 'File',
                  publishing: 'Publishing...',
                  publish: 'Publish',
                  commission:
                      'Platform fee: 20%. Automatic payout through Stripe Connect.',
                  publishingTips: 'Publishing tips',
                  proTip:
                      'Pro tip: use an entry price to attract new fans.',
                  requestInfo:
                      'Specific requests: reply within 48h, feet-only content.',
              };
    const [token, setToken] = useState('');
    const [isCreator, setIsCreator] = useState(false);
    const [payoutState, setPayoutState] = useState<CreatorPayoutState | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const stored = getAuthToken();
        setToken(stored);
        if (stored) {
            fetch(apiUrl('/api/users/me'), {
                headers: { Authorization: `Bearer ${stored}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    setIsCreator(data.role === 'creator' || data.role === 'admin');
                    if (
                        data.role === 'creator' ||
                        data.role === 'admin'
                    ) {
                        setPayoutState({
                            accountId: data.stripeConnectAccountId || null,
                            detailsSubmitted: Boolean(data.stripeConnectDetailsSubmitted),
                            chargesEnabled: Boolean(data.stripeConnectChargesEnabled),
                            payoutsEnabled: Boolean(data.stripeConnectPayoutsEnabled),
                            payoutReady: Boolean(data.stripeConnectPayoutReady),
                        });
                    }
                })
                .catch(() => {});
        }
    }, []);

    const refreshPayoutState = useCallback(async (authToken: string) => {
        const response = await fetch(apiUrl('/api/stripe/connect/status'), {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || copy.genericError);
        }
        setPayoutState(data);
    }, [copy.genericError]);

    const handleStripeOnboarding = async () => {
        if (!token) return;
        setFormError(null);
        const response = await fetch(apiUrl('/api/stripe/connect/onboarding'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                returnUrl: `${window.location.origin}/create?stripe=return`,
                refreshUrl: `${window.location.origin}/create?stripe=refresh`,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            setFormError(data.message || copy.genericError);
            return;
        }
        if (data.url) {
            window.location.href = data.url;
        }
    };

    const handleStripeDashboard = async () => {
        if (!token) return;
        setFormError(null);
        const response = await fetch(apiUrl('/api/stripe/connect/dashboard-link'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await response.json();
        if (!response.ok) {
            setFormError(data.message || copy.genericError);
            return;
        }
        if (data.url) {
            window.location.href = data.url;
        }
    };

    useEffect(() => {
        if (!token || !isCreator) return;
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const stripeState = params.get('stripe');
        if (stripeState === 'return' || stripeState === 'refresh') {
            refreshPayoutState(token).catch(() => {});
        }
    }, [token, isCreator, refreshPayoutState]);

    const uploadFile = async (): Promise<UploadResult | null> => {
        if (!file) {
            return null;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(apiUrl('/api/uploads'), {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || copy.uploadError);
        }

        return data as UploadResult;
    };

    const handleSubmit = async () => {
        setFormError(null);
        setFormSuccess(null);
        setSubmitting(true);

        try {
            if (!token) {
                throw new Error(copy.loginFirst);
            }

            if (!title.trim()) {
                throw new Error(copy.titleRequired);
            }

            if (price.trim() && !Number.isFinite(Number(price))) {
                throw new Error(copy.priceNumber);
            }

            if (Number(price || 0) > 0 && isCreator && !payoutState?.payoutReady) {
                throw new Error(copy.stripeSetupRequired);
            }

            const uploaded = await uploadFile();
            const priceValue = price.trim() ? Number(price) : undefined;

            const response = await fetch(apiUrl('/api/content'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    files: uploaded
                        ? [
                              {
                                  url: uploaded.url,
                                  type: uploaded.type,
                                  thumbnail: uploaded.url,
                                  price: Number.isFinite(priceValue) ? priceValue : undefined,
                              },
                          ]
                        : [],
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || copy.publishError);
            }

            setFormSuccess(copy.success);
            setTitle('');
            setDescription('');
            setPrice('');
            setFile(null);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : copy.genericError);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="glass rounded-3xl p-8 flex flex-col lg:flex-row lg:items-center gap-8">
                    <div className="space-y-3">
                        <p className="uppercase tracking-[0.35em] text-xs text-[#d8c7a8]">
                            {copy.eyebrow}
                        </p>
                        <h1 className="text-4xl font-semibold text-[#f4ede3]">
                            {copy.title}
                        </h1>
                        <p className="text-[#b7ad9c] max-w-xl">{copy.subtitle}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/profile"
                            className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-[#d6cbb8]"
                        >
                            {copy.seeProfile}
                        </Link>
                        <Link
                            href="/browse"
                            className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-6 py-3 text-sm font-semibold"
                        >
                            {copy.explore}
                        </Link>
                    </div>
                </div>

                {!token && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-[#f0d8ac]">
                        {copy.loginToPublish}{' '}
                        <Link href="/auth/login" className="font-semibold underline">
                            {copy.login}
                        </Link>{' '}
                        {copy.or}{' '}
                        <Link href="/auth/register" className="font-semibold underline">
                            {copy.createAccount}
                        </Link>
                        .
                    </div>
                )}
                {token && !isCreator && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-[#f0d8ac]">
                        {copy.consumerWarning}{' '}
                        <Link href="/auth/register/creator" className="font-semibold underline">
                            {copy.createCreator}
                        </Link>{' '}
                        {copy.createCreatorSuffix}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
                    <div className="rounded-3xl bg-white/5 p-8 shadow-lg space-y-5 border border-white/5">
                        {isCreator && (
                            <div className="rounded-2xl border border-[#3a2c1a] bg-[#1a1510] px-5 py-5 space-y-4">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-semibold text-[#f4ede3]">
                                        {copy.stripeStatusTitle}
                                    </h2>
                                    <p className="text-sm text-[#b7ad9c]">
                                        {copy.stripeStatusBody}
                                    </p>
                                </div>
                                <p className="text-sm text-[#f0d8ac]">
                                    {payoutState?.payoutReady
                                        ? copy.stripeReady
                                        : copy.stripePending}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={handleStripeOnboarding}
                                        className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-5 py-2 text-sm font-semibold"
                                    >
                                        {copy.stripeAction}
                                    </button>
                                    {payoutState?.accountId && (
                                        <button
                                            type="button"
                                            onClick={handleStripeDashboard}
                                            className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-[#d6cbb8]"
                                        >
                                            {copy.stripeDashboard}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        {formError && (
                            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                                {formError}
                            </div>
                        )}
                        {formSuccess && (
                            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-emerald-200">
                                {formSuccess}
                            </div>
                        )}

                        <label className="block space-y-2">
                            <span className="text-sm text-[#b7ad9c]">{copy.titleLabel}</span>
                            <input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder={copy.titlePlaceholder}
                                className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a]"
                            />
                        </label>

                        <label className="block space-y-2">
                            <span className="text-sm text-[#b7ad9c]">{copy.descriptionLabel}</span>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder={copy.descriptionPlaceholder}
                                className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a]"
                                rows={5}
                            />
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="block space-y-2">
                                <span className="text-sm text-[#b7ad9c]">{copy.priceLabel}</span>
                                <input
                                    value={price}
                                    onChange={(event) => setPrice(event.target.value)}
                                    placeholder="14.00"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3] placeholder:text-[#6f675a]"
                                />
                            </label>
                            <label className="block space-y-2">
                                <span className="text-sm text-[#b7ad9c]">{copy.fileLabel}</span>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                                    className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                />
                            </label>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !token || !isCreator}
                            className="w-full rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] py-3 font-semibold shadow-lg disabled:opacity-60"
                        >
                            {submitting ? copy.publishing : copy.publish}
                        </button>

                        <p className="text-xs text-[#b7ad9c]">{copy.commission}</p>
                    </div>

                    <div className="rounded-3xl bg-white/5 p-8 shadow-lg space-y-6 border border-white/5">
                        <div>
                            <h2 className="text-xl font-semibold text-[#f4ede3]">
                                {copy.publishingTips}
                            </h2>
                            <ul className="text-sm text-[#b7ad9c] space-y-3 mt-4">
                                {copy.guidelines.map((item) => (
                                    <li key={item} className="flex items-start gap-2">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-[#c7a46a]" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-2xl bg-[#1a1510] px-4 py-4 text-sm text-[#f0d8ac] border border-[#3a2c1a]">
                            {copy.proTip}
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-[#b7ad9c]">
                            {copy.requestInfo}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
