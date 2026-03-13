const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/monpiedtonpied';

async function run() {
    await mongoose.connect(MONGODB_URI);
    const result = await User.updateMany(
        { emailVerifiedAt: { $in: [null, undefined] } },
        { $set: { emailVerifiedAt: new Date() } }
    );
    console.log('Email verification migration done:', result.modifiedCount);
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
});
