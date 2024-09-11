const express = require('express');
const router = express.Router();
const {
    getBooks,
    getSongsWithPagination,
    getTotalSongs,
    getTotalSongsByBook,
    getSongsByBook,
    removeSong,
    getBookNameById
} = require('../functions/db');

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get the current page from query, default to 1
        const limit = parseInt(req.query.limit) || 10; // Set the limit for songs per page
        const offset = (page - 1) * limit; // Calculate the offset for the database query
        const requestURL = req.originalUrl; // Get the current URL to pass to the template
        const books = await getBooks();
        
        let bookId = req.query.book; // Get the selected book filter from query
        let songs;
        let bookName = 'All Books'; // Default value if no book is selected

        if (bookId && bookId !== 'all') {
            songs = await getSongsByBook(bookId, offset, limit); // Get songs with pagination and filter by book

            // Fetch the book name based on the bookId
            bookName = await getBookNameById(bookId); // Replace with actual function to get book name
        } else {
            songs = await getSongsWithPagination(offset, limit); // Get songs with pagination
        }

        const totalSongs = bookId && bookId !== 'all' ? await getTotalSongsByBook(bookId) : await getTotalSongs();
        // Get the total number of songs

        const totalPages = Math.ceil(totalSongs / limit); // Calculate total pages

        res.render('songs', {
            books,
            songs,
            currentPage: page,
            totalPages,
            activePage: 'songs',
            userRole: res.locals.userRole,
            limit,
            requestURL,
            bookName,  // Pass the book name to the template
            bookId     // Make sure to pass the bookId to the template as well
        });
    } catch (err) {
        console.error('Error fetching books or songs:', err);
        res.status(500).send('Error fetching data');
    }
});


module.exports = router;
