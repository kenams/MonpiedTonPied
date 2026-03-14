const express = require('express');
const User = require('../models/User');
const Content = require('../models/Content');
const Purchase = require('../models/Purchase');
const optionalAuth = require('../middleware/optionalAuth');
const { isOnline } = require('../utils/presenceStore');
const { signToken } = require('../utils/mediaTokens');
const { hasPremiumAccess } = require('../utils/accessControl');

const router = express.Router();
const PREVIEW_LIMIT = Number(process.env.PREVIEW_LIMIT || 1);
const ONLINE_WINDOW_MS = Number(process.env.ONLINE_WINDOW_MS || 5 * 60 * 1000);
const MEDIA_TOKEN_TTL_MS = Number(process.env.MEDIA_TOKEN_TTL_MS || 10 * 60 * 1000);

const canAccessAll = (user) => {
    if (!user) return false;
    return hasPremiumAccess(user);
};

const getUploadsPath = (value) => {
    if (!value) return null;
    if (value.startsWith('/uploads/')) return value;
    if (value.startsWith('http://') || value.startsWith('https://')) {
        try {
            const parsed = new URL(value);
            if (parsed.pathname.startsWith('/uploads/')) return parsed.pathname;
        } catch {
            return null;
        }
    }
    return null;
};

const signMediaUrl = (contentId, index) => {
    const token = signToken({
        c: contentId.toString(),
        i: index,
        exp: Date.now() + MEDIA_TOKEN_TTL_MS,
    });
    return `/api/media/${contentId}/${index}?token=${token}`;
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
                online: isOnline(creator._id, ONLINE_WINDOW_MS),
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

        const viewer = req.currentUser || (req.user ? await User.findById(req.user.id) : null);
        const canAccess = canAccessAll(viewer);

        const contents = await Content.find({ creator: creator._id })
            .sort({ createdAt: -1 })
            .limit(200);

        const previewIds = new Set(
            contents.slice(0, PREVIEW_LIMIT).map((item) => item._id.toString())
        );

        const purchases = viewer
            ? await Purchase.find({
                  user: viewer._id,
                  content: { $in: contents.map((c) => c._id) },
              })
            : [];
        const purchasedIds = new Set(purchases.map((p) => p.content.toString()));

        const mappedContents = contents.map((item) => {
            const isPreview = previewIds.has(item._id.toString());
            const isOwner = viewer && viewer._id.toString() === creator._id.toString();
            const unlocked =
                isOwner || canAccess || purchasedIds.has(item._id.toString()) || isPreview;
            const canShowMedia = unlocked || isPreview;
            return {
                id: item._id,
                title: item.title,
                description: item.description,
                previewUrl: canShowMedia
                    ? getUploadsPath(item.files?.[0]?.url)
                        ? signMediaUrl(item._id, 0)
                        : item.files?.[0]?.url || null
                    : null,
                previewType: item.files?.[0]?.type || null,
                price: item.files?.[0]?.price ?? null,
                unlocked,
                isPreview,
            };
        });

        const visibleContents = mappedContents;

        return res.json({
            id: creator._id,
            username: creator.username,
            displayName: creator.displayName || creator.username,
            bio: creator.bio || '',
            avatarUrl: creator.avatarUrl,
            verified: Boolean(creator.verifiedCreator),
            isSuspended: Boolean(creator.isSuspended),
            online: isOnline(creator._id, ONLINE_WINDOW_MS),
            contents: visibleContents,
        });
    } catch (error) {
        console.error('Creator detail error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
