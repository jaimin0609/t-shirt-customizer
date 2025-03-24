/**
 * Token Utilities
 * Helper functions for JWT token management
 */

/**
 * Decode JWT token to extract payload
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  if (!token) return null;
  
  try {
    // Split the token to get the payload section (second part)
    const payload = token.split('.')[1];
    
    // Base64 decode and parse JSON
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired or about to expire
 * @param {string} token - JWT token
 * @param {number} bufferTimeMs - Time buffer in milliseconds before expiration
 * @returns {boolean} - True if token is expired or about to expire
 */
export const isTokenExpiring = (token, bufferTimeMs = 5 * 60 * 1000) => {
  if (!token) return true;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  // Check if token is expired or will expire within buffer time
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  return Date.now() + bufferTimeMs > expirationTime;
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {number|null} - Expiration timestamp in milliseconds or null if invalid
 */
export const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  
  if (decoded && decoded.exp) {
    return decoded.exp * 1000; // Convert to milliseconds
  }
  
  return null;
};

/**
 * Store token with expiration in localStorage
 * @param {string} token - JWT token
 * @param {Object} user - User data
 */
export const setAuthToken = (token, user) => {
  if (!token) return;
  
  // Store token
  localStorage.setItem('token', token);
  
  // Store user data
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
  
  // Store expiration time
  const expiration = getTokenExpiration(token);
  if (expiration) {
    localStorage.setItem('tokenExpiration', expiration.toString());
  }
  
  // Store last activity time for session timeout
  localStorage.setItem('lastActivity', Date.now().toString());
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenExpiration');
  localStorage.removeItem('lastActivity');
};

/**
 * Update last activity timestamp
 */
export const updateLastActivity = () => {
  localStorage.setItem('lastActivity', Date.now().toString());
};

/**
 * Get authentication headers for API requests
 * @returns {Object} - Headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}; 