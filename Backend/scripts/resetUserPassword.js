import { User } from '../models/index.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
import 'dotenv/config';

// Email of the user whose password you want to reset
const userEmail = 'jamin0609@gmail.com';
// New password to set
const newPassword = 'Password123!';

async function resetPassword() {
  try {
    console.log(`Attempting to reset password for user: ${userEmail}`);
    
    // Find the user
    const user = await User.findOne({ where: { email: userEmail } });
    
    if (!user) {
      console.error(`User with email ${userEmail} not found`);
      process.exit(1);
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password directly in the database to bypass hooks
    await User.update(
      { password: hashedPassword },
      { where: { id: user.id }, individualHooks: false }
    );
    
    console.log(`Password reset successful for user: ${userEmail}`);
    console.log(`New password is: ${newPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('Password reset failed:', error);
    process.exit(1);
  }
}

resetPassword(); 