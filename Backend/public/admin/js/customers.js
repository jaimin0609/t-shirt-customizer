// Use global API_URL variable from window object instead of import
// Remove the import line above

// Ensure API_URL is available
if (typeof window.API_URL === 'undefined') {
    console.warn('API_URL not found on window object, using default value');
    window.API_URL = '/api'; // Fallback value
}

// Set a flag to control whether to skip associations (to work around the Order association error)
const SKIP_ASSOCIATIONS = true;

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Helper function to create authorized fetch options
function getAuthFetchOptions(options = {}) {
    const token = getAuthToken();
    if (!token) {
        console.warn('No authentication token found');
        return options;
    }
    
    return {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    };
}

// Fallback loader functions in case utils.js is not loaded
if (typeof showLoader !== 'function') {
    console.warn('showLoader function not found, using fallback implementation');
    window.showLoader = function() {
        // Create loader if it doesn't exist
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.style.position = 'fixed';
            loader.style.top = '0';
            loader.style.left = '0';
            loader.style.width = '100%';
            loader.style.height = '100%';
            loader.style.backgroundColor = 'rgba(0,0,0,0.5)';
            loader.style.display = 'flex';
            loader.style.justifyContent = 'center';
            loader.style.alignItems = 'center';
            loader.style.zIndex = '9999';
            
            const spinner = document.createElement('div');
            spinner.className = 'spinner-border text-light';
            spinner.setAttribute('role', 'status');
            
            const span = document.createElement('span');
            span.className = 'visually-hidden';
            span.textContent = 'Loading...';
            
            spinner.appendChild(span);
            loader.appendChild(spinner);
            document.body.appendChild(loader);
        } else {
            loader.style.display = 'flex';
        }
    };
}

if (typeof hideLoader !== 'function') {
    console.warn('hideLoader function not found, using fallback implementation');
    window.hideLoader = function() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    };
}

// Fallback toast function
if (typeof showToast !== 'function') {
    console.warn('showToast function not found, using fallback implementation');
    window.showToast = function(type, message) {
        console.log(`Toast (${type}): ${message}`);
        alert(message);
    };
}

// DOM Elements
const customersList = document.getElementById('customersList');
const addCustomerBtn = document.getElementById('addCustomerBtn');
const customerModal = new bootstrap.Modal(document.getElementById('customerModal'));
const customerViewModal = document.getElementById('customerViewModal');
const customerForm = document.getElementById('customerForm');
const saveCustomerBtn = document.getElementById('saveCustomer');
const searchCustomer = document.getElementById('searchCustomer');
const statusFilter = document.getElementById('statusFilter');

let customers = [];
let currentCustomerId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
    // Load initial data
    await loadCustomers();
    
    // Set up search functionality
    if (searchCustomer) {
        searchCustomer.addEventListener('input', function() {
            filterCustomers();
        });
    }
    
    // Set up mobile search functionality
    const mobileSearchCustomer = document.getElementById('mobileSearchCustomer');
    if (mobileSearchCustomer) {
        mobileSearchCustomer.addEventListener('input', function() {
            // Sync with main search input
            if (searchCustomer) {
                searchCustomer.value = this.value;
            }
            filterCustomers();
        });
    }
    
    // Set up status filter
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterCustomers();
        });
    }
    
    // Add customer button
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', function() {
            // Reset form and open modal
            document.getElementById('customerForm').reset();
            document.getElementById('customerModalTitle').textContent = 'Add Customer';
            const customerModal = new bootstrap.Modal(document.getElementById('customerModal'));
            customerModal.show();
        });
    }
});

