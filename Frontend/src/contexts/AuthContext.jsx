import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext({
    user: null,
    login: () => { },
    logout: () => { },
    register: () => { },
    updateProfile: () => { },
    requestPasswordReset: () => { },
    resetPassword: () => { },
    verifyEmail: () => { },
    changePassword: () => { },
    refreshUser: () => { },
    isAuthenticated: false,
    isLoading: true,
    error: null
});

// Add this custom hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = () => {
            const currentUser = authService.getUser();
            if (currentUser) {
                setUser(currentUser);
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (email, password) => {
        try {
            setError(null);
            setIsLoading(true);
            const user = await authService.login(email, password);
            setUser(user);
            return user;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (firstName, lastName, email, password) => {
        try {
            setError(null);
            setIsLoading(true);
            const user = await authService.register(firstName, lastName, email, password);
            setUser(user);
            return user;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setError(null);
            setIsLoading(true);
            await authService.logout();
            setUser(null);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const updateProfile = async (userData) => {
        try {
            setError(null);
            setIsLoading(true);
            const updatedUser = await authService.updateProfile(userData);

            // Force a refresh to make sure we have the latest data
            const refreshedUser = await authService.getCurrentUser();
            setUser(refreshedUser || updatedUser);

            return refreshedUser || updatedUser;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const requestPasswordReset = async (email) => {
        try {
            setError(null);
            setIsLoading(true);
            return await authService.requestPasswordReset(email);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async (token, newPassword) => {
        try {
            setError(null);
            setIsLoading(true);
            return await authService.resetPassword(token, newPassword);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const verifyEmail = async (token) => {
        try {
            setError(null);
            setIsLoading(true);
            return await authService.verifyEmail(token);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            setError(null);
            setIsLoading(true);
            return await authService.changePassword(currentPassword, newPassword);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = async () => {
        try {
            console.log('AuthContext: Refreshing user data');
            setError(null);
            setIsLoading(true);

            // Check if we have a token before trying to refresh
            if (!authService.getToken()) {
                console.log('AuthContext: No token available, cannot refresh user');
                setUser(null);
                setIsLoading(false);
                return null;
            }

            const refreshedUser = await authService.getCurrentUser();

            if (refreshedUser) {
                console.log('AuthContext: User data refreshed successfully');
                setUser(refreshedUser);
                return refreshedUser;
            } else {
                console.log('AuthContext: Failed to get current user data, but not logging out');
                // We don't clear the user here to prevent logout on temporary issues
                return user; // Return current user as fallback
            }
        } catch (err) {
            console.error('AuthContext: Error refreshing user:', err);
            setError(err.message);

            // Don't throw error, instead return current user as fallback
            return user;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            register,
            updateProfile,
            requestPasswordReset,
            resetPassword,
            verifyEmail,
            changePassword,
            refreshUser,
            isAuthenticated: !!user,
            isLoading,
            error
        }}>
            {children}
        </AuthContext.Provider>
    );
}; 