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
        });
    } catch (error) {
        console.error('User update error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
