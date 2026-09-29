const jwt = require('jsonwebtoken');
const db = require('../db');

/**
 * Factory that builds role/department-based access-control middleware.
 * Verifies the JWT, loads the user (including department) from the DB and
 * enforces the supplied allowlists. Admins (is_admin = 1) are always allowed.
 *
 * @param {Object} config
 * @param {string[]} config.allowedRoles       Roles allowed (case-insensitive)
 * @param {string[]} config.allowedDepartments Departments allowed (case-insensitive)
 */
function requireAccess({ allowedRoles = [], allowedDepartments = [] } = {}) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided or invalid format' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const [rows] = await db.query(
        'SELECT id, email, role, department, is_admin FROM users WHERE id = ?',
        [decoded.id]
      );

      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      const user = rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        department: user.department,
        is_admin: user.is_admin,
      };

      const isAdmin = Number(user.is_admin) === 1;
      if (isAdmin) return next();

      const role = String(user.role || '').trim().toLowerCase();
      const department = String(user.department || '').trim().toLowerCase();

      const roleAllowed = allowedRoles.some(r => r === role);
      const deptAllowed = allowedDepartments.some(d => d === department);

      if (!roleAllowed && !deptAllowed) {
        return res.status(403).json({ success: false, message: 'Access denied. Insufficient privileges.' });
      }

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired' });
      }
      console.error('Access control middleware error:', error);
      return res.status(500).json({ success: false, message: 'Authentication failed' });
    }
  };
}

// Files: HR, Chairman, Finance, Executive, GMD (roles) or Admin (department)
const requireFilesAccess = requireAccess({
  allowedRoles: ['hr', 'chairman', 'finance', 'executive', 'gmd'],
  allowedDepartments: ['admin'],
});

// Users: HR, GMD, Chairman, Finance (roles) or ICT (department)
const requireUsersAccess = requireAccess({
  allowedRoles: ['hr', 'gmd', 'chairman', 'finance'],
  allowedDepartments: ['ict'],
});

module.exports = { requireAccess, requireFilesAccess, requireUsersAccess };
