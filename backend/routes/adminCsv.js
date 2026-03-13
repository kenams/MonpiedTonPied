const express = require('express');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { buildAccessContext, normalizeRole } = require('../utils/accessControl');
const { buildUserFilters, buildPaymentFilters } = require('../utils/adminFilters');
const AdminAuditLog = require('../models/AdminAuditLog');

const router = express.Router();

const escapeCsv = (value) => {
    const str = value === null || value === undefined ? '' : String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/\"/g, '""')}"`;
    }
    return str;
};

router.get('/users.csv', auth, requireAdmin, async (req, res) => {
    try {
        const filters = buildUserFilters(req.query);
        const users = await User.find(filters).sort({ createdAt: -1 }).limit(5000);
        const header = [
            'id',
            'email',
            'username',
            'displayName',
            'role',
            'subscriptionStatus',
            'passStatus',
            'premiumAccess',
            'isSuspended',
            'emailVerified',
            'createdAt',
        ];
        const rows = users.map((user) => {
            const access = buildAccessContext(user);
            return [
                user._id,
                user.email,
                user.username,
                user.displayName,
                normalizeRole(user.role),
                access.subscriptionStatus,
                access.passStatus,
                access.premiumAccess,
                user.isSuspended,
                Boolean(user.emailVerifiedAt),
                user.createdAt?.toISOString(),
            ].map(escapeCsv);
        });
        await AdminAuditLog.create({
            admin: req.user.id,
            action: 'export.users.csv',
            targetType: 'user',
            details: { filters: req.query, count: users.length },
        });
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
        return res.send([header.join(','), ...rows.map((r) => r.join(','))].join('\n'));
    } catch (error) {
        console.error('Admin CSV users error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.get('/payments.csv', auth, requireAdmin, async (req, res) => {
    try {
        const filters = buildPaymentFilters(req.query);
        const payments = await Payment.find(filters)
            .sort({ createdAt: -1 })
            .limit(5000)
            .populate('user', 'email username');
        const header = [
            'id',
            'userEmail',
            'userUsername',
            'type',
            'status',
            'amount',
            'currency',
            'createdAt',
        ];
        const rows = payments.map((payment) => [
            payment._id,
            payment.user?.email || '',
            payment.user?.username || '',
            payment.type,
            payment.status,
            payment.amount,
            payment.currency,
            payment.createdAt?.toISOString(),
        ].map(escapeCsv));
        await AdminAuditLog.create({
            admin: req.user.id,
            action: 'export.payments.csv',
            targetType: 'payment',
            details: { filters: req.query, count: payments.length },
        });
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="payments.csv"');
        return res.send([header.join(','), ...rows.map((r) => r.join(','))].join('\n'));
    } catch (error) {
        console.error('Admin CSV payments error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
