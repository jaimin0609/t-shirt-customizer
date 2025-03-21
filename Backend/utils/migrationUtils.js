/**
 * Migration Utilities
 * Helpers for database migrations and schema management
 */

import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSequelizeInstance, testConnection } from './databaseUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Use case-insensitive search for PostgreSQL
    query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name ILIKE '${tableName}'
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
        AND table_name ILIKE '${tableName}'
        AND column_name ILIKE '${columnName}'
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

/**
 * Check if SequelizeMeta table exists and create it if not
 * @param {Sequelize} sequelize - Sequelize instance
 * @returns {Promise<void>}
 */
export const ensureMetaTable = async (sequelize) => {
  try {
    const exists = await tableExists(sequelize, 'SequelizeMeta');
    
    if (!exists) {
      console.log('Creating SequelizeMeta table...');
      try {
        await sequelize.query(`
          CREATE TABLE "SequelizeMeta" (
            name VARCHAR(255) NOT NULL PRIMARY KEY
          )
        `);
        console.log('SequelizeMeta table created');
      } catch (error) {
        // Check if error is due to table already existing
        if (error.parent && error.parent.code === '42P07') { // PostgreSQL error code for "relation already exists"
          console.log('SequelizeMeta table already exists (caught in error handler)');
        } else {
          throw error;
        }
      }
    } else {
      console.log('SequelizeMeta table already exists');
    }
  } catch (error) {
    console.error('Error ensuring meta table:', error);
    throw error;
  }
};

/**
 * Record a migration as complete in SequelizeMeta
 * @param {Sequelize} sequelize - Sequelize instance
 * @param {string} migrationName - Migration name to record
 * @returns {Promise<void>}
 */
export const recordMigration = async (sequelize, migrationName) => {
  try {
    await ensureMetaTable(sequelize);
    
    const dialect = sequelize.getDialect();
    const query = dialect === 'postgres' 
      ? `INSERT INTO "SequelizeMeta" (name) VALUES ('${migrationName}') ON CONFLICT (name) DO NOTHING`
      : `INSERT IGNORE INTO SequelizeMeta (name) VALUES ('${migrationName}')`;
      
    await sequelize.query(query);
    console.log(`Migration ${migrationName} recorded as complete`);
  } catch (error) {
    console.error(`Error recording migration ${migrationName}:`, error);
    throw error;
  }
};

/**
 * Check if a migration has been run
 * @param {Sequelize} sequelize - Sequelize instance
 * @param {string} migrationName - Migration name to check
 * @returns {Promise<boolean>} True if migration has been run
 */
export const isMigrationComplete = async (sequelize, migrationName) => {
  try {
    const exists = await tableExists(sequelize, 'SequelizeMeta');
    
    if (!exists) {
      return false;
    }
    
    const [results] = await sequelize.query(`
      SELECT name FROM "SequelizeMeta" WHERE name = '${migrationName}'
    `);
    
    return results.length > 0;
  } catch (error) {
    console.error(`Error checking migration ${migrationName}:`, error);
    return false;
  }
};

/**
 * Add a column to a table if it doesn't exist
 * @param {Sequelize} sequelize - Sequelize instance
 * @param {string} tableName - Table name
 * @param {string} columnName - Column name
 * @param {Object} columnDefinition - Column type and options
 * @returns {Promise<boolean>} True if column was added
 */
export const addColumnIfNotExists = async (sequelize, tableName, columnName, columnDefinition) => {
  try {
    const hasColumn = await columnExists(sequelize, tableName, columnName);
    
    if (hasColumn) {
      console.log(`Column ${columnName} already exists in ${tableName}`);
      return false;
    }
    
    console.log(`Adding column ${columnName} to ${tableName}`);
    
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn(tableName, columnName, columnDefinition);
    
    console.log(`Column ${columnName} added successfully`);
    return true;
  } catch (error) {
    console.error(`Error adding column ${columnName} to ${tableName}:`, error);
    throw error;
  }
};

/**
 * Run a safe migration that adds columns if they don't exist
 * @param {Object} migrationConfig - Migration configuration
 * @param {string} migrationConfig.name - Migration name for tracking
 * @param {Array} migrationConfig.columns - Columns to add
 * @returns {Promise<void>}
 */
export const runColumnMigration = async (migrationConfig) => {
  const { name, columns } = migrationConfig;
  
  if (!name || !columns || !Array.isArray(columns)) {
    throw new Error('Invalid migration configuration');
  }
  
  const sequelize = createSequelizeInstance(true);
  
  try {
    console.log(`Starting migration: ${name}`);
    
    // Test connection
    await testConnection(sequelize);
    
    // Check if migration has already been run
    const isComplete = await isMigrationComplete(sequelize, name);
    
    if (isComplete) {
      console.log(`Migration ${name} has already been run, skipping`);
      return;
    }
    
    // Run each column addition
    for (const column of columns) {
      const { table, column: columnName, type, options = {} } = column;
      
      if (!table || !columnName || !type) {
        console.warn('Skipping invalid column configuration:', column);
        continue;
      }
      
      // Convert string type to Sequelize DataType
      let dataType;
      switch (type.toLowerCase()) {
        case 'string':
          dataType = DataTypes.STRING(options.length || 255);
          break;
        case 'text':
          dataType = DataTypes.TEXT;
          break;
        case 'integer':
          dataType = DataTypes.INTEGER;
          break;
        case 'boolean':
          dataType = DataTypes.BOOLEAN;
          break;
        case 'date':
          dataType = DataTypes.DATE;
          break;
        case 'float':
          dataType = DataTypes.FLOAT;
          break;
        case 'decimal':
          dataType = DataTypes.DECIMAL;
          break;
        case 'json':
          dataType = DataTypes.JSON;
          break;
        default:
          dataType = DataTypes.STRING;
      }
      
      await addColumnIfNotExists(sequelize, table, columnName, {
        type: dataType,
        ...options
      });
    }
    
    // Record migration as complete
    await recordMigration(sequelize, name);
    
    console.log(`Migration ${name} completed successfully`);
  } catch (error) {
    console.error(`Migration ${name} failed:`, error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

/**
 * Generate a migration configuration based on model-database differences
 * @param {Object} model - Sequelize model
 * @param {string} tableName - Database table name
 * @returns {Promise<Object>} Migration configuration
 */
export const generateMigrationFromModel = async (model, tableName) => {
  const sequelize = createSequelizeInstance();
  const columns = [];
  
  try {
    // Get model attributes
    const attributes = model.rawAttributes;
    
    // Check each attribute against database
    for (const [attrName, attribute] of Object.entries(attributes)) {
      // Skip primary key and timestamps
      if (attrName === 'id' || attrName === 'createdAt' || attrName === 'updatedAt') {
        continue;
      }
      
      const exists = await columnExists(sequelize, tableName, attrName);
      
      if (!exists) {
        columns.push({
          table: tableName,
          column: attrName,
          type: attribute.type.constructor.name.replace('DataTypes.', '').toLowerCase(),
          options: {
            allowNull: attribute.allowNull !== false,
            defaultValue: attribute.defaultValue,
            unique: attribute.unique || false
          }
        });
      }
    }
    
    return {
      name: `auto-migration-${tableName}-${Date.now()}`,
      columns
    };
  } catch (error) {
    console.error('Error generating migration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

export default {
  ensureMetaTable,
  recordMigration,
  isMigrationComplete,
  addColumnIfNotExists,
  runColumnMigration,
  generateMigrationFromModel,
  tableExists,
  columnExists
}; 