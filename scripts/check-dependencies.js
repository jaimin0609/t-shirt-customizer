#!/usr/bin/env node

/**
 * Dependency Check Script
 * 
 * This script checks for outdated dependencies in both frontend and backend packages.
 * It also identifies potential security vulnerabilities using npm audit.
 * 
 * Usage:
 *   node scripts/check-dependencies.js
 * 
 * Options:
 *   --fix       Attempt to update packages to latest versions
 *   --security  Only show packages with security issues
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
const shouldFix = args.includes('--fix');
const securityOnly = args.includes('--security');

// Directories to check
const directories = [
  { name: 'Root', path: '.' },
  { name: 'Frontend', path: './Frontend' },
  { name: 'Backend', path: './Backend' }
];

/**
 * Check if a directory contains a package.json file
 */
function hasPackageJson(dirPath) {
  return fs.existsSync(path.join(dirPath, 'package.json'));
}

/**
 * Run npm outdated in the specified directory
 */
function checkOutdatedDependencies(dirPath) {
  try {
    const output = execSync('npm outdated --json', { 
      cwd: dirPath,
      stdio: ['pipe', 'pipe', 'pipe']
    }).toString();
    
    if (!output || output.trim() === '') {
      return { success: true, data: {} };
    }
    
    return { success: true, data: JSON.parse(output) };
  } catch (error) {
    // npm outdated returns exit code 1 when outdated packages are found
    if (error.status === 1 && error.stdout) {
      try {
        return { success: true, data: JSON.parse(error.stdout.toString()) };
      } catch (parseError) {
        return { success: false, error: 'Failed to parse npm outdated output' };
      }
    }
    return { success: false, error: error.message };
  }
}

/**
 * Run npm audit in the specified directory
 */
function checkSecurityVulnerabilities(dirPath) {
  try {
    const output = execSync('npm audit --json', { 
      cwd: dirPath,
      stdio: ['pipe', 'pipe', 'pipe']
    }).toString();
    
    return { success: true, data: JSON.parse(output) };
  } catch (error) {
    // npm audit returns exit code 1 when vulnerabilities are found
    if (error.status === 1 && error.stdout) {
      try {
        return { success: true, data: JSON.parse(error.stdout.toString()) };
      } catch (parseError) {
        return { success: false, error: 'Failed to parse npm audit output' };
      }
    }
    return { success: false, error: error.message };
  }
}

/**
 * Format and display outdated dependencies
 */
function displayOutdatedDependencies(outdatedResult, directoryName, directoryPath) {
  if (!outdatedResult.success) {
    console.log(`${colors.red}Error checking outdated packages in ${directoryName}: ${outdatedResult.error}${colors.reset}`);
    return;
  }

  const outdated = outdatedResult.data;
  const packageCount = Object.keys(outdated).length;
  
  if (packageCount === 0) {
    console.log(`${colors.green}✓ No outdated packages found in ${directoryName}${colors.reset}`);
    return;
  }
  
  console.log(`\n${colors.yellow}${colors.bold}Found ${packageCount} outdated packages in ${directoryName}:${colors.reset}\n`);
  
  // Table header
  console.log(`${colors.bold}Package Name${' '.repeat(15)}Current${' '.repeat(8)}Wanted${' '.repeat(8)}Latest${' '.repeat(8)}Type${colors.reset}`);
  console.log('-'.repeat(80));
  
  // Table rows
  Object.entries(outdated).forEach(([packageName, info]) => {
    const nameCol = packageName.padEnd(25);
    const currentCol = (info.current || 'unknown').toString().padEnd(14);
    const wantedCol = (info.wanted || 'unknown').toString().padEnd(14);
    const latestCol = (info.latest || 'unknown').toString().padEnd(14);
    const typeCol = info.type || '';
    
    let rowColor = colors.white;
    if (info.type === 'devDependencies') {
      rowColor = colors.cyan;
    } else if (info.current !== info.wanted) {
      rowColor = colors.yellow;
    }
    
    console.log(`${rowColor}${nameCol}${currentCol}${wantedCol}${latestCol}${typeCol}${colors.reset}`);
  });
  
  if (shouldFix) {
    console.log(`\n${colors.blue}Attempting to update packages in ${directoryName}...${colors.reset}`);
    try {
      execSync('npm update', { cwd: directoryPath, stdio: 'inherit' });
      console.log(`${colors.green}✓ Packages updated successfully${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ Failed to update packages: ${error.message}${colors.reset}`);
    }
  }
}

/**
 * Format and display security vulnerabilities
 */
