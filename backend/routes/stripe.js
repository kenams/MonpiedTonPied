const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Content = require('../models/Content');
const Purchase = require('../models/Purchase');
const CustomRequest = require('../models/CustomRequest');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const WebhookEvent = require('../models/WebhookEvent');
const { createAndEmitNotification } = require('../utils/notify');
const { normalizeRole } = require('../utils/accessControl');
const { getStripeClient, isStripeConfigured } = require('../utils/stripeClient');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FRONTEND_URLS = (process.env.FRONTEND_URLS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
const PASS_PRICE_ID = process.env.STRIPE_PRICE_PASS_ID;
const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_PRICE_SUBSCRIPTION_ID;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const PLATFORM_FEE_RATE = 0.2;
const REQUEST_EXPIRY_HOURS = 48;
const ALLOWED_RETURN_PREFIXES = ['monpiedtonpied://', 'exp://', 'expo://'];
const ALLOWED_RETURN_ORIGINS = [FRONTEND_URL, ...FRONTEND_URLS]
    .map((entry) => {
        try {
            return new URL(entry).origin;
        } catch {
            return null;
        }
    })
    .filter(Boolean);

const isAllowedWebReturnUrl = (value) => {
    if (!value || ALLOWED_RETURN_ORIGINS.length === 0) return false;
    try {
        const url = new URL(value);
        return ALLOWED_RETURN_ORIGINS.includes(url.origin);
    } catch {
        return false;
    }
};

const resolveReturnUrl = (value, fallback) => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return fallback;
        if (ALLOWED_RETURN_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
            return trimmed;
        }
        if (isAllowedWebReturnUrl(trimmed)) {
            return trimmed;
        }
    }
    return fallback;
};

