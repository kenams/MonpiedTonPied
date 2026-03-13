const Notification = require('../models/Notification');
const { sendPushToUser } = require('./push');

const emitNotification = (req, payload) => {
    if (!req?.app) return;
    const io = req.app.get('io');
    if (!io) return;
    io.to(`user:${payload.user}`).emit('notification', payload);
};

const createAndEmitNotification = async (req, payload) => {
    const notification = await Notification.create(payload);
    emitNotification(req, {
        id: notification._id,
        user: notification.user.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
    });
    await sendPushToUser(notification.user, {
        title: notification.title,
        body: notification.message,
        data: notification.metadata || {},
    });
    return notification;
};

module.exports = { createAndEmitNotification };
