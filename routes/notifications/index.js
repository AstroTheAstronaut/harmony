const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', controller.renderNotificationsPage);
router.get('/mark-seen/:notificationId', controller.markAsSeen);
router.get('/delete/:notificationId', controller.deleteNotificationById);

module.exports = router;