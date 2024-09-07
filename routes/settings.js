const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.render('settings', { activePage: 'settings', userRole: res.locals.userRole});
  });

module.exports = router;
