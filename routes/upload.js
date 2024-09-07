const express = require('express');
const router = express.Router();
const { getBooks, getBooksByUUID, createBook, addSong } = require('../functions/db');
const multer = require('multer');
// Temporary storage
const upload = multer({ dest: 'uploads/' });
const { v4: uuidv4 } = require('uuid');

// GET route to render the upload form
router.get('/', async (req, res) => {
  try {
    const books = await getBooks();
    res.render('upload', { title: 'Upload Song', books, userRole: res.locals.userRole, activePage: 'upload' });
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).send('Internal Server Error');
  }
});

// POST route to handle the upload form submission
router.post('/upload-song', upload.single('file'), async (req, res) => {
  const { title, artist, book, bookSongNumber, parts } = req.body;
  const bookId = book || null;
  const songNumber = bookSongNumber ? parseInt(bookSongNumber) : null;
  const song_uid = uuidv4();

  try {
    if (!title || !parts) {
      return res.status(400).json({ error: `Bad Request: Missing title or parts. Received title: ${title}, parts: ${parts}` });
    }

    const parsedParts = JSON.parse(parts);

    if (!Array.isArray(parsedParts) || parsedParts.length === 0) {
      return res.status(400).json({ error: 'Invalid parts data' });
    }

    // Rest of the logic for checking book existence and adding the song
    await addSong(title, artist, bookId, song_uid, parsedParts, songNumber);

    res.redirect('/');
  } catch (err) {
    console.error('Error processing upload:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;