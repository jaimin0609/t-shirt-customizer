#!/usr/bin/env node

/**
 * Image Processing Test Script
 * 
 * This script tests the new image processing architecture to ensure it works
 * correctly with both local and cloud storage. It performs a series of tests
 * to verify Sharp initialization, image processing, and storage operations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import dotenv from 'dotenv';
import sharpService from '../services/sharp.service.js';
import imageService from '../services/image.service.js';
import storageService from '../services/storage.service.js';

// Set up paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const testImagesDir = path.join(rootDir, 'tests/test-images');
const testOutputDir = path.join(rootDir, 'tests/test-output');

// Load environment variables
dotenv.config({ path: path.join(rootDir, '.env') });

// Ensure test directories exist
if (!fs.existsSync(testImagesDir)) {
  fs.mkdirSync(testImagesDir, { recursive: true });
}

if (!fs.existsSync(testOutputDir)) {
  fs.mkdirSync(testOutputDir, { recursive: true });
}

// Test sample images
const sampleImages = [
  {
    name: 'test-jpg.jpg',
    url: 'https://picsum.photos/800/600',
    type: 'image/jpeg'
  },
  {
    name: 'test-png.png',
    url: 'https://picsum.photos/800/600.png',
    type: 'image/png'
  },
  {
    name: 'test-webp.webp',
    url: 'https://picsum.photos/800/600.webp',
    type: 'image/webp'
  }
];

// Utility functions for logging
const log = {
  info: (message) => console.log(chalk.blue('ℹ ') + message),
  success: (message) => console.log(chalk.green('✓ ') + message),
  error: (message) => console.log(chalk.red('✗ ') + message),
  warning: (message) => console.log(chalk.yellow('⚠ ') + message),
  section: (title) => console.log('\n' + chalk.bgBlue.white(' ' + title + ' ') + '\n')
};

/**
 * Download test images if they don't exist
 */
async function downloadTestImages() {
  log.section('Downloading Test Images');
  
  for (const image of sampleImages) {
    const imagePath = path.join(testImagesDir, image.name);
    
    // Skip if image already exists
    if (fs.existsSync(imagePath)) {
      log.info(`${image.name} already exists, skipping download`);
      continue;
    }
    
    log.info(`Downloading ${image.name} from ${image.url}...`);
    
    try {
      const response = await fetch(image.url);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(imagePath, Buffer.from(buffer));
      
      log.success(`Downloaded ${image.name} (${Buffer.from(buffer).length} bytes)`);
    } catch (error) {
      log.error(`Failed to download ${image.name}: ${error.message}`);
    }
  }
}

/**
 * Test Sharp service initialization
 */
async function testSharpInitialization() {
  log.section('Testing Sharp Service Initialization');
  
  const status = sharpService.getSharpStatus();
  
  if (status.available) {
    log.success(`Sharp is available (Version: ${JSON.stringify(status.version)})`);
  } else {
    log.error(`Sharp is not available: ${status.error ? status.error.message : 'Unknown error'}`);
    log.info('The system will use fallback mechanisms for image processing');
  }
  
  return status.available;
}

/**
 * Test basic image processing with Sharp
 */
async function testImageProcessing() {
  log.section('Testing Basic Image Processing');
  
  const testResults = [];
  const formats = ['jpeg', 'png', 'webp'];
  const imagePath = path.join(testImagesDir, sampleImages[0].name);
  
  if (!fs.existsSync(imagePath)) {
    log.error(`Test image not found: ${imagePath}`);
    return false;
  }
  
  // Test processing image to different formats
  for (const format of formats) {
    const outputPath = path.join(testOutputDir, `processed-${format}.${format}`);
    
    try {
      log.info(`Processing to ${format} format...`);
      
      const result = await sharpService.saveProcessedImage(
        imagePath,
        outputPath,
        { format, quality: 80 }
      );
      
      log.success(`Processed to ${format}: ${result.width}x${result.height}, ${result.size} bytes`);
      testResults.push({
        format,
        success: true,
        width: result.width,
        height: result.height,
        size: result.size
      });
    } catch (error) {
      log.error(`Failed to process to ${format}: ${error.message}`);
      testResults.push({
        format,
        success: false,
        error: error.message
      });
    }
  }
  
  // Test thumbnail generation
  try {
    const thumbnailPath = path.join(testOutputDir, 'thumbnail.jpg');
    const result = await sharpService.createThumbnail(
      imagePath,
      thumbnailPath
    );
    
    log.success(`Generated thumbnail: ${result.width}x${result.height}, ${result.size} bytes`);
    testResults.push({
      operation: 'thumbnail',
      success: true,
      width: result.width,
      height: result.height,
      size: result.size
    });
  } catch (error) {
    log.error(`Failed to generate thumbnail: ${error.message}`);
    testResults.push({
      operation: 'thumbnail',
      success: false,
      error: error.message
    });
  }
  
  // Overall test result
  const allSucceeded = testResults.every(result => result.success);
  if (allSucceeded) {
    log.success('All image processing tests passed');
  } else {
    log.error('Some image processing tests failed');
  }
  
  return allSucceeded;
}

