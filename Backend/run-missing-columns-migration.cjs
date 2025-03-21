'use strict';

const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
require('dotenv').config();

// Get the database URL from environment variable or build from components
let dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URI;

// If no DATABASE_URL is provided, try to build one from individual components
if (!dbUrl) {
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbDialect = process.env.DB_DIALECT || 'mysql';
  const dbPort = process.env.DB_PORT || (dbDialect === 'mysql' ? 3306 : 5432);
  
  // Validate required environment variables
  if (!dbName || !dbUser) {
    console.error('ERROR: Missing required database environment variables (DB_NAME, DB_USER)');
    console.error('Please set these in .env file or provide DATABASE_URL');
    process.exit(1);
  }
  
  // Construct URL based on dialect
  if (dbDialect === 'postgres') {
    dbUrl = `postgres://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;
  } else {
    dbUrl = `mysql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;
  }
}

// Determine database type
const isPostgres = dbUrl.includes('postgres://') || dbUrl.includes('postgresql://');
console.log(`Using ${isPostgres ? 'PostgreSQL' : 'MySQL/MariaDB'} database`);

// Create Sequelize instance with proper SSL configuration for PostgreSQL
const sequelize = new Sequelize(dbUrl, {
  logging: console.log,
  dialectOptions: isPostgres ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

// Configure Umzug to use Sequelize for migrations
const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, './migrations'),
    pattern: /add-missing-columns\.cjs$/,
    params: [
      sequelize.getQueryInterface(),
      sequelize
    ]
  },
  storage: new SequelizeStorage({ sequelize }),
  logger: console
});

// Run the migration
async function runMigration() {
  console.log('Starting comprehensive migration for missing columns...');
  
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    const migrations = await umzug.up();
    console.log('Comprehensive migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration Error:', error);
    process.exit(1);
  }
}

runMigration(); 