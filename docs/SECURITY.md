# Security Best Practices

This document outlines important security considerations for the T-Shirt Customizer application.

## Authentication and Authorization

### JWT Token Security

The application uses JWT (JSON Web Token) for authentication with the following security measures:

- **Token Blacklisting**: Tokens are blacklisted on logout to prevent reuse
- **Token Versioning**: Tokens are invalidated when passwords change
- **Secure Claims**: Tokens include issuer and audience claims for additional validation
- **Short Expiration**: Tokens expire after 24 hours by default
- **Rate Limiting**: Authentication endpoints have strict rate limiting to prevent brute force attacks

### Password Policies

The application enforces strong password requirements:

- Minimum 8 characters in length
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number
- Must contain at least one special character
- Blocks common passwords ("password123", etc.)
- Passwords are hashed using bcrypt with a work factor of 12

### Account Protection

- Account lockout after 5 failed login attempts for 30 minutes
- User IP is tracked to prevent repeated login attempts
- Password reset tokens expire after 1 hour
- Email verification required for new accounts

## Input Validation and Sanitization

- All user inputs are validated and sanitized server-side
- Input length limits prevent buffer overflow attacks
- Input format validation ensures data integrity
- HTML content is stripped from user inputs to prevent XSS
- File uploads are validated for type, size, and content

## Security Headers

The application uses Helmet.js to set the following security headers:

- **Content-Security-Policy**: Restricts which resources can be loaded
- **Strict-Transport-Security**: Forces HTTPS connections
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser XSS filters
- **Referrer-Policy**: Controls referrer information
- **Feature-Policy**: Restricts browser features on your site

## Cross-Site Request Forgery (CSRF) Protection

- CSRF tokens required for state-changing operations
- Tokens are delivered via secure, HttpOnly cookies
- Origin validation for all state-changing requests

## Cross-Origin Resource Sharing (CORS)

- Strict CORS policy allowing only trusted origins
- Pre-flight requests validated for all cross-origin requests
- Credentials only allowed from trusted sources

## Rate Limiting

- Global rate limiting to prevent DoS attacks
- Stricter limits on authentication endpoints
- IP-based rate limiting to prevent abuse

## Environment Variables

### JWT Secret Key

A secure JWT secret key is critical for the security of your application.

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

## Database Security

- Parameterized queries prevent SQL injection
- Limited database user permissions
- Database credentials protected via environment variables
- Input validation to prevent NoSQL injection attacks

## Error Handling

- Sanitized error messages in production
- Full error details logged server-side but not exposed to clients
- Custom error responses for common error scenarios

## File Upload Security

- File type validation using content-type and magic bytes
- File size limits to prevent DoS attacks
- Files stored outside web root or in secure cloud storage
- Files sanitized before processing

## Logging and Monitoring

- Security events are logged with appropriate level
- Authentication attempts (successful and failed) are logged
- Admin actions are logged for audit purposes
- Sensitive data is redacted from logs

## Vulnerabilities

If you discover a security vulnerability, please contact the development team at:
[security@yourcompany.com](mailto:security@yourcompany.com)

Do not disclose the vulnerability publicly until it has been addressed.

## Security Checklist

- [x] Implement secure JWT token handling
- [x] Enforce strong password policies
- [x] Set up account lockout after failed attempts
- [x] Add CSRF protection
- [x] Configure proper security headers
- [x] Sanitize all user inputs
- [x] Validate input formats
- [x] Set up rate limiting
- [x] Configure proper CORS policies
- [x] Implement error sanitization
- [x] Add database security measures
- [x] Secure file uploads
- [x] Add proper logging 