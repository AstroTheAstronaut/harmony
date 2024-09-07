const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');
const i18next = require('./i18n'); // Import i18next configuration
const i18nextMiddleware = require('i18next-http-middleware');
const cookieParser = require('cookie-parser'); // For handling cookies
const app = express();

// Import the setupDatabase function
const setupDatabase = require('./functions/db-creator');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cookieParser()); // Initialize cookie parser

// Serve static files from the .well-known directory
app.use('/.well-known', express.static(path.join(__dirname, '.well-known')));

// Initialize i18next middleware
app.use(i18nextMiddleware.handle(i18next));

// Route to change language
app.get('/change-language/:lng', (req, res) => {
  const { lng } = req.params;
  if (i18next.hasResourceBundle(lng, 'translation')) {
    res.cookie('i18next', lng); // Save the selected language in a cookie
    i18next.changeLanguage(lng);
  }
  res.redirect('back'); // Redirect back to the previous page
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const indexRoute = require('./routes/index');
const uploadRoute = require('./routes/upload');
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
    app.use('/', songRoute);
    app.use('/login', loginRoute);
    app.use('/songs', songsRoute);
    app.use('/books', booksRoute);
    app.use('/settings', settingsRoute);
    // 404 route - Place it AFTER all other routes
    app.use((req, res, next) => {
      res.status(404).render('404', { activePage: 'home' });
    });

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

