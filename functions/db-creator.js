const pool = require('../connectors/db-connector'); // Adjust path as needed

// Function to set up the database and tables
async function setupDatabase() {
  let conn;
  try {
    conn = await pool.getConnection(); // Get a connection from the pool

    // Create a database if it doesn't exist
    console.log('Creating database...');
    await conn.query('CREATE DATABASE IF NOT EXISTS cchantdb');
    console.log('Database created or already exists.');

    // Use the new database
    await conn.query('USE cchantdb');

    // Create tables
    const createBooksTableQuery = `
      CREATE TABLE IF NOT EXISTS books_db (
        id INT(11) NOT NULL AUTO_INCREMENT,
        bo_uid VARCHAR(255) NOT NULL COLLATE 'utf8mb4_uca1400_ai_ci',
        bo_name VARCHAR(255) NOT NULL COLLATE 'utf8mb4_uca1400_ai_ci',
        PRIMARY KEY (id) USING BTREE,
        UNIQUE INDEX bo_uid (bo_uid) USING BTREE,
        UNIQUE INDEX bo_name (bo_name) USING BTREE
      )
      ENGINE=InnoDB
      AUTO_INCREMENT=2
    `;

    const createSongsTableQuery = `
      CREATE TABLE IF NOT EXISTS songs (
        id INT(11) NOT NULL AUTO_INCREMENT,
        title VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_uca1400_ai_ci',
        artist VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_uca1400_ai_ci',
        book_uuid VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_uca1400_ai_ci',
        book_song_number INT(11) NULL DEFAULT NULL,
        PRIMARY KEY (id) USING BTREE,
        INDEX book_uuid (book_uuid) USING BTREE,
        CONSTRAINT songs_ibfk_1 FOREIGN KEY (book_uuid) REFERENCES books_db (bo_uid) ON UPDATE RESTRICT ON DELETE RESTRICT
      )
      ENGINE=InnoDB
      AUTO_INCREMENT=4
    `;

    const createSongPartsTableQuery = `
      CREATE TABLE IF NOT EXISTS song_parts (
        id INT(11) NOT NULL AUTO_INCREMENT,
        song_id INT(11) NULL DEFAULT NULL,
        part_type VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_uca1400_ai_ci',
        lyrics TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_uca1400_ai_ci',
        part_order INT(11) NULL DEFAULT NULL,
        PRIMARY KEY (id) USING BTREE,
        INDEX song_id (song_id) USING BTREE,
        CONSTRAINT song_parts_ibfk_1 FOREIGN KEY (song_id) REFERENCES songs (id) ON UPDATE RESTRICT ON DELETE RESTRICT
      )
      ENGINE=InnoDB
      AUTO_INCREMENT=13
    `;

    // Create tables
    console.log('Creating books_db table...');
    await conn.query(createBooksTableQuery);
    console.log('books_db table created or already exists.');

    console.log('Creating songs table...');
    await conn.query(createSongsTableQuery);
    console.log('songs table created or already exists.');

    console.log('Creating song_parts table...');
    await conn.query(createSongPartsTableQuery);
    console.log('song_parts table created or already exists.');

  } catch (err) {
    console.error('Error setting up the database:', err);
    throw err; // Propagate the error to handle it in app.js
  } finally {
    if (conn) conn.release(); // Release the connection back to the pool
  }
}

module.exports = setupDatabase;
