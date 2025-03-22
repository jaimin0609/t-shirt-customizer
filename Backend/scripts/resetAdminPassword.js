import { User } from '../models/index.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
import 'dotenv/config';

// Email of the admin user whose password you want to reset
const adminEmail = 'admin@example.com';
// New password to set
const newPassword = 'Admin123!';

async function resetAdminPassword() {
  try {
    console.log(`Attempting to reset password for admin: ${adminEmail}`);
    
    // Find the admin user
    const admin = await User.findOne({ 
      where: { 
        email: adminEmail,
        role: 'admin'
      } 
    });
    
    if (!admin) {
      console.error(`Admin with email ${adminEmail} not found`);
      // Check if an admin exists with any email
      const anyAdmin = await User.findOne({ where: { role: 'admin' } });
      
      if (anyAdmin) {
        console.log(`Found another admin user with email: ${anyAdmin.email}`);
        console.log(`Creating fresh admin user with known credentials...`);
        
        // Create a new admin with known credentials
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const newAdmin = await User.create({
          username: 'admin',
          name: 'Administrator',
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          status: 'active',
          tokenVersion: 0,
          permissions: JSON.stringify({ all: true })
        });
        
        console.log(`Created new admin user with ID: ${newAdmin.id}`);
        console.log(`New admin email: ${adminEmail}`);
        console.log(`New admin password: ${newPassword}`);
      } else {
        console.error(`No admin users found in the database!`);
        process.exit(1);
      }
    } else {
      // Log existing user details
      console.log(`Found admin user with ID: ${admin.id}`);
      console.log(`Current password hash: ${admin.password.substring(0, 10)}...`);
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      console.log(`New password hash: ${hashedPassword.substring(0, 10)}...`);
      
      // Update the admin's password directly in the database to bypass hooks
      await User.update(
        { 
          password: hashedPassword,
          tokenVersion: (admin.tokenVersion || 0) + 1 // Invalidate existing tokens 
        },
        { 
          where: { id: admin.id },
          individualHooks: false 
        }
      );
      
      // Verify the update was successful
      const updatedAdmin = await User.findByPk(admin.id);
      console.log(`Updated password hash verification: ${updatedAdmin.password.substring(0, 10)}...`);
      
      // Confirm the hashes are different
      const passwordsMatch = hashedPassword === updatedAdmin.password;
      console.log(`Password hashes match as expected: ${passwordsMatch}`);
      
      console.log(`Password reset successful for admin: ${adminEmail}`);
      console.log(`New password is: ${newPassword}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Password reset failed:', error);
    process.exit(1);
  }
}

resetAdminPassword(); 