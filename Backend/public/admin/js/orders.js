// Use global API_URL variable from window object instead of import
// Remove the import line above

// Ensure API_URL is available
if (typeof window.API_URL === 'undefined') {
    console.warn('API_URL not found on window object, using default value');
    window.API_URL = '/api'; // Fallback value
}

// Global variables to store current order details
let currentOrderId = null;

// Import the showToast function from utils.js
import { showToast } from './utils.js';

// Check authentication on page load
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('error', 'Authentication required. Please log in.', true);
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    // Load orders and statistics
    await loadOrderStatistics();
    await loadOrders();
    
    // Add a floating test order button in development
    console.log('Current hostname:', window.location.hostname);
    
    // Always add the button regardless of hostname for testing purposes
    addFloatingTestOrderButton();
    
    // Set up event listeners
    const searchInput = document.getElementById('orderSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            loadOrders(this.value);
        }, 500));
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            loadOrders(document.getElementById('orderSearch')?.value || '', this.value);
        });
    }
    
    // Set up date filter
    const applyDateFilterBtn = document.getElementById('applyDateFilter');
    if (applyDateFilterBtn) {
        applyDateFilterBtn.addEventListener('click', function() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            loadOrders(
                document.getElementById('orderSearch')?.value || '', 
                document.getElementById('statusFilter')?.value || 'all',
                startDate,
                endDate
            );
        });
    }
    
    // Order status update
    document.querySelectorAll('.status-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const status = this.dataset.status;
            if (currentOrderId) {
                updateOrderStatus(currentOrderId, status);
            }
        });
    });
    
    // Tracking form
    const saveTrackingBtn = document.getElementById('saveTrackingBtn');
    if (saveTrackingBtn) {
        saveTrackingBtn.addEventListener('click', saveTrackingInfo);
    }
    
    // Refund form
    const processRefundBtn = document.getElementById('processRefundBtn');
    if (processRefundBtn) {
        processRefundBtn.addEventListener('click', processRefund);
    }
    
    // Notes form
    const saveNotesBtn = document.getElementById('saveNotesBtn');
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', saveOrderNotes);
    }

    // Set up mobile search functionality
    const mobileOrderSearch = document.getElementById('mobileOrderSearch');
    if (mobileOrderSearch) {
        mobileOrderSearch.addEventListener('input', function() {
            // Sync with main search input
            if (searchInput) {
                searchInput.value = this.value;
            }
            loadOrders(this.value);
        });
    }
});

