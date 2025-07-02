const express = require ('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', controller.renderBooksMainPage);
router.post('/add-book', controller.handleAddBook);
router.post('/delete-book', controller.handleDeleteBook);
router.post('/delete-book-with-songs', controller.handleDeleteBookWithSongs);
router.post('/upload-book', controller.handleUploadBookFromZip);
// TO-DO: Implement update book
// router.post('/update-book', controller.updateBook);

module.exports = router;