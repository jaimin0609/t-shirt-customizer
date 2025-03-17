# DEPRECATED DEPLOYMENT SCRIPTS

This directory contains legacy deployment scripts that have been moved to component-specific locations:

- **Backend deployment scripts**: `Backend/scripts/deployment/`
- **Frontend deployment scripts**: `Frontend/scripts/deployment/`

## Why were these scripts moved?

The deployment scripts were reorganized to:
1. Improve project organization and maintainability
2. Keep deployment scripts closer to the code they deploy
3. Make the project structure more intuitive for new developers
4. Separate frontend and backend concerns

## How to use the new scripts

### Backend Deployment (Render)
Use the wrapper scripts in the Backend directory:
- `Backend/render-build.sh`: Standard build script
- `Backend/render-build-with-migration.sh`: Build script that includes database migrations

### Frontend Deployment (Vercel)
Use the wrapper script in the Frontend directory:
- `Frontend/vercel-build.sh`: Main build script for Vercel

## Timeline for removal

This directory is scheduled for removal after 2-3 successful deployment cycles with the new structure (estimated: 30-60 days from reorganization).

## Questions?

Refer to `docs/DEPLOYMENT.md` for comprehensive deployment documentation. 