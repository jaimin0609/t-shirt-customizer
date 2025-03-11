// Simplest possible Cloudinary test
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Cloudinary configuration:');
console.log('Cloud name:', cloudinary.config().cloud_name);
console.log('API key:', cloudinary.config().api_key);
console.log('API secret (hidden):', cloudinary.config().api_secret ? '***' : 'not set');

function testCloudinary() {
  console.log('\nTesting Cloudinary connection...');
  
  // Generate a sample URL to test
  const url = cloudinary.url('sample', {
    width: 100,
    height: 100,
    crop: 'fill'
  });
  
  console.log('Generated URL:', url);
  
  // Try to get account info as a simple API test
  console.log('\nFetching account info...');
  cloudinary.api.usage((error, account) => {
    if (error) {
      console.error('Cloudinary test failed:', error);
      return;
    }
    console.log('Success! Account usage info retrieved:', account);
  });
}

testCloudinary(); 