const upsertSubscription = async (userId, data = {}) => {
    if (!userId) return null;
    const payload = {
        user: userId,
        stripeSubscriptionId: data.stripeSubscriptionId || null,
        status: data.status || 'pending',
        currentPeriodEnd: data.currentPeriodEnd || null,
        cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
        priceId: data.priceId || null,
        latestInvoiceId: data.latestInvoiceId || null,
    };
    return Subscription.findOneAndUpdate(
        { user: userId, stripeSubscriptionId: payload.stripeSubscriptionId },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

const recordPayment = async (payload) => {
    if (!payload?.user || !payload?.type) return null;
    const filter = {
        user: payload.user,
        type: payload.type,
    };
    if (payload.stripePaymentIntentId) {
        filter.stripePaymentIntentId = payload.stripePaymentIntentId;
    }
    if (payload.stripeSessionId) {
        filter.stripeSessionId = payload.stripeSessionId;
    }
    if (payload.content) {
        filter.content = payload.content;
    }
    if (payload.request) {
        filter.request = payload.request;
    }
    return Payment.findOneAndUpdate(filter, payload, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
    });
};

const isWebhookProcessed = async (eventId) => {
    if (!eventId) return false;
    const existing = await WebhookEvent.findOne({ eventId });
    return Boolean(existing);
};

const markWebhookProcessed = async (event) => {
    if (!event?.id) return null;
    try {
        return await WebhookEvent.create({ eventId: event.id, type: event.type });
    } catch (error) {
        if (error?.code === 11000) {
            return null;
        }
        throw error;
    }
};

const isMockMode = () => {
    return (
        process.env.PAYWALL_MODE === 'staging' ||
        !isStripeConfigured()
    );
};

const ensureCustomer = async (user) => {
    const stripe = getStripeClient();
    if (!stripe) {
        throw new Error('Stripe non configure.');
    }
    if (user.stripeCustomerId) {
        return user.stripeCustomerId;
    }
    const customer = await stripe.customers.create({
        email: user.email,
        name: user.displayName || user.username,
    });
    user.stripeCustomerId = customer.id;
    await user.save();
    return customer.id;
};

const containsBlockedText = (text) => {
    const blocked = ['raciste', 'racisme', 'nazi', 'haine', 'violence'];
    const lower = text.toLowerCase();
    return blocked.some((word) => lower.includes(word));
};

const assertActiveUser = (user, res) => {
    if (!user) {
        res.status(404).json({ message: 'Utilisateur introuvable.' });
        return false;
    }
    if (user.isSuspended) {
        res.status(403).json({ message: 'Compte suspendu.' });
        return false;
    }
    return true;
};

router.post('/checkout/pass', auth, async (req, res) => {
    try {
        if (isMockMode()) {
            const user = await User.findById(req.user.id);
            if (!assertActiveUser(user, res)) return;
            user.accessPassActive = true;
            user.accessPassExpiresAt = new Date(Date.now() + 30 * 86400000);
            await user.save();
            await upsertSubscription(user._id, {
                status: 'active',
                currentPeriodEnd: user.subscriptionExpiresAt,
                cancelAtPeriodEnd: false,
            });
            await recordPayment({
                user: user._id,
                type: 'subscription',
                status: 'succeeded',
                amount: 11.99,
                currency: 'eur',
                metadata: { mode: 'mock' },
            });
            await createAndEmitNotification(req, {
                user: user._id,
                type: 'subscription',
                title: 'Abonnement actif',
                message: 'Ton abonnement premium est actif.',
            });
            await recordPayment({
                user: user._id,
                type: 'pass',
                status: 'succeeded',
                amount: 5.99,
                currency: 'eur',
                metadata: { mode: 'mock' },
            });
            await createAndEmitNotification(req, {
                user: user._id,
                type: 'pass',
                title: 'Pass actif',
                message: 'Ton pass 30 jours est actif.',
            });
            return res.json({
                mock: true,
                message: 'Pass activé (mode mock).',
            });
        }
        if (!PASS_PRICE_ID) {
            return res.status(500).json({ message: 'Prix pass non configuré.' });
        }

        const user = await User.findById(req.user.id);
        if (!assertActiveUser(user, res)) return;

        const customerId = await ensureCustomer(user);
        const successUrl = resolveReturnUrl(
            req.body?.successUrl,
            `${FRONTEND_URL}/profile?success=pass`
        );
        const cancelUrl = resolveReturnUrl(
            req.body?.cancelUrl,
            `${FRONTEND_URL}/profile?canceled=pass`
        );
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer: customerId,
            line_items: [{ price: PASS_PRICE_ID, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: user._id.toString(),
            metadata: {
                type: 'pass',
                userId: user._id.toString(),
            },
        });

        return res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe pass error:', error);
        return res.status(500).json({ message: 'Erreur Stripe.' });
    }
});

router.post('/checkout/subscription', auth, async (req, res) => {
    try {
        if (isMockMode()) {
            const user = await User.findById(req.user.id);
            if (!assertActiveUser(user, res)) return;
            user.subscriptionActive = true;
            user.subscriptionExpiresAt = new Date(Date.now() + 30 * 86400000);
            await user.save();
            return res.json({
                mock: true,
                message: 'Abonnement activé (mode mock).',
            });
        }
        if (!SUBSCRIPTION_PRICE_ID) {
            return res.status(500).json({ message: 'Prix abonnement non configuré.' });
        }

        const user = await User.findById(req.user.id);
        if (!assertActiveUser(user, res)) return;

        const customerId = await ensureCustomer(user);
        const successUrl = resolveReturnUrl(
            req.body?.successUrl,
            `${FRONTEND_URL}/profile?success=subscription`
        );
        const cancelUrl = resolveReturnUrl(
            req.body?.cancelUrl,
            `${FRONTEND_URL}/profile?canceled=subscription`
        );
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: SUBSCRIPTION_PRICE_ID, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: user._id.toString(),
            subscription_data: {
                metadata: { userId: user._id.toString() },
            },
            metadata: {
                type: 'subscription',
                userId: user._id.toString(),
            },
        });

        return res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe subscription error:', error);
        return res.status(500).json({ message: 'Erreur Stripe.' });
    }
});

