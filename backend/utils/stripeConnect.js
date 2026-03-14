const CONNECT_COUNTRY = process.env.STRIPE_CONNECT_COUNTRY || 'FR';

const getConnectState = (user) => ({
    accountId: user.stripeConnectAccountId || null,
    detailsSubmitted: Boolean(user.stripeConnectDetailsSubmitted),
    chargesEnabled: Boolean(user.stripeConnectChargesEnabled),
    payoutsEnabled: Boolean(user.stripeConnectPayoutsEnabled),
    onboardedAt: user.stripeConnectOnboardedAt || null,
    payoutReady:
        Boolean(user.stripeConnectDetailsSubmitted) &&
        Boolean(user.stripeConnectChargesEnabled) &&
        Boolean(user.stripeConnectPayoutsEnabled),
});

const applyConnectAccountSnapshot = (user, account) => {
    if (!account) {
        return getConnectState(user);
    }

    user.stripeConnectAccountId = account.id || user.stripeConnectAccountId || null;
    user.stripeConnectDetailsSubmitted = Boolean(account.details_submitted);
    user.stripeConnectChargesEnabled = Boolean(account.charges_enabled);
    user.stripeConnectPayoutsEnabled = Boolean(account.payouts_enabled);
    if (user.stripeConnectDetailsSubmitted && !user.stripeConnectOnboardedAt) {
        user.stripeConnectOnboardedAt = new Date();
    }
    return getConnectState(user);
};

const syncConnectAccount = async (user, stripe) => {
    if (!user?.stripeConnectAccountId) {
        return getConnectState(user);
    }
    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
    const state = applyConnectAccountSnapshot(user, account);
    await user.save();
    return state;
};

const ensureConnectAccount = async (user, stripe) => {
    if (user.stripeConnectAccountId) {
        return syncConnectAccount(user, stripe);
    }

    const account = await stripe.accounts.create({
        type: 'express',
        country: CONNECT_COUNTRY,
        email: user.email,
        business_type: 'individual',
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
        metadata: {
            userId: user._id.toString(),
            role: user.role,
        },
    });

    const state = applyConnectAccountSnapshot(user, account);
    await user.save();
    return state;
};

module.exports = {
    CONNECT_COUNTRY,
    getConnectState,
    applyConnectAccountSnapshot,
    syncConnectAccount,
    ensureConnectAccount,
};
