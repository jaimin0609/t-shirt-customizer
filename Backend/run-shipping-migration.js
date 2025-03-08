import { up } from './migrations/20240401_add_default_shipping_to_customers.js';
import sequelize from './config/database.js';

async function runMigration() {
  try {
    console.log('Running migration to add isDefaultShippingAddress field to Customers table...');
    await up();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration(); 