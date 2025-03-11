// Test script to upload an image to Cloudinary
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Validate environment variables
const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Path to a test image (using a placeholder if available)
const testImagePath = path.join(__dirname, '..', 'public', 'placeholder.jpg');
const defaultImagePath = path.join(__dirname, '..', 'public', 'uploads', 'products', 'placeholder.jpg');

async function testCloudinaryUpload() {
  try {
    console.log('Testing Cloudinary credentials...');
    
    // First, test the connection
    try {
      const pingResult = await new Promise((resolve, reject) => {
        cloudinary.api.ping((error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
      console.log('✅ Cloudinary connection successful:', pingResult.status);
    } catch (error) {
      console.error('❌ Cloudinary connection failed:', error.message);
      console.error('Please check your Cloudinary credentials in the .env file');
      return;
    }
    
    // Check if test image exists
    let imagePath = testImagePath;
    if (!fs.existsSync(imagePath)) {
      console.log(`Test image not found at ${imagePath}`);
      
      // Try alternative path
      imagePath = defaultImagePath;
      if (!fs.existsSync(imagePath)) {
        console.error('❌ No test image found. Please provide a valid image path.');
        return;
      }
    }
    
    console.log(`Uploading test image from: ${imagePath}`);
    
    // Upload the image
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(imagePath, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }, {
        folder: 'tshirt-customizer/test',
        resource_type: 'image'
      });
    });
    
    console.log('✅ Image uploaded successfully!');
    console.log('Image URL:', uploadResult.secure_url);
    console.log('Public ID:', uploadResult.public_id);
    console.log('Format:', uploadResult.format);
    console.log('Size:', uploadResult.bytes, 'bytes');
    
    // List recent uploads
    console.log('\nChecking recent uploads...');
    const resources = await new Promise((resolve, reject) => {
      cloudinary.api.resources((error, result) => {
        if (error) reject(error);
        else resolve(result);
      }, {
        type: 'upload',
        prefix: 'tshirt-customizer/test',
        max_results: 5
      });
    });
    
    console.log(`Found ${resources.resources.length} recent uploads in the test folder:`);
    resources.resources.forEach(resource => {
      console.log(`- ${resource.public_id} (${resource.format}, ${resource.bytes} bytes)`);
    });
    
  } catch (error) {
    console.error('❌ Error during Cloudinary test:', error);
    if (error.error && error.error.message) {
      console.error('Error details:', error.error.message);
    }
  }
}

// Run the test
testCloudinaryUpload(); 