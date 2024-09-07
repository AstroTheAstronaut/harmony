// middleware/roleCheck.js
function checkRole(allowedRoles) {
    return (req, res, next) => {
      const userRole = req.session.role; // Ensure this matches how you store the user role
      if (allowedRoles.includes(userRole)) {
        return next(); // User has the required role, proceed
      } else {
        res.status(403).render('403', { activePage: 'home' }); // Forbidden access
      }
    };
  }
  
  module.exports = checkRole;