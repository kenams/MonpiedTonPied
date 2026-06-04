const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { buildAccessContext, normalizeRole } = require('../utils/accessControl');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        const access = buildAccessContext(user);
        return res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            role: normalizeRole(user.role),
            displayName: user.displayName || user.username,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            ageVerified: Boolean(user.ageVerifiedAt),
            emailVerified: Boolean(user.emailVerifiedAt),
            locale: user.locale,
            accessPassActive: user.accessPassActive,
            subscriptionActive: user.subscriptionActive,
            subscriptionStatus: access.subscriptionStatus,
            passStatus: access.passStatus,
            premiumAccess: access.premiumAccess,
            verifiedCreator: user.verifiedCreator,
            isSuspended: user.isSuspended,
            stripeConnectAccountId: user.stripeConnectAccountId,
            stripeConnectChargesEnabled: Boolean(user.stripeConnectChargesEnabled),
            stripeConnectPayoutsEnabled: Boolean(user.stripeConnectPayoutsEnabled),
            stripeConnectDetailsSubmitted: Boolean(user.stripeConnectDetailsSubmitted),
            stripeConnectOnboardedAt: user.stripeConnectOnboardedAt,
            stripeConnectPayoutReady:
                Boolean(user.stripeConnectDetailsSubmitted) &&
                Boolean(user.stripeConnectChargesEnabled) &&
                Boolean(user.stripeConnectPayoutsEnabled),
        });
    } catch (error) {
        console.error('User me error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.put('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        const { displayName, bio, avatarUrl } = req.body;
        const { locale } = req.body;

        if (typeof displayName === 'string') {
            user.displayName = displayName.trim();
        }
        if (typeof bio === 'string') {
            user.bio = bio.trim();
        }
        if (typeof avatarUrl === 'string' && avatarUrl.trim()) {
            user.avatarUrl = avatarUrl.trim();
        }
        if (typeof locale === 'string' && locale.trim()) {
            user.locale = locale.trim().split('-')[0].toLowerCase();
        }

        await user.save();

        const access = buildAccessContext(user);
        return res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            role: normalizeRole(user.role),
            displayName: user.displayName || user.username,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            ageVerified: Boolean(user.ageVerifiedAt),
            emailVerified: Boolean(user.emailVerifiedAt),
            locale: user.locale,
            accessPassActive: user.accessPassActive,
            subscriptionActive: user.subscriptionActive,
            subscriptionStatus: access.subscriptionStatus,
            passStatus: access.passStatus,
            premiumAccess: access.premiumAccess,
            verifiedCreator: user.verifiedCreator,
            isSuspended: user.isSuspended,
            stripeConnectAccountId: user.stripeConnectAccountId,
            stripeConnectChargesEnabled: Boolean(user.stripeConnectChargesEnabled),
            stripeConnectPayoutsEnabled: Boolean(user.stripeConnectPayoutsEnabled),
            stripeConnectDetailsSubmitted: Boolean(user.stripeConnectDetailsSubmitted),
            stripeConnectOnboardedAt: user.stripeConnectOnboardedAt,
            stripeConnectPayoutReady:
                Boolean(user.stripeConnectDetailsSubmitted) &&
                Boolean(user.stripeConnectChargesEnabled) &&
                Boolean(user.stripeConnectPayoutsEnabled),
        });
    } catch (error) {
        console.error('User update error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Profil public par username
router.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('username displayName avatarUrl bio verifiedCreator role createdAt');
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

        const Content = require('../models/Content');
        const [contents, totalLikes, totalViews] = await Promise.all([
            Content.find({ creator: user._id }).countDocuments(),
            Content.aggregate([{ $match: { creator: user._id } }, { $group: { _id: null, total: { $sum: '$stats.likes' } } }]),
            Content.aggregate([{ $match: { creator: user._id } }, { $group: { _id: null, total: { $sum: '$stats.views' } } }]),
        ]);

        return res.json({
            _id: user._id,
            username: user.username,
            displayName: user.displayName || user.username,
            avatarUrl: user.avatarUrl || '/default-avatar.svg',
            bio: user.bio || '',
            verifiedCreator: user.verifiedCreator || false,
            stats: {
                totalContent: contents,
                totalLikes: totalLikes[0]?.total || 0,
                totalViews: totalViews[0]?.total || 0,
                subscribers: 0,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
