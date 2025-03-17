#!/usr/bin/env node

/**
 * Security Update Script
 * 
 * This script focuses on updating packages with high-severity vulnerabilities
 * in a controlled manner to minimize breaking changes.
 * 
 * Usage:
 *   node scripts/security-update.js
 * 
 * Options:
 *   --frontend    Only update frontend packages
 *   --backend     Only update backend packages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const updateFrontend = args.includes('--frontend') || !args.includes('--backend');
const updateBackend = args.includes('--backend') || !args.includes('--frontend');

// Critical packages to update with high-severity vulnerabilities
const criticalUpdates = {
  frontend: [
    { name: 'axios', version: '^1.8.2', severity: 'high' },
    { name: '@react-three/drei', version: '^10.0.0', severity: 'high' },
    { name: 'vite', version: '^6.2.2', severity: 'moderate' }
  ],
  backend: [
    { name: 'nodemon', version: '^3.0.1', severity: 'high' },
    { name: 'semver', version: '^7.5.2', severity: 'high' }
  ]
};

// Helper packages that need to be updated together to maintain compatibility
const packageGroups = {
  '@react-three/drei': ['@react-three/fiber', 'three'],
  'nodemon': ['simple-update-notifier']
};

/**
 * Updates packages in a specific directory
 */
function updatePackages(directory, packages) {
  const dirPath = path.join(process.cwd(), directory);
  
  // Check if directory and package.json exist
  if (!fs.existsSync(dirPath) || !fs.existsSync(path.join(dirPath, 'package.json'))) {
    console.log(`${colors.red}Directory or package.json not found: ${directory}${colors.reset}`);
    return false;
  }
  
  console.log(`\n${colors.bold}${colors.blue}Updating packages in ${directory}${colors.reset}\n`);
  
  // Read the current package.json
  const packageJsonPath = path.join(dirPath, 'package.json');
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    console.log(`${colors.red}Error reading package.json: ${error.message}${colors.reset}`);
    return false;
  }
  
  // Create a backup of package.json
  const backupPath = `${packageJsonPath}.backup-${Date.now()}`;
  fs.writeFileSync(backupPath, JSON.stringify(packageJson, null, 2));
  console.log(`${colors.cyan}Created backup: ${backupPath}${colors.reset}`);
  
  let packagesToUpdate = [];
  
  // Check each package and add it to the update list if it exists in the dependencies or devDependencies
  packages.forEach(pkg => {
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    
    if (dependencies[pkg.name] || devDependencies[pkg.name]) {
      packagesToUpdate.push(pkg);
      
      // Add related packages if they exist
      if (packageGroups[pkg.name]) {
        packageGroups[pkg.name].forEach(relatedPkg => {
          if (dependencies[relatedPkg] || devDependencies[relatedPkg]) {
            packagesToUpdate.push({ 
              name: relatedPkg, 
              version: 'latest', 
              severity: 'related' 
            });
          }
        });
      }
    }
  });
  
  if (packagesToUpdate.length === 0) {
    console.log(`${colors.yellow}No packages to update in ${directory}${colors.reset}`);
    return true;
  }
  
  // Log the packages to be updated
  console.log(`${colors.bold}Packages to update:${colors.reset}`);
  packagesToUpdate.forEach(pkg => {
    let severityColor = colors.white;
    if (pkg.severity === 'high') {
      severityColor = colors.red;
    } else if (pkg.severity === 'moderate') {
      severityColor = colors.yellow;
    } else if (pkg.severity === 'related') {
      severityColor = colors.cyan;
    }
    
    console.log(`- ${pkg.name}@${pkg.version} ${severityColor}(${pkg.severity})${colors.reset}`);
  });
  
  // Confirm with the user before proceeding
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(`\n${colors.yellow}Do you want to update these packages? (y/n) ${colors.reset}`, (answer) => {
      rl.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log(`${colors.yellow}Update cancelled${colors.reset}`);
        resolve(false);
        return;
      }
      
      // Build npm install command with specific versions
      const installCmd = packagesToUpdate
        .map(pkg => `${pkg.name}@${pkg.version}`)
        .join(' ');
      
      console.log(`\n${colors.blue}Running: npm install ${installCmd}${colors.reset}`);
      
      try {
        execSync(`cd ${dirPath} && npm install ${installCmd} --save`, { 
          stdio: 'inherit' 
        });
        console.log(`${colors.green}✓ Packages updated successfully${colors.reset}`);
        resolve(true);
      } catch (error) {
        console.log(`${colors.red}✗ Failed to update packages: ${error.message}${colors.reset}`);
        console.log(`${colors.yellow}Restoring package.json from backup...${colors.reset}`);
        
        try {
          fs.copyFileSync(backupPath, packageJsonPath);
          console.log(`${colors.green}✓ Backup restored${colors.reset}`);
        } catch (restoreError) {
          console.log(`${colors.red}✗ Failed to restore backup: ${restoreError.message}${colors.reset}`);
        }
        
        resolve(false);
      }
    });
  });
}

/**
 * Run test command in a specific directory
 */
function runTests(directory) {
  const dirPath = path.join(process.cwd(), directory);
  
  console.log(`\n${colors.bold}${colors.blue}Running tests in ${directory}${colors.reset}\n`);
  
  // Read the package.json to check for test script
  const packageJsonPath = path.join(dirPath, 'package.json');
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    console.log(`${colors.red}Error reading package.json: ${error.message}${colors.reset}`);
    return false;
  }
  
  // Check if there's a test script
  if (!packageJson.scripts || !packageJson.scripts.test) {
    console.log(`${colors.yellow}No test script found in ${directory}/package.json${colors.reset}`);
    return true;
  }
  
  try {
    console.log(`${colors.blue}Running: npm test${colors.reset}`);
    execSync(`cd ${dirPath} && npm test`, { stdio: 'inherit' });
    console.log(`${colors.green}✓ Tests passed${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Tests failed: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Main function to update critical packages
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}=== T-Shirt Customizer Security Update ====${colors.reset}\n`);
  console.log(`This script will update packages with high-severity vulnerabilities.`);
  console.log(`It will create backups of your package.json files before making changes.`);
  
  let success = true;
  
  if (updateFrontend) {
    const frontendSuccess = await updatePackages('Frontend', criticalUpdates.frontend);
    if (frontendSuccess) {
      runTests('Frontend');
    }
    success = success && frontendSuccess;
  }
  
  if (updateBackend) {
    const backendSuccess = await updatePackages('Backend', criticalUpdates.backend);
    if (backendSuccess) {
      runTests('Backend');
    }
    success = success && backendSuccess;
  }
  
  console.log(`\n${colors.bold}${colors.blue}=== Security Update Complete ====${colors.reset}\n`);
  
  if (success) {
    console.log(`${colors.green}${colors.bold}✓ Critical security updates have been applied${colors.reset}`);
    console.log(`\n${colors.bold}Next Steps:${colors.reset}`);
    console.log(`1. Run your application to verify functionality`);
    console.log(`2. Address remaining vulnerabilities using npm audit fix`);
    console.log(`3. Run the dependency check script to verify improvements: npm run dependency-check`);
  } else {
    console.log(`${colors.yellow}${colors.bold}⚠ Some updates could not be applied${colors.reset}`);
    console.log(`\n${colors.bold}Suggested Steps:${colors.reset}`);
    console.log(`1. Review any error messages above`);
    console.log(`2. Update packages individually with specific versions`);
    console.log(`3. Consider checking package compatibilities in the documentation`);
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
}); 