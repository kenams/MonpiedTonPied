/**
 * node backend/scripts/create-admin.js
 * Creates or updates the seed-bot admin account.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'seed@arcane-feet.internal';
const ADMIN_PASS  = process.env.SEED_ADMIN_PASSWORD || 'SeedBot2026!';
const ADMIN_USER  = 'seedbot';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/monpiedtonpied');
  console.log('MongoDB connected');

  const User = require('../models/User');
  let user = await User.findOne({ email: ADMIN_EMAIL });

  if (user) {
    user.role = 'admin';
    user.passwordHash = await bcrypt.hash(ADMIN_PASS, 10);
    user.isSuspended = false;
    user.ageVerifiedAt = new Date();
    user.emailVerifiedAt = new Date();
    await user.save();
    console.log('Admin updated:', user.email);
  } else {
    user = await User.create({
      username: ADMIN_USER,
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASS, 10),
      displayName: 'Seed Bot',
      role: 'admin',
      birthDate: new Date('2000-01-01'),
      ageVerifiedAt: new Date(),
      emailVerifiedAt: new Date(),
    });
    console.log('Admin created:', user.email);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
