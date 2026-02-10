const Song = require('../../models/Song');

async function addSong(title, alt_title, artist, bookId, song_uid, chord, parts, bookSongNumber, scripture, tags) {
    try {
        // Defensive: ensure parts is an array
        if (!parts || !Array.isArray(parts)) {
            return Promise.reject(new Error('Invalid parts: expected an array'));
        }

        const embeddedParts = parts.map((part, index) => ({
            part_type: (part.type || part.part_type || 'UNKNOWN').toString().toUpperCase(),
            part_order: index + 1,
            lyrics: part.lyrics || part.text || ''
        }));

        var song = new Song({
            title: title,
            alt_title: alt_title,
            artist: artist,
            book_uuid: bookId,
            song_uid: song_uid,
            chord: chord,
            book_song_number: bookSongNumber,
            scripture: scripture,
            parts: embeddedParts,
            tags: Array.isArray(tags) ? tags : (tags ? [tags] : [])
        });
        await song.save();
        return Promise.resolve();
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

async function getSongsWithPagination(offset = 0, limit = 10, orderBy = 'titleAsc', bookId = null) {
    try {
        // Map sort options to MongoDB sort objects
        const sortOptions = {
            titleAsc: { title: 1 },
            titleDesc: { title: -1 },
            noAsc: { number: 1 },
            noDesc: { number: -1 },
            artistAsc: { artist: 1 },
            artistDesc: { artist: -1 },
            bookAsc: { "book_details.name": 1 }, // Sorting by joined book name
            bookDesc: { "book_details.name": -1 }
        };

        const sortStage = sortOptions[orderBy] || sortOptions.titleAsc;

        const pipeline = [];

        // If a specific book filter was provided, match first
        if (bookId) {
            pipeline.push({ $match: { book_uuid: bookId } });
        }

        pipeline.push({
            $lookup: {
                from: 'books',
                localField: 'book_uuid',
                foreignField: 'bo_uid',
                as: 'book_details'
            }
        });

        pipeline.push({ $unwind: { path: '$book_details', preserveNullAndEmptyArrays: true } });
        pipeline.push({ $sort: sortStage }); // Sort here
        pipeline.push({ $skip: offset });
        pipeline.push({ $limit: limit });

        const songs = await Song.aggregate(pipeline);

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

async function getSongsOrdered(orderedBy, limit, offset) {
    try {
        const sortOptions = {
            titleAsc: { title: 1 },
            titleDesc: { title: -1 },
            noAsc: { number: 1 },
            noDesc: { number: -1 },
            artistAsc: { artist: 1 },
            artistDesc: { artist: -1 },
            bookAsc: { "book_details.name": 1 },
            bookDesc: { "book_details.name": -1 }
        }
        var songs = await Song.find().sort(orderedBy).skip(offset).limit(limit);
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

async function editSong (song_uid, book_song_number, title, chord, artist, scripture, book, tags, parts, alt_title){
    try {
        const update = {
            book_song_number: book_song_number,
            title: title,
            chord: chord,
            artist: artist,
            scripture: scripture,
            book_uuid: book,
            tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
            parts: parts
        };

        if (typeof alt_title !== 'undefined') {
            update.alt_title = alt_title;
        }

        await Song.updateOne({ song_uid: song_uid }, { $set: update });
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

// Function to get songs ordered by a specific field
// order_type can be 'asc' or 'desc', arg is the field to order by
// limit is the number of songs to get (like in getSongsWithLimit)
// Needs to support pagination too
// async function getSongsOrdered(orderBy = 'titleAsc', limit = 10, offset = 0) {
//     try {
//         const sortMap = {
//             titleAsc:  { field: 'title', order: 1, fromBook: false },
//             titleDesc: { field: 'title', order: -1, fromBook: false },
//             noAsc:     { field: 'book_song_number', order: 1, fromBook: false },
//             noDesc:    { field: 'book_song_number', order: -1, fromBook: false },
//             artistAsc: { field: 'artist', order: 1, fromBook: false },
//             artistDesc:{ field: 'artist', order: -1, fromBook: false },
//             bookAsc:   { field: 'title', order: 1, fromBook: true },
//             bookDesc:  { field: 'title', order: -1, fromBook: true }
//         };

//         const sortConfig = sortMap[orderBy];
//         if (!sortConfig) throw new Error('Invalid orderBy value');

//         // Build the sort object
//         const sortField = sortConfig.fromBook 
//             ? `book_details.${sortConfig.field}` 
//             : sortConfig.field;

//         return await Song.aggregate([
//             {
//                 $lookup: {
//                     from: 'books',
//                     localField: 'book_uuid',
//                     foreignField: 'bo_uid',
//                     as: 'book_details'
//                 }
//             },
//             { $unwind: { path: '$book_details', preserveNullAndEmptyArrays: true } },
//             { $sort: { [sortField]: sortConfig.order } },
//             { $skip: offset },
//             { $limit: limit }
//         ]);
//     } catch (err) {
//         return Promise.reject(err);
//     }
// }


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
    getSongsOrdered,
    editSong
}