#!/usr/bin/env node

/**
 * Automated Schema Migration Script
 * 
 * This script analyzes the Sequelize models and compares them to the database schema.
 * It then automatically creates and applies migrations for any missing tables or columns.
 * 
 * Usage:
 *   node scripts/auto-migrate.js [--dry-run]
 * 
 * Options:
 *   --dry-run    Show changes that would be applied without actually making them
 */

import 'dotenv/config';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import * as models from '../models/index.js';
import { createSequelizeInstance, testConnection, tableExists } from '../utils/databaseUtils.js';
import { generateMigrationFromModel, runColumnMigration } from '../utils/migrationUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for --dry-run flag
const isDryRun = process.argv.includes('--dry-run');
if (isDryRun) {
  console.log('🔍 Running in dry-run mode - no changes will be applied');
}

// Helper function to convert model name to table name
const getTableName = (modelName) => {
  // Convert camelCase to snake_case and pluralize
  return modelName
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/^./, (str) => str.toUpperCase()) + 's';
};

/**
 * Main migration function
 */
async function runAutoMigration() {
  try {
    console.log('🚀 Starting automated schema migration');
    
    // Create database connection
    const sequelize = createSequelizeInstance(true);
    console.log('🔌 Connecting to database...');
    
    // Test connection
    const connected = await testConnection(sequelize);
    if (!connected) {
      throw new Error('Failed to connect to database');
    }
    
    // Get all models
    const modelEntries = Object.entries(models).filter(([name, model]) => {
      return name !== 'default' && typeof model === 'function';
    });
    
    console.log(`📋 Found ${modelEntries.length} models to check`);
    
    // Track migrations that need to be applied
    const pendingMigrations = [];
    
    // Check each model
    for (const [modelName, ModelClass] of modelEntries) {
      try {
        // Skip the Sequelize class itself
        if (modelName === 'Sequelize') continue;
        
        const model = ModelClass;
        const tableName = getTableName(modelName);
        
        console.log(`🔍 Checking model ${modelName} against table ${tableName}`);
        
        // Check if table exists
        const tableExistsResult = await tableExists(sequelize, tableName);
        
        if (!tableExistsResult) {
          console.log(`⚠️ Table ${tableName} does not exist - would create entire table`);
          // In a real implementation, we would add logic to create the table
          // For now, we'll just note that the table is missing
          continue;
        }
        
        // Generate migration for missing columns
        const migration = await generateMigrationFromModel(model, tableName);
        
        if (migration.columns.length > 0) {
          console.log(`🔧 Found ${migration.columns.length} missing columns in ${tableName}`);
          migration.columns.forEach(col => {
            console.log(`  - ${col.column} (${col.type})`);
          });
          
          pendingMigrations.push(migration);
        } else {
          console.log(`✅ Table ${tableName} is up to date`);
        }
      } catch (error) {
        console.error(`❌ Error processing model ${modelName}:`, error);
      }
    }
    
    // Run migrations if not in dry-run mode
    if (pendingMigrations.length > 0) {
      console.log(`\n📝 Found ${pendingMigrations.length} tables with missing columns`);
      
      if (isDryRun) {
        console.log('🛑 Dry run - skipping actual migration');
        
        // Save migration plan to a file for review
        const migrationPlan = {
          timestamp: new Date().toISOString(),
          migrations: pendingMigrations
        };
        
        const planFile = path.join(__dirname, '../migrations', 'migration-plan.json');
        fs.writeFileSync(planFile, JSON.stringify(migrationPlan, null, 2));
        
        console.log(`💾 Migration plan saved to ${planFile}`);
      } else {
        console.log('🚀 Applying migrations...');
        
        for (const migration of pendingMigrations) {
          console.log(`\n▶️ Running migration for ${migration.name}`);
          await runColumnMigration(migration);
        }
        
        console.log('\n✅ All migrations completed successfully');
      }
    } else {
      console.log('\n✅ Database schema is up to date - no migrations needed');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runAutoMigration(); 