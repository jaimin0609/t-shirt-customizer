# T-Shirt Customizer Deployment Guide

This guide provides instructions for deploying the T-Shirt Customizer application to various free platforms.

## Prerequisites

- GitHub repository with the latest code
- Node.js and npm installed on your development machine

## Database Migration

The application has been updated to support both MySQL (development) and PostgreSQL (production deployment).

### Local Setup with MySQL

1. Use the `.env` file with MySQL configuration:

```
DB_DIALECT=mysql
DB_NAME=tshirt_customizer
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
```

### Deployment Setup with PostgreSQL

For deployment, use the PostgreSQL configuration with the `DATABASE_URL`:

```
DATABASE_URL=postgres://username:password@host:port/database
```

## Deployment Options

### Backend Deployment

Choose one of the following platforms:

#### Option 1: Render.com (Recommended)

1. Sign up for a free account at [Render](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure the service:
   - Name: `t-shirt-customizer-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add the following environment variables:
     - `DATABASE_URL`: Your PostgreSQL connection string (create a PostgreSQL database in Render)
     - `JWT_SECRET`: A secure random string
     - `NODE_ENV`: `production`
     - `FRONTEND_URL`: Your frontend deployment URL
     - `STRIPE_SECRET_KEY`: Your Stripe secret key
     - `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

#### Option 2: Railway.app

1. Sign up for a free account at [Railway](https://railway.app)
2. Create a new project and connect your GitHub repository
3. Add a PostgreSQL database to your project
4. Configure environment variables similar to the Render setup

### Frontend Deployment

#### Option 1: Vercel (Recommended)

1. Sign up for a free account at [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure the project:
   - Framework Preset: `Vite`
   - Root Directory: `Frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables:
     - `VITE_API_URL`: Your backend deployment URL (e.g., `https://t-shirt-customizer-backend.onrender.com`)
     - `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

#### Option 2: Netlify

1. Sign up for a free account at [Netlify](https://netlify.com)
2. Import your GitHub repository
3. Configure the build settings:
   - Base directory: `Frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Add environment variables similar to the Vercel setup

## Post-Deployment Tasks

1. Initialize your database (for the first time):
   - Go to your backend service dashboard
   - Open the shell/console
   - Run: `npx sequelize-cli db:migrate`
   - Run: `node scripts/createAdmin.js` to create an admin user

2. Test your application:
   - Navigate to your frontend URL
   - Verify that you can log in with the admin credentials
   - Test product creation, ordering, and payment processes

## Monitoring and Maintenance

1. **Logging**: 
   - Both Render and Railway provide built-in logs
   - Consider adding a service like [LogTail](https://logtail.com/) for more advanced logging

2. **Performance Monitoring**:
   - Set up [UptimeRobot](https://uptimerobot.com/) (free) to monitor your application's uptime

3. **Regular Updates**:
   - Periodically update your dependencies to ensure security and performance
   - Commit changes to your repository, which will trigger automatic redeployment

## Troubleshooting

If you encounter issues after deployment:

1. Check the logs in your deployment platform
2. Verify that all environment variables are correctly set
3. Ensure database migrations have been applied
4. Check network connectivity between frontend and backend services
5. Verify CORS settings in the backend are correctly configured for your frontend URL 