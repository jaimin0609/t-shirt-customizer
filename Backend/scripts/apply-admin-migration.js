/**
 * Script to apply the permission migration
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get timestamp for migration file name
const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
const migrationName = `${timestamp}-add-permissions-to-users.js`;

// Source and destination paths
const sourcePath = path.join(__dirname, '..', 'migrations', 'add-permissions-to-users.js');
const destPath = path.join(__dirname, '..', 'migrations', migrationName);

// Check if source file exists
if (!fs.existsSync(sourcePath)) {
    console.error('Error: Source migration file not found.');
    process.exit(1);
}

// Copy migration file with timestamp
fs.copyFileSync(sourcePath, destPath);
console.log(`Migration file copied to: ${destPath}`);

// Run the migration
console.log('Running migration...');
exec('npx sequelize-cli db:migrate', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error running migration: ${error.message}`);
        return;
    }
    
    if (stderr) {
        console.error(`Migration stderr: ${stderr}`);
        return;
    }
    
    console.log(`Migration stdout: ${stdout}`);
    console.log('Migration completed successfully!');
}); 