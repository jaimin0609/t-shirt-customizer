'use strict';

/**
 * This is a simplified migration script that doesn't rely on Umzug.
 * It directly executes SQL to add the resetToken and resetTokenExpiry columns.
 */

const { Sequelize } = require('sequelize');

// Get the database URL from environment variable
const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URI;

if (!dbUrl) {
  console.error('ERROR: No DATABASE_URL provided');
  console.error('Please set DATABASE_URL environment variable');
  process.exit(1);
}

// Determine if using PostgreSQL or another database
const isPostgres = dbUrl.includes('postgres://') || dbUrl.includes('postgresql://');
console.log(`Using ${isPostgres ? 'PostgreSQL' : 'Other'} database`);

// Create Sequelize instance
const sequelize = new Sequelize(dbUrl, {
  logging: console.log,
  dialectOptions: isPostgres ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

async function runManualMigration() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Determine table name
    let tableName = 'Users';
    
    if (isPostgres) {
      try {
        // Get actual table name (case sensitive in PostgreSQL)
        const [tables] = await sequelize.query(
          `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`
        );
        
        // Find the users table regardless of case
        const usersTable = tables.find(t => 
          (t.tablename || '').toLowerCase() === 'users'
        );
        
        if (usersTable) {
          tableName = usersTable.tablename;
          console.log(`Found actual users table name: "${tableName}"`);
        }
      } catch (err) {
        console.error('Error finding table name:', err);
        console.log('Using default table name: "Users"');
      }
    }

    // Check if columns already exist
    const query = isPostgres 
      ? `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${tableName.toLowerCase()}' 
        AND column_name IN ('resettoken', 'resettokenexpiry')
      `
      : `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${tableName}' 
        AND COLUMN_NAME IN ('resetToken', 'resetTokenExpiry')
      `;
    
    console.log('Checking existing columns with query:', query);
    const [columns] = await sequelize.query(query);
    
    // Handle different case sensitivity between PostgreSQL and MySQL
    const existingColumns = columns.map(r => 
      (r.column_name || r.COLUMN_NAME || '').toLowerCase()
    );
    console.log('Existing columns:', existingColumns);
    
    // For PostgreSQL, we need to use quoted table names
    const tableRef = isPostgres ? `"${tableName}"` : tableName;
    
    // Add resetToken column if it doesn't exist
    if (!existingColumns.includes('resettoken')) {
      console.log(`Adding resetToken column to ${tableName} table...`);
      try {
        await sequelize.query(`
          ALTER TABLE ${tableRef} 
          ADD COLUMN "${isPostgres ? 'resetToken' : 'resetToken'}" VARCHAR(255) NULL
        `);
        console.log('Added resetToken column successfully');
      } catch (error) {
        // Handle column already exists error
        if (error.message && error.message.includes('already exists')) {
          console.log('resetToken column already exists (caught in error handler)');
        } else {
          console.error('Error adding resetToken column:', error.message);
        }
      }
    } else {
      console.log('resetToken column already exists, skipping');
    }
    
    // Add resetTokenExpiry column if it doesn't exist
    if (!existingColumns.includes('resettokenexpiry')) {
      console.log(`Adding resetTokenExpiry column to ${tableName} table...`);
      try {
        await sequelize.query(`
          ALTER TABLE ${tableRef} 
          ADD COLUMN "${isPostgres ? 'resetTokenExpiry' : 'resetTokenExpiry'}" TIMESTAMP NULL
        `);
        console.log('Added resetTokenExpiry column successfully');
      } catch (error) {
        // Handle column already exists error
        if (error.message && error.message.includes('already exists')) {
          console.log('resetTokenExpiry column already exists (caught in error handler)');
        } else {
          console.error('Error adding resetTokenExpiry column:', error.message);
        }
      }
    } else {
      console.log('resetTokenExpiry column already exists, skipping');
    }

    // Mark migration as complete in SequelizeMeta
    try {
      console.log('Marking migration as complete in SequelizeMeta...');
      
      // Check if SequelizeMeta table exists
      const [metaTables] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'SequelizeMeta'
      `);
      
      if (metaTables.length === 0) {
        console.log('Creating SequelizeMeta table...');
        await sequelize.query(`
          CREATE TABLE "SequelizeMeta" (
            name VARCHAR(255) NOT NULL PRIMARY KEY
          )
        `);
      }
      
      // Insert migration records for both migration files
      await sequelize.query(`
        INSERT INTO "SequelizeMeta" (name) 
        VALUES ('add-reset-token-fields.js')
        ON CONFLICT (name) DO NOTHING
      `);
      
      await sequelize.query(`
        INSERT INTO "SequelizeMeta" (name) 
        VALUES ('safe-add-reset-token-fields.cjs')
        ON CONFLICT (name) DO NOTHING
      `);
      
      console.log('Migration marked as complete in SequelizeMeta');
    } catch (error) {
      console.error('Error marking migration as complete:', error);
    }

    console.log('Manual migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runManualMigration(); 