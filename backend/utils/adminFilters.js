const buildUserFilters = (query = {}) => {
    const {
        q,
        role,
        suspended,
        subscriptionStatus,
        passStatus,
        premiumAccess,
        emailVerified,
    } = query;

    const now = new Date();
    const conditions = [];

    if (q) {
        conditions.push({
            $or: [
                { email: { $regex: q, $options: 'i' } },
                { username: { $regex: q, $options: 'i' } },
                { displayName: { $regex: q, $options: 'i' } },
            ],
        });
    }

    if (role) {
        conditions.push({ role });
    }

    if (typeof suspended === 'string') {
        conditions.push({ isSuspended: suspended === 'true' });
    }

    if (typeof emailVerified === 'string') {
        conditions.push(
            emailVerified === 'true'
                ? { emailVerifiedAt: { $ne: null } }
                : { emailVerifiedAt: null }
        );
    }

    if (typeof subscriptionStatus === 'string') {
        switch (subscriptionStatus) {
            case 'active':
                conditions.push({
                    subscriptionActive: true,
                    subscriptionExpiresAt: { $gt: now },
                });
                break;
            case 'expired':
                conditions.push({
                    subscriptionActive: true,
                    subscriptionExpiresAt: { $lte: now },
                });
                break;
            case 'pending':
            case 'canceled':
                conditions.push({
                    subscriptionActive: false,
                    stripeSubscriptionId: { $ne: null },
                });
                break;
            case 'none':
                conditions.push({
                    subscriptionActive: false,
                    stripeSubscriptionId: { $in: [null, undefined] },
                });
                break;
            case 'suspended':
                conditions.push({ isSuspended: true });
                break;
            default:
                break;
        }
    }

    if (typeof passStatus === 'string') {
        switch (passStatus) {
            case 'active':
                conditions.push({
                    accessPassActive: true,
                    accessPassExpiresAt: { $gt: now },
                });
                break;
            case 'expired':
                conditions.push({
                    accessPassActive: true,
                    accessPassExpiresAt: { $lte: now },
                });
                break;
            case 'none':
                conditions.push({ accessPassActive: false });
                break;
            case 'suspended':
                conditions.push({ isSuspended: true });
                break;
            default:
                break;
        }
    }

    if (typeof premiumAccess === 'string') {
        if (premiumAccess === 'true') {
            conditions.push({
                $or: [
                    { role: { $in: ['creator', 'admin'] } },
                    {
                        subscriptionActive: true,
                        subscriptionExpiresAt: { $gt: now },
                    },
                    {
                        accessPassActive: true,
                        accessPassExpiresAt: { $gt: now },
                    },
                ],
            });
        }
        if (premiumAccess === 'false') {
            conditions.push({ role: { $nin: ['creator', 'admin'] } });
            conditions.push({
                $or: [
                    { subscriptionActive: { $ne: true } },
                    { subscriptionExpiresAt: { $lte: now } },
                ],
            });
            conditions.push({
                $or: [
                    { accessPassActive: { $ne: true } },
                    { accessPassExpiresAt: { $lte: now } },
                ],
            });
        }
    }

    return conditions.length > 0 ? { $and: conditions } : {};
};

const buildPaymentFilters = (query = {}) => {
    const { q, type, status } = query;
    const conditions = [];

    if (type) {
        conditions.push({ type });
    }
    if (status) {
        conditions.push({ status });
    }
    if (q) {
        conditions.push({
            $or: [
                { 'metadata.invoiceId': { $regex: q, $options: 'i' } },
                { stripeSessionId: { $regex: q, $options: 'i' } },
                { stripePaymentIntentId: { $regex: q, $options: 'i' } },
            ],
        });
    }

    return conditions.length > 0 ? { $and: conditions } : {};
};

module.exports = { buildUserFilters, buildPaymentFilters };
