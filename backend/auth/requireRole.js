// Role-based authorization middleware.
// Use after authMiddleWare (which puts the decoded token on req.user).
// Example: router.put('/register', authMiddleWare, requireRole('editor'), ...)
// Returns 403 if the logged-in user's role isn't one of the allowed roles.
module.exports = function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: 'You do not have permission to do this' });
    }
    next();
  };
};