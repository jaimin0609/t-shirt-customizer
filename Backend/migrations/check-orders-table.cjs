const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

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
    logging: false
  }
);

async function checkOrdersTable() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    const [results] = await sequelize.query('DESCRIBE Orders');
    console.log('Orders Table Structure:');
    console.table(results);
    
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

checkOrdersTable(); 