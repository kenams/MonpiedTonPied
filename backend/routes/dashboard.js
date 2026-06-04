const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Content = require('../models/Content');
const Purchase = require('../models/Purchase');
const CustomRequest = require('../models/CustomRequest');

const router = express.Router();

router.get('/creator', auth, async (req, res) => {
    try {
        const user = req.currentUser || (await User.findById(req.user.id));
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }
        const role = normalizeRole(user.role);
        if (role !== 'creator' && role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        const contents = await Content.find({ creator: user._id }).select('_id title createdAt');
        const contentIds = contents.map((item) => item._id);

        const purchases = contentIds.length
            ? await Purchase.find({ content: { $in: contentIds } })
            : [];

        const totalSales = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalPlatformFees = purchases.reduce(
            (sum, p) => sum + (p.platformFee || 0),
            0
        );
        const totalCreatorRevenue = purchases.reduce(
            (sum, p) => sum + (p.creatorAmount || 0),
            0
        );

        const requests = await CustomRequest.find({ creator: user._id }).sort({
            createdAt: -1,
        });
        const requestStats = requests.reduce(
            (acc, reqItem) => {
                acc.total += 1;
                acc[reqItem.status] = (acc[reqItem.status] || 0) + 1;
                return acc;
            },
            { total: 0 }
        );

        return res.json({
            contentCount: contents.length,
            totalSales,
            totalPlatformFees,
            totalCreatorRevenue,
            requestStats,
            latestRequests: requests.slice(0, 5).map((reqItem) => ({
                id: reqItem._id,
                status: reqItem.status,
                price: reqItem.price,
                createdAt: reqItem.createdAt,
            })),
        });
    } catch (error) {
        console.error('Creator dashboard error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Route /api/dashboard/stats — stats pour le dashboard frontend
router.get('/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'Introuvable.' });

        const startOfMonth = new Date();
        startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

        const contents = await Content.find({ creator: user._id });
        const contentIds = contents.map(c => c._id);

        const [allPurchases, monthPurchases] = await Promise.all([
            contentIds.length ? Purchase.find({ content: { $in: contentIds } }) : [],
            contentIds.length ? Purchase.find({ content: { $in: contentIds }, createdAt: { $gte: startOfMonth } }) : [],
        ]);

        const totalViews = contents.reduce((s, c) => s + (c.stats?.views || 0), 0);
        const totalLikes = contents.reduce((s, c) => s + (c.stats?.likes || 0), 0);
        const totalRevenue = allPurchases.reduce((s, p) => s + (p.creatorAmount || p.amount || 0), 0);
        const thisMonthRevenue = monthPurchases.reduce((s, p) => s + (p.creatorAmount || p.amount || 0), 0);

        return res.json({
            totalRevenue,
            thisMonthRevenue,
            totalViews,
            totalLikes,
            totalSubscribers: 0,
            contentCount: contents.length,
            pendingPayout: 0,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
const { normalizeRole } = require('../utils/accessControl');
