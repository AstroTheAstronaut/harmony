async function renderSettingsPage (req, res) {
    try {
        res.render('settings', {
            activePage: 'settings',
            userRole: res.locals.userRole,
            session: req.session
        });
    } catch (err) {
        console.error('Error rendering settings page:', err);
        res.status(500).send('Error fetching data');
    }
}

module.exports = {
    renderSettingsPage
};