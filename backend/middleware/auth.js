const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { buildAccessContext, normalizeRole } = require('../utils/accessControl');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

module.exports = async function auth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'Token manquant.' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(payload.id);
        if (!user) {
            return res.status(401).json({ message: 'Token invalide.' });
        }
        req.user = { id: user._id.toString(), role: normalizeRole(user.role) };
        req.currentUser = user;
        req.access = buildAccessContext(user);
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invalide.' });
    }
};
