import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Debug Cloudinary configuration
console.log('=== CLOUDINARY CONFIGURATION DEBUG ===');
console.log('Checking Cloudinary environment variables:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY exists:', !!process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET exists:', !!process.env.CLOUDINARY_API_SECRET);

// Set cloudinaryEnabled to true initially if all credentials exist
// This way the routes will immediately use Cloudinary storage
let cloudinaryEnabled = !!(
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET
);

console.log('Initial Cloudinary status:', cloudinaryEnabled ? 'ENABLED' : 'DISABLED');

let cloudinaryStorage = null;

// Test Cloudinary connection function
const testCloudinaryConnection = async () => {
    try {
        console.log('Testing Cloudinary connection...');
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            console.error('❌ Cloudinary credentials are missing. Check your .env file');
            cloudinaryEnabled = false;
            return false;
        }
        const result = await cloudinary.v2.api.ping();
        console.log('✅ Cloudinary connection test successful:', result);
        cloudinaryEnabled = true;
        return true;
    } catch (error) {
        console.error('❌ Cloudinary connection test failed:', error.message);
        console.error('Error details:', error);
        cloudinaryEnabled = false;
        console.warn('Falling back to local storage for file uploads');
        return false;
    }
};

// Configure Cloudinary
try {
    console.log('Attempting to configure Cloudinary with:');
    console.log('- Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('- API key length:', process.env.CLOUDINARY_API_KEY?.length);
    
    // Configure Cloudinary
    cloudinary.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
    
    // Create Cloudinary storage instance with direct configuration
    cloudinaryStorage = new CloudinaryStorage({
        cloudinary: cloudinary.v2,
        params: {
            folder: 'products',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
            format: 'jpg', // Force consistent format
            transformation: [{ width: 1000, crop: "limit" }],
            public_id: (req, file) => {
                // Generate a unique ID using timestamp and random string
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const filename = file.originalname.split('.')[0];
                return `product-${filename}-${uniqueSuffix}`;
            }
        }
    });
    
    // Execute the connection test but don't wait for it to set cloudinaryEnabled
    // We'll update the flag if the test fails, but start with it enabled
    testCloudinaryConnection().then(success => {
        if (success) {
            console.log('✅ Cloudinary is enabled and ready to use');
        } else {
            console.warn('⚠️ Using local storage fallback');
        }
    }).catch(err => {
        console.error('Error during Cloudinary connection test:', err);
        cloudinaryEnabled = false;
    });
} catch (err) {
    console.error('❌ Cloudinary configuration error:', err);
    cloudinaryEnabled = false;
    console.warn('Falling back to local storage for file uploads');
}

// Set up local storage directory for fallback
const setupLocalStorage = () => {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'products');
    if (!fs.existsSync(uploadDir)) {
        try {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('Created local upload directory:', uploadDir);
        } catch (err) {
            console.error('Error creating upload directory:', err);
        }
    }
    return uploadDir;
};

// Configure local storage
const localStorageConfig = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = setupLocalStorage();
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Function for uploading images to Cloudinary
const uploadImage = async (imagePath, options = {}) => {
    if (!cloudinaryEnabled) {
        console.log('Cloudinary is not enabled, using local storage');
        return {
            public_id: path.basename(imagePath),
            secure_url: `/uploads/products/${path.basename(imagePath)}`,
            url: `/uploads/products/${path.basename(imagePath)}`
        };
    }

    try {
        console.log(`Attempting to upload image: ${imagePath}`);
        const uploadOptions = {
            folder: 'products',
            ...options
        };

        const result = await cloudinary.v2.uploader.upload(imagePath, uploadOptions);
        console.log('✅ Image uploaded successfully:', result.secure_url);
        return result;
    } catch (error) {
        console.error('❌ Error uploading image to Cloudinary:', error);
        throw error;
    }
};

// Function to get Cloudinary URL for a public ID
const getCloudinaryUrl = (publicId) => {
    if (!cloudinaryEnabled || !publicId) {
        return '/uploads/products/placeholder.jpg';
    }
    
    // If it's already a full Cloudinary URL, return it
    if (publicId.includes('cloudinary.com')) {
        // Ensure URL uses HTTPS
        return publicId.replace('http://', 'https://');
    }
    
    // Build a proper Cloudinary URL
    try {
        return cloudinary.v2.url(publicId, {
            secure: true,
            transformation: [{ width: 1000, crop: "limit" }]
        });
    } catch (error) {
        console.error(`Error generating Cloudinary URL for ${publicId}:`, error);
        return '/uploads/products/placeholder.jpg';
    }
};

// Function to get image URL for a public ID
const getImageUrl = (publicId) => {
    if (!publicId) {
        console.log('No publicId provided, returning placeholder');
        return '/uploads/products/placeholder.jpg';
    }

    if (!cloudinaryEnabled) {
        console.log(`Cloudinary not enabled, using local URL for: ${publicId}`);
        return publicId.startsWith('/uploads/') ? publicId : `/uploads/products/${publicId}`;
    }

    if (publicId.startsWith('http')) {
        console.log(`Using existing URL: ${publicId}`);
        return publicId.startsWith('http://') ? publicId.replace('http://', 'https://') : publicId;
    }
    
    // For Cloudinary public IDs
    try {
        const url = cloudinary.v2.url(publicId, {
            secure: true,
            transformation: [{ width: 1000, crop: "limit" }]
        });
        console.log(`Generated Cloudinary URL: ${url} for ID: ${publicId}`);
        return url;
    } catch (error) {
        console.error(`Error generating Cloudinary URL for ${publicId}:`, error);
        return '/uploads/products/placeholder.jpg';
    }
};

export {
    cloudinary,
    cloudinaryStorage,
    cloudinaryEnabled,
    uploadImage,
    getCloudinaryUrl,
    getImageUrl,
    localStorageConfig,
    testCloudinaryConnection
}; 