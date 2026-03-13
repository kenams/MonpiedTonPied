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
                files: [
                    {
                        url: 'https://res.cloudinary.com/dora2euif/video/upload/v1773430351/Snapchat-102772131_ml5boq.mp4',
                        type: 'video/mp4',
                    },
                ],
            },
            {
                title: 'LaBresilienne - Video 02',
                description: 'Serie premium LaBresilienne.',
                creator: model._id,
                files: [
                    {
                        url: 'https://res.cloudinary.com/dora2euif/video/upload/v1773430351/Snapchat-1057577605_anafd1.mp4',
                        type: 'video/mp4',
                    },
                ],
            },
            {
                title: 'LaBresilienne - Video 03',
                description: 'Collection prives LaBresilienne.',
                creator: model._id,
                files: [
                    {
                        url: 'https://res.cloudinary.com/dora2euif/video/upload/v1773430352/Snapchat-163084523_ae3ijd.mp4',
                        type: 'video/mp4',
                    },
                ],
            },
            {
                title: 'LaBresilienne - Video 04',
                description: 'Set exclusif LaBresilienne.',
                creator: model._id,
                files: [
                    {
                        url: 'https://res.cloudinary.com/dora2euif/video/upload/v1773430352/Snapchat-520040514_ewfcqr.mp4',
                        type: 'video/mp4',
                    },
                ],
            },
        ];

        for (const item of modelContents) {
            const existing = await Content.findOne({
                creator: model._id,
                title: item.title,
            });
            if (!existing) {
                await Content.create(item);
            } else {
                existing.description = item.description;
                existing.files = item.files;
                await existing.save();
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
        { username: 'NovaVelvet', email: 'novavelvet@monpiedtonpied.local' },
        { username: 'MiraSol', email: 'mirasol@monpiedtonpied.local' },
        { username: 'NoeSatin', email: 'noesatin@monpiedtonpied.local' },
        { username: 'RheaNoir', email: 'rheanoir@monpiedtonpied.local' },
    ];

    for (const fake of fakeCreators) {
        const fakeUser = await User.findOne({
            $or: [{ email: fake.email }, { username: fake.username }],
        });
        if (!fakeUser) {
            continue;
        }

        await Content.deleteMany({ creator: fakeUser._id });
        await User.deleteOne({ _id: fakeUser._id });
        console.log('OK Fake creator removed:', fake.email);
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
