// Reports.js - Handles all analytics reports functionality
let API_URL;
let currentDateRange = '7days';
let charts = {};

document.addEventListener('DOMContentLoaded', function() {
    API_URL = window.API_URL || 'http://localhost:3000';
    initReports();
});

async function initReports() {
    // Initialize UI elements
    initDateRangeSelector();
    initTabHandlers();
    
    // Load initial data with default date range
    await loadReportData(currentDateRange);
}

// Date range selector initialization
function initDateRangeSelector() {
    // Date range buttons
    const dateRangeButtons = document.querySelectorAll('button[name="dateRange"]');
    dateRangeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            dateRangeButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const range = this.dataset.range;
            currentDateRange = range;
            
            // Toggle custom date range picker visibility
            const customDateRange = document.getElementById('customDateRange');
            if (range === 'custom') {
                customDateRange.style.display = 'block';
            } else {
                customDateRange.style.display = 'none';
                loadReportData(range);
            }
        });
    });

    // Custom date range form
    const dateRangeForm = document.getElementById('dateRangeForm');
    dateRangeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }
        
        loadReportData(`custom:${startDate}:${endDate}`);
    });
}

// Tab event handlers
function initTabHandlers() {
    const tabElems = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElems.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target').substring(1);
            // Resize charts when tab becomes visible to fix Chart.js rendering issues
            if (charts[targetId]) {
                Object.values(charts[targetId]).forEach(chart => {
                    if (chart) chart.resize();
                });
            }
        });
    });

    // Export buttons
    document.getElementById('exportTopProducts').addEventListener('click', () => exportTableData('topProductsList', 'Top_Products_Report'));
    document.getElementById('exportLowPerformers').addEventListener('click', () => exportTableData('lowPerformingList', 'Low_Performing_Products_Report'));
    document.getElementById('exportTopCustomers').addEventListener('click', () => exportTableData('topCustomersList', 'Top_Customers_Report'));
}

