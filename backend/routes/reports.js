const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Report = require('../models/Report');
const { refreshCreatorStatus } = require('../utils/moderation');

const router = express.Router();

const blockedWords = ['raciste', 'racisme', 'nazi', 'haine', 'violence'];

const containsBlockedText = (text) => {
    const lower = text.toLowerCase();
    return blockedWords.some((word) => lower.includes(word));
};

router.post('/', auth, async (req, res) => {
    try {
        const { targetType, targetId, reason, details } = req.body;
        if (!targetType || !targetId || !reason) {
            return res.status(400).json({ message: 'Champs requis manquants.' });
        }
        if (containsBlockedText(reason) || (details && containsBlockedText(details))) {
            return res.status(400).json({ message: 'Mot interdit.' });
        }

        const report = await Report.create({
            reporter: req.user.id,
            targetType,
            targetId: targetId.toString(),
            reason: reason.trim(),
            details: details ? details.trim() : '',
        });

        if (targetType === 'user') {
            await refreshCreatorStatus(targetId.toString());
        }

        return res.status(201).json({
            id: report._id,
            status: report.status,
        });
    } catch (error) {
        console.error('Report create error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        const role = user.role === 'user' ? 'consumer' : user.role;
        const filter = role === 'admin' ? {} : { reporter: user._id };

        const reports = await Report.find(filter).sort({ createdAt: -1 }).limit(200);
        return res.json(
            reports.map((report) => ({
                id: report._id,
                targetType: report.targetType,
                targetId: report.targetId,
                reason: report.reason,
                details: report.details,
                status: report.status,
                createdAt: report.createdAt,
            }))
        );
    } catch (error) {
        console.error('Report list error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }
        const role = user.role === 'user' ? 'consumer' : user.role;
        if (role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé.' });
        }
        if (!['open', 'reviewing', 'resolved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Statut invalide.' });
        }
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Signalement introuvable.' });
        }
        report.status = status;
        await report.save();
        return res.json({ message: 'Statut mis à jour.' });
    } catch (error) {
        console.error('Report status error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
