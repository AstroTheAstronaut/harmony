const User = require('../models/User');

async function checkAuth(req, res, next) {
    if (req.session && req.session.user) {
        try {
            // Extract user_id from session user object
            const userUid = req.session.user.user_id || req.session.user.user_uid || req.session.user;
            
            // Debug: Check if userUid is valid
            if (!userUid || typeof userUid !== 'string') {
                console.error('Invalid user_id in session:', req.session.user);
                req.session.destroy();
                return res.redirect('/login?error=system_error');
            }
            
            // Skip database check for Viewer guest account
            if (userUid === 'viewer-guest-account') {
                return next();
            }
            
            // Check if user still exists and is not deleted/banned
            const user = await User.findOne({ user_uid: userUid });
            
            if (!user) {
                // User no longer exists in database
                req.session.destroy();
                return res.redirect('/login?error=account_not_found');
            }
            
            if (user.status === 'deleted') {
                // User is marked as deleted, kick them out
                req.session.destroy();
                return res.redirect('/login?error=account_deleted');
            }
            
            if (user.status === 'banned') {
                // User is banned, kick them out
                req.session.destroy();
                return res.redirect('/login?error=account_banned');
            }
            
            if (user.status === 'suspended') {
                // User is suspended, kick them out
                req.session.destroy();
                return res.redirect('/login?error=account_suspended');
            }
            

            // User is valid, proceed
            return next();
        } catch (error) {
            console.error('Error checking user status:', error);
            // On error, destroy session and redirect to login
            req.session.destroy();
            return res.redirect('/login?error=system_error');
        }
    } else {
        res.redirect('/login'); // User is not logged in, redirect to login page
    }
}

function attachUserRole(req, res, next) {
    // Ensure userRole is set or defaults to 'guest'
    res.locals.userRole = req.session.role || 'guest';
    next();
}

// More efficient version that caches user status checks
async function checkAuthWithCache(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }

    try {
        const currentTime = Date.now();
        // Extract user_id from session user object
        const userUid = req.session.user.user_id || req.session.user.user_uid || req.session.user;
        
        // Debug: Check if userUid is valid
        if (!userUid || typeof userUid !== 'string') {
            console.error('Invalid user_id in session:', req.session.user);
            req.session.destroy();
            return res.redirect('/login?error=system_error');
        }
        
        // Skip database check for Viewer guest account
        if (userUid === 'viewer-guest-account') {
            return next();
        }
        
        const cacheKey = `user_status_${userUid}`;
        
        // Check if we have a cached status and it's not expired (cache for 5 minutes)
        if (req.session[cacheKey] && 
            req.session[cacheKey].timestamp && 
            (currentTime - req.session[cacheKey].timestamp) < 300000) {
            
            const cachedStatus = req.session[cacheKey].status;
            
            if (cachedStatus === 'deleted' || cachedStatus === 'banned' || cachedStatus === 'suspended') {
                req.session.destroy();
                return res.redirect(`/login?error=account_${cachedStatus}`);
            }
            
            return next();
        }

        // Cache expired or doesn't exist, check database
        const user = await User.findOne({ user_uid: userUid });
        
        if (!user) {
            req.session.destroy();
            return res.redirect('/login?error=account_not_found');
        }

        // Cache the user status
        req.session[cacheKey] = {
            status: user.status,
            timestamp: currentTime
        };

        if (user.status === 'deleted' || user.status === 'banned' || user.status === 'suspended') {
            req.session.destroy();
            return res.redirect(`/login?error=account_${user.status}`);
        }

        return next();
    } catch (error) {
        console.error('Error checking user status:', error);
        req.session.destroy();
        return res.redirect('/login?error=system_error');
    }
}

module.exports = { checkAuth, attachUserRole, checkAuthWithCache };
