const express = require('express');
const router = express.Router();
const { getUser, getUserWithoutPassword } = require('../../functions/db');
const User = require('../../models/User');
const RegisterCode = require('../../models/RegisterCode');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

router.post('/login-user', async (req, res) => {
  const { username, password, rememberMe } = req.body;

  try {
    if (username.toLowerCase() === 'viewer') {
      req.session.user = {
        username: 'Viewer',
        role: 'Viewer',
      };
      req.session.role = 'Viewer';

      return res.redirect('/');
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.render('login', { error: 'Invalid username or password', username, query: req.query || {} });
    }

    if (user.status === 'deleted') {
      return res.render('login', { error: 'This account has been deleted.', username, query: req.query || {} });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.render('login', { error: 'Invalid username or password', username, query: req.query || {} });
    }

    const role = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();

    req.session.user = {
      id: user._id,
      username: user.username,
      user_id: user.user_uid,
      email: user.email,
      role: role,
      user_uid: user.user_uid
    };
    console.log('User logged in:', req.session.user);

    if (rememberMe && req.session.user!="viewer") req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    else req.session.cookie.expires = false; 

    req.session.role = role;

    user.last_connected = new Date();
    await user.save();
    res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).send('Error during logout');
        }
        res.redirect('/login?logout=1');
    });
});

router.post ('/register-user', async(req, res) => {
    const { username, password, confirmPassword, email, registerCode } = req.body;
    const user_id = uuidv4();
    if (!username || !password || !email || !registerCode) {
        return res.status(400).send('Missing required fields!');
    }

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmailValid) {
        return res.status(400).send('Invalid email format!');
    }


    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match!');
    }

    const existingUser = await User.findOne({username});
    if (existingUser) {
        return res.status(400).send('Username already exists!');
    }

    const registerCodeEntry = await RegisterCode.findOne({ code: registerCode });
    if (!registerCodeEntry || registerCodeEntry.isUsed || (registerCodeEntry.expiryDate && registerCodeEntry.expiryDate < new Date())) {
        return res.status(400).send('Invalid or expired registration code!');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        username,
        user_uid : user_id,
        password: hashedPassword,
        email, 
        role: registerCodeEntry.role.toLowerCase() || 'user',
    });
    await newUser.save();
    registerCodeEntry.isUsed = true;
    await registerCodeEntry.save();
    res.redirect('/login?success=1');
});

module.exports = router;
