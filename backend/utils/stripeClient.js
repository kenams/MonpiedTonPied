const Stripe = require('stripe');

const isStripeConfigured = () => {
    return Boolean(
        process.env.STRIPE_SECRET_KEY &&
            process.env.STRIPE_SECRET_KEY !== 'sk_test_change_me'
    );
};

const getStripeClient = () => {
    if (!isStripeConfigured()) {
        return null;
    }
    return new Stripe(process.env.STRIPE_SECRET_KEY);
};

module.exports = {
    getStripeClient,
    isStripeConfigured,
};
