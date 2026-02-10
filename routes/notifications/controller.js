const {getAllNotifications, getAllNotificationsWithPagination, markNotificationAsSeen, deleteNotification} = require('./services');

async function renderNotificationsPage (req, res) {
    try {
        // Get pagination parameters from query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filter = req.query.filter || 'all';

        // Get paginated notifications
        const result = await getAllNotificationsWithPagination(page, limit, filter);
        
        console.log('Paginated Notifications:', result);
        res.render('notifications', {
            notifications: result.notifications,
            pagination: result.pagination,
            currentFilter: filter,
            query: req.query,
            activePage: 'notifications',
            session: req.session
        });
    } catch (err) {
        console.error('Error rendering notifications page:', err);
        res.status(500).send('Internal Server Error');
    }
}

async function markAsSeen(req, res) {
    try {
        const { notificationId } = req.params;
        const success = await markNotificationAsSeen(notificationId);
        
        if (success) {
            res.redirect('/notifications');
        } else {
            res.status(404).send('Notification not found');
        }
    } catch (err) {
        console.error('Error marking notification as seen:', err);
        res.status(500).send('Internal Server Error');
    }
}

async function deleteNotificationById(req, res) {
    try {
        const { notificationId } = req.params;
        const success = await deleteNotification(notificationId);
        
        if (success) {
            res.redirect('/notifications');
        } else {
            res.status(404).send('Notification not found');
        }
    } catch (err) {
        console.error('Error deleting notification:', err);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    renderNotificationsPage,
    markAsSeen,
    deleteNotificationById
};