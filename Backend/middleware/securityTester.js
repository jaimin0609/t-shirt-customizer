/**
 * Security Testing Middleware
 * This is a development-only middleware to check for common security vulnerabilities
 */

// Only load this middleware in development
const securityTester = (req, res, next) => {
    // Skip security tests in production
    if (process.env.NODE_ENV === 'production') {
        return next();
    }
    
    // Keep track of identified issues
    const securityIssues = [];
    
    // Store original send method to intercept responses
    const originalSend = res.send;
    
    // Override send method to check response headers
    res.send = function(body) {
        // Check for essential security headers
        const headerChecks = [
            { name: 'X-Content-Type-Options', value: 'nosniff' },
            { name: 'X-Frame-Options', expected: /(DENY|SAMEORIGIN)/ },
            { name: 'X-XSS-Protection', expected: /1/ },
            { name: 'Content-Security-Policy', required: false }, // Optional but recommended
            { name: 'Strict-Transport-Security', required: false }, // Optional but recommended
            { name: 'Referrer-Policy', required: false } // Optional but recommended
        ];
        
        headerChecks.forEach(check => {
            const headerValue = this.get(check.name);
            
            // If header is required but missing
            if (headerValue === undefined && check.required !== false) {
                securityIssues.push(`Missing security header: ${check.name}`);
            } else if (headerValue && check.value && headerValue !== check.value) {
                securityIssues.push(`Invalid value for ${check.name}: ${headerValue}, expected: ${check.value}`);
            } else if (headerValue && check.expected && !check.expected.test(headerValue)) {
                securityIssues.push(`Invalid value for ${check.name}: ${headerValue}, doesn't match expected pattern`);
            }
        });
        
        // Check for sensitive information in response body
        if (typeof body === 'string') {
            // Regex patterns for sensitive data
            const sensitivePatterns = [
                { pattern: /"password"\s*:\s*"[^"]+"/i, name: 'password' },
                { pattern: /"secret"\s*:\s*"[^"]+"/i, name: 'secret' },
                { pattern: /"token"\s*:\s*"[^"]+"/i, name: 'token (except in auth responses)' },
                { pattern: /\b(?:\d[ -]*?){13,16}\b/, name: 'credit card number' },
                { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, name: 'email address' }
            ];
            
            // Skip token check for auth-related endpoints
            const isAuthEndpoint = req.path.includes('/auth/') || req.path.includes('/login') || req.path.includes('/register');
            
            sensitivePatterns.forEach(({ pattern, name }) => {
                // Skip token check for auth endpoints
                if (name === 'token (except in auth responses)' && isAuthEndpoint) {
                    return;
                }
                
                if (pattern.test(body)) {
                    securityIssues.push(`Potential sensitive information (${name}) in response body`);
                }
            });
            
            // Check for potential XSS vulnerabilities in HTML responses
            if (res.get('Content-Type')?.includes('text/html')) {
                // Look for unescaped data insertion or script tags
                const xssPatterns = [
                    { pattern: /<script>.*?<\/script>/i, name: 'Inline script tags' },
                    { pattern: /javascript:/i, name: 'JavaScript protocol' },
                    { pattern: /on\w+\s*=\s*["'][^"']*["']/i, name: 'HTML event handlers' }
                ];
                
                xssPatterns.forEach(({ pattern, name }) => {
                    if (pattern.test(body)) {
                        securityIssues.push(`Potential XSS vulnerability: ${name}`);
                    }
                });
            }
        }
        
        // If security issues were found, log them
        if (securityIssues.length > 0) {
            console.warn('\n⚠️ SECURITY WARNING ⚠️');
            console.warn(`Request to ${req.method} ${req.originalUrl} has security issues:`);
            securityIssues.forEach(issue => console.warn(`- ${issue}`));
            console.warn('Fix these issues before deploying to production!\n');
        }
        
        // Call the original send method
        return originalSend.call(this, body);
    };
    
    next();
};

export default securityTester; 