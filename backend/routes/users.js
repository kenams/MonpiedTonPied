const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        return res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role === 'user' ? 'consumer' : user.role,
            displayName: user.displayName || user.username,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            ageVerified: Boolean(user.ageVerifiedAt),
            accessPassActive: user.accessPassActive,
            subscriptionActive: user.subscriptionActive,
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

        if (typeof displayName === 'string') {
            user.displayName = displayName.trim();
        }
        if (typeof bio === 'string') {
            user.bio = bio.trim();
        }
        if (typeof avatarUrl === 'string' && avatarUrl.trim()) {
            user.avatarUrl = avatarUrl.trim();
        }

        await user.save();

        return res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role === 'user' ? 'consumer' : user.role,
            displayName: user.displayName || user.username,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            ageVerified: Boolean(user.ageVerifiedAt),
            accessPassActive: user.accessPassActive,
            subscriptionActive: user.subscriptionActive,
            verifiedCreator: user.verifiedCreator,
            isSuspended: user.isSuspended,
        });
    } catch (error) {
        console.error('User update error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
