module.exports = {
  installCommand: 'npm install --no-audit --legacy-peer-deps --force',
  buildCommand: 'cd Frontend && npm install vite@5.4.14 @vitejs/plugin-react postcss tailwindcss autoprefixer --save-dev --force --legacy-peer-deps && npx cross-env VITE_FORCE_VERSION=5.4.14 sh scripts/deployment/frontend-vercel-build.sh',
  outputDirectory: 'Frontend/dist'
}; 