/**
 * Test image service operations
 */
async function testImageService() {
  log.section('Testing Image Service');
  
  // Create mock express file object
  const mockFile = {
    path: path.join(testImagesDir, sampleImages[0].name),
    originalname: sampleImages[0].name,
    mimetype: sampleImages[0].type
  };
  
  // Test local storage operations
  try {
    log.info('Testing local image processing and storage...');
    
    const localResult = await imageService.processAndSaveLocal(mockFile, {
      createThumbnail: true
    });
    
    log.success(`Stored locally: ${localResult.path}`);
    log.info(`  - URL: ${localResult.url}`);
    log.info(`  - Size: ${localResult.width}x${localResult.height}, ${localResult.size} bytes`);
    
    if (localResult.thumbnail) {
      log.success(`Thumbnail generated: ${localResult.thumbnail.url}`);
    }
  } catch (error) {
    log.error(`Local storage test failed: ${error.message}`);
  }
  
  // Test Cloudinary if configured
  const cloudinaryStatus = storageService.getCloudinaryStatus();
  if (cloudinaryStatus.available) {
    try {
      log.info('Testing Cloudinary upload...');
      
      const cloudinaryResult = await imageService.uploadToCloudinary(mockFile, {
        folder: 'test-uploads'
      });
      
      log.success(`Uploaded to Cloudinary: ${cloudinaryResult.url}`);
      log.info(`  - Public ID: ${cloudinaryResult.publicId}`);
      log.info(`  - Size: ${cloudinaryResult.width}x${cloudinaryResult.height}, ${cloudinaryResult.size} bytes`);
      log.info(`  - Thumbnail URL: ${cloudinaryResult.thumbnailUrl}`);
      
      // Test deletion
      log.info('Testing image deletion from Cloudinary...');
      const deleteResult = await imageService.deleteImage(cloudinaryResult.url);
      
      if (deleteResult.success) {
        log.success(`Successfully deleted from Cloudinary: ${deleteResult.publicId}`);
      } else {
        log.error(`Failed to delete from Cloudinary: ${JSON.stringify(deleteResult)}`);
      }
    } catch (error) {
      log.error(`Cloudinary test failed: ${error.message}`);
    }
  } else {
    log.warning('Cloudinary is not configured, skipping cloud storage tests');
    log.info(`Cloudinary error: ${cloudinaryStatus.error ? cloudinaryStatus.error.message : 'None'}`);
  }
}

/**
 * Test the unified storage operations
 */
async function testStorageOperations() {
  log.section('Testing Unified Storage Operations');
  
  // Test with both configurations
  for (const useCloud of [false, true]) {
    const testMode = useCloud ? 'with Cloudinary' : 'with local storage';
    log.info(`Testing ${testMode}...`);
    
    // Create mock file
    const mockFile = {
      path: path.join(testImagesDir, sampleImages[0].name),
      originalname: sampleImages[0].name,
      mimetype: sampleImages[0].type
    };
    
    try {
      // Process and store image
      const result = await imageService.processAndStoreImage(mockFile, {
        forceCloudinary: useCloud,
        createThumbnail: true,
        folder: 'test-uploads'
      });
      
      log.success(`Successfully stored image ${testMode}`);
      log.info(`  - Provider: ${result.provider || 'unknown'}`);
      log.info(`  - URL: ${result.url}`);
      
      // Test transformation
      if (result.url.includes('cloudinary')) {
        const transformedUrl = imageService.getTransformedImageUrl(result.url, {
          width: 400,
          height: 300,
          crop: 'fill'
        });
        
        log.success(`Generated transformed URL: ${transformedUrl}`);
      }
      
      // Delete the image
      try {
        const deleteResult = await imageService.deleteImage(result.url);
        log.success(`Successfully deleted image: ${deleteResult.success}`);
      } catch (error) {
        log.error(`Failed to delete image: ${error.message}`);
      }
    } catch (error) {
      log.error(`Storage test failed ${testMode}: ${error.message}`);
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  log.section('IMAGE PROCESSING TESTS');
  log.info(`Test environment: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    // Download test images if needed
    await downloadTestImages();
    
    // Test each component
    const sharpAvailable = await testSharpInitialization();
    await testImageProcessing();
    await testImageService();
    await testStorageOperations();
    
    // Final results
    log.section('TEST RESULTS');
    
    // Report Sharp status
    if (sharpAvailable) {
      log.success('Sharp is working correctly');
    } else {
      log.warning('Sharp is not available, fallback mechanisms were used');
    }
    
    // Report storage status
    const cloudinaryAvailable = storageService.isAvailable;
    if (cloudinaryAvailable) {
      log.success('Cloudinary is configured and working');
    } else {
      log.warning('Cloudinary is not available, local storage was used');
    }
    
    log.success('Image processing tests completed');
  } catch (error) {
    log.error(`Test failed with error: ${error.message}`);
    process.exit(1);
  }
}

// Run the tests
runTests(); 