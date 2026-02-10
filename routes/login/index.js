const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get ('/', controller.renderLoginPage);

module.exports = router;