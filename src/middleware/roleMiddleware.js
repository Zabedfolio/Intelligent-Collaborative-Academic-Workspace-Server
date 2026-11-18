/**
 * Higher-order role authorization middleware for Role-Based Access Control (RBAC)
 * @param {Array<string>|string} roles - Single role or array of allowed roles ('student', 'teacher', 'admin')
 */
const requireRole = (roles = []) => {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required before role check.'
      });
    }

    const userRole = req.user.role || 'student';

    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: This resource requires one of [${allowed.join(', ')}]. Your current role is '${userRole}'.`
      });
    }

    next();
  };
};

module.exports = { requireRole };

