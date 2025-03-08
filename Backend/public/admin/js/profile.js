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
        console.log('User profile data:', userData); // Add this for debugging
        
        // Update UI with user data
        document.getElementById('userName').textContent = userData.name || 'Admin';
        
        // If user has a profile image, update the avatar
        if (userData.profileImage) {
            // Try multiple selectors to ensure we find the avatar element
            const avatarImg = document.getElementById('userAvatar') || document.querySelector('.avatar') || document.querySelector('.rounded-circle');
            if (avatarImg) {
                // Make sure the path is absolute
                avatarImg.src = userData.profileImage.startsWith('http') 
                    ? userData.profileImage 
                    : `${window.location.origin}${userData.profileImage}`;
                console.log('Setting avatar image to:', avatarImg.src); // Debug
            } else {
                console.warn('Avatar image element not found: #userAvatar, .avatar, or .rounded-circle');
            }
        } else {
            console.log('No profile image found in user data');
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
        if (userData.profileImage) {
            document.getElementById('profilePreview').src = userData.profileImage.startsWith('http') 
                ? userData.profileImage 
                : `http://localhost:5002${userData.profileImage}`;
        } else {
            document.getElementById('profilePreview').src = '/admin/assets/default-avatar.png';
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
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update profile');
        }
        
        const updatedUser = await response.json();
        console.log('Profile updated successfully:', updatedUser);
        
        // Update UI with new user data
        document.getElementById('userName').textContent = updatedUser.name || 'Admin';
        
        // If user updated their profile image, update the avatar
        if (updatedUser.profileImage) {
            const avatarImg = document.querySelector('.avatar-img');
            if (avatarImg) {
                // Make sure the path is absolute
                avatarImg.src = updatedUser.profileImage.startsWith('http') 
                    ? updatedUser.profileImage 
                    : `http://localhost:5002${updatedUser.profileImage}`;
                console.log('Updated avatar image to:', avatarImg.src);
            }
        }
        
        // Close modal
        const profileModal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
        profileModal.hide();
        
        showToast('success', 'Profile updated successfully');
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('error', error.message || 'Failed to update profile');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/admin/login.html';
} 