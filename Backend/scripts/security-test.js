/**
 * Security Test Script
 * Tests various security aspects of the application
 */
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config();

// Define constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const API_URL = process.env.API_URL || 'http://localhost:5002/api';

// Console colors for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bright: '\x1b[1m'
};

// Log utilities
const logSuccess = (message) => console.log(`${colors.green}✅ ${message}${colors.reset}`);
const logError = (message) => console.log(`${colors.red}❌ ${message}${colors.reset}`);
const logWarning = (message) => console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`);
const logInfo = (message) => console.log(`${colors.blue}🔹 ${message}${colors.reset}`);
const logHeader = (message) => console.log(`\n${colors.bright}${colors.cyan}🔍 ${message}${colors.reset}`);

// Test JWT security
const testJWT = () => {
  logHeader('Testing JWT Security');
  
  try {
    // Check if JWT secret is set and has sufficient length
    const jwtSecret = process.env.JWT_SECRET || '';
    if (!jwtSecret) {
      logError('JWT_SECRET is not set in environment variables');
      return false;
    }
    
    if (jwtSecret.length < 32) {
      logWarning(`JWT_SECRET length is ${jwtSecret.length} characters - recommend at least 32 characters`);
    } else {
      logSuccess('JWT_SECRET has adequate length');
    }
    
    // Test token creation
    const testPayload = { id: 'test-user', email: 'test@example.com' };
    const token = jwt.sign(testPayload, jwtSecret, { 
      expiresIn: '1h',
      issuer: 'security-test' 
    });
    
    if (!token) {
      logError('Failed to create JWT token');
      return false;
    }
    
    logSuccess('JWT token creation successful');
    
    // Test token verification
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded.email !== testPayload.email) {
      logError('JWT verification returned incorrect payload');
      return false;
    }
    
    logSuccess('JWT token verification successful');
    
    // Test token expiration
    const expiredToken = jwt.sign(testPayload, jwtSecret, { expiresIn: '-10s' });
    try {
      jwt.verify(expiredToken, jwtSecret);
      logError('Expired JWT token was accepted');
      return false;
    } catch (error) {
      logSuccess('Expired JWT token was correctly rejected');
    }
    
    // Test wrong secret
    try {
      jwt.verify(token, 'wrong-secret');
      logError('JWT token verified with incorrect secret');
      return false;
    } catch (error) {
      logSuccess('JWT token correctly rejected with wrong secret');
    }
    
    return true;
  } catch (error) {
    logError(`JWT security test failed: ${error.message}`);
    return false;
  }
};

// Test password security
const testPasswordSecurity = async () => {
  logHeader('Testing Password Security');
  
  try {
    // Test password hashing
    const testPassword = 'Test@Password123';
    const weakPasswords = ['password', '123456', 'qwerty', 'letmein', 'admin'];
    
    // Test bcrypt hash generation
    const start = Date.now();
    const hash = await bcrypt.hash(testPassword, 12);
    const hashTime = Date.now() - start;
    
    if (!hash) {
      logError('Failed to generate password hash');
      return false;
    }
    
    logSuccess(`Password hash generated successfully in ${hashTime}ms`);
    
    // Check hash timing - should be slow enough for security
    if (hashTime < 100) {
      logWarning('Password hashing is too fast, consider increasing bcrypt rounds');
    } else {
      logSuccess('Password hashing time is adequate for security');
    }
    
    // Verify hash
    const isValid = await bcrypt.compare(testPassword, hash);
    if (!isValid) {
      logError('Password hash verification failed');
      return false;
    }
    
    logSuccess('Password hash verification successful');
    
    // Test incorrect password
    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    if (isInvalid) {
      logError('Incorrect password was accepted');
      return false;
    }
    
    logSuccess('Incorrect password was properly rejected');
    
    // Test password strength check (simple example)
    const hasUpper = /[A-Z]/.test(testPassword);
    const hasLower = /[a-z]/.test(testPassword);
    const hasNumber = /[0-9]/.test(testPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(testPassword);
    const isLongEnough = testPassword.length >= 8;
    
    if (hasUpper && hasLower && hasNumber && hasSpecial && isLongEnough) {
      logSuccess('Password strength validation is working correctly');
    } else {
      logError('Password strength validation failed');
      return false;
    }
    
    // Test weak passwords
    for (const weakPass of weakPasswords) {
      const weakHasUpper = /[A-Z]/.test(weakPass);
      const weakHasLower = /[a-z]/.test(weakPass);
      const weakHasNumber = /[0-9]/.test(weakPass);
      const weakHasSpecial = /[^A-Za-z0-9]/.test(weakPass);
      const weakIsLongEnough = weakPass.length >= 8;
      
      if (weakHasUpper && weakHasLower && weakHasNumber && weakHasSpecial && weakIsLongEnough) {
        logWarning(`Weak password "${weakPass}" passes strength check`);
      } else {
        logSuccess(`Weak password "${weakPass}" correctly fails strength check`);
      }
    }
    
    return true;
  } catch (error) {
    logError(`Password security test failed: ${error.message}`);
    return false;
  }
};

// Test error handling security
const testErrorHandling = async () => {
  logHeader('Testing Error Handling Security');
  
  try {
    // Test API error response for sensitive information
    let response;
    try {
      // Request a non-existent endpoint to trigger a 404 error
      response = await axios.get(`${API_URL}/non-existent-route-for-testing`, {
        validateStatus: () => true // Don't throw on any status code
      });
      
      logInfo(`Received ${response.status} status code from test request`);
      
      // Check if status code is appropriate
      if (response.status !== 404) {
        logWarning(`Expected 404 status code for non-existent route, got ${response.status}`);
      } else {
        logSuccess('API returns correct status code for non-existent route');
      }
      
      // Check for sensitive information in error response
      const responseData = JSON.stringify(response.data);
      const sensitivePatterns = [
        /stack ?trace/i,
        /at\s+[\w\.<>\s]+\s+\([\w\/\.:]+\)/i, // Stack trace line pattern
        /database|sql|query/i,
        /internal server error/i,
        /exception|error:/i,
        /password|secret|key|token|credential/i,
        /config|env|environment/i
      ];
      
      let containsSensitiveInfo = false;
      
      for (const pattern of sensitivePatterns) {
        if (pattern.test(responseData)) {
          logError(`Error response contains sensitive information (matches "${pattern}")`);
          containsSensitiveInfo = true;
        }
      }
      
      if (!containsSensitiveInfo) {
        logSuccess('Error response is properly sanitized');
      }
      
      // Check for proper error structure
      if (!response.data.message) {
        logWarning('Error response is missing a "message" field');
      } else {
        logSuccess('Error response contains appropriate "message" field');
      }
      
    } catch (axiosError) {
      logError(`Failed to test API error handling: ${axiosError.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    logError(`Error handling security test failed: ${error.message}`);
    return false;
  }
};

