import { User } from '../models/index.js';
import 'dotenv/config';

async function checkAdmin() {
  try {
    console.log('Checking for admin users in the database...');
    
    // Find admin users
    const adminUsers = await User.findAll({ 
      where: { role: 'admin' },
      attributes: ['id', 'username', 'email', 'role', 'status']
    });
    
    if (adminUsers.length === 0) {
      console.log('No admin users found in the database.');
    } else {
      console.log(`Found ${adminUsers.length} admin users:`);
      adminUsers.forEach(admin => {
        console.log(admin.toJSON());
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking admin users:', error);
    process.exit(1);
  }
}

checkAdmin(); 