// Load Order Statistics
async function loadOrderStatistics() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch(`${window.API_URL}/orders/admin/stats/overview`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load order statistics: ${response.status} ${response.statusText}`);
        }
        
        const stats = await response.json();
        
        // Update the statistics UI
        document.getElementById('totalOrdersCount').textContent = stats.totalOrders || 0;
        document.getElementById('pendingOrdersCount').textContent = stats.pendingOrders || 0;
        document.getElementById('deliveredOrdersCount').textContent = stats.deliveredOrders || 0;
        document.getElementById('totalRevenue').textContent = `$${parseFloat(stats.totalRevenue || 0).toFixed(2)}`;
        
    } catch (error) {
        console.error('Error loading order statistics:', error);
        // Don't show toast for stats, just log to console
    }
}

// Load Orders
async function loadOrders(searchTerm = '', status = 'all', startDate = '', endDate = '') {
    try {
        console.log('Loading orders with params:', { searchTerm, status, startDate, endDate });
        
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            showToast('error', 'Authentication required');
            window.location.href = '/admin/login.html';
            return;
        }
        
        // Build query string
        let url = `${window.API_URL}/orders/admin/all`;
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (status !== 'all') params.append('status', status);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        // Add cache busting parameter
        params.append('_t', new Date().getTime());
        
        if (params.toString()) url += `?${params.toString()}`;
        
        console.log('Fetching orders from URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to load orders: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Orders loaded successfully:', data);
        
        if (!data) {
            console.warn('Debug - No data received');
            throw new Error('No data received from server');
        }
        
        displayOrders(data);
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('error', error.message);
    }
}

// Display Orders
function displayOrders(data) {
    const ordersTableBody = document.getElementById('ordersTableBody');
    if (!ordersTableBody) {
        console.error('Orders table body element not found');
        return;
    }

    console.log('Displaying orders:', data);

    // Ensure we have an array of orders
    const orders = Array.isArray(data) ? data : (data.orders || []);
    console.log(`Processing ${orders.length} orders`);

    if (!orders || orders.length === 0) {
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="alert alert-info">No orders found</div>
                </td>
            </tr>
        `;
        return;
    }

    // Sort orders by createdAt in descending order (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    ordersTableBody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.orderNumber}</td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${order.customerImage || '/admin/images/user-placeholder.png'}" 
                         alt="${order.customerName || 'Customer'}" 
                         class="rounded-circle me-2"
                         width="32" height="32">
                    <div>
                        <div class="fw-bold">${order.customerName || 'Unknown'}</div>
                        <div class="small text-muted">${order.customerEmail || 'No email'}</div>
                        ${order.customerPhone ? `<div class="small text-muted">${order.customerPhone}</div>` : ''}
                    </div>
                </div>
            </td>
            <td>${formatDate(order.createdAt)}</td>
            <td>${order.items ? order.items.length : 0} items</td>
            <td>$${parseFloat(order.total || 0).toFixed(2)}</td>
            <td>
                <span class="badge bg-${getStatusBadgeColor(order.status)}">
                    ${order.status}
                </span>
            </td>
            <td>
                <span class="badge bg-${getPaymentStatusBadgeColor(order.paymentStatus)}">
                    ${order.paymentStatus}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary me-1" onclick="viewOrderDetails(${order.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="updateOrderStatus(${order.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// View Order Details
async function viewOrderDetails(orderId) {
    try {
        currentOrderId = orderId; // Store the current order ID
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }
        
        const order = await response.json();
        
        // Set values for forms
        document.getElementById('trackingOrderId').value = orderId;
        document.getElementById('refundOrderId').value = orderId;
        document.getElementById('notesOrderId').value = orderId;
        
        // Fill tracking form if data exists
        if (order.trackingNumber) {
            document.getElementById('trackingNumber').value = order.trackingNumber;
            document.getElementById('carrier').value = order.trackingCarrier || '';
            // Set estimated delivery date if it exists
            if (order.estimatedDeliveryDate) {
                document.getElementById('estimatedDelivery').value = order.estimatedDeliveryDate.substring(0, 10); // YYYY-MM-DD
            }
            
            // Display current tracking info
            document.getElementById('currentTracking').innerHTML = `
                <div class="alert alert-info">
                    <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
                    ${order.trackingCarrier ? `<p><strong>Carrier:</strong> ${order.trackingCarrier}</p>` : ''}
                    ${order.estimatedDeliveryDate ? `<p><strong>Estimated Delivery:</strong> ${formatDate(order.estimatedDeliveryDate)}</p>` : ''}
                </div>
            `;
        } else {
            document.getElementById('currentTracking').innerHTML = '<div class="alert alert-warning">No tracking information available</div>';
        }
        
        // Fill notes if they exist
        document.getElementById('orderNotes').value = order.notes || '';
        
        // Display refund information if it exists
        if (order.refundAmount) {
            document.getElementById('currentRefunds').innerHTML = `
                <div class="alert alert-warning">
                    <p><strong>Refund Amount:</strong> $${parseFloat(order.refundAmount).toFixed(2)}</p>
                    ${order.refundReason ? `<p><strong>Reason:</strong> ${order.refundReason}</p>` : ''}
                    <p><strong>Status:</strong> ${order.paymentStatus}</p>
                </div>
            `;
        } else {
            document.getElementById('currentRefunds').innerHTML = '<div class="alert alert-info">No refunds processed</div>';
        }
        
        const orderDetails = document.getElementById('orderDetails');
        orderDetails.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">Customer Information</h6>
                        </div>
                        <div class="card-body">
                            <p>
                                <strong>Name:</strong> ${order.customerName}<br>
                                <strong>Email:</strong> ${order.customerEmail}<br>
                                <strong>Phone:</strong> ${order.customerPhone || 'N/A'}
                            </p>
                            <h6>Shipping Address</h6>
                            <address>
                                ${formatShippingAddress(order.shippingAddress)}
                            </address>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">Order Information</h6>
                        </div>
                        <div class="card-body">
                            <p>
                                <strong>Order #:</strong> ${order.orderNumber}<br>
                                <strong>Date:</strong> ${formatDate(order.createdAt)}<br>
                                <strong>Status:</strong> 
                                <span class="badge bg-${getStatusBadgeColor(order.status)}">
                                    ${order.status}
                                </span><br>
                                <strong>Payment Status:</strong> 
                                <span class="badge bg-${getPaymentStatusBadgeColor(order.paymentStatus)}">
                                    ${order.paymentStatus}
                                </span><br>
                                <strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}
                                ${order.trackingNumber ? 
                                    `<br><strong>Tracking #:</strong> ${order.trackingNumber}` : ''}
                                ${order.trackingCarrier ? 
                                    `<br><strong>Carrier:</strong> ${order.trackingCarrier}` : ''}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-responsive mt-3">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <img src="${item.image || '/admin/images/product-placeholder.png'}" 
                                             alt="${item.name}"
                                             class="me-2"
                                             width="40" height="40"
                                             style="object-fit: cover;">
                                        <div>
                                            ${item.name}
                                            ${item.variant ? `<small class="text-muted d-block">${item.variant}</small>` : ''}
                                        </div>
                                    </div>
                                </td>
                                <td>${item.quantity}</td>
                                <td>$${parseFloat(item.price).toFixed(2)}</td>
                                <td>$${(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-end"><strong>Subtotal:</strong></td>
                            <td>$${parseFloat(order.subtotal).toFixed(2)}</td>
                        </tr>
                        ${order.couponCode ? `
                            <tr>
                                <td colspan="3" class="text-end"><strong>Discount (${order.couponCode}):</strong></td>
                                <td>-$${parseFloat(order.discount || 0).toFixed(2)}</td>
                            </tr>
                        ` : ''}
                        <tr>
                            <td colspan="3" class="text-end"><strong>Shipping:</strong></td>
                            <td>$${parseFloat(order.shipping).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="3" class="text-end"><strong>Total:</strong></td>
                            <td><strong>$${parseFloat(order.total).toFixed(2)}</strong></td>
                        </tr>
                        ${order.refundAmount ? `
                            <tr class="table-warning">
                                <td colspan="3" class="text-end"><strong>Refunded:</strong></td>
                                <td><strong>-$${parseFloat(order.refundAmount).toFixed(2)}</strong></td>
                            </tr>
                        ` : ''}
                    </tfoot>
                </table>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('orderModal'));
        modal.show();
    } catch (error) {
        console.error('Error viewing order details:', error);
        showToast('error', 'Failed to load order details');
    }
}

// Format shipping address
function formatShippingAddress(address) {
    if (!address) return 'No address available';
    
    // Handle different address formats
    if (typeof address === 'string') {
        try {
            address = JSON.parse(address);
        } catch (e) {
            return address;
        }
    }
    
    return `
        ${address.street || address.address1 || ''} ${address.address2 || ''}<br>
        ${address.city || ''}, ${address.state || ''} ${address.zipCode || address.zip || ''}<br>
        ${address.country || ''}
    `;
}

// Save Tracking Information
async function saveTrackingInfo() {
    try {
        const orderId = document.getElementById('trackingOrderId').value;
        const trackingNumber = document.getElementById('trackingNumber').value;
        const carrier = document.getElementById('carrier').value;
        const estimatedDelivery = document.getElementById('estimatedDelivery').value;
        
        if (!trackingNumber) {
            showToast('error', 'Tracking number is required');
            return;
        }
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/orders/admin/${orderId}/tracking`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                trackingNumber,
                carrier,
                estimatedDeliveryDate: estimatedDelivery || null
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update tracking: ${errorText}`);
        }
        
        showToast('success', 'Tracking information updated successfully');
        // Refresh the order details
        viewOrderDetails(orderId);
        // Reload the orders list
        loadOrders();
    } catch (error) {
        console.error('Error updating tracking information:', error);
        showToast('error', error.message || 'Failed to update tracking information');
    }
}

