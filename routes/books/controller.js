const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { getBooks, getBooksByUUID, deleteBook, deleteBookWithSongs, addBook } = require('./services');

async function renderBooksMainPage(req, res) {
    try {
        const books = await getBooks();
        res.render('books', {
            books,
            userRole: res.locals.userRole,
            requestURL: req.originalUrl,
            activePage: 'books',
            session: req.session
        });
    } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).send('Error fetching data');
    }
}

async function handleDeleteBook(req, res) {
    if (!req.body.book_uuid) {
        return res.status(400).send('Book UUID is required');
    }
    try {
        await deleteBook(req.body.book_uuid);
        res.redirect(req.get('referer') || '/books');
    } catch (err) {
        console.error('Error deleting book: ', err);
        res.status(500).send('Error deleting book!');
    }
}

async function handleDeleteBookWithSongs(req, res) {
    if (!req.body.book_uuid) {
        return res.status(400).send('Book UUID is required');
    }
    try {
        await deleteBookWithSongs(req.body.book_uuid);
        res.redirect(req.get('referer') || '/books');
    } catch (err) {
        console.error('Error deleting book with songs: ', err);
        res.status(500).send('Error deleting book with songs!');
    }
}

async function handleAddBook(req, res) {
    const { book_name, book_uuid } = req.body;
    if (!book_name || !book_uuid) {
        return res.status(400).send('Book name and UUID are required');
    }
    try {
        await addBook(book_name, book_uuid);
        res.redirect(req.get('referer') || '/books');
    } catch (err) {
        console.error('Error adding book: ', err);
        res.status(500).send('Error adding book!');
    }
}

async function handleUploadBookFromZip (req, res) {
    const zipPath = req.file.path;
    try {
        const zip = new AdmZip(zipPath);
        const zipEntries = zip.getEntries();

        function findFileByName(entries, filename) {
            return entries.find(entry =>
                entry.entryName.endsWith(`/${filename}`) || entry.entryName === filename);
        }

        const bookJsonEntry = findFileByName(zipEntries, 'book.json');
        if (!bookJsonEntry) {
            return res.status(400).send('No book.json file found in the ZIP.');
        }

        const bookJson = JSON.parse(bookJsonEntry.getData().toString('utf8'));
        const { name: bookName, book_uuid } = bookJson;

        const existingBook = await getBooksByUUID(book_uuid);
        if (!existingBook) await addBook(bookName, book_uuid);

        const existingSongs = await getSongsByBookUUID(book_uuid);
        const existingSongsSet = new Set((existingSongs || []).map(song =>
            `${song.title || ''}|${song.artist || song.singer || ''}|${song.number || ''}`
        ));

        const songEntries = zipEntries.filter(entry =>
            entry.entryName.startsWith('lyrics/') && entry.entryName.endsWith('.lyric'));

        for (const songEntry of songEntries) {
            const data = JSON.parse(songEntry.getData().toString('utf8'));
            const id = `${data.ATTR_TITLE || ''}|${data.ATTR_SINGER || ''}|${data.ATTR_NUMBER || ''}`;
            if (!existingSongsSet.has(id)) {
                const parts = (data.ATTR_ORDER || []).map((index, pos) => {
                    const lyric = data.ATTR_LYRICS[index - 1];
                    return {
                        type: lyric?.TYPE || '',
                        lyrics: lyric?.LYRIC || '',
                        order: pos + 1
                    };
                });
                await addSong(
                    data.ATTR_TITLE || '',
                    data.ATTR_SINGER || '',
                    book_uuid,
                    uuidv4(),
                    data.ATTR_CHORD || '',
                    parts,
                    data.ATTR_NUMBER || '',
                    data.ATTR_CHORD || '',
                    data.ATTR_SCRIPTURE || '',
                    data.ATTR_TAGS || []
                );
            }
        }

        fs.unlinkSync(zipPath);
        res.redirect('/');
    } catch (err) {
        console.error('Error processing ZIP:', err);
        res.status(500).send('Error processing ZIP file');
    }
}

module.exports = {
    renderBooksMainPage,
    handleAddBook,
    handleDeleteBook,
    handleDeleteBookWithSongs,
    handleUploadBookFromZip
}