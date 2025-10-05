const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Placeholder for startups routes
router.get('/', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Startups endpoint - Coming soon',
    data: []
  });
});

module.exports = router;
