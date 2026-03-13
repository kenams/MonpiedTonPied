const { hasSubscriptionAccess } = require('../utils/accessControl');

module.exports = function requireSubscription(req, res, next) {
    const user = req.currentUser;
    if (!user) {
        return res.status(401).json({ message: 'Authentification requise.' });
    }
    if (user.isSuspended) {
        return res.status(403).json({ message: 'Compte suspendu.' });
    }
    if (!hasSubscriptionAccess(user)) {
        return res.status(403).json({ message: 'Abonnement requis.' });
    }
    return next();
};
