import { Sequelize } from 'sequelize';
import { up } from '../migrations/add_gender_ageGroup_to_products.js';
import 'dotenv/config';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: console.log
  }
);

async function runMigration() {
  try {
    console.log('Running migration to add gender and ageGroup fields to Products table...');
    await up(sequelize.getQueryInterface(), Sequelize);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

runMigration(); 