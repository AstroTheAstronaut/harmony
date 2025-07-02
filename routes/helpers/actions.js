const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const AdmZip = require('adm-zip');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const User = require('../../models/User');
const RegisterCode = require('../../models/RegisterCode');
const Notification = require('../../models/Notification');

const {
    markAllNotificationsAsSeen,
    markIndividualNotificationAsSeen
} = require('../../functions/notifications');
const {roles} = require('../../permissions');
// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });
const {
    deleteBook,
    addBook,
    getBooks,
    getBooksByUUID,
    deleteBookWithSongs
} = require('../../functions/books');
const {
    addSong,
    removeSong,
    getSongsByBookUUID
} = require('../../functions/songs');
const { 
    requestSong,
    removeRequestedSong,
    removeAllRequestedSongs,
    getSongById,
    searchLyrics,
    createNotification
} = require('../../functions/db');
const bcrypt = require('bcryptjs/dist/bcrypt');

// Route to handle book deletion
router.post('/delete-book', async (req, res) => {
    const { book_uuid } = req.body;
    try {
        await deleteBook(book_uuid);
        res.redirect('/books');
    } catch (err) {
        console.error('Error deleting book:', err);
        res.status(500).send('Error deleting book');
    }
});

router.post('/delete-book-with-songs', async (req, res) => {
    const { book_uuid } = req.body;
    try {
        await deleteBookWithSongs(book_uuid);
        res.redirect('/books');
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
// router.post('/remove-song', async (req, res) => {
//     const { song_uid, redirectTo  } = req.body;
//     try {
//         await removeSong(song_uid);
//         res.redirect('/songs' || '/search' || '/');
//     } catch (err) {
//         console.error('Error removing song:', err);
//         res.status(500).send('Error removing song');
//     }
// });

// Route to handle song request
router.post('/request-song', async (req, res) => {
    const { song_uid } = req.body;
    const user_uid = req.session.user.user_id;  // Adjust if your session structure is different

    if (!song_uid || !user_uid) {
        return res.status(400).send('Song UID and user UID are required');
    }

    const notification_id = uuidv4();
    const req_id = uuidv4();

    try {
        await createNotification(
            notification_id,
            user_uid,
            "song_request",
            `User requested song ${song_uid}`,  // better message string
            false,
            song_uid,
            `/song-view/${song_uid}`
        );

        await requestSong(song_uid, req_id, user_uid);
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
        await removeRequestedSong(request_id);
        res.redirect('/');
    } catch (err) {
        console.error('Error removing requested song:', err);
        res.status(500).send('Error removing requested song');
    }   
});

router.post('/remove-all-requests', async (req, res) => {
    try {
        await removeAllRequestedSongs();
        res.redirect('/');
    } catch (err) {
        console.error('Error removing all requests:', err);
        res.status(500).send('Error removing all requests');
    }
});


// Route to display full song lyrics
// router.get('/song/:id', async (req, res) => {
//     const songId = req.params.id;
//     try {
//         const {songTitle, songParts} = await getSongById(songId);
//         console.log(songTitle);
//         console.log(song);
//         if (!songTitle || !songParts) {
//             return res.status(404).send('Song not found!');
//         }
//         res.render('song', { songTitle, songParts, session: req.session });
//     } catch (err) {
//         console.error('Error fetching song:', err);
//         res.status(500).send('Error fetching song');
//     }
// });

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

        // Fix: Handle null return from getBooksByUUID
        const existingBook = await getBooksByUUID(book_uuid);
        const existingBooks = existingBook || []; // Convert null to empty array

        if (existingBooks.length === 0) {
            await addBook(bookName, book_uuid);
        }

        // Retrieve existing songs for this book - also handle potential null
        const existingSongs = await getSongsByBookUUID(book_uuid);
        const existingSongsArray = existingSongs || []; // Convert null to empty array
        const existingSongsSet = new Set(existingSongsArray.map(song => 
            `${song.title || ''}|${song.artist || song.singer || ''}|${song.number || ''}`
        ));

        // Filter for song entries
        const songEntries = zipEntries.filter(entry => entry.entryName.startsWith('lyrics/') && entry.entryName.endsWith('.lyric'));

        for (const songEntry of songEntries) {
            const songData = JSON.parse(songEntry.getData().toString('utf8'));
            const { ATTR_TITLE, ATTR_SINGER, ATTR_NUMBER, ATTR_LYRICS, ATTR_ORDER, ATTR_CHORD, ATTR_SCRIPTURE, ATTR_TAGS} = songData;

            // Create a unique identifier for the song based on its attributes and book_uuid
            // Note: Using ATTR_SINGER instead of ATTR_ARTIST
            const songIdentifier = `${ATTR_TITLE || ''}|${ATTR_SINGER || ''}|${ATTR_NUMBER || ''}`;

            // Check if the song already exists
            if (!existingSongsSet.has(songIdentifier)) {
                // Process parts according to ATTR_ORDER
                const parts = [];
                
                if (ATTR_ORDER && Array.isArray(ATTR_ORDER)) {
                    // Create parts based on the order specified in ATTR_ORDER
                    ATTR_ORDER.forEach((orderIndex, position) => {
                        const lyricIndex = orderIndex - 1; // Convert 1-based to 0-based index
                        if (lyricIndex >= 0 && lyricIndex < ATTR_LYRICS.length) {
                            const lyric = ATTR_LYRICS[lyricIndex];
                            parts.push({
                                type: lyric.TYPE || '',
                                lyrics: lyric.LYRIC || '',
                                order: position + 1  // Use the position in the order array
                            });
                        }
                    });
                } else {
                    // Fallback: if no ATTR_ORDER, use lyrics in their original sequence
                    (ATTR_LYRICS || []).forEach((lyric, index) => {
                        parts.push({
                            type: lyric.TYPE || '',
                            lyrics: lyric.LYRIC || '',
                            order: index + 1
                        });
                    });
                }

                //await addSong(ATTR_TITLE || '', ATTR_SINGER || '', book_uuid, uuidv4(), parts, ATTR_NUMBER || '', ATTR_CHORD || '', ATTR_SCRIPTURE || '', ATTR_TAGS || []);
                await addSong(
                    ATTR_TITLE || '', 
                    ATTR_SINGER || '', 
                    book_uuid, 
                    uuidv4(), 
                    ATTR_CHORD || '', 
                    parts, 
                    ATTR_NUMBER || '', 
                    ATTR_CHORD || '', 
                    ATTR_SCRIPTURE || '', 
                    ATTR_TAGS || []
                );
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

        // Group results by song UID and detect repeated parts
        const results = {};

        rawResults.forEach(result => {
            // Use book + title as unique identifier if song_uid is missing
            const songKey = result.song_uid || `${result.book_uid}_${result.title}`;
            if (!results[songKey]) {
                results[songKey] = {
                    title: result.title || 'Unknown Title',
                    bo_name: result.book_name || 'Unknown Book',
                    chord: result.chord || null,
                    book_song_number: result.book_song_number || 'N/A',
                    song_uid: result.song_uid || 'No Song UID',
                    parts: []
                };
            }

            // Now iterate over result.parts
            if (Array.isArray(result.parts)) {
                result.parts.forEach(part => {
                    const existingPart = results[songKey].parts.find(p =>
                        p.part_type === part.part_type && p.lyrics === part.lyrics
                    );

                    if (existingPart) {
                        existingPart.repetitions += 1;
                    } else {
                        results[songKey].parts.push({
                            part_type: part.part_type,
                            lyrics: part.lyrics,
                            repetitions: 1
                        });
                    }
                });
            }
        });


        // Convert the results object to an array
        const groupedResults = Object.values(results);
        res.render('search-results', { results: groupedResults, query, activePage: 'home', session: req.session });
    } catch (err) {
        console.error('Error searching lyrics:', err);
        res.status(500).send('Error searching lyrics');
    }
});

// Route to see a song in full screen
router.get('/song-view/:id', async (req, res) => {
    try {
        const song = await getSongById(req.params.id);
        const books = await getBooks();
        const requestURL = req.originalUrl;
        if (song) {
            res.render('song-view', { song: song, books, userRole: res.locals.userRole, requestURL, activePage: 'songs', session: req.session }); // Ensure song data is being passed
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
    const song = await getSongById(songUid);
    if (!song) {
        return res.status(404).send('Song not found!');
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

        // Save song
        await editSong(song_uid, title, artist, book_name, null, partsArray);

        // Create notification
        const notification_id = uuidv4();
        const user_uid = req.session?.user?.user_uid;

        if (user_uid) {
            await createNotification(
                notification_id,
                user_uid,
                "song_edited",
                `User edited song ${song_uid}`,
                false,
                song_uid,
                `/song-view/${song_uid}`
            );
        } else {
            console.warn('No user_uid found in session. Skipping notification.');
        }

        res.redirect(`/song-view/${song_uid}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/addNote', async (req, res) => {
    const { note, user_id } = req.body;

    try {
        const newNote = new Note({
            note,
            user_id
        });
        await newNote.save();
        res.status(200).json({ success: true, note: newNote });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/schedule' , async (req, res) => {
    try {
        //const schedule = await getSchedule();
        res.render('schedule', {activePage: 'schedule', session: req.session});
    } catch (err) {
        console.error('Error fetching schedule:', err);
        res.status(500).send('Error fetching schedule');
    }
});

router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ exists: false, message: "No username provided" });

    const userExists = await User.exists({ username: username });

    if (userExists) {
      return res.json({ exists: true, message: "Username is taken" });
    } else {
      return res.json({ exists: false, message: "Username is available" });
    }
  } catch (err) {
    console.error('Error in /check-username:', err);
    return res.status(500).json({ exists: false, message: "Server error" });
  }

});

router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ exists: false, message: "No email provided" });

        const userExists = await User.exists({ email: email });

        if (userExists) {
            return res.json({ exists: true, message: "Email is already registered" });
        } else {
            return res.json({ exists: false, message: "Email is available" });
        }
    } catch (err) {
        console.error('Error in /check-email:', err);
        return res.status(500).json({ exists: false, message: "Server error" });
    }
});

router.post('/check-register-code', async (req, res) => {
    try {
        const { registerCode } = req.body;

        if (!registerCode || typeof registerCode !== 'string') {
            return res.status(400).json({ exists: false, message: "No valid register code provided" });
        }

        const codeEntry = await RegisterCode.findOne({ code: registerCode });

        if (!codeEntry) {
            return res.status(404).json({ exists: false, message: "Code does not exist" });
        }

        if (codeEntry.isUsed) {
            return res.status(400).json({ exists: true, valid: false, message: "Code has already been used" });
        }

        if (codeEntry.expiryDate && codeEntry.expiryDate < new Date()) {
            return res.status(400).json({ exists: true, valid: false, message: "Code has expired" });
        }

        // All checks passed
        return res.status(200).json({
            exists: true,
            valid: true,
            message: "Code is valid",
            role: codeEntry.role
        });

    } catch (err) {
        console.error('Error in /check-register-code:', err);
        return res.status(500).json({ exists: false, message: "Server error" });
    }
});

router.post('/notifications/mark-seen', async (req, res) => {
    const user = req.session?.user;
    if (!user || (user.role !== 'Admin' && user.role !== 'Superuser')) {
        return res.status(403).send('Forbidden');
    }

    try {
        await markAllNotificationsAsSeen(); // Assuming this function marks all notifications as seen
        // await Notification.updateMany({ seen: false }, { $set: { seen: true } });
        return res.redirect(req.get("Referrer") || "/");
    } catch (err) {
        console.error('Error marking notifications as seen:', err);
        return res.status(500).send('Error marking as seen');
    }
});

router.post('/notifications/mark-seen/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const user = req.session?.user;

        if (!user || (user.role !== 'Admin' && user.role !== 'Superuser')) {
            return res.status(403).send('Forbidden');
        }

        await markIndividualNotificationAsSeen(notificationId);

        return res.redirect(req.get("Referrer") || "/");
    } catch (err) {
        console.error('Error marking notification as seen:', err);
        return res.status(500).send('Error marking notification as seen');
    } 
});


module.exports = router;