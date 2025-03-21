/**
 * Security Headers Utility
 * Provides security-related middleware and utilities
 */

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Apply security headers to all responses
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const securityHeaders = (req, res, next) => {
  // Prevent browsers from incorrectly detecting non-scripts as scripts
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS filtering. If a XSS attack is detected, the browser will sanitize the page
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict Transport Security (use only in production with HTTPS)
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "img-src 'self' data: https://res.cloudinary.com",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'", // For styled-components or inline styles
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  
  // Don't expose the technology stack
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Configure CORS with secure defaults
 * 
 * @param {Array} allowedOrigins - List of allowed origins
 * @returns {Function} CORS middleware
 */
export const secureCors = (allowedOrigins = ['http://localhost:3000']) => {
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    // Check if the request origin is in our allowed list
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!isProduction && origin) {
      // In development, log unrecognized origins but still allow them
      console.warn(`CORS: Unrecognized origin: ${origin}`);
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!isProduction) {
      // In development, allow any origin if none specified
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    // In production, only explicitly allowed origins get CORS headers
    
    // Allow credentials (cookies)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Allow specific headers
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token'
    );
    
    // Allow specific methods
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(204); // No content needed for preflight
      return;
    }
    
    next();
  };
};

/**
 * Validate and sanitize request parameters
 * Protects against parameter pollution attacks
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const sanitizeParams = (req, res, next) => {
  // Remove potential parameter pollution
  if (req.query) {
    const sanitizedQuery = {};
    for (const [key, value] of Object.entries(req.query)) {
      // If parameter appears multiple times, use the first occurrence
      sanitizedQuery[key] = Array.isArray(value) ? value[0] : value;
    }
    req.query = sanitizedQuery;
  }
  
  next();
};

/**
 * Rate limiting middleware factory
 * Provides a simple rate limiter for API endpoints
 * 
 * @param {Object} options - Rate limiting options
 * @returns {Function} Rate limiting middleware
 */
export const createRateLimiter = ({ 
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 100, // Limit each IP to 100 requests per windowMs
  message = 'Too many requests from this IP, please try again later'
} = {}) => {
  // Store request counts per IP
  const ipRequests = new Map();
  
  // Cleanup old entries every windowMs/2
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipRequests.entries()) {
      if (now - data.startTime > windowMs) {
        ipRequests.delete(ip);
      }
    }
  }, windowMs / 2);
  
  // Keep the interval from preventing the process from exiting
  interval.unref();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!ipRequests.has(ip)) {
      ipRequests.set(ip, {
        count: 1,
        startTime: now
      });
      return next();
    }
    
    const requestData = ipRequests.get(ip);
    
    // Reset if window has passed
    if (now - requestData.startTime > windowMs) {
      requestData.count = 1;
      requestData.startTime = now;
      return next();
    }
    
    // Increment count
    requestData.count += 1;
    
    // Check if over limit
    if (requestData.count > max) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - requestData.count));
    res.setHeader('X-RateLimit-Reset', new Date(requestData.startTime + windowMs).toISOString());
    
    next();
  };
};

/**
 * Default API security setup
 * Combines all security middleware with sensible defaults
 * 
 * @returns {Array} Array of middleware functions
 */
export const defaultSecurity = () => {
  return [
    securityHeaders,
    secureCors(),
    sanitizeParams,
    createRateLimiter()
  ];
}; 