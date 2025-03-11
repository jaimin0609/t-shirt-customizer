// Test Cloudinary using raw HTTP requests
import https from 'https';
import crypto from 'crypto';
import querystring from 'querystring';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Cloudinary credentials from environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Validate credentials
if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Missing Cloudinary credentials in environment variables:');
  if (!cloudName) console.error('- CLOUDINARY_CLOUD_NAME is missing');
  if (!apiKey) console.error('- CLOUDINARY_API_KEY is missing');
  if (!apiSecret) console.error('- CLOUDINARY_API_SECRET is missing');
  console.error('Please check your .env file and try again.');
  process.exit(1);
}

console.log('Testing Cloudinary credentials:');
console.log('Cloud name:', cloudName);
console.log('API key:', apiKey);
console.log('API secret (masked):', '*'.repeat(apiSecret.length));

// Function to generate signature
function generateSignature(params, apiSecret) {
  const sortedParams = {};
  Object.keys(params).sort().forEach(key => {
    sortedParams[key] = params[key];
  });
  
  const stringToSign = Object.keys(sortedParams)
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&');
  
  return crypto
    .createHmac('sha1', apiSecret)
    .update(stringToSign)
    .digest('hex');
}

// Function to make an authenticated Cloudinary API request
function makeCloudinaryRequest(path, params = {}) {
  return new Promise((resolve, reject) => {
    // Add timestamp
    params.timestamp = Math.floor(Date.now() / 1000);
    
    // Generate signature
    params.signature = generateSignature(params, apiSecret);
    
    // Add API key
    params.api_key = apiKey;
    
    // Prepare URL
    const queryParams = querystring.stringify(params);
    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${cloudName}/${path}?${queryParams}`,
      method: 'GET'
    };
    
    console.log('Making request to:', options.path);
    
    // Make request
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(result);
          } else {
            reject({ statusCode: res.statusCode, data: result });
          }
        } catch (error) {
          reject({ statusCode: res.statusCode, error, data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Test the Cloudinary API
async function testCloudinaryAPI() {
  try {
    console.log('\nTesting Cloudinary API...');
    
    // Try the ping endpoint
    console.log('\nPinging Cloudinary API...');
    const pingResult = await makeCloudinaryRequest('ping');
    console.log('Ping successful:', pingResult);
    
    // Get usage info
    console.log('\nGetting usage info...');
    const usageResult = await makeCloudinaryRequest('usage');
    console.log('Usage info:', usageResult);
    
    console.log('\nCloudinary API tests passed!');
  } catch (error) {
    console.error('Cloudinary API test failed:', error);
  }
}

// Run the test
testCloudinaryAPI(); 