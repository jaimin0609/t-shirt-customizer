module.exports = {
  installCommand: 'npm install --no-audit --legacy-peer-deps --force',
  buildCommand: 'cd Frontend && npm install vite@6.2.2 @vitejs/plugin-react postcss tailwindcss autoprefixer --save-dev --force --legacy-peer-deps && npx cross-env NODE_ENV=production sh scripts/deployment/frontend-vercel-build.sh',
  outputDirectory: 'Frontend/dist'
}; 