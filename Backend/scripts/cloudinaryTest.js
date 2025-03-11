import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Print current Cloudinary settings
console.log('Current Cloudinary settings:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY);
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test Cloudinary authentication
async function testAuth() {
  try {
    console.log('\nTesting Cloudinary authentication...');
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary authentication successful!');
    console.log(result);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary authentication failed:', error);
    return false;
  }
}

// Run the test
testAuth(); 