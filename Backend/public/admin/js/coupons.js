// Coupon Management JavaScript Module
console.log('Loading coupons.js');

// Ensure API_URL is available
if (typeof window.API_URL === 'undefined') {
    console.warn('API_URL not found on window object, using default value');
    window.API_URL = '/api'; // Fallback value
}

// DOM Elements
const couponsTableBody = document.getElementById('couponsTableBody');
const addCouponBtn = document.getElementById('addCouponBtn');
const bulkGenerateBtn = document.getElementById('bulkGenerateBtn');
const saveCouponBtn = document.getElementById('saveCouponBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const regenerateCodeBtn = document.getElementById('regenerateCodeBtn');
const doBulkGenerateBtn = document.getElementById('doBulkGenerateBtn');
const couponForm = document.getElementById('couponForm');
const bulkGenerateForm = document.getElementById('bulkGenerateForm');
const isPublicCheckbox = document.getElementById('isPublic');

// Promotional banner elements
const createPromoBtn = document.getElementById('createPromoBtn');
const savePromoBtn = document.getElementById('savePromoBtn');
const promoForm = document.getElementById('promoForm');
const promoDuration = document.getElementById('promoDuration');
const customDateRange = document.getElementById('customDateRange');
const promoDiscount = document.getElementById('promoDiscount');
const promoMinimum = document.getElementById('promoMinimum');
const promoCodePrefix = document.getElementById('promoCodePrefix');
const promoBannerText = document.getElementById('promoBannerText');
const promoBannerColor = document.getElementById('promoBannerColor');
const bannerPreview = document.getElementById('bannerPreview');
const previewText = document.getElementById('previewText');

// Modals
const couponModal = new bootstrap.Modal(document.getElementById('couponModal'));
const bulkGenerateModal = new bootstrap.Modal(document.getElementById('bulkGenerateModal'));
const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
const promoModal = new bootstrap.Modal(document.getElementById('promoModal'));

// Stats counters
const totalCouponsCount = document.getElementById('totalCouponsCount');
const activeCouponsCount = document.getElementById('activeCouponsCount');
const redeemedCouponsCount = document.getElementById('redeemedCouponsCount');
const expiredCouponsCount = document.getElementById('expiredCouponsCount');

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is authenticated
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }

    // Set up event listeners first
    setupEventListeners();
    setFormDefaults();
    
    try {
        // First load coupons
        await loadCoupons();
        
        // Then load stats (silently handle any errors)
        await loadCouponStats().catch(() => {
            // Stats errors are already handled in the function
            // with fallback to counting from the table
        });
    } catch (err) {
        // Only log critical errors that prevent the page from working
        console.error('Failed to initialize coupon management:', err);
    }
});

// Set up event listeners
function setupEventListeners() {
    // Add coupon button
    addCouponBtn.addEventListener('click', () => {
        resetCouponForm();
        document.getElementById('couponModalLabel').textContent = 'Generate Coupon';
        couponModal.show();
    });
    
    // Create promotional banner button
    createPromoBtn.addEventListener('click', () => {
        resetPromoForm();
        updateBannerPreview();
        promoModal.show();
    });
    
    // Bulk generate button
    bulkGenerateBtn.addEventListener('click', () => {
        resetBulkGenerateForm();
        bulkGenerateModal.show();
    });
    
    // Save coupon button
    saveCouponBtn.addEventListener('click', saveCoupon);
    
    // Save promo button
    savePromoBtn.addEventListener('click', savePromoCoupon);
    
    // Do bulk generate button
    doBulkGenerateBtn.addEventListener('click', bulkGenerateCoupons);
    
    // Confirm delete button
    confirmDeleteBtn.addEventListener('click', function() {
        // Get the coupon ID from the hidden input
        const couponId = document.getElementById('deleteCouponId').value;
        if (couponId) {
            deleteCoupon(couponId);
        } else {
            window.showToast('Failed to delete coupon: No ID provided', 'error');
        }
    });
    
    // Regenerate code button
    regenerateCodeBtn.addEventListener('click', generateCouponCode);
    
    // Toggle public options when isPublic checkbox changes
    isPublicCheckbox.addEventListener('change', function() {
        const publicOptions = document.querySelector('.public-options');
        publicOptions.style.display = this.checked ? 'flex' : 'none';
        
        if (this.checked) {
            updateBannerTextPreview();
        }
    });
    
    // Toggle custom date range when duration changes
    promoDuration.addEventListener('change', function() {
        customDateRange.style.display = this.value === 'custom' ? 'block' : 'none';
        
        // Set default dates if custom is selected
        if (this.value === 'custom') {
            const today = new Date();
            const start = today.toISOString().split('T')[0];
            
            const end = new Date();
            end.setDate(today.getDate() + 14); // Default to 14 days
            document.getElementById('promoStart').value = start;
            document.getElementById('promoEnd').value = end.toISOString().split('T')[0];
        }
    });
    
    // Update banner preview when inputs change
    promoDiscount.addEventListener('input', updateBannerPreview);
    promoMinimum.addEventListener('input', updateBannerPreview);
    promoBannerText.addEventListener('input', updateBannerPreview);
    promoBannerColor.addEventListener('input', updateBannerPreview);
}

