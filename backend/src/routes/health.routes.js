const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'sumora-backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    components: {
      database: 'configured',
      redis: 'configured',
      queue: 'configured',
    },
  });
});

module.exports = router;

