const { roles } = require('../../permissions');
const hasPermission = (userRole, permission) => {
  const rolePermissions = roles[userRole] || [];
  return rolePermissions.includes('*') || rolePermissions.includes(permission);
};

module.exports = function(requiredPermission) {
  return function(req, res, next) {
    const userRole = res.locals.userRole;
    if (hasPermission(userRole, requiredPermission)) {
      return next();
    }
    return res.status(403).send('Forbidden');
  };
};