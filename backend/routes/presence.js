const express = require('express');
const auth = require('../middleware/auth');
const { markOnline } = require('../utils/presenceStore');

const router = express.Router();

router.post('/ping', auth, (req, res) => {
    markOnline(req.user.id);
    res.json({ ok: true });
});

module.exports = router;
