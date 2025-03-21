/**
 * Sidebar navigation functionality
 */

// Function to load sidebar with active page highlighting
function loadSidebar(activePage) {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = userData.role === 'admin';
    
    // Get sidebar container
    const sidebarContainer = document.getElementById('sidebarContainer');
    if (!sidebarContainer) return;
    
    // Set sidebar HTML
    sidebarContainer.innerHTML = `
        <div class="position-sticky pt-3">
            <ul class="nav flex-column">
                <li class="nav-item">
                    <a class="nav-link ${activePage === 'dashboard' ? 'active' : ''}" href="index.html">
                        <i class="bi bi-speedometer2"></i> Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link ${activePage === 'products' ? 'active' : ''}" href="products.html">
                        <i class="bi bi-box"></i> Products
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link ${activePage === 'orders' ? 'active' : ''}" href="orders.html">
                        <i class="bi bi-cart"></i> Orders
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link ${activePage === 'customers' ? 'active' : ''}" href="customers.html">
                        <i class="bi bi-people"></i> Customers
                    </a>
                </li>
                ${isAdmin ? `
                <li class="nav-item">
                    <a class="nav-link ${activePage === 'users' ? 'active' : ''}" href="users.html">
                        <i class="bi bi-person-badge"></i> User Management
                    </a>
                </li>
                ` : ''}
                <li class="nav-item">
                    <a class="nav-link ${activePage === 'reports' ? 'active' : ''}" href="reports.html">
                        <i class="bi bi-bar-chart"></i> Reports
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link ${activePage === 'settings' ? 'active' : ''}" href="settings.html">
                        <i class="bi bi-gear"></i> Settings
                    </a>
                </li>
            </ul>
            
            <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                <span>Account</span>
            </h6>
            <ul class="nav flex-column mb-2">
                <li class="nav-item">
                    <a class="nav-link ${activePage === 'profile' ? 'active' : ''}" href="profile.html">
                        <i class="bi bi-person-circle"></i> Profile
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" id="sidebarLogoutLink">
                        <i class="bi bi-box-arrow-right"></i> Logout
                    </a>
                </li>
            </ul>
        </div>
    `;
    
    // Add event listener for logout
    const logoutLink = document.getElementById('sidebarLogoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof logout === 'function') {
                logout();
            } else {
                console.error('Logout function not available');
            }
        });
    }
    
    // Display user info if available
    if (userData && userData.name) {
        const userInfoElement = document.createElement('div');
        userInfoElement.className = 'sidebar-user-info px-3 py-2 d-flex align-items-center';
        userInfoElement.innerHTML = `
            <div class="avatar bg-primary rounded-circle text-white me-2">
                ${userData.name.charAt(0).toUpperCase()}
            </div>
            <div class="user-details">
                <div class="user-name">${userData.name}</div>
                <div class="user-role"><span class="badge bg-${getRoleBadgeClass(userData.role)}">${userData.role}</span></div>
            </div>
        `;
        
        // Insert at the top of the sidebar
        sidebarContainer.querySelector('.position-sticky').prepend(userInfoElement);
    }
}

// Helper function to get role badge class
function getRoleBadgeClass(role) {
    switch (role) {
        case 'admin': return 'danger';
        case 'manager': return 'warning';
        case 'editor': return 'info';
        default: return 'secondary';
    }
}

// Export the loadSidebar function
window.loadSidebar = loadSidebar; 