const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, trim: true, unique: true },
        email: { type: String, required: true, trim: true, lowercase: true, unique: true },
        passwordHash: { type: String, required: true },
        displayName: { type: String, trim: true },
        bio: { type: String, default: '', trim: true },
        avatarUrl: { type: String, default: '/default-avatar.png' },
        birthDate: { type: Date, default: null },
        ageVerifiedAt: { type: Date, default: null },
        role: {
            type: String,
            enum: ['consumer', 'creator', 'admin', 'user'],
            default: 'consumer',
        },
        accessPassActive: { type: Boolean, default: false },
        accessPassExpiresAt: { type: Date, default: null },
        subscriptionActive: { type: Boolean, default: false },
        subscriptionExpiresAt: { type: Date, default: null },
        stripeCustomerId: { type: String, default: null },
        stripeSubscriptionId: { type: String, default: null },
        verifiedCreator: { type: Boolean, default: false },
        isSuspended: { type: Boolean, default: false },
        suspendedUntil: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
