const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Placeholder for investors routes
router.get('/', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Investors endpoint - Coming soon',
    data: []
  });
});

module.exports = router;
