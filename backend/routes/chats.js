const express = require('express');
const auth = require('../middleware/auth');
const requireSubscription = require('../middleware/requireSubscription');
const rateLimit = require('express-rate-limit');
const { normalizeRole, hasSubscriptionAccess } = require('../utils/accessControl');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const router = express.Router();

const canChat = (user) => {
    if (!user) return false;
    return hasSubscriptionAccess(user);
};

const containsBlockedText = (text) => {
    const blocked = ['raciste', 'racisme', 'nazi', 'haine', 'violence'];
    const lower = text.toLowerCase();
    return blocked.some((word) => lower.includes(word));
};

const containsContactInfo = (text) => {
    const lower = text.toLowerCase();
    const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    const phonePattern = /(?:\+?\d[\d\s().-]{6,}\d)/;
    const urlPattern = /(https?:\/\/|www\.)/i;
    const handlePattern = /(?:^|\s)@[a-z0-9._]{3,}/i;
    const keywords = [
        'snap',
        'snapchat',
        'insta',
        'instagram',
        'whatsapp',
        'whats app',
        'telegram',
        't.me',
        'discord',
        'skype',
        'facebook',
        'fb',
        'tiktok',
        'onlyfans',
        'twitter',
        'x.com',
        'signal',
        'wechat',
        'line',
        'viber',
        'kik',
    ];

    if (emailPattern.test(text)) return true;
    if (phonePattern.test(text)) return true;
    if (urlPattern.test(text)) return true;
    if (handlePattern.test(text)) return true;
    return keywords.some((word) => lower.includes(word));
};

const chatLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_CHAT_WINDOW_MS || 60 * 1000),
    max: Number(process.env.RATE_LIMIT_CHAT_MAX || 30),
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/', auth, requireSubscription, async (req, res) => {
    try {
        const user = req.currentUser || (await User.findById(req.user.id));
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }
        const role = normalizeRole(user.role);
        if (role === 'consumer' && !canChat(user)) {
            return res.status(403).json({ message: 'Abonnement requis pour le chat.' });
        }

        const chats = await Chat.find({
            $or: [{ consumer: user._id }, { creator: user._id }],
        })
            .sort({ updatedAt: -1 })
            .populate('consumer', 'username displayName avatarUrl')
            .populate('creator', 'username displayName avatarUrl');

        return res.json(
            chats.map((chat) => ({
                id: chat._id,
                consumer: {
                    id: chat.consumer?._id,
                    displayName: chat.consumer?.displayName || chat.consumer?.username,
                    avatarUrl: chat.consumer?.avatarUrl,
                },
                creator: {
                    id: chat.creator?._id,
                    displayName: chat.creator?.displayName || chat.creator?.username,
                    avatarUrl: chat.creator?.avatarUrl,
                },
                updatedAt: chat.updatedAt,
            }))
        );
    } catch (error) {
        console.error('Chat list error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/:creatorId', auth, requireSubscription, async (req, res) => {
    try {
        const user = req.currentUser || (await User.findById(req.user.id));
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        const creator = await User.findById(req.params.creatorId);
        if (!creator || creator.role !== 'creator') {
            return res.status(404).json({ message: 'Créateur introuvable.' });
        }

        const chat = await Chat.findOneAndUpdate(
            { consumer: user._id, creator: creator._id },
            {},
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.status(201).json({ id: chat._id });
    } catch (error) {
        console.error('Chat create error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.get('/:chatId/messages', auth, requireSubscription, async (req, res) => {
    try {
        const user = req.currentUser || (await User.findById(req.user.id));
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat introuvable.' });
        }

        const isParticipant =
            chat.consumer.toString() === user._id.toString() ||
            chat.creator.toString() === user._id.toString();
        if (!isParticipant) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        const messages = await Message.find({ chat: chat._id })
            .sort({ createdAt: 1 })
            .limit(200);

        return res.json(
            messages.map((message) => ({
                id: message._id,
                sender: message.sender,
                text: message.text,
                createdAt: message.createdAt,
            }))
        );
    } catch (error) {
        console.error('Chat messages error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/:chatId/messages', auth, requireSubscription, chatLimiter, async (req, res) => {
    try {
        const user = req.currentUser || (await User.findById(req.user.id));
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        const chat = await Chat.findById(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ message: 'Chat introuvable.' });
        }

        const isParticipant =
            chat.consumer.toString() === user._id.toString() ||
            chat.creator.toString() === user._id.toString();
        if (!isParticipant) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Message vide.' });
        }
        if (text.length > 2000) {
            return res.status(400).json({ message: 'Message trop long.' });
        }
        if (containsBlockedText(text)) {
            return res.status(400).json({ message: 'Message non autorisé.' });
        }
        if (containsContactInfo(text)) {
            return res.status(400).json({
                message:
                    'Les coordonnées (tel, email, réseaux sociaux, liens) sont interdites.',
            });
        }

        const message = await Message.create({
            chat: chat._id,
            sender: user._id,
            text: text.trim(),
        });

        return res.status(201).json({
            id: message._id,
            sender: message.sender,
            text: message.text,
            createdAt: message.createdAt,
        });
    } catch (error) {
        console.error('Chat send error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
