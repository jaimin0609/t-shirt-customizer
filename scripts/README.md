# Utility Scripts

This directory contains utility scripts for the T-Shirt Customizer application.

## Available Scripts

### Security Check Script

**File:** `security-check.js`

**Purpose:** Scans the codebase for potential security issues such as hardcoded secrets, console statements in production code, and potential security vulnerabilities.

**Usage:**
```bash
# Run directly
node scripts/security-check.js

# Run via npm script
npm run security-check
```

**Features:**
- Identifies hardcoded secrets (API keys, passwords, etc.)
- Finds console statements that might be left in production code
- Detects potentially dangerous code patterns (eval, innerHTML, etc.)
- Checks for potential XSS vulnerabilities

### Dependency Check Script

**File:** `check-dependencies.js`

**Purpose:** Checks for outdated dependencies and security vulnerabilities in npm packages across the entire project.

**Usage:**
```bash
# Check for outdated dependencies and security vulnerabilities
node scripts/check-dependencies.js
# or
npm run dependency-check

# Attempt to automatically update dependencies
node scripts/check-dependencies.js --fix
# or
npm run dependency-check:fix

# Only check for security vulnerabilities
node scripts/check-dependencies.js --security
# or
npm run dependency-check:security
```

**Features:**
- Checks dependencies in root, Frontend, and Backend directories
- Identifies outdated packages and their latest versions
- Detects security vulnerabilities and their severity
- Can attempt to automatically update packages with the `--fix` flag
- Provides a summary of findings and next steps

## Adding New Scripts

When adding new utility scripts to this directory:

1. Use a descriptive filename that indicates the script's purpose
2. Include a shebang line (e.g., `#!/usr/bin/env node`) for executable scripts
3. Add proper documentation within the script
4. Make the script executable if needed (`chmod +x script.js` on Unix systems)
5. Add an npm script to package.json for easy access
6. Update this README with information about the new script

## Best Practices

- Scripts should be modular and focused on a single responsibility
- Include proper error handling and user feedback
- Provide clear usage instructions and examples
- Use consistent coding style and formatting
- Add appropriate logging for debugging purposes 