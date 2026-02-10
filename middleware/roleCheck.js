function checkRole(allowedRoles) {
    return (req, res, next) => {
      const userRole = req.session.role;
      if (allowedRoles.includes(userRole)) {
        return next();
      } else {
        res.status(403).render('403', { activePage: 'home' });
      }
    };
  }
  
  module.exports = checkRole;