const Notification = require('../../models/Notification')
const User = require('../../models/User')
async function getAllNotifications () {
    try {
        const notifications = await Notification.find({})
            .sort({ created_at: -1 });

        // Get user information for each notification
        const notificationsWithUsers = await Promise.all(
            notifications.map(async (notification) => {
                let username = 'Unknown User';
                
                if (notification.user_id) {
                    try {
                        const user = await User.findOne({ user_uid: notification.user_id });
                        username = user ? user.username : 'Unknown User';
                    } catch (userErr) {
                        console.error('Error fetching user:', userErr);
                        username = 'Unknown User';
                    }
                }

                return {
                    notificationId: notification.notification_id,
                    userId: notification.user_id,
                    username: username,
                    type: notification.type,
                    message: notification.message,
                    createdAt: notification.created_at,
                    seen: notification.seen,
                    songId: notification.song_id || null,
                    link: notification.link || null,
                };
            })
        );

        return notificationsWithUsers;
    } catch (err) {
        console.error('Error in getAllNotifications:', err);
        throw new Error('Failed to retrieve notifications');
    }
}

async function getAllNotificationsWithPagination (page = 1, limit = 10, filter = 'all') {
    try {
        // Validate inputs
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Max 100 per page
        const skip = (pageNum - 1) * limitNum;

        // Build filter query
        let filterQuery = {};
        if (filter === 'seen') {
            filterQuery.seen = true;
        } else if (filter === 'unseen') {
            filterQuery.seen = false;
        }
        // 'all' means no additional filter

        // Get total count for pagination info
        const totalCount = await Notification.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalCount / limitNum);

        // Get paginated notifications
        const notifications = await Notification.find(filterQuery)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limitNum);

        // Get user information for each notification
        const notificationsWithUsers = await Promise.all(
            notifications.map(async (notification) => {
                let username = 'Unknown User';
                
                if (notification.user_id) {
                    try {
                        const user = await User.findOne({ user_uid: notification.user_id });
                        username = user ? user.username : 'Unknown User';
                    } catch (userErr) {
                        console.error('Error fetching user:', userErr);
                        username = 'Unknown User';
                    }
                }

                return {
                    notificationId: notification.notification_id,
                    userId: notification.user_id,
                    username: username,
                    type: notification.type,
                    message: notification.message,
                    createdAt: notification.created_at,
                    seen: notification.seen,
                    songId: notification.song_id || null,
                    link: notification.link || null,
                };
            })
        );

        return {
            notifications: notificationsWithUsers,
            pagination: {
                currentPage: pageNum,
                totalPages: totalPages,
                totalCount: totalCount,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
                nextPage: pageNum < totalPages ? pageNum + 1 : null,
                prevPage: pageNum > 1 ? pageNum - 1 : null
            }
        };
    } catch (err) {
        console.error('Error in getAllNotificationsWithPagination:', err);
        throw new Error('Failed to retrieve notifications with pagination');
    }
}

async function markNotificationAsSeen(notificationId) {
    try {
        const result = await Notification.updateOne(
            { notification_id: notificationId },
            { $set: { seen: true } }
        );
        return result.modifiedCount > 0;
    } catch (err) {
        console.error('Error in markNotificationAsSeen:', err);
        throw new Error('Failed to mark notification as seen');
    }
}

async function deleteNotification(notificationId) {
    try {
        const result = await Notification.deleteOne({ notification_id: notificationId });
        return result.deletedCount > 0;
    } catch (err) {
        console.error('Error in deleteNotification:', err);
        throw new Error('Failed to delete notification');
    }
}

module.exports = {
    getAllNotifications,
    getAllNotificationsWithPagination,
    markNotificationAsSeen,
    deleteNotification
}