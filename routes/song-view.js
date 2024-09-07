const express = require('express');
const router = express.Router();
const { getSongById, editSong } = require('../functions/db'); // Import editSong

router.get('/song-view/:id', async (req, res) => {
    try {
        const song = await getSongById(req.params.id);
        if (song) {
            res.render('song-view', { song: song, activePage: 'songs' }); // Ensure song data is being passed
        } else {
            res.status(404).send('Song not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/update-song', async (req, res) => {
    const { song_uid, title, artist, book_name, ...parts } = req.body;
    try {
        // Convert parts object to array
        const partsArray = Object.keys(parts).map(key => {
            const [ , id ] = key.split('_'); // Extract the part ID
            return { id, lyrics: parts[key] };
        });

        await editSong(song_uid, title, artist, book_name, null, partsArray); // Call editSong function

        res.redirect(`/song-view/${song_uid}`); // Redirect back to the song view
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