// Process Refund
async function processRefund() {
    try {
        const orderId = document.getElementById('refundOrderId').value;
        const amount = document.getElementById('refundAmount').value;
        const reason = document.getElementById('refundReason').value;
        
        if (!amount) {
            showToast('error', 'Refund amount is required');
            return;
        }
        
        // Confirm refund
        const confirmed = await Swal.fire({
            title: 'Process Refund',
            text: `Are you sure you want to refund $${amount}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, process refund',
            cancelButtonText: 'Cancel'
        });
        
        if (!confirmed.isConfirmed) return;
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/orders/admin/${orderId}/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount,
                reason
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to process refund: ${errorText}`);
        }
        
        showToast('success', 'Refund processed successfully');
        // Refresh the order details
        viewOrderDetails(orderId);
        // Reload the orders list
        loadOrders();
    } catch (error) {
        console.error('Error processing refund:', error);
        showToast('error', error.message || 'Failed to process refund');
    }
}

// Save Order Notes
async function saveOrderNotes() {
    try {
        const orderId = document.getElementById('notesOrderId').value;
        const notes = document.getElementById('orderNotes').value;
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/orders/admin/${orderId}/notes`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                notes
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to save notes: ${errorText}`);
        }
        
        showToast('success', 'Order notes saved successfully');
    } catch (error) {
        console.error('Error saving order notes:', error);
        showToast('error', error.message || 'Failed to save order notes');
    }
}

