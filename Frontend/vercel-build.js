import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get current file URL and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';

console.log('Starting Vercel custom build script...');

// Path to node_modules/.bin/vite
const viteBin = resolve(__dirname, 'node_modules', '.bin', 'vite');

console.log(`Using Vite binary at: ${viteBin}`);

// Run vite build
const buildProcess = spawn(viteBin, ['build'], { 
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