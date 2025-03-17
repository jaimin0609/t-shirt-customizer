# Deployment Guide

This document provides instructions for deploying the T-Shirt Customizer application to production environments.

## Deployment Architecture

The T-Shirt Customizer application uses a split deployment architecture:

- **Backend**: Deployed on [Render](https://render.com)
- **Frontend**: Deployed on [Vercel](https://vercel.com)

This separation allows for optimal performance and scaling of each component independently.

## Backend Deployment (Render)

### Deployment Scripts

The backend deployment scripts are located in the `Backend/scripts/deployment/` directory:

- `render-build.sh`: Standard build script for Render
- `render-build-with-migration.sh`: Build script that includes database migrations
- `backend-render-build.sh`: Alternative build script with specific optimizations

These scripts are called by wrapper scripts in the root of the Backend directory:

- `Backend/render-build.sh`: Wrapper for the standard build script
- `Backend/render-build-with-migration.sh`: Wrapper for the migration build script

### Deployment Steps

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following settings:
   - **Name**: t-shirt-customizer-backend (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `./render-build-with-migration.sh`
   - **Start Command**: `npm run start:prod`
   - **Plan**: Choose an appropriate plan based on your needs

4. Add the following environment variables:
   - `NODE_ENV`: production
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string
   - `CORS_ORIGIN`: Your frontend URL (e.g., https://t-shirt-customizer.vercel.app)
   - Any other environment variables required by your application

5. Click "Create Web Service"

## Frontend Deployment (Vercel)

### Deployment Scripts

The frontend deployment scripts are located in the `Frontend/scripts/deployment/` directory:

- `frontend-vercel-build.sh`: Main build script for Vercel
- `vercel-prebuild.sh`: Script that runs before the build
- `vercel-build.js`: JavaScript build helper
- `vercel-setup.cjs`: Setup script for Vercel environment

These scripts are called by a wrapper script in the root of the Frontend directory:

- `Frontend/vercel-build.sh`: Wrapper for the Vercel build script

### Deployment Steps

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Configure the following settings:
   - **Framework Preset**: Other
   - **Build Command**: Override to `npm run build:vercel`
   - **Output Directory**: dist
   - **Install Command**: npm install

4. Add the following environment variables:
   - `VITE_API_URL`: Your backend API URL (e.g., https://t-shirt-customizer-backend.onrender.com)
   - `VITE_STRIPE_PUBLIC_KEY`: Your Stripe public key (if using Stripe)
   - Any other environment variables required by your application

5. Click "Deploy"

## Continuous Deployment

Both Render and Vercel support continuous deployment from GitHub. When you push changes to your repository:

- Render will automatically rebuild and deploy the backend
- Vercel will automatically rebuild and deploy the frontend

## Troubleshooting

### Backend Deployment Issues

- **Sharp Installation Errors**: The deployment scripts include special handling for the Sharp image processing library. If you encounter issues, check the build logs for specific errors.
- **Database Migration Failures**: If migrations fail, you can manually run them using the Render shell or connect directly to your database.

### Frontend Deployment Issues

- **Build Failures**: Check the Vercel build logs for specific errors. Common issues include missing dependencies or environment variables.
- **API Connection Issues**: Ensure the CORS settings on the backend allow requests from your frontend domain.

## Monitoring

- Use Render's built-in logs and metrics to monitor backend performance
- Use Vercel's analytics to monitor frontend performance
- Consider adding additional monitoring tools like Sentry for error tracking

## Scaling

- Render allows you to scale your backend service as needed
- Vercel automatically scales your frontend globally through their CDN

## Deployment Checklist

Before deploying to production, ensure you:

1. **Database Preparation**
   - [ ] Back up existing production database (if applicable)
   - [ ] Verify all migrations run successfully locally
   - [ ] Check for any data integrity issues

2. **Code Preparation**
   - [ ] Merge all feature branches to main/develop
   - [ ] Resolve all merge conflicts
   - [ ] Run all tests and ensure they pass
   - [ ] Check for console logs and debugging code
   - [ ] Verify environment variables are properly set in deployment platforms

3. **Security Checks**
   - [ ] Check for hardcoded credentials or sensitive data
   - [ ] Verify proper CORS configuration
   - [ ] Ensure all API endpoints are properly authenticated
   - [ ] Check for exposed API keys or secrets
   - [ ] Run security scanning tools (if available)

4. **Performance Checks**
   - [ ] Run Lighthouse or similar tool to check performance
   - [ ] Verify the bundle size is reasonable
   - [ ] Check for memory leaks
   - [ ] Test under load if possible

5. **Post-Deployment**
   - [ ] Verify the application loads without errors
   - [ ] Test critical flows end-to-end
   - [ ] Monitor error logs for the first 24 hours
   - [ ] Check performance metrics
   - [ ] Verify third-party integrations work

## Security Best Practices

To ensure your deployment is secure:

1. **Environment Variables**
   - Never commit `.env` files to the repository
   - Use platform-specific environment variable features
   - Regularly rotate secrets and API keys

2. **API Security**
   - Implement rate limiting
   - Use HTTPS for all communications
   - Validate all input data
   - Implement proper CORS policies

3. **Database Security**
   - Use parameterized queries
   - Limit database user permissions
   - Encrypt sensitive data
   - Regularly backup data

4. **Monitoring and Response**
   - Set up error monitoring with tools like Sentry
   - Create an incident response plan
   - Regularly review logs for suspicious activity
   - Set up alerts for unusual behavior

## Additional Resources

- [Securing Node.js Applications](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Security Best Practices](https://reactjs.org/docs/security.html)
- [Vercel Security Guidelines](https://vercel.com/docs/concepts/security)
- [Render Security Documentation](https://render.com/docs/security)

For more detailed information on specific deployment aspects, refer to the [Render documentation](https://render.com/docs) and [Vercel documentation](https://vercel.com/docs). 