const express = require ('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', controller.renderSuperUserPage);
router.post('/users/:action', controller.handleUserAction);
router.post('/registration-code/create', controller.handleCreateRegistrationCode);
router.post('/registration-codes/disable', controller.handleDisableCode);

module.exports = router;