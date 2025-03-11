// add-product.js - Handles product creation functionality
console.log('Loading add-product.js script...');

// Use global API_URL variable from window object instead of import

// Ensure API_URL is available
if (typeof window.API_URL === 'undefined') {
    console.warn('API_URL not found on window object, using default value');
    window.API_URL = '/api'; // Fallback value
}

// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded in add-product.js');
    
    try {
        // Initialize the form
        initializeForm();
        
        // Load categories for the dropdown
        loadCategories();
        
        // Set up image upload functionality
        setupImageUpload();
        
        // Note: Variant functionality is handled by variants.js
        
        // Handle form submission
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
            addProductForm.addEventListener('submit', handleFormSubmit);
            console.log('Form submission handler attached');
        } else {
            console.error('Product form not found!');
        }
    } catch (error) {
        console.error('Error initializing add-product.js:', error);
        alert('Error initializing product page: ' + error.message);
    }
});

/**
 * Initialize the form with default values
 */
function initializeForm() {
    console.log('Initializing form...');
    
    const stockInput = document.getElementById('productStock');
    const priceInput = document.getElementById('productPrice');
    const customizableCheckbox = document.getElementById('productCustomizable');
    
    if (stockInput) stockInput.value = '0';
    if (priceInput) priceInput.value = '0.00';
    if (customizableCheckbox) customizableCheckbox.checked = false;
    
    console.log('Form initialized with default values');
    
    // Add responsive improvements for mobile devices
    if (window.innerWidth < 768) {
        // Make dropzone smaller on mobile
        const dropzone = document.querySelector('.dropzone-container');
        if (dropzone) {
            dropzone.style.minHeight = '120px';
        }
        
        // Simplify variant UI on mobile
        const variantRows = document.querySelectorAll('.variant-row');
        variantRows.forEach(row => {
            row.classList.add('mb-4');
        });
        
        // Better mobile UX for color picker
        const colorPickers = document.querySelectorAll('input[type="color"]');
        colorPickers.forEach(picker => {
            picker.style.minHeight = '44px';
            picker.style.minWidth = '44px';
        });
    }
    
    // Add window resize listener for responsive behavior
    window.addEventListener('resize', function() {
        const isMobile = window.innerWidth < 768;
        
        // Adjust UI based on screen size
        const dropzone = document.querySelector('.dropzone-container');
        if (dropzone) {
            dropzone.style.minHeight = isMobile ? '120px' : '200px';
        }
        
        // Adjust variant UI based on screen size
        document.querySelectorAll('.variant-row').forEach(row => {
            if (isMobile) {
                row.classList.add('mb-4');
            } else {
                row.classList.remove('mb-4');
            }
        });
    });
}

/**
 * Load categories for the dropdown
 */
