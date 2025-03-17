# Dependency Migration Plan

This document outlines the plan for safely updating dependencies with security vulnerabilities in the T-Shirt Customizer application.

## Overview

Our dependency check has identified multiple security vulnerabilities across the codebase. This migration plan prioritizes the most critical updates while minimizing the risk of breaking changes.

## High-Priority Security Vulnerabilities

### Frontend
| Package | Current Version | Target Version | Severity | Impact |
|---------|----------------|----------------|----------|--------|
| axios | <1.8.2 | ^1.8.2 | High | API requests |
| @react-three/drei | ≤9.96.2 | ^10.0.0 | High | 3D rendering |
| lodash.pick | ≥4.0.0 | (Replace) | High | Utility functions |
| vite | 0.11.0-6.1.1 | ^6.2.2 | Moderate | Build system |

### Backend
| Package | Current Version | Target Version | Severity | Impact |
|---------|----------------|----------------|----------|--------|
| nodemon | 2.0.19-2.0.22 | ^3.0.1 | High | Development server |
| semver | 7.0.0-7.5.1 | ^7.5.2 | High | Version management |
| sharp | <0.32.6 | (via multer-sharp-resizer) | High | Image processing |
| multer-sharp-resizer | * | (Replace) | High | File uploads |

## Update Strategy

### Phase 1: Critical Security Updates (Current)

1. Run the security update script to address high-severity vulnerabilities:
   ```bash
   npm run security-update
   ```

   This script will:
   - Create backups of your package.json files
   - Update critical packages with high-severity vulnerabilities
   - Update related packages to maintain compatibility
   - Run tests after updates when available

2. Update packages separately by component if needed:
   ```bash
   npm run security-update:frontend
   npm run security-update:backend
   ```

### Phase 2: Replacement of Problematic Packages

For packages that cannot be directly updated:

#### Replacing multer-sharp-resizer
1. Install alternatives:
   ```bash
   cd Backend
   npm uninstall multer-sharp-resizer
   npm install multer sharp@0.33.0 --save
   ```

2. Refactor the code:
   ```javascript
   // Old implementation with multer-sharp-resizer
   const { upload, imageProcess } = require('multer-sharp-resizer');

   // New implementation with multer and sharp
   const multer = require('multer');
   const sharp = require('sharp');
   const upload = multer({ dest: 'uploads/' });

   // Process image after upload
   const processImage = async (file, width, height) => {
     return sharp(file.path)
       .resize(width, height)
       .toBuffer();
   };
   ```

#### Replacing lodash.pick with native JavaScript
```javascript
// Old implementation
const pick = require('lodash.pick');
const userDetails = pick(user, ['id', 'name', 'email']);

// New implementation
const userDetails = (({ id, name, email }) => ({ id, name, email }))(user);
```

### Phase 3: Remaining Moderate and Low Severity Updates

After confirming that critical updates are working properly:

1. Run audit fix to address remaining issues:
   ```bash
   cd Frontend
   npm audit fix
   
   cd ../Backend
   npm audit fix
   ```

2. Re-run the dependency check to verify improvements:
   ```bash
   npm run dependency-check
   ```

## Testing Plan

After each phase of updates:

1. **Unit Tests**: Run existing unit tests in both Frontend and Backend
2. **Integration Tests**: Test critical workflows
3. **Manual Testing**: Manually verify key features:
   - User authentication
   - Product browsing and filtering
   - Shopping cart functionality
   - Checkout process
   - Admin dashboard features
   - Image upload and customization

## Rollback Plan

If issues arise after updates:

1. Restore from package.json backups:
   ```bash
   # Find the backup file
   ls -la Frontend/package.json.backup-*
   
   # Restore the backup
   cp Frontend/package.json.backup-[timestamp] Frontend/package.json
   ```

2. Reinstall original dependencies:
   ```bash
   cd Frontend
   npm install
   
   cd ../Backend
   npm install
   ```

## Long-Term Dependency Management

To prevent future security issues:

1. Set up regular dependency checks:
   ```bash
   # Add to CI/CD pipeline or run weekly
   npm run dependency-check
   ```

2. Add a pre-commit hook to check for vulnerabilities

3. Consider using dependency monitoring tools like Dependabot or Snyk

4. Update the `security-update.js` script as new vulnerabilities are discovered 