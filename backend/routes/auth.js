const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Example protected route
router.get('/me', authController.verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
