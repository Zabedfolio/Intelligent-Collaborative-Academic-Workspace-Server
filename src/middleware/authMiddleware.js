const { auth } = require('../lib/auth');

/**
 * Middleware to verify active Better Auth session on incoming requests
 */
const requireAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized: No active session' });
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    console.error('Better Auth verification error:', error);
    return res.status(401).json({ error: 'Unauthorized: Session verification failed' });
  }
};

/**
 * Higher-order middleware for Role-Based Access Control (RBAC)
 */
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    const userRole = req.user.role || 'student';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Forbidden: Access requires one of [${allowedRoles.join(', ')}]. Current role: ${userRole}`
      });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole
};