// Load coupons from the server
async function loadCoupons() {
    try {
        showLoading();
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/coupons/admin`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        if (!responseData.success) {
            throw new Error(responseData.message || 'Failed to load coupons');
        }
        
        // Get coupons array from the response
        const coupons = responseData.coupons || [];
        
        renderCouponsTable(coupons);
        
        // After rendering coupons, refresh the stats to ensure they're in sync
        loadCouponStats();
    } catch (error) {
        console.error('Error loading coupons:', error);
        couponsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${error.message || 'Error loading coupons'}
                </td>
            </tr>
        `;
    }
}

// Load coupon statistics
async function loadCouponStats() {
    try {
        const token = localStorage.getItem('token');
        
        // First check if the endpoint is available
        try {
            // Create an abort controller with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            // Skip the HEAD request and go directly to the GET request
            const response = await fetch(`${window.API_URL}/coupons/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                signal: controller.signal
            });
            
            // Clear the timeout
            clearTimeout(timeoutId);

            if (!response.ok) {
                // Instead of throwing, just use the fallback
                throw new Error(`Status endpoint returned ${response.status}`);
            }

            const data = await response.json();
            
            // Update counters - check both direct properties and nested statistics
            totalCouponsCount.textContent = data.totalCoupons || data.statistics?.totalCoupons || 0;
            activeCouponsCount.textContent = data.activeCoupons || data.statistics?.activeCoupons || 0;
            redeemedCouponsCount.textContent = data.redeemedCoupons || data.statistics?.redeemedCoupons || 0;
            expiredCouponsCount.textContent = data.expiredCoupons || data.statistics?.expiredCoupons || 0;
            
            return; // Success - exit early
        } catch (apiError) {
            // Don't log the error to console, just silently fall back to counting
            // console.warn(`API stats not available: ${apiError.message}. Using table counts.`);
            // Continue to fallback implementation below
        }
        
        // Fallback: Count from the table data
        const tableRows = document.querySelectorAll('#couponsTable tbody tr:not(.empty-row)');
        const total = tableRows.length;
        
        // Count active coupons
        let active = 0;
        let redeemed = 0;
        let expired = 0;
        
        tableRows.forEach(row => {
            const statusCell = row.querySelector('td:nth-child(4) .badge');
            if (statusCell) {
                const status = statusCell.textContent.trim();
                if (status === 'Active') active++;
                else if (status === 'Redeemed') redeemed++;
                else if (status === 'Expired') expired++;
            }
        });
        
        totalCouponsCount.textContent = total.toString();
        activeCouponsCount.textContent = active.toString();
        redeemedCouponsCount.textContent = redeemed.toString();
        expiredCouponsCount.textContent = expired.toString();
        
    } catch (error) {
        // Even this fallback failed - really just set to zero
        // Don't log to console to avoid error noise
        totalCouponsCount.textContent = '0';
        activeCouponsCount.textContent = '0';
        redeemedCouponsCount.textContent = '0';
        expiredCouponsCount.textContent = '0';
    }
}

// Render coupons in the table
function renderCouponsTable(coupons) {
    // Clear loading state
    couponsTableBody.innerHTML = '';
    
    if (!coupons || !coupons.length) {
        couponsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <p data-translate="noCouponsFound">No coupons found. Create your first coupon.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort coupons by created date (newest first)
    coupons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    coupons.forEach(coupon => {
        const status = getCouponStatus(coupon);
        const statusClass = {
            'Active': 'success',
            'Expired': 'warning',
            'Scheduled': 'primary',
            'Inactive': 'secondary',
            'Redeemed': 'info'
        }[status] || 'secondary';
        
        const discountDisplay = getDiscountDisplay(coupon);
        const dateRange = formatDateRange(coupon.startDate, coupon.endDate);
        const usageDisplay = getUsageDisplay(coupon);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${coupon.code}</strong>
                <div class="small text-muted">${coupon.description || '—'}</div>
            </td>
            <td>${discountDisplay}</td>
            <td>${dateRange}</td>
            <td>
                <span class="badge bg-${statusClass}">${status}</span>
            </td>
            <td>${usageDisplay}</td>
            <td>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item edit-coupon" href="#" data-id="${coupon.id}"><i class="bi bi-pencil me-2"></i> <span data-translate="edit">Edit</span></a></li>
                        <li><a class="dropdown-item delete-coupon" href="#" data-id="${coupon.id}"><i class="bi bi-trash me-2"></i> <span data-translate="delete">Delete</span></a></li>
                    </ul>
                </div>
            </td>
        `;
        
        // Add event listeners for edit and delete actions
        row.querySelector('.edit-coupon').addEventListener('click', (e) => {
            e.preventDefault();
            const couponId = e.target.closest('.edit-coupon').dataset.id;
            editCoupon(couponId);
        });
        
        row.querySelector('.delete-coupon').addEventListener('click', (e) => {
            e.preventDefault();
            // Get the delete button element and extract the coupon ID
            const deleteButton = e.target.closest('.delete-coupon');
            if (!deleteButton) {
                return;
            }
            
            const couponId = deleteButton.dataset.id;
            
            // Set the coupon ID in the hidden input field
            document.getElementById('deleteCouponId').value = couponId;
            
            // Show the confirmation modal
            deleteConfirmModal.show();
        });
        
        couponsTableBody.appendChild(row);
    });
}

// Get coupon status text
function getCouponStatus(coupon) {
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);
    
    if (!coupon.isActive) return 'Inactive';
    if (now < startDate) return 'Scheduled';
    if (now > endDate) return 'Expired';
    
    // Check if coupon is used up
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return 'Redeemed';
    }
    
    // If we get here, the coupon is active: isActive=true, date is between start and end, and not fully used
    return 'Active';
}

