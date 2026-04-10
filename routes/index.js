const express = require('express');
const router = express.Router();
const {
    getBooks,
    getSongs,
    getMostRequestedSongs,
    getRequestedSongs,
    getSongById,
    getActivePublicSchedules
} = require('../functions/db');

// Route for the homepage
router.get('/', async (req, res) => {
    try {
        const books = await getBooks();
        const songs = await getSongs();
        const mostRequestedSongs = await getMostRequestedSongs();
        const activePublicSchedules = await getActivePublicSchedules();
        const requestedSongs = await getRequestedSongs();
        res.render('index', { books, songs, mostRequestedSongs, requestedSongs, activePublicSchedules, userRole: res.locals.userRole, activePage: 'home', session: req.session });
    } catch (err) {
        console.error('Error fetching books or songs:', err);
        res.status(500).send('Error fetching data');
    }
});

module.exports = router;
