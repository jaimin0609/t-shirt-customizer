/**
 * Sharp Service - Centralized Sharp Image Processing Initialization
 * 
 * This service provides a standardized interface for Sharp image processing
 * with proper error handling and fallback mechanisms.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { formatError } from '../utils/errorHandler.js';

// Get current file directory 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEFAULT_JPEG_QUALITY = 80;
const DEFAULT_RESIZE_WIDTH = 800;
const THUMBNAIL_SIZE = 200;

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Initialize Sharp with proper error handling
 */
let sharp;
let sharpAvailable = false;
let sharpError = null;

// Try to load Sharp
try {
  // Dynamic import to handle potential ESM/CJS issues
  const sharpModule = await import('sharp');
  sharp = sharpModule.default;
  
  // Verify Sharp is working by performing a simple operation
  await sharp(Buffer.from([0, 0, 0])).metadata();
  
  sharpAvailable = true;
  console.log('✅ Sharp initialized successfully:', sharp.versions);
} catch (error) {
  sharpError = error;
  console.warn('⚠️ Sharp initialization failed:', error.message);
  console.log('Using fallback image handling mechanisms');
  
  // Create simple passthrough functions as fallback
  sharp = () => ({
    resize: () => sharp(),
    toFormat: () => sharp(),
    jpeg: () => sharp(),
    png: () => sharp(),
    toBuffer: async () => Buffer.from([]),
    toFile: async (output, input) => {
      // Simple file copy as fallback
      if (input && typeof input === 'string') {
        fs.copyFileSync(input, output);
      } else if (input && Buffer.isBuffer(input)) {
        fs.writeFileSync(output, input);
      }
      return { width: 0, height: 0 };
    }
  });
}

/**
 * Resize and optimize an image
 * 
 * @param {string|Buffer} input - Input file path or buffer
 * @param {Object} options - Processing options
 * @param {number} options.width - Output width in pixels
 * @param {string} options.format - Output format (jpeg, png, webp)
 * @param {number} options.quality - Output quality (1-100)
 * @returns {Promise<Buffer>} - Processed image as buffer
 */
export const processImage = async (input, options = {}) => {
  try {
    const {
      width = DEFAULT_RESIZE_WIDTH,
      format = 'jpeg',
      quality = DEFAULT_JPEG_QUALITY
    } = options;
    
    // If Sharp is not available, return original or copy file
    if (!sharpAvailable) {
      console.log('⚠️ Using fallback image processing for', typeof input === 'string' ? input : 'buffer');
      
      // If input is a path, return file buffer
      if (typeof input === 'string' && fs.existsSync(input)) {
        return fs.readFileSync(input);
      }
      
      // If input is already a buffer, return it
      if (Buffer.isBuffer(input)) {
        return input;
      }
      
      throw new Error('Invalid input for fallback image processing');
    }
    
    // Process with Sharp
    let pipeline = sharp(input)
      .resize(width, null, {
        fit: 'contain',
        withoutEnlargement: true
      });
    
    // Set format and quality
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality });
        break;
      case 'png':
        pipeline = pipeline.png({ quality: Math.floor(quality / 10) });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      default:
        pipeline = pipeline.jpeg({ quality });
    }
    
    // Return processed image buffer
    return await pipeline.toBuffer();
  } catch (error) {
    console.error('❌ Image processing error:', error.message);
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

/**
 * Save a processed image to file
 * 
 * @param {string|Buffer} input - Input file path or buffer
 * @param {string} outputPath - Output file path
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Metadata about processed image
 */
export const saveProcessedImage = async (input, outputPath, options = {}) => {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // If Sharp is not available, use simple file operations
    if (!sharpAvailable) {
      console.log('⚠️ Using fallback image saving for', typeof input === 'string' ? input : 'buffer');
      
      if (typeof input === 'string' && fs.existsSync(input)) {
        fs.copyFileSync(input, outputPath);
        const stats = fs.statSync(outputPath);
        return { path: outputPath, size: stats.size };
      }
      
      if (Buffer.isBuffer(input)) {
        fs.writeFileSync(outputPath, input);
        return { path: outputPath, size: input.length };
      }
      
      throw new Error('Invalid input for fallback image saving');
    }
    
    // Process and save with Sharp
    const {
      width = DEFAULT_RESIZE_WIDTH,
      format = path.extname(outputPath).slice(1) || 'jpeg',
      quality = DEFAULT_JPEG_QUALITY
    } = options;
    
    const metadata = await sharp(input)
      .resize(width, null, {
        fit: 'contain',
        withoutEnlargement: true
      })
      .toFormat(format, { quality })
      .toFile(outputPath);
    
    return {
      path: outputPath,
      ...metadata
    };
  } catch (error) {
    console.error('❌ Image saving error:', error.message);
    
    // Attempt fallback if Sharp fails
    if (typeof input === 'string' && fs.existsSync(input)) {
      fs.copyFileSync(input, outputPath);
      console.log('✅ Fallback copy successful');
      return { path: outputPath };
    }
    
    throw new Error(`Failed to save image: ${error.message}`);
  }
};

/**
 * Generate a thumbnail from an image
 * 
 * @param {string|Buffer} input - Input file path or buffer
 * @param {string} outputPath - Output file path
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Metadata about processed thumbnail
 */
export const createThumbnail = async (input, outputPath, options = {}) => {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // If Sharp is not available, use simple file operations
    if (!sharpAvailable) {
      console.log('⚠️ Using fallback thumbnail creation for', typeof input === 'string' ? input : 'buffer');
      
      if (typeof input === 'string' && fs.existsSync(input)) {
        fs.copyFileSync(input, outputPath);
        const stats = fs.statSync(outputPath);
        return { path: outputPath, size: stats.size };
      }
      
      if (Buffer.isBuffer(input)) {
        fs.writeFileSync(outputPath, input);
        return { path: outputPath, size: input.length };
      }
      
      throw new Error('Invalid input for fallback thumbnail creation');
    }
    
    // Process and save thumbnail with Sharp
    const {
      width = THUMBNAIL_SIZE,
      height = THUMBNAIL_SIZE,
      format = path.extname(outputPath).slice(1) || 'jpeg',
      quality = 70,
      fit = 'cover'
    } = options;
    
    const metadata = await sharp(input)
      .resize(width, height, {
        fit,
        position: 'center'
      })
      .toFormat(format, { quality })
      .toFile(outputPath);
    
    return {
      path: outputPath,
      ...metadata
    };
  } catch (error) {
    console.error('❌ Thumbnail creation error:', error.message);
    
    // Attempt fallback if Sharp fails
    if (typeof input === 'string' && fs.existsSync(input)) {
      fs.copyFileSync(input, outputPath);
      console.log('✅ Fallback thumbnail copy successful');
      return { path: outputPath };
    }
    
    throw new Error(`Failed to create thumbnail: ${error.message}`);
  }
};

/**
 * Check if Sharp is available and working
 * 
 * @returns {Object} - Status information for Sharp
 */
export const getSharpStatus = () => {
  return {
    available: sharpAvailable,
    version: sharpAvailable ? sharp.versions : null,
    error: sharpError ? formatError(sharpError, 'initializing Sharp') : null
  };
};

// Default export for the entire service
export default {
  isAvailable: sharpAvailable,
  processImage,
  saveProcessedImage,
  createThumbnail,
  getSharpStatus
}; 