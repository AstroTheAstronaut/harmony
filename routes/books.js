const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validator = require('validator');
const {getBooks, deleteBook, addBook} = require('../functions/db');

function sanitizeInput(input) {
    return validator.escape(input);
  }

router.get('/', async (req, res) => {
    try {
        const books = await getBooks();
        const currentUrl = req.originalUrl;
        res.render('books', { books, userRole: res.locals.userRole, requestURL: currentUrl, activePage: 'books' });
    } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).send('Error fetching data');
    }
  });


router.post('/delete-book', async (req, res) => {
    const { book_uuid } = req.body;
    try {
        await deleteBook(book_uuid)
        res.redirect('/');
    } catch (err) {
        console.error('Error deleting book:', err);
        res.status(500).send('Error deleting book');
    }
});

router.post('/add-book', [
    body('book_name').isString().notEmpty(),
    body('book_uuid').isAlphanumeric().isLength({ min: 1 })
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { book_name, book_uuid } = req.body;
    try {
      await addBook(book_name, book_uuid);
      res.redirect('/');
    } catch (err) {
      console.error('Error adding book:', err);
      res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
