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
console.log('CLOUDINARY_CLOUD_NAME exists:', !!process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY exists:', !!process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET exists:', !!process.env.CLOUDINARY_API_SECRET);

// If they exist, log the first 4 chars to verify we have the right keys
if (process.env.CLOUDINARY_API_KEY) {
  // Only show a prefix for security reasons
  const apiKeyPrefix = process.env.CLOUDINARY_API_KEY.substring(0, 4) + '...';
  console.log('API Key prefix:', apiKeyPrefix);
}

// Set up local storage directory
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

// Variable to track if Cloudinary is working
let cloudinaryEnabled = false;
let storage = localStorageConfig; // Now localStorageConfig is defined before use

// Validate required environment variables
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️ Missing required Cloudinary environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Cloudinary functionality will not be available - falling back to local storage');
  cloudinaryEnabled = false;
} else {
  // Configure Cloudinary
  try {
    console.log('Attempting to configure Cloudinary with:');
    console.log('- Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('- API key length:', process.env.CLOUDINARY_API_KEY.length);
    console.log('- API secret length:', process.env.CLOUDINARY_API_SECRET.length);
    
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    
    // Test Cloudinary connection
    const testCloudinaryConnection = async () => {
      try {
        const result = await cloudinary.v2.api.ping();
        console.log('✅ Cloudinary connection test successful:', result);
        cloudinaryEnabled = true;
        return true;
      } catch (error) {
        console.error('❌ Cloudinary connection test failed:', error);
        cloudinaryEnabled = false;
        console.warn('Falling back to local storage for file uploads');
        return false;
      }
    };
    
    // Create Cloudinary storage instance
    const cloudinaryStorage = new CloudinaryStorage({
      cloudinary: cloudinary.v2,
      params: {
        folder: 'products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
        transformation: [{ width: 1000, crop: "limit" }],
        resource_type: 'auto'
      }
    });
    
    // Execute the test
    testCloudinaryConnection();
  } catch (err) {
    console.error('❌ Cloudinary configuration error:', err);
    console.error('Configuration error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    cloudinaryEnabled = false;
    console.warn('Falling back to local storage for file uploads');
  }
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
    
    // Security: Validate file extension for files before upload
    if (imagePath && !imagePath.startsWith('http')) {
      const ext = path.extname(imagePath).toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      if (!validExtensions.includes(ext)) {
        console.error(`Security: Invalid file extension: ${ext}`);
        return reject(new Error('Invalid file type'));
      }
      
      // Optional: Add size check for local files
      try {
        const stats = fs.statSync(imagePath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        if (fileSizeInMB > 5) { // Limit file size to 5MB
          console.error(`Security: File too large: ${fileSizeInMB}MB`);
          return reject(new Error('File too large (max 5MB)'));
        }
      } catch (err) {
        console.warn('Could not check file size:', err.message);
      }
    }
    
    // Upload to Cloudinary with more detailed logging
    console.log(`Attempting to upload to Cloudinary: ${imagePath}`, uploadOptions);
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
        console.log('✅ Successfully uploaded to Cloudinary:', result.secure_url);
        
        // Log only a sample of the result to debug console
        const resultSummary = {
          public_id: result.public_id,
          secure_url: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height
        };
        console.log('Upload result details:', resultSummary);
        
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
  
  // Log the configuration being returned
  console.log('Providing Cloudinary configuration for frontend:', {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
  });
  
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    uploadPreset: 'ml_default' // You can create a custom upload preset in your Cloudinary dashboard
  };
};

// Function to get default Cloudinary URL for placeholder image
const getCloudinaryUrl = () => {
  if (!cloudinaryEnabled) {
    console.log('Returning local placeholder URL because Cloudinary is not enabled');
    return '/uploads/products/placeholder.jpg';
  }
  
  // Debug information to verify Cloudinary configuration
  console.log('===== CLOUDINARY DETAILED DEBUG =====');
  console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
  console.log('CLOUDINARY_API_KEY exists:', !!process.env.CLOUDINARY_API_KEY);
  console.log('CLOUDINARY_API_SECRET exists:', !!process.env.CLOUDINARY_API_SECRET);
  console.log('cloudinaryEnabled flag:', cloudinaryEnabled);
  
  // Test Cloudinary connectivity again
  try {
    cloudinary.api.ping().then(result => {
      console.log('✅ Cloudinary ping test successful:', result);
    }).catch(err => {
      console.error('❌ Cloudinary ping test failed:', err.message);
    });
  } catch (err) {
    console.error('❌ Error testing Cloudinary connection:', err.message);
  }
  
  const url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1650052235/tshirt-customizer/placeholder-tshirt-white.jpg`;
  console.log('Returning Cloudinary placeholder URL:', url);
  return url;
};

// Function to get image URL for a public ID
const getImageUrl = (publicId) => {
  if (!publicId) {
    console.log('No publicId provided, returning placeholder');
    return getCloudinaryUrl();
  }
  
  if (!cloudinaryEnabled) {
    // If it's already a local path, return as is
    if (publicId.startsWith('/uploads/')) {
      console.log('Using existing local path:', publicId);
      return publicId;
    }
    
    console.log('Converting to local path:', `/uploads/products/${publicId}`);
    return `/uploads/products/${publicId}`;
  }
  
  // Check if it's already a complete URL
  if (publicId.startsWith('http')) {
    console.log('Public ID is already a complete URL:', publicId);
    return publicId;
  }
  
  // Check if it needs the v1 path segment (Cloudinary standard format)
  const needsV1Prefix = !publicId.includes('/v1/') && !publicId.includes('/upload/');
  
  // For Cloudinary resources that need a full URL
  if (needsV1Prefix) {
    const url = cloudinary.url(publicId, {
      secure: true,
      transformation: [{ width: 800, height: 800, crop: 'limit' }]
    });
    console.log(`Generated Cloudinary URL for ${publicId}:`, url);
    return url;
  } else {
    // It's a partial Cloudinary URL, ensure it has the full domain
    if (!publicId.startsWith('https://res.cloudinary.com')) {
      const url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload${publicId.startsWith('/') ? publicId : '/' + publicId}`;
      console.log(`Completed partial Cloudinary URL for ${publicId}:`, url);
      return url;
    }
    
    console.log('Using existing complete Cloudinary URL:', publicId);
    return publicId;
  }
};

// Helper function to get file URL
const getFileUrl = (file) => {
  if (cloudinaryEnabled && file.path) {
    return file.path;
  }
  // For local storage, construct URL
  return `/uploads/products/${file.filename}`;
};

export {
  cloudinary,
  cloudinaryStorage as storage,
  uploadImage,
  getCloudinaryConfig,
  getCloudinaryUrl,
  getImageUrl,
  cloudinaryEnabled,
  getFileUrl,
  setupLocalStorage,
  testCloudinaryConnection
}; 