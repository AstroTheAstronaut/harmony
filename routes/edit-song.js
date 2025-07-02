const express = require('express');
const router = express.Router();
const { getSongById, getBooks, editSong} = require('../functions/db');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const { createNotification } = require('../functions/db');

// Route to render the edit page with pre-filled song data
router.get('/:songId', async (req, res) => {
    try {
        const songId = req.params.songId; // <-- FIXED
        const song = await getSongById(songId); // <-- don't forget to actually fetch the song
        const books = await getBooks();

        if (!song) {
            return res.status(404).send('Song not found');
        }
        console.log(song);
        res.render('edit-song', {
            title: 'Edit Song',
            song,                   // <-- send song to template
            books,
            userRole: res.locals.userRole,
            activePage: 'edit',
            session: req.session
        });
    } catch (err) {
        console.error('Error fetching song data:', err);
        res.status(500).send('An error occurred while fetching song data.');
    }
});

router.post ('/:songId/inline', async (req, res) => {
    const user_uid = req.session.user.user_id; 
    try {
        const songId = req.params.songId;
        const ogSong = await getSongById(songId);
        if (!ogSong) {
            return res.status(404).send('Song not found');
        }
        if (
            req.body.book_song_number === ogSong.book_song_number &&
            req.body.title === ogSong.title &&
            req.body.chord === ogSong.chord &&
            req.body.artist === ogSong.artist &&
            req.body.scripture === ogSong.scripture &&
            req.body.book_uuid === ogSong.book_id &&
            JSON.stringify(req.body.tags) === JSON.stringify(ogSong.tags)
        ) {
            return res.redirect(`/song-view/${songId}`);
        }
        const lyrics = req.body.lyrics || {};
        const types = req.body.part_type || {};
        const orders = req.body.part_order || {};

        const parts = Object.keys(lyrics).map(index => ({
            lyrics: lyrics[index],
            part_type: types[index],
            part_order: parseInt(orders[index], 10)
        })).sort((a, b) => a.part_order - b.part_order); // Ensure order

        
        const updatedSong = {
            song_uid: songId,
            book_song_number: req.body.book_song_number,
            title: req.body.title,
            chord: req.body.chord,
            artist: req.body.artist,
            scripture: req.body.scripture,
            book_id: req.body.book_uuid,
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
            parts
        };
        await editSong(
            songId,
            req.body.book_song_number,
            req.body.title,
            req.body.chord,
            req.body.artist,
            req.body.scripture,
            req.body.book_uuid,
            req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
            parts
        );
        const notification_id = uuidv4();
        //const user_uid = req.session?.user?.user_uid;

        if (user_uid) {
            await createNotification(
                notification_id,
                user_uid,
                "song_edited",
                `User edited song ${songId}`,
                false,
                songId,
                `/song-view/${songId}`
            );
        } else {
            console.warn('No user_uid found in session. Skipping notification.');
        }
        // Might be unnecessary
        //await editSong(updatedSong.song_uid, updatedSong.book_song_number, updatedSong.title, updatedSong.chord, updatedSong.artist, updatedSong.scripture, updatedSong.book_id, updatedSong.tags, updatedSong.parts);
        res.redirect(`/song-view/${songId}`);
    } catch (err) {
        console.error('Error updating song:', err);
        return res.status(500).send('An error occurred while updating the song.');
    }
});
module.exports = router;