// Update Order Status
async function updateOrderStatus(orderId, status) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('error', 'Authentication required. Please log in.', true);
            window.location.href = 'login.html';
            return;
        }

        // If status is not provided, prompt the user to select one
        if (!status) {
            const result = await Swal.fire({
                title: 'Update Order Status',
                input: 'select',
                inputOptions: {
                    pending: 'Pending',
                    processing: 'Processing',
                    shipped: 'Shipped',
                    delivered: 'Delivered',
                    cancelled: 'Cancelled'
                },
                inputPlaceholder: 'Select a status',
                showCancelButton: true,
                confirmButtonText: 'Update',
                cancelButtonText: 'Cancel',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Please select a status';
                    }
                }
            });

            if (!result.isConfirmed) {
                return;
            }
            
            status = result.value;
        }

        const response = await fetch(`${window.API_URL}/orders/admin/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update status: ${errorText}`);
        }

        showToast('success', 'Order status updated successfully');
        
        // If we're viewing order details, refresh them
        if (currentOrderId === orderId) {
            viewOrderDetails(orderId);
        }
        
        // Reload the orders list
        loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast('error', error.message || 'Failed to update order status');
    }
}

// Helper function to get badge color based on status
function getStatusBadgeColor(status) {
    switch (status) {
        case 'pending':
            return 'warning';
        case 'processing':
            return 'info';
        case 'shipped':
            return 'primary';
        case 'delivered':
            return 'success';
        case 'cancelled':
            return 'danger';
        default:
            return 'secondary';
    }
}

// Helper function to get payment status badge color
function getPaymentStatusBadgeColor(status) {
    switch (status) {
        case 'paid':
            return 'success';
        case 'pending':
            return 'warning';
        case 'failed':
            return 'danger';
        case 'refunded':
            return 'info';
        default:
            return 'secondary';
    }
}

// Format date helper function
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Make functions available globally
window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.saveTrackingInfo = saveTrackingInfo;
window.processRefund = processRefund;
window.saveOrderNotes = saveOrderNotes;

