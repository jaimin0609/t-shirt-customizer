import { Sequelize } from 'sequelize';
import { up } from './migrations/20240301_add_is_customizable_to_products.js';
import config from './config/config.js';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: console.log
  }
);

async function runMigration() {
  try {
    console.log('Running migration to add isCustomizable field to Products table...');
    await up(sequelize.getQueryInterface(), Sequelize);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration(); 