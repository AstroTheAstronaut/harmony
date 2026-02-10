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
            let orderBy = req.query.orderBy || 'titleAsc';
        let songs;
        let bookName = 'All Books';

        if (bookId && bookId !== 'all') {
            // Use the paginated/ordered query with a book filter so ordering works server-side
            songs = await getSongsWithPagination(offset, limit, orderBy, bookId);
            bookName = await getBookNameById(bookId);
        } else {
            songs = await getSongsWithPagination(offset, limit, orderBy);
        }
        if (req.query.tag) {
            songs = songs.filter(song => song.tags.includes(req.query.tag));
        }

        switch (orderBy) {
            case 'titleAsc':
                songs.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'titleDesc':
                songs.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'noAsc':
                songs.sort((a, b) => a.number - b.number);
                break;
            case 'noDesc':
                songs.sort((a, b) => b.number - a.number);
                break;
            case 'artistAsc':
                songs.sort((a, b) => a.artist.localeCompare(b.artist));
                break;
            case 'artistDesc':
                songs.sort((a, b) => b.artist.localeCompare(a.artist));
                break;
            case 'bookAsc':
                songs.sort((a, b) => a.book_details.name.localeCompare(b.book_details.name));
                break;
            case 'bookDesc':
                songs.sort((a, b) => b.book_details.name.localeCompare(a.book_details.name));
                break;
            default:
                // Default sorting by title ascending
                songs.sort((a, b) => a.title.localeCompare(b.title));
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
            session: req.session,
            // pass upload success flag/message to template if present
            uploaded: req.query && req.query.uploaded ? true : false,
        uploadedMessage: req.query && req.query.message ? req.query.message : (req.query && req.query.uploaded ? 'Song uploaded successfully' : null),
        orderBy,
        });
    } catch (err) {
        console.error('Error rendering songs page:', err);
        res.status(500).send('Error fetching data');
    }
}

module.exports = {
    renderSongsPage
};
