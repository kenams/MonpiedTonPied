const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, trim: true, unique: true },
        email: { type: String, required: true, trim: true, lowercase: true, unique: true },
        passwordHash: { type: String, required: true },
        emailVerifiedAt: { type: Date, default: null },
        locale: { type: String, default: 'fr' },
        displayName: { type: String, trim: true },
        bio: { type: String, default: '', trim: true },
        avatarUrl: { type: String, default: '/default-avatar.svg' },
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
        stripeEnv: { type: String, enum: ['test', 'live', null], default: null },
        stripeConnectAccountId: { type: String, default: null },
        stripeConnectChargesEnabled: { type: Boolean, default: false },
        stripeConnectPayoutsEnabled: { type: Boolean, default: false },
        stripeConnectDetailsSubmitted: { type: Boolean, default: false },
        stripeConnectOnboardedAt: { type: Date, default: null },
        stripeConnectEnv: { type: String, enum: ['test', 'live', null], default: null },
        verifiedCreator: { type: Boolean, default: false },
        isSuspended: { type: Boolean, default: false },
        suspendedUntil: { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
