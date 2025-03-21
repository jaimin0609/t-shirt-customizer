import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { formatError, asyncHandler } from '../utils/errorHandler.js';
import imageService from '../services/image.service.js';

const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'Backend/uploads/temp');
    },
    filename: function (req, file, cb) {
        const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueFilename);
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    // Check if file is a valid image
    if (imageService.isValidImage(file)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
    }
};

// Configure multer upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Route to upload a single image
router.post('/image', upload.single('image'), asyncHandler(async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        
        // Process and save image using the image service
        const result = await imageService.processAndStoreImage(req.file, {
            createThumbnail: true
        });
        
        res.status(200).json({
            message: 'Image uploaded successfully',
            imageUrl: result.url,
            thumbnailUrl: result.thumbnail?.url || null,
            provider: result.provider || 'local',
            ...result
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ 
            message: 'Error uploading image',
            error: formatError(error, 'uploadImage')
        });
    }
}));

// Route to upload multiple images
router.post('/images', upload.array('images', 5), asyncHandler(async (req, res) => {
    try {
        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No image files provided' });
        }
        
        // Process each image
        const uploadPromises = req.files.map(file => 
            imageService.processAndStoreImage(file, { createThumbnail: true })
        );
        
        // Wait for all uploads to complete
        const results = await Promise.all(uploadPromises);
        
        res.status(200).json({
            message: `${results.length} images uploaded successfully`,
            images: results.map(result => ({
                imageUrl: result.url,
                thumbnailUrl: result.thumbnail?.url || null,
                provider: result.provider || 'local',
                filename: result.filename
            }))
        });
    } catch (error) {
        console.error('Multiple images upload error:', error);
        res.status(500).json({ 
            message: 'Error uploading images',
            error: formatError(error, 'uploadImages')
        });
    }
}));

// Route to upload a custom design image
router.post('/custom-design', upload.single('designImage'), asyncHandler(async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No design image provided' });
        }
        
        // Get options from request body
        const { width, height, quality } = req.body;
        
        // Process and save custom design image
        const result = await imageService.processAndStoreImage(req.file, {
            createThumbnail: true,
            folder: 'custom-designs',
            width: width ? parseInt(width) : 1200,
            height: height ? parseInt(height) : null,
            quality: quality ? parseInt(quality) : 90
        });
        
        res.status(200).json({
            message: 'Custom design image uploaded successfully',
            imageUrl: result.url,
            thumbnailUrl: result.thumbnail?.url || null,
            provider: result.provider || 'local',
            ...result
        });
    } catch (error) {
        console.error('Custom design upload error:', error);
        res.status(500).json({ 
            message: 'Error uploading custom design image',
            error: formatError(error, 'uploadCustomDesign')
        });
    }
}));

// Route to delete an image
router.delete('/image', asyncHandler(async (req, res) => {
    try {
        const { imageUrl } = req.body;
        
        if (!imageUrl) {
            return res.status(400).json({ message: 'Image URL is required' });
        }
        
        // Delete the image using the image service
        const result = await imageService.deleteImage(imageUrl);
        
        res.status(200).json({
            message: 'Image deleted successfully',
            result
        });
    } catch (error) {
        console.error('Image deletion error:', error);
        res.status(500).json({ 
            message: 'Error deleting image',
            error: formatError(error, 'deleteImage')
        });
    }
}));

// Health check route for upload service
router.get('/health', asyncHandler(async (req, res) => {
    // Check storage services health
    const sharpStatus = await import('../services/sharp.service.js')
        .then(module => module.default.getSharpStatus())
        .catch(error => ({ available: false, error: error.message }));
    
    const storageServiceStatus = await import('../services/storage.service.js')
        .then(module => module.default.getCloudinaryStatus())
        .catch(error => ({ available: false, error: error.message }));
    
    res.status(200).json({
        status: 'healthy',
        message: 'Upload service is operational',
        services: {
            sharp: sharpStatus,
            storage: storageServiceStatus
        }
    });
}));

export default router; 