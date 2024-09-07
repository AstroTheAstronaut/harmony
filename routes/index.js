const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const AdmZip = require('adm-zip');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const {
    getBooks,
    getSongs,
    getMostRequestedSongs,
    getRequestedSongs,
} = require('../functions/db'); // Adjust the path to your db file

// Route for the homepage
router.get('/', async (req, res) => {
    try {
        const books = await getBooks();
        const songs = await getSongs();
        const mostRequestedSongs = await getMostRequestedSongs();
        const requestedSongs = await getRequestedSongs();
        // Use res.locals.userRole instead of userRole
        console.log('User role:', res.locals.userRole);
        res.render('index', { books, songs, mostRequestedSongs, requestedSongs, userRole: res.locals.userRole, activePage: 'home' });
    } catch (err) {
        console.error('Error fetching books or songs:', err);
        res.status(500).send('Error fetching data');
    }
});

module.exports = router;
