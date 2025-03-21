/**
 * Static Build Script for Vercel Deployment
 * Creates a simple static site without complex dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting static build process...');
console.log('Node version:', process.version);

// Create Frontend/dist directory
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'Frontend/dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory:', distDir);
}

// Create a simple index.html with inline Tailwind CSS via CDN
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>T-Shirt Customizer</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: {
              50: '#f0f5ff',
              100: '#e0ebff',
              200: '#c7d9ff',
              300: '#a4beff',
              400: '#8199ff',
              500: '#4a6cf7', 
              600: '#3a57d7',
              700: '#2a47b7',
              800: '#1a3797',
              900: '#0a2777',
            }
          }
        }
      }
    }
  </script>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
    }
    .loading-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      width: 100%;
    }
    .t-shirt-icon {
      width: 120px;
      height: 120px;
      margin-bottom: 2rem;
      animation: bounce 2s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
  </style>
</head>
<body>
  <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <span class="text-xl font-bold text-primary-600">T-Shirt Customizer</span>
          </div>
        </div>
      </div>
    </nav>
    
    <main class="py-10">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
          <div class="px-4 py-5 sm:px-6">
            <h2 class="text-lg font-medium text-gray-900">Welcome to T-Shirt Customizer</h2>
          </div>
          <div class="px-4 py-5 sm:p-6">
            <div class="text-center">
              <svg class="t-shirt-icon mx-auto" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4a6cf7" d="M16 21H8a1 1 0 0 1-1-1v-9l-1.857-3.716A1 1 0 0 1 6 6h12a1 1 0 0 1 .857 1.284L17 11v9a1 1 0 0 1-1 1zm-7-2h6v-8.101l1.357-2.717H7.643L9 10.899V19zm8-12h-2.5a2 2 0 0 1-1.5-.667A2 2 0 0 1 11.5 5H9a1 1 0 0 1 0-2h2.5a4 4 0 0 0 3 1.333A4 4 0 0 0 17.5 3H20a1 1 0 0 1 0 2h-2.5a2 2 0 0 1-1.5.667A2 2 0 0 1 14.5 7z"/>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">Site is being prepared</h3>
              <p class="mt-1 text-sm text-gray-500">Our application is currently being deployed</p>
              <div class="mt-6">
                <span class="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Deployment in progress
                </span>
              </div>
            </div>
          </div>
          <div class="px-4 py-4 sm:px-6">
            <p class="text-sm text-gray-500">This page will automatically refresh when the application is ready.</p>
          </div>
        </div>
      </div>
    </main>
  </div>
  
  <script>
    // Auto-refresh every 30 seconds
    setTimeout(() => window.location.reload(), 30000);
  </script>
</body>
</html>
`;

// Write the index.html file
fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);

// Create a 404.html file (same as index.html for SPA)
fs.writeFileSync(path.join(distDir, '404.html'), htmlContent);

// Create a _redirects file for Netlify compatibility
fs.writeFileSync(path.join(distDir, '_redirects'), `
# Netlify redirects file
/*    /index.html   200
`);

// Copy files from public if it exists
const publicDir = path.join(rootDir, 'Frontend/public');
if (fs.existsSync(publicDir)) {
  try {
    console.log('Copying public assets...');
    // List files in public directory
    const publicFiles = fs.readdirSync(publicDir);
    console.log('Public files found:', publicFiles);
    
    // Create assets directory
    const assetsDir = path.join(distDir, 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Copy favicon if it exists
    if (fs.existsSync(path.join(publicDir, 'favicon.ico'))) {
      fs.copyFileSync(
        path.join(publicDir, 'favicon.ico'),
        path.join(distDir, 'favicon.ico')
      );
    }
  } catch (err) {
    console.error('Error copying public files:', err);
  }
}

console.log('Static build completed successfully!');
console.log('Files created:');
console.log(' - index.html');
console.log(' - 404.html');
console.log(' - _redirects');

// Show the dist directory contents
try {
  const distContents = fs.readdirSync(distDir);
  console.log('Dist directory contents:', distContents);
} catch (err) {
  console.error('Error listing dist contents:', err);
} 