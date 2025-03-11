// Use global API_URL variable from window object instead of import
// Remove the import line above

// Ensure API_URL is available
if (typeof window.API_URL === 'undefined') {
    console.warn('API_URL not found on window object, using default value');
    window.API_URL = '/api'; // Fallback value
}

let profileModal;

// Expose functions globally for HTML onclick events
window.saveProfile = saveProfile;
window.logout = logout;

document.addEventListener('DOMContentLoaded', function() {
    profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
    
    // Load user profile data
    loadUserProfile();
    
    // Set up image preview
    const profileImageInput = document.getElementById('profileImage');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('profilePreview').src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Set up profile link
    const profileLink = document.getElementById('profileLink');
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
            showProfileModal();
        });
    }

    // Check if we should show profile modal on page load (from URL parameter)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showProfile') === 'true') {
        // Remove the parameter from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        // Show the profile modal
        setTimeout(() => showProfileModal(), 500);
    }

    // Set up error handling for avatar images
    setupAvatarErrorHandling();
});

/**
 * Get the correctly formatted URL for an image
 * @param {string} imagePath - The image path from the server
 * @returns {string} - The formatted image URL
 */
function getImageUrl(imagePath) {
    // If no image path provided, return default avatar
    if (!imagePath) {
        console.log("No profile image path provided, using default avatar");
        return '/admin/img/default-avatar.png';
    }
    
    // Safety check for undefined or null
    if (typeof imagePath !== 'string') {
        console.warn("Invalid image path type:", typeof imagePath);
        return '/admin/img/default-avatar.png';
    }
    
    console.log('Processing image path:', imagePath);
    
    // Check if it's already a full URL 
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        // Handle specifically the render.com domain
        if (imagePath.includes('t-shirt-customizer-backend.onrender.com')) {
            // Extract just the filename part
            const parts = imagePath.split('/');
            const filename = parts[parts.length - 1];
            console.log("Converting remote render.com URL to local path, filename:", filename);
            
            // For profile images
            if (imagePath.includes('/profiles/')) {
                return `/uploads/profiles/${filename}`;
            }
            // For other uploads
            return `/uploads/${filename}`;
        }
        // It's a full URL from another source, use as is
        return imagePath;
    }
    
    // If it starts with a slash, it's a relative path from the root
    if (imagePath.startsWith('/')) {
        // Make the URL absolute by appending the current origin
        const localUrl = window.location.origin + imagePath;
        console.log('Converting relative path to absolute URL:', localUrl);
        return localUrl;
    }
    
    // Otherwise, assume it's a relative path from the current directory
    console.log('Using relative path as is:', imagePath);
    return imagePath;
}

/**
 * Set up error handling for all avatar images
 */
function setupAvatarErrorHandling() {
    console.log('Setting up avatar error handling');
    
    // Select all image elements that might be avatars
    const avatarElements = document.querySelectorAll('img.avatar, #userAvatar, .rounded-circle, img.profile-img, .avatar-img');
    console.log(`Found ${avatarElements.length} potential avatar images`);
    
    avatarElements.forEach((img, index) => {
        if (img.hasAttribute('data-error-handled')) {
            console.log(`Image #${index} already has error handling`);
            return;
        }
        
        console.log(`Setting up error handling for image #${index}: ${img.id || 'unnamed'}`);
        img.setAttribute('data-error-handled', 'true');
        
        // Save original source as fallback chain starting point
        const originalSrc = img.src;
        img.setAttribute('data-original-src', originalSrc);
        
        // Set up error handler
        img.onerror = function() {
            const currentSrc = this.src;
            console.warn(`Avatar image failed to load: ${currentSrc}`);
            
            // Guard against infinite loops
            const fallbackCount = parseInt(this.getAttribute('data-fallback-count') || '0');
            if (fallbackCount > 3) {
                console.error('Too many fallback attempts, using default avatar');
                this.src = '/admin/img/default-avatar.png';
                this.onerror = null;
                return;
            }
            
            this.setAttribute('data-fallback-count', (fallbackCount + 1).toString());
            
            // Already using default, don't try to replace
            if (currentSrc.includes('default-avatar') || currentSrc.endsWith('/admin/img/default-avatar.png')) {
                console.log('Already using default avatar, not replacing');
                this.onerror = null;
                return;
            }
            
            // Try different fallback strategies
            
            // 1. If from render.com, try local path
            if (currentSrc.includes('t-shirt-customizer-backend.onrender.com')) {
                const parts = currentSrc.split('/');
                const filename = parts[parts.length - 1];
                console.log(`Trying local path for render.com URL: ${filename}`);
                
                // Check if it's a profile image
                if (currentSrc.includes('/profiles/')) {
                    this.src = `/uploads/profiles/${filename}`;
                } else {
                    this.src = `/uploads/${filename}`;
                }
                return;
            }
            
            // 2. If it was a local path that failed, try the API server path
            if (currentSrc.includes('/uploads/') && !currentSrc.includes('http')) {
                const filename = currentSrc.split('/').pop();
                console.log(`Local path failed, trying API server for: ${filename}`);
                
                // Check if it's a profile image
                if (currentSrc.includes('/profiles/')) {
                    this.src = `https://t-shirt-customizer-backend.onrender.com/uploads/profiles/${filename}`;
                } else {
                    this.src = `https://t-shirt-customizer-backend.onrender.com/uploads/${filename}`;
                }
                return;
            }
            
            // 3. As a last resort, use the default avatar
            console.log('Using default avatar as final fallback');
            this.src = '/admin/img/default-avatar.png';
            this.onerror = null;
        };
        
        // Trigger a reload to apply the error handler if needed
        if (img.complete) {
            const currentSrc = img.src;
            if (!img.naturalWidth) {
                console.log(`Image already failed to load, applying fallback: ${currentSrc}`);
                img.onerror();
            }
        }
    });
}

