import express from 'express';
import errorHandler from './middleware/errorHandler.js';
import errorController from './controllers/errorController.js';

// Parse command line arguments
const args = process.argv.slice(2);
const portArg = args.find(arg => arg.startsWith('--port='));
const PORT = portArg ? parseInt(portArg.split('=')[1]) : 3002;

// Create a test app
const app = express();

// Test middleware that generates different types of errors
app.get('/test/validation-error', (req, res, next) => {
  const err = new Error('Validation failed');
  err.name = 'SequelizeValidationError';
  err.errors = [{ message: 'Field cannot be empty' }];
  next(err);
});

app.get('/test/auth-error', (req, res, next) => {
  const err = new Error('Invalid token');
  err.name = 'JsonWebTokenError';
  next(err);
});

app.get('/test/not-found', (req, res, next) => {
  const err = errorController.notFound('User');
  next(err);
});

app.get('/test/server-error', (req, res, next) => {
  const err = new Error('Database connection failed');
  err.stack = 'Error: Database connection failed\n    at Object.query (/app/models/db.js:25:13)';
  next(err);
});

app.get('/test/async-error', errorController.catchAsync(async (req, res) => {
  throw new Error('Async operation failed');
}));

// Apply the error handler middleware
app.use(errorHandler);

// Start test server with error handling
const server = app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log('🧪 Error handling test routes:');
  console.log(' - GET /test/validation-error (400 status with validation details)');
  console.log(' - GET /test/auth-error (401 status with auth error)');
  console.log(' - GET /test/not-found (404 status)');
  console.log(' - GET /test/server-error (500 status with sanitized stack in production)');
  console.log(' - GET /test/async-error (500 status, tests async handler)');
  console.log('\n📝 Run in development mode to see full error details');
  console.log('📝 Run in production mode to see sanitized responses');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try a different port with --port=XXXX`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err.message);
    process.exit(1);
  }
}); 