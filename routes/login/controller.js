const {getUserByUsername} = require('./services');

async function renderLoginPage (req, res) {
    try {
        res.render('login', {query: req.query});
    } catch (err) {
        console.error('Error rendering login page:', err);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    renderLoginPage
}