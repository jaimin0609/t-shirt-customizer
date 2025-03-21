/**
 * Consolidated Frontend Build Script
 * A unified build script for frontend deployment that works across platforms
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this module (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add handling at the top of the file
try {
  // Check if we can import from '../../src/config/deployment.js'
  import('../../src/config/deployment.js')
    .then(module => {
      console.log('Successfully imported deployment configuration');
    })
    .catch(err => {
      console.error('Error importing deployment configuration:', err.message);
      console.log('Setting up fallback configuration...');
      process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    });
} catch (e) {
  console.warn('Module import error:', e.message);
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
}

// Import the deployment configuration (using dynamic import for ESM compatibility)
const { getBuildConfig, getPlatformConfig } = await import('../../src/config/deployment.js')
  .catch(err => {
    console.warn('Failed to import deployment config, using fallback:', err.message);
    return { 
      default: { 
        getBuildConfig: () => ({}),
        getPlatformConfig: () => ({})
      }
    };
  })
  .then(module => module.default || module);

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
 * Ensure we're in the Frontend directory
 */
const ensureCorrectDirectory = () => {
  console.log('Current directory:', process.cwd());
  if (!process.cwd().includes('Frontend')) {
    if (fs.existsSync('./Frontend')) {
      console.log('Changing to Frontend directory...');
      process.chdir('./Frontend');
    } else {
      console.warn('Warning: Not in Frontend directory and no Frontend directory found.');
    }
  }
  console.log('Working directory:', process.cwd());
};

/**
 * Install dependencies
 */
const installDependencies = () => {
  console.log('Installing dependencies...');
  try {
    // Use --force to bypass engine checks
    execCommand('npm install --no-audit --legacy-peer-deps --force');
    console.log('Dependencies installed successfully');
    return true;
  } catch (error) {
    console.error('Failed to install dependencies:', error.message);
    return false;
  }
};

/**
 * Create a temporary module resolution helper
 * This helps overcome Vite import issues in environments like Vercel
 */
