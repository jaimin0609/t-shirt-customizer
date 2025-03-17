# Security Best Practices

This document outlines important security considerations for the T-Shirt Customizer application.

## Environment Variables

### JWT Secret Key

The application uses JWT (JSON Web Token) for authentication. A secure JWT secret key is critical for the security of your application.

#### For Development

1. Generate a secure random string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Add this key to your `Backend/.env` file:
   ```
   JWT_SECRET=your_generated_key_here
   ```

#### For Production

Always use a strong, randomly generated secret for production environments. Never use default values.

1. Generate a new secret key for production:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Set this as an environment variable in your production environment. The method depends on your hosting provider:
   - Heroku: Use config vars in the dashboard or CLI
   - AWS: Use environment variables in your ECS/EC2 configuration
   - Other cloud providers: Use their secrets/environment variable management

3. Rotate keys periodically (e.g., every 30-90 days) for additional security.

## Password Storage

- Passwords are hashed using bcrypt before storage
- Never store plaintext passwords anywhere in the codebase
- Always use secure, high-entropy password hashing methods

## API Security

- All API routes use authentication middleware where appropriate
- Role-based access control (RBAC) is implemented for admin functions
- Input validation is performed on all API endpoints

## Frontend Security

- CSP (Content Security Policy) headers are properly configured
- Authentication tokens are stored securely and not exposed to XSS attacks
- All forms have CSRF protection

## Vulnerabilities

If you discover a security vulnerability, please contact the development team at:
[security@yourcompany.com](mailto:security@yourcompany.com)

Do not disclose the vulnerability publicly until it has been addressed. 