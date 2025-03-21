/**
 * Script to create a public coupon for the promotion banner
 * Run with: node create-public-coupon.js
 * 
 * This script requires the following environment variables:
 * - ADMIN_EMAIL - The admin email to use for login
 * - ADMIN_PASSWORD - The admin password to use for login
 * - API_URL - The API URL to use for requests (e.g., http://localhost:5000)
 */

import fetch from 'node-fetch';
import 'dotenv/config';

// Validate required environment variables
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error('Error: Missing required environment variables (ADMIN_EMAIL, ADMIN_PASSWORD)');
    console.error('Please set these variables in your .env file or provide them as command-line arguments.');
    process.exit(1);
}

// Get API URL from environment or use default
const API_URL = process.env.API_URL || 'http://localhost:5000';

async function createPublicCoupon() {
    try {
        // Use environment variables for admin credentials
        const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed with status ${loginResponse.status}`);
        }

        const { token } = await loginResponse.json();
        console.log('✅ Logged in successfully, got admin token');

        // Create the public coupon
        const couponResponse = await fetch(`${API_URL}/api/coupons/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                description: 'Special Offer for all customers',
                discountType: 'percentage',
                discountValue: 15,  // 15% discount
                // Start date is now
                startDate: new Date(),
                // End date is 7 days from now
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                usageLimit: 100,    // Limit to 100 uses
                minimumPurchase: 25, // Minimum purchase of $25
                isPublic: true,     // Make it public so it shows in banner
                bannerText: '🎉 Special Offer! Use code {code} for 15% off orders over $25! 🎉',
                bannerColor: '#ff6b6b', // Attractive red color
                codePrefix: 'SPECIAL'
            })
        });

        if (!couponResponse.ok) {
            throw new Error(`Coupon creation failed with status ${couponResponse.status}`);
        }

        const couponData = await couponResponse.json();
        console.log('✅ Created public coupon successfully:');
        console.log(JSON.stringify(couponData, null, 2));
        
        // Verify the coupon is in the public list
        const publicCouponsResponse = await fetch(`${API_URL}/api/coupons/public`);
        
        if (!publicCouponsResponse.ok) {
            throw new Error(`Failed to fetch public coupons with status ${publicCouponsResponse.status}`);
        }
        
        const publicCoupons = await publicCouponsResponse.json();
        console.log(`✅ Found ${publicCoupons.length} public coupons in the system`);
        console.log(JSON.stringify(publicCoupons, null, 2));
        
    } catch (error) {
        console.error('❌ Error creating public coupon:', error.message);
        process.exit(1);
    }
}

createPublicCoupon(); 