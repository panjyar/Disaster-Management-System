export default function auth(requiredRole = null) {
  const rolesOrder = { contributor: 1, admin: 2 };
  return (req, res, next) => {
    const user = (req.headers['x-user'] || 'anonymous').toString();
    const role = (req.headers['x-role'] || 'contributor').toString();
    req.user = { id: user, role };
    if (requiredRole) {
      if (!rolesOrder[role] || rolesOrder[role] < rolesOrder[requiredRole]) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    next();
  };
}