// Add this function for testing purposes
async function createTestOrder() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        showToast('info', 'Creating test order... Please wait.');

        // Step 1: Find an existing product to use
        console.log('Finding an existing product...');
        const productsResponse = await fetch(`${window.API_URL}/products?limit=1`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!productsResponse.ok) {
            throw new Error('Failed to find existing products');
        }

        const products = await productsResponse.json();
        if (!products || products.length === 0) {
            throw new Error('No products found in the system. Please create a product first.');
        }

        const product = products[0]; // Use the first available product
        console.log('Using existing product:', product);

        // Step 2: Add item to cart (this will create the cart automatically)
        console.log('Adding item to cart...');
        const addItemResponse = await fetch(`${window.API_URL}/cart/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productId: product.id,
                quantity: 2,
                customization: {
                    color: 'Blue',
                    size: 'Large',
                    design: 'Default'
                }
            })
        });

        if (!addItemResponse.ok) {
            const errorText = await addItemResponse.text();
            console.error('Cart error details:', {
                status: addItemResponse.status,
                statusText: addItemResponse.statusText,
                headers: Object.fromEntries(addItemResponse.headers.entries()),
                error: errorText
            });
            throw new Error(`Failed to add item to cart: ${errorText}`);
        }

        const cartItem = await addItemResponse.json();
        console.log('Item added to cart:', cartItem);

        // Step 3: Verify cart has items
        console.log('Verifying cart...');
        const cartResponse = await fetch(`${window.API_URL}/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!cartResponse.ok) {
            throw new Error('Failed to verify cart');
        }

        const cart = await cartResponse.json();
        if (!cart || !cart.items || cart.items.length === 0) {
            throw new Error('Cart is empty after adding items');
        }

        console.log('Cart verified:', cart);

        // Step 4: Create order with required fields
        console.log('Creating order...');
        const orderData = {
            shippingAddress: {
                street: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345',
                country: 'Test Country'
            },
            paymentMethod: 'credit_card',
            // Add required fields explicitly
            total: parseFloat(cart.total || 59.98),
            subtotal: parseFloat(cart.total || 59.98),
            shipping: 5.00
        };

        console.log('Order data:', orderData);

        const orderResponse = await fetch(`${window.API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        let orderResponseText;
        try {
            orderResponseText = await orderResponse.text();
            console.log('Order response:', orderResponseText);
            
            if (!orderResponse.ok) {
                console.error('Order error details:', {
                    status: orderResponse.status,
                    statusText: orderResponse.statusText,
                    headers: Object.fromEntries(orderResponse.headers.entries()),
                    error: orderResponseText
                });
                throw new Error(`Failed to create order: ${orderResponseText}`);
            }

            const data = JSON.parse(orderResponseText);
            console.log('Order created successfully:', data);
            showToast('success', 'Test order created successfully');
            loadOrders(); // Reload the orders list
        } catch (e) {
            console.error('Error processing order response:', e);
            throw new Error(e.message || 'Failed to process order response');
        }
    } catch (error) {
        console.error('Error creating test order:', error);
        showToast('error', error.message);
    }
}

// Function to add a floating test order button
function addFloatingTestOrderButton() {
    console.log('Adding floating test order button');
    
    // Create the button
    const testButton = document.createElement('button');
    testButton.className = 'btn btn-primary';
    testButton.textContent = 'Create Test Order';
    testButton.id = 'createTestOrderBtn';
    
    // Style the button as a floating action button
    Object.assign(testButton.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '9999',
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        padding: '0',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontWeight: 'bold'
    });
    
    // Add a plus icon
    testButton.innerHTML = '<i class="bi bi-plus"></i> Test';
    
    // Add click event
    testButton.onclick = function() {
        console.log('Test order button clicked');
        createTestOrder();
    };
    
    // Add to body to ensure it's always visible
    document.body.appendChild(testButton);
    
    console.log('Floating test order button added');
}

// Make sure all functions are in the global scope
window.createTestOrder = createTestOrder;
window.addFloatingTestOrderButton = addFloatingTestOrderButton; 