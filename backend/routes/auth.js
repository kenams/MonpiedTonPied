const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const { sendMail } = require('../utils/mailer');
const { verificationEmail, resetEmail } = require('../utils/emailTemplates');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const MIN_AGE = 18;
const RESET_TOKEN_TTL_MINUTES = Number(process.env.RESET_TOKEN_TTL_MINUTES || 60);
const VERIFY_TOKEN_TTL_MINUTES = Number(process.env.VERIFY_TOKEN_TTL_MINUTES || 1440);
const REQUIRE_EMAIL_VERIFICATION = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE || 'fr';

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
    avatarUrl: avatarUrl || '/default-avatar.svg',
});

const hashResetToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex');
const hashVerifyToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex');

const buildResetLink = (token) => `${FRONTEND_URL}/auth/reset/${token}`;
const buildVerifyLink = (token) => `${FRONTEND_URL}/auth/verify/${token}`;

const detectLocale = (req, fallback = DEFAULT_LOCALE) => {
    const bodyLocale = req.body?.locale;
    if (typeof bodyLocale === 'string' && bodyLocale.trim()) {
        return bodyLocale.split('-')[0].toLowerCase();
    }
    const header = req.headers['accept-language'];
    if (typeof header === 'string' && header.length > 0) {
        const primary = header.split(',')[0]?.trim();
        if (primary) {
            return primary.split('-')[0].toLowerCase();
        }
    }
    return fallback;
};

