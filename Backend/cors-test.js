// CORS Test Script
// This script simulates whether origins would be allowed or blocked by your CORS configuration

// Import required modules if running as a Node.js script
// const path = require('path');
// const dotenv = require('dotenv');
// dotenv.config();

// Mimic the CORS logic from server.js
function testCORS() {
  console.log('CORS Configuration Test Tool');
  console.log('===========================');
  
  // List of allowed origins - keep this synced with server.js
  const allowedOrigins = [
    'http://localhost:5173',  // Default Vite dev server
    'http://localhost:5002',  // Backend URL
    'http://localhost:3000',  // Common React dev server
    'http://localhost:8080',  // Another common dev port
    'http://127.0.0.1:5173',  // Also allow access via IP
    'http://127.0.0.1:5002',
    'http://127.0.0.1:3000',
    // Vercel domains
    'https://uniqverse-five.vercel.app',
    'https://uniqverse-7a3cxn0ti-jaimin0609s-projects.vercel.app',
    'https://*.vercel.app'  // Allow all Vercel subdomains
  ];
  
  // Add FRONTEND_URL from environment if it exists
  if (typeof process !== 'undefined' && process.env && process.env.FRONTEND_URL) {
    console.log(`Frontend URL from environment: ${process.env.FRONTEND_URL}`);
    allowedOrigins.push(process.env.FRONTEND_URL);
    
    // Extract domain for wildcard support
    try {
      const url = new URL(process.env.FRONTEND_URL);
      const domain = url.hostname;
      // If not localhost, also allow all subdomains
      if (!domain.includes('localhost')) {
        allowedOrigins.push(`https://*.${domain}`);
      }
    } catch (e) {
      console.error('Invalid FRONTEND_URL format:', e);
    }
  } else {
    console.log('FRONTEND_URL not found in environment variables');
  }
  
  console.log('\nConfigured allowed origins:');
  allowedOrigins.forEach(origin => console.log(`- ${origin}`));
  
  // Test origins that should be allowed
  const originsToTest = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://uniqverse-five.vercel.app',
    'https://uniqverse-7a3cxn0ti-jaimin0609s-projects.vercel.app',
    'https://test-subdomain.vercel.app',
    'https://example.com' // Should be blocked unless in your allowedOrigins
  ];
  
  console.log('\nTesting origins:');
  originsToTest.forEach(origin => {
    const isProd = true; // Simulate production environment
    let allowed = false;
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      allowed = true;
    } else {
      // Check for wildcard domains
      allowed = allowedOrigins.some(allowed => {
        if (allowed.includes('*')) {
          const wildcardDomain = allowed.replace('*', '').replace('https://*.', '');
          return origin.includes(wildcardDomain);
        }
        return false;
      });
    }
    
    console.log(`Origin: ${origin} - ${allowed ? 'ALLOWED ✅' : 'BLOCKED ❌'}`);
  });
  
  console.log('\nInstructions:');
  console.log('1. If a domain you need is showing as BLOCKED, add it to the allowedOrigins in server.js');
  console.log('2. Make sure to redeploy your backend after making changes');
  console.log('3. Set FRONTEND_URL in your environment variables on Render');
}

// Run the test
testCORS();

// If you want to run this in a browser console to test, copy the testCORS function
// and call it directly in the browser console of your frontend app 