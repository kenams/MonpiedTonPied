const express = require('express');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const items = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(100);
        return res.json(
            items.map((item) => ({
                id: item._id,
                type: item.type,
                title: item.title,
                message: item.message,
                metadata: item.metadata,
                createdAt: item.createdAt,
                readAt: item.readAt,
            }))
        );
    } catch (error) {
        console.error('Notifications list error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/read', auth, async (req, res) => {
    try {
        const { ids } = req.body || {};
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'IDs requis.' });
        }
        await Notification.updateMany(
            { _id: { $in: ids }, user: req.user.id },
            { $set: { readAt: new Date() } }
        );
        return res.json({ message: 'Notifications mises a jour.' });
    } catch (error) {
        console.error('Notifications read error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
