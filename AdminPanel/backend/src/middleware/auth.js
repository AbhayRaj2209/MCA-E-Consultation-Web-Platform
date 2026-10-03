const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

// "Authorization: Bearer <token>" check karta hai; valid hone par req.userId set hota hai
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'Session expired. Please sign in again.' });
  }
}

module.exports = { requireAuth };
