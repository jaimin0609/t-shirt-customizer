import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentication required. Please log in to access this resource.' });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verify token
        if (!process.env.JWT_SECRET) {
            console.error('WARNING: JWT_SECRET environment variable is not set!');
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Find user by id
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(401).json({ message: 'Account is inactive' });
        }
        
        // Add user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status
        };
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Authentication failed. Please log in again.' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
};

export { auth, isAdmin }; 