function displaySecurityVulnerabilities(auditResult, directoryName, directoryPath) {
  if (!auditResult.success) {
    console.log(`${colors.red}Error checking security vulnerabilities in ${directoryName}: ${auditResult.error}${colors.reset}`);
    return;
  }

  const auditData = auditResult.data;
  
  if (!auditData.vulnerabilities || Object.keys(auditData.vulnerabilities).length === 0) {
    console.log(`${colors.green}✓ No security vulnerabilities found in ${directoryName}${colors.reset}`);
    return;
  }
  
  const vulnerabilities = auditData.vulnerabilities;
  const metadata = auditData.metadata || {};
  const vulnerabilityCounts = metadata.vulnerabilities || {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0
  };
  
  const totalVulnerabilities = 
    vulnerabilityCounts.info + 
    vulnerabilityCounts.low + 
    vulnerabilityCounts.moderate + 
    vulnerabilityCounts.high + 
    vulnerabilityCounts.critical;
  
  console.log(`\n${colors.red}${colors.bold}Found ${totalVulnerabilities} security vulnerabilities in ${directoryName}:${colors.reset}\n`);
  
  if (vulnerabilityCounts.critical > 0) {
    console.log(`${colors.red}Critical: ${vulnerabilityCounts.critical}${colors.reset}`);
  }
  
  if (vulnerabilityCounts.high > 0) {
    console.log(`${colors.magenta}High: ${vulnerabilityCounts.high}${colors.reset}`);
  }
  
  if (vulnerabilityCounts.moderate > 0) {
    console.log(`${colors.yellow}Moderate: ${vulnerabilityCounts.moderate}${colors.reset}`);
  }
  
  if (vulnerabilityCounts.low > 0) {
    console.log(`${colors.blue}Low: ${vulnerabilityCounts.low}${colors.reset}`);
  }
  
  if (vulnerabilityCounts.info > 0) {
    console.log(`${colors.cyan}Info: ${vulnerabilityCounts.info}${colors.reset}`);
  }
  
  console.log('\nVulnerable Packages:');
  console.log('-'.repeat(80));
  
  Object.entries(vulnerabilities).forEach(([packageName, info]) => {
    const severity = info.severity || 'unknown';
    let severityColor = colors.white;
    
    switch (severity) {
      case 'critical':
        severityColor = colors.red;
        break;
      case 'high':
        severityColor = colors.magenta;
        break;
      case 'moderate':
        severityColor = colors.yellow;
        break;
      case 'low':
        severityColor = colors.blue;
        break;
      case 'info':
        severityColor = colors.cyan;
        break;
    }
    
    console.log(`${severityColor}${colors.bold}${packageName}${colors.reset} - ${severityColor}${severity.toUpperCase()}${colors.reset}`);
    console.log(`  Vulnerable versions: ${info.range || 'unknown'}`);
    
    if (info.nodes && info.nodes.length > 0) {
      console.log(`  Installed version: ${info.nodes[0] || 'unknown'}`);
    }
    
    if (info.fixAvailable) {
      if (typeof info.fixAvailable === 'object') {
        console.log(`  Fix available: Upgrade to ${info.fixAvailable.version || 'latest'}`);
      } else {
        console.log(`  Fix available: Yes`);
      }
    } else {
      console.log(`  Fix available: No`);
    }
    
    console.log('-'.repeat(80));
  });
  
  if (shouldFix) {
    console.log(`\n${colors.blue}Attempting to fix security vulnerabilities in ${directoryName}...${colors.reset}`);
    try {
      execSync('npm audit fix', { cwd: directoryPath, stdio: 'inherit' });
      console.log(`${colors.green}✓ Security vulnerabilities fixed (where possible)${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ Failed to fix all security vulnerabilities: ${error.message}${colors.reset}`);
      console.log(`${colors.yellow}Some vulnerabilities may require manual intervention or major version upgrades.${colors.reset}`);
    }
  }
}

/**
 * Main function to check dependencies in all directories
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}=== T-Shirt Customizer Dependency Check ====${colors.reset}\n`);
  
  for (const directory of directories) {
    const directoryPath = directory.path;
    const directoryName = directory.name;
    
    if (!hasPackageJson(directoryPath)) {
      console.log(`${colors.yellow}No package.json found in ${directoryName}, skipping...${colors.reset}`);
      continue;
    }
    
    console.log(`${colors.bold}${colors.blue}Checking ${directoryName}${colors.reset}`);
    
    if (!securityOnly) {
      console.log(`\n${colors.bold}Checking for outdated dependencies...${colors.reset}`);
      const outdatedResult = checkOutdatedDependencies(directoryPath);
      displayOutdatedDependencies(outdatedResult, directoryName, directoryPath);
    }
    
    console.log(`\n${colors.bold}Checking for security vulnerabilities...${colors.reset}`);
    const auditResult = checkSecurityVulnerabilities(directoryPath);
    displaySecurityVulnerabilities(auditResult, directoryName, directoryPath);
    
    console.log('\n' + '-'.repeat(80) + '\n');
  }
  
  console.log(`${colors.bold}${colors.blue}=== Dependency Check Complete ====${colors.reset}\n`);
  
  console.log(`${colors.bold}Next Steps:${colors.reset}`);
  console.log(`1. Review and update outdated packages`);
  console.log(`2. Address security vulnerabilities, especially critical and high severity ones`);
  console.log(`3. Run tests after updating dependencies to ensure nothing breaks`);
  console.log(`4. Consider setting up automated dependency checks in your CI/CD pipeline`);
  
  if (shouldFix) {
    console.log(`\n${colors.yellow}Note: Some updates may have been applied. Please test your application thoroughly.${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}Tip: Run with --fix flag to attempt automatic updates: node scripts/check-dependencies.js --fix${colors.reset}`);
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
}); 