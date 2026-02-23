const express = require('express');
const User = require('../models/User');
const Content = require('../models/Content');
const Purchase = require('../models/Purchase');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

const isActive = (expiresAt) => {
    if (!expiresAt) return true;
    return new Date(expiresAt).getTime() > Date.now();
};

const canAccessAll = (user) => {
    if (!user) return false;
    const role = user.role === 'user' ? 'consumer' : user.role;
    if (role === 'creator' || role === 'admin') return true;
    if (user.subscriptionActive && isActive(user.subscriptionExpiresAt)) return true;
    if (user.accessPassActive && isActive(user.accessPassExpiresAt)) return true;
    return false;
};

router.get('/', async (req, res) => {
    try {
        const creators = await User.find({ role: 'creator' })
            .sort({ createdAt: -1 })
            .limit(100);

        return res.json(
            creators.map((creator) => ({
                id: creator._id,
                username: creator.username,
                displayName: creator.displayName || creator.username,
                bio: creator.bio || '',
                avatarUrl: creator.avatarUrl,
                verified: Boolean(creator.verifiedCreator),
                isSuspended: Boolean(creator.isSuspended),
            }))
        );
    } catch (error) {
        console.error('Creators list error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const creator = await User.findById(req.params.id);
        if (!creator || creator.role !== 'creator') {
            return res.status(404).json({ message: 'Créateur introuvable.' });
        }
        if (creator.isSuspended) {
            return res.status(403).json({ message: 'Profil temporairement suspendu.' });
        }

        const viewer = req.user ? await User.findById(req.user.id) : null;
        const canAccess = canAccessAll(viewer);

        const contents = await Content.find({ creator: creator._id })
            .sort({ createdAt: -1 })
            .limit(200);

        const previewIds = new Set(
            contents.slice(0, 3).map((item) => item._id.toString())
        );

        const purchases = viewer
            ? await Purchase.find({
                  user: viewer._id,
                  content: { $in: contents.map((c) => c._id) },
              })
            : [];
        const purchasedIds = new Set(purchases.map((p) => p.content.toString()));

        return res.json({
            id: creator._id,
            username: creator.username,
            displayName: creator.displayName || creator.username,
            bio: creator.bio || '',
            avatarUrl: creator.avatarUrl,
            verified: Boolean(creator.verifiedCreator),
            isSuspended: Boolean(creator.isSuspended),
            contents: contents.map((item) => {
                const isPreview = previewIds.has(item._id.toString());
                const isOwner = viewer && viewer._id.toString() === creator._id.toString();
                const unlocked = isOwner || canAccess || purchasedIds.has(item._id.toString()) || isPreview;
                return {
                    id: item._id,
                    title: item.title,
                    description: item.description,
                    previewUrl: item.files?.[0]?.url || null,
                    price: item.files?.[0]?.price ?? null,
                    unlocked,
                    isPreview,
                };
            }),
        });
    } catch (error) {
        console.error('Creator detail error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
