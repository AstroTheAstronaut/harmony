const {getUserByUsername} = require('./services');

async function renderLoginPage (req, res) {
    try {
        let errorMessage = null;
        
        // Handle different error types from authentication middleware
        if (req.query.error) {
            switch (req.query.error) {
                case 'account_deleted':
                    errorMessage = 'Your account has been deleted. Please contact an administrator.';
                    break;
                case 'account_banned':
                    errorMessage = 'Your account has been banned. Please contact an administrator.';
                    break;
                case 'account_suspended':
                    errorMessage = 'Your account has been suspended. Please contact an administrator.';
                    break;
                case 'account_not_found':
                    errorMessage = 'Your account could not be found. Please try logging in again.';
                    break;
                case 'system_error':
                    errorMessage = 'A system error occurred. Please try again later.';
                    break;
                default:
                    errorMessage = req.query.error; // Fallback to original error message
            }
        }
        
        res.render('login', {
            query: req.query,
            error: errorMessage
        });
    } catch (err) {
        console.error('Error rendering login page:', err);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    renderLoginPage
}