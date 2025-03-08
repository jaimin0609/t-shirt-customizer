// Promotions Management JavaScript Module
console.log('Loading promotions.js');

// Ensure API_URL is available
if (typeof window.API_URL === 'undefined') {
    console.warn('API_URL not found on window object, using default value');
    window.API_URL = '/api'; // Fallback value
}

// DOM Elements
const promotionsTableBody = document.getElementById('promotionsTableBody');
const addPromotionBtn = document.getElementById('addPromotionBtn');
const checkStatusBtn = document.getElementById('checkStatusBtn');
const savePromotionBtn = document.getElementById('savePromotionBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const promotionForm = document.getElementById('promotionForm');
const promotionModal = new bootstrap.Modal(document.getElementById('promotionModal'));
const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
const promotionTypeSelect = document.getElementById('promotionType');
const categoriesContainer = document.getElementById('categoriesContainer');
const productsContainer = document.getElementById('productsContainer');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
        loadPromotions();
        setupEventListeners();
        setFormDefaults();
        loadFormDependencies();
    } else {
        window.location.href = '/admin/login.html';
    }
});

// Set up event listeners
function setupEventListeners() {
    // Add promotion button
    addPromotionBtn.addEventListener('click', () => {
        resetForm();
        document.getElementById('promotionModalLabel').textContent = 'Add New Promotion';
        promotionModal.show();
    });

    // Check status button
    checkStatusBtn.addEventListener('click', () => {
        updatePromotionStatuses();
    });

    // Save promotion button
    savePromotionBtn.addEventListener('click', savePromotion);

    // Confirm delete button
    confirmDeleteBtn.addEventListener('click', () => {
        const promotionId = document.getElementById('deletePromotionId').value;
        deletePromotion(promotionId);
    });

    // Promotion type change
    promotionTypeSelect.addEventListener('change', handlePromotionTypeChange);
}

