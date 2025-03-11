import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Validate required environment variables
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️ Missing required Cloudinary environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Cloudinary functionality may not work correctly');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Create multer storage engine
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'tshirt-customizer',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  }
});

// Function for uploading images to Cloudinary (compatible with v1)
const uploadImage = (imagePath, options = {}) => {
  return new Promise((resolve, reject) => {
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
        reject(error);
      } else {
        console.log('Uploaded to Cloudinary:', result.secure_url);
        resolve(result);
      }
    }, uploadOptions);
  });
};

// Function to get Cloudinary credentials for frontend
const getCloudinaryConfig = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.warn('Missing Cloudinary configuration for frontend');
    return null;
  }
  
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    uploadPreset: 'ml_default' // You can create a custom upload preset in your Cloudinary dashboard
  };
};

// Function to handle Cloudinary URLs - either returning existing URLs or placeholder
const getCloudinaryUrl = (imagePath) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn('Missing CLOUDINARY_CLOUD_NAME environment variable');
    return imagePath || '/default-placeholder.jpg';
  }
  
  // If no path provided, return a placeholder
  if (!imagePath) {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1650052235/tshirt-customizer/placeholder.jpg`;
  }
  
  // If it's already a Cloudinary URL, return it
  if (imagePath && imagePath.includes('cloudinary.com')) {
    return imagePath;
  }
  
  // If it's a local path, convert to a placeholder Cloudinary URL
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1650052235/tshirt-customizer/placeholder.jpg`;
};

// Function to get image URL for a public ID
const getImageUrl = (publicId) => {
  if (!publicId) return getCloudinaryUrl();
  
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  });
};

export { cloudinary, storage, uploadImage, getCloudinaryConfig, getCloudinaryUrl, getImageUrl }; 