const Content = require('../models/Content');

/**
 * Algorithme de recommandation basé sur :
 * 1. Tags des contenus likés → score +3 par tag commun
 * 2. Catégories likées → score +2 par catégorie
 * 3. Créateurs likés → score +5 (fan)
 * 4. Fraîcheur → score +1 si < 7j, +0.5 si < 30j
 * 5. Popularité → log(likes + views * 0.1)
 * 6. Diversité → pénalité si même créateur apparaît 3x+
 */
async function getRecommendations(userId, { limit = 20, exclude = [] } = {}) {
    // Profil utilisateur depuis ses likes
    const liked = await Content.find({ likedBy: userId }).select('tags category creator');

    const tagFreq = {};
    const catFreq = {};
    const creatorFreq = {};

    for (const c of liked) {
        for (const t of (c.tags || [])) tagFreq[t] = (tagFreq[t] || 0) + 1;
        if (c.category) catFreq[c.category] = (catFreq[c.category] || 0) + 1;
        const cid = c.creator?.toString();
        if (cid) creatorFreq[cid] = (creatorFreq[cid] || 0) + 1;
    }

    const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
    const topCats = Object.entries(catFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
    const topCreators = Object.entries(creatorFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c]) => c);

    // Si aucun profil, retourner le feed populaire
    if (liked.length === 0) {
        return Content.find({ _id: { $nin: exclude } })
            .sort({ 'stats.likes': -1, createdAt: -1 })
            .limit(limit)
            .populate('creator', 'username displayName avatarUrl verifiedCreator');
    }

    // Candidats : contenus non-likés
    const filter = {
        _id: { $nin: [...exclude] },
        likedBy: { $ne: userId },
    };

    // Boost : contenus avec tags ou catégories proches
    if (topTags.length > 0) filter.$or = [
        { tags: { $in: topTags } },
        { category: { $in: topCats } },
        { creator: { $in: topCreators } },
    ];

    const candidates = await Content.find(filter)
        .limit(200)
        .populate('creator', 'username displayName avatarUrl verifiedCreator');

    const now = Date.now();
    const creatorCount = {};

    const scored = candidates.map(c => {
        let score = 0;

        // Tags
        for (const t of (c.tags || [])) {
            if (tagFreq[t]) score += 3 * Math.log(tagFreq[t] + 1);
        }

        // Catégorie
        if (c.category && catFreq[c.category]) score += 2 * Math.log(catFreq[c.category] + 1);

        // Créateur
        const cid = c.creator?._id?.toString();
        if (cid && creatorFreq[cid]) score += 5 * Math.log(creatorFreq[cid] + 1);

        // Fraîcheur
        const ageMs = now - new Date(c.createdAt).getTime();
        if (ageMs < 7 * 86400000) score += 1;
        else if (ageMs < 30 * 86400000) score += 0.5;

        // Popularité
        score += Math.log((c.stats?.likes || 0) + (c.stats?.views || 0) * 0.1 + 1);

        // Pénalité diversité
        const cnt = creatorCount[cid] || 0;
        if (cnt >= 3) score *= 0.3;
        creatorCount[cid] = cnt + 1;

        // Léger bruit aléatoire pour éviter la répétition exacte
        score += Math.random() * 0.5;

        return { content: c, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => s.content);
}

module.exports = { getRecommendations };
