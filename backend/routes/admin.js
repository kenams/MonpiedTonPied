const express = require('express');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const { buildAccessContext, normalizeRole } = require('../utils/accessControl');
const { buildUserFilters, buildPaymentFilters } = require('../utils/adminFilters');
const AdminAuditLog = require('../models/AdminAuditLog');

const router = express.Router();

router.get('/users', auth, requireAdmin, async (req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        const filters = buildUserFilters(req.query);

        const take = Math.min(Number(limit) || 50, 200);
        const skip = (Number(page) - 1) * take;
        const [users, total] = await Promise.all([
            User.find(filters).sort({ createdAt: -1 }).skip(skip).limit(take),
            User.countDocuments(filters),
        ]);
        return res.json({
            total,
            page: Number(page),
            pageSize: take,
            items: users.map((user) => {
                const access = buildAccessContext(user);
                return {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    displayName: user.displayName,
                    role: normalizeRole(user.role),
                    subscriptionStatus: access.subscriptionStatus,
                    passStatus: access.passStatus,
                    premiumAccess: access.premiumAccess,
                    isSuspended: user.isSuspended,
                    createdAt: user.createdAt,
                };
            }),
        });
    } catch (error) {
        console.error('Admin users error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.patch('/users/:id/suspend', auth, requireAdmin, async (req, res) => {
    try {
        const { suspended, until } = req.body || {};
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }
        user.isSuspended = Boolean(suspended);
        user.suspendedUntil = suspended && until ? new Date(until) : null;
        await user.save();
        await AdminAuditLog.create({
            admin: req.user.id,
            action: user.isSuspended ? 'user.suspend' : 'user.unsuspend',
            targetType: 'user',
            targetId: user._id.toString(),
            details: {
                email: user.email,
                suspendedUntil: user.suspendedUntil,
            },
        });
        return res.json({ message: 'Statut mis a jour.' });
    } catch (error) {
        console.error('Admin suspend error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.get('/subscriptions', auth, requireAdmin, async (req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        const take = Math.min(Number(limit) || 50, 200);
        const skip = (Number(page) - 1) * take;
        const [subs, total] = await Promise.all([
            Subscription.find()
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(take)
                .populate('user', 'email username displayName'),
            Subscription.countDocuments(),
        ]);
        return res.json({
            total,
            page: Number(page),
            pageSize: take,
            items: subs.map((sub) => ({
                id: sub._id,
                user: sub.user && {
                    id: sub.user._id,
                    email: sub.user.email,
                    username: sub.user.username,
                    displayName: sub.user.displayName,
                },
                stripeSubscriptionId: sub.stripeSubscriptionId,
                status: sub.status,
                currentPeriodEnd: sub.currentPeriodEnd,
                cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                priceId: sub.priceId,
                updatedAt: sub.updatedAt,
            })),
        });
    } catch (error) {
        console.error('Admin subscriptions error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.get('/payments', auth, requireAdmin, async (req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        const take = Math.min(Number(limit) || 50, 200);
        const skip = (Number(page) - 1) * take;
        const filters = buildPaymentFilters(req.query);
        const [payments, total] = await Promise.all([
            Payment.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .populate('user', 'email username displayName'),
            Payment.countDocuments(filters),
        ]);
        return res.json({
            total,
            page: Number(page),
            pageSize: take,
            items: payments.map((payment) => ({
                id: payment._id,
                user: payment.user && {
                    id: payment.user._id,
                    email: payment.user.email,
                    username: payment.user.username,
                    displayName: payment.user.displayName,
                },
                type: payment.type,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                createdAt: payment.createdAt,
            })),
        });
    } catch (error) {
        console.error('Admin payments error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.get('/audit-logs', auth, requireAdmin, async (req, res) => {
    try {
        const { limit = 50, page = 1, action, q } = req.query;
        const take = Math.min(Number(limit) || 50, 200);
        const skip = (Number(page) - 1) * take;
        const filters = {};
        if (action) {
            filters.action = action;
        }
        if (q) {
            filters.$or = [
                { action: { $regex: q, $options: 'i' } },
                { targetType: { $regex: q, $options: 'i' } },
                { targetId: { $regex: q, $options: 'i' } },
            ];
        }
        const [items, total] = await Promise.all([
            AdminAuditLog.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .populate('admin', 'email username displayName'),
            AdminAuditLog.countDocuments(filters),
        ]);
        return res.json({
            total,
            page: Number(page),
            pageSize: take,
            items: items.map((item) => ({
                id: item._id,
                action: item.action,
                targetType: item.targetType,
                targetId: item.targetId,
                details: item.details,
                createdAt: item.createdAt,
                admin: item.admin && {
                    id: item.admin._id,
                    email: item.admin.email,
                    username: item.admin.username,
                    displayName: item.admin.displayName,
                },
            })),
        });
    } catch (error) {
        console.error('Admin audit logs error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
