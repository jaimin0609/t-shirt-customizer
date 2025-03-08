# T-Shirt Customizer E-commerce Application

A full-stack e-commerce application for customizing and purchasing t-shirts with product variant support.

## Features

- Product management with variant support (colors, sizes)
- User authentication and authorization
- Shopping cart functionality
- Order processing
- Payment integration with Stripe
- Promotion and coupon system
- Admin dashboard for product and order management

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT
- **Payment Processing**: Stripe

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   cd Frontend && npm install
   cd Backend && npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env` in both Frontend and Backend directories
   - Update the values as needed

4. Start the development servers:
   ```
   npm start
   ```

## Production Deployment

1. Update environment variables for production:
   - In Backend/.env:
     - Set `NODE_ENV=production`
     - Update `FRONTEND_URL` to your production domain
     - Add real Stripe API keys
     - Use a strong JWT secret

   - In Frontend/.env:
     - Update `VITE_API_URL` to your production API endpoint

2. Build the frontend:
   ```
   npm run build:frontend
   ```

3. Deploy the application:
   ```
   npm run deploy
   ```

## Database Migrations

To run database migrations:
```
cd Backend
npx sequelize-cli db:migrate
```

## Security Considerations

- The application includes rate limiting and security headers in production
- JWT tokens expire after 24 hours
- Password hashing is implemented for user authentication
- Input validation is performed on all API endpoints

## License

[MIT License](LICENSE) 