// Load promotions from the server
async function loadPromotions() {
    try {
        showLoading();
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/promotions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        renderPromotionsTable(data);
    } catch (error) {
        console.error('Error loading promotions:', error);
        window.showToast('Failed to load promotions. Please try again.', 'error');
        
        // Show error message in table
        promotionsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    <p>Failed to load promotions. Please try again.</p>
                </td>
            </tr>
        `;
    }
}

// Render promotions in the table
function renderPromotionsTable(promotions) {
    if (!promotions || promotions.length === 0) {
        promotionsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <p>No promotions found. Click "Add Promotion" to create your first promotion.</p>
                </td>
            </tr>
        `;
        return;
    }

    // Sort promotions by status and then by start date
    promotions.sort((a, b) => {
        // First by status (active first)
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        
        // Then by start date (newest first)
        return new Date(b.startDate) - new Date(a.startDate);
    });

    let tableContent = '';
    
    promotions.forEach(promotion => {
        const status = getPromotionStatus(promotion);
        const statusClass = `badge-${status.toLowerCase()}`;
        const typeDisplay = getPromotionTypeDisplay(promotion.promotionType);
        const typeClass = `badge-${promotion.promotionType.replace('_', '-')}`;
        const discountDisplay = getDiscountDisplay(promotion);
        const dateRange = formatDateRange(promotion.startDate, promotion.endDate);
        
        tableContent += `
            <tr data-id="${promotion.id}">
                <td>
                    <span class="promotion-name">${promotion.name}</span>
                    <p class="text-muted mb-0 small">${promotion.description || ''}</p>
                </td>
                <td><span class="badge ${typeClass}">${typeDisplay}</span></td>
                <td><span class="discount-badge badge bg-dark">${discountDisplay}</span></td>
                <td><span class="date-range">${dateRange}</span></td>
                <td><span class="badge ${statusClass}">${status}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="${promotion.id}">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${promotion.id}">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    });

    promotionsTableBody.innerHTML = tableContent;

    // Add event listeners to action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editPromotion(btn.getAttribute('data-id')));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('deletePromotionId').value = btn.getAttribute('data-id');
            deleteConfirmModal.show();
        });
    });
}

// Get promotion status text
function getPromotionStatus(promotion) {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    if (!promotion.isActive) return 'Inactive';
    if (now < startDate) return 'Scheduled';
    if (now > endDate) return 'Expired';
    return 'Active';
}

// Get promotion type display text
function getPromotionTypeDisplay(type) {
    switch (type) {
        case 'store_wide':
            return 'Store Wide';
        case 'category':
            return 'Category';
        case 'product_specific':
            return 'Product';
        case 'clearance':
            return 'Clearance';
        default:
            return type;
    }
}

// Get discount display text
function getDiscountDisplay(promotion) {
    if (promotion.discountType === 'percentage') {
        return `${promotion.discountValue}% OFF`;
    } else {
        return `${window.formatCurrency(promotion.discountValue)} OFF`;
    }
}

// Format date range
function formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startStr = start.toLocaleDateString();
    const endStr = end.toLocaleDateString();
    
    return `${startStr} - ${endStr}`;
}

// Show loading state
function showLoading() {
    promotionsTableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="6" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading promotions...</p>
            </td>
        </tr>
    `;
}

// Reset the form
function resetForm() {
    promotionForm.reset();
    document.getElementById('promotionId').value = '';
    document.getElementById('isActive').checked = true;
    
    // Set default dates
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Default 30 days
    
    document.getElementById('startDate').value = today.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    
    // Reset dynamic form elements
    handlePromotionTypeChange();
}

// Set form defaults
function setFormDefaults() {
    // Set default dates
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Default 30 days
    
    document.getElementById('startDate').value = today.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    
    // Active by default
    document.getElementById('isActive').checked = true;
}

// Handle promotion type change
function handlePromotionTypeChange() {
    const promotionType = promotionTypeSelect.value;
    
    // Toggle category selection
    if (promotionType === 'category') {
        categoriesContainer.classList.remove('d-none');
    } else {
        categoriesContainer.classList.add('d-none');
    }
    
    // Toggle product selection
    if (promotionType === 'product_specific') {
        productsContainer.classList.remove('d-none');
    } else {
        productsContainer.classList.add('d-none');
    }
}

// Load form dependencies (categories, products)
async function loadFormDependencies() {
    try {
        const token = localStorage.getItem('token');
        // Load categories
        const categoriesResponse = await fetch(`${window.API_URL}/products/categories`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (categoriesResponse.ok) {
            const categories = await categoriesResponse.json();
            const categoriesSelect = document.getElementById('applicableCategories');
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoriesSelect.appendChild(option);
            });
        }

        // Load products
        const productsResponse = await fetch(`${window.API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (productsResponse.ok) {
            const products = await productsResponse.json();
            const productsSelect = document.getElementById('applicableProducts');
            
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (${window.formatCurrency(product.price)})`;
                productsSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading form dependencies:', error);
        window.showToast('Failed to load some form options.', 'warning');
    }
}

// Save promotion
async function savePromotion() {
    try {
        // Validate form
        if (!promotionForm.checkValidity()) {
            promotionForm.reportValidity();
            return;
        }

        // Get form data
        const promotionId = document.getElementById('promotionId').value;
        const isEdit = !!promotionId;
        
        // Create promotion data object
        const promotionData = {
            name: document.getElementById('name').value,
            description: document.getElementById('description').value,
            promotionType: document.getElementById('promotionType').value,
            discountType: document.getElementById('discountType').value,
            discountValue: parseFloat(document.getElementById('discountValue').value),
            priority: parseInt(document.getElementById('priority').value, 10),
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            highlightColor: document.getElementById('highlightColor').value,
            minimumPurchase: parseFloat(document.getElementById('minimumPurchase').value || 0),
            usageLimit: parseInt(document.getElementById('usageLimit').value || 0, 10),
            isActive: document.getElementById('isActive').checked
        };

        // Add type-specific data
        if (promotionData.promotionType === 'category') {
            const categories = Array.from(document.getElementById('applicableCategories').selectedOptions).map(option => option.value);
            promotionData.applicableCategories = categories;
        }

        if (promotionData.promotionType === 'product_specific') {
            const products = Array.from(document.getElementById('applicableProducts').selectedOptions).map(option => option.value);
            promotionData.applicableProducts = products;
        }

        // Send request to server
        const token = localStorage.getItem('token');
        const url = isEdit ? `${window.API_URL}/promotions/${promotionId}` : `${window.API_URL}/promotions`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(promotionData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status}`);
        }

        const result = await response.json();
        
        // Close modal and show success message
        promotionModal.hide();
        window.showToast(`Promotion ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
        
        // Reload promotions
        loadPromotions();
    } catch (error) {
        console.error('Error saving promotion:', error);
        window.showToast(`Failed to save promotion: ${error.message}`, 'error');
    }
}

// Edit promotion
async function editPromotion(promotionId) {
    try {
        // Fetch promotion details
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/promotions/${promotionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const promotion = await response.json();
        
        // Populate form
        document.getElementById('promotionId').value = promotion.id;
        document.getElementById('name').value = promotion.name;
        document.getElementById('description').value = promotion.description || '';
        document.getElementById('promotionType').value = promotion.promotionType;
        document.getElementById('discountType').value = promotion.discountType;
        document.getElementById('discountValue').value = promotion.discountValue;
        document.getElementById('priority').value = promotion.priority;
        document.getElementById('startDate').value = new Date(promotion.startDate).toISOString().split('T')[0];
        document.getElementById('endDate').value = new Date(promotion.endDate).toISOString().split('T')[0];
        document.getElementById('highlightColor').value = promotion.highlightColor || '#FF5722';
        document.getElementById('minimumPurchase').value = promotion.minimumPurchase || 0;
        document.getElementById('usageLimit').value = promotion.usageLimit || 0;
        document.getElementById('isActive').checked = promotion.isActive;
        
        // Handle type-specific data
        handlePromotionTypeChange();
        
        if (promotion.promotionType === 'category' && promotion.applicableCategories) {
            const categoriesSelect = document.getElementById('applicableCategories');
            promotion.applicableCategories.forEach(category => {
                Array.from(categoriesSelect.options).forEach(option => {
                    if (option.value === category) {
                        option.selected = true;
                    }
                });
            });
        }

        if (promotion.promotionType === 'product_specific' && promotion.applicableProducts) {
            const productsSelect = document.getElementById('applicableProducts');
            promotion.applicableProducts.forEach(productId => {
                Array.from(productsSelect.options).forEach(option => {
                    if (option.value === productId.toString()) {
                        option.selected = true;
                    }
                });
            });
        }
        
        // Update modal title
        document.getElementById('promotionModalLabel').textContent = 'Edit Promotion';
        
        // Show modal
        promotionModal.show();
    } catch (error) {
        console.error('Error loading promotion for edit:', error);
        window.showToast('Failed to load promotion details', 'error');
    }
}

// Delete promotion
async function deletePromotion(promotionId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/promotions/${promotionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        // Close modal and show success message
        deleteConfirmModal.hide();
        window.showToast('Promotion deleted successfully', 'success');
        
        // Reload promotions
        loadPromotions();
    } catch (error) {
        console.error('Error deleting promotion:', error);
        window.showToast('Failed to delete promotion', 'error');
    }
}

// Update promotion statuses (active/expired)
async function updatePromotionStatuses() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/promotions/check-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        window.showToast(`Promotion statuses updated: ${result.updatedCount} promotion(s) affected`, 'success');
        
        // Reload promotions
        loadPromotions();
    } catch (error) {
        console.error('Error updating promotion statuses:', error);
        window.showToast('Failed to update promotion statuses', 'error');
    }
} 