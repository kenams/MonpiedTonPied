const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { buildAccessContext, normalizeRole } = require('../utils/accessControl');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

module.exports = async function optionalAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return next();
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(payload.id);
        if (!user) {
            req.user = null;
            return next();
        }
        req.user = { id: user._id.toString(), role: normalizeRole(user.role) };
        req.currentUser = user;
        req.access = buildAccessContext(user);
    } catch (error) {
        req.user = null;
    }

    return next();
};
