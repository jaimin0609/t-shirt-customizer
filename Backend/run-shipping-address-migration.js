import { up } from './migrations/add_default_shipping_address.js';
import sequelize from './config/database.js';

async function runMigration() {
    try {
        console.log('Running migration to add isDefaultShippingAddress column...');
        await up();
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        // Close the database connection
        await sequelize.close();
    }
}

// Run the migration
runMigration(); 