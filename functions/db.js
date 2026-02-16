const fs = require('fs');
//Goose models
const User = require('../models/User');
const SongPart = require('../models/SongPart');
const Song = require('../models/Song');
const Book = require('../models/Book');
const Request = require('../models/Request');
const Note = require('../models/Note');
const RegisterCode = require('../models/RegisterCode');
const Notification = require('../models/Notification');
const Setting = require('../models/Setting');
const { query } = require('express-validator');

async function createUser(username, email, password, registerCode) {
    try {
        
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getUsers() {
    try {
        var users = await User.find({}, { password: 0, __v: 0 });
        return users;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function updateUserStatus(userId, newStatus, reason = null, durationDays = null) {
    try {
        const user = await User.findOne({ user_uid: userId });
        if (!user) throw new Error(`User not found: ${userId}`);

        // Save old status and punishment info in case needed for previousOffences
        const oldStatus = user.status;
        const oldPunishmentReason = user.punishmentReason;
        const oldPunishmentDuration = user.punishmentDuration;
        const oldPunishmentDate = user.punishmentDate;

        // Clear punishment info by default
        user.punishmentReason = null;
        user.punishmentDuration = null;
        user.punishmentDate = null;
        user.deleteDate = null;

        if (newStatus === 'deleted') {
            user.status = 'deleted';
            user.deleteDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            user.punishmentReason = reason || 'No reason provided';
            user.punishmentDate = new Date();

            // Add to previousOffences
            user.previousOffences.push({
                date: user.punishmentDate,
                reason: user.punishmentReason,
                duration: durationDays || 7, // default 7 days until deletion
                type: 'delete',
            });
        } 
        else if (newStatus === 'suspended' || newStatus === 'banned') {
            user.status = newStatus;
            user.punishmentReason = reason || 'No reason provided';
            user.punishmentDuration = durationDays || null;
            user.punishmentDate = new Date();

            user.previousOffences.push({
                date: user.punishmentDate,
                reason: user.punishmentReason,
                duration: durationDays || null,
                type: newStatus,
            });
        }
        else if (newStatus === 'undelete') {
            user.status = 'active';
            user.deleteDate = null;
        } 
        else if (newStatus === 'unsuspend' || newStatus === 'unban') {
            user.status = 'active';
        } else {
            // For other statuses, just update status
            user.status = newStatus;
        }

        await user.save();
    } catch (err) {
        throw err;
    }
}

async function deleteUsers() {
    try {
        const currentDate = new Date();

        const usersToDelete = await User.find({
            deleteDate: { $lte: currentDate },
            status: 'deleted'
        });

        if (usersToDelete.length === 0) {
            return Promise.resolve('No users to delete');
        }

        const userUids = usersToDelete.map(user => user.user_uid);
        await User.deleteMany({ user_uid: { $in: userUids } });

        return Promise.resolve(`Deleted ${usersToDelete.length} users`);
    } catch (err) {
        return Promise.reject(err);
    }
}

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

async function getAutocompleteResults(term) {
    try {
        var results = await SongPart.aggregate([
            {
                $search: {
                    index: 'songcontent',
                    autocomplete: {
                        query: term,
                        path: 'lyrics'
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

        console.log('Autocomplete results:', results);

    } catch (err) {
        return Promise.reject(err);
    }
}
// async function searchLyrics(term) {
//     try {
//         const results = await Song.aggregate([
//             {
//                 $search: {
//                     index: "songsearch",
//                     text: {
//                         query: term,
//                         path: "parts.lyrics"
//                     }
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "books",
//                     localField: "book_uuid",   // in Song document
//                     foreignField: "bo_uid",     // in Book document
//                     as: "book"
//                 }
//             },
//             {
//                 $unwind: {
//                     path: "$book",
//                     preserveNullAndEmptyArrays: true
//                 }
//             },
//             {
//                 $project: {
//                     title: 1,
//                     artist: 1,
//                     parts: 1,
//                     song_uid: 1,
//                     book_song_number: 1,
//                     book_name: "$book.bo_name",   // ← get the book name
//                     book_uid: "$book.bo_uid",     // optional: if you want the uid too
//                     score: { $meta: "searchScore" }
//                 }
//             },
//             {
//                 $sort: { score: -1 }
//             },
//             {
//                 $limit: 10
//             }
//         ]);

//         return results;
//     } catch (error) {
//         console.error("Error searching lyrics:", error);
//         throw error;
//     }
// }
async function searchLyrics(term) {
    try {
        const searchWords = term.trim().split(/\s+/).filter(word => word.length > 0);

        const mustClauses = searchWords.map(word => ({
            text: {
                query: word,
                path: ["title", "artist", "tags", "parts.lyrics"],
                fuzzy: { maxEdits: 1 } 
            }
        }));

        let results = await Song.aggregate([
            {
                $search: {
                    index: "songsearcher",
                    compound: {
                        must: mustClauses,
                        should: [
                            {
                                phrase: {
                                    query: term,
                                    path: "title",
                                    score: { boost: { value: 50 } } 
                                }
                            },
                            {
                                phrase: {
                                    query: term,
                                    path: "parts.lyrics",
                                    score: { boost: { value: 10 } } 
                                }
                            }
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "books",
                    localField: "book_uuid",
                    foreignField: "bo_uid",
                    as: "book"
                }
            },
            {
                $unwind: { path: "$book", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    title: 1,
                    artist: 1,
                    song_uid: 1,
                    book_song_number: 1,
                    book_name: "$book.bo_name",
                    book_uid: "$book.bo_uid",
                    parts: 1,
                    score: { $meta: "searchScore" }
                }
            },
            {
                $sort: { score: -1 }
            },
            {
                $limit: 20
            }
        ]);

        // =========================================================
        // SMART FILTERING
        // =========================================================
        if (results.length > 0) {
            const topScore = results[0].score;
            
            // Heuristic: If a result is less than 10% of the top match, 
            // it is likely noise (common words found in random lyrics).
            // For your data: 292 * 0.1 = 29.2. 
            // This perfectly keeps the top result and deletes the 8.6 scores.
            const threshold = topScore * 0.1; 

            results = results.filter(r => r.score > threshold);
        }

        return results;

    } catch (error) {
        console.error("Error searching lyrics:", error);
        throw error;
    }
}

async function requestSong(songUid, req_id, req_user) {
    try {
        var request = new Request({
            song_uid: songUid,
            request_id: req_id,
            requested_by: req_user
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

// NOTE - Test and verify this function
async function addNote(note, user_id) {
    try {
        var note = new Note({
            note: note,
            user_id: user_id
        });
        await note.save();
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getRegistrationCodes () {
    try {
        var codes = await RegisterCode.find();
        return codes;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function createRegistrationCode (code, expiryDate, email, role){ 
    try {
        if (!email) email = "No email";
        if (!code) return Promise.reject(new Error("Code cannot be empty"));
        if (!expiryDate) expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days from now

        var registrationCode = new RegisterCode ({ 
            code: code,
            email: email,
            role: role,
            isUsed: false,
            isExpired: false,
            expiryDate: expiryDate,
            createdAt: new Date()
        });
        await registrationCode.save();
        return Promise.resolve();
    } catch (Err) {
        return Promise.reject(err);
    }
}

async function markCodeAsExpired(code) {
  try {
    const registrationCode = await RegisterCode.findOne({ code: code });
    if (!registrationCode) return; // prevent crash
    if (registrationCode.expiryDate < new Date()) {
      registrationCode.isExpired = true;
      await registrationCode.save();
    }
  } catch (err) {
    console.error(`Error marking code ${code} as expired:`, err);
  }
}

async function createNotification(notification_id, userId, type, message, seen, song_id, link) {
    try {
        if (!userId || !type || !notification_id) {
            return Promise.reject(new Error("User ID and/or notification ID is required for creating a notification"));
        }
        const notification = new Notification({
            notification_id: notification_id,
            user_id: userId,
            type: type,
            message: message || null,
            seen: seen || false,
            song_id: song_id || null,
            link: link || null
        });
        await notification.save();
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getNotifications() {
    try {
        const notifications = await Notification.find({ seen: false }).sort({ created_at: -1 });
        // Return empty array if none found — consistent return type
        return notifications;
    } catch (err) {
        throw err;
    }
}

async function getActiveUserInfo(userId) {
    try {
        const user = await User.findOne({ user_uid: userId, status: 'active' }, { password: 0, __v: 0 });
        return user;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function autocompleteLyrics(term) {
    try {
        if (!term || term.trim() === '') {
            return []; 
        }
        const results = await Song.aggregate([
            {
                $search: {
                    index: "autocompleter", 
                    compound: {
                        should: [
                            {
                                autocomplete: {
                                    query: term,
                                    path: "title"
                                }
                            },
                            {
                                autocomplete: {
                                    query: term,
                                    path: "alt_title"
                                }
                            },
                            {
                                autocomplete: {
                                    query: term,
                                    path: "parts.lyrics"
                                }
                            }
                        ],
                        // Ensure at least one of the 'should' clauses matches
                        minimumShouldMatch: 1 
                    }
                }
            },
            {
                $limit: 5 
            },
            {
                $project: {
                    title: 1,
                    alt_title: 1,
                    song_uid: 1 
                }
            }
        ]);
        return results;
    } catch (err) {
        console.error("Error in autocompleteLyrics:", err);
        return Promise.reject(err);
    }
}

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
    getSongsWithLimit,
    getBookNameById,
    editSong,
    getUser,
    getUserWithoutPassword,
    getSongsByBookUUID,
    addNote,
    getRegistrationCodes,
    createRegistrationCode,
    markCodeAsExpired,
    getUsers,
    updateUserStatus,
    deleteUsers,
    createNotification,
    getNotifications,
    autocompleteLyrics,
};
