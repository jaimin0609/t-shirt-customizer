/**
 * Admin Profile Management
 * Handles profile data loading and update functionality
 */

// Configuration
const CONFIG = {
    apiUrl: window.API_URL || '/api',
    debug: true,
    defaultProfileImage: '/admin/img/default-avatar.png'
};

// State
let profileState = {
    user: null,
    isLoading: false,
    isSaving: false,
    error: null,
    lastUpdated: null
};

// DOM elements - will be populated on init
let elements = {
    form: null,
    avatar: null,
    nameInput: null,
    emailInput: null,
    usernameInput: null,
    passwordInput: null,
    passwordConfirmInput: null,
    saveButton: null,
    cancelButton: null,
    alertContainer: null
};

/**
 * Initialize profile functionality
 */
async function initProfile() {
    console.log('Initializing profile management...');
    
    // Check authentication
    if (typeof requireAuth === 'function' && !requireAuth()) {
        return;
    }
    
    // Map DOM elements
    mapElements();
    
    // Add event listeners
    addEventListeners();
    
    // Load profile data
    await loadProfileData();
    
    // Set page title
    if (typeof standardizePageTitle === 'function') {
        standardizePageTitle('Profile Settings');
    } else {
        document.title = 'Profile Settings - Admin Dashboard';
    }
    
    // Make the profile submission handler available for all pages
    window.handleProfileSubmit = handleProfileSubmit;
    
    // Hook up profile modal buttons on all pages
    setupProfileModals();
}

/**
 * Map DOM elements for easier access
 */
function mapElements() {
    elements.form = document.getElementById('profileForm');
    elements.avatar = document.getElementById('userAvatar');
    elements.nameInput = document.getElementById('fullName');
    elements.emailInput = document.getElementById('email');
    elements.usernameInput = document.getElementById('username');
    elements.passwordInput = document.getElementById('newPassword');
    elements.passwordConfirmInput = document.getElementById('confirmPassword');
    elements.saveButton = document.querySelector('button[type="submit"]');
    elements.cancelButton = document.querySelector('button[type="reset"]');
    elements.alertContainer = document.getElementById('alertContainer');
    
    // Create alert container if it doesn't exist
    if (!elements.alertContainer) {
        elements.alertContainer = document.createElement('div');
        elements.alertContainer.id = 'alertContainer';
        elements.alertContainer.className = 'mb-4';
        
        if (elements.form) {
            elements.form.parentNode.insertBefore(elements.alertContainer, elements.form);
        }
    }
}

/**
 * Add event listeners
 */
function addEventListeners() {
    // Form submission
    if (elements.form) {
        elements.form.addEventListener('submit', handleProfileSubmit);
    }
    
    // Form reset/cancel
    if (elements.cancelButton) {
        elements.cancelButton.addEventListener('click', (e) => {
            // If we've loaded profile data, reset the form to those values
            if (profileState.user) {
                populateFormWithUserData(profileState.user);
                e.preventDefault(); // Prevent actual form reset
            }
        });
    }
    
    // Password confirmation validation
    if (elements.passwordInput && elements.passwordConfirmInput) {
        elements.passwordConfirmInput.addEventListener('input', validatePasswordMatch);
        elements.passwordInput.addEventListener('input', validatePasswordMatch);
    }
}

/**
 * Validate password and confirmation match
 */
function validatePasswordMatch() {
    const password = elements.passwordInput.value;
    const confirmPassword = elements.passwordConfirmInput.value;
    
    if (password || confirmPassword) {
        if (password !== confirmPassword) {
            elements.passwordConfirmInput.setCustomValidity('Passwords do not match');
            elements.passwordConfirmInput.classList.add('is-invalid');
        } else {
            elements.passwordConfirmInput.setCustomValidity('');
            elements.passwordConfirmInput.classList.remove('is-invalid');
            elements.passwordConfirmInput.classList.add('is-valid');
        }
    } else {
        elements.passwordConfirmInput.setCustomValidity('');
        elements.passwordConfirmInput.classList.remove('is-invalid');
        elements.passwordConfirmInput.classList.remove('is-valid');
    }
}

/**
 * Load profile data from API
 */
