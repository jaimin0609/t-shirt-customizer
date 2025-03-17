import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { cloudinaryEnabled } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists for local development fallback
const uploadDir = path.join(__dirname, '../public/uploads/products');

// Create uploads directory if it doesn't exist (for local development)
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created upload directory:', uploadDir);
} else {
    console.log('Upload directory exists:', uploadDir);
}

/**
 * Helper function for proper PostgreSQL JSON handling
 * @param {any} value - The value to format for PostgreSQL
 * @returns {any} Formatted value
 */
const formatArrayForPostgres = (value) => {
    if (process.env.DATABASE_URL) { // PostgreSQL needs proper JSON strings
        if (value === null || value === undefined) {
            return '[]';
        }
        if (typeof value === 'string') {
            try {
                // If it's already a valid JSON string, just return it
                JSON.parse(value);
                return value;
            } catch (e) {
                // Not valid JSON, stringify it
                return JSON.stringify(value);
            }
        }
        // Not a string, stringify it
        return JSON.stringify(value || []);
    } else {
        // MySQL can handle arrays directly
        return value;
    }
};

/**
 * Service for handling product image uploads and processing
 */
class ProductImageService {
    constructor() {
        this.setupStorage();
    }

    /**
     * Setup storage based on environment
     */
    setupStorage() {
        if (cloudinaryEnabled) {
            console.log('🚀 Configuring multer with Cloudinary storage');
            
            // Initialize CloudinaryStorage
            this.storage = new CloudinaryStorage({
                cloudinary: cloudinary,
                params: {
                    folder: 'products',
                    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
                    format: 'jpg', // Force consistent format
                    transformation: [{ width: 1000, crop: "limit" }],
                    public_id: (req, file) => {
                        // Generate a unique ID using timestamp and random string
                        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                        const filename = file.fieldname + '-' + uniqueSuffix;
                        return filename;
                    }
                }
            });
        } else {
            // Local storage for development
            console.log('⚠️ Cloudinary not configured, using local storage');
            
            // Configure local disk storage
            this.storage = multer.diskStorage({
                destination: function (req, file, cb) {
                    cb(null, uploadDir);
                },
                filename: function (req, file, cb) {
                    // Create a unique filename with original extension
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const ext = path.extname(file.originalname);
                    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
                }
            });
        }

        // Configure multer with appropriate storage
        this.upload = multer({
            storage: this.storage,
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
            fileFilter: (req, file, cb) => {
                // Accept only image files
                if (!file.mimetype.startsWith('image/')) {
                    return cb(new Error('Only image files are allowed!'), false);
                }
                cb(null, true);
            }
        });
    }

    /**
     * Get the multer middleware for single image upload
     * @param {string} fieldName - Form field name for the image
     * @returns {Function} Multer middleware
     */
    getSingleUploadMiddleware(fieldName = 'image') {
        return this.upload.single(fieldName);
    }

    /**
     * Get the multer middleware for multiple image upload
     * @param {string} fieldName - Form field name for the images
     * @param {number} maxCount - Maximum number of files
     * @returns {Function} Multer middleware
     */
    getMultipleUploadMiddleware(fieldName = 'images', maxCount = 10) {
        return this.upload.array(fieldName, maxCount);
    }

    /**
     * Process uploaded file data for storage in database
     * @param {Object} file - The uploaded file object from multer
     * @returns {string} URL of the uploaded image
     */
    processUploadedFile(file) {
        if (!file) {
            return null;
        }

        // For Cloudinary uploads
        if (cloudinaryEnabled && file.path) {
            return file.path;
        }

        // For local uploads
        if (file.filename) {
            return `/uploads/products/${file.filename}`;
        }

        return null;
    }

    /**
     * Format image array for database storage
     * @param {Array|string} images - Array of image paths or JSON string
     * @returns {string|Array} Formatted images data
     */
    formatImagesForStorage(images) {
        return formatArrayForPostgres(images);
    }
}

export default new ProductImageService();
export { formatArrayForPostgres }; 