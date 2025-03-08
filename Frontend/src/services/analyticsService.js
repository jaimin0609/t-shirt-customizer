/**
 * Analytics Service - Collects and sends user activity data to the server
 * Modern ES module implementation for React/Vue frontend
 */

// Configuration
const ANALYTICS_ENDPOINT = '/api/analytics/track';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds in milliseconds

// Analytics state
let analyticsInitialized = false;
let sessionId = null;
let pageViewId = null;
let sessionStartTime = null;
let lastActivityTime = null;
let currentPath = null;
let heartbeatTimer = null;

/**
 * Initialize analytics tracking
 * Call this from your main app component (App.jsx)
 */
export function initAnalytics() {
    if (analyticsInitialized) return;
    analyticsInitialized = true;
    
    // Set initial path
    currentPath = window.location.pathname;
    
    // Initialize session
    initSession();
    
    // Set up history change listener for SPA navigation
    setupNavigationTracking();
    
    // Track user activity
    setupActivityTracking();
    
    // Track e-commerce events
    trackEcommerceEvents();
    
    return {
        // Expose methods for manual tracking from components
        trackEvent,
        trackPageView: recordPageView,
        trackProductView
    };
}

/**
 * Set up tracking for SPA navigation
 */
function setupNavigationTracking() {
    // For modern frameworks using History API
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        handlePageChange();
    };
    
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        handlePageChange();
    };
    
    window.addEventListener('popstate', handlePageChange);
    
    // Backup for link clicks
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
        
        // Small delay to allow the navigation to occur
        setTimeout(() => {
            if (window.location.pathname !== currentPath) {
                handlePageChange();
            }
        }, 100);
    });
}

/**
 * Set up tracking for user activity
 */
function setupActivityTracking() {
    ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach(eventType => {
        window.addEventListener(eventType, recordActivity, { passive: true });
    });
}

/**
 * Initialize a new analytics session
 */
function initSession() {
    // Try to restore session from storage
    try {
        const storedSessionId = sessionStorage.getItem('analyticsSessionId');
        const storedStartTime = sessionStorage.getItem('analyticsSessionStartTime');
        
        if (storedSessionId && storedStartTime && 
            (Date.now() - parseInt(storedStartTime)) < SESSION_DURATION) {
            // Session exists and is valid
            sessionId = storedSessionId;
            sessionStartTime = parseInt(storedStartTime);
            lastActivityTime = Date.now();
        } else {
            // Create new session
            sessionId = generateId();
            sessionStartTime = Date.now();
            lastActivityTime = sessionStartTime;
            
            sessionStorage.setItem('analyticsSessionId', sessionId);
            sessionStorage.setItem('analyticsSessionStartTime', sessionStartTime.toString());
        }
    } catch (e) {
        // If storage fails, create new session without persistence
        sessionId = generateId();
        sessionStartTime = Date.now();
        lastActivityTime = sessionStartTime;
    }
    
    // Record page view
    recordPageView();
    
    // Start heartbeat
    startHeartbeat();
    
    // Track session end
    window.addEventListener('beforeunload', finishSession);
    
    // Send session start event
    sendData('session_start', {
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language
    });
}

/**
 * Handle page change event
 */
function handlePageChange() {
    const newPath = window.location.pathname;
    if (newPath === currentPath) return;
    
    currentPath = newPath;
    recordPageView();
}

/**
 * Record a page view
 */
function recordPageView() {
    pageViewId = generateId();
    
    sendData('page_view', {
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
        queryParams: window.location.search
    });
}

/**
 * Record user activity
 */
function recordActivity() {
    const now = Date.now();
    
    // If session expired, start a new one
    if (now - lastActivityTime > SESSION_DURATION) {
        finishSession();
        initSession();
        return;
    }
    
    lastActivityTime = now;
}

/**
 * Start heartbeat to track session duration
 */
function startHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    
    heartbeatTimer = setInterval(() => {
        // Check if session expired
        if (Date.now() - lastActivityTime > SESSION_DURATION) {
            finishSession();
            clearInterval(heartbeatTimer);
            return;
        }
        
        // Send heartbeat
        sendData('heartbeat', {
            timeOnPage: Math.floor((Date.now() - sessionStartTime) / 1000)
        });
    }, HEARTBEAT_INTERVAL);
}

