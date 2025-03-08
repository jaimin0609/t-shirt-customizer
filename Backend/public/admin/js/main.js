// Debugging helper
function debug(message, data) {
    const timestamp = new Date().toISOString().substr(11, 8);
    console.log(`[${timestamp}] ${message}`, data || '');
}

// Log initial setup
debug('Analytics dashboard initializing');

// Use the API_URL from the global scope (set by config.js)
const API_URL = window.API_URL || '/api';
debug('API URL:', API_URL);

// Ensure API_URL is available on window object
window.API_URL = API_URL;

// Global chart instances
let sessionsChart = null;
let pageviewsChart = null;

// Current selected date range
let currentDateRange = '7days';

// Initialize charts and dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    initializeCharts();
    initializeDropdowns();
    initializeDateRangeButtons();
    loadAnalyticsData(currentDateRange);
    
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleProfileImageUpload);
    }
    
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }
});

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
        // Sessions Chart
        new Chart(sessionsCtx, {
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
        new Chart(pageviewsCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Pageviews',
                    data: [10000, 15000, 20000, 15000, 15000, 20000, 12000],
                    backgroundColor: '#0d6efd'
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

// Load Analytics Data
async function loadAnalyticsData(range) {
    try {
        const loadingStart = performance.now();
        
        // Show loading state in cards
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.add('loading');
        });
        
        // Add loading overlay to charts
        document.querySelectorAll('#sessionsChart, #pageviewsChart').forEach(chart => {
            if (chart) {
                const parent = chart.parentElement;
                if (!parent.querySelector('.chart-loading')) {
                    const loadingDiv = document.createElement('div');
                    loadingDiv.className = 'chart-loading';
                    loadingDiv.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
                    loadingDiv.style.position = 'absolute';
                    loadingDiv.style.top = '0';
                    loadingDiv.style.left = '0';
                    loadingDiv.style.width = '100%';
                    loadingDiv.style.height = '100%';
                    loadingDiv.style.display = 'flex';
                    loadingDiv.style.alignItems = 'center';
                    loadingDiv.style.justifyContent = 'center';
                    loadingDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                    loadingDiv.style.zIndex = '1';
                    parent.style.position = 'relative';
                    parent.appendChild(loadingDiv);
                }
            }
        });
        
        // Fetch analytics data with the selected date range
        const response = await fetch(window.API_URL + '/analytics?range=' + range);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ensure minimum loading time of 500ms for better UX
        const loadingTime = performance.now() - loadingStart;
        if (loadingTime < 500) {
            await new Promise(resolve => setTimeout(resolve, 500 - loadingTime));
        }
        
        console.log('Analytics data received:', data);
        
        // Use the API response directly - it already has the right format
        updateAnalyticsCards(data);
        updateCharts(data);
        
        // Remove loading states
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.remove('loading');
        });
        
        document.querySelectorAll('.chart-loading').forEach(loading => {
            loading.remove();
        });
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        
        // Use fallback data if API fails
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const fallbackData = {
            pageviews: { 
                value: '125.4K', 
                change: 15, 
                data: [1200, 1500, 2000, 1700, 1900, 2200, 1800],
                labels: labels
            },
            avgSession: { 
                value: '1m 12s', 
                change: -3,
                data: [75, 85, 70, 90, 80, 95, 72],
                labels: labels
            },
            visitors: { 
                value: '10.2K', 
                change: 8,
                data: [450, 550, 600, 500, 620, 580, 650],
                labels: labels
            },
            bounceRate: { 
                value: '49.7%', 
                change: -5,
                data: [52, 48, 45, 50, 47, 46, 49],
                labels: labels
            },
            sessionsData: [75, 85, 70, 90, 80, 95, 72], // Use avgSession data for sessions
            pageviewsData: [1200, 1500, 2000, 1700, 1900, 2200, 1800]
        };
        
        updateAnalyticsCards(fallbackData);
        updateCharts(fallbackData);
        
        // Remove loading states
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.remove('loading');
        });
        
        document.querySelectorAll('.chart-loading').forEach(loading => {
            loading.remove();
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

// Function to update charts with new data
function updateCharts(data) {
    // Default labels if none provided
    const labels = data.pageviews?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Check if the sessions chart exists
    if (document.getElementById('sessionsChart')) {
        try {
            // Destroy previous chart instance if it exists
            if (sessionsChart) {
                sessionsChart.destroy();
            }
            
            // Get sessions data from the API response
            // The API returns data in avgSession.data for sessions
            const sessionsData = data.avgSession?.data || [];
            
            console.log('Sessions data for chart:', sessionsData);
            
            // Create new chart
            const sessionsCtx = document.getElementById('sessionsChart').getContext('2d');
            sessionsChart = new Chart(sessionsCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Sessions',
                        data: sessionsData,
                        backgroundColor: 'rgba(66, 133, 244, 0.2)',
                        borderColor: 'rgba(66, 133, 244, 1)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointBackgroundColor: 'rgba(66, 133, 244, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1,
                        pointRadius: 4,
                        pointHoverRadius: 6
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
                            callbacks: {
                                label: function(context) {
                                    return context.parsed.y + ' sessions';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                borderDash: [3, 3],
                                drawBorder: false
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
        } catch (error) {
            console.error('Error creating sessions chart:', error);
        }
    }

    // Check if the pageviews chart exists
    if (document.getElementById('pageviewsChart')) {
        try {
            // Destroy previous chart instance if it exists
            if (pageviewsChart) {
                pageviewsChart.destroy();
            }
            
            // Get pageviews data from the API response
            const pageviewsData = data.pageviews?.data || [];
            
            console.log('Pageviews data for chart:', pageviewsData);
            
            // Create new chart
            const pageviewsCtx = document.getElementById('pageviewsChart').getContext('2d');
            pageviewsChart = new Chart(pageviewsCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Pageviews',
                        data: pageviewsData,
                        backgroundColor: '#0d6efd',
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
                            callbacks: {
                                label: function(context) {
                                    return context.parsed.y.toLocaleString() + ' pageviews';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                borderDash: [3, 3],
                                drawBorder: false
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
        } catch (error) {
            console.error('Error creating pageviews chart:', error);
        }
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
                currentDateRange = range;
                console.log('Selected range:', range);
                
                // Load data for selected range
                loadAnalyticsData(range);
            });
        });
    } else {
        console.warn('No date range buttons found!');
    }
} 