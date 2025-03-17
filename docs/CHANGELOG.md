# Changelog

All notable changes to the T-Shirt Customizer project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project structure reorganization
- Added CONTRIBUTING.md and CHANGELOG.md

## [1.0.0] - 2024-03-17

### Added
- Initial release of T-Shirt Customizer
- T-shirt customization with text, images, and designs
- 3D preview of customized products
- User authentication and profile management
- Shopping cart and checkout functionality
- Admin panel for product and order management
- Responsive design for desktop and mobile devices

### Security
- Updated `sharp` to version 0.33.2 to fix CVE-2023-4863 vulnerability
- Added `lodash` override (^4.17.21) to fix prototype pollution vulnerability
- Added `glob-parent` override (^5.1.2) to fix security issues
- Removed hardcoded JWT fallback secrets
- Improved JWT token validation
- Added proper error handling for missing JWT secrets
- Added URL validation to prevent SSRF attacks in axios requests
- Improved CORS configuration with stricter origin checks in production
- Enhanced Content Security Policy (CSP) headers
- Added file type validation for uploads 