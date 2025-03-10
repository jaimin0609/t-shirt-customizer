import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dopvs93sl', 
  api_key: process.env.CLOUDINARY_API_KEY || '718734228757155', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'yXiUCqjRnc7zBk1kqlJHpc8e8qA',
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

// Function to get Cloudinary credentials for frontend
const getCloudinaryConfig = () => {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dopvs93sl',
    apiKey: process.env.CLOUDINARY_API_KEY || '718734228757155',
    uploadPreset: 'ml_default' // You can create a custom upload preset in your Cloudinary dashboard
  };
};

// Function to handle Cloudinary URLs - either returning existing URLs or placeholder
const getCloudinaryUrl = (imagePath) => {
  // If no path provided, return a placeholder
  if (!imagePath) {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'dopvs93sl'}/image/upload/v1650052235/tshirt-customizer/placeholder.jpg`;
  }
  
  // If it's already a Cloudinary URL, return it
  if (imagePath && imagePath.includes('cloudinary.com')) {
    return imagePath;
  }
  
  // If it's a local path, convert to a placeholder Cloudinary URL
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME || 'dopvs93sl'}/image/upload/v1650052235/tshirt-customizer/placeholder.jpg`;
};

// Function to get image URL for a public ID
const getImageUrl = (publicId) => {
  if (!publicId) return getCloudinaryUrl();
  
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  });
};

export { cloudinary, storage, getCloudinaryConfig, getCloudinaryUrl, getImageUrl }; 