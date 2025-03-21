/**
 * Image Service - Unified image processing and storage management
 * 
 * This service standardizes image processing operations across local and cloud storage,
 * providing a consistent API for uploading, manipulating, and retrieving images.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import sharpService from './sharp.service.js';
import cloudinaryService from './storage.service.js';
import { formatError } from '../utils/errorHandler.js';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const DEFAULT_UPLOAD_DIR = path.join(__dirname, '../uploads');
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const PREFERRED_OUTPUT_FORMAT = 'webp';
const DEFAULT_IMAGE_QUALITY = 80;

// Ensure upload directory exists
if (!fs.existsSync(DEFAULT_UPLOAD_DIR)) {
  fs.mkdirSync(DEFAULT_UPLOAD_DIR, { recursive: true });
}

/**
 * Validate if the file is an image
 * 
 * @param {Object} file - Express file upload object
 * @returns {boolean} - True if file is a valid image
 */
export const isValidImage = (file) => {
  if (!file) return false;
  return VALID_IMAGE_TYPES.includes(file.mimetype);
};

/**
 * Generate a unique filename for an uploaded image
 * 
 * @param {string} originalFilename - Original filename
 * @param {string} prefix - Optional prefix for the filename
 * @returns {string} - Generated unique filename
 */
export const generateUniqueFilename = (originalFilename, prefix = '') => {
  const extension = path.extname(originalFilename).toLowerCase() || '.jpg';
  const timestamp = Date.now();
  const randomId = uuidv4().substring(0, 8);
  return `${prefix ? prefix + '-' : ''}${timestamp}-${randomId}${extension}`;
};

/**
 * Process and save an image locally
 * 
 * @param {Object} file - Express file upload object
 * @param {Object} options - Processing options
 * @param {string} options.outputDir - Directory to save to (defaults to uploads)
 * @param {string} options.filename - Custom filename (generated if not provided)
 * @param {number} options.width - Width to resize to
 * @param {string} options.format - Output format (jpeg, png, webp)
 * @param {number} options.quality - Output quality (1-100)
 * @param {boolean} options.createThumbnail - Whether to create a thumbnail
 * @returns {Promise<Object>} - Metadata about saved image
 */
export const processAndSaveLocal = async (file, options = {}) => {
  try {
    // Check if file is valid
    if (!file || !file.path) {
      throw new Error('Invalid file object provided');
    }
    
    // Prepare options with defaults
    const {
      outputDir = DEFAULT_UPLOAD_DIR,
      filename = generateUniqueFilename(file.originalname || 'image.jpg'),
      width = 800,
      format = PREFERRED_OUTPUT_FORMAT,
      quality = DEFAULT_IMAGE_QUALITY,
      createThumbnail = false
    } = options;
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Set output paths
    const outputPath = path.join(outputDir, filename);
    const outputFormat = format || path.extname(filename).slice(1) || 'jpg';
    const thumbnailPath = createThumbnail 
      ? path.join(outputDir, `thumb-${filename}`)
      : null;
    
    // Process and save main image
    const imageResult = await sharpService.saveProcessedImage(
      file.path, 
      outputPath,
      { width, format: outputFormat, quality }
    );
    
    // Process and save thumbnail if requested
    let thumbnailResult = null;
    if (createThumbnail) {
      thumbnailResult = await sharpService.createThumbnail(
        file.path,
        thumbnailPath,
        { format: outputFormat, quality }
      );
    }
    
    // Clean up temp file if it exists
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    // Return metadata
    return {
      success: true,
      originalName: file.originalname,
      filename: path.basename(outputPath),
      path: outputPath,
      relativePath: path.relative(DEFAULT_UPLOAD_DIR, outputPath),
      url: `/uploads/${path.relative(DEFAULT_UPLOAD_DIR, outputPath)}`,
      size: imageResult.size || 0,
      width: imageResult.width || 0,
      height: imageResult.height || 0,
      format: outputFormat,
      thumbnail: thumbnailResult ? {
        path: thumbnailResult.path,
        url: `/uploads/${path.relative(DEFAULT_UPLOAD_DIR, thumbnailResult.path)}`,
        width: thumbnailResult.width || 0,
        height: thumbnailResult.height || 0
      } : null
    };
  } catch (error) {
    console.error('❌ Local image processing error:', error);
    
    // Attempt fallback - simple file copy if Sharp fails
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        const outputDir = options.outputDir || DEFAULT_UPLOAD_DIR;
        const filename = options.filename || generateUniqueFilename(file.originalname || 'image.jpg');
        const outputPath = path.join(outputDir, filename);
        
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Copy file directly
        fs.copyFileSync(file.path, outputPath);
        const stats = fs.statSync(outputPath);
        
        return {
          success: true,
          originalName: file.originalname,
          filename: path.basename(outputPath),
          path: outputPath,
          relativePath: path.relative(DEFAULT_UPLOAD_DIR, outputPath),
          url: `/uploads/${path.relative(DEFAULT_UPLOAD_DIR, outputPath)}`,
          size: stats.size,
          format: path.extname(outputPath).slice(1) || 'unknown',
          note: 'Fallback method used - image was not processed'
        };
      } catch (fallbackError) {
        console.error('❌ Fallback image saving also failed:', fallbackError);
      }
    }
    
    throw new Error(`Failed to process and save image: ${error.message}`);
  }
};

