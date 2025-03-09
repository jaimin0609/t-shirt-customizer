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
      process.exit(1);
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the admin's password directly in the database to bypass hooks
    await User.update(
      { password: hashedPassword },
      { 
        where: { id: admin.id },
        individualHooks: false 
      }
    );
    
    console.log(`Password reset successful for admin: ${adminEmail}`);
    console.log(`New password is: ${newPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('Password reset failed:', error);
    process.exit(1);
  }
}

resetAdminPassword(); 