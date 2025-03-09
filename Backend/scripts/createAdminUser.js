import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
import { User } from '../models/index.js';
import sequelize from '../config/database.js';

async function createAdminUser() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.');

        // Admin user details
        const adminUser = {
            username: 'admin',
            name: 'Administrator',
            email: 'admin@example.com',
            password: await bcrypt.hash('Admin123!', 10),
            role: 'admin',
            status: 'active'
        };

        // Check if admin user already exists
        const existingUser = await User.findOne({
            where: {
                email: adminUser.email
            }
        });

        if (existingUser) {
            console.log('Admin user already exists. Updating password...');
            await existingUser.update({
                password: adminUser.password,
                status: 'active'
            });
            console.log('Admin user password updated successfully.');
        } else {
            // Create admin user
            await User.create(adminUser);
            console.log('Admin user created successfully.');
        }

        console.log('=================================');
        console.log('Admin Login Details:');
        console.log('Email: admin@example.com');
        console.log('Password: Admin123!');
        console.log('=================================');

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await sequelize.close();
    }
}

createAdminUser(); 