const {
    getSongsWithPagination,
    getTotalSongs,
    getTotalSongsByBook,
    getSongsByBook,
} = require('./services');

const {
    getBookNameById,
    getBooks
} = require ('../books/services');
async function renderSongsPage(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const requestURL = req.originalUrl;

        const books = await getBooks();
        let bookId = req.query.book;
        let songs;
        let bookName = 'All Books';

        if (bookId && bookId !== 'all') {
            songs = await getSongsByBook(bookId, offset, limit);
            bookName = await getBookNameById(bookId);
        } else {
            songs = await getSongsWithPagination(offset, limit);
        }

        const totalSongs = bookId && bookId !== 'all'
            ? await getTotalSongsByBook(bookId)
            : await getTotalSongs();

        const totalPages = Math.ceil(totalSongs / limit);

        res.render('songs', {
            books,
            songs,
            currentPage: page,
            totalPages,
            activePage: 'songs',
            userRole: res.locals.userRole,
            limit,
            requestURL,
            bookName,
            bookId,
            session: req.session
        });
    } catch (err) {
        console.error('Error rendering songs page:', err);
        res.status(500).send('Error fetching data');
    }
}

module.exports = {
    renderSongsPage
};
