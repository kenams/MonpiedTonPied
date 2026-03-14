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
    user.stripeConnectEnv = account.livemode ? 'live' : 'test';
    if (user.stripeConnectDetailsSubmitted && !user.stripeConnectOnboardedAt) {
        user.stripeConnectOnboardedAt = new Date();
    }
    return getConnectState(user);
};

const resetConnectState = (user) => {
    user.stripeConnectAccountId = null;
    user.stripeConnectChargesEnabled = false;
    user.stripeConnectPayoutsEnabled = false;
    user.stripeConnectDetailsSubmitted = false;
    user.stripeConnectOnboardedAt = null;
    user.stripeConnectEnv = null;
    return getConnectState(user);
};

const syncConnectAccount = async (user, stripe, stripeMode = 'test') => {
    if (!user?.stripeConnectAccountId) {
        return getConnectState(user);
    }
    if (user.stripeConnectEnv && user.stripeConnectEnv !== stripeMode) {
        const state = resetConnectState(user);
        await user.save();
        return state;
    }
    try {
        const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
        const state = applyConnectAccountSnapshot(user, account);
        await user.save();
        return state;
    } catch (error) {
        if (error?.type === 'StripeInvalidRequestError' || error?.statusCode === 404) {
            const state = resetConnectState(user);
            await user.save();
            return state;
        }
        throw error;
    }
};

const ensureConnectAccount = async (user, stripe, stripeMode = 'test') => {
    if (user.stripeConnectAccountId) {
        const existingState = await syncConnectAccount(user, stripe, stripeMode);
        if (existingState.accountId) {
            return existingState;
        }
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
    resetConnectState,
    syncConnectAccount,
    ensureConnectAccount,
};
