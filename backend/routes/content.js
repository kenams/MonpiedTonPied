const express = require('express');
const Content = require('../models/Content');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

const isActive = (expiresAt) => {
    if (!expiresAt) return true;
    return new Date(expiresAt).getTime() > Date.now();
};

const getRole = (user) => {
    if (!user) return null;
    return user.role === 'user' ? 'consumer' : user.role;
};

const hasGlobalAccess = (user) => {
    if (!user) return false;
    const role = getRole(user);
    if (role === 'creator' || role === 'admin') return true;
    if (user.subscriptionActive && isActive(user.subscriptionExpiresAt)) return true;
    if (user.accessPassActive && isActive(user.accessPassExpiresAt)) return true;
    return false;
};

const hasPurchase = async (user, contentId) => {
    if (!user || !contentId) return false;
    const purchase = await Purchase.findOne({ user: user._id, content: contentId });
    return Boolean(purchase);
};

router.get('/', optionalAuth, async (req, res) => {
    try {
        const currentUser = req.user ? await User.findById(req.user.id) : null;
        const canAccessAll = hasGlobalAccess(currentUser);

        const items = await Content.find()
            .sort({ createdAt: -1 })
            .limit(200)
            .populate('creator', 'username displayName avatarUrl role');

        const purchases = currentUser
            ? await Purchase.find({
                  user: currentUser._id,
                  content: { $in: items.map((item) => item._id) },
              })
            : [];
        const purchasedIds = new Set(purchases.map((p) => p.content.toString()));

        const previewCount = new Map();

        return res.json(
            items.map((item) => {
                const creatorId = item.creator?._id?.toString() || 'unknown';
                const count = previewCount.get(creatorId) || 0;
                const isPreview = !canAccessAll && count < 3;
                previewCount.set(creatorId, count + 1);

                const isOwner =
                    currentUser && creatorId === currentUser._id.toString();
                const unlocked =
                    isOwner || canAccessAll || purchasedIds.has(item._id.toString()) || isPreview;

                return {
                    _id: item._id,
                    title: item.title,
                    description: item.description,
                    creator: {
                        id: creatorId,
                        username: item.creator?.username || 'Anonyme',
                        displayName: item.creator?.displayName || item.creator?.username || 'Anonyme',
                        avatarUrl: item.creator?.avatarUrl || '/default-avatar.png',
                    },
                    previewUrl: item.files?.[0]?.url || null,
                    price: item.files?.[0]?.price ?? null,
                    unlocked,
                    isPreview,
                    stats: item.stats,
                };
            })
        );
    } catch (error) {
        console.error('Content list error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const currentUser = req.user ? await User.findById(req.user.id) : null;
        const item = await Content.findById(req.params.id).populate(
            'creator',
            'username displayName avatarUrl role'
        );

        if (!item) {
            return res.status(404).json({ message: 'Contenu introuvable.' });
        }

        const creatorId = item.creator?._id?.toString();
        const isOwner =
            currentUser && creatorId === currentUser._id.toString();
        const canAccessAll = hasGlobalAccess(currentUser);
        const purchased = await hasPurchase(currentUser, item._id);

        const previewItems = await Content.find({ creator: item.creator?._id })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('_id');
        const previewIds = new Set(previewItems.map((doc) => doc._id.toString()));
        const isPreview = previewIds.has(item._id.toString());

        const canAccess = isOwner || canAccessAll || purchased;

        return res.json({
            _id: item._id,
            title: item.title,
            description: item.description,
            creator: {
                id: creatorId,
                username: item.creator?.username || 'Anonyme',
                displayName: item.creator?.displayName || item.creator?.username || 'Anonyme',
                avatarUrl: item.creator?.avatarUrl || '/default-avatar.png',
            },
            files: item.files.map((file, index) => ({
                ...(file.toObject ? file.toObject() : file),
                isLocked: !canAccess && !(isPreview && index === 0),
            })),
            canAccess,
            isPreview,
            stats: item.stats,
        });
    } catch (error) {
        console.error('Content detail error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { title, description, files } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Titre requis.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur invalide.' });
        }

        const content = await Content.create({
            title,
            description: description || '',
            files: Array.isArray(files) ? files : [],
            creator: user._id,
        });

        const role = user.role === 'user' ? 'consumer' : user.role;
        if (role !== 'creator' && role !== 'admin') {
            return res.status(403).json({ message: 'Compte créateur requis.' });
        }

        return res.status(201).json({
            _id: content._id,
            title: content.title,
            description: content.description,
            creator: {
                id: user._id,
                username: user.username,
                displayName: user.displayName || user.username,
                avatarUrl: user.avatarUrl,
            },
            files: content.files,
            stats: content.stats,
        });
    } catch (error) {
        console.error('Content create error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