router.post('/checkout/content', auth, async (req, res) => {
    try {
        if (isMockMode()) {
            const { contentId } = req.body;
            if (!contentId) {
                return res.status(400).json({ message: 'contentId requis.' });
            }
            const user = await User.findById(req.user.id);
            if (!assertActiveUser(user, res)) return;
            const content = await Content.findById(contentId);
            if (!content) {
                return res.status(404).json({ message: 'Contenu introuvable.' });
            }
            const amount = content.files?.[0]?.price || 0;
            const platformFee = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
            const creatorAmount = Math.max(amount - platformFee, 0);
            await Purchase.findOneAndUpdate(
                { user: user._id, content: contentId },
                { amount, platformFee, creatorAmount },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            await recordPayment({
                user: user._id,
                type: 'content',
                status: 'succeeded',
                amount,
                currency: 'eur',
                content: content._id,
                metadata: { mode: 'mock' },
            });
            await createAndEmitNotification(req, {
                user: user._id,
                type: 'content',
                title: 'Contenu debloque',
                message: `Achat confirme: ${content.title}`,
                metadata: { contentId: content._id.toString() },
            });
            return res.json({
                mock: true,
                message: 'Achat simulé (mode mock).',
            });
        }
        const { contentId } = req.body;
        if (!contentId) {
            return res.status(400).json({ message: 'contentId requis.' });
        }

        const user = await User.findById(req.user.id);
        if (!assertActiveUser(user, res)) return;

        const content = await Content.findById(contentId);
        if (!content) {
            return res.status(404).json({ message: 'Contenu introuvable.' });
        }

        const price = content.files?.[0]?.price;
        if (!price || price <= 0) {
            return res.status(400).json({ message: 'Prix invalide.' });
        }

        const customerId = await ensureCustomer(user);
        const unitAmount = Math.round(price * 100);
        const successUrl = resolveReturnUrl(
            req.body?.successUrl,
            `${FRONTEND_URL}/content/${contentId}?success=content`
        );
        const cancelUrl = resolveReturnUrl(
            req.body?.cancelUrl,
            `${FRONTEND_URL}/content/${contentId}?canceled=content`
        );

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer: customerId,
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: content.title,
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: user._id.toString(),
            metadata: {
                type: 'content',
                userId: user._id.toString(),
                contentId: contentId.toString(),
            },
        });

        return res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe content error:', error);
        return res.status(500).json({ message: 'Erreur Stripe.' });
    }
});

