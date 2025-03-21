/**
 * Consolidated Build Script
 * A unified build script for backend deployment that can be used across platforms
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getBuildConfig, getEnvironmentConfig } from '../../config/deployment.js';

/**
 * Execute a shell command and log the output
 * @param {string} command - The command to execute
 * @param {Object} options - Options for child_process.execSync
 */
const execCommand = (command, options = {}) => {
  console.log(`> Running: ${command}`);
  try {
    const output = execSync(command, { stdio: 'inherit', ...options });
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    if (options.exitOnError !== false) {
      process.exit(1);
    }
    return null;
  }
};

/**
 * Ensure we're in the correct directory
 */
const ensureCorrectDirectory = () => {
  console.log('Current directory:', process.cwd());
  if (!process.cwd().includes('Backend')) {
    if (fs.existsSync('./Backend')) {
      console.log('Changing to Backend directory...');
      process.chdir('./Backend');
    } else {
      console.warn('Warning: Not in Backend directory and no Backend directory found.');
    }
  }
  console.log('Working directory:', process.cwd());
};

/**
 * Install dependencies with correct flags
 */
const installDependencies = () => {
  const buildConfig = getBuildConfig();
  const { standard: standardInstall } = buildConfig.installCommands;
  
  console.log('Installing dependencies...');
  
  // Create .npmrc to skip scripts initially
  fs.writeFileSync('.npmrc', 'ignore-scripts=true\n');
  
  // Install dependencies with ignore-scripts
  execCommand(standardInstall);
  
  // Handle Sharp installation
  handleSharpInstallation();
  
  console.log('Dependencies installed successfully');
};

/**
 * Handle installation of Sharp library which needs special attention
 */
const handleSharpInstallation = () => {
  console.log('Installing Sharp with special handling...');
  
  // Remove any existing Sharp installation
  try {
    fs.rmSync('node_modules/sharp', { recursive: true, force: true });
    execCommand('npm uninstall sharp');
  } catch (error) {
    console.log('No existing Sharp installation to remove');
  }
  
  // Enable scripts for Sharp installation
  fs.writeFileSync('.npmrc', 'ignore-scripts=false\n');
  
  // Set environment variable for Sharp
  process.env.SHARP_IGNORE_GLOBAL_LIBVIPS = 1;
  
  // Install compatible version of Sharp for Node.js 18.15.0
  console.log('Installing Sharp (compatible version 0.32.6)...');
  execCommand('npm install --unsafe-perm --build-from-source --foreground-scripts sharp@0.32.6');
  
  // Verify Sharp installation
  verifySharpInstallation();
};

/**
 * Verify that Sharp was installed correctly
 */
const verifySharpInstallation = () => {
  console.log('Verifying Sharp installation...');
  try {
    execCommand('node -e "console.log(\'Sharp version:\', require(\'sharp\').versions.sharp)"');
    console.log('Sharp verification passed!');
    return true;
  } catch (error) {
    console.log('Sharp verification failed. Attempting rebuild...');
    try {
      execCommand('npm rebuild sharp --foreground-scripts --unsafe-perm');
      execCommand('node -e "console.log(\'Rebuilt Sharp version:\', require(\'sharp\').versions.sharp)"');
      return true;
    } catch (rebuildError) {
      console.log('Sharp rebuild failed. Attempting final approach with prebuilt binaries...');
      execCommand('npm install --platform=linux --arch=x64 --unsafe-perm sharp', { exitOnError: false });
      return false;
    }
  }
};

/**
 * Run database migrations if necessary
 * @param {boolean} force - Whether to force migrations
 */
const runMigrations = (force = false) => {
  const buildConfig = getBuildConfig();
  const { runAutomatically, script, safeMode } = buildConfig.migrations;
  
  if (!runAutomatically && !force) {
    console.log('Skipping automatic migrations');
    return;
  }
  
  console.log('Running database migrations...');
  if (safeMode) {
    console.log('Using safe migration mode');
  }
  
  execCommand(script, { exitOnError: false });
  console.log('Migrations completed or skipped');
};

/**
 * Run the build process
 * @param {Object} options - Build options
 */
const runBuild = (options = {}) => {
  const startTime = Date.now();
  console.log('Starting build process...');
  console.log('Options:', options);
  
  // Ensure we're in the right directory
  ensureCorrectDirectory();
  
  // Install dependencies
  installDependencies();
  
  // Run migrations if requested
  if (options.runMigrations) {
    runMigrations(true);
  }
  
  // Build complete
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Build completed in ${duration}s`);
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  runMigrations: args.includes('--migrations')
};

// Execute the build process
runBuild(options); 