/**
 * Storage Service - Unified storage provider interface
 * 
 * This service standardizes file storage operations across local and cloud storage (Cloudinary),
 * providing a consistent API for uploading, retrieving, and deleting files.
 */

import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { formatError } from '../utils/errorHandler.js';

// Get current file directory and load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const DEFAULT_UPLOAD_DIR = path.join(__dirname, '../uploads');
const DEFAULT_ASSET_URL_PREFIX = '/uploads/';

// Cloudinary configuration status
let cloudinaryConfigured = false;
let cloudinaryError = null;

// Configure Cloudinary if credentials are available
try {
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET) {
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    
    // Verify configuration
    const testResult = cloudinary.api.ping();
    cloudinaryConfigured = true;
    console.log('✅ Cloudinary configured successfully');
  } else {
    console.log('⚠️ Cloudinary credentials not found in environment variables');
    cloudinaryError = new Error('Missing Cloudinary credentials');
  }
} catch (error) {
  console.error('❌ Cloudinary configuration error:', error);
  cloudinaryError = error;
}

/**
 * Ensure local upload directory exists
 */
const ensureUploadDirExists = () => {
  if (!fs.existsSync(DEFAULT_UPLOAD_DIR)) {
    fs.mkdirSync(DEFAULT_UPLOAD_DIR, { recursive: true });
    console.log(`Created upload directory: ${DEFAULT_UPLOAD_DIR}`);
  }
};

// Initialize local storage
ensureUploadDirExists();

/**
 * Check if Cloudinary is available
 * 
 * @returns {boolean} - Whether Cloudinary is available
 */
export const isCloudinaryAvailable = () => cloudinaryConfigured;

/**
 * Get Cloudinary configuration status
 * 
 * @returns {Object} - Status information for Cloudinary
 */
export const getCloudinaryStatus = () => {
  return {
    available: cloudinaryConfigured,
    error: cloudinaryError ? formatError(cloudinaryError, 'CloudinaryConfig') : null
  };
};

/**
 * Upload an image to Cloudinary
 * 
 * @param {string} filePath - Path to the image file
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result with URLs and metadata
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    if (!cloudinaryConfigured) {
      throw new Error('Cloudinary is not configured');
    }
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const { 
      folder = 'custom-tshirts',
      transformation = { width: 800, crop: 'limit' },
      publicId = path.basename(filePath, path.extname(filePath)),
      resourceType = 'image',
      tags = []
    } = options;
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          transformation,
          resource_type: resourceType,
          tags
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      fs.createReadStream(filePath).pipe(uploadStream);
    });
    
    // Format response
    return {
      success: true,
      provider: 'cloudinary',
      publicId: result.public_id,
      url: result.secure_url,
      thumbnailUrl: cloudinary.url(result.public_id, {
        secure: true,
        width: 200,
        height: 200,
        crop: 'fill'
      }),
      format: result.format,
      width: result.width,
      height: result.height,
      size: result.bytes,
      originalPath: filePath
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Upload a file to local storage
 * 
 * @param {string} filePath - Path to the file
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result with URLs and metadata
 */
export const saveToLocalStorage = async (filePath, options = {}) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const { 
      outputDir = DEFAULT_UPLOAD_DIR,
      filename = path.basename(filePath),
      subFolder = ''
    } = options;
    
    // Create subdirectory if needed
    const targetDir = subFolder 
      ? path.join(outputDir, subFolder) 
      : outputDir;
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy file to destination
    const targetPath = path.join(targetDir, filename);
    fs.copyFileSync(filePath, targetPath);
    
    // Get file stats
    const stats = fs.statSync(targetPath);
    
    // Determine URL path
    const relativePath = path.relative(DEFAULT_UPLOAD_DIR, targetPath);
    const urlPath = `${DEFAULT_ASSET_URL_PREFIX}${relativePath.replace(/\\/g, '/')}`;
    
    return {
      success: true,
      provider: 'local',
      filename,
      path: targetPath,
      url: urlPath,
      size: stats.size,
      originalPath: filePath
    };
  } catch (error) {
    console.error('❌ Local storage error:', error);
    throw new Error(`Local file save failed: ${error.message}`);
  }
};

