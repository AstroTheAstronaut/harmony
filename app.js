const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');
const i18next = require('./i18n'); // Import i18next configuration
const i18nextMiddleware = require('i18next-http-middleware');
const cookieParser = require('cookie-parser'); // For handling cookies
const session = require('express-session');
const { checkAuth, attachUserRole } = require('./middleware/authers'); // Import the auth check middleware
const checkRole = require('./middleware/roleCheck');

const mongoose = require('mongoose');
const startdb = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING, {
      retryWrites: true,
      dbName: process.env.MONGODB_DBNAME,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}
startdb();

// Import the setupDatabase function
const setupDatabase = require('./functions/db-creator');

const app = express();

// Session setup
app.use(session({
  secret: 'secret_key', // Replace with a strong, unique secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

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

// Attach user role to res.locals
app.use(attachUserRole);

// Route to change language
app.get('/change-language/:lng', (req, res) => {
  const { lng } = req.params;
  if (i18next.hasResourceBundle(lng, 'translation')) {
    res.cookie('i18next', lng); // Save the selected language in a cookie
    i18next.changeLanguage(lng);
  }
  res.redirect(req.get("Referrer")); // Redirect back to the previous page
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
const indexRoute = require('./routes/index');
const uploadRoute = require('./routes/upload');
const songRoute = require('./routes/song-view');
const loginRoute = require('./routes/login');
const songsRoute = require('./routes/songs');
const booksRoute = require('./routes/books');
const settingsRoute = require('./routes/settings');
const editSongRoute = require('./routes/edit-song');
const authRoute = require('./routes/helpers/auth');
const actionsRoute = require('./routes/helpers/actions');
const setupRoute = require('./routes/setup');

// Run the database setup function before starting the server
(async () => {
  try {
    await setupDatabase();
    console.log('Database setup complete. Starting the main app...');

    // Setup route 
    app.use('/setup', setupRoute);

    // Public routes (No authentication required)
    app.use('/auth', authRoute); // Public routes for authentication
    app.use('/login', loginRoute);
    app.use('/change-language', (req, res, next) => {
      // Allow access to language change route without authentication
      next();
    });
    app.use('/', actionsRoute); // Assuming actionsRoute might be public

    // Protected routes (Authentication required)
    app.use('/dash', checkAuth, indexRoute);
    app.use('/songs', checkAuth, songsRoute);
    app.use('/books', checkAuth, booksRoute);
    app.use('/song-view', checkAuth, songRoute);

    // Apply role-based middleware
    app.use('/upload', checkAuth, checkRole(['Admin', 'Editor']), uploadRoute);
    app.use('/edit-song', checkAuth, checkRole(['Admin', 'Editor']), editSongRoute);
    app.use('/settings', checkAuth, checkRole(['Admin']), settingsRoute);

    // Redirect root to login if not authenticated
    app.get('/', checkAuth, (req, res) => {
      res.redirect('/dash'); // Redirect to the index route if authenticated
    });

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
