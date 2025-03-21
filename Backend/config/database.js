import { Sequelize } from 'sequelize';
import 'dotenv/config';
import { createSequelizeInstance, testConnection } from '../utils/databaseUtils.js';

// Create a singleton instance of Sequelize
let sequelize;

/**
 * Get the database connection instance
 * @returns {Sequelize} The configured Sequelize instance
 */
const getConnection = () => {
  // If we already have a connection, return it (singleton pattern)
  if (sequelize) {
    return sequelize;
  }
  
  try {
    // Create a new connection with appropriate configuration
    sequelize = createSequelizeInstance();
    return sequelize;
  } catch (error) {
    console.error('Database configuration error:', error.message);
    throw error;
  }
};

// Create the connection
sequelize = getConnection();

// Test the connection
(async () => {
  await testConnection(sequelize);
})();

export default sequelize;
export { getConnection }; 