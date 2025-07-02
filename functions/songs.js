const Song = require('../models/Song');

async function addSong(title, artist, bookId, song_uid, chord, parts, bookSongNumber, chord, scripture, tags) {
    try {
        const embeddedParts = parts.map((part, index) => ({
            part_type: part.type.toUpperCase(),
            part_order: index+1,
            lyrics: part.lyrics
        }));
        var song = new Song({
            title: title,
            artist: artist,
            book_uuid: bookId,
            song_uid: song_uid,
            chord: chord,
            book_song_number: bookSongNumber,
            chord: chord,
            scripture: scripture,
            parts: embeddedParts,
            tags: tags
        });
        await song.save();
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getSongs() {
    try {
        var songs = await Song.find();
        return songs;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getSongsByBookUUID(book_uuid) {
    try {
        var songs = await Song.find({ book_uuid: book_uuid });
        return songs;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getSongsWithPagination(offset = 0, limit = 10) {
    try {
        var songs = await Song.aggregate([
            {
                $lookup: {
                    from: 'books', // The name of the collection that contains books
                    localField: 'book_uuid', // The field in the songs collection
                    foreignField: 'bo_uid', // The field in the books collection
                    as: 'book_details' // The name of the field where the book details will be added
                }
            },
            { $unwind: { path: '$book_details', preserveNullAndEmptyArrays: true } }, // Unwind but preserve songs without books
            { $skip: offset },
            { $limit: limit }
        ]);
        return songs;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getTotalSongsByBook(bookId) {
    try {
        var songs = await Song.find({ book_uuid: bookId });
        return songs.length;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getSongById(id) {
    const song = await Song.aggregate([
        { $match: { song_uid: id } },
        {
            $lookup: {
                from: 'books',
                localField: 'book_uuid',
                foreignField: 'bo_uid',
                as: 'book_details'
            },
        },
        { 
            $unwind: {
                path: '$book_details',
                preserveNullAndEmptyArrays: true
            }
        },
    ]);

    if (song.length > 0) {
        const songData = song[0];
        return songData;
    }

    return null;
}

async function getSongsByBook(bookId, offset = 0, limit = 10) {
    try {
        var songs = await Song.find({ book_uuid: bookId }).skip(offset).limit(limit);
        return songs;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getTotalSongs() {
    try {
        var songs = await Song.find();
        return songs.length;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getSongsWithLimit (limit) {
    try {
        var songs = await Song.find().limit(limit);
        return songs;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function removeSong(id) {
    try {
        await Song.deleteOne({ song_uid: id });
    } catch (err) {
        return Promise.reject(err);
    }
}

async function editSong (song_uid, book_song_number, title, chrod, artist, scripture, book, tags, parts){
    try {
        var song = {
            song_uid: song_uid.song_uid,
            book_song_number: book_song_number,
            title: title,
            chord: chrod,
            artist: artist,
            scripture: scripture,
            book_uuid: book,
            tags: tags,
            parts: parts
        }
        await Song.updateOne({ song_uid: song_uid }, song);
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

module.exports = {
    addSong,
    getSongs,
    getSongsByBookUUID,
    getSongsWithPagination,
    getTotalSongsByBook,
    getSongById,
    getSongsByBook,
    getTotalSongs,
    getSongsWithLimit,
    removeSong,
    editSong
}