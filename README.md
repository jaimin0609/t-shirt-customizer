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

For deployment instructions, see the [Deployment Guide](DEPLOYMENT.md).

## Project Structure

```
t-shirt-customizer/
├── Backend/             # Backend Node.js application
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── public/          # Static files including admin panel
│   ├── scripts/         # Utility scripts
│   └── server.js        # Main entry point
│
├── Frontend/            # Frontend React application
│   ├── public/          # Static assets
│   └── src/             # Source code
│       ├── components/  # React components
│       ├── contexts/    # React contexts
│       ├── pages/       # Page components
│       ├── services/    # API services
│       └── utils/       # Utility functions
│
└── package.json         # Root package.json for scripts
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js for 3D rendering capabilities
- Tailwind CSS for the UI framework
- All open-source libraries used in this project 