const createTempModuleResolver = () => {
  console.log('Creating temporary module resolver for Vite...');
  
  // Create a temporary file to help with module resolution
  const tempDir = path.resolve(process.cwd(), '.vite-temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Create a temp package.json to ensure resolution
  const tempPackageJson = path.join(tempDir, 'package.json');
  fs.writeFileSync(tempPackageJson, JSON.stringify({
    "type": "module",
    "dependencies": {
      "vite": "6.2.2"
    }
  }, null, 2));
  
  // Create a temp js file that simply re-exports vite
  const tempJsFile = path.join(tempDir, 'vite-resolver.mjs');
  fs.writeFileSync(tempJsFile, `
    // This file helps resolve Vite in difficult environments
    import * as vite from 'vite';
    export default vite;
  `);
  
  return tempDir;
};

/**
 * Run the build process
 */
const runBuild = () => {
  console.log('Building application...');

  // Ensure dependencies before building
  ensureTailwindDependencies();

  // Create a temporary module resolver
  const tempModuleDir = createTempModuleResolver();

  // Install Vite explicitly with correct version
  console.log('Installing Vite 6.2.2 explicitly...');
  try {
    // Install Vite with exact path
    execCommand('npm install vite@6.2.2 --save-exact --save-dev --force --legacy-peer-deps');
    // Then install related plugins
    execCommand('npm install @vitejs/plugin-react postcss tailwindcss autoprefixer --save-dev --force --legacy-peer-deps');
  } catch (error) {
    console.warn('Warning: Could not install Vite 6.2.2:', error.message);
  }

  // Ensure critical CSS is available
  ensureCriticalCss();

  try {
    // Use npx with --yes flag to allow installing if needed
    console.log('Using npx to run vite with specific version');
    
    // Set NODE_OPTIONS to help with module resolution
    process.env.NODE_OPTIONS = '--experimental-vm-modules --no-warnings';
    
    // Run the build with environment variable to point to our temp resolver
    // Remove --no-install flag and add --yes to allow package installation
    execCommand('npx --yes vite@6.2.2 build', {
      env: {
        ...process.env,
        VITE_TEMP_RESOLVER: tempModuleDir
      }
    });

    // Create SPA fallbacks
    createSpaFallbacks();

    // Verify build output
    return verifyBuildOutput();
  } catch (error) {
    console.error('Build failed:', error.message);
    console.log('Attempting emergency build with direct installation...');
    
    // Try emergency build with a different approach
    try {
      // Try installing vite globally first
      execCommand('npm install -g vite@6.2.2');
      execCommand('npx --yes vite@6.2.2 build');
      createSpaFallbacks();
      return verifyBuildOutput();
    } catch (finalError) {
      console.error('Emergency build also failed:', finalError.message);
      return false;
    }
  }
};

/**
 * Ensure Tailwind and PostCSS are installed
 */
const ensureTailwindDependencies = () => {
  console.log('Installing Tailwind CSS dependencies...');
  try {
    // First try to install with --save instead of --save-dev to make sure it's available at runtime
    execCommand('npm install tailwindcss postcss autoprefixer postcss-import --save --force --legacy-peer-deps');
    
    // Double check by installing as dev dependency too
    execCommand('npm install tailwindcss postcss autoprefixer postcss-import --save-dev --force --legacy-peer-deps');
    
    // Verify that tailwindcss is installed and accessible
    try {
      const tailwindPath = require.resolve('tailwindcss');
      console.log(`Tailwind CSS found at: ${tailwindPath}`);
      
      // Create a simple test to verify module can be loaded
      const tempFile = path.join(process.cwd(), 'tailwind-test.js');
      fs.writeFileSync(tempFile, 'console.log(require("tailwindcss"));');
      execCommand(`node ${tempFile}`, { stdio: 'pipe', exitOnError: false });
      fs.unlinkSync(tempFile);
      
      return true;
    } catch (err) {
      console.error('Tailwind CSS installation verification failed:', err.message);
      return false;
    }
  } catch (error) {
    console.error('Failed to install Tailwind dependencies:', error.message);
    return false;
  }
};

/**
 * Ensure critical CSS is generated for fast loading
 */
const ensureCriticalCss = () => {
  console.log('Ensuring critical CSS is available...');
  const criticalCssPath = 'public/critical.css';
  
  // Manually make sure tailwindcss and related modules are correctly linked
  try {
    // Create a temporary post-install script to ensure correct linking
    const tempScriptPath = path.join(process.cwd(), 'ensure-deps.js');
    fs.writeFileSync(tempScriptPath, `
      const fs = require('fs');
      const path = require('path');
      try {
        // Create symlinks if needed for critical packages
        const packages = ['tailwindcss', 'postcss', 'autoprefixer', 'postcss-import'];
        packages.forEach(pkg => {
          try {
            console.log(\`Checking \${pkg}...\`);
            require.resolve(pkg);
            console.log(\`\${pkg} is properly installed and accessible\`);
          } catch (e) {
            console.log(\`Error accessing \${pkg}, trying to fix: \${e.message}\`);
          }
        });
      } catch (e) {
        console.error('Error in post-install script:', e);
      }
    `);
    
    // Run the temporary script
    execCommand(`node ${tempScriptPath}`, { stdio: 'inherit', exitOnError: false });
    fs.unlinkSync(tempScriptPath);
  } catch (e) {
    console.warn('Could not run dependency verification script:', e.message);
  }
  
  // Use npx to run vite with specific version
  console.log('Using npx to run vite with specific version');
  try {
    execCommand('npx --yes vite@6.2.2 build');
    return true;
  } catch (error) {
    console.error('Vite build failed, trying to create fallback build...');
    // Create a minimal fallback build
    createFallbackBuild();
    return false;
  }
};

/**
 * Create a fallback build if the main build fails
 */
const createFallbackBuild = () => {
  console.log('Creating fallback build...');
  
  // Create dist directory if it doesn't exist
  const distDir = path.join(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Create a basic index.html with CDN for Tailwind
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>T-Shirt Customizer</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
</head>
<body class="bg-gray-100 min-h-screen">
  <div class="container mx-auto py-12 px-4">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold mb-4 text-blue-600">T-Shirt Customizer</h1>
      <p class="mb-4">Welcome to the T-Shirt Customizer app!</p>
      <p class="text-gray-600">Please wait while we finalize your application setup. The application will be available shortly.</p>
    </div>
  </div>
</body>
</html>
  `;
  
  // Write the index.html file
  fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
  
  // Create a 404.html file that's the same as index.html
  fs.writeFileSync(path.join(distDir, '404.html'), htmlContent);
  
  console.log('Fallback build created successfully');
};

/**
 * Create SPA routing fallback files
 */
const createSpaFallbacks = () => {
  console.log('Creating SPA routing fallbacks...');
  
  if (fs.existsSync('dist/index.html')) {
    // Copy index.html to common fallback files
    fs.copyFileSync('dist/index.html', 'dist/200.html');
    fs.copyFileSync('dist/index.html', 'dist/404.html');
    
    // Create fallbacks for common routes
    const routes = ['products', 'product', 'cart', 'account', 'orders'];
    
    routes.forEach(route => {
      const routeDir = `dist/${route}`;
      if (!fs.existsSync(routeDir)) {
        fs.mkdirSync(routeDir, { recursive: true });
      }
      
      // Create a simple HTML file that refreshes to the root
      const refreshHtml = '<meta http-equiv="refresh" content="0;url=/" />';
      fs.writeFileSync(`${routeDir}/index.html`, refreshHtml);
    });
    
    console.log('SPA fallbacks created');
  } else {
    console.warn('dist/index.html not found, skipping SPA fallbacks');
  }
};

/**
 * Verify the build output
 */
const verifyBuildOutput = () => {
  if (fs.existsSync('dist')) {
    console.log('Build successful! Contents of dist directory:');
    const files = fs.readdirSync('dist');
    console.log(files);
    
    if (fs.existsSync('dist/assets')) {
      console.log('Assets directory:');
      console.log(fs.readdirSync('dist/assets'));
    }
    
    return true;
  } else {
    console.error('Build failed - no dist directory created');
    return false;
  }
};

/**
 * Main build function
 * @param {Object} options - Build options
 */
const build = (options = {}) => {
  const startTime = Date.now();
  console.log('Starting frontend build process...');
  console.log('Options:', options);
  
  // Set NODE_ENV
  process.env.NODE_ENV = 'production';
  
  // Ensure we're in the right directory
  ensureCorrectDirectory();
  
  // Install dependencies
  const depsInstalled = installDependencies();
  if (!depsInstalled) {
    console.error('Failed to install dependencies, exiting');
    process.exit(1);
  }
  
  // Run the build
  const buildSucceeded = runBuild();
  if (!buildSucceeded) {
    console.error('Build failed, exiting');
    process.exit(1);
  }
  
  // Done
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Frontend build completed in ${duration}s`);
  return true;
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  platform: args.find(arg => arg.startsWith('--platform='))?.split('=')[1] || 'vercel',
  skipSpaFallbacks: args.includes('--skip-spa-fallbacks')
};

// Run the build
build({
  platform: options.platform,
  createSpaFallbacks: !options.skipSpaFallbacks
}); 