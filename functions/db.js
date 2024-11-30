const pool = require('../connectors/db-connector');
//Goose models
const User = require('../models/User');
const SongPart = require('../models/SongPart');
const Song = require('../models/Song');
const Book = require('../models/Book');
const Request = require('../models/Request');

async function getUser(role, password) {
    try {
        var user = await User.findOne({ role: (role+'').toLowerCase(), password: password });
    
        if(!user) return [];
        return [{
            id: user.id,
            role: user.role,
            last_connected: user.last_connected
        }];
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getUserWithoutPassword(role) {
    try {
        var user = await User.findOne({ role: (role+'').toLowerCase() });
    
        if(!user) return [];
        return [{
            id: user.id,
            role: user.role,
            last_connected: user.last_connected
        }];
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

async function getBookNameById(bookId) {
    try {
        var book = await Book.findOne({ bo_uid: bookId });
        return book ? book.bo_name : 'Unknown Book';
    } catch (err) {
        return 'Unknown Book';
    }
}

async function deleteBook(book_uuid) {
    try {
        await Book.deleteOne({ bo_uid: book_uuid });
    } catch (err) {
        return Promise.reject(err);
    }
}
async function deleteBookWithSongs(book_uuid) {
    try {
        const songUids = await Song.find({ book_uuid: book_uuid }).distinct('song_uid');
        await SongPart.deleteMany({ song_uid: { $in: songUids } });
        await Song.deleteMany({ book_uuid: book_uuid });
        await Book.deleteOne({ bo_uid: book_uuid });
    } catch (err) {
        return Promise.reject(err);
    }
}

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

async function addSong(title, artist, bookId, song_uid, chord, parts, bookSongNumber){
    try {
        var song = new Song({
            title: title,
            artist: artist,
            book_uuid: bookId,
            song_uid: song_uid,
            chord: chord,
            book_song_number: bookSongNumber
        });
        await song.save();

        const songPartPromises = parts.map((part, index) => {
            const songPart = new SongPart({
                song_uid: song_uid,
                part_type: part.type,
                lyrics: part.lyrics,
                part_order: index + 1
            });
            return songPart.save();
        });
        await Promise.all(songPartPromises);
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
        var songs = await Song.find().skip(offset).limit(limit);
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
                from: 'books', // The name of the collection that contains books
                localField: 'book_uuid', // The field in the songs collection
                foreignField: 'bo_uid',// The field in the books collection
                as: 'book_details' // The name of the field where the book details will be added
            },
        },
        { $unwind: { path: '$book_details' } }, // Unwind the array of book details
    ]);

    if (song.length > 0) {
        const songData = song[0];
        const songParts = await SongPart.find({ song_uid: id }) || [];

        songData.parts = songParts;

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

async function removeSong(id) {
    try {
        await SongPart.deleteMany({ song_uid: id });
        await Song.deleteOne({ song_uid: id });
    } catch (err) {
        return Promise.reject(err);
    }
}

async function searchLyrics(term) {
    try {
        var lyricsResults = await SongPart.aggregate([
            {
                $search: {
                    index: 'songcontent',
                    // phrase: {
                    //     query: term,
                    //     path: 'lyrics',
                    //     slop: 1
                    // },
                    text: {
                        query: term,
                        path: 'lyrics',
                        fuzzy: {
                            maxEdits: 2.0
                        },
                        score: { boost: { value: 2 } },
                        matchCriteria: "all"
                    }
                }
            },
            {
                $lookup: {
                    from: 'songs', // The collection containing additional song info
                    localField: 'song_uid', // The field in SongPart
                    foreignField: 'song_uid', // The field in songs
                    as: 'song_info' // The array where matched documents will be stored
                }
            },
            {
                $unwind: '$song_info' // Flatten the song_info array for easier access
            },
            {
                $lookup: {
                    from: 'books', // The collection containing book info
                    localField: 'song_info.book_uuid', // The field in songs
                    foreignField: 'bo_uid', // The field in books
                    as: 'book_info' // The array where matched documents will be stored
                }
            },
            {
                $unwind: '$book_info' // Flatten the book_info array for easier access
            },
            {
                $project: {
                    _id: 0, // Exclude the MongoDB ID
                    song_uid: 1,
                    title: '$song_info.title',
                    book_song_number: '$song_info.book_song_number',
                    book_uid: '$song_info.book_uuid',
                    book_name: '$book_info.bo_name',
                    chord: '$song_info.chord',
                    part_type: 1,
                    lyrics: 1
                }
            }
        ]);

        return lyricsResults;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function requestSong(songUid, req_id) {
    try {
        var request = new Request({
            song_uid: songUid,
            request_id: req_id
        });
        await request.save();
        await Song.updateOne({ song_uid: songUid }, { $inc: { request_count: 1 } });   
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getMostRequestedSongs() {
    try {
        const result = await Song.aggregate([  // Query directly from the 'songs' collection
            // Step 1: Filter songs where request_count > 0
            {
                $match: {
                    request_count: { $gt: 0 }
                }
            },
            // Step 2: Lookup the corresponding request details for the song
            {
                $lookup: {
                    from: 'requests', // The requests collection
                    localField: 'song_uid', // Match on song_uid in songs collection
                    foreignField: 'song_uid', // Match to song_uid in the request collection
                    as: 'request_info' // Alias for the resulting request documents
                }
            },
            // Step 3: Lookup the corresponding book details for the song
            {
                $lookup: {
                    from: 'books', // The books collection
                    localField: 'book_uuid', // Match on book_uuid in the song
                    foreignField: 'bo_uid', // Match to bo_uid in the books collection
                    as: 'book_info' // Alias for the resulting book document
                }
            },
            // Step 4: Unwind the book_info to get the book details
            {
                $unwind: {
                    path: '$book_info',
                    preserveNullAndEmptyArrays: true // Allow songs without a matching book
                }
            },
            // Step 5: Project the relevant data
            {
                $project: {
                    song_uid: 1,
                    request_count: 1, // Include request_count from the song
                    title: 1,
                    artist: 1,
                    book_song_number: 1,
                    bo_name: '$book_info.bo_name', // Access bo_name from the book_info
                    request_info: 1 // Include request info for additional details
                }
            },
            // Step 6: Sort by request_count in descending order
            {
                $sort: { request_count: -1 }
            },
            // Step 7: Limit to top 5 most requested songs
            {
                $limit: 5
            }
        ]);

        console.log(result); // Log the final result for debugging
        return result;
    } catch (err) {
        console.error('Error fetching most requested songs:', err);
        return Promise.reject(err);
    }
}



async function getRequestedSongs() {
    try {
        const topRequests = await Request.aggregate([
            {
                $group: {
                    _id: "$song_uid",
                    request_count: { $sum: 1 },
                    request_id: { $first: "$request_id" }
                }
            },
            {
                $sort: { request_count: -1 }
            },
            {
                $limit: 5
            }
        ]);

        const requestedSongs = await Promise.all(topRequests.map(async (request) => {
            const song = await Song.findOne({ song_uid: request._id });

            if (!song) {
                return null;
            }

            const book = await Book.findOne({ bo_uid: song.book_uuid });

            if (!book) {
                return null;
            }

            return {
                song_uid: request._id,
                request_count: request.request_count,
                request_id: request.request_id,
                title: song.title,
                artist: song.artist,
                book_song_number: song.book_song_number,
                bo_name: book.bo_name
            };
        }));

        return requestedSongs.filter(song => song !== null);
    } catch (err) {
        console.error('Error fetching requested songs:', err);
        return Promise.reject(err);
    }
}

async function removeRequestedSong(request_id) {
    try {
        await Request.deleteOne({ request_id: request_id });
    } catch (err) {
        return Promise.reject(err);
    }
}

async function removeAllRequestedSongs() {
    try {
        await Request.deleteMany({});
    } catch (err) {
        return Promise.reject(err);
    }
}

// async function removeRequestedSong(request_id) {
//     let conn;
//     try {
//         conn = await pool.getConnection();
//         await conn.query('DELETE FROM `song_requests` WHERE request_id = ?', [request_id]);
//     } catch (err) {
//         return Promise.reject(err);
//     } finally {
//         if (conn) conn.release();
//     }
// }


async function editSong(song_uid, song_title, song_artist, book_uuid, book_song_number, parts, manageTransaction = true) {
    let conn;
    try {
        conn = await pool.getConnection();
        if (manageTransaction) await conn.beginTransaction();

        // Update the song details
        const updateSongQuery = `
            UPDATE songs
            SET title = ?, artist = ?, book_uuid = ?, book_song_number = ?
            WHERE song_uid = ?
        `;
        await conn.query(updateSongQuery, [song_title, song_artist, book_uuid, book_song_number, song_uid]);

        // Update song parts
        const deletePartsQuery = 'DELETE FROM song_parts WHERE song_uid = ?';
        await conn.query(deletePartsQuery, [song_uid]);

        const insertPartQuery = 'INSERT INTO song_parts (song_uid, part_type, lyrics, part_order) VALUES (?, ?, ?, ?)';
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const partOrder = i + 1; // Set the part order based on the index
            await conn.query(insertPartQuery, [song_uid, part.type, part.lyrics, partOrder]);
        }

        if (manageTransaction) await conn.commit();
        return Promise.resolve();
    } catch (err) {
        if (conn && manageTransaction) await conn.rollback();
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}


//NOTE - To be added later
// async function getNotifications () {
//     let conn;
//     try {
//         conn = await pool.getConnection();
//         const [rows] = await conn.query('SELECT * FROM notifications');
//         return rows;
//     } catch (err) {
//         return Promise.reject(err);
//     } finally {
//         if (conn) conn.release();
//     }
// }

module.exports = {
    getBooks,
    deleteBook,
    addBook,
    addSong,
    getBooksByUUID,
    getSongs,
    getSongById,
    removeSong,
    searchLyrics,
    requestSong,
    getMostRequestedSongs,
    deleteBookWithSongs,
    getRequestedSongs,
    removeRequestedSong,
    removeAllRequestedSongs,
    getSongsWithPagination,
    getTotalSongs,
    getSongsByBook,
    getTotalSongsByBook,
    getBookNameById,
    editSong,
    getUser,
    getUserWithoutPassword,
    getSongsByBookUUID
};