router.post('/register/creator', async (req, res) => {
    try {
        const { username, email, password, displayName, bio, avatarUrl, birthDate } =
            req.body;
        const locale = detectLocale(req);

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
            emailVerifiedAt: REQUIRE_EMAIL_VERIFICATION ? null : new Date(),
            locale,
            ...normalizeProfile({ displayName, bio, avatarUrl }),
        });

        let verifyToken;
        if (REQUIRE_EMAIL_VERIFICATION) {
            verifyToken = crypto.randomBytes(32).toString('hex');
            await EmailVerificationToken.create({
                user: user._id,
                tokenHash: hashVerifyToken(verifyToken),
                expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MINUTES * 60000),
            });
            const mail = verificationEmail({
                displayName: user.displayName || user.username,
                verifyUrl: buildVerifyLink(verifyToken),
                locale: user.locale,
            });
            await sendMail({ to: user.email, ...mail });
        }

        const token = REQUIRE_EMAIL_VERIFICATION
            ? null
            : jwt.sign(
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
            verificationRequired: REQUIRE_EMAIL_VERIFICATION,
            verifyToken:
                REQUIRE_EMAIL_VERIFICATION && process.env.EXPOSE_VERIFY_TOKEN === 'true'
                    ? verifyToken
                    : undefined,
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/register/consumer', async (req, res) => {
    try {
        const { username, email, password, displayName, avatarUrl, birthDate } = req.body;
        const locale = detectLocale(req);

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
            emailVerifiedAt: REQUIRE_EMAIL_VERIFICATION ? null : new Date(),
            locale,
            ...normalizeProfile({ displayName, avatarUrl }),
        });

        let verifyToken;
        if (REQUIRE_EMAIL_VERIFICATION) {
            verifyToken = crypto.randomBytes(32).toString('hex');
            await EmailVerificationToken.create({
                user: user._id,
                tokenHash: hashVerifyToken(verifyToken),
                expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MINUTES * 60000),
            });
            const mail = verificationEmail({
                displayName: user.displayName || user.username,
                verifyUrl: buildVerifyLink(verifyToken),
                locale: user.locale,
            });
            await sendMail({ to: user.email, ...mail });
        }

        const token = REQUIRE_EMAIL_VERIFICATION
            ? null
            : jwt.sign(
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
            verificationRequired: REQUIRE_EMAIL_VERIFICATION,
            verifyToken:
                REQUIRE_EMAIL_VERIFICATION && process.env.EXPOSE_VERIFY_TOKEN === 'true'
                    ? verifyToken
                    : undefined,
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
        if (user.isSuspended) {
            return res.status(403).json({ message: 'Compte suspendu.' });
        }
        if (REQUIRE_EMAIL_VERIFICATION && !user.emailVerifiedAt) {
            return res.status(403).json({ message: 'Email non verifie.' });
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

router.post('/password/forgot', async (req, res) => {
    try {
        const { email, username } = req.body || {};
        const identifier = email || username;
        if (!identifier) {
            return res.status(400).json({ message: 'Identifiant requis.' });
        }

        const user = await User.findOne({
            $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
        });

        if (user) {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = hashResetToken(rawToken);
            const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60000);

            await PasswordResetToken.create({
                user: user._id,
                tokenHash,
                expiresAt,
            });
            const mail = resetEmail({
                displayName: user.displayName || user.username,
                resetUrl: buildResetLink(rawToken),
                locale: user.locale,
            });
            await sendMail({ to: user.email, ...mail });

            if (process.env.EXPOSE_RESET_TOKEN === 'true') {
                return res.json({
                    message: 'Token de reinitialisation genere.',
                    resetToken: rawToken,
                    expiresAt,
                });
            }
        }

        return res.json({
            message:
                'Si le compte existe, un lien de reinitialisation a ete envoye.',
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/password/reset', async (req, res) => {
    try {
        const { token, password } = req.body || {};
        if (!token || !password) {
            return res.status(400).json({ message: 'Champs requis manquants.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Mot de passe trop court.' });
        }

        const tokenHash = hashResetToken(token);
        const resetEntry = await PasswordResetToken.findOne({
            tokenHash,
            usedAt: null,
            expiresAt: { $gt: new Date() },
        }).populate('user');

        if (!resetEntry || !resetEntry.user) {
            return res.status(400).json({ message: 'Token invalide.' });
        }

        const user = resetEntry.user;
        user.passwordHash = await bcrypt.hash(password, 10);
        await user.save();

        resetEntry.usedAt = new Date();
        await resetEntry.save();

        return res.json({ message: 'Mot de passe mis a jour.' });
    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/email/resend', async (req, res) => {
    try {
        if (!REQUIRE_EMAIL_VERIFICATION) {
            return res.json({ message: 'Verification email desactivee.' });
        }
        const { email, username } = req.body || {};
        const identifier = email || username;
        if (!identifier) {
            return res.status(400).json({ message: 'Identifiant requis.' });
        }
        const user = await User.findOne({
            $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
        });
        if (user && !user.emailVerifiedAt) {
            const verifyToken = crypto.randomBytes(32).toString('hex');
            await EmailVerificationToken.create({
                user: user._id,
                tokenHash: hashVerifyToken(verifyToken),
                expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MINUTES * 60000),
            });
            const mail = verificationEmail({
                displayName: user.displayName || user.username,
                verifyUrl: buildVerifyLink(verifyToken),
                locale: user.locale,
            });
            await sendMail({ to: user.email, ...mail });
            if (process.env.EXPOSE_VERIFY_TOKEN === 'true') {
                return res.json({
                    message: 'Token de verification genere.',
                    verifyToken,
                });
            }
        }
        return res.json({
            message: 'Si le compte existe, un lien de verification a ete envoye.',
        });
    } catch (error) {
        console.error('Email resend error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/email/verify', async (req, res) => {
    try {
        if (!REQUIRE_EMAIL_VERIFICATION) {
            return res.json({ message: 'Verification email desactivee.' });
        }
        const { token } = req.body || {};
        if (!token) {
            return res.status(400).json({ message: 'Token requis.' });
        }
        const tokenHash = hashVerifyToken(token);
        const entry = await EmailVerificationToken.findOne({
            tokenHash,
            usedAt: null,
            expiresAt: { $gt: new Date() },
        }).populate('user');
        if (!entry || !entry.user) {
            return res.status(400).json({ message: 'Token invalide.' });
        }
        const user = entry.user;
        user.emailVerifiedAt = new Date();
        await user.save();
        entry.usedAt = new Date();
        await entry.save();
        return res.json({ message: 'Email verifie.' });
    } catch (error) {
        console.error('Email verify error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
