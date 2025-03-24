// Instead of import, use global variable from config.js (added to window.API_URL)
// Remove the import line above

// Ensure API_URL is available
if (typeof window.API_URL === 'undefined') {
    console.warn('API_URL not found on window object, using default value');
    window.API_URL = '/api'; // Fallback value
}

// Add global configuration for Cloudinary
if (typeof window.CLOUDINARY_CLOUD_NAME === 'undefined') {
    console.warn('CLOUDINARY_CLOUD_NAME not found on window object, using default value');
    window.CLOUDINARY_CLOUD_NAME = 'dopvs93sl'; // Default cloud name
}

// Products Management
let products = [];
let editingProductId = null;

// Make necessary functions available globally
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.showAddProductModal = showAddProductModal;
window.saveProduct = saveProduct;

// Load Products
async function loadProducts(searchTerm = '') {
    try {
        console.log('Loading products...');
        
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            showToast('error', 'Authentication required. Please log in.');
            return;
        }
        
        // Show loading indicator
        document.getElementById('productsTableBody').innerHTML = '<tr><td colspan="8" class="text-center">Loading products...</td></tr>';
        
        // Get API URL from config
        const apiUrl = window.API_URL || '/api';
        const searchParam = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
        const url = `${apiUrl}/products${searchParam}`;
        
        console.log('Fetching products from:', url);
        console.log('Using token (first 10 chars):', token.substring(0, 10) + '...');
        
        // Fetch products
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            throw new Error(`Failed to load products: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Products data received:', typeof data, Array.isArray(data) ? data.length : (data.products ? data.products.length : 'No products array'));
        
        // Handle different API response formats
        products = data.products || data; 
        
        if (!Array.isArray(products)) {
            console.error('Products is not an array:', products);
            products = [];
        }
        
        // Display products
        displayProducts(products);
        
        // Debug info
        console.log(`Loaded ${products.length} products`);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsTableBody').innerHTML = 
            `<tr><td colspan="8" class="text-center text-danger">Error loading products: ${error.message}</td></tr>`;
        showToast('error', 'Failed to load products. ' + error.message);
    }
}

// Show Add Product Modal
function showAddProductModal() {
    // Reset form and editing state
    editingProductId = null;
    
    const form = document.getElementById('productForm');
    if (form) {
        form.reset();
        
        // Reset image preview
        const imagePreview = document.getElementById('imagePreview');
        const imagePreviewElement = document.getElementById('imagePreviewElement');
        
        if (imagePreview && imagePreviewElement) {
            imagePreview.style.display = 'none';
            imagePreviewElement.src = '';
        }
    }
    
    document.getElementById('productModalTitle').textContent = 'Add Product';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// Edit Product
function editProduct(id) {
    console.log(`Edit product called with ID: ${id}`);
    
    // Set editing state
    editingProductId = id;
    document.getElementById('productModalTitle').textContent = 'Edit Product';
    
    // Find the product in the products array
    const product = products.find(p => p.id == id || p.id == parseInt(id)); // Handle string/int ID
    if (!product) {
        console.error(`Product with ID ${id} not found!`);
        showToast('error', `Product with ID ${id} not found!`);
        return;
    }
    
    console.log('Product being edited:', product);
    
    // Populate the form fields
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productStock').value = product.stock || '';
    document.getElementById('productCategory').value = product.category || '';
    
    // Populate optional fields if they exist
    const genderElement = document.getElementById('productGender');
    if (genderElement) genderElement.value = product.gender || 'unisex';
    
    const ageGroupElement = document.getElementById('productAgeGroup');
    if (ageGroupElement) ageGroupElement.value = product.ageGroup || 'adult';
    
    const statusElement = document.getElementById('productStatus');
    if (statusElement) statusElement.value = product.status || 'active';
    
    const customizableElement = document.getElementById('productCustomizable');
    if (customizableElement) customizableElement.checked = product.isCustomizable || false;
    
    // Set description value
    const descriptionElement = document.getElementById('productDescription');
    if (descriptionElement && product.description) {
        descriptionElement.value = product.description;
        
        // If rich text editor is being used, we need to update its content
        const editorContent = document.querySelector('.editor-content');
        if (editorContent) {
            editorContent.innerHTML = product.description;
        }
    }
    
    // Show image preview if available
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewElement = document.getElementById('imagePreviewElement');
    if (imagePreview && imagePreviewElement && product.image) {
        imagePreviewElement.src = product.image.startsWith('http') ? product.image : `/${product.image.replace(/^\//g, '')}`;
        imagePreview.style.display = 'block';
    } else if (imagePreview) {
        imagePreview.style.display = 'none';
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// Save Product
async function saveProduct() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('error', 'Authentication required');
            return;
        }
        
        // Get form data
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        
        // Get content from rich text editor if it exists
        const editorContent = document.querySelector('.editor-content');
        if (editorContent) {
            formData.set('description', editorContent.innerHTML);
        }
        
        // Check if customizable is checked and add it to formData
        const customizableElement = document.getElementById('productCustomizable');
        if (customizableElement) {
            formData.set('isCustomizable', customizableElement.checked);
        }
        
        // Prepare URL and method based on whether we're editing or adding
        const apiUrl = window.API_URL || '/api';
        let url = `${apiUrl}/products`;
        let method = 'POST';
        
        if (editingProductId) {
            url = `${apiUrl}/products/${editingProductId}`;
            method = 'PUT';
        }
        
        console.log(`${method} request to ${url}`);
        
        // Show saving state
        const saveButton = document.getElementById('saveProductBtn');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        }
        
        // Send request
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Failed to save product: ${response.statusText}`);
        }
        
        // Show success message
        showToast('success', editingProductId ? 'Product updated successfully' : 'Product added successfully');
        
        // Close modal and refresh products
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('error', error.message || 'Failed to save product');
    } finally {
        // Reset save button
        const saveButton = document.getElementById('saveProductBtn');
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = 'Save Product';
        }
    }
}

// Delete Product
async function deleteProduct(productId) {
    try {
        console.log(`Delete product called with ID: ${productId}`);
        
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('error', 'Authentication required');
            return;
        }
        
        // Show loading state on the button
        const deleteButton = document.querySelector(`.delete-btn[data-id="${productId}"]`);
        if (deleteButton) {
            deleteButton.disabled = true;
            deleteButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        }
        
        // Prepare request
        const apiUrl = window.API_URL || '/api';
        const url = `${apiUrl}/products/${productId}`;
        
        console.log(`DELETE request to ${url}`);
        
        // Send delete request
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
                    const errorText = await response.text();
            throw new Error(errorText || `Failed to delete product: ${response.statusText}`);
        }
        
        // Show success message
        showToast('success', 'Product deleted successfully');
        
        // Refresh product list
        loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('error', error.message || 'Failed to delete product');
        
        // Reset button state
        const deleteButton = document.querySelector(`.delete-btn[data-id="${productId}"]`);
        if (deleteButton) {
            deleteButton.disabled = false;
            deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
        }
    }
}

// Display Products
function displayProducts(productsToDisplay) {
    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Check if we have products
    if (!productsToDisplay || productsToDisplay.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No products found</td></tr>';
        return;
    }
    
    console.log('Displaying products:', productsToDisplay.length);
    
    // Create rows for each product
    productsToDisplay.forEach(product => {
        const row = document.createElement('tr');
        
        // Format image URL properly
        let imageUrl = product.image || '/admin/img/placeholder.png';
        if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = '/' + imageUrl;
        }
        
        // Create row content
        row.innerHTML = `
            <td>${product.id}</td>
            <td>
                <img src="${imageUrl}" alt="${product.name}" class="thumbnail" 
                    style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td>${product.name}</td>
            <td>${product.category || 'Uncategorized'}</td>
            <td>$${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="badge bg-${product.status === 'active' ? 'success' : 'secondary'}">
                    ${product.status || 'active'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary me-1 edit-btn" data-id="${product.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${product.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Attach event listeners to edit and delete buttons after adding to DOM
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            editProduct(productId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            deleteProduct(productId);
        });
    });
    
    console.log('Product display complete, attached event listeners');
}

// Show Toast Notification
function showToast(type, message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 5000 });
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Handle Search Input
function handleSearch() {
    const searchTerm = document.getElementById('navbarSearch').value.trim();
    loadProducts(searchTerm);
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing products page...');
    
    // Load products
    loadProducts();
    
    // Set up search input
    const searchInput = document.getElementById('navbarSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Set up product form event listeners
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', function(event) {
            event.preventDefault();
            saveProduct();
        });
    }
    
    // Check if we have the product modal
    const productModal = document.getElementById('productModal');
    if (!productModal) {
        console.error('Product modal not found. Functionality will be limited.');
    }
    
    // Double-check that necessary functions are in global scope
    if (!window.editProduct || !window.deleteProduct) {
        console.error('Product management functions not correctly initialized on window object.');
        window.editProduct = editProduct;
        window.deleteProduct = deleteProduct;
    }
    
    console.log('Products page initialization complete.');
});