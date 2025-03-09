import { Sequelize, DataTypes } from 'sequelize';
import 'dotenv/config';

async function runMigration() {
  let sequelize;
  
  // Connect to database using environment variables
  if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
    console.log('Using PostgreSQL with DATABASE_URL');
  } else {
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT || 'mysql'
      }
    );
    console.log('Using local database configuration');
  }

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Get the QueryInterface
    const queryInterface = sequelize.getQueryInterface();

    // Check if the column already exists
    console.log('Checking if images column exists in Products table...');
    let tableExists = false;
    
    try {
      const tableInfo = await queryInterface.describeTable('Products');
      tableExists = true;
      
      if (tableInfo.images) {
        console.log('The images column already exists.');
        return;
      }
    } catch (error) {
      if (error.name === 'SequelizeDatabaseError') {
        console.log('Products table does not exist yet.');
        return;
      }
      throw error;
    }

    if (tableExists) {
      // Add the column
      console.log('Adding images column to Products table...');
      await queryInterface.addColumn('Products', 'images', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
      });
      console.log('Migration completed successfully.');
    }
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMigration(); 