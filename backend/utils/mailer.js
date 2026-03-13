const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@monpiedtonpied.com';

let cachedTransport = null;

const getTransport = () => {
    if (cachedTransport) return cachedTransport;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return null;
    }
    cachedTransport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
    return cachedTransport;
};

const sendMail = async ({ to, subject, html, text }) => {
    const transport = getTransport();
    if (!transport) {
        console.warn('SMTP not configured. Skipping email.');
        return false;
    }
    await transport.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        text,
        html,
    });
    return true;
};

module.exports = { sendMail };
