const express = require('express');
const router = express.Router();
const {getSongById} = require('../functions/db');

router.get('/song-view/:id', async (req, res) => {
    try {
      const song = await getSongById(req.params.id);
      if (song) {
        res.render('song-view', { song: song, activePage: 'songs' }); // Ensure song data is being passed
      } else {
        res.status(404).send('Song not found');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });

module.exports = router;
