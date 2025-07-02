const { roles } = require('../../permissions');

function hasPermission(userRole, permission) {
  const rolePermissions = roles[userRole] || [];
  return rolePermissions.includes('*') || rolePermissions.includes(permission);
}

module.exports = { hasPermission };
