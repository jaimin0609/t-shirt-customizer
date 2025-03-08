import { User } from '../models/index.js';
import sequelize from '../config/database.js';

async function checkAdminUsers() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Query for all admin users
    const adminUsers = await User.findAll({
      where: {
        role: 'admin'
      },
      attributes: ['id', 'username', 'email', 'name', 'status', 'createdAt', 'updatedAt'],
      raw: true
    });
    
    // Display results
    console.log('\n===== ADMIN USERS IN DATABASE =====');
    if (adminUsers.length === 0) {
      console.log('No admin users found in the database!');
    } else {
      console.log(`Found ${adminUsers.length} admin users:`);
      adminUsers.forEach((user, index) => {
        console.log(`\n[Admin User ${index + 1}]`);
        console.log(`ID: ${user.id}`);
        console.log(`Username: ${user.username}`);
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.name}`);
        console.log(`Status: ${user.status}`);
        console.log(`Created: ${user.createdAt}`);
        console.log(`Last Updated: ${user.updatedAt}`);
      });
    }
    
    // Query for all users (to check total count)
    const totalUsers = await User.count();
    console.log(`\nTotal users in database: ${totalUsers}`);
    
  } catch (error) {
    console.error('Error checking admin users:', error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Run the function
checkAdminUsers(); 