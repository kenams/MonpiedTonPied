const presenceMap = new Map();

const markOnline = (userId) => {
    if (!userId) return;
    presenceMap.set(userId.toString(), Date.now());
};

const isOnline = (userId, windowMs) => {
    if (!userId) return false;
    const lastSeen = presenceMap.get(userId.toString());
    if (!lastSeen) return false;
    return Date.now() - lastSeen <= windowMs;
};

module.exports = { markOnline, isOnline };
