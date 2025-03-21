/**
 * Script to remove all admin users and enable first-time setup
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import sequelize from '../config/database.js';
import { User } from '../models/index.js';

async function resetAdminUsers() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connection established.');

        // Count admins before delete
        const adminCount = await User.count({ where: { role: 'admin' } });
        console.log(`Found ${adminCount} admin users.`);

        if (adminCount === 0) {
            console.log('No admin users found. First-time setup is already enabled.');
            return;
        }

        // Delete all admin users
        await User.destroy({ where: { role: 'admin' } });
        console.log('All admin users have been removed successfully.');
        console.log('First-time setup is now enabled.');
        console.log('\nYou can now access the admin panel to complete the setup process.');
    } catch (error) {
        console.error('Error resetting admin users:', error);
    } finally {
        await sequelize.close();
    }
}

resetAdminUsers(); 