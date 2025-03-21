/**
 * Reset Admin Credentials Script
 * 
 * This script resets the admin user's password to a value specified in environment variables.
 * Run it when having login issues with the admin account.
 * 
 * Required environment variables:
 * - ADMIN_DEFAULT_PASSWORD: The password to set for the admin (or defaults to a secure randomly generated password)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
import { sequelize, User } from '../models/index.js';
import crypto from 'crypto';
import 'dotenv/config';

// Get admin password from environment variable or generate a secure random one
const getAdminPassword = () => {
    if (process.env.ADMIN_DEFAULT_PASSWORD) {
        return process.env.ADMIN_DEFAULT_PASSWORD;
    }
    
    // Generate a secure random password if not provided
    const randomPassword = crypto.randomBytes(16).toString('hex').slice(0, 12) +
        '!' + Math.floor(Math.random() * 10) + 
        String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Add a capital letter
    
    console.log('\n⚠️ No ADMIN_DEFAULT_PASSWORD environment variable found.');
    console.log('🔑 Generated a secure random password instead.');
    
    return randomPassword;
};

async function resetAdminCredentials() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connection established.');

        // Get admin password
        const adminPassword = getAdminPassword();

        // Find admin user
        console.log('Looking for admin user...');
        const adminUser = await User.findOne({ where: { role: 'admin' } });

        if (!adminUser) {
            console.log('No admin user found. Creating new admin user...');
            
            // Create admin user with credentials
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await User.create({
                username: 'admin',
                name: 'Administrator',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin',
                status: 'active'
            });
            
            console.log('Admin user created successfully with:');
            console.log('- Email: admin@example.com');
            console.log(`- Password: ${adminPassword}`);
        } else {
            console.log(`Found admin user: ${adminUser.email}`);
            
            // Reset password
            console.log('Resetting admin password...');
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await adminUser.update({ 
                password: hashedPassword,
                status: 'active' // Ensure account is active
            });
            
            console.log(`Admin password reset successfully to: ${adminPassword}`);
            console.log('Admin email:', adminUser.email);
        }

        await sequelize.close();
        console.log('Database connection closed.');
        
        console.log('\nYou can now log in with these credentials:');
        console.log('-------------------------------------');
        console.log(`Email: ${adminUser ? adminUser.email : 'admin@example.com'}`);
        console.log(`Password: ${adminPassword}`);
        console.log('-------------------------------------');
        console.log('\n⚠️ IMPORTANT: Store this password in a secure location!');
        
    } catch (error) {
        console.error('Error resetting admin credentials:', error);
        process.exit(1);
    }
}

// Run the script
resetAdminCredentials(); 