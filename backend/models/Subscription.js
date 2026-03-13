const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        stripeSubscriptionId: { type: String, index: true },
        status: {
            type: String,
            enum: ['none', 'pending', 'active', 'canceled', 'expired', 'suspended'],
            default: 'pending',
        },
        currentPeriodEnd: { type: Date, default: null },
        cancelAtPeriodEnd: { type: Boolean, default: false },
        priceId: { type: String, default: null },
        latestInvoiceId: { type: String, default: null },
    },
    { timestamps: true }
);

subscriptionSchema.index({ user: 1, stripeSubscriptionId: 1 }, { unique: false });

module.exports = mongoose.model('Subscription', subscriptionSchema);
