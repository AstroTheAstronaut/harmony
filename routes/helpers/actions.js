const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const AdmZip = require('adm-zip');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });
const { 
    deleteBook,
    addBook,
    removeSong,
    requestSong,
    removeRequestedSong,
    getSongById,
    getBooksByUUID,
    addSong,
    searchLyrics,
    deleteBookWithSongs,
    getSongsByBookUUID
} = require('../../functions/db');

// Route to handle book deletion
router.post('/delete-book', async (req, res) => {
    const { book_uuid } = req.body;
    try {
        await deleteBook(book_uuid);
        res.redirect('/');
    } catch (err) {
        console.error('Error deleting book:', err);
        res.status(500).send('Error deleting book');
    }
});

router.post('/delete-book-with-songs', async (req, res) => {
    const { book_uuid } = req.body;
    try {
        await deleteBookWithSongs(book_uuid);
        res.redirect('/');
    } catch (err) {
        console.error('Error deleting book:', err);
        res.status(500).send('Error deleting book');
    }
});

// POST route to handle book addition
router.post('/add-book', async (req, res) => {
    const { book_name, book_uuid } = req.body;
    if (!book_name || !book_uuid) {
        return res.status(400).send('Book name and UUID are required');
    }
    try {
        await addBook(book_name, book_uuid);
        res.redirect('/');
    } catch (err) {
        console.error('Error adding book:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle song removal
router.post('/remove-song', async (req, res) => {
    const { song_uid, redirectTo  } = req.body;
    try {
        await removeSong(song_uid);
        res.redirect(redirectTo || '/');
    } catch (err) {
        console.error('Error removing song:', err);
        res.status(500).send('Error removing song');
    }
});

// Route to handle song request
router.post('/request-song', async (req, res) => {
    const { song_uid } = req.body;
    const req_id = uuidv4();
    try {
        console.log('Requesting song:', song_uid, req_id);
        await requestSong(song_uid, req_id);
        res.redirect('/');
    } catch (err) {
        console.error('Error requesting song:', err);
        res.status(500).send('Error requesting song');
    }   
});

// Route to remove requested song
router.post('/remove-requested', async (req, res) => {
    const { request_id } = req.body;
    try {
        console.log('Removing requested song:', request_id);
        await removeRequestedSong(request_id);
        res.redirect('/');
    } catch (err) {
        console.error('Error removing requested song:', err);
        res.status(500).send('Error removing requested song');
    }   
});

// Route to display full song lyrics
router.get('/song/:id', async (req, res) => {
    const songId = req.params.id;
    try {
        const song = await getSongById(songId);
        if (!song) {
            return res.status(404).send('Song not found');
        }
        res.render('song', { song });
    } catch (err) {
        console.error('Error fetching song:', err);
        res.status(500).send('Error fetching song');
    }
});

router.post('/upload-book', upload.single('bookFile'), async (req, res) => {
    const zipPath = req.file.path;
    try {
        const zip = new AdmZip(zipPath);
        const zipEntries = zip.getEntries();

        function findFileByName(entries, filename) {
            return entries.find(entry => entry.entryName.endsWith(`/${filename}`) || entry.entryName === filename);
        }

        const bookJsonEntry = findFileByName(zipEntries, 'book.json');
        
        if (!bookJsonEntry) {
            return res.status(400).send('No book.json file found in the ZIP.');
        }

        const bookJson = JSON.parse(bookJsonEntry.getData().toString('utf8'));
        const { name: bookName, book_uuid } = bookJson;

        const existingBook = await getBooksByUUID(book_uuid);

        if (existingBook.length === 0) {
            await addBook(bookName, book_uuid);
        }

        // Retrieve existing songs for this book
        const existingSongs = await getSongsByBookUUID(book_uuid);
        const existingSongsSet = new Set(existingSongs.map(song => 
            `${song.title || ''}|${song.artist || ''}|${song.number || ''}`
        ));

        // Filter for song entries
        const songEntries = zipEntries.filter(entry => entry.entryName.startsWith('lyrics/') && entry.entryName.endsWith('.lyric'));

        for (const songEntry of songEntries) {
            const songData = JSON.parse(songEntry.getData().toString('utf8'));
            const { ATTR_TITLE, ATTR_ARTIST, ATTR_NUMBER, ATTR_LYRICS, ATTR_ORDER } = songData;

            // Create a unique identifier for the song based on its attributes and book_uuid
            const songIdentifier = `${ATTR_TITLE || ''}|${ATTR_ARTIST || ''}|${ATTR_NUMBER || ''}`;

            // Check if the song already exists
            if (!existingSongsSet.has(songIdentifier)) {
                const parts = (ATTR_LYRICS || []).map((lyric, index) => ({
                    type: lyric.TYPE || '',
                    lyrics: lyric.LYRIC || '',
                    order: ATTR_ORDER ? ATTR_ORDER[index] : index + 1  // Ensure order is preserved
                }));

                await addSong(ATTR_TITLE || '', ATTR_ARTIST || '', book_uuid, uuidv4(), parts, ATTR_NUMBER || '');
            }
        }

        // Clean up the uploaded file
        fs.unlinkSync(zipPath);
        res.redirect('/');

    } catch (err) {
        console.error('Error processing ZIP file:', err);
        res.status(500).send('Error processing ZIP file');
    }
});

// Route to handle searching lyrics
router.get('/search', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).send('Search query is required');
    }
    try {
        const rawResults = await searchLyrics(query);

        // Group results by song ID and detect repeated parts
        const results = {};
        rawResults.forEach(result => {
            if (!results[result.song_id]) {
                results[result.song_id] = {
                    title: result.title,
                    artist: result.artist,
                    bo_name: result.bo_name,
                    book_song_number: result.book_song_number,
                    song_uid: result.song_uid,
                    song_id: result.song_id,
                    parts: []
                };
            }

            // Find if the part already exists
            const existingPart = results[result.song_id].parts.find(part => 
                part.part_type === result.part_type && part.lyrics === result.lyrics
            );

            if (existingPart) {
                // Increment repetition count if part already exists
                existingPart.repetitions += 1;
            } else {
                // Add new part if it doesn't exist yet
                results[result.song_id].parts.push({
                    part_type: result.part_type,
                    lyrics: result.lyrics,
                    repetitions: 1 // Start with 1 occurrence
                });
            }
        });

        // Convert the results object to an array
        const groupedResults = Object.values(results);
        
        res.render('search-results', { results: groupedResults, query ,activePage: 'home'});
    } catch (err) {
        console.error('Error searching lyrics:', err);
        res.status(500).send('Error searching lyrics');
    }
});

// Route to see a song in full screen
router.get('/song-view/:id', async (req, res) => {
    try {
        const song = await getSongById(req.params.id);
        const requestURL = req.originalUrl;
        if (song) {
            res.render('song-view', { song: song, userRole: res.locals.userRole, requestURL, activePage: 'songs' }); // Ensure song data is being passed
        } else {
            res.status(404).send('Song not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/song/:song_uid/public', async (req, res) => {
    const songUid = req.params.song_uid;
    const song = await getSongById(songUid);  // Fetch song data by UID from your database
    
    if (!song) {
        return res.status(404).send('Song not found');
    }

    res.render('public-view', { song, isPublic: true });
});

// Route to update a song
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