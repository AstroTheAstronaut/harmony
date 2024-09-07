function checkAuth(req, res, next) {
  if (req.session && req.session.user) {
      return next(); // User is logged in, proceed to the next middleware/route
  } else {
      res.redirect('/login'); // User is not logged in, redirect to login page
  }
}

function attachUserRole(req, res, next) {
  // Ensure userRole is set or defaults to 'guest'
  res.locals.userRole = req.session.role
  next();
}


module.exports = { checkAuth, attachUserRole };
