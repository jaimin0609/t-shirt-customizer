import sequelize from '../config/database.js';
import { up } from '../migrations/update-user-role.js';

async function runMigration() {
  try {
    console.log('Running migration to update User role ENUM...');
    await up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 