const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    })
);
app.use((req, res, next) => {
    if (req.originalUrl === '/api/stripe/webhook') {
        return next();
    }
    return express.json()(req, res, next);
});

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

app.use('/api/auth', authRoutes);
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io pour les messages en temps réel
io.on('connection', (socket) => {
    console.log('Utilisateur connecté:', socket.id);

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
    });

    socket.on('send_message', (data) => {
        socket.to(data.roomId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté:', socket.id);
    });
});

// Connexion MongoDB (version de test avec base locale)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/monpiedtonpied')
    .then(() => console.log('✅ MongoDB connecté'))
    .catch(err => console.log('❌ Erreur MongoDB:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
    console.log(`📍 Testez: http://localhost:${PORT}`);
});
