const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_URL ||
        (process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET)
);

if (cloudinaryConfigured && !process.env.CLOUDINARY_URL) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const safeBase = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        cb(null, `${safeBase}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')) {
        return cb(new Error('Type de fichier non supporte.'));
    }
    return cb(null, true);
};

const avatarFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Type de fichier non supporte.'));
    }
    return cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 },
});

const avatarUpload = multer({
    storage,
    fileFilter: avatarFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadToCloudinary = async (filePath, mimetype) => {
    const resourceType = mimetype.startsWith('video/') ? 'video' : 'image';
    const result = await cloudinary.uploader.upload(filePath, {
        resource_type: resourceType,
        folder: 'monpiedtonpied',
    });
    return result.secure_url || result.url;
};

router.post('/', auth, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        const role = user?.role === 'user' ? 'consumer' : user?.role;
        if (!user || (role !== 'creator' && role !== 'admin')) {
            return res.status(403).json({ message: 'Compte createur requis.' });
        }
        return next();
    } catch (error) {
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
}, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Fichier manquant.' });
    }

    let url;
    if (cloudinaryConfigured) {
        try {
            url = await uploadToCloudinary(req.file.path, req.file.mimetype);
            fs.unlink(req.file.path, () => {});
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({ message: 'Erreur upload cloud.' });
        }
    } else {
        const baseUrl =
            process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
        url = `${baseUrl}/uploads/${req.file.filename}`;
    }

    return res.status(201).json({
        url,
        type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
        filename: req.file.filename,
        size: req.file.size,
    });
});

router.post('/avatar', auth, avatarUpload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Fichier manquant.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    let url;
    if (cloudinaryConfigured) {
        try {
            url = await uploadToCloudinary(req.file.path, req.file.mimetype);
            fs.unlink(req.file.path, () => {});
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({ message: 'Erreur upload cloud.' });
        }
    } else {
        const baseUrl =
            process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
        url = `${baseUrl}/uploads/${req.file.filename}`;
    }

    user.avatarUrl = url;
    await user.save();

    return res.status(201).json({
        url,
        filename: req.file.filename,
        size: req.file.size,
    });
});

router.use((err, req, res, next) => {
    if (err) {
        return res.status(400).json({ message: err.message || 'Erreur upload.' });
    }
    return next();
});

module.exports = router;
