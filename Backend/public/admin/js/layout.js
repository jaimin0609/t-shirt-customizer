// layout.js - Handles shared layout functionality across all admin pages
// Using the global API_URL from config.js

// Ensure API_URL is available (fallback if config.js hasn't loaded properly)
if (typeof window.API_URL === 'undefined') {
    console.warn('API_URL not found on window object, using default value');
    window.API_URL = '/api'; // Default fallback value
}

// Make logout function available globally
window.logout = function() {
    localStorage.removeItem('token');
    window.location.href = '/admin/login.html';
};

// Initialize layout functionality
function initializeLayout() {
    console.log('Initializing layout functionality...');
    
    // Initialize sidebar toggle for desktop and mobile
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const wrapper = document.querySelector('.wrapper');
    
    // Standardize navbar elements across all pages
    standardizeNavbar();
    
    // Ensure logout option is present in sidebar
    ensureLogoutInSidebar();
    
    // Ensure translator icon exists
    ensureTranslatorExists();
    
    // Standardize notifications badge
    standardizeNotifications();
    
    if (sidebarToggle && sidebar) {
        console.log('Sidebar toggle button found, adding event listener');
        
        // Use touchstart and click events for better mobile responsiveness
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Stop the event from bubbling up to document
            
            // Handle differently for mobile vs desktop
            if (window.innerWidth < 992) {
                // For mobile: toggle the 'show' class
                sidebar.classList.toggle('show');
                
                // Add overlay if sidebar is shown
                if (sidebar.classList.contains('show')) {
                    // Create overlay if it doesn't exist
                    let overlay = document.querySelector('.sidebar-overlay');
                    if (!overlay) {
                        overlay = document.createElement('div');
                        overlay.className = 'sidebar-overlay';
                        document.body.appendChild(overlay);
                        
                        // Add click event to overlay to close sidebar
                        overlay.addEventListener('click', function() {
                            sidebar.classList.remove('show');
                            overlay.remove();
                        });
                    }
                } else {
                    // Remove overlay if sidebar is hidden
                    const overlay = document.querySelector('.sidebar-overlay');
                    if (overlay) overlay.remove();
                }
            } else {
                // For desktop: toggle sidebar collapsed state
                wrapper.classList.toggle('sidebar-collapsed');
            }
        });
    } else {
        console.warn('Sidebar toggle button or sidebar not found');
    }
    
    // Handle submenu toggles
    const submenuToggles = document.querySelectorAll('.nav-link[data-bs-toggle="collapse"]');
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            // Stop propagation to prevent document click handler from closing sidebar
            e.stopPropagation();
            
            // If on mobile, make sure parent menu stays visible when submenu is opened
            if (window.innerWidth < 992) {
                sidebar.classList.add('show');
            }
        });
    });
    
    // Prevent sidebar links from closing the sidebar on mobile
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link:not([data-bs-toggle="collapse"])');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only stop propagation, don't prevent default (so links still work)
            e.stopPropagation();
        });
    });
    
    // Close sidebar when clicking outside on mobile (improved version)
    document.addEventListener('click', function(e) {
        if (window.innerWidth < 992 && sidebar) {
            const sidebarToggleBtn = document.getElementById('sidebar-toggle');
            
            // If clicked element is not within sidebar and not the toggle button
            if (sidebar.classList.contains('show') && 
                !sidebar.contains(e.target) && 
                e.target !== sidebarToggleBtn && 
                !sidebarToggleBtn?.contains(e.target)) {
                
                // Remove sidebar show class
                sidebar.classList.remove('show');
                
                // Remove overlay
                const overlay = document.querySelector('.sidebar-overlay');
                if (overlay) overlay.remove();
            }
        }
    });
    
    // Ensure sidebar behaves correctly on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 992) {
            // Remove mobile-specific elements when returning to desktop size
            const overlay = document.querySelector('.sidebar-overlay');
            if (overlay) overlay.remove();
            
            // Ensure proper desktop state
            if (sidebar) sidebar.classList.remove('show');
        }
    });
    
    // Set the user name from localStorage if exists (for consistency across pages)
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        const storedName = localStorage.getItem('userName');
        if (storedName) {
            userNameElement.textContent = storedName;
        }
    }
    
    // Set avatar from localStorage if exists
    const avatarElement = document.getElementById('userAvatar');
    if (avatarElement) {
        const storedAvatar = localStorage.getItem('userAvatar');
        if (storedAvatar) {
            avatarElement.src = storedAvatar;
        }
    }
    
    // Then load fresh data from API
    loadUserProfileForNavbar();
    
    // Set up profile link
    const profileLink = document.getElementById('profileLink');
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
            showProfileModal();
        });
    }

    // Ensure all sidebar links work properly
    fixSidebarLinks();
    
    // Add app grid button if missing
    ensureAppGridExists();
}

