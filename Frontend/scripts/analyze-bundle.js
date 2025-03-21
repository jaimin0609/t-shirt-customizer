#!/usr/bin/env node

/**
 * Script to analyze the frontend bundle size using Vite's bundle analyzer plugin.
 * This helps identify large dependencies and opportunities for optimization.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Print a section header
function printHeader(text) {
  console.log('\n' + colors.bright + colors.blue + '='.repeat(80) + colors.reset);
  console.log(colors.bright + colors.blue + ' ' + text + colors.reset);
  console.log(colors.bright + colors.blue + '='.repeat(80) + colors.reset + '\n');
}

// Check if a command exists
function commandExists(command) {
  try {
    execSync(`${process.platform === 'win32' ? 'where' : 'which'} ${command}`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// Check if Vite is installed and available
function checkViteInstalled() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.error(`${colors.red}Error: package.json not found. Are you in the correct directory?${colors.reset}`);
      process.exit(1);
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasVite = 
      (packageJson.dependencies && packageJson.dependencies.vite) || 
      (packageJson.devDependencies && packageJson.devDependencies.vite);
    
    if (!hasVite) {
      console.error(`${colors.red}Error: Vite is not installed as a dependency.${colors.reset}`);
      console.log(`${colors.yellow}Please install vite-bundle-analyzer:${colors.reset}\n`);
      console.log('npm install vite-bundle-analyzer --save-dev');
      process.exit(1);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error checking for Vite:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Ensure the bundle analyzer plugin is available
function ensureBundleAnalyzerInstalled() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const hasBundleAnalyzer = 
      (packageJson.dependencies && packageJson.dependencies['rollup-plugin-visualizer']) || 
      (packageJson.devDependencies && packageJson.devDependencies['rollup-plugin-visualizer']);
    
    if (!hasBundleAnalyzer) {
      console.log(`${colors.yellow}Installing rollup-plugin-visualizer...${colors.reset}`);
      execSync('npm install rollup-plugin-visualizer --save-dev', { stdio: 'inherit' });
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error ensuring bundle analyzer is installed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Check if vite.config.js exists and contains the bundle analyzer plugin
function checkOrUpdateViteConfig() {
  const viteConfigPath = path.join(process.cwd(), 'vite.config.js');
  
  if (!fs.existsSync(viteConfigPath)) {
    console.error(`${colors.red}Error: vite.config.js not found.${colors.reset}`);
    process.exit(1);
  }
  
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  // Check if the visualizer plugin is already included
  if (!viteConfig.includes('rollup-plugin-visualizer')) {
    console.log(`${colors.yellow}Adding rollup-plugin-visualizer to vite.config.js...${colors.reset}`);
    
    // Create a temporary config with the visualizer plugin
    const tempConfigPath = path.join(process.cwd(), 'vite.config.analyze.js');
    
    // Add the visualizer import and plugin
    let newConfig = viteConfig;
    
    if (newConfig.includes('import {')) {
      // Add to existing imports
      newConfig = newConfig.replace(
        'import {', 
        'import { visualizer } from \'rollup-plugin-visualizer\';\nimport {'
      );
    } else if (newConfig.includes('import ')) {
      // Add after last import
      const importLines = newConfig.match(/import .+/g) || [];
      const lastImport = importLines[importLines.length - 1];
      newConfig = newConfig.replace(
        lastImport, 
        `${lastImport}\nimport { visualizer } from 'rollup-plugin-visualizer';`
      );
    } else {
      // Add at the beginning
      newConfig = `import { visualizer } from 'rollup-plugin-visualizer';\n${newConfig}`;
    }
    
    // Add the plugin to the plugins array
    if (newConfig.includes('plugins: [')) {
      newConfig = newConfig.replace(
        'plugins: [', 
        'plugins: [\n    process.env.ANALYZE === "true" && visualizer({\n      open: true,\n      filename: "bundle-analysis.html",\n      gzipSize: true,\n      brotliSize: true\n    }),\n    '
      );
    } else {
      console.error(`${colors.red}Error: Could not find plugins array in vite.config.js.${colors.reset}`);
      console.log(`${colors.yellow}Please add the visualizer plugin manually:${colors.reset}\n`);
      console.log(`
import { visualizer } from 'rollup-plugin-visualizer';

// In your defineConfig:
plugins: [
  process.env.ANALYZE === "true" && visualizer({
    open: true,
    filename: "bundle-analysis.html",
    gzipSize: true,
    brotliSize: true
  }),
  // other plugins...
]
      `);
      process.exit(1);
    }
    
    // Add filter to remove false values from plugins array
    if (!newConfig.includes('.filter(Boolean)')) {
      newConfig = newConfig.replace(
        'plugins: [', 
        'plugins: ['
      ).replace(
        ']',
        '].filter(Boolean)'
      );
    }
    
    // Write the temporary config file
    fs.writeFileSync(tempConfigPath, newConfig, 'utf8');
    return tempConfigPath;
  }
  
  return viteConfigPath;
}

// Run the bundle analysis
function runBundleAnalysis(configPath) {
  printHeader('RUNNING BUNDLE ANALYSIS');
  
  try {
    console.log(`${colors.cyan}Building production bundle with analyzer...${colors.reset}`);
    
    // Set environment variables and run the build
    const cmd = `cross-env ANALYZE=true vite build --config ${configPath}`;
    console.log(`> ${cmd}`);
    
    execSync(cmd, { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        ANALYZE: 'true' 
      }
    });
    
    console.log(`\n${colors.green}Bundle analysis complete!${colors.reset}`);
    console.log(`${colors.cyan}The analysis report has been opened in your browser.${colors.reset}`);
    console.log(`${colors.cyan}You can view it again by opening "bundle-analysis.html" in the "dist" folder.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error analyzing bundle:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Clean up temporary files
function cleanup(tempConfigPath) {
  if (tempConfigPath && fs.existsSync(tempConfigPath) && tempConfigPath.includes('.analyze.')) {
    fs.unlinkSync(tempConfigPath);
    console.log(`${colors.green}Cleaned up temporary configuration.${colors.reset}`);
  }
}

// Main function
function main() {
  printHeader('FRONTEND BUNDLE ANALYSIS');
  
  // Check for necessary commands
  if (!commandExists('npm')) {
    console.error(`${colors.red}Error: npm is not installed or not in PATH.${colors.reset}`);
    process.exit(1);
  }
  
  // Check if we're in a Vite project
  checkViteInstalled();
  
  // Ensure bundle analyzer is installed
  ensureBundleAnalyzerInstalled();
  
  // Check or update vite.config.js
  const configPath = checkOrUpdateViteConfig();
  
  // Run the analysis
  runBundleAnalysis(configPath);
  
  // Clean up
  if (configPath.includes('.analyze.')) {
    cleanup(configPath);
  }
}

// Run the script
main(); 