// Load Customers
async function loadCustomers() {
    try {
        showLoader();
        
        // Get auth token and log it (partially redacted for security)
        const token = getAuthToken();
        if (!token) {
            console.error('No authentication token found, redirecting to login');
            window.location.href = '/admin/login.html';
            return;
        }
        
        const tokenPreview = token.substring(0, 10) + '...' + token.substring(token.length - 5);
        console.log(`Using auth token (preview): ${tokenPreview}`);
        
        // Fetch customers data
        console.log('Fetching customers from:', `${window.API_URL}/customers`);
        const response = await fetch(`${window.API_URL}/customers`, getAuthFetchOptions());
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response text:', errorText);
            throw new Error(`Error fetching customers: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Loaded ${data.length} customers:`, data);
        
        // If data is empty, show a message
        if (!data || data.length === 0) {
            const customersList = document.getElementById('customersList');
            customersList.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="alert alert-info">
                            No customers found. Use the Add Customer button to create one.
                        </div>
                    </td>
                </tr>
            `;
            hideLoader();
            return;
        }
        
        // Display customers
        displayCustomers(data);
        
        hideLoader();
    } catch (error) {
        console.error('Error loading customers:', error);
        hideLoader();
        
        // Display error in table
        const customersList = document.getElementById('customersList');
        customersList.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="alert alert-danger">
                        <h5>Error loading customers</h5>
                        <p>${error.message}</p>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="loadCustomers()">
                            Try Again
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        showToast('error', error.message || 'Error loading customers. Please try again.');
    }
}

// Display Customers
function displayCustomers(customersToDisplay) {
    const customersList = document.getElementById('customersList');
    if (!customersList) {
        console.error('Customer list element not found');
        return;
    }
    
    if (!customersToDisplay || customersToDisplay.length === 0) {
        customersList.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="alert alert-info">
                        No customers found. Click "Add Customer" to create one.
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Debug customer data
    console.log("First customer data:", customersToDisplay[0]);
    
    try {
        customersList.innerHTML = customersToDisplay.map(customer => {
            // Check if all required fields exist
            if (!customer) {
                console.warn('Empty customer object found');
                return '';
            }
            
            // Get user email from nested user object or from customer directly
            const email = customer.user?.email || customer.email || '-';
            
            // Create a status badge with appropriate color
            const statusClass = getStatusClass(customer.status);
            const statusBadge = `<span class="badge ${statusClass}">${customer.status || 'Active'}</span>`;
            
            // Make sure numeric values are properly handled
            const totalSpent = parseFloat(customer.totalSpent || 0).toFixed(2);
            const totalOrders = customer.totalOrders || 0;
            
            return `
                <tr data-customer-id="${customer.id}">
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-circle me-2">
                                ${getInitials(customer.firstName, customer.lastName)}
                            </div>
                            <div>
                                <div class="fw-bold">${customer.firstName || ''} ${customer.lastName || ''}</div>
                                <small class="text-muted">ID: ${customer.id}</small>
                            </div>
                        </div>
                    </td>
                    <td>${email}</td>
                    <td>${customer.phone || '-'}</td>
                    <td>${totalOrders}</td>
                    <td>$${totalSpent}</td>
                    <td>${statusBadge}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="viewCustomerDetails(${customer.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="editCustomer(${customer.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error rendering customer list:', error);
        customersList.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="alert alert-danger">
                        <h5>Error displaying customers</h5>
                        <p>${error.message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Add CSS for the avatars if not already present
    if (!document.getElementById('customer-avatar-styles')) {
        const style = document.createElement('style');
        style.id = 'customer-avatar-styles';
        style.textContent = `
            .avatar-circle {
                width: 36px;
                height: 36px;
                background-color: #6c757d;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }
            .action-buttons .btn {
                padding: 0.25rem 0.5rem;
                margin-right: 0.25rem;
            }
        `;
        document.head.appendChild(style);
    }
}

// Helper function to get initials from name
function getInitials(firstName, lastName) {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
}

// Helper function to get status class
function getStatusClass(status) {
    switch(status?.toLowerCase()) {
        case 'active':
            return 'bg-success';
        case 'inactive':
            return 'bg-secondary';
        case 'blocked':
            return 'bg-danger';
        default:
            return 'bg-success';
    }
}

// Filter Customers
function filterCustomers() {
    const searchTerm = searchCustomer.value.toLowerCase();
    const statusTerm = statusFilter.value.toLowerCase();
    
    const filtered = customers.filter(customer => {
        const matchesSearch = (
            customer.firstName?.toLowerCase().includes(searchTerm) ||
            customer.lastName?.toLowerCase().includes(searchTerm) ||
            customer.email?.toLowerCase().includes(searchTerm)
        );
        
        const matchesStatus = !statusTerm || customer.status?.toLowerCase() === statusTerm;
        
        return matchesSearch && matchesStatus;
    });
    
    displayCustomers(filtered);
}

// Save Customer
async function saveCustomer() {
    try {
        showLoader();
        
        // Get form data
        const form = document.getElementById('customerForm');
        const formData = new FormData(form);
        
        // Convert form data to JSON
        const customerData = {};
        formData.forEach((value, key) => {
            // Convert empty strings to null for database
            customerData[key] = value === '' ? null : value;
        });
        
        // Add userId if creating a new customer
        if (!currentCustomerId) {
            const userId = document.getElementById('userId').value;
            if (userId) {
                customerData.userId = userId;
            }
        }
        
        // Set status to active by default if not specified
        if (!customerData.status) {
            customerData.status = 'active';
        }
        
        console.log('Saving customer data:', customerData);
        
        // Determine if we're creating or updating
        const url = currentCustomerId 
            ? `${window.API_URL}/customers/${currentCustomerId}` 
            : `${window.API_URL}/customers`;
        
        const method = currentCustomerId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData),
            ...getAuthFetchOptions()
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error ${method === 'POST' ? 'creating' : 'updating'} customer`);
        }
        
        // Refresh customer list
        await loadCustomers();
        
        // Close modal
        const modalElement = document.getElementById('customerModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.hide();
        
        // Reset form state
        resetForm();
        
        // Show success message
        window.showToast('success', `Customer ${currentCustomerId ? 'updated' : 'added'} successfully!`);
    } catch (error) {
        console.error('Error saving customer:', error);
        window.showToast('error', error.message || 'Error saving customer. Please try again.');
    }
}

// View Customer Details
async function viewCustomerDetails(customerId) {
    console.log(`Viewing details for customer ID: ${customerId}`);
    try {
        showLoader();
        
        // Construct URL with skipAssociations parameter if needed
        let url = `${window.API_URL}/customers/${customerId}`;
        if (SKIP_ASSOCIATIONS) {
            url += '?skipAssociations=true';
        }
        console.log(`Fetching from URL: ${url}`);
        
        const response = await fetch(url, getAuthFetchOptions());
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to fetch customer details: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Customer data received:', data);
        
        // The data itself is the customer object in the API response
        if (!data) {
            console.error('No customer data in response');
            hideLoader();
            showToast('error', 'Customer data not found in response');
            return;
        }
        
        // Display customer details
        displayCustomerDetails(data, SKIP_ASSOCIATIONS);
        
        // Show the customer details modal - using the correct ID
        const customerViewModal = new bootstrap.Modal(document.getElementById('customerViewModal'));
        customerViewModal.show();
        
        hideLoader();
    } catch (error) {
        console.error('Error in viewCustomerDetails:', error);
        hideLoader();
        
        // Display error details
        displayErrorDetails(customerId, error.message);
    }
}

// Display customer details
function displayCustomerDetails(customer, isLimitedView = false) {
    console.log('Displaying customer details:', customer);
    
    // Get the customer details container
    const customerDetailsElement = document.getElementById('customerDetails');
    if (!customerDetailsElement) {
        console.error('Customer details element not found in DOM');
        return;
    }
    
    // Check for required customer data
    if (!customer || typeof customer !== 'object') {
        console.error('Invalid customer data:', customer);
        customerDetailsElement.innerHTML = `
            <div class="alert alert-danger">
                <h4>Error Loading Customer Details</h4>
                <p>Could not load valid customer data. Please try again.</p>
            </div>
        `;
        return;
    }
    
    // Log key fields for debugging
    console.log('Customer ID:', customer.id);
    console.log('Customer name:', customer.firstName, customer.lastName);
    console.log('Customer user info:', customer.user);
    console.log('Customer address info:', {
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zipCode: customer.zipCode,
        country: customer.country
    });
    
    // Format dates - with error handling
    let createdAt = 'Unknown';
    let updatedAt = 'Unknown';
    try {
        if (customer.createdAt) createdAt = new Date(customer.createdAt).toLocaleDateString();
        if (customer.updatedAt) updatedAt = new Date(customer.updatedAt).toLocaleDateString();
    } catch (e) {
        console.error('Error formatting dates:', e);
    }
    
    // Format status with badge
    const statusClass = getStatusClass(customer.status || 'active');
    
    // Get user information safely
    const user = customer.user || {};
    
    // Format address with error handling
    let address = 'No address on file';
    try {
        const addressParts = [
            customer.address,
            customer.city,
            customer.state,
            customer.zipCode,
            customer.country
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
            address = addressParts.join(', ');
        }
    } catch (e) {
        console.error('Error formatting address:', e);
    }
    
    // Format monetary values safely
    const totalSpent = typeof customer.totalSpent === 'number' 
        ? customer.totalSpent.toFixed(2) 
        : '0.00';
    
    // Format order count safely
    const orderCount = typeof customer.totalOrders === 'number'
        ? customer.totalOrders
        : 0;
    
    // Create HTML for customer details
    let html = `
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Customer Profile</h5>
                <div>
                    <button class="btn btn-primary btn-sm" onclick="editCustomer(${customer.id})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCustomer(${customer.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3 text-center mb-4">
                        <div class="customer-avatar">
                            ${getInitials(customer.firstName || '?', customer.lastName || '?')}
                        </div>
                        <div class="mt-2">
                            <span class="badge ${statusClass}">${customer.status || 'Active'}</span>
                        </div>
                    </div>
                    <div class="col-md-9">
                        <h4>${customer.firstName || ''} ${customer.lastName || ''}</h4>
                        <p class="text-muted">${user.email || customer.email || 'No email available'}</p>
                        
                        <div class="row mt-4">
                            <div class="col-md-6">
                                <h6>Contact Information</h6>
                                <ul class="list-unstyled">
                                    <li><strong>Email:</strong> ${user.email || customer.email || 'N/A'}</li>
                                    <li><strong>Phone:</strong> ${customer.phone || 'N/A'}</li>
                                    <li><strong>Address:</strong> ${address}</li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h6>Account Information</h6>
                                <ul class="list-unstyled">
                                    <li><strong>Customer ID:</strong> ${customer.id}</li>
                                    <li><strong>Status:</strong> ${customer.status || 'Active'}</li>
                                    <li><strong>Created:</strong> ${createdAt}</li>
                                    <li><strong>Last Updated:</strong> ${updatedAt}</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="row mt-4">
                            <div class="col-md-6">
                                <h6>Order Summary</h6>
                                <ul class="list-unstyled">
                                    <li><strong>Total Orders:</strong> ${orderCount}</li>
                                    <li><strong>Total Spent:</strong> $${totalSpent}</li>
                                    <li><strong>Last Order:</strong> ${customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never'}</li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h6>Notes</h6>
                                <p>${customer.notes || 'No notes available for this customer.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Check if we should display order history
    if (!isLimitedView && customer.orders && Array.isArray(customer.orders) && customer.orders.length > 0) {
        console.log(`Customer has ${customer.orders.length} orders to display`);
        
        // Add order history section
        html += `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Order History</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        
        // Add each order row
        customer.orders.forEach(order => {
            const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown';
            const orderStatusClass = getStatusClass(order.status);
            const orderTotal = typeof order.total === 'number' ? order.total.toFixed(2) : '0.00';
            
            html += `
                <tr>
                    <td>${order.orderNumber || order.id}</td>
                    <td>${orderDate}</td>
                    <td><span class="badge ${orderStatusClass}">${order.status || 'Processing'}</span></td>
                    <td>$${orderTotal}</td>
                    <td>
                        <a href="/admin/orders.html?id=${order.id}" class="btn btn-sm btn-primary">
                            <i class="bi bi-eye"></i> View
                        </a>
                    </td>
                </tr>
            `;
        });
        
        // Close the order history table
        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } else if (!isLimitedView) {
        console.log('No orders to display or orders data not available');
        // Display a message for no orders
        html += `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Order History</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-info mb-0">
                        This customer has no order history.
                    </div>
                </div>
            </div>
        `;
    } else {
        console.log('Limited view enabled, not displaying orders');
    }

    // Set the HTML content
    customerDetailsElement.innerHTML = html;
    
    // Log success
    console.log('Customer details successfully displayed');
}

// Display error details when customer details can't be loaded
function displayErrorDetails(customerId, errorMessage) {
    try {
        const customerDetailsElement = document.getElementById('customerDetails');
        
        if (customerDetailsElement) {
            // Show a simplified view with an error message
            customerDetailsElement.innerHTML = `
                <div class="alert alert-danger">
                    <h4>Error Loading Customer Details</h4>
                    <p>Error: ${errorMessage || 'Failed to fetch customer details'}</p>
                    <p>Please contact the system administrator for assistance.</p>
                </div>
                <p><strong>Customer ID:</strong> ${customerId}</p>
                <p>Please use the Edit Customer button to view and update customer information.</p>
            `;
            
            // Show the modal with the error message - using correct ID
            const customerViewModal = new bootstrap.Modal(document.getElementById('customerViewModal'));
            customerViewModal.show();
        }
        
        showToast('error', `Error: ${errorMessage || 'Failed to fetch customer details'}`);
    } catch (displayError) {
        console.error('Error showing error details:', displayError);
        showToast('error', 'Failed to display error details');
    }
}

// Edit customer (populate form for editing)
async function editCustomer(customerId) {
    console.log(`Editing customer ID: ${customerId}`);
    try {
        showLoader();
        
        // Construct URL with skipAssociations parameter if needed
        let url = `${window.API_URL}/customers/${customerId}`;
        if (SKIP_ASSOCIATIONS) {
            url += '?skipAssociations=true';
        }
        console.log(`Fetching from URL: ${url}`);
        
        const response = await fetch(url, getAuthFetchOptions());
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to fetch customer details: ${response.status} ${response.statusText}`);
        }
        
        const customerData = await response.json();
        console.log('Customer data received:', customerData);
        
        // The API now returns the customer object directly instead of wrapping it
        if (!customerData) {
            console.error('No customer data in response', customerData);
            throw new Error('Customer data not found in response');
        }
        
        // Set current customer ID
        currentCustomerId = customerId;
        
        // Populate form
        populateCustomerForm(customerData);
        
        // Show modal
        const customerModal = new bootstrap.Modal(document.getElementById('customerModal'));
        customerModal.show();
        
        hideLoader();
    } catch (error) {
        console.error('Error editing customer:', error);
        hideLoader();
        showToast('error', error.message || 'Error loading customer details. Please try again.');
    }
}

// Helper function to populate the customer form
function populateCustomerForm(customer) {
    // Get the form
    const form = document.getElementById('customerForm');
    if (!form) {
        console.error('Customer form not found');
        showToast('error', 'Customer form not found');
        return false;
    }
    
    // Add a hidden field for the customer ID if it doesn't exist
    let customerIdField = form.querySelector('input[name="customerId"]');
    if (!customerIdField) {
        customerIdField = document.createElement('input');
        customerIdField.type = 'hidden';
        customerIdField.name = 'customerId';
        form.appendChild(customerIdField);
    }
    customerIdField.value = customer.id;
    
    // Set form values - using name attribute instead of ID
    const formFields = {
        'firstName': customer.firstName || '',
        'lastName': customer.lastName || '',
        'email': customer.email || '',
        'phone': customer.phone || '',
        'address': customer.address || '',
        'city': customer.city || '',
        'state': customer.state || '',
        'zipCode': customer.zipCode || '',
        'country': customer.country || '',
        'status': customer.status || 'Active',
        'notes': customer.notes || ''
    };
    
    // Loop through and set each field's value
    Object.entries(formFields).forEach(([name, value]) => {
        const field = form.querySelector(`[name="${name}"]`);
        if (field) {
            field.value = value;
        }
    });
    
    // Handle checkboxes if any exist
    const defaultAddressCheckbox = form.querySelector('[name="isDefaultShippingAddress"]');
    if (defaultAddressCheckbox) {
        defaultAddressCheckbox.checked = customer.isDefaultShippingAddress === true;
    }
    
    // Set the modal title
    const modalTitle = document.getElementById('customerModalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Customer';
    }
    
    // Show the modal
    const customerModal = new bootstrap.Modal(document.getElementById('customerModal'));
    customerModal.show();
    
    return true;
}

// Delete customer
async function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoader();
        
        const response = await fetch(`${window.API_URL}/customers/${customerId}`, {
            method: 'DELETE',
            ...getAuthFetchOptions()
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete customer');
        }
        
        // Refresh customer list
        await loadCustomers();
        
        // Show success message
        showToast('success', 'Customer deleted successfully!');
        
        hideLoader();
    } catch (error) {
        console.error('Error deleting customer:', error);
        hideLoader();
        showToast('error', error.message || 'Error deleting customer. Please try again.');
    }
}

// Helper function to show toast notifications - use as fallback if window.showToast fails
function showToast(type, message) {
    try {
        window.showToast(type, message);
    } catch (e) {
        console.warn('Error using window.showToast, falling back to alert', e);
        alert(message);
    }
}

// Make functions available globally for onclick handlers
window.viewCustomerDetails = viewCustomerDetails;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;

// Make functions available to HTML
window.loadCustomers = loadCustomers;
window.filterCustomers = filterCustomers;
window.saveCustomer = saveCustomer;

// Helper function to fetch basic customer info without associations
async function getCustomerBasicInfo(customerId) {
    try {
        // First try the dedicated basic endpoint if it exists
        let response = await fetch(`${window.API_URL}/customers/basic/${customerId}`);
        
        // If that endpoint doesn't exist, try the main endpoint with a query param
        if (response.status === 404) {
            response = await fetch(`${window.API_URL}/customers/${customerId}?skipAssociations=true`);
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch basic customer info: ${response.status}`);
        }
        
        const data = await response.json();
        return data.customer || null;
    } catch (error) {
        console.error('Error fetching basic customer info:', error);
        // Try one last fallback to the standard endpoint but handle the error
        try {
            const response = await fetch(`${window.API_URL}/customers/${customerId}`);
            const text = await response.text();
            
            // Try to parse the JSON
            try {
                const data = JSON.parse(text);
                if (data && data.customer) {
                    return data.customer;
                }
            } catch (jsonError) {
                // If we can't parse the JSON, try to extract customer info from the error text
                console.log('Attempting to extract customer data from error response');
                
                // Look for patterns like "customer":{"id":1,"firstName":"John",...} in the response
                const customerMatch = text.match(/"customer":\s*({[^}]+})/);
                if (customerMatch && customerMatch[1]) {
                    try {
                        // Fix the JSON if it's partial
                        let customerJson = customerMatch[1];
                        if (!customerJson.endsWith('}')) {
                            customerJson += '}';
                        }
                        return JSON.parse(customerJson);
                    } catch (e) {
                        console.error('Failed to parse extracted customer data');
                    }
                }
            }
        } catch (finalError) {
            console.error('All fallback attempts failed:', finalError);
        }
        return null;
    }
}

// Function to check database associations
async function checkDatabaseAssociations() {
    try {
        showLoader();
        console.log('Checking database associations...');
        
        // Show a dialog to inform the user
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'diagnosticModal';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Database Association Diagnostics</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="diagnosticResults">
                            <p>Running diagnostics...</p>
                            <div class="progress">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const diagnosticModal = new bootstrap.Modal(document.getElementById('diagnosticModal'));
        diagnosticModal.show();
        
        // Run the diagnostic tests
        const diagnosticResults = document.getElementById('diagnosticResults');
        
        // Test 1: Try to get the model structure
        diagnosticResults.innerHTML = `
            <h5>Test 1: Checking Model Structure</h5>
            <p>Requesting model structure from server...</p>
        `;
        
        try {
            const modelResponse = await fetch(`${window.API_URL}/diagnostics/models`, getAuthFetchOptions());
            if (modelResponse.ok) {
                const modelData = await modelResponse.json();
                diagnosticResults.innerHTML += `
                    <div class="alert alert-success">
                        <p>Model structure retrieved successfully</p>
                    </div>
                    <div class="mt-2">
                        <h6>Model Information:</h6>
                        <pre>${JSON.stringify(modelData, null, 2)}</pre>
                    </div>
                `;
            } else {
                diagnosticResults.innerHTML += `
                    <div class="alert alert-warning">
                        <p>Could not retrieve model structure - endpoint not available</p>
                    </div>
                `;
            }
        } catch (modelError) {
            diagnosticResults.innerHTML += `
                <div class="alert alert-danger">
                    <p>Error checking models: ${modelError.message}</p>
                </div>
            `;
        }
        
        // Test 2: Try to get a customer with special debug option
        diagnosticResults.innerHTML += `
            <h5 class="mt-4">Test 2: Checking Customer-Order Association</h5>
            <p>Trying to retrieve customers with debug option...</p>
        `;
        
        try {
            const customerResponse = await fetch(`${window.API_URL}/customers?debug=true&limit=1`, getAuthFetchOptions());
            if (customerResponse.ok) {
                const customerData = await customerResponse.json();
                diagnosticResults.innerHTML += `
                    <div class="alert alert-success">
                        <p>Customer data retrieved with debug option</p>
                    </div>
                    <div class="mt-2">
                        <h6>Sample Result:</h6>
                        <pre>${JSON.stringify(customerData, null, 2)}</pre>
                    </div>
                `;
            } else {
                const errorText = await customerResponse.text();
                diagnosticResults.innerHTML += `
                    <div class="alert alert-warning">
                        <p>Error retrieving customers with debug option</p>
                        <p>Status: ${customerResponse.status}</p>
                        <p>Error: ${errorText}</p>
                    </div>
                `;
            }
        } catch (customerError) {
            diagnosticResults.innerHTML += `
                <div class="alert alert-danger">
                    <p>Error checking customer association: ${customerError.message}</p>
                </div>
            `;
        }
        
        // Final report
        diagnosticResults.innerHTML += `
            <h5 class="mt-4">Diagnostic Summary:</h5>
            <p>Based on the test results, here are some recommendations:</p>
            <ol>
                <li>Check if the Order model is properly associated with the Customer model</li>
                <li>Verify that all required database tables exist</li>
                <li>Check for any missing foreign key constraints</li>
                <li>Ensure the database relationships are correctly defined in Sequelize models</li>
                <li>Add proper error handling in the backend API routes</li>
            </ol>
        `;
        
        hideLoader();
    } catch (error) {
        hideLoader();
        console.error('Error in association diagnostics:', error);
        showToast('error', `Error running diagnostics: ${error.message}`);
    }
}

// Add this function to window object at the end of the file
window.checkDatabaseAssociations = checkDatabaseAssociations; 