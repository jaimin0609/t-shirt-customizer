const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
require('dotenv').config();

// Initialize Sequelize with database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'tshirt_customizer',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: console.log
  }
);

// Configure Umzug to use Sequelize for migrations
const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, './migrations'),
    pattern: /add-customization-column\.cjs$/,
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
  console.log('Starting customization column migration...');
  
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    const migrations = await umzug.up();
    console.log('Customization column migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration Error:', error);
    process.exit(1);
  }
}

runMigration(); 