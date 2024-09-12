const pool = require('../connectors/db-connector'); // Adjust path as needed
const unidecode = require('unidecode');

function normalizeText(text) {
    return unidecode(text).toLowerCase();
}

async function getUser(role, passwd) {
    let conn;
    try {
        conn = await pool.getConnection();
        // First, check if the user exists and the password matches
        const [user] = await conn.query('SELECT * FROM users WHERE role = ? AND password = ?', [role, passwd]);

        if (user.length > 0) {
            // Update the last_connected timestamp
            await conn.query('UPDATE users SET last_connected = NOW() WHERE id = ?', [user[0].id]);
            return user;
        } else {
            return [];
        }
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function getUserWithoutPassword(role) {
    let conn;
    try {
        conn = await pool.getConnection();
        // First, check if the user exists
        const [user] = await conn.query('SELECT * FROM users WHERE role = ?', [role]);

        if (user.length > 0) {
            // Update the last_connected timestamp
            await conn.query('UPDATE users SET last_connected = NOW() WHERE id = ?', [user[0].id]);
            return user;
        } else {
            return [];
        }
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function getBooks() {
    let conn;
    try {
        conn = await pool.getConnection(); // Get a connection from the pool
        const [rows] = await conn.query('SELECT * FROM books_db'); // Execute the query
        return rows; // Return the rows fetched from the database
    } catch (err) {
        return Promise.reject(err); // Handle and propagate the error
    } finally {
        if (conn) conn.release(); // Always release the connection back to the pool
    }
}

// Example implementation of getBookNameById
async function getBookNameById(bookId) {
    let conn;
    try{
        conn = await pool.getConnection(); // Get a connection from the pool
        const [book] = await conn.query('SELECT bo_name FROM books_db WHERE bo_uid = ?', [bookId]);
        return book[0] ? book[0].bo_name : 'Unknown Book';
    } catch (err) {
        console.error('Error fetching book name:', err);
        return 'Unknown Book';
    } finally {
        if (conn) conn.release();
    }
}

async function deleteBook(book_uuid) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('DELETE FROM books_db WHERE bo_uid = ?', [book_uuid]);
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function addBook(bookName, book_uuid) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('INSERT INTO books_db (bo_name, bo_uid) VALUES (?, ?)', [bookName, book_uuid]);
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function addSong(title, artist, bookId, song_uid, parts, bookSongNumber, manageTransaction = true) {
    let conn;
    
    try {
        conn = await pool.getConnection();
        if (manageTransaction) await conn.beginTransaction();

        let insertSongQuery = 'INSERT INTO songs (title';
        let insertSongValues = [title];

        if (artist) {
            insertSongQuery += ', artist';
            insertSongValues.push(artist);
        }
        if (bookId) {
            insertSongQuery += ', book_uuid';
            insertSongValues.push(bookId);
        }
        if (bookSongNumber) {
            insertSongQuery += ', book_song_number';
            insertSongValues.push(bookSongNumber);
        }
        if (song_uid) {
            insertSongQuery += ', song_uid';
            insertSongValues.push(song_uid);
        }

        insertSongQuery += ') VALUES (' + insertSongValues.map(() => '?').join(', ') + ')';

        const [songResult] = await conn.query(insertSongQuery, insertSongValues); // Adjust to use destructuring
        const songId = songResult.insertId;

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

async function getBooksByUUID(bookId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const row = await conn.query('SELECT * FROM books_db WHERE bo_uid = ?', [bookId]);
        return row[0] || null;
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function getSongs() {
    let conn;
    try {
        conn = await pool.getConnection();
        const [rows] = await conn.query(`
            SELECT s.id, s.title, s.artist, s.book_uuid, s.book_song_number, b.bo_name, s.song_uid
            FROM songs s 
            LEFT JOIN books_db b ON s.book_uuid = b.bo_uid
        `);
        return rows; // This returns an array of song objects
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function getSongsByBookUUID(book_uuid) {
    let conn;
    try {
        conn = await pool.getConnection();
        const [rows] = await conn.query('SELECT title, artist, book_song_number, book_uuid FROM songs WHERE book_uuid = ?', [book_uuid]);
        const result = rows.map(row => ({
            title: row.title || '',
            artist: row.artist || '',
            number: row.book_song_number || '',
            book_uuid: row.book_uuid || ''
        }));
        return result;
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function getSongsWithPagination(offset = 0, limit = 10) {
    let conn;
    try {
        conn = await pool.getConnection();
        const [rows] = await conn.query(`
            SELECT s.id, s.title, s.artist, s.book_uuid, s.book_song_number, b.bo_name, s.song_uid
            FROM songs s 
            LEFT JOIN books_db b ON s.book_uuid = b.bo_uid
            LIMIT ? OFFSET ?`, [limit, offset]);
        return rows;
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function getTotalSongsByBook(bookId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const [result] = await conn.query('SELECT COUNT(*) AS count FROM songs WHERE book_uuid = ?', [bookId]);
        return result[0].count;
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function getSongById(id) {
    let conn;
    try {
      conn = await pool.getConnection();
      const [songRow] = await conn.query(`
          SELECT s.*, b.bo_name AS book_name, s.book_song_number
          FROM songs s
          LEFT JOIN books_db b ON s.book_uuid = b.bo_uid
          WHERE s.song_uid = ?`, [id]);
  
      if (!songRow.length) return null;
  
      const [parts] = await conn.query('SELECT * FROM song_parts WHERE song_uid = ? ORDER BY part_order', [id]);
      songRow[0].parts = parts;
      return songRow[0];
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    } finally {
      if (conn) conn.release();
    }
  }

  async function getSongsByBook(bookId, offset = 0, limit = 10) {
    let conn;
    try {
        conn = await pool.getConnection();
        const [rows] = await conn.query(`
            SELECT s.id, s.title, s.artist, s.book_uuid, s.book_song_number, b.bo_name, s.song_uid
            FROM songs s 
            LEFT JOIN books_db b ON s.book_uuid = b.bo_uid
            WHERE s.book_uuid = ?
            LIMIT ? OFFSET ?`, [bookId, limit, offset]);
        return rows;
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function getTotalSongs() {
    let conn;
    try {
        conn = await pool.getConnection();
        const [result] = await conn.query('SELECT COUNT(*) AS count FROM songs');
        return result[0].count;
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function removeSong(id) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        await conn.query('DELETE FROM song_parts WHERE song_uid = ?', [id]);
        await conn.query('DELETE FROM songs WHERE song_uid = ?', [id]);

        await conn.commit();
        return Promise.resolve();
    } catch (err) {
        if (conn) await conn.rollback();
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function searchLyrics(term) {
    let conn;
    const normalizedQuery = `%${normalizeText(term)}%`;
    try {
        conn = await pool.getConnection();
        const [rows] = await conn.query(`
            SELECT 
                s.id AS song_id, 
                s.title, 
                s.artist, 
                s.book_song_number,
                s.song_uid,
                s.id,
                b.bo_name,
                sp.part_type, 
                sp.lyrics
            FROM song_parts sp
            JOIN songs s ON sp.song_uid = s.song_uid
            LEFT JOIN books_db b ON s.book_uuid = b.bo_uid
            WHERE sp.lyrics LIKE ?`, [`%${normalizedQuery}%`]);
        return rows;
        
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}


async function requestSong(songUid, req_id) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('INSERT INTO `song_requests` (song_uid, request_id) VALUES (?, ?)', [songUid, req_id]);
        console.log('Song requested:', songUid);
        await conn.query('UPDATE songs SET request_count = request_count + 1 WHERE song_uid = ?', [songUid]);
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function getMostRequestedSongs() {
    let conn;
    try {
        conn = await pool.getConnection();
        const [rows] = await conn.query(`
            SELECT s.title, s.artist, s.request_count, b.bo_name, s.book_uuid, s.book_song_number, s.song_uid
            FROM songs s
            LEFT JOIN books_db b ON s.book_uuid = b.bo_uid
            ORDER BY s.request_count DESC
            LIMIT 5
        `);
        return rows;
    } catch (err) {
        console.error("Error fetching most requested songs:", err);
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}

async function deleteBookWithSongs(book_uuid) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction(); // Start transaction

        // Step 1: Delete song parts associated with the songs in the specified book
        await conn.query(`
            DELETE sp
            FROM song_parts sp
            JOIN songs s ON sp.song_uid = s.song_uid
            WHERE s.book_uuid = ?`, [book_uuid]);

        // Step 2: Delete songs associated with the specified book
        await conn.query(`
            DELETE FROM songs
            WHERE book_uuid = ?`, [book_uuid]);

        // Step 3: Delete the book itself
        await conn.query(`
            DELETE FROM books_db
            WHERE bo_uid = ?`, [book_uuid]);

        await conn.commit(); // Commit transaction
        return Promise.resolve();
    } catch (err) {
        if (conn) await conn.rollback(); // Rollback transaction in case of error
        return Promise.reject(err);
    } finally {
        if (conn) conn.release(); // Always release the connection back to the pool
    }
}

async function getRequestedSongs() {
    let conn;
    try {
        conn = await pool.getConnection();
        const [rows] = await conn.query(`
            WITH TopRequests AS (
                SELECT sr.song_uid, 
                       COUNT(sr.song_uid) AS request_count
                FROM \`song_requests\` sr
                GROUP BY sr.song_uid
                ORDER BY request_count DESC
                LIMIT 5
            )
            SELECT tr.song_uid, 
                   tr.request_count, 
                   sr.request_id, 
                   s.title,
                   s.artist,
                   s.book_song_number, 
                   b.bo_name,
                   s.song_uid
            FROM TopRequests tr
            JOIN \`song_requests\` sr ON tr.song_uid = sr.song_uid
            JOIN \`songs\` s ON tr.song_uid = s.song_uid  -- Ensure this column matches the one in songs table
            LEFT JOIN \`books_db\` b ON s.book_uuid = b.bo_uid
            ORDER BY tr.request_count DESC;
        `);                    
        return rows;
    } catch (err) {
        console.error('Error fetching requested songs:', err);
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}


async function removeRequestedSong(request_id) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query('DELETE FROM `song_requests` WHERE request_id = ?', [request_id]);
    } catch (err) {
        return Promise.reject(err);
    } finally {
        if (conn) conn.release();
    }
}


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
