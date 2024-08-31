const express = require('express');
const router = express.Router();
const {getBooks, getSongs, removeSong} = require('../functions/db');

router.get('/', async (req, res) => {
    try {
        const books = await getBooks();
        const songs = await getSongs();
        res.render('songs', { books, songs, activePage: 'songs' });
    } catch (err) {
        console.error('Error fetching books or songs:', err);
        res.status(500).send('Error fetching data');
    }
  });

module.exports = router;
