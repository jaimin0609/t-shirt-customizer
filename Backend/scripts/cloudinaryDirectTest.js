// Test Cloudinary using raw HTTP requests
import https from 'https';
import crypto from 'crypto';
import querystring from 'querystring';

// Cloudinary credentials
const cloudName = 'dopvs93sl';
const apiKey = '718734228757155';
const apiSecret = 'yXiUCqjRnc7zBk1kqlJHpc8e8qA';

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