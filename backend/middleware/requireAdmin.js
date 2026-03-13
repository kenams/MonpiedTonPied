const { normalizeRole } = require('../utils/accessControl');

module.exports = function requireAdmin(req, res, next) {
    const user = req.currentUser;
    if (!user) {
        return res.status(401).json({ message: 'Authentification requise.' });
    }
    const role = normalizeRole(user.role);
    if (role !== 'admin') {
        return res.status(403).json({ message: 'Acces admin requis.' });
    }
    return next();
};
