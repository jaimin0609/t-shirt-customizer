/**
 * Script to fix bcryptjs imports across the project
 * Run with: node scripts/fixBcryptImports.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Files known to import bcryptjs
const filesToFix = [
  'server.js',
  'scripts/setupAdmin.js',
  'scripts/resetUserPassword.js',
  'scripts/resetAdminCredentials.js',
  'scripts/resetAdminPassword.js',
  'scripts/createAdminUser.js',
  'scripts/createAdmin.js',
  'routes/auth.routes.js',
  'routes/adminProfile.routes.js',
  'routes/admin.routes.js',
  'models/user.js'
];

// Helper function to check if file already has the createRequire import
function hasCreateRequireImport(content) {
  return content.includes('import { createRequire } from') || 
         content.includes('const require = createRequire');
}

let fixedCount = 0;
let alreadyFixedCount = 0;
let errorCount = 0;

for (const file of filesToFix) {
  const filePath = path.join(rootDir, file);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File ${filePath} does not exist, skipping.`);
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip files that already have the fix
    if (hasCreateRequireImport(content)) {
      console.log(`File ${file} already has createRequire import, skipping.`);
      alreadyFixedCount++;
      continue;
    }
    
    // Check if file imports bcryptjs
    if (!content.includes('import bcrypt from')) {
      console.log(`File ${file} doesn't import bcryptjs, skipping.`);
      continue;
    }
    
    // Replace the import statement
    content = content.replace(
      /import bcrypt from ['"]bcryptjs['"];?/,
      `import { createRequire } from 'module';\nconst require = createRequire(import.meta.url);\nconst bcrypt = require('bcryptjs');`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed bcryptjs import in ${file}`);
    fixedCount++;
    
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
    errorCount++;
  }
}

console.log(`\nSummary:`);
console.log(`- Files fixed: ${fixedCount}`);
console.log(`- Files already fixed: ${alreadyFixedCount}`);
console.log(`- Errors: ${errorCount}`);
console.log(`\nTotal files processed: ${filesToFix.length}`); 