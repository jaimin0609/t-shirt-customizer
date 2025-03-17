'use strict';

/**
 * Simple script to test database connection and column existence
 * Use to verify that your environment is properly configured
 */

const { Sequelize } = require('sequelize');

console.log("Migration Testing Script");
console.log("------------------------");

// Check for DATABASE_URL
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.log("⚠️ WARNING: No DATABASE_URL environment variable found.");
  console.log("Using default SQLite database for testing");
  dbUrl = 'sqlite::memory:';
}

console.log(`Using database URL: ${dbUrl.substring(0, 20)}...`);

// Create Sequelize instance
let sequelize;
try {
  // Simple config based on URL
  sequelize = new Sequelize(dbUrl, {
    logging: false, // Set to console.log if you want to see all SQL
    dialectOptions: dbUrl.includes('postgres') ? {
      ssl: { 
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  });
  
  console.log("✅ Sequelize instance created");
} catch (err) {
  console.error("❌ Failed to create Sequelize instance:", err.message);
  process.exit(1);
}

async function testMigration() {
  try {
    console.log("\nTesting database connection...");
    await sequelize.authenticate();
    console.log("✅ Database connection successful");
    
    // Test if we can query information schema
    console.log("\nTesting schema queries...");
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      LIMIT 5
    `);
    
    console.log(`✅ Schema query successful. Found ${tables.length} tables.`);
    if (tables.length > 0) {
      console.log("Sample tables:", tables.map(t => t.table_name || t.TABLE_NAME).join(', '));
    }

    console.log("\nMigration testing complete - your environment is configured correctly!");
    console.log("You can now run 'npm run manual-migration' to add the resetToken columns.");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration test failed:", error);
    console.error("\nError details:", error.message);
    if (error.original) {
      console.error("Original error:", error.original.message);
    }
    
    console.log("\nTroubleshooting tips:");
    console.log("1. Check if your DATABASE_URL is correct");
    console.log("2. Ensure you have network access to the database");
    console.log("3. For PostgreSQL, make sure SSL settings are correct");
    console.log("4. Try running with DEBUG=sequelize* for more details");
    process.exit(1);
  }
}

// Run the test
testMigration(); 