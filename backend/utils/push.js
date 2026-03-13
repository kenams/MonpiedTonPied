const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const PUSH_SUBJECT = process.env.PUSH_SUBJECT || 'mailto:admin@monpiedtonpied.com';

const isPushConfigured = () => Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (isPushConfigured()) {
    webpush.setVapidDetails(PUSH_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const sendPushToUser = async (userId, payload) => {
    if (!isPushConfigured()) return;
    const subs = await PushSubscription.find({ user: userId });
    if (!subs.length) return;
    const body = JSON.stringify(payload);
    await Promise.all(
        subs.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: sub.keys,
                    },
                    body
                );
            } catch (error) {
                if (error?.statusCode === 410 || error?.statusCode === 404) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                }
            }
        })
    );
};

module.exports = { sendPushToUser, isPushConfigured, VAPID_PUBLIC_KEY };
