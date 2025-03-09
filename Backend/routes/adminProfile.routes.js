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
        }
        
        // Update profile image if provided
        if (req.file) {
            console.log('Processing new profile image');
            
            // Delete old profile image if exists
            if (user.profileImage && user.profileImage.startsWith('/uploads/profiles/')) {
                const oldImagePath = path.join(__dirname, '../public', user.profileImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log('Deleted old profile image:', oldImagePath);
                }
            }
            
            updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
            console.log('New profile image path:', updateData.profileImage);
        }
        
        console.log('Updating user with data:', updateData);
        
        // Update the user
        await user.update(updateData);
        console.log('User updated successfully');
        
        // Fetch fresh user data
        const updatedUser = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        
        console.log('Updated user data:', updatedUser.toJSON());
        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).json({ 
            message: 'Error updating profile',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

export default router; 