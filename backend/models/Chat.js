const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
    {
        consumer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

chatSchema.index({ consumer: 1, creator: 1 }, { unique: true });

module.exports = mongoose.model('Chat', chatSchema);