function loadCategories() {
    console.log('Loading categories...');
    const categorySelect = document.getElementById('productCategory');
    
    if (!categorySelect) {
        console.error('Category select element not found!');
        return;
    }
    
    // Add initial loading state
    categorySelect.innerHTML = '<option value="">Loading categories...</option>';
    categorySelect.disabled = true;
    
    // Make sure dropdown is visible in DOM and CSS
    categorySelect.style.display = 'block';
    categorySelect.style.visibility = 'visible';
    categorySelect.style.opacity = '1';
    
    console.log('Category select before fetch:', {
        id: categorySelect.id,
        options: categorySelect.options.length,
        display: categorySelect.style.display,
        visible: categorySelect.style.visibility
    });
    
    // Try fetching from API but have a short timeout to fail gracefully
    const fetchPromise = fetch(`${window.API_URL}/products/categories/all`)
        .then(response => {
            console.log('Category API response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to fetch categories (${response.status})`);
            }
            return response.json();
        });
    
    // Set a timeout to avoid hanging if the API is unavailable
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Categories fetch timeout")), 5000);
    });
    
    // Use the faster of the two - successful API call or timeout
    Promise.race([fetchPromise, timeoutPromise])
        .then(categories => {
            console.log('Categories loaded from API:', categories);
            
            // Check if we have valid data
            if (!Array.isArray(categories)) {
                throw new Error('Invalid categories data format');
            }
            
            // Add small delay to ensure DOM is ready
            setTimeout(() => {
                // Populate the dropdown
                populateCategoriesDropdown(categories);
                
                // Force a refresh of the select element
                const event = new Event('change');
                categorySelect.dispatchEvent(event);
            }, 100);
        })
        .catch(error => {
            console.warn('Error loading categories from API:', error);
            console.log('Using fallback categories');
            
            // Fallback sample categories if API fails
            const sampleCategories = [
                { id: 1, name: 'T-Shirts' },
                { id: 2, name: 'Hoodies' },
                { id: 3, name: 'Sweatshirts' },
                { id: 4, name: 'Tank Tops' },
                { id: 5, name: 'Polo Shirts' },
                { id: 6, name: 'Long Sleeves' },
                { id: 7, name: 'Accessories' },
                { id: 8, name: 'Hats & Caps' },
                { id: 9, name: 'Mugs' }
            ];
            
            populateCategoriesDropdown(sampleCategories);
        })
        .finally(() => {
            // Make sure dropdown is enabled
            categorySelect.disabled = false;
            
            // Add an event listener to check if it works after being populated
            categorySelect.addEventListener('change', function() {
                console.log('Category selected:', this.value);
            });
            
            // Force browser to refresh the dropdown rendering
            setTimeout(() => {
                categorySelect.style.display = 'none';
                setTimeout(() => {
                    categorySelect.style.display = 'block';
                    
                    // Check final state
                    console.log('Category select after population:', {
                        id: categorySelect.id,
                        options: categorySelect.options.length,
                        selectedIndex: categorySelect.selectedIndex,
                        value: categorySelect.value,
                        display: window.getComputedStyle(categorySelect).display
                    });
                }, 50);
            }, 100);
        });
}

/**
 * Populate the categories dropdown with data
 */
function populateCategoriesDropdown(categories) {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) {
        console.error('Category select element not found!');
        return;
    }
    
    console.log('Populating dropdown with', categories.length, 'categories');
    
    // Clear existing options
    categorySelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Category';
    categorySelect.appendChild(defaultOption);
    
    // Sort categories alphabetically
    categories.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add category options
    categories.forEach(category => {
        if (!category.name) {
            console.warn('Skipping category with empty name:', category);
            return;
        }
        
        const option = document.createElement('option');
        option.value = category.id || category.name;
        option.textContent = category.name;
        categorySelect.appendChild(option);
        
        console.log(`Added category option: ${category.name} (${option.value})`);
    });
    
    console.log('Categories dropdown populated with', categories.length, 'items');
    
    // Manually select the default option
    categorySelect.selectedIndex = 0;
}

/**
 * Set up image upload functionality
 */
