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
});

/**
 * Get the proper URL for an image path that might be local or remote
 * @param {string} imagePath - The image path from the server
 * @returns {string} - The proper URL to use in src attributes
 */
function getImageUrl(imagePath) {
    if (!imagePath) {
        return '/admin/img/default-avatar.png';
    }
    
    // If it's already a full URL (Cloudinary or other external source)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // For relative URLs, use current origin to make them absolute
    return `${window.location.origin}${imagePath}`;
}

// Load user profile data
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            window.location.href = '/admin/login.html';
            return;
        }

        const response = await fetch(`${window.API_URL}/admin/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        const userData = await response.json();
        console.log('User profile data:', userData);
        
        // Update UI with user data
        document.getElementById('userName').textContent = userData.name || 'Admin';
        
        // If user has a profile image, update the avatar
        if (userData.profileImage) {
            const avatarUrl = getImageUrl(userData.profileImage);
            console.log('Setting avatar image to:', avatarUrl);
            
            // Update all avatar instances in the UI
            const avatars = document.querySelectorAll('.avatar, #userAvatar, .rounded-circle');
            avatars.forEach(avatar => {
                avatar.src = avatarUrl;
            });
        }
        
        return userData;
    } catch (error) {
        console.error('Error loading user profile:', error);
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
            
            const avatars = document.querySelectorAll('.avatar, #userAvatar, .rounded-circle');
            avatars.forEach(avatar => {
                avatar.src = avatarUrl;
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