const {getBooks} = require('../books/services');
const {addSong} = require('../songs/services');
const { v4: uuidv4 } = require('uuid');

async function renderUploadPage (req, res) {
    try {
        const books = await getBooks();
        res.render('upload', { title: 'Upload Song', books, userRole: res.locals.userRole, activePage: 'upload', session: req.session });
    } catch (err) {
        console.error('Error rendering upload page:', err);
        res.status(500).send('Error fetching data');
    }
}

async function handleUploadSong(req, res) {
    const { title, alt_title, artist, book, chord, bookSongNumber, parts } = req.body;
    const bookId = book || null;
    const songNumber = bookSongNumber ? parseInt(bookSongNumber) : null;
    const song_uid = uuidv4()
    try {
        if (!title || !parts) {
            return res.status(400).json({ error: `Bad Request: Missing title or parts. Received title: ${title}, parts: ${parts}` });
        }

        const parsedParts = JSON.parse(parts);

        if (!Array.isArray(parsedParts) || parsedParts.length === 0) {
            return res.status(400).json({ error: 'Invalid parts data' });
        }

        // Rest of the logic for checking book existence and adding the song
        await addSong(title, alt_title, artist, bookId, song_uid, chord, parsedParts, songNumber);
        res.redirect('/songs/upload-success');
    } catch (err) {
        console.error('Error handling upload song:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    renderUploadPage,
    handleUploadSong
}