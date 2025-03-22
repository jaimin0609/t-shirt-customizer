import express from 'express';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Simple health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  try {
    res.status(200).json({
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/health/details
 * @desc    Detailed server status
 * @access  Public
 */
router.get('/details', (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const status = {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
      },
      environment: process.env.NODE_ENV || 'development',
      node: process.version
    };
    
    res.status(200).json(status);
  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Detailed health check failed',
      error: error.message
    });
  }
});

export default router; 