const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Content = require('../models/Content');

require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/monpiedtonpied';

async function run() {
    await mongoose.connect(MONGODB_URI);

    const email = 'demo@monpiedtonpied.local';
    const username = 'DemoCreator';
    const password = 'demo1234';

    let user = await User.findOne({ email });
    if (!user) {
        const passwordHash = await bcrypt.hash(password, 10);
        user = await User.create({
            username,
            email,
            passwordHash,
            role: 'creator',
            displayName: 'Demo Creator',
            bio: 'Créateur de démonstration',
            avatarUrl: '/default-avatar.png',
            birthDate: new Date('1995-01-01'),
            ageVerifiedAt: new Date(),
        });
        console.log('✅ Utilisateur demo créé:', email, `mot de passe: ${password}`);
    } else {
        console.log('ℹ️ Utilisateur demo déjà présent:', email);
    }

    const contentCount = await Content.countDocuments();
    if (contentCount === 0) {
        await Content.insertMany([
            {
                title: 'Belles chaussures rouges',
                description: 'Contenu exclusif de qualité premium',
                creator: user._id,
                files: [
                    {
                        url: '/placeholder-image.jpg',
                        type: 'image',
                        thumbnail: '/placeholder-image.jpg',
                        price: 15,
                    },
                ],
                stats: { views: 150, likes: 45 },
            },
            {
                title: 'Pieds sur la plage',
                description: 'Shot naturel en bord de mer',
                creator: user._id,
                files: [
                    {
                        url: '/placeholder-image.jpg',
                        type: 'image',
                        thumbnail: '/placeholder-image.jpg',
                        price: 12,
                    },
                ],
                stats: { views: 89, likes: 23 },
            },
        ]);
        console.log('✅ Contenus de démo insérés.');
    } else {
        console.log('ℹ️ Contenus déjà présents, seed ignoré.');
    }

    await mongoose.disconnect();
}

run().catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
});
