'use strict';

/**
 * This script adds an entry to the SequelizeMeta table to mark the reset token migration as complete
 * Run this after deploying to prevent future migration errors
 */

const path = require('path');
const { Sequelize } = require('sequelize');

// Get database URL from environment
const dbUrl = process.env.DATABASE_URL;

// If no database URL is provided, exit
if (!dbUrl) {
  console.error('No DATABASE_URL provided. Please set the DATABASE_URL environment variable.');
  process.exit(1);
}

// Create Sequelize instance
const sequelize = new Sequelize(dbUrl, {
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Function to track the migration
async function trackMigration() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if the SequelizeMeta table exists
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'SequelizeMeta'
    `);

    if (tables.length === 0) {
      console.log('SequelizeMeta table not found. Creating...');
      await sequelize.query(`
        CREATE TABLE "SequelizeMeta" (
          name VARCHAR(255) NOT NULL PRIMARY KEY
        )
      `);
    }

    // Check if the migration is already tracked
    const [migrations] = await sequelize.query(`
      SELECT name FROM "SequelizeMeta" 
      WHERE name = 'add-reset-token-fields.js'
    `);

    if (migrations.length > 0) {
      console.log('Migration already tracked in SequelizeMeta.');
    } else {
      // Insert the migration entry
      await sequelize.query(`
        INSERT INTO "SequelizeMeta" (name) 
        VALUES ('add-reset-token-fields.js')
      `);
      console.log('Migration tracked successfully in SequelizeMeta.');
    }

    // Also track our safe migration
    const [safeMigrations] = await sequelize.query(`
      SELECT name FROM "SequelizeMeta" 
      WHERE name = 'safe-add-reset-token-fields.cjs'
    `);

    if (safeMigrations.length > 0) {
      console.log('Safe migration already tracked in SequelizeMeta.');
    } else {
      // Insert the migration entry
      await sequelize.query(`
        INSERT INTO "SequelizeMeta" (name) 
        VALUES ('safe-add-reset-token-fields.cjs')
      `);
      console.log('Safe migration tracked successfully in SequelizeMeta.');
    }

    console.log('All migrations properly tracked. Future deployments should not have migration errors.');
    process.exit(0);
  } catch (error) {
    console.error('Error tracking migration:', error);
    process.exit(1);
  }
}

// Run the function
trackMigration(); 