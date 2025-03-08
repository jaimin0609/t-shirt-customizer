// Use global API_URL variable from window object instead of import
// Remove the import line above

// Ensure API_URL is available
if (typeof window.API_URL === 'undefined') {
    console.warn('API_URL not found on window object, using default value');
    window.API_URL = '/api'; // Fallback value
}

// Check if user is authenticated and has admin privileges
async function checkAdminAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/admin/login.html';
        return false;
    }

    try {
        const response = await fetch(`${window.API_URL}/auth/verify-admin`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Admin verification failed');
        }

        return true;
    } catch (error) {
        console.error('Admin auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login.html';
        return false;
    }
}

// Get current admin user
function getCurrentAdmin() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
        const user = JSON.parse(userStr);
        return user.role === 'admin' ? user : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

// Logout admin
function logoutAdmin() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login.html';
}

// Initialize admin page
async function initAdminPage() {
    const isAuthenticated = await checkAdminAuth();
    if (!isAuthenticated) return false;

    const admin = getCurrentAdmin();
    if (!admin) {
        logoutAdmin();
        return false;
    }

    // Update UI with admin info if needed
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement) {
        adminNameElement.textContent = admin.name;
    }

    const adminImageElement = document.getElementById('adminImage');
    if (adminImageElement && admin.profileImage) {
        adminImageElement.src = admin.profileImage;
    }

    return true;
}

async function login(email, password) {
    try {
        const response = await fetch(`${window.API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
    } catch (error) {
        console.error('Login failed:', error);
        return false;
    }
}

// Add functions to global window object
window.checkAdminAuth = checkAdminAuth;
window.getCurrentAdmin = getCurrentAdmin;
window.logoutAdmin = logoutAdmin;
window.initAdminPage = initAdminPage;
window.login = login;

// For backward compatibility
window.checkAuth = checkAdminAuth; 