/**
 * Standardizes the navbar elements across all admin pages
 * Ensures consistent headers, search bars, and notification elements
 */
function standardizeNavbar() {
    console.log('Standardizing navbar elements...');
    
    // Get current page title from HTML or fallback to URL-based title
    const pageTitle = determinePageTitle();
    
    // Find the navbar container
    const navbarContent = document.querySelector('.navbar .container-fluid');
    if (!navbarContent) {
        console.error('Cannot find navbar container');
        return;
    }
    
    // Look for navbar collapse area
    const navbarCollapse = navbarContent.querySelector('.collapse.navbar-collapse');
    if (!navbarCollapse) {
        console.error('Cannot find navbar collapse area');
        return;
    }
    
    // Check if there's already a title and add it if missing
    if (!navbarCollapse.querySelector('h1')) {
        // Create title element if it doesn't exist
        const searchBar = navbarCollapse.querySelector('.d-flex.flex-grow-1');
        
        // Create and insert title element before search bar (if exists) or as first child
        const titleElement = document.createElement('h1');
        titleElement.className = 'ms-md-3';
        titleElement.innerText = pageTitle;
        
        if (searchBar) {
            // Replace search bar with title for better consistency
            navbarCollapse.insertBefore(titleElement, searchBar);
        } else {
            // Add as first child if no search bar
            navbarCollapse.insertBefore(titleElement, navbarCollapse.firstChild);
        }
    } else {
        // Update existing title for consistency
        const titleElement = navbarCollapse.querySelector('h1');
        titleElement.innerText = pageTitle;
    }
    
    // Standard user name format
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = 'Admin User';
        localStorage.setItem('userName', 'Admin User');
    }
}

// Fix sidebar link functionality
function fixSidebarLinks() {
    // Ensure all ecommerce links work
    const ecommerceLinks = {
        'products': 'products.html',
        'addProduct': 'add-product.html',
        'orders': 'orders.html',
        'promotions': 'promotions.html',
        'coupons': 'coupons.html',
        'customers': 'customers.html'
    };
    
    // Find all sidebar links and fix them if needed
    for (const [key, url] of Object.entries(ecommerceLinks)) {
        const links = document.querySelectorAll(`.sidebar .nav-link span[data-translate="${key}"]`);
        links.forEach(span => {
            const link = span.closest('a');
            if (link && (!link.href || link.href === '#' || link.href.endsWith('#'))) {
                link.href = url;
            }
        });
    }
}

// Ensure logout option exists in sidebar
function ensureLogoutInSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    const sidebarMenu = sidebar.querySelector('.sidebar-menu ul.nav');
    if (!sidebarMenu) return;
    
    // Check if logout item already exists
    let logoutItem = null;
    const sidebarItems = sidebarMenu.querySelectorAll('.nav-item');
    
    // Look for existing logout button
    for (const item of sidebarItems) {
        const link = item.querySelector('a');
        if (link && link.textContent.includes('Logout')) {
            logoutItem = item;
            break;
        }
        
        const span = item.querySelector('span[data-translate="logout"]');
        if (span) {
            logoutItem = item;
            break;
        }
    }
    
    // Create logout item if it doesn't exist
    if (!logoutItem) {
        logoutItem = document.createElement('li');
        logoutItem.className = 'nav-item mt-auto';
        
        const logoutLink = document.createElement('a');
        logoutLink.className = 'nav-link';
        logoutLink.href = '#';
        logoutLink.setAttribute('data-action', 'logout');
        logoutLink.onclick = function(e) {
            e.preventDefault();
            window.logout();
        };
        
        const logoutIcon = document.createElement('i');
        logoutIcon.className = 'bi bi-box-arrow-right';
        
        const logoutText = document.createElement('span');
        logoutText.setAttribute('data-translate', 'logout');
        logoutText.textContent = 'Logout';
        
        logoutLink.appendChild(logoutIcon);
        logoutLink.appendChild(document.createTextNode(' '));
        logoutLink.appendChild(logoutText);
        logoutItem.appendChild(logoutLink);
        
        // Add some spacing before logout button
        const spacer = document.createElement('li');
        spacer.className = 'nav-item';
        spacer.style.flexGrow = 1;
        spacer.innerHTML = '<div class="py-3"></div>';
        
        // Append to menu
        sidebarMenu.appendChild(spacer);
        sidebarMenu.appendChild(logoutItem);
    }
    
    // Ensure the logout function is bound
    const logoutLink = logoutItem.querySelector('a');
    if (logoutLink) {
        logoutLink.onclick = function(e) {
            e.preventDefault();
            window.logout();
        };
    }
}