/**
 * Fetch user profile data from the server
 * @returns {Promise<Object>} User profile data
 */
async function fetchUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found');
        window.location.href = '/admin/login.html';
        throw new Error('Authentication required');
    }

    try {
        const response = await fetch(`${window.API_URL}/admin/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Clear authentication and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/admin/login.html';
                throw new Error('Authentication expired');
            }
            throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        
        // If we have cached user data, use that instead of failing
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
            console.log('Using cached user data due to fetch error');
            try {
                return JSON.parse(cachedUser);
            } catch (e) {
                console.error('Error parsing cached user data:', e);
            }
        }
        
        throw error;
    }
}

/**
 * Load user profile data
 */
async function loadUserProfile() {
    try {
        const userData = await fetchUserProfile();
        console.log('User profile data:', userData);
        
        // Update the profile form if it exists
        const nameInput = document.getElementById('name');
        if (nameInput) nameInput.value = userData.name || '';
        
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = userData.email || '';
        
        // Update user name in the navbar
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userData.name || 'User';
        }
        
        // Update user email in the profile
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = userData.email || '';
        }
        
        // Update role in the profile
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement) {
            userRoleElement.textContent = userData.role 
                ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) 
                : 'User';
        }
        
        // Get the correct avatar URL
        let avatarUrl = '';
        if (userData.profileImage) {
            console.log('Processing profile image:', userData.profileImage);
            avatarUrl = getImageUrl(userData.profileImage);
        } else {
            console.log('No profile image found, using default');
            avatarUrl = '/admin/img/default-avatar.png';
        }
        
        console.log('Setting avatar image to:', avatarUrl);
        
        // Update all avatar images
        const avatarElements = document.querySelectorAll('img.avatar, #userAvatar, .rounded-circle, img.profile-img, .avatar-img');
        avatarElements.forEach(img => {
            console.log(`Updating avatar image: ${img.id || 'unnamed'}`);
            img.src = avatarUrl;
        });
        
        // Set up error handling for all avatar images
        setTimeout(() => {
            setupAvatarErrorHandling();
        }, 100);
        
        return userData;
    } catch (error) {
        console.error('Error loading user profile:', error);
        
        // Set up error handling anyway to fix any broken images
        setTimeout(() => {
            setupAvatarErrorHandling();
        }, 100);
        
        return null;
    }
}

// Show profile modal with user data
async function showProfileModal() {
    try {
        const userData = await loadUserProfile();
        if (!userData) {
            throw new Error('Failed to fetch profile');
        }
        
        // Fill form with user data
        document.getElementById('name').value = userData.name || '';
        document.getElementById('email').value = userData.email || '';
        
        // Clear password field
        document.getElementById('newPassword').value = '';
        
        // Set profile image if exists
        const profilePreview = document.getElementById('profilePreview');
        if (profilePreview) {
            profilePreview.src = getImageUrl(userData.profileImage);
        }
        
        // Show modal
        const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
        profileModal.show();
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('error', 'Failed to load profile data');
    }
}

// Save profile changes
async function saveProfile() {
    try {
        const form = document.getElementById('profileForm');
        const formData = new FormData(form);
        
        // Check if we have a file
        const fileInput = document.getElementById('profileImage');
        if (fileInput.files.length > 0) {
            console.log('File selected for upload:', fileInput.files[0].name);
        } else {
            console.log('No file selected for upload');
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        console.log('Sending profile update request');
        
        const response = await fetch(`${window.API_URL}/admin/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type when sending FormData
            },
            body: formData
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to update profile';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                console.error('Could not parse error response', e);
            }
            throw new Error(errorMessage);
        }
        
        const updatedUser = await response.json();
        console.log('Profile updated successfully:', updatedUser);
        
        // Update UI with new user data
        document.getElementById('userName').textContent = updatedUser.name || 'Admin';
        
        // If user updated their profile image, update all avatar instances
        if (updatedUser.profileImage) {
            const avatarUrl = getImageUrl(updatedUser.profileImage);
            console.log('Updated avatar image to:', avatarUrl);
            
            document.querySelectorAll('img.avatar-img, img.profile-img').forEach(img => {
                img.src = avatarUrl;
            });
        }
        
        // Close modal
        const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
        profileModal.hide();
        
        showToast('success', 'Profile updated successfully');
        
        // Reload the page to ensure all UI elements are updated correctly
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('error', error.message || 'Failed to update profile');
    }
}

// Show toast notification
function showToast(type, message) {
    // Check if showNotification function exists (from add-product.js)
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type === 'success' ? 'success' : 'danger');
        return;
    }
    
    // Fallback to alert if toast not available
    alert(message);
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login.html';
} 