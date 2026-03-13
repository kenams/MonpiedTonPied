const express = require('express');
const auth = require('../middleware/auth');
const PushSubscription = require('../models/PushSubscription');
const { isPushConfigured, VAPID_PUBLIC_KEY } = require('../utils/push');

const router = express.Router();

router.get('/public-key', (req, res) => {
    if (!isPushConfigured()) {
        return res.status(503).json({ message: 'Push non configure.' });
    }
    return res.json({ publicKey: VAPID_PUBLIC_KEY });
});

router.get('/status', auth, async (req, res) => {
    try {
        const configured = isPushConfigured();
        if (!configured) {
            return res.json({
                configured: false,
                enabled: false,
                subscriptionCount: 0,
            });
        }

        const subscriptionCount = await PushSubscription.countDocuments({ user: req.user.id });
        return res.json({
            configured: true,
            enabled: subscriptionCount > 0,
            subscriptionCount,
        });
    } catch (error) {
        console.error('Push status error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/subscribe', auth, async (req, res) => {
    try {
        if (!isPushConfigured()) {
            return res.status(503).json({ message: 'Push non configure.' });
        }
        const { subscription } = req.body || {};
        if (!subscription?.endpoint || !subscription?.keys?.p256dh) {
            return res.status(400).json({ message: 'Subscription invalide.' });
        }
        await PushSubscription.findOneAndUpdate(
            { user: req.user.id, endpoint: subscription.endpoint },
            {
                user: req.user.id,
                endpoint: subscription.endpoint,
                keys: subscription.keys,
                userAgent: req.headers['user-agent'] || '',
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return res.json({ message: 'Push actif.' });
    } catch (error) {
        console.error('Push subscribe error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/unsubscribe', auth, async (req, res) => {
    try {
        if (!isPushConfigured()) {
            return res.status(503).json({ message: 'Push non configure.' });
        }
        const { endpoint } = req.body || {};
        if (!endpoint) {
            return res.status(400).json({ message: 'Endpoint requis.' });
        }
        await PushSubscription.deleteOne({ user: req.user.id, endpoint });
        return res.json({ message: 'Push desactive.' });
    } catch (error) {
        console.error('Push unsubscribe error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