async function loadProfileData() {
    try {
        console.log('Loading profile data...');
        profileState.isLoading = true;
        showLoading();
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Fetch profile data
        const response = await fetch(`${CONFIG.apiUrl}/admin/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized - token may be expired
                localStorage.removeItem('token');
                window.location.href = '/admin/login.html';
                return;
            }
            
            throw new Error(`Failed to load profile: ${response.status} ${response.statusText}`);
        }
        
        const userData = await response.json();
        console.log('Profile data loaded successfully:', userData);
        
        // Update state
        profileState.user = userData;
        profileState.lastUpdated = new Date();
        
        // Populate form with user data
        populateFormWithUserData(userData);
        
        // Update user name in header and sidebar
        updateUIWithUserData(userData);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        profileState.error = error.message;
        
        showAlert('error', `Failed to load profile: ${error.message}`);
    } finally {
        profileState.isLoading = false;
        hideLoading();
    }
}

/**
 * Populate form with user data
 */
function populateFormWithUserData(userData) {
    if (!userData) return;
    
    // Populate profile avatar
    if (elements.avatar && userData.profileImage) {
        elements.avatar.src = userData.profileImage;
    } else if (elements.avatar) {
        elements.avatar.src = CONFIG.defaultProfileImage;
    }
    
    // Populate text fields
    if (elements.nameInput) elements.nameInput.value = userData.name || '';
    if (elements.emailInput) elements.emailInput.value = userData.email || '';
    if (elements.usernameInput) elements.usernameInput.value = userData.username || '';
    
    // Clear password fields
    if (elements.passwordInput) elements.passwordInput.value = '';
    if (elements.passwordConfirmInput) elements.passwordConfirmInput.value = '';
}

/**
 * Update UI elements with user data
 */
function updateUIWithUserData(userData) {
    // Update all header username elements
    const userNameElements = document.querySelectorAll('#userName');
    userNameElements.forEach(element => {
        element.textContent = userData.name || userData.username || 'Admin';
    });
    
    // Update all avatar elements
    const avatarElements = document.querySelectorAll('.avatar');
    avatarElements.forEach(element => {
        if (userData.profileImage) {
            element.src = userData.profileImage;
        }
    });
    
    // Store in localStorage for other pages
    localStorage.setItem('userName', userData.name || userData.username || 'Admin');
}

/**
 * Handle profile form submission
 */
async function handleProfileSubmit(e) {
    e.preventDefault();
    
    try {
        console.log('Submitting profile update...');
        profileState.isSaving = true;
        
        // Get form data
        const formData = new FormData(elements.form);
        
        // Validate password match if password is being changed
        const password = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password || confirmPassword) {
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }
            
            // Simple password strength validation
            if (password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }
        }
        
        // Show saving indicator
        if (elements.saveButton) {
            const originalText = elements.saveButton.innerHTML;
            elements.saveButton.disabled = true;
            elements.saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        // Submit form data
        const response = await fetch(`${CONFIG.apiUrl}/admin/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized - token may be expired
                localStorage.removeItem('token');
                window.location.href = '/admin/login.html';
                return;
            }
            
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to update profile: ${response.status} ${response.statusText}`);
        }
        
        const updatedUserData = await response.json();
        console.log('Profile updated successfully:', updatedUserData);
        
        // Update state
        profileState.user = updatedUserData;
        profileState.lastUpdated = new Date();
        
        // Update UI with new data
        updateUIWithUserData(updatedUserData);
        
        // Show success message
        showAlert('success', 'Profile updated successfully');
        
        // Clear password fields
        if (elements.passwordInput) elements.passwordInput.value = '';
        if (elements.passwordConfirmInput) elements.passwordConfirmInput.value = '';
        
    } catch (error) {
        console.error('Error updating profile:', error);
        profileState.error = error.message;
        
        showAlert('error', `Failed to update profile: ${error.message}`);
    } finally {
        profileState.isSaving = false;
        
        // Reset save button
        if (elements.saveButton) {
            elements.saveButton.disabled = false;
            elements.saveButton.innerHTML = 'Save Changes';
        }
    }
}

/**
 * Show loading indicator
 */
function showLoading() {
    if (elements.form) {
        elements.form.classList.add('loading');
    }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    if (elements.form) {
        elements.form.classList.remove('loading');
    }
}

/**
 * Show alert message
 */
function showAlert(type, message) {
    if (!elements.alertContainer) return;
    
    // Clear existing alerts
    elements.alertContainer.innerHTML = '';
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to container
    elements.alertContainer.appendChild(alert);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}

/**
 * Set up profile modals across all pages
 */
function setupProfileModals() {
    // Look for profile modals
    const profileModals = document.querySelectorAll('#profileModal');
    
    profileModals.forEach(modal => {
        // Find the save button
        const saveButton = modal.querySelector('.modal-footer .btn-primary');
        if (saveButton) {
            console.log('Setting up profile modal save button');
            
            // Check if the button already has the correct handler
            if (saveButton.getAttribute('onclick') !== 'saveProfile()') {
                // Remove any existing onclick handler and add our own
                saveButton.removeAttribute('onclick');
                saveButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Get the form element
                    const form = modal.querySelector('#profileForm');
                    if (form) {
                        // Create a FormData object from the form
                        const formData = new FormData(form);
                        
                        // Call the save profile function
                        if (typeof window.saveProfile === 'function') {
                            window.saveProfile();
                        } else {
                            // Fallback to our own implementation
                            handleProfileModalSubmit(form);
                        }
                    } else {
                        console.error('Profile form not found in modal');
                    }
                });
            }
        }
    });
}

/**
 * Handle profile modal submission directly
 */
async function handleProfileModalSubmit(form) {
    try {
        // Get formData
        const formData = new FormData(form);
        
        // Get the save button and show loading state
        const saveButton = form.closest('.modal').querySelector('.modal-footer .btn-primary');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        }
        
        // Get token
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication required');
        }
        
        // API URL 
        const apiUrl = window.API_URL || '/api';
        
        // Submit form data
        const response = await fetch(`${apiUrl}/admin/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Failed to update profile: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Show success message
        if (typeof showToast === 'function') {
            showToast('success', 'Profile updated successfully');
        } else {
            alert('Profile updated successfully');
        }
        
        // Close the modal
        const modal = form.closest('.modal');
        if (modal && typeof bootstrap !== 'undefined') {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            modalInstance.hide();
        }
        
        // Update UI with new data
        if (data.name) {
            const userNameElements = document.querySelectorAll('#userName');
            userNameElements.forEach(el => el.textContent = data.name);
            localStorage.setItem('userName', data.name);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        if (typeof showToast === 'function') {
            showToast('error', error.message);
        } else {
            alert(`Error: ${error.message}`);
        }
    } finally {
        // Reset save button
        const saveButton = form.closest('.modal').querySelector('.modal-footer .btn-primary');
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerText = 'Save Changes';
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initProfile); 