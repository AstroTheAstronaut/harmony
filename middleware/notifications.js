const Notification = require('../models/Notification');
const User = require('../models/User');
const Song = require('../models/Song');

async function notificationsMiddleware(req, res, next) {
    try {
        const user = req.session?.user;
        if (!user || (user.role !== 'Admin' && user.role !== 'Superuser')) {
            res.locals.notifications = [];
            res.locals.unseenNotificationCount = 0;
            return next();
        }

        // Load unseen notifications
        const notifications = await Notification.find({ seen: false })
            .sort({ created_at: -1 })
            .limit(10)
            .lean(); // Use lean to work with plain JS objects

        const userIds = [...new Set(notifications.map(n => n.user_id))];
        const songIds = [...new Set(notifications.map(n => n.song_id))];

        // Load all referenced users and songs in one go
        const [users, songs] = await Promise.all([
            User.find({ user_uid: { $in: userIds } }, 'user_uid username').lean(),
            Song.find({ song_uid: { $in: songIds } }, 'song_uid title').lean()
        ]);

        // Build lookup maps
        const userMap = Object.fromEntries(users.map(u => [u.user_uid, u.username]));
        const songMap = Object.fromEntries(songs.map(s => [s.song_uid, s.title]));

        // Update messages in notifications
        const enhancedNotifications = notifications.map(n => {
            const username = userMap[n.user_id] || 'Unknown user';
            const songTitle = songMap[n.song_id] || `Unknown song (${n.song_id})`;

            let message = n.message;
            if (n.type === 'song_request') {
                message = `${username} requested song "${songTitle}"`;
            } else if (n.type === 'song_edited') {
                message = `${username} edited song "${songTitle}"`;
            } else if (n.type === 'song_mark_deleted') {
                message = `${username} marked song "${songTitle}" for deletion`;
            } else if (n.type === 'song_deleted') {
                message = `The server deleted song "${songTitle}"`;
            } else if (n.type === 'song_uploaded') {
                message = `${username} uploaded song "${songTitle}"`;
            }
            return {
                ...n,
                message
            };
        });

        res.locals.notifications = enhancedNotifications;
        res.locals.unseenNotificationCount = enhancedNotifications.length;
    } catch (err) {
        console.error('Error loading notifications:', err);
        res.locals.notifications = [];
        res.locals.unseenNotificationCount = 0;
    }
    next();
}



module.exports = notificationsMiddleware;
