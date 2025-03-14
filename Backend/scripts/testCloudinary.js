import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('=== CLOUDINARY TEST SCRIPT ===');

// Debug Cloudinary configuration
console.log('Checking Cloudinary environment variables:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY exists:', !!process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET exists:', !!process.env.CLOUDINARY_API_SECRET);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Function to test Cloudinary connectivity
async function testConnection() {
  try {
    console.log('Testing Cloudinary connection...');
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection test successful:', result);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection test failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

// Function to list existing Cloudinary resources
async function listResources() {
  try {
    console.log('Listing Cloudinary resources...');
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'products',
      max_results: 10
    });
    
    console.log('Found resources:');
    if (result.resources && result.resources.length > 0) {
      result.resources.forEach(resource => {
        console.log(`- ${resource.public_id}: ${resource.secure_url}`);
      });
    } else {
      console.log('No resources found in the products folder');
    }
    
    return result.resources;
  } catch (error) {
    console.error('❌ Error listing Cloudinary resources:', error.message);
    return [];
  }
}

// Function to test URL generation
function testUrlGeneration(publicId) {
  try {
    console.log(`Testing URL generation for public ID: ${publicId}`);
    const url = cloudinary.url(publicId, {
      secure: true,
      transformation: [{ width: 500, crop: "limit" }]
    });
    console.log(`Generated URL: ${url}`);
    return url;
  } catch (error) {
    console.error(`❌ Error generating URL for ${publicId}:`, error.message);
    return null;
  }
}

// Function to upload a test image
async function uploadTestImage() {
  try {
    console.log('Uploading test image to Cloudinary...');
    const result = await cloudinary.uploader.upload(
      'https://picsum.photos/200',
      {
        folder: 'products',
        public_id: 'test-image-' + Date.now(),
        overwrite: true
      }
    );
    console.log('✅ Test image uploaded successfully:');
    console.log(`- Public ID: ${result.public_id}`);
    console.log(`- URL: ${result.secure_url}`);
    return result;
  } catch (error) {
    console.error('❌ Error uploading test image:', error.message);
    return null;
  }
}

// Main function
async function main() {
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('Aborting further tests due to connection failure');
    return;
  }
  
  // List existing resources
  const resources = await listResources();
  
  // Test URL generation with a sample ID
  if (resources && resources.length > 0) {
    const sampleResource = resources[0];
    testUrlGeneration(sampleResource.public_id);
  } else {
    console.log('No existing resources found to test URL generation');
  }
  
  // Upload a test image
  const uploadResult = await uploadTestImage();
  if (uploadResult) {
    testUrlGeneration(uploadResult.public_id);
  }
}

// Run the tests
main().then(() => {
  console.log('=== TEST COMPLETED ===');
}).catch(error => {
  console.error('Unhandled error in test script:', error);
}).finally(() => {
  // Exit the script
  process.exit(0);
}); 