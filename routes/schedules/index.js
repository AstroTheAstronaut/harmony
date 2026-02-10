const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', controller.renderSchedulesPage);
router.post('/create', controller.createScheduleRoute);

module.exports = router;