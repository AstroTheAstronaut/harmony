async function renderAuditLog (req, res) {
    try {
        res.render('audit-log', {
            title: 'Audit Log',
            description: 'View the audit log of actions performed in the system.',
            user: req.user,
            activePage: 'audit log',
            session: req.session
        });
    } catch (err) {
        console.error('Error rendering audit log:', err);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    renderAuditLog
}