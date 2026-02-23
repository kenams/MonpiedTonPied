const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Content = require('../models/Content');
const Purchase = require('../models/Purchase');
const CustomRequest = require('../models/CustomRequest');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const PASS_PRICE_ID = process.env.STRIPE_PRICE_PASS_ID;
const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_PRICE_SUBSCRIPTION_ID;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const PLATFORM_FEE_RATE = 0.2;
const REQUEST_EXPIRY_HOURS = 48;

const isMockMode = () => {
    return (
        !process.env.STRIPE_SECRET_KEY ||
        process.env.STRIPE_SECRET_KEY === 'sk_test_change_me'
    );
};

const ensureCustomer = async (user) => {
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

router.post('/checkout/pass', auth, async (req, res) => {
    try {
        if (isMockMode()) {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur introuvable.' });
            }
            user.accessPassActive = true;
            user.accessPassExpiresAt = new Date(Date.now() + 30 * 86400000);
            await user.save();
            return res.json({
                mock: true,
                message: 'Pass activé (mode mock).',
            });
        }
        if (!PASS_PRICE_ID) {
            return res.status(500).json({ message: 'Prix pass non configuré.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        const customerId = await ensureCustomer(user);
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer: customerId,
            line_items: [{ price: PASS_PRICE_ID, quantity: 1 }],
            success_url: `${FRONTEND_URL}/profile?success=pass`,
            cancel_url: `${FRONTEND_URL}/profile?canceled=pass`,
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
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur introuvable.' });
            }
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
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        const customerId = await ensureCustomer(user);
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: SUBSCRIPTION_PRICE_ID, quantity: 1 }],
            success_url: `${FRONTEND_URL}/profile?success=subscription`,
            cancel_url: `${FRONTEND_URL}/profile?canceled=subscription`,
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
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur introuvable.' });
            }
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
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

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
            success_url: `${FRONTEND_URL}/content/${contentId}?success=content`,
            cancel_url: `${FRONTEND_URL}/content/${contentId}?canceled=content`,
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
            if (!consumer) {
                return res.status(404).json({ message: 'Utilisateur introuvable.' });
            }
            const role = consumer.role === 'user' ? 'consumer' : consumer.role;
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
        if (!consumer) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }
        const role = consumer.role === 'user' ? 'consumer' : consumer.role;
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
            success_url: `${FRONTEND_URL}/requests?success=request`,
            cancel_url: `${FRONTEND_URL}/creators/${creatorId}?canceled=request`,
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

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    let event;
    try {
        if (!WEBHOOK_SECRET) {
            return res.status(500).json({ message: 'Webhook secret manquant.' });
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
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const metadata = session.metadata || {};
            const userId = metadata.userId || session.client_reference_id;
            const user = userId ? await User.findById(userId) : null;

            if (metadata.type === 'pass' && user) {
                user.accessPassActive = true;
                user.accessPassExpiresAt = new Date(Date.now() + 30 * 86400000);
                await user.save();
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
                }
            }

            if (metadata.type === 'request') {
                const request = await CustomRequest.findById(metadata.requestId);
                if (request) {
                    request.paid = true;
                    request.paymentIntentId = session.payment_intent;
                    await request.save();
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
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook handling error:', error);
        res.status(500).json({ message: 'Webhook error.' });
    }
});

module.exports = router;
