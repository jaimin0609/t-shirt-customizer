'use strict';

/**
 * Script to run the safe migration for resetToken fields
 * This can be called from package.json scripts or directly during deployment
 */

const path = require('path');
const Sequelize = require('sequelize');
// Fix the Umzug import for CommonJS usage
const { Umzug } = require('umzug');

// Get the database URL from environment variable
const dbUrl = process.env.DATABASE_URL || 'postgres://localhost:5432/tshirtcustomizer';

// Create Sequelize instance using the database URL
let sequelize;
if (dbUrl.includes('postgres://') || dbUrl.includes('postgresql://')) {
  // This is a PostgreSQL database (production)
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Important for connecting to Render's PostgreSQL
      }
    }
  });
} else {
  // Assume SQLite for local development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, 'database.sqlite'),
    logging: console.log
  });
}

// Configure Umzug to run migrations
const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, 'migrations'),
    pattern: /\.cjs$/,
    params: [
      sequelize.getQueryInterface(),
      Sequelize
    ]
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize
  }
});

// Function to run the specific migration
async function runMigration() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    console.log('Running safe-add-reset-token-fields migration...');
    // Run the specific migration file
    await umzug.up({ to: 'safe-add-reset-token-fields.cjs' });
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 