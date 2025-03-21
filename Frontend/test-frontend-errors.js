/**
 * Frontend Error Handling Test Script
 * 
 * This script tests the frontend error handling utilities we've implemented.
 * Run with: node Frontend/test-frontend-errors.js
 */

import { handleApiError, handleValidationErrors, handleAuthError, safeJsonParse } from './src/services/errorHandler.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Set development mode for testing
process.env.MODE = 'development';

// Colors for better console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Log utilities
const logSuccess = (message) => console.log(`${colors.green}✅ ${message}${colors.reset}`);
const logError = (message) => console.log(`${colors.red}❌ ${message}${colors.reset}`);
const logInfo = (message) => console.log(`${colors.blue}ℹ️ ${message}${colors.reset}`);
const logHeader = (message) => console.log(`\n${colors.magenta}=== ${message} ===${colors.reset}`);

// Test API error handling
async function testApiErrorHandling() {
  logHeader('Testing API Error Handling');
  
  // Test with network error
  try {
    try {
      logInfo('Testing network error handling...');
      await axios.get('http://non-existent-domain-for-testing-12345.com');
    } catch (error) {
      handleApiError(error, 'Failed to connect to server');
    }
  } catch (handledError) {
    logSuccess(`Network error properly handled: ${handledError.message}`);
  }
  
  // Test with 404 error
  try {
    try {
      logInfo('Testing 404 error handling...');
      // Create a mock error response
      const error = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Resource not found' }
        }
      };
      handleApiError(error, 'Resource could not be found');
    } catch (error) {
      logSuccess(`404 error properly handled: ${error.message}`);
    }
  } catch (err) {
    logError(`Failed to handle 404 error: ${err.message}`);
  }
  
  // Test with 500 error
  try {
    try {
      logInfo('Testing 500 error handling...');
      // Create a mock error response
      const error = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Internal server error' }
        }
      };
      handleApiError(error, 'Server error occurred');
    } catch (error) {
      logSuccess(`500 error properly handled: ${error.message}`);
    }
  } catch (err) {
    logError(`Failed to handle 500 error: ${err.message}`);
  }
}

// Test validation error handling
function testValidationErrorHandling() {
  logHeader('Testing Validation Error Handling');
  
  const rawErrors = {
    email: ['Email is invalid', 'Email is required'],
    password: 'Password must be at least 8 characters',
    confirmPassword: ['Passwords do not match']
  };
  
  try {
    const formattedErrors = handleValidationErrors(rawErrors);
    logInfo('Formatted validation errors:');
    console.log(formattedErrors);
    
    // Check if the first error message is returned for arrays
    if (formattedErrors.email === 'Email is invalid' && 
        formattedErrors.password === 'Password must be at least 8 characters' && 
        formattedErrors.confirmPassword === 'Passwords do not match') {
      logSuccess('Validation errors formatted correctly');
    } else {
      logError('Validation error formatting failed');
    }
  } catch (error) {
    logError(`Validation error handling failed: ${error.message}`);
  }
}

// Test authentication error handling
function testAuthErrorHandling() {
  logHeader('Testing Authentication Error Handling');
  
  // Test with 401 error
  try {
    const unauthorizedError = {
      response: {
        status: 401,
        data: {
          message: 'Token expired'
        }
      }
    };
    
    const result = handleAuthError(unauthorizedError);
    
    if (result.action === 'redirect' && result.path === '/login') {
      logSuccess('401 error handled correctly with redirect action');
    } else {
      logError('401 error handling failed');
    }
  } catch (error) {
    logError(`Auth error handling test failed: ${error.message}`);
  }
  
  // Test with 403 error
  try {
    const forbiddenError = {
      response: {
        status: 403,
        data: {
          message: 'Access denied'
        }
      }
    };
    
    const result = handleAuthError(forbiddenError);
    
    if (result.action === 'notify' && result.message.includes('permission')) {
      logSuccess('403 error handled correctly with notify action');
    } else {
      logError('403 error handling failed');
    }
  } catch (error) {
    logError(`Auth error handling test failed: ${error.message}`);
  }
}

// Test safe JSON parsing
function testSafeJsonParse() {
  logHeader('Testing Safe JSON Parsing');
  
  // Valid JSON
  const validJson = '{"name":"John","age":30}';
  try {
    const parsed = safeJsonParse(validJson);
    if (parsed.name === 'John' && parsed.age === 30) {
      logSuccess('Valid JSON parsed correctly');
    } else {
      logError('Valid JSON parsing failed');
    }
  } catch (error) {
    logError(`JSON parse test failed: ${error.message}`);
  }
  
  // Invalid JSON
  const invalidJson = '{name:"John",age:30}'; // Missing quotes around keys
  try {
    const result = safeJsonParse(invalidJson, { fallback: true });
    if (result.fallback === true) {
      logSuccess('Invalid JSON handled correctly with fallback');
    } else {
      logError('Invalid JSON handling failed');
    }
  } catch (error) {
    logError(`Safe JSON parse test failed: ${error.message}`);
  }
}

// Run all tests
async function runTests() {
  console.log(`${colors.cyan}🧪 FRONTEND ERROR HANDLING TESTS${colors.reset}\n`);
  
  try {
    await testApiErrorHandling();
    testValidationErrorHandling();
    testAuthErrorHandling();
    testSafeJsonParse();
    
    console.log(`\n${colors.green}✅ All frontend error handling tests completed${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}❌ Test suite error: ${error.message}${colors.reset}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Execute tests
runTests(); 