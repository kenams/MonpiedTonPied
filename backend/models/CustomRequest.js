const mongoose = require('mongoose');

const customRequestSchema = new mongoose.Schema(
    {
        consumer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        prompt: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        platformFee: { type: Number, default: 0 },
        creatorAmount: { type: Number, default: 0 },
        paid: { type: Boolean, default: false },
        paymentSessionId: { type: String, default: null },
        paymentIntentId: { type: String, default: null },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'expired', 'delivered', 'refunded'],
            default: 'pending',
        },
        expiresAt: { type: Date, required: true },
        deliveryUrl: { type: String, default: null },
        deliveryNote: { type: String, default: '' },
        deliveredAt: { type: Date, default: null },
        refundStatus: {
            type: String,
            enum: ['none', 'pending', 'processed', 'failed'],
            default: 'none',
        },
        refundedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('CustomRequest', customRequestSchema);
