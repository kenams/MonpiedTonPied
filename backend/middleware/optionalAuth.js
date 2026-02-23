const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

module.exports = function optionalAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return next();
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
    } catch (error) {
        req.user = null;
    }

    return next();
};
