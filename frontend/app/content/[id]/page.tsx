'use client';
/* eslint-disable @next/next/no-img-element */

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { apiUrl } from '../../lib/api';
import { getAuthToken } from '../../lib/auth';
import { resolveMediaUrl } from '../../lib/media';
import WatermarkOverlay from '../../components/WatermarkOverlay';
import { useLocale } from '../../components/LocaleProvider';

export const dynamic = 'force-dynamic';

type ContentFile = {
    url: string;
    type: string;
    thumbnail?: string;
    price?: number;
    isLocked?: boolean;
};

type ContentDetail = {
    _id: string;
    title: string;
    description: string;
    creator: { id?: string; username: string; displayName?: string };
    files: ContentFile[];
    canAccess: boolean;
    isPreview?: boolean;
};

const PREVIEW_SECONDS = 10;

export default function ContentPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { locale } = useLocale();
    const copy =
        locale === 'fr'
            ? {
                  notFound: 'Contenu introuvable.',
                  genericError: 'Erreur.',
                  paymentConfirmed: 'Paiement confirme. Acces debloque.',
                  paymentCanceled: 'Paiement annule. Contenu toujours verrouille.',
                  creatorMissing: 'Creator introuvable.',
                  loginForChat: 'Connecte-toi pour acceder au chat.',
                  subRequired: 'Abonnement requis pour le chat.',
                  chatUnavailable: 'Chat indisponible.',
                  loginForReport: 'Connecte-toi pour signaler.',
                  reasonRequired: 'Raison requise.',
                  reportFailed: 'Signalement impossible.',
                  reportSent: 'Signalement envoye.',
                  loginBeforePay: 'Connecte-toi avant de payer.',
                  paymentError: 'Erreur de paiement.',
                  paymentSimulated: 'Paiement simule.',
                  eyebrow: 'Collection',
                  by: 'Par',
                  access: 'Acces',
                  unlocked: 'Debloque',
                  locked: 'Verrouille',
                  backToFeed: 'Retour au feed ->',
                  previewUnavailable: 'Preview indisponible',
                  preview10: `Apercu ${PREVIEW_SECONDS}s`,
                  unlockToView: 'Debloquer pour voir',
                  freePreview: 'Preview gratuite',
                  accessible: 'Accessible',
                  noFiles: 'Aucun fichier associe.',
                  moderation: 'Moderation',
                  report: 'Signaler',
                  reportReason: 'Raison (ex: contenu inapproprie)',
                  reportDetails: 'Details',
                  send: 'Envoyer',
                  unlockAccess: "Debloquer l'acces",
                  unlockBody:
                      "Pass d'acces 5.99 EUR ou abonnement 11.99 EUR / mois. 1 photo ou 10s de video gratuits par creator.",
                  pass: 'Activer le pass 5.99 EUR',
                  subscribe: "S'abonner 11.99 EUR",
                  openChat: 'Ouvrir le chat (abonnement)',
                  buyThis: 'Acheter ce contenu',
                  passInfo: 'Pass valable 30 jours. Abonnement mensuel.',
                  creatorInfo: 'Les creators ont toujours acces a leurs contenus.',
                  aboutCreator: 'A propos du creator',
                  aboutBody:
                      'publie regulierement de nouvelles series exclusives. Suis son profil pour ne rien manquer.',
                  seeCreators: 'Voir les creators ->',
              }
            : {
                  notFound: 'Content not found.',
                  genericError: 'Error.',
                  paymentConfirmed: 'Payment confirmed. Access unlocked.',
                  paymentCanceled: 'Payment canceled. Content is still locked.',
                  creatorMissing: 'Creator not found.',
                  loginForChat: 'Log in to access chat.',
                  subRequired: 'An active subscription is required for chat.',
                  chatUnavailable: 'Chat unavailable.',
                  loginForReport: 'Log in to submit a report.',
                  reasonRequired: 'A reason is required.',
                  reportFailed: 'Unable to submit report.',
                  reportSent: 'Report sent.',
                  loginBeforePay: 'Log in before paying.',
                  paymentError: 'Payment error.',
                  paymentSimulated: 'Payment simulated.',
                  eyebrow: 'Collection',
                  by: 'By',
                  access: 'Access',
                  unlocked: 'Unlocked',
                  locked: 'Locked',
                  backToFeed: 'Back to feed ->',
                  previewUnavailable: 'Preview unavailable',
                  preview10: `Preview ${PREVIEW_SECONDS}s`,
                  unlockToView: 'Unlock to view',
                  freePreview: 'Free preview',
                  accessible: 'Accessible',
                  noFiles: 'No files attached.',
                  moderation: 'Moderation',
                  report: 'Report',
                  reportReason: 'Reason (ex: inappropriate content)',
                  reportDetails: 'Details',
                  send: 'Send',
                  unlockAccess: 'Unlock access',
                  unlockBody:
                      '5.99 EUR access pass or 11.99 EUR / month subscription. 1 free photo or 10 seconds of video per creator.',
                  pass: 'Activate pass 5.99 EUR',
                  subscribe: 'Subscribe 11.99 EUR',
                  openChat: 'Open chat (subscription)',
                  buyThis: 'Buy this content',
                  passInfo: 'Pass valid for 30 days. Monthly subscription.',
                  creatorInfo: 'Creators always keep access to their own content.',
                  aboutCreator: 'About the creator',
                  aboutBody: 'regularly publishes new exclusive series. Follow the profile so you do not miss anything.',
                  seeCreators: 'View creators ->',
              };
    const { id } = use(params);
    const [content, setContent] = useState<ContentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [billingMessage, setBillingMessage] = useState<string | null>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');

    const token = getAuthToken();

    const fetchContent = useCallback(async () => {
        try {
            const response = await fetch(apiUrl(`/api/content/${id}`), {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || copy.notFound);
            }
            setContent(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : copy.genericError);
        } finally {
            setLoading(false);
        }
    }, [copy.genericError, copy.notFound, id, token]);

    useEffect(() => {
        fetchContent();
        if (token) {
            fetch(apiUrl('/api/users/me'), {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => setIsSubscribed(Boolean(data.premiumAccess)))
                .catch(() => {});
        }
    }, [fetchContent, token]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const canceled = params.get('canceled');

        if (success === 'content') {
            setBillingMessage(copy.paymentConfirmed);
            fetchContent();
        } else if (canceled === 'content') {
            setBillingMessage(copy.paymentCanceled);
        }
    }, [copy.paymentCanceled, copy.paymentConfirmed, fetchContent]);

    const handleChat = async () => {
        if (!content?.creator?.id) {
            setBillingMessage(copy.creatorMissing);
            return;
        }
        if (!token) {
            setBillingMessage(copy.loginForChat);
            return;
        }
        if (!isSubscribed) {
            setBillingMessage(copy.subRequired);
            return;
        }
        const response = await fetch(apiUrl(`/api/chats/${content.creator.id}`), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
            setBillingMessage(data.message || copy.chatUnavailable);
            return;
        }
        window.location.href = `/chat/${data.id}`;
    };

    const handleReport = async () => {
        if (!token) {
            setBillingMessage(copy.loginForReport);
            return;
        }
        if (!reportReason.trim()) {
            setBillingMessage(copy.reasonRequired);
            return;
        }
        const response = await fetch(apiUrl('/api/reports'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                targetType: 'content',
                targetId: content?._id,
                reason: reportReason,
                details: reportDetails,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            setBillingMessage(data.message || copy.reportFailed);
            return;
        }
        setBillingMessage(copy.reportSent);
        setReportOpen(false);
        setReportReason('');
        setReportDetails('');
    };

    const redirectToCheckout = async (path: string, body?: Record<string, unknown>) => {
        setBillingMessage(null);
        if (!token) {
            setBillingMessage(copy.loginBeforePay);
            return;
        }

        try {
            const response = await fetch(apiUrl(path), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: body ? JSON.stringify(body) : undefined,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || copy.paymentError);
            }
            if (data.url) {
                window.location.href = data.url;
            } else {
                setBillingMessage(data.message || copy.paymentSimulated);
                fetchContent();
            }
        } catch (err) {
            setBillingMessage(err instanceof Error ? err.message : copy.paymentError);
        }
    };

    const handlePurchase = async () => {
        if (!content) return;
        await redirectToCheckout('/api/stripe/checkout/content', {
            contentId: content._id,
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#c7a46a]"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !content) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="max-w-3xl mx-auto px-6 py-16">
                    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-[#f0d8ac]">
                        {error || copy.notFound}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const price = content.files?.[0]?.price;

    return (
        <div className="min-h-screen">
            <Navigation />

            <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-1 space-y-3">
                        <p className="uppercase tracking-[0.3em] text-xs text-[#d8c7a8]">
                            {copy.eyebrow}
                        </p>
                        <h1 className="text-4xl font-semibold text-[#f4ede3]">
                            {content.title}
                        </h1>
                        <p className="text-[#b7ad9c]">{content.description}</p>
                        <p className="text-sm text-[#b7ad9c]">
                            {copy.by} {content.creator.displayName || content.creator.username}
                        </p>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-6 shadow-lg space-y-3 border border-white/5">
                        <p className="text-sm text-[#b7ad9c]">{copy.access}</p>
                        <p className="text-2xl font-semibold text-[#f4ede3]">
                            {content.canAccess ? copy.unlocked : copy.locked}
                        </p>
                        <Link
                            href="/browse"
                            className="inline-flex text-sm font-semibold text-[#f0d8ac]"
                        >
                            {copy.backToFeed}
                        </Link>
                    </div>
                </div>

                {billingMessage && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[#f0d8ac]">
                        {billingMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {content.files.map((file, index) => {
                                const mediaUrl = resolveMediaUrl(file.url);
                                const limitPreview =
                                    Boolean(content.isPreview) && !content.canAccess && index === 0;
                                return (
                                    <div
                                        key={`${file.url}-${index}`}
                                        className="rounded-3xl bg-white/5 shadow-lg overflow-hidden border border-white/5"
                                    >
                                        <div className="aspect-[4/3] bg-gradient-to-br from-[#1b1622] to-[#2a2018] flex items-center justify-center relative">
                                            {!mediaUrl ? (
                                                <div className="text-sm text-[#b7ad9c]">
                                                    {copy.previewUnavailable}
                                                </div>
                                            ) : file.type.startsWith('video') ? (
                                                <video
                                                    src={mediaUrl}
                                                    controls={!file.isLocked}
                                                    controlsList="nodownload noplaybackrate noremoteplayback"
                                                    disablePictureInPicture
                                                    onContextMenu={(event) => event.preventDefault()}
                                                    onTimeUpdate={(event) => {
                                                        if (
                                                            limitPreview &&
                                                            event.currentTarget.currentTime >
                                                                PREVIEW_SECONDS
                                                        ) {
                                                            event.currentTarget.pause();
                                                            event.currentTarget.currentTime = 0;
                                                        }
                                                    }}
                                                    className={`h-full w-full object-cover ${
                                                        file.isLocked ? 'blur-md' : ''
                                                    }`}
                                                />
                                            ) : (
                                                <img
                                                    src={mediaUrl}
                                                    alt={content.title}
                                                    className={`h-full w-full object-cover ${
                                                        file.isLocked ? 'blur-md' : ''
                                                    }`}
                                                />
                                            )}
                                            {limitPreview && (
                                                <div className="absolute left-4 top-4 rounded-full bg-[#15131b] px-3 py-1 text-xs font-semibold text-[#f0d8ac] border border-white/10">
                                                    {copy.preview10}
                                                </div>
                                            )}
                                            {file.type.startsWith('video') && <WatermarkOverlay />}
                                            {file.isLocked && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                    <span className="rounded-full bg-[#15131b] px-4 py-2 text-sm font-semibold text-[#f0d8ac] border border-white/10">
                                                        {copy.unlockToView}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 text-sm text-[#b7ad9c]">
                                            {index === 0 && limitPreview
                                                ? copy.preview10
                                                : index === 0
                                                  ? copy.freePreview
                                                  : file.isLocked
                                                    ? copy.locked
                                                    : copy.accessible}
                                        </div>
                                    </div>
                                );
                            })}
                            {content.files.length === 0 && (
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-[#b7ad9c]">
                                    {copy.noFiles}
                                </div>
                            )}
                        </div>
                        <div className="rounded-3xl bg-white/5 p-6 shadow-lg border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-[#f4ede3]">
                                    {copy.moderation}
                                </h3>
                                <button
                                    onClick={() => setReportOpen((prev) => !prev)}
                                    className="text-sm text-[#f0d8ac] font-semibold"
                                >
                                    {copy.report}
                                </button>
                            </div>
                            {reportOpen && (
                                <div className="space-y-3">
                                    <input
                                        value={reportReason}
                                        onChange={(event) =>
                                            setReportReason(event.target.value)
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                        placeholder={copy.reportReason}
                                    />
                                    <textarea
                                        value={reportDetails}
                                        onChange={(event) =>
                                            setReportDetails(event.target.value)
                                        }
                                        className="w-full rounded-xl border border-white/10 bg-[#101016] px-4 py-3 text-[#f4ede3]"
                                        rows={3}
                                        placeholder={copy.reportDetails}
                                    />
                                    <button
                                        onClick={handleReport}
                                        className="rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] px-4 py-2 text-sm font-semibold"
                                    >
                                        {copy.send}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-3xl bg-white/5 p-6 shadow-lg space-y-4 border border-white/5">
                            <h2 className="text-xl font-semibold text-[#f4ede3]">
                                {copy.unlockAccess}
                            </h2>
                            <p className="text-sm text-[#b7ad9c]">{copy.unlockBody}</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => redirectToCheckout('/api/stripe/checkout/pass')}
                                    className="w-full rounded-full bg-gradient-to-r from-[#c7a46a] to-[#8f6b39] text-[#0b0a0f] py-2 text-sm font-semibold"
                                >
                                    {copy.pass}
                                </button>
                                <button
                                    onClick={() =>
                                        redirectToCheckout('/api/stripe/checkout/subscription')
                                    }
                                    className="w-full rounded-full border border-white/15 py-2 text-sm font-semibold text-[#d6cbb8]"
                                >
                                    {copy.subscribe}
                                </button>
                                <button
                                    onClick={handleChat}
                                    className="w-full rounded-full border border-[#3a2c1a] py-2 text-sm font-semibold text-[#f0d8ac]"
                                >
                                    {copy.openChat}
                                </button>
                                {typeof price === 'number' && price > 0 && (
                                    <button
                                        onClick={handlePurchase}
                                        className="w-full rounded-full border border-[#3a2c1a] py-2 text-sm font-semibold text-[#f0d8ac]"
                                    >
                                        {copy.buyThis} {price} EUR
                                    </button>
                                )}
                            </div>
                            <div className="text-xs text-[#b7ad9c] space-y-2">
                                <p>{copy.passInfo}</p>
                                <p>{copy.creatorInfo}</p>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white/5 p-6 shadow-lg space-y-3 border border-white/5">
                            <h3 className="text-lg font-semibold text-[#f4ede3]">
                                {copy.aboutCreator}
                            </h3>
                            <p className="text-sm text-[#b7ad9c]">
                                {content.creator.username} {copy.aboutBody}
                            </p>
                            <Link
                                href="/creators"
                                className="inline-flex text-sm font-semibold text-[#f0d8ac]"
                            >
                                {copy.seeCreators}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
