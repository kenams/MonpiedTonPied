const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema(
    {
        eventId: { type: String, required: true, unique: true, index: true },
        type: { type: String, default: null },
        processedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
