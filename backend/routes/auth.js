const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const MIN_AGE = 18;

const isAdult = (birthDate) => {
    if (!birthDate) {
        return false;
    }
    const date = new Date(birthDate);
    if (Number.isNaN(date.getTime())) {
        return false;
    }
    const today = new Date();
    const cutoff = new Date(
        today.getFullYear() - MIN_AGE,
        today.getMonth(),
        today.getDate()
    );
    return date <= cutoff;
};

const normalizeProfile = ({ displayName, bio, avatarUrl }) => ({
    displayName: displayName ? displayName.trim() : undefined,
    bio: bio ? bio.trim() : '',
    avatarUrl: avatarUrl || '/default-avatar.png',
});

router.post('/register/creator', async (req, res) => {
    try {
        const { username, email, password, displayName, bio, avatarUrl, birthDate } =
            req.body;

        if (!username || !email || !password || !birthDate || !displayName) {
            return res.status(400).json({ message: 'Champs requis manquants.' });
        }

        if (!isAdult(birthDate)) {
            return res
                .status(403)
                .json({ message: 'Vous devez avoir 18 ans ou plus.' });
        }

        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }],
        });

        if (existingUser) {
            return res
                .status(409)
                .json({ message: 'Email ou pseudo déjà utilisé.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            passwordHash,
            role: 'creator',
            birthDate: new Date(birthDate),
            ageVerifiedAt: new Date(),
            ...normalizeProfile({ displayName, bio, avatarUrl }),
        });

        const token = jwt.sign(
            { id: user._id.toString(), role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                displayName: user.displayName,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/register/consumer', async (req, res) => {
    try {
        const { username, email, password, displayName, avatarUrl, birthDate } = req.body;

        if (!username || !email || !password || !birthDate || !displayName) {
            return res.status(400).json({ message: 'Champs requis manquants.' });
        }

        if (!isAdult(birthDate)) {
            return res
                .status(403)
                .json({ message: 'Vous devez avoir 18 ans ou plus.' });
        }

        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }],
        });

        if (existingUser) {
            return res
                .status(409)
                .json({ message: 'Email ou pseudo déjà utilisé.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            email,
            passwordHash,
            role: 'consumer',
            birthDate: new Date(birthDate),
            ageVerifiedAt: new Date(),
            ...normalizeProfile({ displayName, avatarUrl }),
        });

        const token = jwt.sign(
            { id: user._id.toString(), role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                displayName: user.displayName,
            },
        });
    } catch (error) {
        console.error('Register consumer error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/register', async (req, res) => {
    return res.status(400).json({
        message:
            "Utilisez /api/auth/register/creator ou /api/auth/register/consumer.",
    });
});

router.post('/login', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const identifier = email || username;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Identifiants manquants.' });
        }

        const user = await User.findOne({
            $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
        });

        if (!user) {
            return res.status(401).json({ message: 'Identifiants invalides.' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ message: 'Identifiants invalides.' });
        }

        const token = jwt.sign(
            { id: user._id.toString(), role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                displayName: user.displayName || user.username,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