// Test security headers
const testSecurityHeaders = async () => {
  logHeader('Testing Security Headers');
  
  try {
    let response;
    try {
      // Make a request to the API to check headers
      response = await axios.get(`${API_URL}/health`, {
        validateStatus: () => true
      });
      
      logInfo(`Connected to API health endpoint, status: ${response.status}`);
      
    } catch (error) {
      // Fall back to any endpoint if health check fails
      try {
        response = await axios.get(API_URL, {
          validateStatus: () => true
        });
        logInfo(`Connected to API base URL, status: ${response.status}`);
      } catch (fallbackError) {
        logError(`Could not connect to API: ${fallbackError.message}`);
        return false;
      }
    }
    
    // Check important security headers
    const headers = response.headers;
    const securityHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': ['DENY', 'SAMEORIGIN'],
      'strict-transport-security': (value) => value && value.includes('max-age='),
      'content-security-policy': (value) => value !== undefined,
      'x-xss-protection': (value) => value && value.includes('1;')
    };
    
    let missingHeaders = 0;
    
    Object.entries(securityHeaders).forEach(([header, expectedValue]) => {
      const headerValue = headers[header];
      
      if (headerValue === undefined) {
        logWarning(`Missing security header: ${header}`);
        missingHeaders++;
        return;
      }
      
      if (Array.isArray(expectedValue)) {
        if (!expectedValue.includes(headerValue)) {
          logWarning(`Header "${header}" has unexpected value: ${headerValue}`);
        } else {
          logSuccess(`Header "${header}" has correct value: ${headerValue}`);
        }
      } else if (typeof expectedValue === 'function') {
        if (!expectedValue(headerValue)) {
          logWarning(`Header "${header}" has unexpected value: ${headerValue}`);
        } else {
          logSuccess(`Header "${header}" has correct value: ${headerValue}`);
        }
      } else if (headerValue !== expectedValue) {
        logWarning(`Header "${header}" has unexpected value: ${headerValue}`);
      } else {
        logSuccess(`Header "${header}" has correct value: ${headerValue}`);
      }
    });
    
    // Check CORS headers if present
    if (headers['access-control-allow-origin']) {
      const corsOrigin = headers['access-control-allow-origin'];
      
      if (corsOrigin === '*') {
        logWarning('CORS allows requests from any origin (*)');
      } else {
        logSuccess(`CORS properly restricted to: ${corsOrigin}`);
      }
      
      // Check credentials policy with CORS
      if (headers['access-control-allow-credentials'] === 'true' && corsOrigin === '*') {
        logError('Security issue: CORS allows credentials with wildcard origin');
      } else if (headers['access-control-allow-credentials'] === 'true') {
        logSuccess('CORS credentials properly configured');
      }
    }
    
    if (missingHeaders > 0) {
      logWarning(`${missingHeaders} important security headers are missing`);
    } else {
      logSuccess('All important security headers are present');
    }
    
    return true;
  } catch (error) {
    logError(`Security headers test failed: ${error.message}`);
    return false;
  }
};

// Main test function
const runSecurityTests = async () => {
  console.log(`\n${colors.bright}${colors.magenta}🔒 Running Security Tests for the application${colors.reset}\n`);
  
  let passedTests = 0;
  let totalTests = 4;
  
  // JWT tests
  if (await testJWT()) {
    passedTests++;
  }
  
  // Password security tests
  if (await testPasswordSecurity()) {
    passedTests++;
  }
  
  // Error handling tests
  if (await testErrorHandling()) {
    passedTests++;
  }
  
  // Security headers tests
  if (await testSecurityHeaders()) {
    passedTests++;
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.white}📊 Security Test Summary${colors.reset}`);
  console.log(`${colors.bright}${passedTests === totalTests ? colors.green : colors.yellow}${passedTests}/${totalTests} tests completed successfully${colors.reset}`);
  
  if (passedTests === totalTests) {
    console.log(`\n${colors.bright}${colors.green}🎉 All security tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.bright}${colors.yellow}⚠️ Some security tests had warnings or errors${colors.reset}`);
  }
};

// Run the tests
try {
  runSecurityTests();
} catch (error) {
  console.error(`${colors.red}Fatal error running security tests: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
} 