#!/usr/bin/env node

/**
 * Security Check Script
 * 
 * This script performs basic security checks on the codebase:
 * 1. Looks for hardcoded secrets or API keys
 * 2. Checks for console.log statements in production code
 * 3. Looks for potential security vulnerabilities
 * 
 * Usage:
 * node scripts/security-check.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to search for
const PATTERNS = [
  { 
    pattern: /(password|secret|key|token|auth).*['"][A-Za-z0-9_+=\/@:{}().,-]{8,}['"]/, 
    description: 'Potential hardcoded secret/API key/credential' 
  },
  { 
    pattern: /console\.(log|error|warn|info)/, 
    description: 'Console statement in production code' 
  },
  { 
    pattern: /eval\(|new Function\(/, 
    description: 'Potentially dangerous code execution' 
  },
  { 
    pattern: /innerHTML|outerHTML|document\.write/, 
    description: 'Potential XSS vulnerability' 
  },
  { 
    pattern: /process\.env\.(\w+).*default.*(['"])/, 
    description: 'Environment variable with hardcoded fallback (security risk)' 
  },
];

// Directories to exclude from scanning
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.vercel'
];

// File extensions to scan
const INCLUDE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', 
  '.vue', '.php', '.html', '.htm',
  '.py', '.rb', '.java', '.go',
  '.json', '.yml', '.yaml', '.env.example'
];

// Files to exclude
const EXCLUDE_FILES = [
  'package-lock.json',
  'yarn.lock',
  '.env.example',
  'security-check.js', // Don't check this script itself
];

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

console.log(`${colors.blue}${colors.bold}Starting security check...${colors.reset}\n`);

let issuesFound = 0;
let filesChecked = 0;

/**
 * Recursively scan a directory for files to check
 */
function scanDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip excluded directories
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(entry.name)) {
          scanDirectory(fullPath);
        }
        continue;
      }
      
      // Check if this is a file we want to scan
      const ext = path.extname(entry.name);
      if (!INCLUDE_EXTENSIONS.includes(ext) || EXCLUDE_FILES.includes(entry.name)) {
        continue;
      }
      
      checkFile(fullPath);
      filesChecked++;
    }
  } catch (error) {
    console.error(`${colors.red}Error scanning directory ${dir}:${colors.reset}`, error.message);
  }
}

/**
 * Check a single file for security issues
 */
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    let fileHasIssues = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const { pattern, description } of PATTERNS) {
        if (pattern.test(line)) {
          if (!fileHasIssues) {
            console.log(`\n${colors.yellow}${colors.bold}${filePath}${colors.reset}`);
            fileHasIssues = true;
          }
          
          // Clean the output by limiting line length
          const cleanedLine = line.length > 100 
            ? line.substr(0, 97) + '...' 
            : line;
            
          console.log(`  ${colors.red}Line ${i + 1}:${colors.reset} ${description}`);
          console.log(`    ${cleanedLine.trim()}`);
          
          issuesFound++;
        }
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error checking file ${filePath}:${colors.reset}`, error.message);
  }
}

// Start scanning from root directories
console.log(`${colors.blue}Scanning Backend directory...${colors.reset}`);
scanDirectory('./Backend');

console.log(`\n${colors.blue}Scanning Frontend directory...${colors.reset}`);
scanDirectory('./Frontend');

// Print summary
console.log(`\n${colors.bold}Security check complete!${colors.reset}`);
console.log(`Files checked: ${filesChecked}`);

if (issuesFound > 0) {
  console.log(`${colors.red}${colors.bold}Issues found: ${issuesFound}${colors.reset}`);
  console.log(`\n${colors.yellow}Note: Not all issues are actual security problems. Review each case carefully.${colors.reset}`);
  console.log(`Run this script regularly and before deployments to catch potential security issues.`);
} else {
  console.log(`${colors.green}${colors.bold}No security issues found!${colors.reset}`);
}

// Add instructions for running dependency security check
console.log(`\n${colors.blue}${colors.bold}Next steps:${colors.reset}`);
console.log(`1. Run ${colors.cyan}npm audit${colors.reset} to check for vulnerabilities in dependencies`);
console.log(`2. Consider adding a more robust security scanning tool to your CI/CD pipeline`);
console.log(`3. Review the security best practices in the documentation`); 