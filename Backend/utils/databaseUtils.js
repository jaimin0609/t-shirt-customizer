/**
 * Database Utilities
 * Common helpers for database operations and migrations
 */

import { Sequelize } from 'sequelize';
import 'dotenv/config';
import { getEnvironmentConfig } from '../config/deployment.js';

/**
 * Get database connection configuration
 * @param {boolean} forLogging - Whether to enable detailed SQL logging
 * @returns {Object} Database connection parameters
 */
export const getDatabaseConfig = (forLogging = false) => {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = getEnvironmentConfig();
  
  // For production with DATABASE_URL
  if (process.env.DATABASE_URL) {
    // Validate the URL format before using it
    try {
      new URL(process.env.DATABASE_URL);
    } catch (error) {
      throw new Error(`Invalid DATABASE_URL format: ${error.message}`);
    }
    
    return {
      url: process.env.DATABASE_URL,
      options: {
        dialect: 'postgres',
        dialectOptions: {
          ssl: envConfig.database.ssl
        },
        logging: forLogging ? console.log : false
      },
      type: 'postgres'
    };
  }
  
  // For development/test with individual parameters
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbDialect = process.env.DB_DIALECT || 'mysql';
  const dbPort = process.env.DB_PORT || (dbDialect === 'mysql' ? 3306 : 5432);
  
  // Validate required parameters
  const missingVars = [];
  if (!dbName) missingVars.push('DB_NAME');
  if (!dbUser) missingVars.push('DB_USER');
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required database environment variables: ${missingVars.join(', ')}. Please set these in .env file or provide DATABASE_URL`);
  }
  
  return {
    database: dbName,
    username: dbUser,
    password: dbPassword,
    options: {
      host: dbHost,
      dialect: dbDialect,
      port: dbPort,
      logging: forLogging ? console.log : false,
      dialectOptions: envConfig.database.ssl ? { ssl: envConfig.database.ssl } : {}
    },
    type: dbDialect
  };
};

/**
 * Create a Sequelize instance with proper configuration
 * @param {boolean} forLogging - Whether to enable SQL logging
 * @returns {Sequelize} Configured Sequelize instance
 */
export const createSequelizeInstance = (forLogging = false) => {
  try {
    const config = getDatabaseConfig(forLogging);
    
    if (config.url) {
      return new Sequelize(config.url, config.options);
    }
    
    return new Sequelize(
      config.database,
      config.username,
      config.password,
      config.options
    );
  } catch (error) {
    console.error('Database configuration error:', error.message);
    
    // Provide more helpful error message in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Please check your .env file and ensure all required database variables are set');
      console.error('Required variables: DB_NAME, DB_USER (or DATABASE_URL)');
    }
    
    throw error;
  }
};

/**
 * Test database connection
 * @param {Sequelize} sequelize - Sequelize instance to test
 * @returns {Promise<boolean>} True if connection successful
 */
export const testConnection = async (sequelize) => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

/**
 * Safely run a database query with proper error handling
 * @param {Sequelize} sequelize - Sequelize instance
 * @param {string} query - SQL query to execute
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Query results
 */
export const safeQuery = async (sequelize, query, options = {}) => {
  try {
    return await sequelize.query(query, options);
  } catch (error) {
    console.error('Query error:', error.message);
    console.error('Query:', query);
    throw error;
  }
};

/**
 * Check if a table exists in the database
 * @param {Sequelize} sequelize - Sequelize instance
 * @param {string} tableName - Table name to check
 * @returns {Promise<boolean>} True if table exists
 */
export const tableExists = async (sequelize, tableName) => {
  const dialect = sequelize.getDialect();
  let query;
  
  if (dialect === 'postgres') {
    query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName.toLowerCase()}'
      )
    `;
    const [result] = await sequelize.query(query);
    return result[0].exists;
  } else {
    query = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = '${tableName}'
    `;
    const [result] = await sequelize.query(query);
    return result[0].count > 0;
  }
};

/**
 * Check if a column exists in a table
 * @param {Sequelize} sequelize - Sequelize instance
 * @param {string} tableName - Table name
 * @param {string} columnName - Column name to check
 * @returns {Promise<boolean>} True if column exists
 */
export const columnExists = async (sequelize, tableName, columnName) => {
  const dialect = sequelize.getDialect();
  let query;
  
  if (dialect === 'postgres') {
    query = `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName.toLowerCase()}'
        AND column_name = '${columnName.toLowerCase()}'
      )
    `;
    const [result] = await sequelize.query(query);
    return result[0].exists;
  } else {
    query = `
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
      AND table_name = '${tableName}'
      AND column_name = '${columnName}'
    `;
    const [result] = await sequelize.query(query);
    return result[0].count > 0;
  }
};

export default {
  getDatabaseConfig,
  createSequelizeInstance,
  testConnection,
  safeQuery,
  tableExists,
  columnExists
};