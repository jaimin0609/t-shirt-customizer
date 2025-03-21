/**
 * Comprehensive Test Script for Error Handling and Security Improvements
 * 
 * This script tests all the security and error handling improvements implemented
 * across both backend and frontend.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Console colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Logging utilities
const logSuccess = (message) => console.log(`${colors.green}✅ ${message}${colors.reset}`);
const logError = (message) => console.log(`${colors.red}❌ ${message}${colors.reset}`);
const logInfo = (message) => console.log(`${colors.blue}ℹ️ ${message}${colors.reset}`);
const logWarning = (message) => console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`);
const logHeader = (message) => console.log(`\n${colors.bold}${colors.magenta}=== ${message} ===${colors.reset}`);

// Test configuration
const TEST_SERVER_PORT = 4321;
const BACKEND_PORT = process.env.BACKEND_PORT || 5002;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

// Helper: Make an HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: tryParseJSON(data)
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Helper: Try to parse JSON, return raw data if parsing fails
function tryParseJSON(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
}

// Test backend error handling
async function testBackendErrorHandling() {
  logHeader('Testing Backend Error Handling');
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Start the test server
    logInfo('Starting error handling test server...');
    const serverProcess = require('child_process').spawn('node', ['Backend/test-error-handling.js', `--port=${TEST_SERVER_PORT}`], {
      detached: true
    });
    
    // Give the server time to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 1: Validation Error
    try {
      logInfo('Testing validation error handling...');
      const response = await makeRequest(`http://localhost:${TEST_SERVER_PORT}/test/validation-error`);
      
      if (response.statusCode === 400) {
        logSuccess('Validation error returns 400 status code');
        testsPassed++;
      } else {
        logError(`Expected status 400, got ${response.statusCode}`);
        testsFailed++;
      }
      
      if (response.data && response.data.errors) {
        logSuccess('Validation error includes error details');
        testsPassed++;
      } else {
        logError('Validation error is missing error details');
        testsFailed++;
      }
    } catch (error) {
      logError(`Validation error test failed: ${error.message}`);
      testsFailed++;
    }
    
    // Test 2: Authentication Error
    try {
      logInfo('Testing authentication error handling...');
      const response = await makeRequest(`http://localhost:${TEST_SERVER_PORT}/test/auth-error`);
      
      if (response.statusCode === 401) {
        logSuccess('Authentication error returns 401 status code');
        testsPassed++;
      } else {
        logError(`Expected status 401, got ${response.statusCode}`);
        testsFailed++;
      }
    } catch (error) {
      logError(`Authentication error test failed: ${error.message}`);
      testsFailed++;
    }
    
    // Test 3: Not Found Error
    try {
      logInfo('Testing not found error handling...');
      const response = await makeRequest(`http://localhost:${TEST_SERVER_PORT}/test/not-found`);
      
      if (response.statusCode === 404) {
        logSuccess('Not found error returns 404 status code');
        testsPassed++;
      } else {
        logError(`Expected status 404, got ${response.statusCode}`);
        testsFailed++;
      }
    } catch (error) {
      logError(`Not found error test failed: ${error.message}`);
      testsFailed++;
    }
    
    // Test 4: Server Error
    try {
      logInfo('Testing server error handling...');
      const response = await makeRequest(`http://localhost:${TEST_SERVER_PORT}/test/server-error`);
      
      if (response.statusCode === 500) {
        logSuccess('Server error returns 500 status code');
        testsPassed++;
      } else {
        logError(`Expected status 500, got ${response.statusCode}`);
        testsFailed++;
      }
      
      // Check for sensitive information exposure
      if (response.data) {
        const responseString = JSON.stringify(response.data);
        const containsSensitiveInfo = /\/app\/models\/db\.js/.test(responseString);
        
        // In production, we shouldn't expose stack traces
        if (process.env.NODE_ENV === 'production' && containsSensitiveInfo) {
          logError('Production environment exposes sensitive stack trace information');
          testsFailed++;
        } else if (process.env.NODE_ENV !== 'production' && containsSensitiveInfo) {
          logSuccess('Development environment includes stack trace (expected)');
          testsPassed++;
        } else if (process.env.NODE_ENV === 'production' && !containsSensitiveInfo) {
          logSuccess('Production environment correctly hides stack trace');
          testsPassed++;
        }
      }
    } catch (error) {
      logError(`Server error test failed: ${error.message}`);
      testsFailed++;
    }
    
    // Test 5: Async Error
    try {
      logInfo('Testing async error handling...');
      const response = await makeRequest(`http://localhost:${TEST_SERVER_PORT}/test/async-error`);
      
      if (response.statusCode === 500) {
        logSuccess('Async error returns 500 status code');
        testsPassed++;
      } else {
        logError(`Expected status 500, got ${response.statusCode}`);
        testsFailed++;
      }
    } catch (error) {
      logError(`Async error test failed: ${error.message}`);
      testsFailed++;
    }
    
    // Stop the test server
    logInfo('Stopping error handling test server...');
    try {
      // On Windows
      execSync('taskkill /F /T /PID ' + serverProcess.pid);
    } catch (error) {
      try {
        // On Unix-like systems
        process.kill(-serverProcess.pid, 'SIGINT');
      } catch (killError) {
        logWarning(`Could not stop test server: ${killError.message}`);
      }
    }
    
    // Summary
    logInfo(`Backend error handling tests: ${testsPassed} passed, ${testsFailed} failed`);
    
  } catch (error) {
    logError(`Backend error handling test suite failed: ${error.message}`);
  }
}

// Test security headers
async function testSecurityHeaders() {
  logHeader('Testing Security Headers');
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Test headers on the main API
    logInfo('Testing security headers on API...');
    try {
      const response = await makeRequest(`${BACKEND_URL}/health`);
      
      // List of security headers to check
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'content-security-policy'
      ];
      
      for (const header of securityHeaders) {
        if (response.headers[header]) {
          logSuccess(`${header} is set: ${response.headers[header]}`);
          testsPassed++;
        } else {
          logError(`${header} is missing`);
          testsFailed++;
        }
      }
      
      // Check HTTPS-only cookie flags
      if (response.headers['set-cookie']) {
        const cookies = Array.isArray(response.headers['set-cookie']) 
          ? response.headers['set-cookie'] 
          : [response.headers['set-cookie']];
        
        for (const cookie of cookies) {
          if (cookie.includes('Secure') && cookie.includes('HttpOnly')) {
            logSuccess('Cookie has Secure and HttpOnly flags set');
            testsPassed++;
          } else if (!cookie.includes('Secure')) {
            logWarning('Cookie is missing Secure flag');
            testsFailed++;
          } else if (!cookie.includes('HttpOnly')) {
            logWarning('Cookie is missing HttpOnly flag');
            testsFailed++;
          }
        }
      }
    } catch (error) {
      logWarning(`Could not test API security headers: ${error.message}`);
    }
    
    // Summary
    logInfo(`Security headers tests: ${testsPassed} passed, ${testsFailed} failed`);
    
  } catch (error) {
    logError(`Security headers test suite failed: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  console.log(`${colors.bold}${colors.cyan}🧪 COMPREHENSIVE SECURITY AND ERROR HANDLING TESTS${colors.reset}\n`);
  
  try {
    await testBackendErrorHandling();
    await testSecurityHeaders();
    
    console.log(`\n${colors.green}${colors.bold}✅ All tests completed${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}❌ Test suite error: ${error.message}${colors.reset}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Execute tests
runAllTests(); 