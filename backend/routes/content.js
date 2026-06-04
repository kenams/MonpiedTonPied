const express = require('express');
const Content = require('../models/Content');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { signToken } = require('../utils/mediaTokens');
const { hasPremiumAccess, normalizeRole } = require('../utils/accessControl');

const router = express.Router();
const PREVIEW_LIMIT = Number(process.env.PREVIEW_LIMIT || 1);

function formatFeedItem(item, currentUser, purchasedIds, canAccessAll) {
    const creatorId = item.creator?._id?.toString() || '';
    const isOwner = currentUser && creatorId === currentUser._id.toString();
    const purchased = purchasedIds.has(item._id.toString());
    const unlocked = isOwner || canAccessAll || purchased;

    const files = item.files.map((file, index) => {
        const signedUrl = getUploadsPath(file.url) ? signMediaUrl(item._id, index) : file.url;
        return {
            url: (!unlocked && index > 0) ? null : signedUrl,
            type: file.type,
            thumbnail: file.thumbnail || null,
            price: file.price || null,
        };
    });

    return {
        _id: item._id,
        title: item.title,
        description: item.description,
        creator: {
            _id: creatorId,
            username: item.creator?.username || 'Anonyme',
            displayName: item.creator?.displayName || item.creator?.username || 'Anonyme',
            avatarUrl: item.creator?.avatarUrl || '/default-avatar.svg',
            verifiedCreator: item.creator?.verifiedCreator || false,
        },
        files,
        tags: item.tags || [],
        category: item.category || 'all',
        price: item.price || 0,
        locked: !unlocked,
        stats: item.stats,
        liked: currentUser ? (item.likedBy || []).map(id => id.toString()).includes(currentUser._id.toString()) : false,
    };
}
const MEDIA_TOKEN_TTL_MS = Number(process.env.MEDIA_TOKEN_TTL_MS || 10 * 60 * 1000);

