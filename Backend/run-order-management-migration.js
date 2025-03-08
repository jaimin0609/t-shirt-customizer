const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: console.log
  }
);

// Configure Umzug
const umzugInstance = new Umzug({
  migrations: {
    glob: 'migrations/add-order-management-fields.cjs',
    resolve: ({ name, path, context }) => {
      const migration = require(path);
      return {
        name,
        up: async () => migration.up(context, Sequelize),
        down: async () => migration.down(context, Sequelize)
      };
    }
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console
});

// Run the migration
(async () => {
  try {
    console.log('Starting order management migration...');
    await umzugInstance.up();
    console.log('Order management migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})(); 