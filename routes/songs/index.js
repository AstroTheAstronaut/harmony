const express = require ('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', controller.renderSongsPage);

// Route to show success banner after upload. We set a query flag and reuse
// the main render function so the songs list is displayed with the banner.
router.get('/upload-success', (req, res) => {
	// Mark that upload succeeded so the controller can pass a flag to the template
	req.query.uploaded = '1';
	// optional: custom message -> /songs/upload-success?message=Your+song+is+live
	return controller.renderSongsPage(req, res);
});

module.exports = router;