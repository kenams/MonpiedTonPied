const SUBSCRIPTION_STATUSES = [
    'none',
    'pending',
    'active',
    'canceled',
    'expired',
    'suspended',
];

const PASS_STATUSES = ['none', 'active', 'expired', 'suspended'];

const normalizeRole = (role) => {
    if (!role) return 'guest';
    return role === 'user' ? 'consumer' : role;
};

const isExpired = (date) => {
    if (!date) return false;
    const ts = new Date(date).getTime();
    return Number.isFinite(ts) && ts <= Date.now();
};

const getSubscriptionStatus = (user) => {
    if (!user) return 'none';
    if (user.isSuspended) return 'suspended';
    if (user.subscriptionActive) {
        if (isExpired(user.subscriptionExpiresAt)) return 'expired';
        return 'active';
    }
    if (user.stripeSubscriptionId) return 'pending';
    return 'none';
};

const getPassStatus = (user) => {
    if (!user) return 'none';
    if (user.isSuspended) return 'suspended';
    if (user.accessPassActive) {
        if (isExpired(user.accessPassExpiresAt)) return 'expired';
        return 'active';
    }
    return 'none';
};

const hasPremiumAccess = (user) => {
    if (!user) return false;
    const role = normalizeRole(user.role);
    if (role === 'creator' || role === 'admin') return true;
    const subscriptionStatus = getSubscriptionStatus(user);
    if (subscriptionStatus === 'active') return true;
    const passStatus = getPassStatus(user);
    if (passStatus === 'active') return true;
    return false;
};

const hasSubscriptionAccess = (user) => {
    if (!user) return false;
    const role = normalizeRole(user.role);
    if (role === 'creator' || role === 'admin') return true;
    const subscriptionStatus = getSubscriptionStatus(user);
    return subscriptionStatus === 'active';
};

const buildAccessContext = (user) => ({
    role: normalizeRole(user?.role),
    subscriptionStatus: getSubscriptionStatus(user),
    passStatus: getPassStatus(user),
    premiumAccess: hasPremiumAccess(user),
});

module.exports = {
    SUBSCRIPTION_STATUSES,
    PASS_STATUSES,
    normalizeRole,
    getSubscriptionStatus,
    getPassStatus,
    hasPremiumAccess,
    hasSubscriptionAccess,
    buildAccessContext,
    isExpired,
};
