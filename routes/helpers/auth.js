const express = require('express');
const router = express.Router();
const { getUser, getUserWithoutPassword } = require('../../functions/db');

// Route to handle user login
router.post('/login-user', async (req, res) => {
    const { role, password } = req.body;

    try {
        let user;
        if (role === 'Viewer') {
            user = await getUserWithoutPassword(role);
        } else {
            user = await getUser(role, password);
        }
        
        if (user.length > 0) {
            req.session.user = user[0];
            req.session.role = role;
            res.redirect('/');
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.redirect('/');
    }
});

// Route to handle logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).send('Error during logout');
        }
        res.redirect('/login');
    });
});

module.exports = router;
