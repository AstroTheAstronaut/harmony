const Notification = require('../models/Notification');

async function createNotification(notification_id, userId, type, message, seen, song_id, link) {
    try {
        if (!userId || !type || !notification_id) {
            return Promise.reject(new Error("User ID and/or notification ID is required for creating a notification"));
        }
        const notification = new Notification({
            notification_id: notification_id,
            user_id: userId,
            type: type,
            message: message || null,
            seen: seen || false,
            song_id: song_id || null,
            link: link || null
        });
        await notification.save();
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getNotifications() {
    try {
        const notifications = await Notification.find({ seen: false }).sort({ created_at: -1 });
        // Return empty array if none found — consistent return type
        return notifications;
    } catch (err) {
        throw err;
    }
}

async function markAllNotificationsAsSeen () {
    try {
        await Notification.updateMany({ seen: false }, { $set: { seen: true } });
        return Promise.resolve();
    } catch (err) {
        throw err;
    }
}

async function markIndividualNotificationAsSeen(notificationId) {
    try {
        const notification = await Notification.findOne({ notification_id: notificationId });
        if (!notification) {
            throw new Error("Notification not found");
        }

        notification.seen = true;
        await notification.save()
    } catch (err) {
        throw err;
    }
}

module.exports = {
    createNotification,
    getNotifications,
    markAllNotificationsAsSeen,
    markIndividualNotificationAsSeen
}