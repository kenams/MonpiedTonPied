const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Content = require('../models/Content');

require('dotenv').config();

const MONGODB_URI =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/monpiedtonpied';

async function seedDatabase() {
    const defaultAvatarUrl = '/default-avatar.svg';
    const email = 'demo@monpiedtonpied.local';
    const username = 'DemoCreator';
    const password = 'demo1234';
    const consumerEmail = 'consumer@monpiedtonpied.local';
    const consumerUsername = 'DemoUser';
    const modelEmail = 'labresilienne@monpiedtonpied.local';
    const modelUsername = 'LaBresilienne';
    const legacyModelEmail = 'tessou@monpiedtonpied.local';
    const legacyModelUsername = 'Tessou';

    let user = await User.findOne({ email });
    if (!user) {
        const passwordHash = await bcrypt.hash(password, 10);
        user = await User.create({
            username,
            email,
            passwordHash,
            role: 'creator',
            displayName: 'Demo Creator',
            bio: 'Createur de demonstration',
            avatarUrl: defaultAvatarUrl,
            birthDate: new Date('1995-01-01'),
            ageVerifiedAt: new Date(),
            emailVerifiedAt: new Date(),
        });
        console.log('OK Demo user created:', email, `password: ${password}`);
    } else {
        if (!user.avatarUrl || user.avatarUrl === '/default-avatar.png') {
            user.avatarUrl = defaultAvatarUrl;
            await user.save();
        }
        if (!user.emailVerifiedAt) {
            user.emailVerifiedAt = new Date();
            await user.save();
        }
        console.log('INFO Demo user already present:', email);
    }

    let consumer = await User.findOne({
        $or: [{ email: consumerEmail }, { username: consumerUsername }],
    });
    if (!consumer) {
        const passwordHash = await bcrypt.hash(password, 10);
        consumer = await User.create({
            username: consumerUsername,
            email: consumerEmail,
            passwordHash,
            role: 'consumer',
            displayName: 'Client Test',
            bio: 'Compte test utilisateur pre-rempli.',
            avatarUrl: defaultAvatarUrl,
            birthDate: new Date('1999-01-01'),
            ageVerifiedAt: new Date(),
            emailVerifiedAt: new Date(),
        });
        console.log('OK Demo consumer created:', consumerEmail, `password: ${password}`);
    } else {
        consumer.username = consumerUsername;
        consumer.email = consumerEmail;
        consumer.displayName = consumer.displayName || 'Client Test';
        consumer.bio = consumer.bio || 'Compte test utilisateur pre-rempli.';
        if (!consumer.avatarUrl || consumer.avatarUrl === '/default-avatar.png') {
            consumer.avatarUrl = defaultAvatarUrl;
        }
        if (!consumer.ageVerifiedAt) {
            consumer.ageVerifiedAt = new Date();
        }
        if (!consumer.emailVerifiedAt) {
            consumer.emailVerifiedAt = new Date();
        }
        await consumer.save();
        console.log('INFO Demo consumer already present:', consumerEmail);
    }

    let model = await User.findOne({
        $or: [
            { email: modelEmail },
            { username: modelUsername },
            { email: legacyModelEmail },
            { username: legacyModelUsername },
        ],
    });
    if (!model) {
        const passwordHash = await bcrypt.hash(password, 10);
        model = await User.create({
            username: modelUsername,
            email: modelEmail,
            passwordHash,
            role: 'creator',
            displayName: 'LaBresilienne',
            bio: 'Premier model mis en avant.',
            avatarUrl: '/creators/labresilienne.jpg',
            birthDate: new Date('1998-01-01'),
            ageVerifiedAt: new Date(),
            emailVerifiedAt: new Date(),
            verifiedCreator: true,
        });
        console.log('OK Model user created:', modelEmail, `password: ${password}`);
    } else {
        model.username = modelUsername;
        model.email = modelEmail;
        model.avatarUrl = '/creators/labresilienne.jpg';
        model.displayName = 'LaBresilienne';
        if (!model.ageVerifiedAt) {
            model.ageVerifiedAt = new Date();
        }
        if (!model.emailVerifiedAt) {
            model.emailVerifiedAt = new Date();
        }
        await model.save();
        console.log('INFO Model user already present:', modelEmail);
    }

    const contentCount = await Content.countDocuments();
    if (contentCount === 0) {
        await Content.insertMany([
            {
                title: 'Belles chaussures rouges',
                description: 'Contenu exclusif de qualite premium',
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
        console.log('OK Demo contents inserted.');
    } else {
        console.log('INFO Contents already present, seed skipped.');
    }

    if (model) {
        const modelContents = [
            {
                title: 'LaBresilienne - Video 01',
                description: 'Apercu exclusif LaBresilienne.',
                creator: model._id,
                files: [{ url: '/uploads/labresilienne/Snapchat-102772131.mp4', type: 'video/mp4' }],
            },
            {
                title: 'LaBresilienne - Video 02',
                description: 'Serie premium LaBresilienne.',
                creator: model._id,
                files: [{ url: '/uploads/labresilienne/Snapchat-1057577605.mp4', type: 'video/mp4' }],
            },
            {
                title: 'LaBresilienne - Video 03',
                description: 'Collection prives LaBresilienne.',
                creator: model._id,
                files: [{ url: '/uploads/labresilienne/Snapchat-163084523.mp4', type: 'video/mp4' }],
            },
            {
                title: 'LaBresilienne - Video 04',
                description: 'Set exclusif LaBresilienne.',
                creator: model._id,
                files: [{ url: '/uploads/labresilienne/Snapchat-520040514.mp4', type: 'video/mp4' }],
            },
        ];

        for (const item of modelContents) {
            const existing = await Content.findOne({
                creator: model._id,
                title: item.title,
            });
            if (!existing) {
                await Content.create(item);
            }
        }

        const now = Date.now();
        const order = [
            { title: 'LaBresilienne - Video 01', offset: 3000 },
            { title: 'LaBresilienne - Video 03', offset: 2000 },
            { title: 'LaBresilienne - Video 04', offset: 1000 },
            { title: 'LaBresilienne - Video 02', offset: 0 },
        ];

        for (const entry of order) {
            const stamp = new Date(now - entry.offset);
            await Content.updateOne(
                { creator: model._id, title: entry.title },
                { $set: { createdAt: stamp, updatedAt: stamp } }
            );
        }

        console.log('OK LaBresilienne contents ensured and ordered.');
    }

    const fakeCreators = [
        {
            slug: 'novavelvet',
            username: 'NovaVelvet',
            displayName: 'Nova Velvet',
            email: 'novavelvet@monpiedtonpied.local',
            bio: 'Modele test premium.',
        },
        {
            slug: 'mirasol',
            username: 'MiraSol',
            displayName: 'Mira Sol',
            email: 'mirasol@monpiedtonpied.local',
            bio: 'Modele test soleil.',
        },
        {
            slug: 'noesatin',
            username: 'NoeSatin',
            displayName: 'Noe Satin',
            email: 'noesatin@monpiedtonpied.local',
            bio: 'Modele test satin.',
        },
        {
            slug: 'rheanoir',
            username: 'RheaNoir',
            displayName: 'Rhea Noir',
            email: 'rheanoir@monpiedtonpied.local',
            bio: 'Modele test noir.',
        },
    ];

    for (const fake of fakeCreators) {
        let fakeUser = await User.findOne({
            $or: [{ email: fake.email }, { username: fake.username }],
        });
        if (!fakeUser) {
            const passwordHash = await bcrypt.hash(password, 10);
            fakeUser = await User.create({
                username: fake.username,
                email: fake.email,
                passwordHash,
                role: 'creator',
                displayName: fake.displayName,
                bio: fake.bio,
                avatarUrl: `/creators/${fake.slug}.svg`,
                birthDate: new Date('1997-01-01'),
                ageVerifiedAt: new Date(),
                emailVerifiedAt: new Date(),
                verifiedCreator: true,
            });
            console.log('OK Fake creator created:', fake.email);
        } else {
            fakeUser.displayName = fake.displayName;
            fakeUser.bio = fake.bio;
            fakeUser.avatarUrl = `/creators/${fake.slug}.svg`;
            if (!fakeUser.ageVerifiedAt) {
                fakeUser.ageVerifiedAt = new Date();
            }
            if (!fakeUser.emailVerifiedAt) {
                fakeUser.emailVerifiedAt = new Date();
            }
            await fakeUser.save();
            console.log('INFO Fake creator already present:', fake.email);
        }

        const photoTitle = `${fake.displayName} - Photo 01`;

        await Content.deleteMany({
            creator: fakeUser._id,
            $or: [
                { title: { $regex: /Video/i } },
                { 'files.type': { $regex: /^video/i } },
                { 'files.url': { $regex: /\/uploads\/fake\//i } },
            ],
        });

        const existingPhoto = await Content.findOne({
            creator: fakeUser._id,
            title: photoTitle,
        });
        if (!existingPhoto) {
            await Content.create({
                title: photoTitle,
                description: 'Photo test.',
                creator: fakeUser._id,
                files: [{ url: `/placeholders/${fake.slug}-1.svg`, type: 'image/svg+xml' }],
            });
        }

        const now = Date.now();
        await Content.updateOne(
            { creator: fakeUser._id, title: photoTitle },
            { $set: { createdAt: new Date(now), updatedAt: new Date(now) } }
        );
    }
}

async function run() {
    await mongoose.connect(MONGODB_URI);
    try {
        await seedDatabase();
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    run().catch((err) => {
        console.error('Seed error:', err);
        process.exit(1);
    });
}

module.exports = {
    run,
    seedDatabase,
};
