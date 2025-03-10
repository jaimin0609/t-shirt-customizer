// Product Variant Management System

// Immediately-invoked function expression to avoid polluting global namespace
(function() {
    console.log('Initializing product variant system...');
    
    // Store variants and keep track of counts
    let colorVariants = [];
    let sizeVariants = [];
    let colorVariantCount = 0;
    let sizeVariantCount = 0;
    
    // Flag to check if variants are enabled for this product
    let variantsEnabled = false;
    
    // DOM element references
    const colorVariantsContainer = document.getElementById('colorVariantsContainer');
    const sizeVariantsContainer = document.getElementById('sizeVariantsContainer');
    const variantColorsList = document.getElementById('variantColorsList');
    const variantSizesList = document.getElementById('variantSizesList');
    const variantMatrixTable = document.getElementById('variantMatrixTable');
    const addColorVariantBtn = document.getElementById('addColorVariantBtn');
    const addSizeVariantBtn = document.getElementById('addSizeVariantBtn');
    
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        if (addColorVariantBtn) {
            addColorVariantBtn.addEventListener('click', addColorVariant);
        }
        
        if (addSizeVariantBtn) {
            addSizeVariantBtn.addEventListener('click', addSizeVariant);
        }
        
        // Add one initial variant of each type for better UX
        setTimeout(() => {
            addColorVariant();
            addSizeVariant();
        }, 500);
    });
    
    /**
     * Add a new color variant to the product
     */
    function addColorVariant() {
        if (!colorVariantsContainer) return;
        
        colorVariantCount++;
        const variantId = `color-variant-${colorVariantCount}`;
        const colorCode = generateRandomColor();
        
        const newVariant = {
            id: colorVariantCount,
            color: `Color ${colorVariantCount}`,
            colorCode: colorCode,
            stock: 10,
            priceAdjustment: 0
        };
        colorVariants.push(newVariant);
        
        // Create the UI element
        const variantHtml = `
            <div id="${variantId}" class="card mb-3 variant-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0">Color Variant #${colorVariantCount}</h6>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.variantSystem.removeColorVariant(${colorVariantCount})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="colorName-${colorVariantCount}" class="form-label">Color Name</label>
                            <input type="text" class="form-control color-name-input" id="colorName-${colorVariantCount}" 
                                value="${newVariant.color}" 
                                onchange="window.variantSystem.updateColorVariant(${colorVariantCount}, 'color', this.value)">
                        </div>
                        
                        <div class="col-md-6">
                            <label for="colorCode-${colorVariantCount}" class="form-label">Color Code</label>
                            <div class="input-group">
                                <input type="color" class="form-control form-control-color color-code-input" id="colorCode-${colorVariantCount}" 
                                    value="${colorCode}"
                                    onchange="window.variantSystem.updateColorVariant(${colorVariantCount}, 'colorCode', this.value)">
                                <span class="input-group-text color-preview" id="colorPreview-${colorVariantCount}" 
                                    style="background-color: ${colorCode}; width: 40px;"></span>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <label for="colorStock-${colorVariantCount}" class="form-label">Stock</label>
                            <input type="number" class="form-control color-stock-input" id="colorStock-${colorVariantCount}" 
                                value="${newVariant.stock}" min="0"
                                onchange="window.variantSystem.updateColorVariant(${colorVariantCount}, 'stock', this.value)">
                        </div>
                        
                        <div class="col-md-6">
                            <label for="colorPriceAdj-${colorVariantCount}" class="form-label">Price Adjustment ($)</label>
                            <input type="number" class="form-control color-price-input" id="colorPriceAdj-${colorVariantCount}" 
                                value="${newVariant.priceAdjustment}" step="0.01"
                                onchange="window.variantSystem.updateColorVariant(${colorVariantCount}, 'priceAdjustment', this.value)">
                        </div>
                        
                        <div class="col-12">
                            <label for="colorImage-${colorVariantCount}" class="form-label">Variant Image</label>
                            <input type="file" class="form-control color-image-input" id="colorImage-${colorVariantCount}" accept="image/*">
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        colorVariantsContainer.insertAdjacentHTML('beforeend', variantHtml);
        updateColorsList();
        updateVariantMatrix();
        
        // Enable variants since we now have at least one
        variantsEnabled = true;
    }
    
    /**
     * Add a new size variant to the product
     */
    function addSizeVariant() {
        if (!sizeVariantsContainer) return;
        
        sizeVariantCount++;
        const variantId = `size-variant-${sizeVariantCount}`;
        const defaultSizes = ['S', 'M', 'L', 'XL', '2XL'];
        const defaultSize = defaultSizes[(sizeVariantCount - 1) % defaultSizes.length];
        
        const newVariant = {
            id: sizeVariantCount,
            size: defaultSize,
            stock: 10,
            priceAdjustment: 0
        };
        sizeVariants.push(newVariant);
        
        // Create the UI element
        const variantHtml = `
            <div id="${variantId}" class="card mb-3 variant-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0">Size Variant #${sizeVariantCount}</h6>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.variantSystem.removeSizeVariant(${sizeVariantCount})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="sizeName-${sizeVariantCount}" class="form-label">Size</label>
                            <input type="text" class="form-control size-name-input" id="sizeName-${sizeVariantCount}" 
                                value="${newVariant.size}" 
                                onchange="window.variantSystem.updateSizeVariant(${sizeVariantCount}, 'size', this.value)">
                        </div>
                        
                        <div class="col-md-6">
                            <label for="sizeStock-${sizeVariantCount}" class="form-label">Stock</label>
                            <input type="number" class="form-control size-stock-input" id="sizeStock-${sizeVariantCount}" 
                                value="${newVariant.stock}" min="0"
                                onchange="window.variantSystem.updateSizeVariant(${sizeVariantCount}, 'stock', this.value)">
                        </div>
                        
                        <div class="col-md-6">
                            <label for="sizePriceAdj-${sizeVariantCount}" class="form-label">Price Adjustment ($)</label>
                            <input type="number" class="form-control size-price-input" id="sizePriceAdj-${sizeVariantCount}" 
                                value="${newVariant.priceAdjustment}" step="0.01"
                                onchange="window.variantSystem.updateSizeVariant(${sizeVariantCount}, 'priceAdjustment', this.value)">
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        sizeVariantsContainer.insertAdjacentHTML('beforeend', variantHtml);
        updateSizesList();
        updateVariantMatrix();
        
        // Enable variants since we now have at least one
        variantsEnabled = true;
    }
    
    /**
     * Remove a color variant
     */
    function removeColorVariant(variantId) {
        const elementId = `color-variant-${variantId}`;
        const element = document.getElementById(elementId);
        
        if (element) {
            element.remove();
            
            // Remove from the array
            colorVariants = colorVariants.filter(v => v.id !== variantId);
            
            // Update lists and matrix
            updateColorsList();
            updateVariantMatrix();
            
            // Check if we still have variants
            checkVariantsExist();
        }
    }
    
    /**
     * Remove a size variant
     */
    function removeSizeVariant(variantId) {
        const elementId = `size-variant-${variantId}`;
        const element = document.getElementById(elementId);
        
        if (element) {
            element.remove();
            
            // Remove from the array
            sizeVariants = sizeVariants.filter(v => v.id !== variantId);
            
            // Update lists and matrix
            updateSizesList();
            updateVariantMatrix();
            
            // Check if we still have variants
            checkVariantsExist();
        }
    }
    
    /**
     * Update color variant properties
     */
    function updateColorVariant(variantId, property, value) {
        const variant = colorVariants.find(v => v.id === variantId);
        
        if (variant) {
            variant[property] = value;
            
            // If updating color code, update preview
            if (property === 'colorCode') {
                const preview = document.getElementById(`colorPreview-${variantId}`);
                if (preview) {
                    preview.style.backgroundColor = value;
                }
            }
            
            // Update variant lists and matrix
            updateColorsList();
            updateVariantMatrix();
        }
    }
    
    /**
     * Update size variant properties
     */
    function updateSizeVariant(variantId, property, value) {
        const variant = sizeVariants.find(v => v.id === variantId);
        
        if (variant) {
            variant[property] = value;
            
            // Update variant lists and matrix
            updateSizesList();
            updateVariantMatrix();
        }
    }
    
    /**
     * Update the colors list display
     */
    function updateColorsList() {
        if (!variantColorsList) return;
        
        if (colorVariants.length === 0) {
            variantColorsList.innerHTML = '<p class="text-muted">No color variants defined.</p>';
            return;
        }
        
        let html = '<div class="d-flex flex-wrap gap-2">';
        
        colorVariants.forEach(variant => {
            html += `
                <div class="color-badge d-flex align-items-center">
                    <span class="color-preview me-1" style="display: inline-block; width: 20px; height: 20px; border-radius: 4px; background-color: ${variant.colorCode};"></span>
                    <span>${variant.color}</span>
                </div>
            `;
        });
        
        html += '</div>';
        variantColorsList.innerHTML = html;
    }
    
    /**
     * Update the sizes list display
     */
    function updateSizesList() {
        if (!variantSizesList) return;
        
        if (sizeVariants.length === 0) {
            variantSizesList.innerHTML = '<p class="text-muted">No size variants defined.</p>';
            return;
        }
        
        let html = '<div class="d-flex flex-wrap gap-2">';
        
        sizeVariants.forEach(variant => {
            html += `
                <div class="size-badge">
                    <span class="badge bg-secondary">${variant.size}</span>
                </div>
            `;
        });
        
        html += '</div>';
        variantSizesList.innerHTML = html;
    }
    
    /**
     * Update the variant matrix
     */
    function updateVariantMatrix() {
        if (!variantMatrixTable) return;
        
        // If we don't have both color and size variants, display a message
        if (colorVariants.length === 0 || sizeVariants.length === 0) {
            variantMatrixTable.innerHTML = '<p class="text-muted">Add at least one color and one size to generate the variant matrix.</p>';
            return;
        }
        
        // Create table header
        let tableHtml = '<thead><tr><th>Color / Size</th>';
        
        // Add size columns
        sizeVariants.forEach(size => {
            tableHtml += `<th>${size.size}</th>`;
        });
        
        tableHtml += '</tr></thead><tbody>';
        
        // Add rows for each color
        colorVariants.forEach(color => {
            tableHtml += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="color-preview me-2" style="display: inline-block; width: 20px; height: 20px; border-radius: 4px; background-color: ${color.colorCode};"></span>
                            <span>${color.color}</span>
                        </div>
                    </td>
            `;
            
            // Add cells for each size
            sizeVariants.forEach(size => {
                const matrixId = `matrix-${color.id}-${size.id}`;
                tableHtml += `
                    <td>
                        <input type="number" class="form-control matrix-stock" 
                            id="${matrixId}" value="${color.stock}" min="0"
                            onchange="window.variantSystem.updateMatrixStock(${color.id}, ${size.id}, this.value)">
                    </td>
                `;
            });
            
            tableHtml += '</tr>';
        });
        
        tableHtml += '</tbody>';
        variantMatrixTable.innerHTML = tableHtml;
    }
    
    /**
     * Update stock for a color-size combination in the matrix
     */
    function updateMatrixStock(colorId, sizeId, value) {
        console.log(`Updating matrix stock: Color ${colorId}, Size ${sizeId}, Value ${value}`);
        // In a more complex implementation, you might want to store these values
        // for now, we're just logging the change
    }
    
    /**
     * Check if any variants exist and update the flag
     */
    function checkVariantsExist() {
        variantsEnabled = colorVariants.length > 0 || sizeVariants.length > 0;
    }
    
    /**
     * Generate a random color for new color variants
     */
    function generateRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    
    /**
     * Get all color variants for form submission
     */
    function getColorVariants() {
        return colorVariants;
    }
    
    /**
     * Get all size variants for form submission
     */
    function getSizeVariants() {
        return sizeVariants;
    }
    
    /**
     * Check if variants are enabled for this product
     */
    function areVariantsEnabled() {
        return variantsEnabled;
    }
    
    // Expose the API to the global scope
    window.variantSystem = {
        addColorVariant,
        addSizeVariant,
        removeColorVariant,
        removeSizeVariant,
        updateColorVariant,
        updateSizeVariant,
        updateMatrixStock,
        getColorVariants,
        getSizeVariants,
        areVariantsEnabled
    };
    
    console.log('Product variant system initialized.');
})();