function setupImageUpload() {
    console.log('Setting up image upload...');
    
    const productImages = document.getElementById('productImages');
    const previewsContainer = document.getElementById('productImagePreviews');
    const dropzoneContainer = document.querySelector('.dropzone-container');
    const dropzoneMessage = document.querySelector('.dz-message');
    
    if (!productImages || !previewsContainer || !dropzoneContainer || !dropzoneMessage) {
        console.error('Image upload elements not found!');
        return;
    }
    
    // Fix: Make sure the click event is properly handled
    dropzoneContainer.addEventListener('click', function(e) {
        console.log('Dropzone clicked');
        // Prevent the event from being triggered twice
        e.preventDefault();
        e.stopPropagation();
        // Directly trigger file selection
        productImages.click();
    });
    
    // Add drag and drop visual feedback
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzoneContainer.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Add visual feedback for drag operations
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzoneContainer.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzoneContainer.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropzoneContainer.classList.add('border-primary');
    }
    
    function unhighlight() {
        dropzoneContainer.classList.remove('border-primary');
    }
    
    // Handle actual drop
    dropzoneContainer.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        productImages.files = files; // This might not work directly due to security
        handleFiles(files);
    }
    
    // Handle file selection - with improved error handling
    productImages.addEventListener('change', function(e) {
        console.log('Files selected via input:', this.files?.length || 0);
        if (this.files && this.files.length > 0) {
            handleFiles(this.files);
        }
    });
    
    function handleFiles(files) {
        console.log('Processing files:', files.length);
        previewsContainer.innerHTML = '';
        
        if (!files || files.length === 0) {
            dropzoneMessage.style.display = 'block';
            return;
        }
        
        // Hide the dropzone message when files are selected
        dropzoneMessage.style.display = 'none';
        
        // Process each file (up to 5)
        Array.from(files).slice(0, 5).forEach((file, index) => {
            console.log(`Processing file ${index + 1}:`, file.name);
            
            const reader = new FileReader();
            
            // Add error handling for FileReader
            reader.onerror = function() {
                console.error(`Error reading file ${file.name}`);
                showToast('error', `Failed to read file: ${file.name}`);
            };
            
            reader.onload = function(e) {
                // Create preview card
                const previewCol = document.createElement('div');
                previewCol.className = 'col-md-4 col-6';
                
                const previewCard = document.createElement('div');
                previewCard.className = 'card h-100';
                
                const previewImg = document.createElement('img');
                previewImg.src = e.target.result;
                previewImg.className = 'card-img-top';
                previewImg.style.height = '150px';
                previewImg.style.objectFit = 'cover';
                
                // Add error handling for image loading
                previewImg.onerror = function() {
                    previewImg.src = '/admin/img/image-placeholder.png'; // Fallback image
                    console.error(`Failed to load image preview for ${file.name}`);
                };
                
                const cardBody = document.createElement('div');
                cardBody.className = 'card-body p-2';
                
                const fileName = document.createElement('p');
                fileName.className = 'card-text small text-truncate mb-0';
                fileName.textContent = file.name;
                
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'btn btn-sm btn-danger position-absolute top-0 end-0 m-1';
                removeBtn.innerHTML = '<i class="bi bi-x"></i>';
                removeBtn.onclick = function() {
                    previewCol.remove();
                    // Show dropzone message if no previews left
                    if (previewsContainer.children.length === 0) {
                        dropzoneMessage.style.display = 'block';
                    }
                };
                
                // Assemble the preview card
                cardBody.appendChild(fileName);
                previewCard.appendChild(previewImg);
                previewCard.appendChild(cardBody);
                previewCard.appendChild(removeBtn);
                previewCol.appendChild(previewCard);
                previewsContainer.appendChild(previewCol);
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    console.log('Image upload setup complete');
}

/**
 * Get tags from input for product submission
 * Simple utility to extract tags from a comma-separated string
 */
function getTagsFromInput() {
    const tagsInput = document.getElementById('productTags');
    if (!tagsInput || !tagsInput.value) return [];
    
    // Split tags by comma and trim whitespace
    return tagsInput.value.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
}

/**
 * Show loading indicator during form submission
 */
function showLoading() {
    // Add a simple loading overlay if it doesn't exist
    let loadingOverlay = document.getElementById('loadingOverlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.innerHTML = `
            <div class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75" style="z-index: 1060;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    }
    loadingOverlay.style.display = 'block';
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    
    // Add a timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
    });
    
    try {
        console.log('Starting product submission...');
        showLoading();
        
        const formData = new FormData(e.target);
        
        // Add status as boolean
        formData.set('status', document.getElementById('productStatus').checked ? 'active' : 'inactive');
        
        // Add featured as boolean
        formData.set('featured', document.getElementById('productFeatured').checked ? 'true' : 'false');
        
        // Add customization options if any are present
        const customizationOptions = [];
        document.querySelectorAll('.customization-option:checked').forEach(option => {
            customizationOptions.push(option.value);
        });
        formData.append('customizationOptions', JSON.stringify(customizationOptions));
        
        // Add variant data from the variant system
        if (window.variantSystem && typeof window.variantSystem.areVariantsEnabled === 'function') {
            const hasVariants = window.variantSystem.areVariantsEnabled();
            formData.append('hasVariants', hasVariants ? 'true' : 'false');
            
            if (hasVariants) {
                // Get color variants
                const colorVariants = window.variantSystem.getColorVariants();
                
                // Validate color variants
                if (Array.isArray(colorVariants) && colorVariants.length > 0) {
                    // Make sure all required fields are present and valid
                    const validColorVariants = colorVariants.map(variant => ({
                        color: String(variant.color || ''),
                        colorCode: String(variant.colorCode || ''),
                        stock: parseInt(variant.stock || 0, 10),
                        priceAdjustment: parseFloat(variant.priceAdjustment || 0)
                    }));
                    formData.append('colorVariantsData', JSON.stringify(validColorVariants));
                    console.log('Valid color variants:', validColorVariants);
                } else {
                    console.warn('No color variants provided or invalid format');
                    formData.append('colorVariantsData', JSON.stringify([]));
                }
                
                // Get size variants
                const sizeVariants = window.variantSystem.getSizeVariants();
                
                // Validate size variants
                if (Array.isArray(sizeVariants) && sizeVariants.length > 0) {
                    // Make sure all required fields are present and valid
                    const validSizeVariants = sizeVariants.map(variant => ({
                        size: String(variant.size || ''),
                        stock: parseInt(variant.stock || 0, 10),
                        priceAdjustment: parseFloat(variant.priceAdjustment || 0)
                    }));
                    formData.append('sizeVariantsData', JSON.stringify(validSizeVariants));
                    console.log('Valid size variants:', validSizeVariants);
                } else {
                    console.warn('No size variants provided or invalid format');
                    formData.append('sizeVariantsData', JSON.stringify([]));
                }
            }
        } else {
            formData.append('hasVariants', 'false');
            console.warn('Variant system not available');
        }
        
        // Add tags if the tag input exists
        const tags = getTagsFromInput();
        if (tags.length > 0) {
            formData.append('tags', tags.join(','));
        }
        
        // Validate required fields
        const requiredFields = ['name', 'price', 'category'];
        const missingFields = [];
        
        requiredFields.forEach(field => {
            if (!formData.get(field)) {
                missingFields.push(field);
            }
        });
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Validate that at least one image is selected
        const imageInput = document.getElementById('productImages');
        if (imageInput && (!imageInput.files || imageInput.files.length === 0)) {
            console.warn('No images selected for product');
            // Continue without images - it's a warning, not an error
        }
        
        // Log the form data for debugging
        console.log("Form data being sent:");
        for (let [key, value] of formData.entries()) {
            if (key !== 'images') {
                console.log(key, value);
            } else {
                console.log(key, "File object", value instanceof File ? `(${value.name}, ${value.size} bytes)` : 'Not a file');
            }
        }
        
        // Make the API request to create the product with timeout protection
        console.log('Sending product data to API:', window.API_URL);
        
        const fetchPromise = fetch(`${window.API_URL}/products`, {
            method: 'POST',
            body: formData,
            // No need to set Content-Type with FormData, it's set automatically with proper boundary
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        // Race between the fetch and the timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        console.log('Received response from server with status:', response.status);
        
        // Parse the JSON response
        let result;
        try {
            result = await response.json();
            console.log('Server response:', result);
        } catch (jsonError) {
            console.error('Failed to parse response as JSON:', jsonError);
            // Get the raw text if JSON parsing fails
            const textResponse = await response.text();
            console.log('Raw server response:', textResponse);
            throw new Error('Invalid server response format');
        }
        
        // Check if the request was successful
        if (!response.ok) {
            throw new Error(result.message || `Server error (${response.status})`);
        }
        
        // Show success notification
        showNotification('Product added successfully!', 'success');
        
        // Reset form and redirect after a short delay
        setTimeout(() => {
            e.target.reset();
            window.location.href = 'products.html';
        }, 1500);
    } catch (error) {
        console.error('Error creating product:', error);
        showNotification(`Failed to add product: ${error.message}`, 'danger');
        
        // Log extra diagnostic information for specific errors
        if (error.message.includes('timeout')) {
            console.error('Request timed out. This might indicate a server-side issue or large file uploads.');
        }
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        hideLoading();
    }
}

/**
 * Show a toast notification
 */
function showToast(type, message) {
    console.log(`${type} toast:`, message);
    
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastTitle || !toastMessage) {
        alert(message);
        return;
    }
    
    // Set toast title based on type
    let title = 'Notification';
    
    switch (type) {
        case 'success': title = 'Success'; break;
        case 'error': title = 'Error'; break;
        case 'warning': title = 'Warning'; break;
        case 'info': title = 'Information'; break;
    }
    
    // Set toast content
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Show the toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Function to show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification`;
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
}

console.log('add-product.js loaded successfully!'); 