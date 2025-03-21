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
 * Run the build process
 */
const runBuild = () => {
  console.log('Building application...');

  // Ensure dependencies before building
  ensureTailwindDependencies();

  // Install Vite explicitly with correct version
  console.log('Installing Vite 6.2.2 explicitly...');
  try {
    // First install Vite globally in the project
    execCommand('npm install vite@6.2.2 --save-dev --force --legacy-peer-deps');
    // Then install related plugins
    execCommand('npm install @vitejs/plugin-react postcss tailwindcss autoprefixer --save-dev --force --legacy-peer-deps');
  } catch (error) {
    console.warn('Warning: Could not install Vite 6.2.2:', error.message);
  }

  // Ensure critical CSS is available
  ensureCriticalCss();

  try {
    // Use npx to run vite directly, which will handle finding the right binary
    console.log('Using npx to run vite with specific version');
    
    // Run the build using npx to ensure correct resolution
    execCommand('npx --yes vite@6.2.2 build');

    // Create SPA fallbacks
    createSpaFallbacks();

    // Verify build output
    return verifyBuildOutput();
  } catch (error) {
    console.error('Build failed:', error.message);
    console.log('Attempting emergency build with direct installation...');
    
    // Try emergency build with a different approach
    try {
      // Try a global install approach
      execCommand('npm install -g vite@6.2.2 --force');
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
    // Use --force to bypass engine checks
    execCommand('npm install --save-dev tailwindcss postcss autoprefixer --force --legacy-peer-deps');
    return true;
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
  
  if (!fs.existsSync(criticalCssPath)) {
    console.log('Generating critical CSS...');
    
    // Create public directory if it doesn't exist
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public', { recursive: true });
    }
    
    // Find the main CSS file
    let sourceCss = '';
    if (fs.existsSync('src/styles/index.css')) {
      sourceCss = fs.readFileSync('src/styles/index.css', 'utf8');
    } else if (fs.existsSync('src/index.css')) {
      sourceCss = fs.readFileSync('src/index.css', 'utf8');
    } else {
      console.warn('Could not find main CSS file, creating empty critical CSS');
      sourceCss = '/* Critical CSS placeholder */';
    }
    
    // Write critical CSS
    fs.writeFileSync(criticalCssPath, sourceCss);
    console.log('Critical CSS generated');
  }
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