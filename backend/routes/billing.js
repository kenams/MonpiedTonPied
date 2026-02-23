const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const Content = require('../models/Content');

const router = express.Router();

const PASS_PRICE = 5.99;
const SUBSCRIPTION_PRICE = 11.99;
const ACCESS_DAYS = 30;
const PLATFORM_FEE_RATE = 0.2;

const addDays = (date, days) => new Date(date.getTime() + days * 86400000);

router.get('/status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        return res.json({
            accessPassActive: user.accessPassActive,
            accessPassExpiresAt: user.accessPassExpiresAt,
            subscriptionActive: user.subscriptionActive,
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            passPrice: PASS_PRICE,
            subscriptionPrice: SUBSCRIPTION_PRICE,
        });
    } catch (error) {
        console.error('Billing status error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/pass', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        user.accessPassActive = true;
        user.accessPassExpiresAt = addDays(new Date(), ACCESS_DAYS);
        await user.save();

        return res.json({
            message: 'Pass activé.',
            accessPassActive: user.accessPassActive,
            accessPassExpiresAt: user.accessPassExpiresAt,
            amount: PASS_PRICE,
            currency: 'EUR',
        });
    } catch (error) {
        console.error('Billing pass error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/subscribe', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        user.subscriptionActive = true;
        user.subscriptionExpiresAt = addDays(new Date(), ACCESS_DAYS);
        await user.save();

        return res.json({
            message: 'Abonnement activé.',
            subscriptionActive: user.subscriptionActive,
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            amount: SUBSCRIPTION_PRICE,
            currency: 'EUR',
        });
    } catch (error) {
        console.error('Billing subscribe error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/purchase', auth, async (req, res) => {
    try {
        const { contentId } = req.body;
        if (!contentId) {
            return res.status(400).json({ message: 'contentId requis.' });
        }

        const content = await Content.findById(contentId);
        if (!content) {
            return res.status(404).json({ message: 'Contenu introuvable.' });
        }

        const amount = content.files?.[0]?.price || 0;
        const platformFee = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100;
        const creatorAmount = Math.max(amount - platformFee, 0);

        const purchase = await Purchase.findOneAndUpdate(
            { user: req.user.id, content: contentId },
            { amount, platformFee, creatorAmount },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.status(201).json({
            message: 'Achat enregistré.',
            purchaseId: purchase._id,
            amount,
            platformFee,
            creatorAmount,
            currency: 'EUR',
        });
    } catch (error) {
        console.error('Billing purchase error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
