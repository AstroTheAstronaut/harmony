const express = require('express');
const router = express.Router();
const {getUser} = require('../functions/db');
// GET request for login page
router.get('/', (req, res) => {
  res.render('login');
});




module.exports = router;
