const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
    {
        url: { type: String, required: true },
        type: { type: String, required: true },
        thumbnail: { type: String },
        price: { type: Number, min: 0 },
    },
    { _id: false }
);

const contentSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        files: { type: [fileSchema], default: [] },
        tags: { type: [String], default: [] },
        category: { type: String, default: 'all' },
        price: { type: Number, default: 0 },
        isPublic: { type: Boolean, default: true },
        likedBy: { type: [mongoose.Schema.Types.ObjectId], default: [] },
        stats: {
            views: { type: Number, default: 0 },
            likes: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

contentSchema.index({ tags: 1 });
contentSchema.index({ category: 1 });
contentSchema.index({ creator: 1, createdAt: -1 });

module.exports = mongoose.model('Content', contentSchema);
