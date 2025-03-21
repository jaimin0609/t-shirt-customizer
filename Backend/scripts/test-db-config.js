#!/usr/bin/env node

/**
 * Database Configuration Test Script
 * 
 * This script tests the standardized database configuration and migration utilities.
 * It performs the following checks:
 * 1. Database connection using the new configuration
 * 2. Basic database operations
 * 3. Migration utilities functionality
 * 
 * Usage:
 *   node scripts/test-db-config.js
 */

import 'dotenv/config';
import { Sequelize } from 'sequelize';
import { createSequelizeInstance, testConnection, columnExists, tableExists } from '../utils/databaseUtils.js';
import { ensureMetaTable, recordMigration, isMigrationComplete } from '../utils/migrationUtils.js';

// Test name for the migration
const TEST_MIGRATION_NAME = 'test-database-config-' + Date.now();

/**
 * Run a complete test of database configuration
 */
async function runTests() {
  console.log('🧪 Starting database configuration tests');

  let sequelize;
  try {
    // Test 1: Database Connection
    console.log('\n📋 Test 1: Database Connection');
    
    console.log('🔍 Creating Sequelize instance with standardized configuration...');
    sequelize = createSequelizeInstance(true);
    
    console.log('🔌 Testing connection...');
    const connected = await testConnection(sequelize);
    
    if (!connected) {
      throw new Error('Connection test failed');
    }
    
    console.log('✅ Database connection test passed!');
    
    // Test 2: Basic Database Operations
    console.log('\n📋 Test 2: Basic Database Operations');
    
    // Test table existence check
    console.log('🔍 Testing tableExists utility...');
    const usersExists = await tableExists(sequelize, 'Users');
    console.log(`🔹 Users table ${usersExists ? 'exists' : 'does not exist'}`);
    
    // Test column existence check (on a table we know exists)
    if (usersExists) {
      console.log('🔍 Testing columnExists utility...');
      const idExists = await columnExists(sequelize, 'Users', 'id');
      console.log(`🔹 id column in Users table ${idExists ? 'exists' : 'does not exist'}`);
      
      if (!idExists) {
        console.warn('⚠️ Warning: id column not found in Users table');
      }
    }
    
    console.log('✅ Basic database operations test passed!');
    
    // Test 3: Migration Utilities
    console.log('\n📋 Test 3: Migration Utilities');
    
    console.log('🔍 Testing ensureMetaTable utility...');
    await ensureMetaTable(sequelize);
    
    // Check if SequelizeMeta table exists (case insensitive for PostgreSQL)
    const dialect = sequelize.getDialect();
    const metaTableQuery = dialect === 'postgres'
      ? `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE 'sequelizemeta')`
      : `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'SequelizeMeta'`;
    
    const [metaResult] = await sequelize.query(metaTableQuery);
    const metaExists = dialect === 'postgres' 
      ? metaResult[0].exists 
      : metaResult[0].count > 0;
    
    console.log(`SequelizeMeta table ${metaExists ? 'exists' : 'does not exist'}`);
    
    if (!metaExists) {
      throw new Error('Failed to find SequelizeMeta table');
    }
    
    console.log('🔍 Testing recordMigration utility...');
    await recordMigration(sequelize, TEST_MIGRATION_NAME);
    
    console.log('🔍 Testing isMigrationComplete utility...');
    const migrationRecorded = await isMigrationComplete(sequelize, TEST_MIGRATION_NAME);
    
    if (!migrationRecorded) {
      throw new Error('Migration was not properly recorded');
    }
    
    console.log('✅ Migration utilities test passed!');
    
    // All tests passed
    console.log('\n🎉 All database configuration tests passed!');
    console.log('Database configuration standardization is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    if (sequelize) {
      console.log('\n🔌 Closing database connection...');
      await sequelize.close();
    }
  }
}

// Run all tests
runTests(); 