/**
 * Finish the current session
 */
function finishSession() {
    if (!sessionId) return;
    
    // Calculate session duration
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    
    // Send session end event
    sendData('session_end', {
        duration: sessionDuration
    });
    
    // Clean up
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    
    try {
        sessionStorage.removeItem('analyticsSessionId');
        sessionStorage.removeItem('analyticsSessionStartTime');
    } catch (e) {
        // Session storage might be unavailable
    }
}

/**
 * Track e-commerce specific events
 */
function trackEcommerceEvents() {
    // Add to cart tracking
    document.addEventListener('click', function(e) {
        const addToCartBtn = e.target.closest('.add-to-cart, [data-action="add-to-cart"]');
        if (!addToCartBtn) return;
        
        const productId = addToCartBtn.dataset.productId || findClosestProductId(addToCartBtn);
        if (!productId) return;
        
        const quantity = addToCartBtn.dataset.quantity || 1;
        const price = addToCartBtn.dataset.price || findProductPrice(addToCartBtn);
        
        trackAddToCart(productId, quantity, price);
    });
    
    // Checkout tracking
    const checkoutForm = document.querySelector('form.checkout-form, [data-form="checkout"]');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function() {
            trackBeginCheckout(findCartTotal());
        });
    }
    
    // Product view tracking
    const productContainer = document.querySelector('.product-detail, [data-type="product"]');
    if (productContainer) {
        const productId = document.querySelector('[data-product-id]')?.dataset.productId;
        if (productId) {
            trackProductView(
                productId, 
                document.querySelector('h1, .product-title')?.textContent.trim()
            );
        }
    }
}

// Public tracking methods that components can use directly

/**
 * Track arbitrary event
 */
export function trackEvent(eventType, eventData = {}) {
    if (!analyticsInitialized) initAnalytics();
    sendData(eventType, eventData);
}

/**
 * Track product view
 */
export function trackProductView(productId, productName) {
    if (!analyticsInitialized) initAnalytics();
    sendData('view_product', { productId, productName });
}

/**
 * Track add to cart
 */
export function trackAddToCart(productId, quantity = 1, price = null) {
    if (!analyticsInitialized) initAnalytics();
    sendData('add_to_cart', { productId, quantity, price });
}

/**
 * Track begin checkout
 */
export function trackBeginCheckout(cartTotal = null) {
    if (!analyticsInitialized) initAnalytics();
    sendData('begin_checkout', { cartTotal });
}

/**
 * Track completed purchase
 */
export function trackPurchase(orderId, revenue, tax = 0, shipping = 0) {
    if (!analyticsInitialized) initAnalytics();
    sendData('purchase', { orderId, revenue, tax, shipping });
}

// Helper functions

/**
 * Helper to find product ID
 */
function findClosestProductId(element) {
    const productContainer = element.closest('[data-product-id], .product-item');
    return productContainer?.dataset.productId;
}

/**
 * Helper to find product price
 */
function findProductPrice(element) {
    const priceElement = element.closest('[data-product-price], .product-item')?.querySelector('.price, [data-price]');
    if (!priceElement) return null;
    
    const priceText = priceElement.dataset.price || priceElement.textContent;
    return parseFloat(priceText.replace(/[^0-9.]/g, '')) || null;
}

/**
 * Helper to find cart total
 */
function findCartTotal() {
    const totalElement = document.querySelector('.cart-total, .order-total, [data-cart-total]');
    if (!totalElement) return null;
    
    const totalText = totalElement.dataset.total || totalElement.textContent;
    return parseFloat(totalText.replace(/[^0-9.]/g, '')) || null;
}

/**
 * Send data to analytics endpoint
 */
function sendData(eventType, eventData = {}) {
    if (!sessionId) return;
    
    const data = {
        sessionId,
        pageViewId,
        timestamp: new Date().toISOString(),
        eventType,
        url: window.location.href,
        ...eventData
    };
    
    // Use sendBeacon for reliable delivery, especially during page unload
    if (navigator.sendBeacon && eventType === 'session_end') {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
        return;
    }
    
    // Fall back to fetch API
    fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        keepalive: true // Ensure request completes even if page unloads
    }).catch(error => {
        console.warn('Analytics: Failed to send data', error);
    });
}

/**
 * Generate a random ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
} 