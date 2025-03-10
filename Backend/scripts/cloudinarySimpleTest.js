// Simplest possible Cloudinary test
import { v2 as cloudinary } from 'cloudinary';

// Directly configure with hardcoded values
cloudinary.config({
  cloud_name: 'dopvs93sl',
  api_key: '718734228757155',
  api_secret: 'yXiUCqjRnc7zBk1kqlJHpc8e8qA'
});

console.log('Cloudinary configuration:');
console.log('Cloud name:', cloudinary.config().cloud_name);
console.log('API key:', cloudinary.config().api_key);
console.log('API secret (hidden):', cloudinary.config().api_secret ? '***' : 'not set');

async function testCloudinary() {
  try {
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
    const account = await cloudinary.api.usage();
    console.log('Success! Account usage info retrieved:', account);
  } catch (error) {
    console.error('Cloudinary test failed:', error);
  }
}

testCloudinary(); 