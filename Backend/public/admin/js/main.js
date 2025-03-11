// Debugging helper
function debug(message, data) {
    const timestamp = new Date().toISOString().substr(11, 8);
    console.log(`[${timestamp}] ${message}`, data || '');
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[' + new Date().toLocaleTimeString() + '] Analytics dashboard initializing');
    
    // Ensure we have the API URL
    if (typeof window.API_URL === 'undefined') {
        window.API_URL = '/api';
    }
    console.log('Using existing API_URL:', window.API_URL);
    
    // Initialize UI components
    initializeSidebar();
    initializeDropdowns();
    initializeDateRangeButtons();
    
    // Force destroy any existing charts to prevent the "already in use" error
    destroyAllCharts();
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.error('No authentication token found. Redirecting to login.');
        window.location.href = '/admin/login.html';
        return;
    }
    
    // Fetch initial analytics data
    loadAnalyticsData('7days');
});

// Global variables for chart instances
window.sessionsChart = null;
window.pageviewsChart = null;
window.currentDateRange = '7days';

/**
 * Destroy all charts to prevent "Canvas is already in use" errors
 */
function destroyAllCharts() {
    try {
        // Find all canvas elements for charts
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            // Get the chart instance if it exists
            const chartInstance = Chart.getChart(canvas);
            if (chartInstance) {
                console.log('Destroying existing chart on canvas:', canvas.id);
                chartInstance.destroy();
            }
        });
        
        // Also reset our global variables
        if (window.sessionsChart) {
            window.sessionsChart.destroy();
            window.sessionsChart = null;
        }
        
        if (window.pageviewsChart) {
            window.pageviewsChart.destroy();
            window.pageviewsChart = null;
        }
    } catch (e) {
        console.error('Error destroying charts:', e);
    }
}

// Sidebar Toggle
function initializeSidebar() {
    // Toggle sidebar on mobile
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 992 && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target) && 
            sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }
    });

    // Active link handling
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (!link.dataset.bsToggle) {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
}