/**
 * Upload an image to Cloudinary
 * 
 * @param {Object|string} file - Express file upload object or local file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export const uploadToCloudinary = async (file, options = {}) => {
  try {
    // Check if cloudinary service is available
    if (!cloudinaryService || !cloudinaryService.isAvailable) {
      throw new Error('Cloudinary service is not available');
    }
    
    let filePath;
    
    // Handle different input types
    if (typeof file === 'string') {
      filePath = file;
    } else if (file && file.path) {
      filePath = file.path;
    } else {
      throw new Error('Invalid file input for Cloudinary upload');
    }
    
    // Determine folder path
    const { 
      folder = 'custom-tshirts',
      transformation = { 
        width: options.width || 800,
        crop: 'limit'
      },
      publicId = options.filename || path.basename(filePath, path.extname(filePath))
    } = options;
    
    // Upload to Cloudinary
    const result = await cloudinaryService.uploadImage(filePath, {
      folder,
      transformation,
      publicId
    });
    
    // Add local path reference
    if (typeof file !== 'string' && file.originalname) {
      result.originalName = file.originalname;
    }
    
    // Create and add thumbnail URL if it doesn't exist
    if (!result.thumbnailUrl && result.url) {
      result.thumbnailUrl = cloudinaryService.getTransformedUrl(result.url, {
        width: 200,
        height: 200,
        crop: 'fill'
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    
    // Attempt local fallback if Cloudinary fails
    if (isProduction) {
      console.log('⚠️ Cloudinary upload failed in production - this is a critical error');
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    } else {
      console.log('⚠️ Cloudinary upload failed, using local storage fallback');
      
      // Process locally instead
      const localResult = await processAndSaveLocal(file, options);
      
      // Mark as fallback
      localResult.provider = 'local-fallback';
      localResult.originalCloudinaryError = formatError(error, 'CloudinaryUpload');
      
      return localResult;
    }
  }
};

/**
 * Process and store an image using the appropriate storage method
 * 
 * @param {Object} file - Express file upload object
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Metadata about processed and stored image
 */
export const processAndStoreImage = async (file, options = {}) => {
  try {
    // Validate image
    if (!isValidImage(file)) {
      throw new Error(`Invalid image type: ${file ? file.mimetype : 'unknown'}`);
    }
    
    // Determine storage method based on environment and options
    const useCloudinary = isProduction || options.forceCloudinary;
    
    if (useCloudinary && cloudinaryService && cloudinaryService.isAvailable) {
      // Store in Cloudinary
      return await uploadToCloudinary(file, options);
    } else {
      // Store locally
      return await processAndSaveLocal(file, options);
    }
  } catch (error) {
    console.error('❌ Image processing and storage error:', error);
    throw new Error(`Failed to process and store image: ${error.message}`);
  }
};

/**
 * Delete an image from storage
 * 
 * @param {string} imageUrl - Image URL or path to delete
 * @returns {Promise<Object>} - Result of deletion operation
 */
export const deleteImage = async (imageUrl) => {
  try {
    // Determine if it's a Cloudinary or local URL
    if (imageUrl.includes('cloudinary.com')) {
      // Delete from Cloudinary
      if (!cloudinaryService || !cloudinaryService.isAvailable) {
        throw new Error('Cloudinary service is not available');
      }
      
      return await cloudinaryService.deleteImage(imageUrl);
    } else {
      // Delete local file
      const localPath = imageUrl.startsWith('/uploads/')
        ? path.join(DEFAULT_UPLOAD_DIR, imageUrl.replace('/uploads/', ''))
        : imageUrl;
      
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        
        // Also check for and delete thumbnail
        const dir = path.dirname(localPath);
        const filename = path.basename(localPath);
        const thumbnailPath = path.join(dir, `thumb-${filename}`);
        
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
        
        return { success: true, deleted: localPath };
      } else {
        throw new Error(`Local image not found: ${localPath}`);
      }
    }
  } catch (error) {
    console.error('❌ Image deletion error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Get transformed URL for an existing image
 * 
 * @param {string} imageUrl - Original image URL
 * @param {Object} transformation - Transformation options
 * @returns {string} - Transformed image URL
 */
export const getTransformedImageUrl = (imageUrl, transformation = {}) => {
  // Handle Cloudinary URLs
  if (imageUrl.includes('cloudinary.com') && cloudinaryService && cloudinaryService.isAvailable) {
    return cloudinaryService.getTransformedUrl(imageUrl, transformation);
  }
  
  // For local images, we cannot transform on-the-fly, so return original
  return imageUrl;
};

// Export service as default
export default {
  processAndSaveLocal,
  uploadToCloudinary,
  processAndStoreImage,
  deleteImage,
  isValidImage,
  generateUniqueFilename,
  getTransformedImageUrl
}; 