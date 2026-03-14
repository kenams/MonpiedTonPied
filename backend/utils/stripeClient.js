const Stripe = require('stripe');

const isStripeConfigured = () => {
    return Boolean(
        process.env.STRIPE_SECRET_KEY &&
            process.env.STRIPE_SECRET_KEY !== 'sk_test_change_me'
    );
};

const getStripeMode = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    if (secretKey.startsWith('sk_live_')) return 'live';
    return 'test';
};

const getStripeClient = () => {
    if (!isStripeConfigured()) {
        return null;
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY);
};

module.exports = {
    getStripeClient,
    getStripeMode,
    isStripeConfigured,
};
