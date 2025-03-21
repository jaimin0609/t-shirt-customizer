/**
 * Fallback build script for emergency deployments
 * This script creates a simple static site when the main build fails
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create dist directory
console.log('Creating fallback build...');
const frontendDir = path.resolve(__dirname, '../../Frontend');
const distDir = path.join(frontendDir, 'dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
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
  <style>
    body { background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .card { background-color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .status { margin-top: 20px; padding: 10px; background-color: #f0f5ff; border-radius: 4px; }
  </style>
</head>
<body class="min-h-screen bg-gray-100">
  <div class="container mx-auto py-12 px-4">
    <div class="card p-6">
      <h1 class="text-2xl font-bold mb-4 text-blue-600">T-Shirt Customizer</h1>
      <p class="mb-4">Welcome to the T-Shirt Customizer app!</p>
      <p class="text-gray-600 mb-6">We're preparing your experience. The application will be fully available soon.</p>
      
      <div class="status">
        <p class="font-semibold">Deployment Status:</p>
        <p>Your deployment is being processed. This page will update automatically.</p>
      </div>
    </div>
  </div>
  <script>
    // Auto-refresh every 30 seconds to check for deployment completion
    setTimeout(() => { window.location.reload(); }, 30000);
  </script>
</body>
</html>
`;

// Write the index.html file
fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);

// Create a 404.html file that's the same as index.html
fs.writeFileSync(path.join(distDir, '404.html'), htmlContent);

// Create a 200.html file for SPA hosting platforms
fs.writeFileSync(path.join(distDir, '200.html'), htmlContent);

// Create an assets directory with a placeholder CSS file
const assetsDir = path.join(distDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a basic CSS file
fs.writeFileSync(path.join(assetsDir, 'style.css'), `
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}
`);

console.log('Fallback build created successfully:');
console.log(`- ${path.join(distDir, 'index.html')}`);
console.log(`- ${path.join(distDir, '404.html')}`);
console.log(`- ${path.join(distDir, '200.html')}`);
console.log(`- ${path.join(assetsDir, 'style.css')}`);

// Create a _redirects file for Netlify
fs.writeFileSync(path.join(distDir, '_redirects'), `
# Netlify redirects file
/*    /index.html   200
`);

console.log('Fallback build completed successfully'); 