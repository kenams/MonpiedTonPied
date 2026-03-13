const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: {
            type: String,
            enum: ['pass', 'subscription', 'content', 'request'],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'succeeded', 'failed', 'refunded'],
            default: 'pending',
        },
        amount: { type: Number, default: 0 },
        currency: { type: String, default: 'eur' },
        stripePaymentIntentId: { type: String, default: null, index: true },
        stripeSessionId: { type: String, default: null, index: true },
        content: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', default: null },
        request: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomRequest', default: null },
        metadata: { type: Object, default: {} },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
