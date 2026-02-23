const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const CustomRequest = require('../models/CustomRequest');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');

const router = express.Router();

const PLATFORM_FEE_RATE = 0.2;
const REQUEST_EXPIRY_HOURS = 48;

const isStripeReady = () => {
    return (
        process.env.STRIPE_SECRET_KEY &&
        process.env.STRIPE_SECRET_KEY !== 'sk_test_change_me'
    );
};

const processRefund = async (request) => {
    if (!request.paid || request.refundStatus === 'processed') {
        return;
    }
    if (!request.paymentIntentId || !isStripeReady()) {
        request.refundStatus = 'pending';
        await request.save();
        return;
    }

    try {
        await stripe.refunds.create({
            payment_intent: request.paymentIntentId,
        });
        request.refundStatus = 'processed';
        request.refundedAt = new Date();
        request.status = 'refunded';
        await request.save();
    } catch (error) {
        console.error('Refund error:', error);
        request.refundStatus = 'failed';
        await request.save();
    }
};

const containsBlockedText = (text) => {
    const blocked = ['raciste', 'racisme', 'nazi', 'haine', 'violence'];
    const lower = text.toLowerCase();
    return blocked.some((word) => lower.includes(word));
};

router.post('/', auth, async (req, res) => {
    return res.status(400).json({
        message:
            "Utilisez /api/stripe/checkout/request pour créer une demande payante.",
    });
});

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        const role = user.role === 'user' ? 'consumer' : user.role;
        const filter =
            role === 'creator'
                ? { creator: user._id, paid: true }
                : { consumer: user._id, paid: true };

        const requests = await CustomRequest.find(filter)
            .sort({ createdAt: -1 })
            .populate('consumer', 'username displayName avatarUrl')
            .populate('creator', 'username displayName avatarUrl');

        const now = Date.now();
        await Promise.all(
            requests.map(async (request) => {
                if (request.status === 'pending' && request.expiresAt.getTime() < now) {
                    request.status = 'expired';
                    await request.save();
                    await processRefund(request);
                }
            })
        );

        return res.json(
            requests.map((request) => ({
                id: request._id,
                status: request.status,
                prompt: request.prompt,
                price: request.price,
                expiresAt: request.expiresAt,
                deliveryUrl: request.deliveryUrl,
                deliveryNote: request.deliveryNote,
                deliveredAt: request.deliveredAt,
                refundStatus: request.refundStatus,
                consumer: request.consumer && {
                    id: request.consumer._id,
                    displayName:
                        request.consumer.displayName || request.consumer.username,
                },
                creator: request.creator && {
                    id: request.creator._id,
                    displayName: request.creator.displayName || request.creator.username,
                },
            }))
        );
    } catch (error) {
        console.error('Custom request list error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/:id/accept', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        if (user.role !== 'creator') {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        const request = await CustomRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Demande introuvable.' });
        }

        if (request.creator.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        if (!request.paid || request.status !== 'pending') {
            return res.status(400).json({ message: 'Demande non modifiable.' });
        }

        if (request.expiresAt.getTime() < Date.now()) {
            request.status = 'expired';
            await request.save();
            return res.status(400).json({ message: 'Demande expirée.' });
        }

        request.status = 'accepted';
        await request.save();

        const { refreshCreatorStatus } = require('../utils/moderation');
        await refreshCreatorStatus(user._id);

        return res.json({ message: 'Demande acceptée.' });
    } catch (error) {
        console.error('Custom request accept error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/:id/decline', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        if (user.role !== 'creator') {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        const request = await CustomRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Demande introuvable.' });
        }

        if (request.creator.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        if (!request.paid || request.status !== 'pending') {
            return res.status(400).json({ message: 'Demande non modifiable.' });
        }

        request.status = 'declined';
        await request.save();

        const { refreshCreatorStatus } = require('../utils/moderation');
        await refreshCreatorStatus(user._id);

        await processRefund(request);

        return res.json({ message: 'Demande refusée.' });
    } catch (error) {
        console.error('Custom request decline error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/:id/deliver', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }
        if (user.role !== 'creator') {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        const request = await CustomRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Demande introuvable.' });
        }
        if (request.creator.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }
        if (!request.paid || request.status !== 'accepted') {
            return res.status(400).json({ message: 'Demande non livrable.' });
        }

        const { deliveryUrl, deliveryNote } = req.body;
        if (!deliveryUrl) {
            return res.status(400).json({ message: 'Lien de livraison requis.' });
        }

        request.deliveryUrl = deliveryUrl;
        request.deliveryNote = deliveryNote || '';
        request.deliveredAt = new Date();
        request.status = 'delivered';
        await request.save();

        const { refreshCreatorStatus } = require('../utils/moderation');
        await refreshCreatorStatus(user._id);

        return res.json({ message: 'Livraison enregistrée.' });
    } catch (error) {
        console.error('Custom request deliver error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
