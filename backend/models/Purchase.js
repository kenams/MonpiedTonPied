const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
        amount: { type: Number, required: true, min: 0 },
        platformFee: { type: Number, default: 0 },
        creatorAmount: { type: Number, default: 0 },
        paymentIntentId: { type: String, default: null },
        currency: { type: String, default: 'EUR' },
    },
    { timestamps: true }
);

purchaseSchema.index({ user: 1, content: 1 }, { unique: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