// Get discount display text
function getDiscountDisplay(coupon) {
    if (coupon.discountType === 'percentage') {
        return `${coupon.discountValue}% OFF`;
    } else {
        return `$${coupon.discountValue.toFixed(2)} OFF`;
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

// Get usage display html
function getUsageDisplay(coupon) {
    let usageText = '';
    let percentUsed = 0;
    
    if (coupon.usageLimit) {
        usageText = `${coupon.usageCount} / ${coupon.usageLimit}`;
        percentUsed = (coupon.usageCount / coupon.usageLimit) * 100;
    } else {
        usageText = `${coupon.usageCount} / ∞`;
        percentUsed = 0;
    }
    
    return `
        <div class="usage-display">
            <span>${usageText}</span>
            <div class="usage-bar">
                <div class="usage-fill" style="width: ${percentUsed}%"></div>
            </div>
        </div>
    `;
}

// Show loading state
function showLoading() {
    couponsTableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="6" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading coupons...</p>
            </td>
        </tr>
    `;
}

// Reset the coupon form
function resetCouponForm() {
    couponForm.reset();
    document.getElementById('couponId').value = '';
    document.getElementById('isActive').checked = true;
    document.getElementById('isPublic').checked = false;
    
    // Set default dates
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Default 30 days
    
    document.getElementById('startDate').value = today.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    
    // Hide public options
    document.querySelector('.public-options').style.display = 'none';
}

// Reset the bulk generate form
function resetBulkGenerateForm() {
    bulkGenerateForm.reset();
    
    // Set default values
    document.getElementById('bulkCount').value = 5;
    document.getElementById('bulkDiscountValue').value = 10;
    document.getElementById('bulkUsageLimit').value = 1;
    
    // Set default dates
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Default 30 days
    
    document.getElementById('bulkStartDate').value = today.toISOString().split('T')[0];
    document.getElementById('bulkEndDate').value = endDate.toISOString().split('T')[0];
}

// Set form defaults
function setFormDefaults() {
    // Set default dates for individual coupon form
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Default 30 days
    
    document.getElementById('startDate').value = today.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    
    // Set default values for bulk generate form
    document.getElementById('bulkStartDate').value = today.toISOString().split('T')[0];
    document.getElementById('bulkEndDate').value = endDate.toISOString().split('T')[0];
}

// Generate a random coupon code
function generateCouponCode() {
    const prefix = document.getElementById('codePrefix').value;
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = prefix ? `${prefix}-${randomChars}` : randomChars;
    
    document.getElementById('code').value = code;
    
    // Update banner text preview if coupon is public
    if (document.getElementById('isPublic').checked) {
        updateBannerTextPreview();
    }
}

// Update the banner text preview based on code and discount
function updateBannerTextPreview() {
    const code = document.getElementById('code').value;
    const discountValue = document.getElementById('discountValue').value || 0;
    const discountType = document.getElementById('discountType').value;
    
    let bannerText = '';
    
    if (discountType === 'percentage') {
        bannerText = `Use code ${code} for ${discountValue}% off your order!`;
    } else {
        bannerText = `Use code ${code} for $${discountValue} off your order!`;
    }
    
    document.getElementById('bannerText').value = bannerText;
}

// Save coupon
async function saveCoupon() {
    try {
        const couponId = document.getElementById('couponId').value;
        const isEditing = couponId !== '';
        console.log(`Save coupon mode: ${isEditing ? 'EDIT' : 'CREATE'}, ID: ${couponId}`);
        
        // Validate form
        if (!couponForm.checkValidity()) {
            couponForm.reportValidity();
            return;
        }
        
        // Collect form data
        const formData = {
            code: document.getElementById('code').value,
            description: document.getElementById('description').value,
            discountType: document.getElementById('discountType').value,
            discountValue: parseFloat(document.getElementById('discountValue').value),
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            isActive: document.getElementById('isActive').checked,
            usageLimit: document.getElementById('usageLimit').value ? 
                parseInt(document.getElementById('usageLimit').value) : null,
            minimumPurchase: document.getElementById('minimumPurchase').value ? 
                parseFloat(document.getElementById('minimumPurchase').value) : null,
            isPublic: document.getElementById('isPublic').checked,
            bannerText: document.getElementById('bannerText').value,
            bannerColor: document.getElementById('bannerColor').value
        };
        
        console.log('Form data to submit:', formData);
        
        // Add code prefix if not edit mode
        if (!isEditing) {
            formData.codePrefix = document.getElementById('codePrefix').value;
        }
        
        const token = localStorage.getItem('token');
        let url = `${window.API_URL}/coupons`;
        let method = 'POST';
        
        if (isEditing) {
            url = `${window.API_URL}/coupons/${couponId}`;
            method = 'PUT';
        } else {
            // If creating a new coupon, use the generate endpoint
            url = `${window.API_URL}/coupons/generate`;
            method = 'POST';
        }
        
        console.log(`API request: ${method} ${url}`);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error response data:', errorData);
            throw new Error(errorData.message || 'Error saving coupon');
        }
        
        const responseData = await response.json();
        console.log('Success response data:', responseData);
        
        if (!responseData.success) {
            throw new Error(responseData.message || 'Operation failed with no specific error message');
        }
        
        // Close modal
        couponModal.hide();
        
        // Show success message
        window.showToast(isEditing ? 
            'Coupon updated successfully' : 
            'Coupon generated successfully', 'success');
        
        // Reload coupons and stats
        loadCoupons();
        loadCouponStats();
    } catch (error) {
        console.error('Error saving coupon:', error);
        window.showToast(error.message || 'Error saving coupon', 'error');
    }
}

// Edit coupon
async function editCoupon(couponId) {
    try {
        console.log(`Fetching coupon with ID: ${couponId}`);
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/coupons/${couponId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.error(`Error status: ${response.status}`);
            const errorText = await response.text();
            console.error(`Error response: ${errorText}`);
            throw new Error(`Error: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('Received API response:', responseData);
        
        // Extract the coupon from the response
        if (!responseData.success || !responseData.coupon) {
            throw new Error('Invalid response format or coupon not found');
        }
        
        const coupon = responseData.coupon;
        console.log('Coupon data to use:', coupon);
        
        // Format dates properly
        let startDate = '';
        let endDate = '';
        
        try {
            startDate = coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '';
        } catch (e) {
            console.error('Error formatting startDate:', e);
        }
        
        try {
            endDate = coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '';
        } catch (e) {
            console.error('Error formatting endDate:', e);
        }
        
        // Fill form with coupon data
        document.getElementById('couponId').value = coupon.id;
        document.getElementById('code').value = coupon.code;
        document.getElementById('codePrefix').value = coupon.code.includes('-') ? 
            coupon.code.split('-')[0] : '';
        document.getElementById('description').value = coupon.description || '';
        document.getElementById('discountType').value = coupon.discountType;
        document.getElementById('discountValue').value = coupon.discountValue;
        document.getElementById('startDate').value = startDate;
        document.getElementById('endDate').value = endDate;
        document.getElementById('isActive').checked = coupon.isActive;
        document.getElementById('usageLimit').value = coupon.usageLimit || '';
        document.getElementById('minimumPurchase').value = coupon.minimumPurchase || '';
        document.getElementById('isPublic').checked = coupon.isPublic;
        document.getElementById('bannerText').value = coupon.bannerText || '';
        document.getElementById('bannerColor').value = coupon.bannerColor || '#3b82f6';
        
        // Show/hide public options
        document.querySelector('.public-options').style.display = coupon.isPublic ? 'flex' : 'none';
        
        // Update modal title and button text
        document.getElementById('couponModalLabel').textContent = 'Edit Coupon';
        document.getElementById('saveCouponBtn').textContent = 'Update Coupon';
        
        // Show modal
        couponModal.show();
    } catch (error) {
        console.error('Error loading coupon for edit:', error);
        window.showToast('Failed to load coupon details', 'error');
    }
}

// Delete coupon
async function deleteCoupon(couponId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.showToast('Authentication required', 'error');
            return;
        }

        const url = `${window.API_URL}/coupons/${couponId}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }
        
        // Close modal
        deleteConfirmModal.hide();
        
        // Show success message
        window.showToast('Coupon deleted successfully', 'success');
        
        // Reload coupons and stats
        loadCoupons();
        loadCouponStats();
    } catch (error) {
        console.error('Error deleting coupon:', error);
        window.showToast(`Failed to delete coupon: ${error.message}`, 'error');
    }
}

// Bulk generate coupons
async function bulkGenerateCoupons() {
    try {
        // Validate form
        if (!bulkGenerateForm.checkValidity()) {
            bulkGenerateForm.reportValidity();
            return;
        }
        
        // Collect form data
        const formData = {
            count: parseInt(document.getElementById('bulkCount').value),
            codePrefix: document.getElementById('bulkCodePrefix').value,
            description: document.getElementById('bulkDescription').value,
            discountType: document.getElementById('bulkDiscountType').value,
            discountValue: parseFloat(document.getElementById('bulkDiscountValue').value),
            startDate: document.getElementById('bulkStartDate').value,
            endDate: document.getElementById('bulkEndDate').value,
            usageLimit: document.getElementById('bulkUsageLimit').value ? 
                parseInt(document.getElementById('bulkUsageLimit').value) : null,
            minimumPurchase: document.getElementById('bulkMinimumPurchase').value ? 
                parseFloat(document.getElementById('bulkMinimumPurchase').value) : null
        };
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/coupons/bulk-generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error generating coupons');
        }
        
        const responseData = await response.json();
        
        // Close modal
        bulkGenerateModal.hide();
        
        // Show success message
        window.showToast(`Successfully generated ${responseData.coupons.length} coupons`, 'success');
        
        // Reload coupons and stats
        loadCoupons();
        loadCouponStats();
    } catch (error) {
        console.error('Error bulk generating coupons:', error);
        window.showToast(error.message || 'Error generating coupons', 'error');
    }
}

// Save promotional banner coupon
async function savePromoCoupon() {
    try {
        // Validate form
        if (!promoForm.checkValidity()) {
            promoForm.reportValidity();
            return;
        }
        
        // Generate dates based on duration
        const today = new Date();
        let endDate = new Date();
        
        if (promoDuration.value === 'custom') {
            const startInput = document.getElementById('promoStart').value;
            const endInput = document.getElementById('promoEnd').value;
            
            if (!startInput || !endInput) {
                window.showToast('Please select both start and end dates', 'error');
                return;
            }
            
            today.setHours(0, 0, 0, 0);
            endDate = new Date(endInput);
            endDate.setHours(23, 59, 59, 999);
        } else {
            // Add the specified number of days
            const days = parseInt(promoDuration.value);
            endDate.setDate(today.getDate() + days);
            endDate.setHours(23, 59, 59, 999);
        }
        
        // Set banner text to default if empty
        let bannerText = promoBannerText.value;
        if (!bannerText) {
            const discountValue = promoDiscount.value;
            const minimumText = promoMinimum.value > 0 ? ` on orders over $${promoMinimum.value}` : '';
            bannerText = `🎉 Special offer! Use code {code} for ${discountValue}% off${minimumText}!`;
        }
        
        // Prepare form data
        const formData = {
            codePrefix: promoCodePrefix.value,
            description: 'Promotional Banner Coupon',
            discountType: 'percentage',
            discountValue: parseFloat(promoDiscount.value),
            startDate: today.toISOString(),
            endDate: endDate.toISOString(),
            isActive: true,
            usageLimit: 100, // Default to 100 uses
            minimumPurchase: parseFloat(promoMinimum.value) || 0,
            isPublic: true, // Always public for promotional banners
            bannerText: bannerText,
            bannerColor: promoBannerColor.value
        };
        
        console.log('Creating promotional banner coupon:', formData);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/coupons/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error creating promotional banner');
        }
        
        const responseData = await response.json();
        
        if (!responseData.success) {
            throw new Error(responseData.message || 'Operation failed');
        }
        
        // Close modal and show success message
        promoModal.hide();
        
        // Show success message with the actual coupon code
        const couponCode = responseData.code || responseData.data?.code;
        window.showToast(`Promotional banner created with code: ${couponCode}`, 'success');
        
        // Reload coupons and stats
        loadCoupons();
        loadCouponStats();
    } catch (error) {
        console.error('Error creating promotional banner:', error);
        window.showToast(error.message || 'Error creating promotional banner', 'error');
    }
}

// Reset promotional banner form
function resetPromoForm() {
    // Set default values
    promoDiscount.value = 15;
    promoMinimum.value = 0;
    promoDuration.value = '7';
    promoCodePrefix.value = '';
    
    // Generate default banner text
    promoBannerText.value = '🎉 Special offer! Use code {code} for 15% off your order!';
    promoBannerColor.value = '#3366ff';
    
    // Hide custom date range
    customDateRange.style.display = 'none';
    
    // Update preview
    updateBannerPreview();
}

// Update banner preview
function updateBannerPreview() {
    const discount = promoDiscount.value;
    const minimum = parseFloat(promoMinimum.value) || 0;
    const minimumText = minimum > 0 ? ` on orders over $${minimum}` : '';
    
    let text = promoBannerText.value;
    if (!text) {
        text = `🎉 Special offer! Use code {code} for ${discount}% off${minimumText}!`;
        promoBannerText.value = text;
    }
    
    // Replace {code} with a placeholder
    text = text.replace('{code}', 'PROMO123');
    previewText.textContent = text;
    
    // Update preview color
    bannerPreview.style.backgroundColor = promoBannerColor.value;
}

// Add a "Copy" button for a coupon code cell
window.showToast = function(message, type = 'info') {
    // Check if toasts container exists
    let toastsContainer = document.querySelector('.toast-container');
    if (!toastsContainer) {
        toastsContainer = document.createElement('div');
        toastsContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastsContainer);
    }
    
    // Create a unique ID for the toast
    const toastId = 'toast-' + Date.now();
    
    // Determine the icon based on type
    let icon;
    switch (type) {
        case 'success':
            icon = 'bi-check-circle-fill text-success';
            break;
        case 'error':
            icon = 'bi-exclamation-circle-fill text-danger';
            break;
        case 'warning':
            icon = 'bi-exclamation-triangle-fill text-warning';
            break;
        default:
            icon = 'bi-info-circle-fill text-info';
    }
    
    // Create the toast HTML
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i class="bi ${icon} me-2"></i>
                <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <small>Just now</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    // Add the toast to the container
    toastsContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Initialize and show the toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { 
        autohide: true,
        delay: 5000
    });
    toast.show();
};

// Update banner text preview in regular coupon form
function updateBannerTextPreview() {
    const discountType = document.getElementById('discountType').value;
    const discountValue = document.getElementById('discountValue').value;
    const minimumPurchase = document.getElementById('minimumPurchase').value;
    
    let bannerText = document.getElementById('bannerText').value;
    if (!bannerText) {
        const discountDisplay = discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`;
        const minimumText = minimumPurchase > 0 ? ` on orders over $${minimumPurchase}` : '';
        bannerText = `🎉 Use code {code} for ${discountDisplay} off${minimumText}!`;
        document.getElementById('bannerText').value = bannerText;
    }
} 