// Ensure app grid exists in navbar
function ensureAppGridExists() {
    // Check if app grid button exists
    let appGrid = document.querySelector('.nav-item.dropdown button i.bi-grid');
    
    if (!appGrid) {
        console.log('App grid button not found, adding it to navbar');
        const navbarRightSide = document.querySelector('.navbar .d-flex.align-items-center.gap-3');
        
        if (navbarRightSide) {
            // Create app grid dropdown
            const appGridHtml = `
                <div class="nav-item dropdown">
                    <button class="btn btn-link text-dark p-0" data-bs-toggle="dropdown">
                        <i class="bi bi-grid fs-5"></i>
                    </button>
                    <div class="dropdown-menu dropdown-menu-end p-3" style="min-width: 280px;">
                        <h6 class="dropdown-header" data-translate="quickAccess">Quick Access</h6>
                        <div class="row g-2">
                            <div class="col-4 text-center">
                                <a href="products.html" class="d-block p-2 rounded text-decoration-none">
                                    <i class="bi bi-box fs-4 d-block mb-1 text-primary"></i>
                                    <span class="small" data-translate="products">Products</span>
                                </a>
                            </div>
                            <div class="col-4 text-center">
                                <a href="orders.html" class="d-block p-2 rounded text-decoration-none">
                                    <i class="bi bi-cart fs-4 d-block mb-1 text-success"></i>
                                    <span class="small" data-translate="orders">Orders</span>
                                </a>
                            </div>
                            <div class="col-4 text-center">
                                <a href="customers.html" class="d-block p-2 rounded text-decoration-none">
                                    <i class="bi bi-people fs-4 d-block mb-1 text-info"></i>
                                    <span class="small" data-translate="customers">Customers</span>
                                </a>
                            </div>
                            <div class="col-4 text-center">
                                <a href="index.html" class="d-block p-2 rounded text-decoration-none">
                                    <i class="bi bi-graph-up fs-4 d-block mb-1 text-warning"></i>
                                    <span class="small" data-translate="analytics">Analytics</span>
                                </a>
                            </div>
                            <div class="col-4 text-center">
                                <a href="promotions.html" class="d-block p-2 rounded text-decoration-none">
                                    <i class="bi bi-tag fs-4 d-block mb-1 text-secondary"></i>
                                    <span class="small" data-translate="promotions">Promotions</span>
                                </a>
                            </div>
                            <div class="col-4 text-center">
                                <a href="coupons.html" class="d-block p-2 rounded text-decoration-none">
                                    <i class="bi bi-ticket-perforated fs-4 d-block mb-1 text-danger"></i>
                                    <span class="small" data-translate="coupons">Coupons</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Insert before profile dropdown
            const profileDropdown = navbarRightSide.querySelector('.dropdown');
            if (profileDropdown) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = appGridHtml.trim();
                navbarRightSide.insertBefore(tempDiv.firstChild, profileDropdown);
            } else {
                navbarRightSide.innerHTML += appGridHtml;
            }
        }
    }
}

// Ensure translator exists in navbar
function ensureTranslatorExists() {
    // Check if translator button exists
    let translatorIcon = document.querySelector('.nav-item.dropdown button i.bi-translate');
    
    if (!translatorIcon) {
        console.log('Translator button not found, adding it to navbar');
        const navbarRightSide = document.querySelector('.navbar .d-flex.align-items-center.gap-3');
        
        if (navbarRightSide) {
            // Create translator dropdown
            const translatorHtml = `
                <div class="nav-item dropdown">
                    <button class="btn btn-link text-dark p-0" data-bs-toggle="dropdown">
                        <i class="bi bi-translate fs-5"></i>
                    </button>
                    <div class="dropdown-menu dropdown-menu-end">
                        <h6 class="dropdown-header" data-translate="selectLanguage">Select Language</h6>
                        <div class="dropdown-divider"></div>
                        <a class="dropdown-item d-flex align-items-center" href="#" data-lang="en">
                            <img src="/admin/images/united-kingdom.png" alt="English" class="me-2" width="20">
                            <span>English</span>
                        </a>
                        <a class="dropdown-item d-flex align-items-center" href="#" data-lang="es">
                            <img src="/admin/images/spain.png" alt="Spanish" class="me-2" width="20">
                            <span>Español</span>
                        </a>
                        <a class="dropdown-item d-flex align-items-center" href="#" data-lang="fr">
                            <img src="/admin/images/france.png" alt="French" class="me-2" width="20">
                            <span>Français</span>
                        </a>
                    </div>
                </div>
            `;
            
            // Insert the translator button at the beginning
            navbarRightSide.insertAdjacentHTML('afterbegin', translatorHtml);
            
            // Add event listeners to language selectors
            const langSelectors = document.querySelectorAll('[data-lang]');
            langSelectors.forEach(selector => {
                selector.addEventListener('click', function(e) {
                    e.preventDefault();
                    const lang = this.getAttribute('data-lang');
                    if (lang && window.changeLanguage) {
                        window.changeLanguage(lang);
                    }
                });
            });
        }
    }
}

// Standardize notifications
function standardizeNotifications() {
    // Find notification badge
    const notificationBadge = document.querySelector('.bi-bell + .badge');
    
    if (notificationBadge) {
        // Set standard notification count
        notificationBadge.textContent = '2';
    } else {
        // If no notification badge found, add the entire notification component
        const navbarRightSide = document.querySelector('.navbar .d-flex.align-items-center.gap-3');
        
        if (navbarRightSide) {
            // Create notifications dropdown
            const notificationsHtml = `
                <div class="nav-item dropdown">
                    <button class="btn btn-link text-dark p-0 position-relative" data-bs-toggle="dropdown">
                        <i class="bi bi-bell fs-5"></i>
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                            2
                            <span class="visually-hidden" data-translate="unreadNotifications">unread notifications</span>
                        </span>
                    </button>
                    <div class="dropdown-menu dropdown-menu-end notification-dropdown">
                        <h6 class="dropdown-header" data-translate="notifications">Notifications</h6>
                        <div class="dropdown-divider"></div>
                        <!-- Notification Items -->
                        <a class="dropdown-item" href="#">
                            <div class="d-flex align-items-center">
                                <div class="notification-icon bg-primary text-white rounded-circle p-2">
                                    <i class="bi bi-cart"></i>
                                </div>
                                <div class="ms-3">
                                    <p class="mb-0" data-translate="newOrder">New order received</p>
                                    <small class="text-muted"><span>2</span> <span data-translate="minutesAgo">mins ago</span></small>
                                </div>
                            </div>
                        </a>
                        <a class="dropdown-item" href="#">
                            <div class="d-flex align-items-center">
                                <div class="notification-icon bg-success text-white rounded-circle p-2">
                                    <i class="bi bi-person"></i>
                                </div>
                                <div class="ms-3">
                                    <p class="mb-0" data-translate="newCustomer">New customer registered</p>
                                    <small class="text-muted"><span>1</span> <span data-translate="hourAgo">hour ago</span></small>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            `;
            
            // Add notifications right after translator button if it exists
            const translatorButton = navbarRightSide.querySelector('.nav-item.dropdown button i.bi-translate');
            if (translatorButton) {
                const translatorParent = translatorButton.closest('.nav-item.dropdown');
                translatorParent.insertAdjacentHTML('afterend', notificationsHtml);
            } else {
                // Add at the beginning if no translator button
                navbarRightSide.insertAdjacentHTML('afterbegin', notificationsHtml);
            }
        }
    }
}

// Determines the page title based on the current URL or document title
function determinePageTitle() {
    // First try to get from document title
    if (document.title) {
        // Clean up the title if it has "- Admin Dashboard" suffix
        let title = document.title;
        if (title.includes(' - Admin Dashboard')) {
            title = title.replace(' - Admin Dashboard', '');
        }
        if (title) return title;
    }
    
    // Fallback: determine from URL
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '');
    
    // Map of page names to titles
    const pageTitles = {
        'index': 'Admin Dashboard',
        'products': 'Product Management',
        'add-product': 'Add Product',
        'orders': 'Order Management',
        'customers': 'Customer Management',
        'promotions': 'Promotion Management',
        'coupons': 'Coupon Management',
        'reports': 'Analytics Reports',
        'users': 'User Management',
        'settings': 'System Settings'
    };
    
    return pageTitles[page] || 'Admin Dashboard';
}

// Load user profile data specifically for the navbar 
async function loadUserProfileForNavbar() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            window.location.href = '/admin/login.html';
            return;
        }

        // Try to get cached user name from localStorage first
        const cachedUserName = localStorage.getItem('userName');
        
        // Update UI with cached data immediately if available
        if (cachedUserName) {
            updateNavbarUserDisplay(cachedUserName);
        }

        // Attempt to fetch fresh data from API
        const response = await fetch(`${window.API_URL}/admin/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // If we have cached data, don't treat this as a critical error
            if (cachedUserName) {
                console.warn('Using cached profile data due to API error');
                return;
            }
            throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
        }

        const userData = await response.json();
        console.log('User profile data loaded for navbar:', userData);
        
        // Format user name consistently - always use "Admin User" for consistency
        const displayName = 'Admin User';
        
        // Store in localStorage for future use
        localStorage.setItem('userName', displayName);
        
        // Update navbar with user data
        updateNavbarUserDisplay(displayName);
        
        // If user has a profile image, update the avatar
        if (userData.profileImage) {
            updateProfileImage(userData.profileImage);
        }
    } catch (error) {
        console.error('Error loading profile for navbar:', error);
        // Try to recover using cached data
        const cachedUserName = localStorage.getItem('userName');
        if (cachedUserName) {
            console.warn('Using cached profile data due to error:', error.message);
            updateNavbarUserDisplay(cachedUserName);
        } else {
            // Last resort fallback
            updateNavbarUserDisplay('Admin User');
        }
    }
}