router.post('/checkout/request', auth, async (req, res) => {
    try {
        if (isMockMode()) {
            const { creatorId, prompt, price } = req.body;
            if (!creatorId || !prompt || !price) {
                return res.status(400).json({ message: 'Champs requis manquants.' });
            }
            if (containsBlockedText(prompt)) {
                return res.status(400).json({ message: 'Demande non autorisée.' });
            }
            if (!prompt.toLowerCase().includes('pied')) {
                return res
                    .status(400)
                    .json({ message: 'La demande doit concerner les pieds.' });
            }

            const consumer = await User.findById(req.user.id);
            if (!assertActiveUser(consumer, res)) return;
            const role = normalizeRole(consumer.role);
            if (role !== 'consumer') {
                return res.status(403).json({ message: 'Accès refusé.' });
            }
            const creator = await User.findById(creatorId);
            if (!creator || creator.role !== 'creator') {
                return res.status(404).json({ message: 'Créateur introuvable.' });
            }
            const numericPrice = Number(price);
            if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
                return res.status(400).json({ message: 'Prix invalide.' });
            }
            const platformFee = Math.round(numericPrice * PLATFORM_FEE_RATE * 100) / 100;
            const creatorAmount = Math.max(numericPrice - platformFee, 0);
            const expiresAt = new Date(Date.now() + REQUEST_EXPIRY_HOURS * 3600000);

            const request = await CustomRequest.create({
                consumer: consumer._id,
                creator: creator._id,
                prompt: prompt.trim(),
                price: numericPrice,
                platformFee,
                creatorAmount,
                expiresAt,
                paid: true,
                status: 'pending',
            });
            await recordPayment({
                user: consumer._id,
                type: 'request',
                status: 'succeeded',
                amount: numericPrice,
                currency: 'eur',
                request: request._id,
                metadata: { mode: 'mock' },
            });
            await createAndEmitNotification(req, {
                user: consumer._id,
                type: 'request',
                title: 'Demande envoyee',
                message: 'Ta demande personnalisee a ete enregistree.',
                metadata: { requestId: request._id.toString() },
            });

            return res.json({
                mock: true,
                message: 'Demande créée (mode mock).',
                requestId: request._id,
            });
        }
        const { creatorId, prompt, price } = req.body;
        if (!creatorId || !prompt || !price) {
            return res.status(400).json({ message: 'Champs requis manquants.' });
        }
        if (containsBlockedText(prompt)) {
            return res.status(400).json({ message: 'Demande non autorisée.' });
        }
        if (!prompt.toLowerCase().includes('pied')) {
            return res
                .status(400)
                .json({ message: 'La demande doit concerner les pieds.' });
        }

        const consumer = await User.findById(req.user.id);
        if (!assertActiveUser(consumer, res)) return;
        const role = normalizeRole(consumer.role);
        if (role !== 'consumer') {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        const creator = await User.findById(creatorId);
        if (!creator || creator.role !== 'creator') {
            return res.status(404).json({ message: 'Créateur introuvable.' });
        }

        const numericPrice = Number(price);
        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({ message: 'Prix invalide.' });
        }

        const platformFee = Math.round(numericPrice * PLATFORM_FEE_RATE * 100) / 100;
        const creatorAmount = Math.max(numericPrice - platformFee, 0);

        const expiresAt = new Date(Date.now() + REQUEST_EXPIRY_HOURS * 3600000);
        const request = await CustomRequest.create({
            consumer: consumer._id,
            creator: creator._id,
            prompt: prompt.trim(),
            price: numericPrice,
            platformFee,
            creatorAmount,
            expiresAt,
            paid: false,
        });

        const customerId = await ensureCustomer(consumer);
        const unitAmount = Math.round(numericPrice * 100);
        const successUrl = resolveReturnUrl(
            req.body?.successUrl,
            `${FRONTEND_URL}/requests?success=request`
        );
        const cancelUrl = resolveReturnUrl(
            req.body?.cancelUrl,
            `${FRONTEND_URL}/creators/${creatorId}?canceled=request`
        );

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer: customerId,
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Demande personnalisée - ${creator.displayName || creator.username}`,
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: consumer._id.toString(),
            metadata: {
                type: 'request',
                userId: consumer._id.toString(),
                requestId: request._id.toString(),
            },
        });

        request.paymentSessionId = session.id;
        await request.save();

        return res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe request error:', error);
        return res.status(500).json({ message: 'Erreur Stripe.' });
    }
});

router.post('/portal', auth, async (req, res) => {
    try {
        if (isMockMode()) {
            return res.json({
                mock: true,
                message: 'Portail indisponible en mode mock.',
            });
        }
        if (!isStripeConfigured()) {
            return res.status(500).json({ message: 'Stripe non configure.' });
        }
        const stripe = getStripeClient();

        const user = await User.findById(req.user.id);
        if (!assertActiveUser(user, res)) return;

        const customerId = await ensureCustomer(user);
        const returnUrl = resolveReturnUrl(
            req.body?.returnUrl || req.body?.successUrl,
            `${FRONTEND_URL}/profile`
        );

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        return res.json({ url: portalSession.url });
    } catch (error) {
        console.error('Stripe portal error:', error);
        return res.status(500).json({ message: 'Erreur Stripe.' });
    }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    let event;
    try {
        if (!WEBHOOK_SECRET) {
            return res.status(500).json({ message: 'Webhook secret manquant.' });
        }
        const stripe = getStripeClient();
        if (!stripe) {
            return res.status(500).json({ message: 'Stripe non configure.' });
        }
        event = stripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature error:', err);
        return res.status(400).json({ message: 'Webhook error.' });
    }

    try {
        const stripe = getStripeClient();
        if (!stripe) {
            return res.status(500).json({ message: 'Stripe non configure.' });
        }
        if (await isWebhookProcessed(event.id)) {
            return res.json({ received: true, duplicate: true });
        }
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const metadata = session.metadata || {};
            const userId = metadata.userId || session.client_reference_id;
            const user = userId ? await User.findById(userId) : null;

            if (metadata.type === 'pass' && user) {
                user.accessPassActive = true;
                user.accessPassExpiresAt = new Date(Date.now() + 30 * 86400000);
                await user.save();
                await recordPayment({
                    user: user._id,
                    type: 'pass',
                    status: 'succeeded',
                    amount: session.amount_total ? session.amount_total / 100 : 0,
                    currency: session.currency || 'eur',
                    stripePaymentIntentId: session.payment_intent || null,
                    stripeSessionId: session.id,
                });
                await createAndEmitNotification(req, {
                    user: user._id,
                    type: 'pass',
                    title: 'Pass actif',
                    message: 'Ton pass 30 jours est actif.',
                });
            }

            if (metadata.type === 'subscription' && user) {
                const subscriptionId = session.subscription;
                if (subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(
                        subscriptionId
                    );
                    user.subscriptionActive = true;
                    user.subscriptionExpiresAt = new Date(
                        subscription.current_period_end * 1000
                    );
                    user.stripeSubscriptionId = subscription.id;
                    await user.save();
                    await upsertSubscription(user._id, {
                        stripeSubscriptionId: subscription.id,
                        status: 'active',
                        currentPeriodEnd: new Date(
                            subscription.current_period_end * 1000
                        ),
                        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
                        priceId:
                            subscription.items?.data?.[0]?.price?.id ||
                            subscription.items?.data?.[0]?.plan?.id ||
                            null,
                        latestInvoiceId: subscription.latest_invoice || null,
                    });
                    await recordPayment({
                        user: user._id,
                        type: 'subscription',
                        status: 'succeeded',
                        amount: session.amount_total ? session.amount_total / 100 : 0,
                        currency: session.currency || 'eur',
                        stripePaymentIntentId: session.payment_intent || null,
                        stripeSessionId: session.id,
                        metadata: { subscriptionId: subscription.id },
                    });
                    await createAndEmitNotification(req, {
                        user: user._id,
                        type: 'subscription',
                        title: 'Abonnement actif',
                        message: 'Ton abonnement premium est actif.',
                    });
                }
            }

            if (metadata.type === 'content' && user) {
                const contentId = metadata.contentId;
                const content = await Content.findById(contentId);
                if (content) {
                    const amount = content.files?.[0]?.price || 0;
                    const platformFee = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
                    const creatorAmount = Math.max(amount - platformFee, 0);
                    await Purchase.findOneAndUpdate(
                        { user: user._id, content: contentId },
                        {
                            amount,
                            platformFee,
                            creatorAmount,
                            paymentIntentId: session.payment_intent,
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                    await recordPayment({
                        user: user._id,
                        type: 'content',
                        status: 'succeeded',
                        amount: session.amount_total ? session.amount_total / 100 : amount,
                        currency: session.currency || 'eur',
                        stripePaymentIntentId: session.payment_intent || null,
                        stripeSessionId: session.id,
                        content: content._id,
                    });
                    await createAndEmitNotification(req, {
                        user: user._id,
                        type: 'content',
                        title: 'Contenu debloque',
                        message: `Achat confirme: ${content.title}`,
                        metadata: { contentId: content._id.toString() },
                    });
                }
            }

            if (metadata.type === 'request') {
                const request = await CustomRequest.findById(metadata.requestId);
                if (request) {
                    request.paid = true;
                    request.paymentIntentId = session.payment_intent;
                    await request.save();
                    await recordPayment({
                        user: request.consumer,
                        type: 'request',
                        status: 'succeeded',
                        amount: session.amount_total ? session.amount_total / 100 : request.price,
                        currency: session.currency || 'eur',
                        stripePaymentIntentId: session.payment_intent || null,
                        stripeSessionId: session.id,
                        request: request._id,
                    });
                    await createAndEmitNotification(req, {
                        user: request.consumer,
                        type: 'request',
                        title: 'Demande payee',
                        message: 'Ta demande personnalisee est payee.',
                        metadata: { requestId: request._id.toString() },
                    });
                }
            }
        }

        if (event.type === 'invoice.paid') {
            const invoice = event.data.object;
            if (invoice.subscription) {
                const subscription = await stripe.subscriptions.retrieve(
                    invoice.subscription
                );
                const user = await User.findOne({
                    stripeSubscriptionId: subscription.id,
                });
                if (user) {
                    user.subscriptionActive = true;
                    user.subscriptionExpiresAt = new Date(
                        subscription.current_period_end * 1000
                    );
                    await user.save();
                    await upsertSubscription(user._id, {
                        stripeSubscriptionId: subscription.id,
                        status: 'active',
                        currentPeriodEnd: new Date(
                            subscription.current_period_end * 1000
                        ),
                        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
                        priceId:
                            subscription.items?.data?.[0]?.price?.id ||
                            subscription.items?.data?.[0]?.plan?.id ||
                            null,
                        latestInvoiceId: subscription.latest_invoice || null,
                    });
                    await recordPayment({
                        user: user._id,
                        type: 'subscription',
                        status: 'succeeded',
                        amount: invoice.amount_paid ? invoice.amount_paid / 100 : 0,
                        currency: invoice.currency || 'eur',
                        stripePaymentIntentId: invoice.payment_intent || null,
                        stripeSessionId: invoice.id,
                        metadata: { invoiceId: invoice.id },
                    });
                    await createAndEmitNotification(req, {
                        user: user._id,
                        type: 'subscription',
                        title: 'Paiement recu',
                        message: 'Ton abonnement a ete renouvele.',
                    });
                }
            }
        }

        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            const user = await User.findOne({
                stripeSubscriptionId: subscription.id,
            });
            if (user) {
                user.subscriptionActive = false;
                user.subscriptionExpiresAt = null;
                await user.save();
                await upsertSubscription(user._id, {
                    stripeSubscriptionId: subscription.id,
                    status: 'canceled',
                    currentPeriodEnd: subscription.current_period_end
                        ? new Date(subscription.current_period_end * 1000)
                        : null,
                    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
                    priceId:
                        subscription.items?.data?.[0]?.price?.id ||
                        subscription.items?.data?.[0]?.plan?.id ||
                        null,
                    latestInvoiceId: subscription.latest_invoice || null,
                });
                await createAndEmitNotification(req, {
                    user: user._id,
                    type: 'subscription',
                    title: 'Abonnement annule',
                    message: 'Ton abonnement a ete annule.',
                });
            }
        }

        if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object;
            const user = await User.findOne({
                stripeSubscriptionId: subscription.id,
            });
            if (user) {
                const isActive = subscription.status === 'active';
                user.subscriptionActive = isActive;
                user.subscriptionExpiresAt = subscription.current_period_end
                    ? new Date(subscription.current_period_end * 1000)
                    : null;
                await user.save();
                await upsertSubscription(user._id, {
                    stripeSubscriptionId: subscription.id,
                    status: isActive ? 'active' : subscription.status || 'canceled',
                    currentPeriodEnd: subscription.current_period_end
                        ? new Date(subscription.current_period_end * 1000)
                        : null,
                    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
                    priceId:
                        subscription.items?.data?.[0]?.price?.id ||
                        subscription.items?.data?.[0]?.plan?.id ||
                        null,
                    latestInvoiceId: subscription.latest_invoice || null,
                });
            }
        }

        await markWebhookProcessed(event);
        res.json({ received: true });
    } catch (error) {
        console.error('Webhook handling error:', error);
        res.status(500).json({ message: 'Webhook error.' });
    }
});

module.exports = router;
