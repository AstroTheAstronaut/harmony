async function renderRegisterPage (req, res) {
    try {
        res.render('register');
    } catch (err) {
        console.error('Error rendering register page:', err);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    renderRegisterPage
}