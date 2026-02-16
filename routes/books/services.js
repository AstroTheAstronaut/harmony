const Book = require('../../models/Book');

async function addBook(bookName, book_uuid) {
    try{
        var book = new Book({
            bo_name: bookName,
            bo_uid: book_uuid
        });
        await book.save();
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getBooks() {
    try {
        var books = await Book.find();
        return books;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function deleteBook(book_uuid) {
    try {
        await Book.deleteOne({ bo_uid: book_uuid });
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getBooksByUUID(bookId) {
    try {
        var book = await Book.findOne({ bo_uid: bookId });
        return book;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function deleteBookWithSongs(book_uuid) {
    try {
        //const songUids = await Song.find({ book_uuid: book_uuid }).distinct('song_uid');
        //await SongPart.deleteMany({ song_uid: { $in: songUids } });
        await Song.deleteMany({ book_uuid: book_uuid });
        await Book.deleteOne({ bo_uid: book_uuid });
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getBookNameById(bookId) {
    try {
        var book = await Book.findOne({ bo_uid: bookId });
        return book ? book.bo_name : 'Unknown Book';
    } catch (err) {
        return 'Unknown Book';
    }
}

module.exports = {
    addBook,
    getBooks,
    deleteBook,
    getBooksByUUID,
    deleteBookWithSongs,
    getBookNameById
};