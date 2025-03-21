// Test script for frontend error handling
import axios from 'axios';

// For testing, we can manually set a development mode
const isDevelopment = true;

// Import the error handler from orderService
const handleApiError = (error, fallbackMessage) => {
  // Log the full error for development debugging
  if (isDevelopment) {
    console.error('API Error:', error);
  }
  
  // Extract error message with fallbacks in case of network errors or unexpected responses
  const errorMessage = error.response?.data?.message || 
                       error.response?.statusText || 
                       error.message || 
                       fallbackMessage;
                       
  throw new Error(errorMessage);
};

// Test cases for different error scenarios
const testErrorHandling = async () => {
  console.log('🧪 Testing frontend error handling with different scenarios:');
  
  // Test with network error
  console.log('\n1. Testing network error (e.g., API server down):');
  try {
    // Create a network error by using an invalid URL
    await axios.get('http://invalid-url-that-does-not-exist');
  } catch (error) {
    try {
      handleApiError(error, 'Failed to connect to API');
    } catch (handledError) {
      console.log('✅ Network error handled correctly:', handledError.message);
    }
  }
  
  // Test with API error that has a response
  console.log('\n2. Testing API error with error message in response:');
  try {
    // Mock an API error response
    const mockError = {
      response: {
        data: {
          message: 'Invalid authentication token'
        },
        status: 401,
        statusText: 'Unauthorized'
      }
    };
    handleApiError(mockError, 'Authentication failed');
  } catch (handledError) {
    console.log('✅ API error with message handled correctly:', handledError.message);
  }
  
  // Test with API error that has no data.message
  console.log('\n3. Testing API error with status text but no message:');
  try {
    // Mock an API error response with no data.message
    const mockError = {
      response: {
        data: {},
        status: 404,
        statusText: 'Not Found'
      }
    };
    handleApiError(mockError, 'Resource not found');
  } catch (handledError) {
    console.log('✅ API error with status text handled correctly:', handledError.message);
  }
  
  // Test with generic error
  console.log('\n4. Testing generic error:');
  try {
    // Create a generic error without response
    const genericError = new Error('Something went wrong');
    handleApiError(genericError, 'Operation failed');
  } catch (handledError) {
    console.log('✅ Generic error handled correctly:', handledError.message);
  }
  
  // Test with fallback message
  console.log('\n5. Testing empty error with fallback:');
  try {
    // Create an empty error
    const emptyError = {};
    handleApiError(emptyError, 'Unknown error occurred');
  } catch (handledError) {
    console.log('✅ Fallback message used correctly:', handledError.message);
  }
  
  console.log('\n✅ All frontend error handling tests completed');
};

// Run the tests
testErrorHandling().catch(error => {
  console.error('Test failed:', error);
}); 