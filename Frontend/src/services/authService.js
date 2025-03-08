import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user'));
        
        // Remove existing interceptors if any
        this.requestInterceptor = null;
        this.responseInterceptor = null;
        
        this.setupInterceptors();
    }
    
    setupInterceptors() {
        // Remove existing interceptors
        if (this.requestInterceptor !== null) {
            axios.interceptors.request.eject(this.requestInterceptor);
        }
        
        if (this.responseInterceptor !== null) {
            axios.interceptors.response.eject(this.responseInterceptor);
        }
        
        // Add token to all requests if it exists
        this.requestInterceptor = axios.interceptors.request.use(
            (config) => {
                // Get the latest token from localStorage (not from instance variable)
                const currentToken = localStorage.getItem('token');
                if (currentToken) {
                    config.headers.Authorization = `Bearer ${currentToken}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Handle token expiration - with special case for profile updates
        this.responseInterceptor = axios.interceptors.response.use(
            (response) => {
                return response;
            },
            async (error) => {
                // Check if the request URL is for a profile update
                const isProfileUpdate = error.config && 
                    (error.config.url.includes('/auth/profile') || 
                     error.config.url.includes('/auth/me'));
                
                console.log(`Request failed for URL: ${error.config?.url}`, 
                    `Status: ${error.response?.status}`, 
                    `Is profile update: ${isProfileUpdate}`);
                
                // Only logout for 401 errors that are NOT from profile operations
                if (error.response?.status === 401 && localStorage.getItem('token') && !isProfileUpdate) {
                    console.log('Unauthorized access detected, logging out');
                    await this.logout();
                    window.location.href = '/login';
                }
                
                return Promise.reject(error);
            }
        );
    }

    async login(email, password) {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            });
            
            this.setSession(response.data);
            return response.data.user;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to login');
        }
    }

    async register(firstName, lastName, email, password) {
        try {
            const response = await axios.post(`${API_URL}/auth/customer/register`, {
                firstName,
                lastName,
                email,
                password
            });
            
            this.setSession(response.data);
            return response.data.user;
        } catch (error) {
            // Check if this is an "Email already registered" error
            if (error.response?.status === 400 && error.response?.data?.message === 'Email already registered') {
                throw new Error('This email is already registered. Please login instead.');
            }
            
            throw new Error(error.response?.data?.message || 'Failed to register');
        }
    }

    async logout() {
        try {
            if (this.token) {
                await axios.post(`${API_URL}/auth/logout`);
            }
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            this.clearSession();
        }
    }

    async verifyEmail(token) {
        try {
            const response = await axios.post(`${API_URL}/auth/verify-email`, { token });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to verify email');
        }
    }

    async requestPasswordReset(email) {
        try {
            const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to request password reset');
        }
    }

    async resetPassword(token, newPassword) {
        try {
            const response = await axios.post(`${API_URL}/auth/reset-password`, {
                token,
                newPassword
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to reset password');
        }
    }

    async updateProfile(userData) {
        try {
            console.log('Sending profile update data:', userData);
            
            // Save the current token before the request
            const currentToken = localStorage.getItem('token');
            
            // Make the request with current authorization header
            const response = await axios.put(`${API_URL}/auth/profile`, userData);
            console.log('Profile update response:', response.data);
            
            // Extract user data from response (with or without token)
            let updatedUser;
            
            if (response.data.token) {
                console.log('Received new token with profile update');
                const { token, ...userData } = response.data;
                
                // Update the token in localStorage
                localStorage.setItem('token', token);
                this.token = token;
                
                updatedUser = userData;
            } else {
                updatedUser = response.data;
            }
            
            // Update user data without touching the token
            this.setUser(updatedUser);
            
            // Verify token is still in localStorage
            if (!localStorage.getItem('token') && currentToken) {
                console.log('Restoring token after profile update');
                localStorage.setItem('token', currentToken);
                this.token = currentToken;
            }
            
            // Re-setup interceptors with the latest token
            this.setupInterceptors();
            
            return updatedUser;
        } catch (error) {
            console.error('Profile update error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    }

    async getCurrentUser() {
        try {
            const currentToken = localStorage.getItem('token');
            if (!currentToken) return null;
            
            console.log('Fetching current user data');
            
            // Make sure we're using the current token from localStorage
            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${currentToken}`
                }
            });
            
            console.log('Current user data received:', response.data);
            const currentUser = response.data;
            
            // Update the user without changing the token
            this.setUser(currentUser);
            
            return currentUser;
        } catch (error) {
            console.error('Failed to fetch current user:', error.response?.data || error.message);
            
            // Don't clear the token on this error
            if (error.response?.status === 401) {
                console.log('Authentication error, but not clearing token for getCurrentUser');
            }
            
            return null;
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            const response = await axios.post(`${API_URL}/auth/change-password`, {
                currentPassword,
                newPassword
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to change password');
        }
    }

    setSession(authData) {
        if (authData.token) {
            this.token = authData.token;
            this.user = authData.user;
            localStorage.setItem('token', authData.token);
            localStorage.setItem('user', JSON.stringify(authData.user));
            
            // Re-setup interceptors with the new token
            this.setupInterceptors();
        }
    }

    clearSession() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Re-setup interceptors (will run without token)
        this.setupInterceptors();
    }

    setUser(user) {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
    }

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return localStorage.getItem('token');
    }
}

export const authService = new AuthService(); 