/**
 * Upload an image to the appropriate storage provider
 * 
 * @param {string} filePath - Path to the image file
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
export const uploadImage = async (filePath, options = {}) => {
  try {
    // Determine if we should use Cloudinary
    const useCloudinary = (isProduction || options.forceCloudinary) && cloudinaryConfigured;
    
    if (useCloudinary) {
      return await uploadToCloudinary(filePath, options);
    } else {
      return await saveToLocalStorage(filePath, options);
    }
  } catch (error) {
    console.error('❌ Storage upload error:', error);
    
    // Attempt fallback storage if primary fails
    if (error.message.includes('Cloudinary') && !options.noFallback) {
      console.log('⚠️ Falling back to local storage after Cloudinary failure');
      return await saveToLocalStorage(filePath, options);
    }
    
    throw new Error(`File upload failed: ${error.message}`);
  }
};

/**
 * Delete an image from Cloudinary
 * 
 * @param {string} imageUrl - Cloudinary image URL or public ID
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!cloudinaryConfigured) {
      throw new Error('Cloudinary is not configured');
    }
    
    // Extract public ID from URL if needed
    let publicId = imageUrl;
    
    if (imageUrl.includes('cloudinary.com')) {
      // Parse URL to get public ID
      const urlParts = imageUrl.split('/');
      const filenamePart = urlParts[urlParts.length - 1];
      const filenameWithoutExt = filenamePart.split('.')[0];
      
      // Find upload part index
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && uploadIndex < urlParts.length - 2) {
        // Extract path after upload, excluding version number and file extension
        publicId = urlParts.slice(uploadIndex + 2, urlParts.length - 1).join('/') + '/' + filenameWithoutExt;
      } else {
        throw new Error('Invalid Cloudinary URL format');
      }
    }
    
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    return {
      success: result.result === 'ok',
      provider: 'cloudinary',
      publicId,
      result: result.result
    };
  } catch (error) {
    console.error('❌ Cloudinary deletion error:', error);
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};

/**
 * Delete a file from local storage
 * 
 * @param {string} filePath - Local file path or URL
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromLocalStorage = async (filePath) => {
  try {
    // Handle URL format
    let localPath = filePath;
    
    if (filePath.startsWith(DEFAULT_ASSET_URL_PREFIX)) {
      localPath = path.join(
        DEFAULT_UPLOAD_DIR, 
        filePath.replace(DEFAULT_ASSET_URL_PREFIX, '')
      );
    }
    
    // Check if file exists
    if (!fs.existsSync(localPath)) {
      throw new Error(`File not found: ${localPath}`);
    }
    
    // Delete file
    fs.unlinkSync(localPath);
    
    return {
      success: true,
      provider: 'local',
      path: localPath
    };
  } catch (error) {
    console.error('❌ Local file deletion error:', error);
    throw new Error(`Local file deletion failed: ${error.message}`);
  }
};

/**
 * Delete an image from the appropriate storage provider
 * 
 * @param {string} imageUrl - Image URL or path
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) {
      throw new Error('Image URL or path is required');
    }
    
    // Determine storage provider based on URL
    if (imageUrl.includes('cloudinary.com')) {
      return await deleteFromCloudinary(imageUrl);
    } else {
      return await deleteFromLocalStorage(imageUrl);
    }
  } catch (error) {
    console.error('❌ Image deletion error:', error);
    throw new Error(`Image deletion failed: ${error.message}`);
  }
};

/**
 * Get a transformed URL for a Cloudinary image
 * 
 * @param {string} imageUrl - Original Cloudinary image URL
 * @param {Object} transformation - Transformation options
 * @returns {string} - Transformed image URL
 */
export const getTransformedUrl = (imageUrl, transformation = {}) => {
  try {
    if (!cloudinaryConfigured || !imageUrl.includes('cloudinary.com')) {
      return imageUrl;
    }
    
    // Extract public ID from URL
    let publicId = '';
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex !== -1 && uploadIndex < urlParts.length - 2) {
      // Skip version number if present (v1, v2, etc.)
      const startIndex = urlParts[uploadIndex + 1].match(/^v\d+$/) 
        ? uploadIndex + 2 
        : uploadIndex + 1;
      
      // Extract path excluding file extension
      const filenamePart = urlParts[urlParts.length - 1];
      const filenameWithoutExt = filenamePart.split('.')[0];
      
      publicId = [...urlParts.slice(startIndex, urlParts.length - 1), filenameWithoutExt].join('/');
    } else {
      return imageUrl; // Can't parse URL, return original
    }
    
    // Default transformation options
    const options = {
      secure: true,
      ...transformation
    };
    
    // Generate transformed URL
    return cloudinary.url(publicId, options);
  } catch (error) {
    console.error('❌ URL transformation error:', error);
    return imageUrl; // Return original URL on error
  }
};

/**
 * Get a list of files in the local uploads directory
 * 
 * @param {string} subFolder - Optional subfolder name
 * @returns {Promise<Array>} - List of files with metadata
 */
export const listLocalFiles = async (subFolder = '') => {
  try {
    const targetDir = subFolder 
      ? path.join(DEFAULT_UPLOAD_DIR, subFolder) 
      : DEFAULT_UPLOAD_DIR;
    
    if (!fs.existsSync(targetDir)) {
      return [];
    }
    
    // Read directory contents
    const files = await fs.promises.readdir(targetDir);
    
    // Get file metadata
    const filePromises = files.map(async (filename) => {
      const filePath = path.join(targetDir, filename);
      const stats = await fs.promises.stat(filePath);
      
      if (stats.isDirectory()) {
        return {
          name: filename,
          path: filePath,
          isDirectory: true,
          size: stats.size,
          createdAt: stats.birthtime
        };
      }
      
      const relativePath = path.relative(DEFAULT_UPLOAD_DIR, filePath);
      
      return {
        name: filename,
        path: filePath,
        url: `${DEFAULT_ASSET_URL_PREFIX}${relativePath.replace(/\\/g, '/')}`,
        isDirectory: false,
        size: stats.size,
        extension: path.extname(filename).toLowerCase(),
        createdAt: stats.birthtime
      };
    });
    
    return await Promise.all(filePromises);
  } catch (error) {
    console.error('❌ File listing error:', error);
    throw new Error(`Failed to list files: ${error.message}`);
  }
};

// Export service as default
export default {
  isAvailable: cloudinaryConfigured,
  uploadImage,
  deleteImage,
  getTransformedUrl,
  listLocalFiles,
  getCloudinaryStatus
}; 