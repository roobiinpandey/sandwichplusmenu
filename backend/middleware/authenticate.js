function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  // fallback to cookie named 'token'
  if (!token && req.cookies && req.cookies.token) token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const jwt = require('jsonwebtoken');
  require('dotenv').config();
  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };
