const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Placeholder for notifications routes
router.get('/', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Notifications endpoint - Coming soon',
    data: []
  });
});

module.exports = router;
