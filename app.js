const express = require('express');
const path = require('path');
const app = express();

// Import the setupDatabase function
const setupDatabase = require('./functions/db-creator');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const indexRoute = require('./routes/index');
const uploadRoute = require('./routes/upload');
// const searchRoute = require('./routes/search');
const songRoute = require('./routes/song-view');
const loginRoute = require('./routes/login');
const songsRoute = require('./routes/songs');
const booksRoute = require('./routes/books');
const settingsRoute = require('./routes/settings');
const editSongRoute = require('./routes/edit-song');

// Run the database setup function before starting the server
(async () => {
  try {
    await setupDatabase();
    console.log('Database setup complete. Starting the main app...');

    // Use routes
    app.use('/', indexRoute);
    app.use('/upload', uploadRoute);
    // app.use('/', searchRoute);
    app.use('/', songRoute);
    app.use('/login', loginRoute);
    app.use('/songs', songsRoute);
    app.use('/books', booksRoute);
    app.use('/settings', settingsRoute);
    

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to set up the database:', err);
    process.exit(1); // Exit if there is a setup error
  }
})();
