const express = require('express');
const router = express.Router();
const {getBooks, deleteBook, addBook} = require('../functions/db');

router.get('/', async (req, res) => {
    try {
        const books = await getBooks();
        res.render('books', { books, activePage: 'books' });
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

router.post('/add-book', async (req, res) => {
    const { book_name, book_uuid } = req.body; // Get the form data

    if (!book_name || !book_uuid) {
        return res.status(400).send('Book name and UUID are required');
    }

    try {
        await addBook(book_name, book_uuid); // Pass the book_name and book_uuid to the addBook function
        res.redirect('/'); // Redirect to the home page or another page after addition
    } catch (err) {
        console.error('Error adding book:', err);
        res.status(500).send('Internal Server Error');
    }
});
module.exports = router;
