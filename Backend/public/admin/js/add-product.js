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
    
    // Create a fixed click handler one time only
    let clickHandlerAttached = false;
    
    function attachClickHandler() {
        if (clickHandlerAttached) return; // Only attach once
        
        // Fix: Make sure the click event is properly handled with direct event binding
        dropzoneContainer.onclick = function(e) {
            console.log('Dropzone clicked');
            // Prevent the event from being triggered twice
            e.preventDefault();
            e.stopPropagation();
            // Directly trigger file selection
            productImages.click();
        };
        
        clickHandlerAttached = true;
        console.log('Dropzone click handler attached successfully');
    }
    
    // Immediately attach the click handler
    attachClickHandler();
    
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
        
        // Check if files were actually dropped
        if (files && files.length > 0) {
            console.log('Files dropped:', files.length);
            handleFiles(files);
        } else {
            console.warn('No files found in drop event');
        }
    }
    
    // Handle file selection - with improved error handling
    productImages.addEventListener('change', function(e) {
        console.log('Files selected via input change event:', this.files?.length || 0);
        if (this.files && this.files.length > 0) {
            handleFiles(this.files);
        } else {
            console.warn('No files in change event');
        }
    });
    
    function handleFiles(files) {
        console.log('Processing files in handleFiles:', files.length);
        previewsContainer.innerHTML = '';
        
        if (!files || files.length === 0) {
            console.warn('No files to process');
            dropzoneMessage.style.display = 'block';
            return;
        }
        
        // Hide the dropzone message when files are selected
        dropzoneMessage.style.display = 'none';
        
        // Process each file (up to 5)
        const promises = [];
        
        Array.from(files).slice(0, 5).forEach((file, index) => {
            console.log(`Processing file ${index + 1}:`, file.name, file.type, file.size);
            
            // Verify it's an image file
            if (!file.type.startsWith('image/')) {
                console.warn(`Skipping non-image file: ${file.name} (${file.type})`);
                showToast('warning', `Skipped non-image file: ${file.name}`);
                return;
            }
            
            const promise = new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                // Add error handling for FileReader
                reader.onerror = function() {
                    console.error(`Error reading file ${file.name}`);
                    showToast('error', `Failed to read file: ${file.name}`);
                    reject(new Error(`Failed to read file: ${file.name}`));
                };
                
                reader.onload = function(e) {
                    try {
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
                        
                        resolve();
                    } catch (error) {
                        console.error('Error creating preview:', error);
                        reject(error);
                    }
                };
                
                reader.readAsDataURL(file);
            });
            
            promises.push(promise);
        });
        
        // After all files are processed, check if any were added
        Promise.allSettled(promises).then(results => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            console.log(`Successfully processed ${successful} out of ${files.length} files`);
            
            if (successful === 0) {
                dropzoneMessage.style.display = 'block';
                showToast('warning', 'No valid image files were added');
            }
            
            // Make sure the click handler is still attached (sometimes it gets lost)
            attachClickHandler();
        });
    }
    
    // Also trigger a click handler check every 2 seconds to ensure it's always available
    const handlerInterval = setInterval(() => {
        if (!clickHandlerAttached) {
            console.log('Reattaching dropzone click handler');
            attachClickHandler();
        }
    }, 2000);
    
    // Clean up interval after 30 seconds
    setTimeout(() => {
        clearInterval(handlerInterval);
    }, 30000);
    
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
    
    console.log("🚀 FORM SUBMISSION STARTED");
    
    // Show loading state
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    
    // Add a timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 45 seconds')), 45000);
    });
    
    // Create a debug panel in the console
    console.group("📋 PRODUCT FORM DEBUG");
    
    try {
        console.log('Starting product submission...');
        showLoading();
        
        // Create a new FormData object directly (fixing potential issues)
        const form = document.getElementById('addProductForm');
        const formData = new FormData();
        
        // DEBUG SUMMARY
        console.log("Form Details:", {
            formElement: form ? "Found" : "Missing",
            authToken: localStorage.getItem('token') ? "Present" : "Missing",
            apiUrl: window.API_URL
        });
        
        // Manually add all the form fields to ensure proper values
        // This avoids issues with disabled fields, checkboxes, etc.
        formData.append('name', document.getElementById('productName').value);
        formData.append('description', document.getElementById('productDescription').value);
        formData.append('price', document.getElementById('productPrice').value);
        formData.append('stock', document.getElementById('productStock').value);
        
        // Category - critical field that may have issues
        const categorySelect = document.getElementById('productCategory');
        if (categorySelect && categorySelect.value) {
            formData.append('category', categorySelect.value);
            console.log('✅ Added category:', categorySelect.value);
        } else {
            console.warn('⚠️ No category selected!');
            showNotification('Please select a product category', 'warning');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            hideLoading();
            console.groupEnd();
            return; // Stop the submission
        }
        
        // Other dropdowns
        formData.append('gender', document.getElementById('productGender').value);
        formData.append('ageGroup', document.getElementById('productAgeGroup').value);
        
        // Add status as boolean
        formData.append('status', document.getElementById('productStatus').checked ? 'active' : 'inactive');
        
        // Add featured as boolean
        formData.append('featured', document.getElementById('productFeatured').checked ? 'true' : 'false');
        
        // STEP 1: CUSTOMIZATION OPTIONS - DEBUG SECTION
        console.group("🛠️ Customization Options");
        try {
            // Add customization options if any are present
            const customizationOptions = [];
            document.querySelectorAll('.customization-option:checked').forEach(option => {
                customizationOptions.push(option.value);
            });
            formData.append('customizationOptions', JSON.stringify(customizationOptions));
            console.log('✅ Added customization options:', customizationOptions);
        } catch (customizationError) {
            console.error('❌ Error adding customization options:', customizationError);
            // Continue submission despite this error
        }
        console.groupEnd();
        
        // STEP 2: IMAGE UPLOADS - DEBUG SECTION
        console.group("🖼️ Image Processing");
        const imageInput = document.getElementById('productImages');
        console.log('Image input element found:', !!imageInput);
        console.log('Image files selected:', imageInput?.files?.length || 0);
        
        let imageProcessingSuccess = false;
        
        try {
            if (imageInput && imageInput.files && imageInput.files.length > 0) {
                console.log(`Processing ${imageInput.files.length} image files...`);
                // Add each file individually with explicit type checking
                let successfulImages = 0;
                
                // Debug all files
                for (let i = 0; i < imageInput.files.length; i++) {
                    const file = imageInput.files[i];
                    console.log(`Image file ${i+1}: Name=${file.name}, Size=${file.size}, Type=${file.type}`);
                }
                
                // Critical fix: Make sure the file input is not disabled and its files are accessible
                if (imageInput.disabled) {
                    console.warn('Image input was disabled! Enabling it...');
                    imageInput.disabled = false;
                }
                
                // Double check that files are still available
                if (!imageInput.files || imageInput.files.length === 0) {
                    console.error('⚠️ Files disappeared from input element!');
                } else {
                    // Ensure the files are properly attached to the FormData
                    // This is the critical section to fix the "Files received: 0" issue
                    for (let i = 0; i < Math.min(imageInput.files.length, 5); i++) {
                        const file = imageInput.files[i];
                        
                        // Verify it's an image file
                        if (file.type.startsWith('image/')) {
                            try {
                                console.log(`Adding image ${i+1}: ${file.name} (${file.size} bytes, ${file.type})`);
                                
                                // Important: Use 'images' as the field name to match server expectation
                                formData.append('images', file);
                                
                                // Debug log to verify image was added to FormData
                                console.log(`✓ Successfully appended file ${file.name} to FormData as 'images'`);
                                successfulImages++;
                            } catch (singleImageError) {
                                console.error(`❌ Error adding image ${i+1}:`, singleImageError);
                            }
                        } else {
                            console.warn(`⚠️ Skipping non-image file: ${file.name} (${file.type})`);
                        }
                    }
                }
                
                // Debug log to verify FormData contents
                console.log('Verifying FormData contents:');
                for (let [key, value] of formData.entries()) {
                    if (key === 'images') {
                        if (value instanceof File) {
                            console.log(`FormData contains image: ${value.name} (${value.size} bytes)`);
                        } else {
                            console.warn(`FormData contains non-File value for 'images' key:`, value);
                        }
                    }
                }
                
                if (successfulImages > 0) {
                    console.log(`✅ Successfully processed ${successfulImages} images`);
                    imageProcessingSuccess = true;
                } else {
                    console.warn('⚠️ No images were successfully processed');
                }
            } else {
                console.log('⚠️ No image files selected - continuing without images');
                imageProcessingSuccess = true; // No images is still a success case
            }
        } catch (imageError) {
            console.error('❌ Error processing images:', imageError);
            // Continue submission despite image errors
        }
        console.groupEnd();
        
        // STEP 3: VARIANTS - DEBUG SECTION
        console.group("🔄 Product Variants");
        let variantProcessingSuccess = false;
        
        try {
            // Add variant data from the variant system
            if (window.variantSystem && typeof window.variantSystem.areVariantsEnabled === 'function') {
                const hasVariants = window.variantSystem.areVariantsEnabled();
                formData.append('hasVariants', hasVariants ? 'true' : 'false');
                console.log('Has variants:', hasVariants);
                
                if (hasVariants) {
                    try {
                        // Get color variants
                        const colorVariants = window.variantSystem.getColorVariants();
                        console.log('Raw color variants:', colorVariants);
                        
                        // Validate color variants
                        if (Array.isArray(colorVariants) && colorVariants.length > 0) {
                            // Make sure all required fields are present and valid
                            const validColorVariants = colorVariants.map(variant => ({
                                color: String(variant.color || ''),
                                colorCode: String(variant.colorCode || ''),
                                stock: parseInt(variant.stock || 0, 10),
                                priceAdjustment: parseFloat(variant.priceAdjustment || 0)
                            }));
                            
                            const colorJson = JSON.stringify(validColorVariants);
                            formData.append('colorVariantsData', colorJson);
                            console.log('✅ Added color variants:', validColorVariants.length);
                            console.log('Color variants JSON length:', colorJson.length);
                        } else {
                            console.warn('⚠️ No color variants provided or invalid format');
                            formData.append('colorVariantsData', JSON.stringify([]));
                        }
                    } catch (colorError) {
                        console.error('❌ Error processing color variants:', colorError);
                        formData.append('colorVariantsData', JSON.stringify([]));
                    }
                    
                    try {
                        // Get size variants
                        const sizeVariants = window.variantSystem.getSizeVariants();
                        console.log('Raw size variants:', sizeVariants);
                        
                        // Validate size variants
                        if (Array.isArray(sizeVariants) && sizeVariants.length > 0) {
                            // Make sure all required fields are present and valid
                            const validSizeVariants = sizeVariants.map(variant => ({
                                size: String(variant.size || ''),
                                stock: parseInt(variant.stock || 0, 10),
                                priceAdjustment: parseFloat(variant.priceAdjustment || 0)
                            }));
                            
                            const sizeJson = JSON.stringify(validSizeVariants);
                            formData.append('sizeVariantsData', sizeJson);
                            console.log('✅ Added size variants:', validSizeVariants.length);
                            console.log('Size variants JSON length:', sizeJson.length);
                        } else {
                            console.warn('⚠️ No size variants provided or invalid format');
                            formData.append('sizeVariantsData', JSON.stringify([]));
                        }
                    } catch (sizeError) {
                        console.error('❌ Error processing size variants:', sizeError);
                        formData.append('sizeVariantsData', JSON.stringify([]));
                    }
                }
                variantProcessingSuccess = true;
            } else {
                console.warn('⚠️ Variant system not available');
                formData.append('hasVariants', 'false');
                formData.append('colorVariantsData', JSON.stringify([]));
                formData.append('sizeVariantsData', JSON.stringify([]));
                variantProcessingSuccess = true; // No variants is still a success case
            }
        } catch (variantError) {
            console.error('❌ Error processing variants:', variantError);
            // Continue submission despite variant errors
            formData.append('hasVariants', 'false');
        }
        console.groupEnd();
        
        // STEP 4: TAGS - DEBUG SECTION
        console.group("🏷️ Product Tags");
        let tagsProcessingSuccess = false;
        
        try {
            // Add tags if the tag input exists
            const tags = getTagsFromInput();
            console.log('Retrieved tags:', tags);
            
            if (tags.length > 0) {
                formData.append('tags', tags.join(','));
                console.log('✅ Added tags:', tags.join(','));
            } else {
                console.log('⚠️ No tags provided');
            }
            tagsProcessingSuccess = true;
        } catch (tagsError) {
            console.error('❌ Error processing tags:', tagsError);
            // Continue submission despite tag errors
        }
        console.groupEnd();
        
        // Validate required fields to make sure we have them
        const requiredFields = ['name', 'price'];
        const missingFields = [];
        
        requiredFields.forEach(field => {
            if (!formData.get(field)) {
                missingFields.push(field);
            }
        });
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Log the complete form data for debugging
        console.group("📤 Final Form Data Being Sent");
        for (let [key, value] of formData.entries()) {
            if (key !== 'images') {
                console.log(`${key}:`, value);
            } else {
                console.log(`${key}:`, `File object (${value.name}, ${value.size} bytes, ${value.type})`);
            }
        }
        console.groupEnd();
        
        // STATUS CHECK BEFORE SUBMISSION
        console.log("⚠️ Component Status Check:", {
            images: imageProcessingSuccess ? "✅ OK" : "❌ Failed",
            variants: variantProcessingSuccess ? "✅ OK" : "❌ Failed",
            tags: tagsProcessingSuccess ? "✅ OK" : "❌ Failed"
        });
        
        // Make the API request to create the product with timeout protection
        console.log('Sending product data to API:', window.API_URL);
        
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Authentication token not found. Please log in again.', 'danger');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            throw new Error('Authentication token not found');
        }
        
        // THE ACTUAL API REQUEST
        console.log("🔄 Starting API request...");
        const fetchPromise = fetch(`${window.API_URL}/products`, {
            method: 'POST',
            body: formData,
            // No need to set Content-Type with FormData, it's set automatically with proper boundary
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Race between the fetch and the timeout
        console.time("API Request Duration");
        
        // Added additional debugging for request progress
        try {
            console.log('⏳ Waiting for API response...');
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            console.timeEnd("API Request Duration");
            
            if (!response) {
                throw new Error('Empty response received');
            }
            
            console.log('✅ Received response from server with status:', response.status);
            
            // Parse the JSON response
            let result;
            try {
                const responseText = await response.text();
                console.log('Raw response:', responseText);
                
                // Try to parse the text as JSON
                try {
                    result = JSON.parse(responseText);
                    console.log('Server response (parsed):', result);
                } catch (jsonParseError) {
                    console.error('Failed to parse response as JSON:', jsonParseError);
                    throw new Error(`Invalid server response format: ${responseText.substring(0, 100)}...`);
                }
            } catch (jsonError) {
                console.error('Failed to process response:', jsonError);
                throw new Error('Error processing server response');
            }
            
            // Check if the request was successful
            if (!response.ok) {
                throw new Error(result?.message || `Server error (${response.status})`);
            }
            
            // Show success notification
            showNotification('Product added successfully!', 'success');
            
            // Reset form and redirect after a short delay
            setTimeout(() => {
                console.log('Redirecting to products page...');
                e.target.reset();
                window.location.href = 'products.html';
            }, 1500);
        } catch (fetchError) {
            console.error('❌ API request failed:', fetchError);
            showNotification('Error: ' + (fetchError.message || 'Failed to save product'), 'danger');
            throw fetchError; // Re-throw to be caught by the outer try-catch
        }
    } catch (error) {
        console.error('❌ PRODUCT SUBMISSION FAILED:', error);
        showNotification('Error: ' + error.message, 'danger');
    } finally {
        // Always restore button state and hide loading regardless of success/failure
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        hideLoading();
        console.groupEnd(); // Close the form debug group
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