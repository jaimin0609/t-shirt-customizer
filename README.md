# T-Shirt Customizer

A full-stack web application for customizing and ordering T-shirts online.

## Features

- T-shirt customization with text, images, and designs
- 3D preview of customized products
- User authentication and profile management
- Shopping cart and checkout functionality
- Admin panel for product and order management
- Responsive design for desktop and mobile devices

## Technology Stack

### Frontend
- React with Vite
- Three.js for 3D rendering
- Tailwind CSS for styling
- React Router for navigation
- Axios for API requests

### Backend
- Node.js with Express
- Sequelize ORM
- MySQL database (development)
- PostgreSQL support for deployment
- JWT for authentication
- Multer for file uploads

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- MySQL installed locally

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/t-shirt-customizer.git
   cd t-shirt-customizer
   ```

2. Install dependencies
   ```bash
   npm run build:install
   ```

3. Set up environment variables
   - Create a `.env` file in the root directory based on `.env.example`
   - Create a `.env` file in the Backend directory based on `.env.example`
   - Create a `.env` file in the Frontend directory based on `.env.example`
   - **Important**: Set up a secure JWT_SECRET in the Backend `.env` file by running:
   ```bash
   node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> Backend/.env
   ```

4. Set up the database
   ```bash
   cd Backend
   npx sequelize-cli db:create
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

5. Create an admin user
   ```bash
   npm run create-admin
   ```

### Running the Application

```bash
npm start
```

This will start both the backend and frontend servers in development mode.

- Backend: http://localhost:5002
- Frontend: http://localhost:5173
- Admin panel: http://localhost:5002/admin

## Deployment

For deployment instructions, see the [Deployment Guide](docs/DEPLOYMENT.md).

## Project Structure

```
t-shirt-customizer/
├── docs/                # Documentation files
│   ├── DEPLOYMENT.md    # Deployment instructions
│   ├── SECURITY.md      # Security best practices
│   ├── CLOUDINARY_SETUP.md # Cloudinary integration guide
│   ├── CONTRIBUTING.md  # Contribution guidelines
│   └── CHANGELOG.md     # Version history
│
├── scripts/             # Cross-project scripts
│   ├── deployment/      # General deployment scripts (legacy location)
│   └── setup/           # Setup scripts
│
├── Backend/             # Backend Node.js application
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── migrations/      # Database migrations
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── scripts/         # Backend-specific scripts
│   │   └── deployment/  # Backend deployment scripts for Render
│   ├── services/        # Business logic
│   ├── tests/           # Backend tests
│   ├── utils/           # Utility functions
│   ├── public/          # Static files including admin panel
│   ├── render-build.sh  # Wrapper for Render deployment scripts
│   └── server.js        # Main entry point
│
├── Frontend/            # Frontend React application
│   ├── public/          # Static assets
│   ├── scripts/         # Frontend-specific scripts
│   │   └── deployment/  # Frontend deployment scripts for Vercel
│   ├── src/             # Source code
│   │   ├── assets/      # Images, fonts, etc.
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── layouts/     # Layout components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── styles/      # Global styles
│   │   ├── utils/       # Utility functions
│   │   └── App.jsx      # Root component
│   ├── tests/           # Frontend tests
│   ├── vercel-build.sh  # Wrapper for Vercel deployment scripts
│   └── vite.config.js   # Vite configuration
│
├── .gitignore           # Git ignore file
├── package.json         # Root package.json for scripts
└── README.md            # Project overview
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js for 3D rendering capabilities
- Tailwind CSS for the UI framework
- All open-source libraries used in this project 

## Security Updates

The following security improvements have been implemented:

### Dependency Updates
- Updated `sharp` to version 0.33.2 to fix CVE-2023-4863 vulnerability
- Added `lodash` override (^4.17.21) to fix prototype pollution vulnerability
- Added `glob-parent` override (^5.1.2) to fix security issues

### Authentication & Authorization
- Removed hardcoded JWT fallback secrets
- Improved JWT token validation
- Added proper error handling for missing JWT secrets

### API Security
- Added URL validation to prevent SSRF attacks in axios requests
- Improved CORS configuration with stricter origin checks in production
- Enhanced Content Security Policy (CSP) headers
- Added file type validation for uploads

### Development Environment
- Restricted Vite development server to localhost only
- Added security headers to development server
- Removed unused and duplicate files

For more details on security best practices, see [docs/SECURITY.md](docs/SECURITY.md).

## Contributing

Please read [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Changelog

See [docs/CHANGELOG.md](docs/CHANGELOG.md) for a list of changes in each version. 