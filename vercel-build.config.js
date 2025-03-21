module.exports = {
  installCommand: 'npm install --no-audit --legacy-peer-deps --force',
  buildCommand: 'cd Frontend && npm install vite@5.4.14 --save-dev --force && sh scripts/deployment/frontend-vercel-build.sh',
  outputDirectory: 'Frontend/dist'
}; 