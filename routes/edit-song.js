const express = require('express');
const router = express.Router();
const { getSongById, getBooks } = require('../functions/db');

// Route to render the edit page with pre-filled song data
router.get('/edit-song/:id', async (req, res) => {
    try {
        const songId = req.params.id;
        const song = await getSongById(songId);
        const books = await getBooks(); // Function to get the list of books

        if (!song) {
            return res.status(404).send('Song not found');
        }

        res.render('edit-song', { 
            title: 'Edit Song', 
            song, 
            books, 
            activePage: 'edit-song' 
        });
    } catch (err) {
        console.error('Error fetching song data:', err);
        res.status(500).send('An error occurred while fetching song data.');
    }
});

module.exports = router;
