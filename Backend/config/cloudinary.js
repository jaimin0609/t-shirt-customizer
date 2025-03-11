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

// Validate required environment variables
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

// Variable to track if Cloudinary is working
let cloudinaryEnabled = true;

if (missingEnvVars.length > 0) {
  console.warn(`⚠️ Missing required Cloudinary environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Cloudinary functionality will not be available - falling back to local storage');
  cloudinaryEnabled = false;
} else {
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  
  // Test Cloudinary connection
  try {
    console.log('Testing Cloudinary connection...');
    // Let's proceed without waiting for the test - we'll check it later
    cloudinary.api.ping().then(() => {
      console.log('✅ Cloudinary connection successful!');
    }).catch(error => {
      console.error('❌ Cloudinary connection failed:', error);
      cloudinaryEnabled = false;
      console.warn('Falling back to local storage for file uploads');
    });
  } catch (err) {
    console.error('❌ Cloudinary configuration error:', err);
    cloudinaryEnabled = false;
    console.warn('Falling back to local storage for file uploads');
  }
}

// Configure local storage as a fallback
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created local upload directory:', uploadDir);
}

const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

// Create multer storage - use Cloudinary if available, otherwise local
let storage;
if (cloudinaryEnabled) {
  try {
    storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'tshirt-customizer',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
      }
    });
    console.log('Cloudinary storage configured');
  } catch (err) {
    console.error('Error configuring CloudinaryStorage:', err);
    cloudinaryEnabled = false;
    storage = localStorage;
    console.log('Falling back to local storage');
  }
} else {
  storage = localStorage;
  console.log('Using local storage for file uploads');
}

// Function for uploading images to Cloudinary (compatible with v1)
const uploadImage = (imagePath, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!cloudinaryEnabled) {
      // If Cloudinary is not available, return a local URL
      const filename = path.basename(imagePath);
      const localUrl = `/uploads/products/${filename}`;
      console.log('Using local URL instead of Cloudinary:', localUrl);
      resolve({
        public_id: filename,
        secure_url: localUrl,
        url: localUrl
      });
      return;
    }
    
    // Default options
    const uploadOptions = {
      folder: 'tshirt-customizer',
      ...options
    };
    
    // Check if file exists (for local files)
    if (imagePath && !imagePath.startsWith('http') && !fs.existsSync(imagePath)) {
      console.warn(`File not found: ${imagePath}`);
      return reject(new Error(`File not found: ${imagePath}`));
    }
    
    // Upload to Cloudinary
    cloudinary.uploader.upload(imagePath, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        
        // Fall back to local URL if Cloudinary fails
        const filename = path.basename(imagePath);
        const localUrl = `/uploads/products/${filename}`;
        console.log('Falling back to local URL:', localUrl);
        
        resolve({
          public_id: filename,
          secure_url: localUrl,
          url: localUrl
        });
      } else {
        console.log('Uploaded to Cloudinary:', result.secure_url);
        resolve(result);
      }
    }, uploadOptions);
  });
};

// Function to get Cloudinary credentials for frontend
const getCloudinaryConfig = () => {
  if (!cloudinaryEnabled) {
    console.warn('Cloudinary is not enabled - cannot provide configuration for frontend');
    return null;
  }
  
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    uploadPreset: 'ml_default' // You can create a custom upload preset in your Cloudinary dashboard
  };
};

// Function to get default Cloudinary URL for placeholder image
const getCloudinaryUrl = () => {
  if (!cloudinaryEnabled) {
    return '/uploads/products/placeholder.jpg';
  }
  
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1650052235/tshirt-customizer/placeholder-tshirt-white.jpg`;
};

// Function to get image URL for a public ID
const getImageUrl = (publicId) => {
  if (!publicId) return getCloudinaryUrl();
  
  if (!cloudinaryEnabled) {
    // If it's already a local path, return as is
    if (publicId.startsWith('/uploads/')) {
      return publicId;
    }
    return `/uploads/products/${publicId}`;
  }
  
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  });
};

export { cloudinary, storage, uploadImage, getCloudinaryConfig, getCloudinaryUrl, getImageUrl, cloudinaryEnabled }; 