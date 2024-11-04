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
        bo_uid VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
        bo_name VARCHAR(255) NOT NULL COLLATE 'utf8mb4_unicode_ci',
        PRIMARY KEY (id) USING BTREE,
        UNIQUE INDEX bo_uid (bo_uid) USING BTREE,
        UNIQUE INDEX bo_name (bo_name) USING BTREE
      )
      ENGINE=InnoDB
      AUTO_INCREMENT=1
    `;

    const createSongsTableQuery = `
      CREATE TABLE IF NOT EXISTS songs (
        id INT(11) NOT NULL AUTO_INCREMENT,
        title VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
        artist VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
        book_uuid VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
        book_song_number INT(11) NULL DEFAULT NULL,
        request_count INT(11) NOT NULL DEFAULT '0',
        alt_title VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
        song_uid VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
        PRIMARY KEY (id) USING BTREE,
        UNIQUE INDEX unique_song_uid (song_uid) USING BTREE,
        INDEX book_uuid (book_uuid) USING BTREE,
        CONSTRAINT songs_ibfk_1 FOREIGN KEY (book_uuid) REFERENCES books_db (bo_uid) ON UPDATE RESTRICT ON DELETE RESTRICT
      )
      ENGINE=InnoDB
      AUTO_INCREMENT=1
    `;

    const createSongPartsTableQuery = `
      CREATE TABLE IF NOT EXISTS song_parts (
        id INT(11) NOT NULL AUTO_INCREMENT,
        song_uid VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
        part_type VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
        lyrics TEXT NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
        part_order INT(11) NULL DEFAULT NULL,
        PRIMARY KEY (id) USING BTREE,
        INDEX song_uid (song_uid) USING BTREE,
        FULLTEXT INDEX lyrics (lyrics),
        CONSTRAINT song_parts_ibfk_1 FOREIGN KEY (song_uid) REFERENCES songs (song_uid) ON UPDATE RESTRICT ON DELETE RESTRICT
      )
      ENGINE=InnoDB
      AUTO_INCREMENT=1
    `;

    const createSongRequestsTableQuery = `
      CREATE TABLE IF NOT EXISTS song_requests (
        id INT(11) NOT NULL AUTO_INCREMENT,
        song_uid VARCHAR(255) NOT NULL DEFAULT '0' COLLATE 'utf8mb4_unicode_ci',
        requester VARCHAR(255) NULL DEFAULT '0' COLLATE 'utf8mb4_unicode_ci',
        request_id VARCHAR(255) NOT NULL DEFAULT '0' COLLATE 'utf8mb4_unicode_ci',
        created_at TIMESTAMP NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id) USING BTREE
      )
      ENGINE=InnoDB
      AUTO_INCREMENT=1
    `;

    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT(11) NOT NULL AUTO_INCREMENT,
        password VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
        role ENUM('Viewer','Moderator','Editor','Admin') NOT NULL DEFAULT 'Viewer' COLLATE 'utf8mb4_unicode_ci',
        last_connected TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (id) USING BTREE
      )
      ENGINE=InnoDB
      AUTO_INCREMENT=1
    `;

    const createDeleteOldSongRequestsEventQuery = `
      CREATE EVENT IF NOT EXISTS \`delete_old_song_requests\`
        ON SCHEDULE
          EVERY 30 MINUTE STARTS '2024-08-29 10:09:55'
        ON COMPLETION PRESERVE
        ENABLE
        COMMENT ''
        DO DELETE FROM \`song_requests\` WHERE \`created_at\` < NOW() - INTERVAL 1 MINUTE
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

    console.log('Creating song_requests table...');
    await conn.query(createSongRequestsTableQuery);
    console.log('song_requests table created or already exists.');

    console.log('Creating users table...');
    await conn.query(createUsersTableQuery);
    console.log('users table created or already exists.');

    console.log('Creating delete_old_song_requests event...');
    await conn.query(createDeleteOldSongRequestsEventQuery);
    console.log('delete_old_song_requests event created or already exists.');

  } catch (err) {
    console.error('Error setting up the database:', err);
    throw err; // Propagate the error to handle it in app.js
  } finally {
    if (conn) conn.release(); // Release the connection back to the pool
  }
}

module.exports = setupDatabase;
