/**
 * Security middleware for the application
 * Implements various protections against common web vulnerabilities
 */

import helmet from 'helmet';
import csrf from 'csurf';
import { isFromTrustedOrigin } from '../utils/requestUtils.js';

/**
 * Initialize the security middleware functions
 * @returns {Object} Security middleware functions
 */
export const initializeSecurityMiddleware = () => {
    // Configure CSRF protection
    const csrfProtection = csrf({
        cookie: {
            key: '_csrf',
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600 // 1 hour
        }
    });

    // Configure Helmet for security headers
    const configureHelmet = helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
                imgSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net', 'https://*.cloudinary.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
                connectSrc: ["'self'", process.env.API_URL || 'http://localhost:3001'],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        xssFilter: true,
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        noSniff: true,
        dnsPrefetchControl: { allow: false },
        frameguard: { action: 'deny' },
        permittedCrossDomainPolicies: { permittedPolicies: 'none' }
    });

    // CORS configuration middleware
    const configureCors = (req, res, next) => {
        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://your-production-domain.com'
        ];

        const origin = req.headers.origin;
        
        // Allow requests with no origin (like mobile apps)
        if (origin && allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }

        // Set other CORS headers
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return res.status(204).end();
        }
        
        next();
    };

    // CSRF token validation middleware - with exclusions for specific routes
    const validateCsrfToken = (req, res, next) => {
        // Skip CSRF validation for authentication endpoints
        if (req.path.startsWith('/api/auth/') || req.method === 'GET') {
            return next();
        }
        
        csrfProtection(req, res, next);
    };

    // Rate limiting configuration for API endpoints
    const rateLimitMiddleware = (req, res, next) => {
        // Implement rate limiting here (or use a library)
        next();
    };

    // Middleware to validate Origin header for CORS requests
    const validateOrigin = (req, res, next) => {
        // Skip origin validation for non-mutating requests
        if (req.method === 'GET' || req.method === 'OPTIONS') {
            return next();
        }
        
        // For mutation requests (POST, PUT, DELETE), validate origin header
        if (!isFromTrustedOrigin(req)) {
            return res.status(403).json({
                error: 'Invalid request origin',
                message: 'Request from untrusted origin'
            });
        }
        
        next();
    };

    return {
        configureHelmet,
        configureCors,
        validateCsrfToken,
        csrfProtection,
        rateLimitMiddleware,
        validateOrigin
    };
};

export default initializeSecurityMiddleware; 