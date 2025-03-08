/**
 * Simple Coupon Creation Script
 * Run with: node create-simple-coupon.js
 * 
 * This script creates a public coupon by making API calls to the backend.
 * It will log in using admin credentials and create a coupon that will be
 * visible to all customers in the promotion banner.
 */

import http from 'http';
import https from 'https';

// CONFIGURATION - UPDATE THESE VALUES
const API_HOST = 'localhost';
const API_PORT = 5000;
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

// Log with colors for better readability
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`)
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    log.info(`Making ${options.method} request to ${options.path}`);
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          log.error(`Request failed with status: ${res.statusCode}`);
          try {
            reject(JSON.parse(responseData));
          } catch (e) {
            reject(new Error(`Request failed with status: ${res.statusCode}`));
          }
        }
      });
    });
    
    req.on('error', (error) => {
      log.error(`Request error: ${error.message}`);
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function createPublicCoupon() {
  log.info('=== Starting Public Coupon Creation ===');
  
  try {
    // Step 1: Login to get authentication token
    log.info('Logging in as admin...');
    const loginData = await makeRequest({
      host: API_HOST,
      port: API_PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (!loginData.token) {
      throw new Error('Login failed: No token received');
    }
    
    log.success('Successfully logged in!');
    const token = loginData.token;
    
    // Step 2: Generate a random coupon code
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const couponCode = `PROMO${randomPart}`;
    
    // Step 3: Create a public coupon
    log.info('Creating public coupon...');
    const couponData = await makeRequest({
      host: API_HOST,
      port: API_PORT,
      path: '/api/coupons/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      code: couponCode,
      description: 'Special Promotional Offer',
      discountType: 'percentage',
      discountValue: 15,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      isActive: true,
      usageLimit: 100,
      minimumPurchase: 0,
      isPublic: true,
      bannerText: `🎉 Special Offer! Use code ${couponCode} for 15% off your entire order!`,
      bannerColor: '#e91e63'
    });
    
    log.success('Public coupon created successfully!');
    log.info('Coupon Details:');
    log.info(`- Code: ${couponData.code}`);
    log.info(`- Discount: ${couponData.discountValue}% off`);
    log.info(`- Valid until: ${new Date(couponData.endDate).toLocaleDateString()}`);
    
    // Step 4: Verify the coupon is in the public list
    log.info('Verifying coupon is public...');
    const publicCoupons = await makeRequest({
      host: API_HOST,
      port: API_PORT,
      path: '/api/coupons/public',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (Array.isArray(publicCoupons) && publicCoupons.length > 0) {
      const foundCoupon = publicCoupons.find(c => c.code === couponData.code);
      
      if (foundCoupon) {
        log.success(`✅ Coupon verified as public! It will appear in the promotion banner.`);
      } else {
        log.warn('⚠️ Coupon created but not found in public list. Check admin settings.');
      }
      
      log.info(`Total public coupons: ${publicCoupons.length}`);
    } else {
      log.warn('⚠️ No public coupons found. Check admin settings.');
    }
    
    log.success('=== Coupon Creation Complete ===');
    log.info('The promotion banner should now display on the website.');
    log.info('If you don\'t see it, try refreshing your browser or clearing cache.');
    
  } catch (error) {
    log.error(`Failed to create coupon: ${error.message}`);
    if (error.errors) {
      error.errors.forEach(err => log.error(`- ${err.message}`));
    }
    log.info('Please check your admin credentials and API connection details.');
  }
}

// Run the function
createPublicCoupon(); 