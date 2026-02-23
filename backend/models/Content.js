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
        stats: {
            views: { type: Number, default: 0 },
            likes: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Content', contentSchema);
