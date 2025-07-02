const express = require ('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', controller.renderUploadPage);
router.post('/upload-song', controller.handleUploadSong);

module.exports = router;