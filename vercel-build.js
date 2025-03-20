const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Vercel build script...');

// Check if we're in the correct directory structure
const isInRoot = fs.existsSync(path.join(process.cwd(), 'Frontend'));
const isInFrontend = fs.existsSync(path.join(process.cwd(), 'src'));

try {
  if (isInRoot) {
    console.log('Found Frontend directory in current path. Building from project root.');
    execSync('cd Frontend && npm install && npm run build', { stdio: 'inherit' });
    
    // Ensure the dist directory exists
    const distDir = path.join(process.cwd(), 'Frontend', 'dist');
    if (fs.existsSync(distDir)) {
      // Copy the built files to the expected location
      if (!fs.existsSync(path.join(process.cwd(), 'dist'))) {
        fs.mkdirSync(path.join(process.cwd(), 'dist'), { recursive: true });
      }
      
      // Copy all files from Frontend/dist to dist
      execSync('cp -r Frontend/dist/* dist/', { stdio: 'inherit' });
      
      // Create 404.html for SPA routing
      fs.copyFileSync(
        path.join(process.cwd(), 'Frontend', 'dist', 'index.html'),
        path.join(process.cwd(), 'dist', '404.html')
      );
      
      console.log('Build completed successfully!');
    } else {
      throw new Error('Build completed but dist directory not found');
    }
  } else if (isInFrontend) {
    console.log('Already in Frontend directory. Building directly.');
    execSync('npm install && npm run build', { stdio: 'inherit' });
    
    // Create 404.html for SPA routing
    if (fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))) {
      fs.copyFileSync(
        path.join(process.cwd(), 'dist', 'index.html'),
        path.join(process.cwd(), 'dist', '404.html')
      );
    }
    
    console.log('Build completed successfully!');
  } else {
    throw new Error('Could not determine project structure. Neither Frontend directory nor src directory found.');
  }
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} 