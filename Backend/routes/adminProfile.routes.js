import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
import { fileURLToPath } from 'url';
import { User } from '../models/index.js';
import { auth, isAdmin } from '../middleware/auth.js';
import { cloudinaryEnabled, uploadImage } from '../config/cloudinary.js';
import cloudinary from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for profile image upload
const uploadDir = path.join(__dirname, '../public/uploads/profiles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed!'));
    }
});

// Get admin profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching admin profile:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Update admin profile
router.put('/profile', auth, isAdmin, upload.single('profileImage'), async (req, res) => {
    try {
        console.log('Profile update request received');
        console.log('Request body:', req.body);
        console.log('File:', req.file);
        console.log('User ID from token:', req.user.id);
        
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            console.log('User not found with ID:', req.user.id);
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('Current user data:', user.toJSON());
        
        // Create update object
        const updateData = {};
        
        // Update basic fields if provided
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.email) updateData.email = req.body.email;
        if (req.body.username) updateData.username = req.body.username;
        
        // Update password if provided
        if (req.body.newPassword && req.body.newPassword.trim() !== '') {
            updateData.password = await bcrypt.hash(req.body.newPassword, 12);
            
            // Add timestamp of password change
            updateData.lastPasswordChange = new Date();
            
            // Reset token version to invalidate all existing sessions except current one
            updateData.tokenVersion = (user.tokenVersion || 0) + 1;
            
            console.log('Password updated');
        }
        
        // Process profile image if uploaded
        if (req.file) {
            try {
                console.log('Processing uploaded profile image');
                // Build public URL for the uploaded file
                const imagePath = `/uploads/profile/${req.file.filename}`;
                updateData.profileImage = imagePath;
                console.log('Profile image updated:', imagePath);
            } catch (imageError) {
                console.error('Error processing profile image:', imageError);
                // Don't fail the entire update if just the image has an issue
            }
        }
        
        // Check for empty update
        if (Object.keys(updateData).length === 0) {
            console.log('No fields to update');
            return res.status(400).json({ message: 'No valid fields to update' });
        }
        
        // Update the user record
        try {
            console.log('Updating user with data:', updateData);
            await user.update(updateData);
            console.log('User updated successfully');
            
            // Get refreshed user data without password
            const updatedUser = await User.findByPk(req.user.id, {
                attributes: { exclude: ['password'] }
            });
            
            return res.json(updatedUser);
        } catch (updateError) {
            console.error('Error updating user:', updateError);
            
            // Handle unique constraint errors specially
            if (updateError.name === 'SequelizeUniqueConstraintError') {
                const field = updateError.errors[0].path;
                return res.status(400).json({ 
                    message: `The ${field} is already in use by another account`,
                    field
                });
            }
            
            throw updateError;
        }
    } catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({ 
            message: 'Error updating profile', 
            error: error.message 
        });
    }
});

export default router; 