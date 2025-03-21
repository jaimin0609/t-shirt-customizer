/**
 * Authentication Service
 * Handles user authentication and session management
 */
import apiClient, { api } from './apiClient';
import { handleApiError } from './errorHandler';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

class AuthService {
  constructor() {
    this.user = JSON.parse(localStorage.getItem(USER_KEY)) || null;
    this.token = localStorage.getItem(TOKEN_KEY) || null;
    this.tokenExpiration = localStorage.getItem('tokenExpiration') || null;
  }

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} User data
   */
  async login(email, password) {
    try {
      const data = await api.post('/auth/login', { email, password });
      this.setSession(data);
      return data.user;
    } catch (error) {
      throw handleApiError(error, 'Login failed');
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} User data
   */
  async register(userData) {
    try {
      const data = await api.post('/auth/register', userData);
      this.setSession(data);
      return data.user;
    } catch (error) {
      throw handleApiError(error, 'Registration failed');
    }
  }

  /**
   * Logout the current user
   */
  async logout() {
    try {
      // Call logout endpoint to invalidate token on server
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local session data, even if server call fails
      this.clearSession();
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Object} Updated user data
   */
  async updateProfile(profileData) {
    try {
      const data = await api.put('/users/profile', profileData);
      // Update stored user data
      this.user = data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      throw handleApiError(error, 'Profile update failed');
    }
  }

  /**
   * Change user password
   * @param {Object} passwordData - Old and new password
   * @returns {Object} Success message
   */
  async changePassword(passwordData) {
    try {
      return await api.put('/users/password', passwordData);
    } catch (error) {
      throw handleApiError(error, 'Password change failed');
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Object} Success message
   */
  async requestPasswordReset(email) {
    try {
      return await api.post('/auth/request-reset', { email });
    } catch (error) {
      throw handleApiError(error, 'Password reset request failed');
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Object} Success message
   */
  async resetPassword(token, password) {
    try {
      return await api.post('/auth/reset-password', { token, password });
    } catch (error) {
      throw handleApiError(error, 'Password reset failed');
    }
  }

  /**
   * Verify user email
   * @param {string} token - Verification token
   * @returns {Object} Success message
   */
  async verifyEmail(token) {
    try {
      return await api.post('/auth/verify-email', { token });
    } catch (error) {
      throw handleApiError(error, 'Email verification failed');
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.token && !this.isTokenExpired();
  }

  /**
   * Check if token is expired
   * @returns {boolean}
   */
  isTokenExpired() {
    if (!this.tokenExpiration) return true;
    return new Date(this.tokenExpiration) < new Date();
  }

  /**
   * Get current user
   * @returns {Object} User data
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Set session data after login/register
   * @param {Object} data - Session data (token, user)
   * @private
   */
  setSession(data) {
    this.token = data.token;
    this.user = data.user;
    this.tokenExpiration = data.expiresAt;
    
    // Store in localStorage for persistence
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    localStorage.setItem('tokenExpiration', data.expiresAt);
  }

  /**
   * Clear session data on logout
   * @private
   */
  clearSession() {
    this.token = null;
    this.user = null;
    this.tokenExpiration = null;
    
    // Remove from localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('tokenExpiration');
  }

  /**
   * Refresh user data from the server
   * @returns {Object} Updated user data
   */
  async refreshUser() {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }
      
      const data = await api.get('/users/profile');
      this.user = data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      throw handleApiError(error, 'Failed to refresh user data');
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService; 