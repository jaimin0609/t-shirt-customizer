// Plain script to check Cloudinary credentials
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Get credentials from .env file
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('Checking Cloudinary credentials...');
console.log('---------------------------------');
console.log(`Cloud Name: ${cloudName}`);
console.log(`API Key: ${apiKey ? apiKey : 'Not Set'}`);
console.log(`API Secret: ${apiSecret ? '*'.repeat(apiSecret.length) : 'Not Set'}`);
console.log('---------------------------------');

// Configure Cloudinary directly
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

// Try a simple upload to test the credentials
function testUpload() {
  // Create a simple SVG image to upload
  const svgContent = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
    </svg>
  `;
  
  // Write SVG to a temp file
  const tempFilePath = path.join(__dirname, 'temp-test.svg');
  fs.writeFileSync(tempFilePath, svgContent);
  
  console.log('Uploading test image to Cloudinary...');
  
  // Upload the file
  cloudinary.uploader.upload(tempFilePath, (error, uploadResult) => {
    if (error) {
      console.error('Error testing Cloudinary upload:', error);
      // Still clean up temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error('Error removing temp file:', e);
      }
      return;
    }
    
    console.log('Upload successful!');
    console.log('Secure URL:', uploadResult.secure_url);
    
    // Clean up temp file
    try {
      fs.unlinkSync(tempFilePath);
      console.log('Cloudinary credentials are working correctly!');
    } catch (e) {
      console.error('Error removing temp file:', e);
    }
  }, {
    folder: 'test',
    public_id: 'test-' + Date.now(),
    resource_type: 'image'
  });
}

testUpload(); 