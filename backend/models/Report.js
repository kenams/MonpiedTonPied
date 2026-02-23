const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        targetType: {
            type: String,
            enum: ['user', 'content', 'message', 'chat', 'request'],
            required: true,
        },
        targetId: { type: String, required: true },
        reason: { type: String, required: true, trim: true },
        details: { type: String, default: '', trim: true },
        status: {
            type: String,
            enum: ['open', 'reviewing', 'resolved', 'rejected'],
            default: 'open',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