// Main function to load report data based on date range
async function loadReportData(dateRange) {
    try {
        showLoading();
        
        // Fetch data from API
        const response = await fetch(`${API_URL}/api/analytics/reports?range=${dateRange}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch report data');
        }
        
        const data = await response.json();
        
        // Initialize and update charts based on the data
        initializeSalesCharts(data.sales);
        initializeProductCharts(data.products);
        initializeCustomerCharts(data.customers);
        
        // Update tables and metrics
        updateSalesTables(data.sales);
        updateProductTables(data.products);
        updateCustomerTables(data.customers);
        
        // Update performance metrics
        updatePerformanceMetrics(data.products.metrics);
        
        hideLoading();
    } catch (error) {
        console.error('Error loading report data:', error);
        hideLoading();
        showErrorMessage('Failed to load report data. Please try again later.');
    }
}

// Initialize sales charts
function initializeSalesCharts(salesData) {
    if (!charts.sales) {
        charts.sales = {};
    }
    
    // Sales Overview Chart
    if (!charts.sales.overview) {
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        charts.sales.overview = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: salesData.dates,
                datasets: [
                    {
                        label: 'Revenue',
                        data: salesData.revenue,
                        borderColor: '#4e73df',
                        backgroundColor: 'rgba(78, 115, 223, 0.05)',
                        pointRadius: 3,
                        pointBackgroundColor: '#4e73df',
                        pointBorderColor: '#4e73df',
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#4e73df',
                        pointHoverBorderColor: '#4e73df',
                        pointHitRadius: 10,
                        pointBorderWidth: 2,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Orders',
                        data: salesData.orders,
                        borderColor: '#36b9cc',
                        backgroundColor: 'rgba(54, 185, 204, 0.05)',
                        pointRadius: 3,
                        pointBackgroundColor: '#36b9cc',
                        pointBorderColor: '#36b9cc',
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#36b9cc',
                        pointHoverBorderColor: '#36b9cc',
                        pointHitRadius: 10,
                        pointBorderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                if (label === 'Revenue') {
                                    return label + ': $' + context.raw.toFixed(2);
                                }
                                return label + ': ' + context.raw;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        grid: {
                            borderDash: [2],
                            drawBorder: false
                        }
                    }
                }
            }
        });
    } else {
        // Update existing chart data
        charts.sales.overview.data.labels = salesData.dates;
        charts.sales.overview.data.datasets[0].data = salesData.revenue;
        charts.sales.overview.data.datasets[1].data = salesData.orders;
        charts.sales.overview.update();
    }
    
    // Revenue Breakdown Chart
    if (!charts.sales.revenue) {
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        charts.sales.revenue = new Chart(revenueCtx, {
            type: 'doughnut',
            data: {
                labels: salesData.revenueBreakdown.labels,
                datasets: [{
                    data: salesData.revenueBreakdown.data,
                    backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'],
                    hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf', '#e0ad27', '#d13f2e'],
                    hoverBorderColor: "rgba(234, 236, 244, 1)",
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = '$' + context.raw.toFixed(2);
                                const percentage = Math.round((context.raw / salesData.revenueBreakdown.data.reduce((a, b) => a + b, 0)) * 100) + '%';
                                return `${label}: ${value} (${percentage})`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        // Update existing chart data
        charts.sales.revenue.data.labels = salesData.revenueBreakdown.labels;
        charts.sales.revenue.data.datasets[0].data = salesData.revenueBreakdown.data;
        charts.sales.revenue.update();
    }
    
    // Category Sales Chart
    if (!charts.sales.category) {
        const categoryCtx = document.getElementById('categorySalesChart').getContext('2d');
        charts.sales.category = new Chart(categoryCtx, {
            type: 'bar',
            data: {
                labels: salesData.categorySales.labels,
                datasets: [{
                    label: 'Sales ($)',
                    data: salesData.categorySales.data,
                    backgroundColor: [
                        'rgba(78, 115, 223, 0.7)',
                        'rgba(28, 200, 138, 0.7)',
                        'rgba(54, 185, 204, 0.7)',
                        'rgba(246, 194, 62, 0.7)',
                        'rgba(231, 74, 59, 0.7)',
                        'rgba(133, 135, 150, 0.7)'
                    ],
                    borderColor: [
                        'rgb(78, 115, 223)',
                        'rgb(28, 200, 138)',
                        'rgb(54, 185, 204)',
                        'rgb(246, 194, 62)',
                        'rgb(231, 74, 59)',
                        'rgb(133, 135, 150)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } else {
        // Update existing chart data
        charts.sales.category.data.labels = salesData.categorySales.labels;
        charts.sales.category.data.datasets[0].data = salesData.categorySales.data;
        charts.sales.category.update();
    }
}

// Initialize product charts
function initializeProductCharts(productData) {
    if (!charts.products) {
        charts.products = {};
    }

    // Product Conversion Chart
    if (!charts.products.conversion) {
        const conversionCtx = document.getElementById('productConversionChart').getContext('2d');
        charts.products.conversion = new Chart(conversionCtx, {
            type: 'bar',
            data: {
                labels: productData.dates,
                datasets: [
                    {
                        label: 'Views',
                        data: productData.views,
                        backgroundColor: 'rgba(54, 185, 204, 0.7)',
                        borderColor: 'rgb(54, 185, 204)',
                        borderWidth: 1,
                        order: 1
                    },
                    {
                        label: 'Conversions',
                        data: productData.conversions,
                        backgroundColor: 'rgba(28, 200, 138, 0.7)',
                        borderColor: 'rgb(28, 200, 138)',
                        borderWidth: 1,
                        order: 2
                    },
                    {
                        label: 'Conversion Rate',
                        data: productData.conversionRates,
                        type: 'line',
                        fill: false,
                        backgroundColor: 'rgba(246, 194, 62, 0.7)',
                        borderColor: 'rgb(246, 194, 62)',
                        tension: 0.3,
                        yAxisID: 'y1',
                        order: 0
                    }
                ]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Count'
                        }
                    },
                    y1: {
                        position: 'right',
                        beginAtZero: true,
                        max: 10,
                        title: {
                            display: true,
                            text: 'Conversion Rate (%)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    } else {
        // Update existing chart data
        charts.products.conversion.data.labels = productData.dates;
        charts.products.conversion.data.datasets[0].data = productData.views;
        charts.products.conversion.data.datasets[1].data = productData.conversions;
        charts.products.conversion.data.datasets[2].data = productData.conversionRates;
        charts.products.conversion.update();
    }
}

// Initialize customer charts
function initializeCustomerCharts(customerData) {
    if (!charts.customers) {
        charts.customers = {};
    }

    // Customer Acquisition Chart
    if (!charts.customers.acquisition) {
        const acquisitionCtx = document.getElementById('customerAcquisitionChart').getContext('2d');
        charts.customers.acquisition = new Chart(acquisitionCtx, {
            type: 'line',
            data: {
                labels: customerData.dates,
                datasets: [
                    {
                        label: 'New Customers',
                        data: customerData.newCustomers,
                        borderColor: '#4e73df',
                        backgroundColor: 'rgba(78, 115, 223, 0.05)',
                        pointRadius: 3,
                        pointBackgroundColor: '#4e73df',
                        pointBorderColor: '#fff',
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#4e73df',
                        pointHoverBorderColor: '#fff',
                        pointHitRadius: 10,
                        pointBorderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            borderDash: [2],
                            drawBorder: false
                        }
                    }
                }
            }
        });
    } else {
        // Update existing chart data
        charts.customers.acquisition.data.labels = customerData.dates;
        charts.customers.acquisition.data.datasets[0].data = customerData.newCustomers;
        charts.customers.acquisition.update();
    }

    // Customer Retention Chart
    if (!charts.customers.retention) {
        const retentionCtx = document.getElementById('customerRetentionChart').getContext('2d');
        charts.customers.retention = new Chart(retentionCtx, {
            type: 'line',
            data: {
                labels: customerData.months,
                datasets: [
                    {
                        label: 'Retention Rate',
                        data: customerData.retentionRates,
                        borderColor: '#1cc88a',
                        backgroundColor: 'rgba(28, 200, 138, 0.05)',
                        pointRadius: 3,
                        pointBackgroundColor: '#1cc88a',
                        pointBorderColor: '#fff',
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: '#1cc88a',
                        pointHoverBorderColor: '#fff',
                        pointHitRadius: 10,
                        pointBorderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Retention Rate: ' + context.raw + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            borderDash: [2],
                            drawBorder: false
                        }
                    }
                }
            }
        });
    } else {
        // Update existing chart data
        charts.customers.retention.data.labels = customerData.months;
        charts.customers.retention.data.datasets[0].data = customerData.retentionRates;
        charts.customers.retention.update();
    }

    // Demographics Chart
    if (!charts.customers.demographics) {
        const demographicsCtx = document.getElementById('demographicsChart').getContext('2d');
        charts.customers.demographics = new Chart(demographicsCtx, {
            type: 'pie',
            data: {
                labels: customerData.demographics.labels,
                datasets: [{
                    data: customerData.demographics.data,
                    backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'],
                    hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf', '#e0ad27', '#d13f2e'],
                    hoverBorderColor: "rgba(234, 236, 244, 1)",
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const percentage = Math.round((context.raw / customerData.demographics.data.reduce((a, b) => a + b, 0)) * 100) + '%';
                                return `${label}: ${percentage}`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        // Update existing chart data
        charts.customers.demographics.data.labels = customerData.demographics.labels;
        charts.customers.demographics.data.datasets[0].data = customerData.demographics.data;
        charts.customers.demographics.update();
    }
}

// Update sales tables with data
function updateSalesTables(salesData) {
    const topProductsList = document.getElementById('topProductsList');
    if (topProductsList) {
        let html = '';
        
        salesData.topProducts.forEach(product => {
            const growthClass = product.growth >= 0 ? 'text-success' : 'text-danger';
            const growthIcon = product.growth >= 0 ? 'bi-arrow-up' : 'bi-arrow-down';
            
            html += `
                <tr>
                    <td class="align-middle">
                        <div class="d-flex align-items-center">
                            <div class="product-img me-2" style="width: 40px; height: 40px; background-color: #f8f9fc; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-box text-primary"></i>
                            </div>
                            <div>
                                <h6 class="mb-0">${product.name}</h6>
                                <small class="text-muted">${product.sku}</small>
                            </div>
                        </div>
                    </td>
                    <td class="align-middle">${product.unitsSold}</td>
                    <td class="align-middle">$${product.revenue.toFixed(2)}</td>
                    <td class="align-middle">
                        <span class="${growthClass}">
                            <i class="bi ${growthIcon} me-1"></i>${Math.abs(product.growth)}%
                        </span>
                    </td>
                </tr>
            `;
        });
        
        topProductsList.innerHTML = html;
    }
}

// Update product tables with data
function updateProductTables(productData) {
    // Category Performance Table
    const categoryPerformanceList = document.getElementById('categoryPerformanceList');
    if (categoryPerformanceList) {
        let html = '';
        
        productData.categoryPerformance.forEach(category => {
            html += `
                <tr>
                    <td>${category.name}</td>
                    <td>${category.views}</td>
                    <td>${category.sales}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="me-2">${category.conversion}%</span>
                            <div class="progress" style="width: 80px; height: 6px;">
                                <div class="progress-bar bg-${getProgressBarColor(category.conversion)}" style="width: ${Math.min(category.conversion, 100)}%"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        categoryPerformanceList.innerHTML = html;
    }
    
    // Low Performing Products Table
    const lowPerformingList = document.getElementById('lowPerformingList');
    if (lowPerformingList) {
        let html = '';
        
        productData.lowPerforming.forEach(product => {
            html += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="product-img me-2" style="width: 40px; height: 40px; background-color: #f8f9fc; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-box text-danger"></i>
                            </div>
                            <div>
                                <h6 class="mb-0">${product.name}</h6>
                                <small class="text-muted">${product.sku}</small>
                            </div>
                        </div>
                    </td>
                    <td>${product.views}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="me-2">${product.conversion}%</span>
                            <div class="progress" style="width: 80px; height: 6px;">
                                <div class="progress-bar bg-danger" style="width: ${Math.min(product.conversion, 100)}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <button type="button" class="btn btn-sm btn-outline-primary" 
                                onclick="window.location.href='products.html?id=${product.id}'">
                            Edit
                        </button>
                    </td>
                </tr>
            `;
        });
        
        lowPerformingList.innerHTML = html;
    }
}

// Update customer tables with data
function updateCustomerTables(customerData) {
    const topCustomersList = document.getElementById('topCustomersList');
    if (topCustomersList) {
        let html = '';
        
        customerData.topCustomers.forEach(customer => {
            html += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="customer-img me-2 rounded-circle" style="width: 40px; height: 40px; background-color: #f8f9fc; display: flex; align-items: center; justify-content: center;">
                                <i class="bi bi-person text-primary"></i>
                            </div>
                            <div>
                                <h6 class="mb-0">${customer.name}</h6>
                                <small class="text-muted">${customer.email}</small>
                            </div>
                        </div>
                    </td>
                    <td>${customer.orders}</td>
                    <td>$${customer.totalSpent.toFixed(2)}</td>
                    <td>${formatDate(customer.lastOrder)}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-outline-primary"
                                onclick="window.location.href='customers.html?id=${customer.id}'">
                            View
                        </button>
                    </td>
                </tr>
            `;
        });
        
        topCustomersList.innerHTML = html;
    }
}

// Update product performance metrics
function updatePerformanceMetrics(metrics) {
    // Update conversion rate
    const avgConversionRate = document.getElementById('avgConversionRate');
    if (avgConversionRate) {
        avgConversionRate.textContent = metrics.conversionRate + '%';
    }
    
    // Update average order value
    const avgOrderValue = document.getElementById('avgOrderValue');
    if (avgOrderValue) {
        avgOrderValue.textContent = '$' + metrics.averageOrderValue.toFixed(2);
    }
    
    // Update cart abandonment
    const cartAbandonment = document.getElementById('cartAbandonment');
    if (cartAbandonment) {
        cartAbandonment.textContent = metrics.cartAbandonment + '%';
    }
}

// Helper function to determine progress bar color based on value
function getProgressBarColor(value) {
    if (value < 2) return 'danger';
    if (value < 4) return 'warning';
    if (value < 6) return 'info';
    return 'success';
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Export table data to CSV
function exportTableData(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    if (rows.length === 0) return;
    
    // Get headers
    const headers = [];
    const headerRow = rows[0].querySelectorAll('th');
    headerRow.forEach(header => {
        headers.push(header.textContent.trim());
    });
    
    // Get data
    const data = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowData = [];
        const cells = row.querySelectorAll('td');
        
        cells.forEach(cell => {
            // Get text content without icons or HTML
            rowData.push(cell.textContent.trim().replace(/\s+/g, ' '));
        });
        
        data.push(rowData);
    }
    
    // Create CSV
    let csv = headers.join(',') + '\n';
    data.forEach(row => {
        csv += row.join(',') + '\n';
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename + '_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Show loading state
function showLoading() {
    // Replace table content with loading indicators
    const tables = ['topProductsList', 'categoryPerformanceList', 'lowPerformingList', 'topCustomersList'];
    tables.forEach(tableId => {
        const table = document.getElementById(tableId);
        if (table) {
            table.innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading...</td></tr>';
        }
    });
}

// Hide loading state
function hideLoading() {
    // Loading state is removed when tables are populated with data
}

// Show error message
function showErrorMessage(message) {
    // Implementation of error message display
    alert(message);
}

// Get authentication token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Log out user
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './login.html';
} 