const express = require('express');
const path = require('path');
const fs = require('fs');
const Content = require('../models/Content');
const { verifyToken } = require('../utils/mediaTokens');

const router = express.Router();

router.get('/:contentId/:index', async (req, res) => {
    const { contentId, index } = req.params;
    const token = req.query.token;
    const payload = verifyToken(typeof token === 'string' ? token : '');

    if (!payload || payload.c !== contentId || Number(payload.i) !== Number(index)) {
        return res.status(403).json({ message: 'Acces refuse.' });
    }

    const content = await Content.findById(contentId);
    if (!content) {
        return res.status(404).json({ message: 'Contenu introuvable.' });
    }

    const fileIndex = Number(index);
    const file = content.files?.[fileIndex];
    if (!file || !file.url) {
        return res.status(404).json({ message: 'Fichier introuvable.' });
    }

    let uploadsPath = null;
    if (file.url.startsWith('/uploads/')) {
        uploadsPath = file.url;
    } else if (file.url.startsWith('http://') || file.url.startsWith('https://')) {
        try {
            const parsed = new URL(file.url);
            if (parsed.pathname.startsWith('/uploads/')) {
                uploadsPath = parsed.pathname;
            }
        } catch {
            uploadsPath = null;
        }
    }

    if (!uploadsPath) {
        return res.status(400).json({ message: 'Fichier non supporte.' });
    }

    const relativePath = uploadsPath.replace(/^\/+/, '');
    const filePath = path.join(__dirname, '..', relativePath);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Fichier manquant.' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', file.type || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=0, no-store');

    if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize) {
            res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
            return res.end();
        }

        const chunkSize = end - start + 1;
        const stream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Content-Length': chunkSize,
        });
        return stream.pipe(res);
    }

    res.writeHead(200, { 'Content-Length': fileSize });
    return fs.createReadStream(filePath).pipe(res);
});

module.exports = router;
