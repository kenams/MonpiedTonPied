const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Chat = require('./models/Chat');
const { hasSubscriptionAccess, normalizeRole } = require('./utils/accessControl');
const { seedDatabase } = require('./scripts/seed');
require('dotenv').config();

const app = express();
const trustProxyValue =
    process.env.TRUST_PROXY === 'true'
        ? 1
        : process.env.TRUST_PROXY === 'false'
          ? 0
          : process.env.TRUST_PROXY || 0;
app.set('trust proxy', trustProxyValue);
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
app.set('io', io);
const SOCKET_ENABLED = process.env.ENABLE_SOCKET_IO !== 'false';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Middleware
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginEmbedderPolicy: false,
    })
);

const rateWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const rateMax = Number(process.env.RATE_LIMIT_MAX || 100);
const rateAuthMax = Number(process.env.RATE_LIMIT_AUTH_MAX || 10);

const apiLimiter = rateLimit({
    windowMs: rateWindowMs,
    max: rateMax,
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: rateWindowMs,
    max: rateAuthMax,
    standardHeaders: true,
    legacyHeaders: false,
});
const normalizeOrigin = (value) => value.replace(/\/$/, '');
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }
            const normalized = normalizeOrigin(origin);
            if (allowedOrigins.includes(normalized)) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    })
);
app.use((req, res, next) => {
    if (req.originalUrl === '/api/stripe/webhook') {
        return next();
    }
    return express.json()(req, res, next);
});

app.use('/api', apiLimiter);

// Route de test
app.get('/', (req, res) => {
    res.json({ message: 'Bienvenue sur MonPiedTonPied API!' });
});

// Routes API
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const uploadRoutes = require('./routes/uploads');
const billingRoutes = require('./routes/billing');
const userRoutes = require('./routes/users');
const creatorRoutes = require('./routes/creators');
const chatRoutes = require('./routes/chats');
const requestRoutes = require('./routes/requests');
const stripeRoutes = require('./routes/stripe');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const presenceRoutes = require('./routes/presence');
const mediaRoutes = require('./routes/media');
const adminRoutes = require('./routes/admin');
const adminCsvRoutes = require('./routes/adminCsv');
const notificationRoutes = require('./routes/notifications');
const pushRoutes = require('./routes/push');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/presence', presenceRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminCsvRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push', pushRoutes);
const allowPublicUploads = process.env.ALLOW_PUBLIC_UPLOADS === 'true';
app.use('/uploads', (req, res, next) => {
    const isAvatar = req.path.startsWith('/avatars/');
    const isPublic = req.path.startsWith('/public/');
    if (!allowPublicUploads && !isAvatar && !isPublic) {
        return res.status(403).json({ message: 'Acces refuse.' });
    }
    return next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io pour les messages en temps réel (optionnel et protégé)
if (SOCKET_ENABLED) {
    io.use(async (socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.query?.token ||
                '';
            if (!token) {
                return next(new Error('auth_required'));
            }
            const payload = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(payload.id);
            if (!user || user.isSuspended) {
                return next(new Error('auth_invalid'));
            }
            socket.data.userId = user._id.toString();
            socket.data.role = normalizeRole(user.role);
            socket.data.canChat = hasSubscriptionAccess(user);
            return next();
        } catch (error) {
            return next(new Error('auth_invalid'));
        }
    });

    io.on('connection', (socket) => {
        console.log('Utilisateur connecté:', socket.id);

        socket.join(`user:${socket.data.userId}`);

        socket.on('join_room', async (roomId) => {
            try {
                const chat = await Chat.findById(roomId);
                if (!chat) return;
                const userId = socket.data.userId;
                const isParticipant =
                    chat.consumer.toString() === userId ||
                    chat.creator.toString() === userId;
                if (!isParticipant) return;
                if (socket.data.role === 'consumer' && !socket.data.canChat) return;
                socket.join(roomId);
            } catch {
                // ignore
            }
        });

        socket.on('join_notifications', () => {
            socket.join(`user:${socket.data.userId}`);
        });

        socket.on('send_message', async (data) => {
            try {
                const roomId = data?.roomId;
                if (!roomId) return;
                const chat = await Chat.findById(roomId);
                if (!chat) return;
                const userId = socket.data.userId;
                const isParticipant =
                    chat.consumer.toString() === userId ||
                    chat.creator.toString() === userId;
                if (!isParticipant) return;
                if (socket.data.role === 'consumer' && !socket.data.canChat) return;
                socket.to(roomId).emit('receive_message', data);
            } catch {
                // ignore
            }
        });

        socket.on('disconnect', () => {
            console.log('Utilisateur déconnecté:', socket.id);
        });
    });
}

// Connexion MongoDB (version de test avec base locale)
mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/monpiedtonpied')
    .then(async () => {
        console.log('✅ MongoDB connecté');
        if (process.env.AUTO_SEED_DEMO === 'true') {
            try {
                await seedDatabase();
                console.log('✅ Demo seed executed');
            } catch (error) {
                console.error('❌ Demo seed error:', error);
            }
        }
    })
    .catch((err) => console.log('❌ Erreur MongoDB:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
    console.log(`📍 Testez: http://localhost:${PORT}`);
});
