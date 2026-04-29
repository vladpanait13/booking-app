const jwt = require('jsonwebtoken');

const JWT_SECRET = 'booking-app-secret-key-change-in-production';

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Token invalid, continue without user
    }
  }
  next();
}

module.exports = { authenticate, optionalAuth, JWT_SECRET };
