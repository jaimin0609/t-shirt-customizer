import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Get current file URL and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';

console.log('Starting Vercel custom build script...');

// Try multiple possible paths for vite
const possibleVitePaths = [
  '/node22/bin/vite', // Global install from prebuild script
  resolve(__dirname, 'node_modules', '.bin', 'vite'),
  '/vercel/path0/node_modules/.bin/vite',
  'vite' // Just use vite command and let PATH resolve it
];

// Find the first existing vite path or default to 'vite'
let viteBin = 'vite';
for (const path of possibleVitePaths) {
  if (path === 'vite' || existsSync(path)) {
    viteBin = path;
    break;
  }
}

console.log(`Using Vite binary at: ${viteBin}`);

// Run vite build directly with npx
console.log('Executing: npx vite build');
const buildProcess = spawn('npx', ['vite', 'build'], { 
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'production' }
});

buildProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Vite build failed with code ${code}`);
    process.exit(code);
  }
  console.log('Build completed successfully');
}); 