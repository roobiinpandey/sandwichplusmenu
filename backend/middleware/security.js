const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Create rate limiter instance ONCE at initialization
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30000 // Increased from 3000 to 30000
});

module.exports = function(app) {
  app.use(helmet());
  app.use(cors());
  // Only rate-limit non-admin routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/admin')) {
      return next();
    }
    return limiter(req, res, next);
  });
  app.use(compression());
};