// Initialize Charts
function initializeCharts() {
    const sessionsCtx = document.getElementById('sessionsChart');
    const pageviewsCtx = document.getElementById('pageviewsChart');

    // Only initialize charts if we're on the dashboard page
    if (sessionsCtx && pageviewsCtx) {
        // Destroy existing charts if they exist
        if (sessionsChart) {
            sessionsChart.destroy();
        }
        if (pageviewsChart) {
            pageviewsChart.destroy();
        }
        
        // Sessions Chart
        sessionsChart = new Chart(sessionsCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Sessions',
                    data: [3500, 3800, 3200, 4200, 3400, 3800, 4600],
                    borderColor: '#0d6efd',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            borderDash: [2, 2]
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        // Pageviews Chart
        pageviewsChart = new Chart(pageviewsCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Pageviews',
                    data: [15000, 18000, 12000, 20000, 17000, 22000, 19000],
                    backgroundColor: 'rgba(13, 110, 253, 0.2)',
                    borderColor: '#0d6efd',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            borderDash: [2, 2]
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

/**
 * Load analytics data from the server
 * @param {string} range - The date range to load (7days, 14days, 30days)
 */
async function loadAnalyticsData(range = '7days') {
    console.log(`Loading analytics data for range: ${range}`);
    
    // Show loading state
    document.querySelectorAll('.stat-card').forEach(card => {
        card.querySelector('.stat-value').innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        card.querySelector('.stat-change').textContent = '';
    });
    
    // Show loading overlay on charts
    document.querySelectorAll('.chart-container').forEach(container => {
        container.classList.add('loading');
        const loader = document.createElement('div');
        loader.className = 'chart-loader';
        loader.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        container.appendChild(loader);
    });
    
    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    
    try {
        // Make the API request with proper authentication
        const response = await fetch(`${window.API_URL}/analytics?range=${range}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // Handle HTTP errors
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse the response
        const data = await response.json();
        console.log('Analytics data loaded:', data);
        
        // Update UI with the loaded data
        updateAnalyticsCards(data);
        
        // Remove loading overlays
        document.querySelectorAll('.chart-container').forEach(container => {
            container.classList.remove('loading');
            const loader = container.querySelector('.chart-loader');
            if (loader) {
                loader.remove();
            }
        });
        
        // Update charts with new data
        destroyAllCharts(); // Ensure charts are destroyed before creating new ones
        updateCharts(data);
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        
        // Show error state in UI
        document.querySelectorAll('.stat-card').forEach(card => {
            card.querySelector('.stat-value').textContent = 'N/A';
            card.querySelector('.stat-change').textContent = 'Error loading data';
        });
        
        // Remove loading overlays
        document.querySelectorAll('.chart-container').forEach(container => {
            container.classList.remove('loading');
            const loader = container.querySelector('.chart-loader');
            if (loader) {
                loader.remove();
            }
        });
    }
}

// Function to update analytics cards with provided data
function updateAnalyticsCards(data) {
    if (!data) return;
    
    updateCard('pageviews', data.pageviews.value, data.pageviews.change);
    updateCard('avgSession', data.avgSession.value, data.avgSession.change);
    updateCard('visitors', data.visitors.value, data.visitors.change);
    updateCard('bounceRate', data.bounceRate.value, data.bounceRate.change);
}

// Helper function to update a single analytics card
function updateCard(type, value, change) {
    const card = document.querySelector(`.stat-card[data-stat="${type}"]`);
    if (!card) return;
    
    // Update value
    const digitElement = card.querySelector('.stat-digit');
    if (digitElement) digitElement.textContent = value;
    
    // Update change percentage and icon
    const changeElement = card.querySelector('.stat-change');
    if (changeElement) {
        const icon = changeElement.querySelector('i');
        const changeText = changeElement.querySelector('span:first-of-type');
        
        if (change >= 0) {
            // Positive change
            if (icon) {
                icon.className = 'bi bi-arrow-up-short';
                icon.style.color = '#198754'; // Bootstrap success color
            }
            if (changeText) {
                changeText.className = 'text-success';
                changeText.textContent = `${change}%`;
            }
        } else {
            // Negative change
            if (icon) {
                icon.className = 'bi bi-arrow-down-short';
                icon.style.color = '#dc3545'; // Bootstrap danger color
            }
            if (changeText) {
                changeText.className = 'text-danger';
                changeText.textContent = `${Math.abs(change)}%`;
            }
        }
    }
    
    // Update progress bar
    const progressBar = card.querySelector('.progress-bar');
    if (progressBar) {
        const absChange = Math.abs(change);
        progressBar.style.width = `${Math.min(absChange * 2, 100)}%`;
        progressBar.className = change >= 0 ? 'progress-bar bg-success' : 'progress-bar bg-danger';
    }
}

/**
 * Update chart displays with analytics data
 * @param {Object} data - Analytics data from API
 */
function updateCharts(data) {
    // Update Sessions Chart
    try {
        const sessionsCanvas = document.getElementById('sessionsChart');
        if (!sessionsCanvas) {
            console.warn('Sessions chart canvas not found');
            return;
        }

        console.log('Sessions data for chart:', data.sessions?.data || []);
        
        // Create Sessions Chart
        const sessionsCtx = sessionsCanvas.getContext('2d');
        
        // Create the chart
        window.sessionsChart = new Chart(sessionsCtx, {
            type: 'line',
            data: {
                labels: data.sessions?.labels || [],
                datasets: [{
                    label: 'Sessions',
                    data: data.sessions?.data || [],
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78, 115, 223, 0.05)',
                    pointBackgroundColor: '#4e73df',
                    pointBorderColor: '#fff',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#5a5c69',
                        bodyColor: '#858796',
                        borderColor: '#dddfeb',
                        borderWidth: 1,
                        titleMarginBottom: 10,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            borderDash: [2],
                            drawBorder: false
                        },
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating sessions chart:', error);
    }

    // Update Pageviews Chart
    try {
        const pageviewsCanvas = document.getElementById('pageviewsChart');
        if (!pageviewsCanvas) {
            console.warn('Pageviews chart canvas not found');
            return;
        }

        console.log('Pageviews data for chart:', data.pageviews?.data || []);
        
        // Create Pageviews Chart
        const pageviewsCtx = pageviewsCanvas.getContext('2d');
        
        // Create the chart
        window.pageviewsChart = new Chart(pageviewsCtx, {
            type: 'bar',
            data: {
                labels: data.pageviews?.labels || [],
                datasets: [{
                    label: 'Pageviews',
                    data: data.pageviews?.data || [],
                    backgroundColor: '#36b9cc',
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#5a5c69',
                        bodyColor: '#858796',
                        borderColor: '#dddfeb',
                        borderWidth: 1,
                        titleMarginBottom: 10,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            borderDash: [2],
                            drawBorder: false
                        },
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating pageviews chart:', error);
    }
}

// Initialize Dropdowns
function initializeDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(dropdown => {
        new bootstrap.Dropdown(dropdown);
    });
}

// Add profile image upload handling
function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profileAvatar').src = e.target.result;
            document.querySelector('.user-avatar').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Update profile function
async function updateProfile(event) {
    event.preventDefault();
    
    const formData = new FormData();
    const fileInput = document.getElementById('avatarInput');
    
    if (fileInput.files[0]) {
        formData.append('avatar', fileInput.files[0]);
    }
    
    try {
        const response = await fetch('/api/profile/update', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Profile update failed');
        }
        
        const result = await response.json();
        if (result.avatar) {
            document.getElementById('profileAvatar').src = result.avatar;
            document.querySelector('.user-avatar').src = result.avatar;
        }
        
        // Show success message
        showToast('success', 'Profile updated successfully');
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('error', 'Failed to update profile');
    }
}

// Initialize date range buttons
function initializeDateRangeButtons() {
    console.log('Initializing date range buttons');
    
    const dateRangeButtons = document.querySelectorAll('button[name="dateRange"]');
    console.log('Found date range buttons:', dateRangeButtons.length);
    
    if (dateRangeButtons.length > 0) {
        // Mark 7 days as active by default
        const defaultBtn = document.getElementById('btn7days');
        if (defaultBtn && !defaultBtn.classList.contains('active')) {
            defaultBtn.classList.add('active');
        }
        
        dateRangeButtons.forEach(button => {
            console.log('Setting up click handler for', button.id);
            
            button.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Date range button clicked:', this.id);
                
                // Remove active class from all buttons
                dateRangeButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get the range from button ID
                const range = this.id.replace('btn', '').toLowerCase();
                window.currentDateRange = range;
                console.log('Selected range:', range);
                
                // Load data for selected range
                loadAnalyticsData(range);
            });
        });
    } else {
        console.warn('No date range buttons found!');
    }
} 