const hasPurchase = async (user, contentId) => {
    if (!user || !contentId) return false;
    const purchase = await Purchase.findOne({ user: user._id, content: contentId });
    return Boolean(purchase);
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

router.get('/', optionalAuth, async (req, res) => {
    try {
        const currentUser = req.currentUser || (req.user ? await User.findById(req.user.id) : null);
        const canAccessAll = hasPremiumAccess(currentUser);

        const filter = {};
        if (req.query.mine === 'true' && currentUser) {
            filter.creator = currentUser._id;
        } else if (req.query.creator) {
            const c = await User.findOne({ username: req.query.creator });
            if (c) filter.creator = c._id;
        }

        const items = await Content.find(filter)
            .sort({ createdAt: -1 })
            .limit(200)
            .populate('creator', 'username displayName avatarUrl role verifiedCreator');

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
                const isPreview = !canAccessAll && count < PREVIEW_LIMIT;
                previewCount.set(creatorId, count + 1);

                const isOwner =
                    currentUser && creatorId === currentUser._id.toString();
                const unlocked =
                    isOwner || canAccessAll || purchasedIds.has(item._id.toString()) || isPreview;
                const canShowMedia = unlocked || isPreview;

                return {
                    _id: item._id,
                    title: item.title,
                    description: item.description,
                    creator: {
                        id: creatorId,
                        username: item.creator?.username || 'Anonyme',
                        displayName: item.creator?.displayName || item.creator?.username || 'Anonyme',
                        avatarUrl: item.creator?.avatarUrl || '/default-avatar.svg',
                    },
                    previewUrl: canShowMedia
                        ? getUploadsPath(item.files?.[0]?.url)
                            ? signMediaUrl(item._id, 0)
                            : item.files?.[0]?.url || null
                        : null,
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
        const currentUser = req.currentUser || (req.user ? await User.findById(req.user.id) : null);
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
        const canAccessAll = hasPremiumAccess(currentUser);
        const purchased = await hasPurchase(currentUser, item._id);

        const previewItems = await Content.find({ creator: item.creator?._id })
            .sort({ createdAt: -1 })
            .limit(PREVIEW_LIMIT)
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
                avatarUrl: item.creator?.avatarUrl || '/default-avatar.svg',
            },
            files: item.files.map((file, index) => {
                const isPreviewFile = isPreview && index === 0;
                const isLocked = !canAccess && !isPreviewFile;
                const signedUrl = getUploadsPath(file.url)
                    ? signMediaUrl(item._id, index)
                    : file.url;
                return {
                    ...(file.toObject ? file.toObject() : file),
                    url: isLocked ? null : signedUrl,
                    isLocked,
                };
            }),
            canAccess,
            isPreview,
            stats: item.stats,
        });
    } catch (error) {
        console.error('Content detail error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Contenus likés par l'utilisateur
router.get('/liked', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await Content.find({ likedBy: userId })
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('creator', 'username displayName avatarUrl verifiedCreator');

        return res.json({
            items: items.map(item => ({
                _id: item._id,
                title: item.title,
                files: item.files.map(f => ({ url: f.url, type: f.type, thumbnail: f.thumbnail })),
                stats: item.stats,
                creator: {
                    _id: item.creator?._id,
                    username: item.creator?.username,
                    displayName: item.creator?.displayName,
                    avatarUrl: item.creator?.avatarUrl,
                },
                locked: false,
            }))
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Feed paginated avec catégorie et tags + recommandations IA
router.get('/feed', optionalAuth, async (req, res) => {
    try {
        const currentUser = req.currentUser || (req.user ? await User.findById(req.user.id) : null);
        const canAccessAll = hasPremiumAccess(currentUser);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(20, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const { category, tag, creator: creatorUsername, recommended } = req.query;

        // Mode recommandations IA (page 1, utilisateur connecté, pas de filtre catégorie)
        if (recommended === 'true' && currentUser && !category && !tag) {
            const { getRecommendations } = require('../utils/recommendations');
            const docs = await getRecommendations(currentUser._id, { limit: limit + skip });
            const sliced = docs.slice(skip, skip + limit);
            const purchases = currentUser
                ? await Purchase.find({ user: currentUser._id, content: { $in: sliced.map(d => d._id) } })
                : [];
            const purchasedIds = new Set(purchases.map(p => p.content.toString()));

            const items = sliced.map(item => formatFeedItem(item, currentUser, purchasedIds, canAccessAll));
            return res.json({ items, hasMore: skip + sliced.length < docs.length, total: docs.length });
        }

        const filter = {};
        if (category && category !== 'all') filter.category = category;
        if (tag) filter.tags = tag;
        if (creatorUsername) {
            const c = await User.findOne({ username: creatorUsername });
            if (c) filter.creator = c._id;
        }

        const [docs, total] = await Promise.all([
            Content.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('creator', 'username displayName avatarUrl role verifiedCreator'),
            Content.countDocuments(filter),
        ]);

        const purchases = currentUser
            ? await Purchase.find({ user: currentUser._id, content: { $in: docs.map(d => d._id) } })
            : [];
        const purchasedIds = new Set(purchases.map(p => p.content.toString()));

        const items = docs.map(item => formatFeedItem(item, currentUser, purchasedIds, canAccessAll));
        return res.json({ items, hasMore: skip + docs.length < total, total });
    } catch (error) {
        console.error('Feed error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Like / unlike
router.post('/:id/like', auth, async (req, res) => {
    try {
        const item = await Content.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Introuvable.' });

        const userId = req.user.id;
        const alreadyLiked = item.likedBy.map(id => id.toString()).includes(userId);

        if (alreadyLiked) {
            item.likedBy.pull(userId);
            item.stats.likes = Math.max(0, (item.stats.likes || 0) - 1);
        } else {
            item.likedBy.push(userId);
            item.stats.likes = (item.stats.likes || 0) + 1;
        }
        await item.save();
        return res.json({ liked: !alreadyLiked, likes: item.stats.likes });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { title, description, files, tags, category, price } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur invalide.' });
        }
        const role = normalizeRole(user.role);
        if (role !== 'creator' && role !== 'admin') {
            return res.status(403).json({ message: 'Compte créateur requis.' });
        }

        const content = await Content.create({
            title: title || `Publication de @${user.username}`,
            description: description || '',
            files: Array.isArray(files) ? files : [],
            tags: Array.isArray(tags) ? tags.slice(0, 20) : [],
            category: category || 'all',
            price: typeof price === 'number' ? price : 0,
            creator: user._id,
        });

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
            tags: content.tags,
            category: content.category,
            price: content.price,
            stats: content.stats,
        });
    } catch (error) {
        console.error('Content create error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
