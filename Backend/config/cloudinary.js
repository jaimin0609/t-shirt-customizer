import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo', // Use demo during development 
  api_key: process.env.CLOUDINARY_API_KEY || '', 
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
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

// Function to upload image directly without multer
const uploadImage = async (imagePath) => {
  try {
    // If the path is already a cloudinary URL, just return it
    if (imagePath && imagePath.includes('cloudinary.com')) {
      return imagePath;
    }
    
    // Handle image upload
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'tshirt-customizer',
      transformation: [{ width: 800, height: 800, crop: 'limit' }]
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    // Return the original path if upload fails
    return imagePath;
  }
};

// Get image URL for a public ID
const getImageUrl = (publicId) => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  });
};

export { cloudinary, storage, uploadImage, getImageUrl }; 