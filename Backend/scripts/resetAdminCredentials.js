/**
 * Reset Admin Credentials Script
 * 
 * This script resets the admin user's password to a known value.
 * Run it when having login issues with the admin account.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
import { sequelize, User } from '../models/index.js';

async function resetAdminCredentials() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connection established.');

        // Find admin user
        console.log('Looking for admin user...');
        const adminUser = await User.findOne({ where: { role: 'admin' } });

        if (!adminUser) {
            console.log('No admin user found. Creating new admin user...');
            
            // Create admin user with known credentials
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
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
            console.log('- Password: Admin123!');
        } else {
            console.log(`Found admin user: ${adminUser.email}`);
            
            // Reset password
            console.log('Resetting admin password...');
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            await adminUser.update({ 
                password: hashedPassword,
                status: 'active' // Ensure account is active
            });
            
            console.log('Admin password reset successfully to: Admin123!');
            console.log('Admin email:', adminUser.email);
        }

        await sequelize.close();
        console.log('Database connection closed.');
        
        console.log('\nYou can now log in with these credentials:');
        console.log('-------------------------------------');
        console.log('Email: admin@example.com (or your existing admin email)');
        console.log('Password: Admin123!');
        console.log('-------------------------------------');
        
    } catch (error) {
        console.error('Error resetting admin credentials:', error);
        process.exit(1);
    }
}

// Run the script
resetAdminCredentials(); 