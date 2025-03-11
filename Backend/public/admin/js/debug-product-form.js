// Debug script for product form submission
console.log('Debug script loaded for product form submission');

// Store original fetch
const originalFetch = window.fetch;

// Override fetch to log all requests and responses
window.fetch = async function(url, options) {
    // Log request
    console.log(`%c[FETCH REQUEST] ${options?.method || 'GET'} ${url}`, 'background: #f0f0f0; color: #0000ff; font-weight: bold;');
    if (options) {
        console.log('Options:', {...options, body: options.body instanceof FormData ? 'FormData (see below)' : options.body});
        
        // Log FormData contents if present
        if (options.body instanceof FormData) {
            console.log('FormData contents:');
            for (const pair of options.body.entries()) {
                if (pair[0] === 'images' || pair[0].includes('image')) {
                    console.log(`  ${pair[0]}: [File object]`);
                } else {
                    console.log(`  ${pair[0]}: ${pair[1]}`);
                }
            }
        }
    }
    
    try {
        // Start timer
        const startTime = performance.now();
        
        // Make the actual request
        const response = await originalFetch(url, options);
        
        // End timer
        const duration = (performance.now() - startTime).toFixed(2);
        
        // Clone the response so we can read its body
        const responseClone = response.clone();
        
        // Log response
        console.log(`%c[FETCH RESPONSE] ${response.status} ${response.statusText} (${duration}ms)`, 
                   response.ok ? 'background: #f0fff0; color: #006400; font-weight: bold;' : 
                                'background: #fff0f0; color: #8b0000; font-weight: bold;');
        console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
        
        // Try to parse response as JSON
        try {
            const data = await responseClone.json();
            console.log('Response body:', data);
        } catch (e) {
            // If not JSON, try to get the text
            try {
                const text = await responseClone.text();
                if (text) {
                    console.log('Response text:', text.length > 1000 ? text.substring(0, 1000) + '...' : text);
                } else {
                    console.log('Empty response body');
                }
            } catch (textError) {
                console.log('Could not read response body');
            }
        }
        
        return response;
    } catch (error) {
        // Log errors
        console.error(`%c[FETCH ERROR] ${error.message}`, 'background: #8b0000; color: white; font-weight: bold;');
        console.error(error);
        throw error;
    }
};

// Monitor form submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addProductForm');
    if (form) {
        console.log('Found product form, attaching debug interceptor');
        
        // Monitor loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            // Create a monitoring interval
            setInterval(() => {
                if (loadingOverlay.style.display === 'block' || 
                    loadingOverlay.style.display === '') {
                    console.log('Loading overlay is visible for', 
                                Math.round((Date.now() - window._debugLoadingStartTime) / 1000), 
                                'seconds');
                }
            }, 3000);
            
            // Override loading functions
            if (typeof showLoading === 'function') {
                const originalShowLoading = window.showLoading;
                window.showLoading = function() {
                    console.log('%c[LOADING] showLoading() called', 'background: #fffacd; color: #8b4513;');
                    window._debugLoadingStartTime = Date.now();
                    return originalShowLoading.apply(this, arguments);
                };
            }
            
            if (typeof hideLoading === 'function') {
                const originalHideLoading = window.hideLoading;
                window.hideLoading = function() {
                    console.log('%c[LOADING] hideLoading() called after', 
                                Math.round((Date.now() - (window._debugLoadingStartTime || Date.now())) / 1000),
                                'seconds', 
                                'background: #fffacd; color: #228b22;');
                    return originalHideLoading.apply(this, arguments);
                };
            }
        }
        
        // Log all form data when submitted
        form.addEventListener('submit', function(e) {
            console.log('%c[FORM SUBMIT] Product form submitted', 'background: #e6e6fa; color: #4b0082; font-weight: bold;');
            
            // Log all form values
            const formData = new FormData(form);
            console.log('Form data:');
            for (const pair of formData.entries()) {
                if (pair[0] === 'images' || pair[0].includes('image')) {
                    console.log(`  ${pair[0]}: [File object]`, pair[1]);
                } else {
                    console.log(`  ${pair[0]}: ${pair[1]}`);
                }
            }
        }, true); // Use capturing to catch event before normal handlers
    } else {
        console.warn('Product form not found for debug monitoring');
    }
});

console.log('Product form debug script initialized. Check console for detailed logs during form submission.'); 