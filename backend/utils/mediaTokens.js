const crypto = require('crypto');

const SECRET =
    process.env.MEDIA_TOKEN_SECRET || process.env.JWT_SECRET || 'change_me';

const base64url = (input) =>
    Buffer.from(input)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

const signToken = (payload) => {
    const data = base64url(JSON.stringify(payload));
    const sig = base64url(
        crypto.createHmac('sha256', SECRET).update(data).digest()
    );
    return `${data}.${sig}`;
};

const verifyToken = (token) => {
    if (!token) return null;
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expected = base64url(
        crypto.createHmac('sha256', SECRET).update(data).digest()
    );
    const sigOk =
        sig.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    if (!sigOk) return null;
    try {
        const payload = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
        if (payload.exp && Date.now() > payload.exp) return null;
        return payload;
    } catch {
        return null;
    }
};

module.exports = { signToken, verifyToken };