// Helper function to update navbar user display
function updateNavbarUserDisplay(displayName) {
    // Update all user name elements in navbar
    const userNameElements = document.querySelectorAll('#userName');
    userNameElements.forEach(element => {
        element.textContent = displayName;
    });
}

// Helper function to update profile images
function updateProfileImage(profileImageUrl) {
    // Try multiple selectors to ensure we find all avatar elements
    const avatarElements = document.querySelectorAll('#userAvatar, .avatar, .user-avatar, .rounded-circle');
    avatarElements.forEach(avatarImg => {
        if (avatarImg && avatarImg.tagName === 'IMG') {
            // Make sure the path is absolute
            avatarImg.src = profileImageUrl.startsWith('http') 
                ? profileImageUrl 
                : profileImageUrl.startsWith('/') 
                    ? profileImageUrl 
                    : `/${profileImageUrl}`;
                    
            // Remove default styling that might be applied for missing images
            avatarImg.classList.remove('default-avatar');
        }
    });
}

// Show profile modal with user data
async function showProfileModal() {
    try {
        // Check if profile modal exists on this page
        const profileModalElement = document.getElementById('profileModal');
        if (!profileModalElement) {
            // Redirect to dashboard if modal doesn't exist on this page
            window.location.href = '/admin/index.html?showProfile=true';
            return;
        }
        
        const userData = await loadUserProfileForNavbar();
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
                : `${window.location.origin}${userData.profileImage}`;
        } else {
            document.getElementById('profilePreview').src = '/admin/images/man.png';
        }
        
        // Show modal
        const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
        profileModal.show();
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('error', 'Failed to load profile data');
    }
} 

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeLayout); 