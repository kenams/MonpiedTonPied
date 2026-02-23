const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const router = express.Router();

const isActive = (expiresAt) => {
    if (!expiresAt) return true;
    return new Date(expiresAt).getTime() > Date.now();
};

const canChat = (user) => {
    if (!user) return false;
    const role = user.role === 'user' ? 'consumer' : user.role;
    if (role === 'creator' || role === 'admin') return true;
    return user.subscriptionActive && isActive(user.subscriptionExpiresAt);
};

const containsBlockedText = (text) => {
    const blocked = ['raciste', 'racisme', 'nazi', 'haine', 'violence'];
    const lower = text.toLowerCase();
    return blocked.some((word) => lower.includes(word));
};

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
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

router.post('/:creatorId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        const role = user.role === 'user' ? 'consumer' : user.role;
        if (role === 'consumer' && !canChat(user)) {
            return res.status(403).json({ message: 'Abonnement requis pour le chat.' });
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

router.get('/:chatId/messages', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
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

        const role = user.role === 'user' ? 'consumer' : user.role;
        if (role === 'consumer' && !canChat(user)) {
            return res.status(403).json({ message: 'Abonnement requis pour le chat.' });
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

router.post('/:chatId/messages', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
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

        const role = user.role === 'user' ? 'consumer' : user.role;
        if (role === 'consumer' && !canChat(user)) {
            return res.status(403).json({ message: 'Abonnement requis pour le chat.' });
        }

        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Message vide.' });
        }
        if (containsBlockedText(text)) {
            return res.status(400).json({ message: 'Message non autorisé.' });
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
