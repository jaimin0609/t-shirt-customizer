import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { getClientIp } from '../utils/requestUtils.js';

/**
 * Token blacklist for revoked tokens
 * In a production environment, this should be replaced with Redis or a similar solution
 */
const tokenBlacklist = new Set();

/**
 * Rate limiting map to prevent brute force attacks
 * Stores IP address as key and count/timestamp as value
 */
const rateLimitMap = new Map();
const MAX_ATTEMPTS = process.env.NODE_ENV === 'production' ? 5 : 50; // Much more lenient in development
const WINDOW_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Check if a request is being rate limited
 * @param {string} ip - The IP address to check
 * @returns {boolean} - Whether the request should be rate limited
 */
const isRateLimited = (ip) => {
    const now = Date.now();
    
    // Clean up expired entries
    for (const [key, value] of rateLimitMap.entries()) {
        if (now - value.timestamp > WINDOW_MS) {
            rateLimitMap.delete(key);
        }
    }
    
    // Check if IP is in the map
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
        return false;
    }
    
    // Get current count and timestamp
    const entry = rateLimitMap.get(ip);
    
    // Check if window has expired
    if (now - entry.timestamp > WINDOW_MS) {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
        return false;
    }
    
    // Increment count
    entry.count += 1;
    rateLimitMap.set(ip, entry);
    
    // Check if count exceeds limit
    return entry.count > MAX_ATTEMPTS;
};

/**
 * Add a token to the blacklist
 * @param {string} token - The token to blacklist
 * @returns {void}
 */
export const blacklistToken = (token) => {
    if (!token) return;
    
    try {
        // Only add valid tokens to blacklist
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Calculate token expiration time
        const expiryTime = decoded.exp * 1000;
        
        // Add token to blacklist
        tokenBlacklist.add(token);
        
        // Schedule removal from blacklist after token expires
        // This helps prevent memory leaks in the blacklist
        const timeUntilExpiry = expiryTime - Date.now();
        if (timeUntilExpiry > 0) {
            setTimeout(() => {
                tokenBlacklist.delete(token);
            }, timeUntilExpiry);
        }
    } catch (error) {
        // If token is invalid or expired, no need to blacklist
        console.error('Error blacklisting token:', error.message);
    }
};

/**
 * Generate a secure JWT token
 * @param {Object} user - User object to encode in token
 * @param {Object} options - Additional token options
 * @returns {string} JWT token
 */
export const generateToken = (user, options = {}) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion || 0,
        // Include additional claims from options
        ...options
    };
    
    // Default expiration time is 1 day
    const expiresIn = options.expiresIn || '1d';
    
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { 
            expiresIn,
            // Include issued at claim for additional security
            issuer: 'tshirt-customizer-api',
            audience: 'tshirt-customizer-client'
        }
    );
};

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request
 */
const auth = async (req, res, next) => {
    try {
        // Get client IP for rate limiting
        const ip = getClientIp(req);
        
        // Check for rate limiting
        if (isRateLimited(ip)) {
            console.warn(`Rate limit exceeded for IP: ${ip}`);
            return res.status(429).json({ 
                message: 'Too many authentication attempts. Please try again later.',
                retryAfter: Math.ceil(WINDOW_MS / 1000 / 60) // Minutes until retry
            });
        }
        
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Authentication required. Please log in to access this resource.',
                code: 'AUTH_REQUIRED'
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Check for empty or invalid token format
        if (!token || token === 'undefined' || token === 'null') {
            return res.status(401).json({ 
                message: 'Invalid authentication token provided.',
                code: 'INVALID_TOKEN_FORMAT'
            });
        }
        
        // Check if token is blacklisted
        if (tokenBlacklist.has(token)) {
            return res.status(401).json({ 
                message: 'This session has been revoked. Please log in again.',
                code: 'TOKEN_REVOKED'
            });
        }
        
        // Verify environment configuration
        if (!process.env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET environment variable is not set!');
            return res.status(500).json({ 
                message: 'Server configuration error. Please contact support.',
                code: 'SERVER_CONFIG_ERROR'
            });
        }
        
        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET, {
                issuer: 'tshirt-customizer-api',
                audience: 'tshirt-customizer-client'
            });
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError.name);
            
            // Provide more specific error messages based on JWT error type
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Your session has expired. Please log in again.',
                    code: 'TOKEN_EXPIRED'
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    message: 'Invalid authentication token. Please log in again.',
                    code: 'INVALID_TOKEN'
                });
            } else {
                return res.status(401).json({ 
                    message: 'Authentication failed. Please log in again.',
                    code: 'AUTH_FAILED'
                });
            }
        }
        
        // Check token payload for required fields
        if (!decoded.id) {
            return res.status(401).json({ 
                message: 'Invalid token payload. Please log in again.',
                code: 'INVALID_PAYLOAD'
            });
        }
        
        // Find user by id
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
            return res.status(401).json({ 
                message: 'User account not found. Please contact support.',
                code: 'USER_NOT_FOUND'
            });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(401).json({ 
                message: `Account is ${user.status}. Please contact support.`,
                code: 'ACCOUNT_INACTIVE'
            });
        }
        
        // Check token version (for token invalidation after password change)
        if (decoded.tokenVersion !== undefined && 
            user.tokenVersion !== undefined && 
            decoded.tokenVersion < user.tokenVersion) {
            return res.status(401).json({ 
                message: 'Your credentials have changed. Please log in again.',
                code: 'TOKEN_VERSION_MISMATCH'
            });
        }
        
        // Add user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            // Pass through emergency login flag if present in token
            isEmergencyLogin: decoded.isEmergencyLogin || false
        };
        
        // Store token in request for logout functionality
        req.token = token;
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            message: 'Authentication failed. Please log in again.',
            code: 'AUTH_ERROR'
        });
    }
};

/**
 * Admin authorization middleware
 * Checks if the authenticated user has admin role
 */
const isAdmin = (req, res, next) => {
    // Special case for emergency login - always grant access but with improved logging
    if (req.user && req.user.isEmergencyLogin === true) {
        // Log the emergency access with more details
        console.warn(`⚠️ EMERGENCY LOGIN: Admin access granted to ${req.user.email} [ID: ${req.user.id}]`);
        console.warn(`⚠️ Emergency access to: ${req.method} ${req.originalUrl}`);
        
        // Add an audit log entry for emergency access
        try {
            // This would ideally be a separate service call to log the emergency access
            console.warn(`⚠️ AUDIT: Emergency admin access by ${req.user.email} at ${new Date().toISOString()}`);
        } catch (logError) {
            console.error('Failed to log emergency access:', logError);
        }
        
        next();
        return;
    }

    // Regular admin check
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            message: 'Access denied. Admin privileges required.',
            code: 'ADMIN_REQUIRED'
        });
    }
};

export { auth, isAdmin }; 