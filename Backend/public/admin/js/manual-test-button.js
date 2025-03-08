// Manual script to add a test order button
// Copy and paste this entire script into the browser console

(function() {
    console.log('Manual test order button creation script running');
    
    // Create the button
    const testButton = document.createElement('button');
    testButton.className = 'btn btn-danger';
    testButton.textContent = 'TEST ORDER';
    testButton.id = 'manualTestOrderBtn';
    
    // Style the button to be very visible
    Object.assign(testButton.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '9999',
        padding: '15px 25px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer'
    });
    
    // Define the createTestOrder function inline to ensure it works
    testButton.onclick = async function() {
        console.log('Manual test order button clicked');
        try {
            // Show a toast message if possible
            if (typeof showToast === 'function') {
                showToast('info', 'Creating test order... Please wait.');
            } else {
                alert('Creating test order... Please wait.');
            }
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
            
            // Step 1: Find an existing product
            console.log('Finding an existing product...');
            const productsResponse = await fetch(`/api/products?limit=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!productsResponse.ok) {
                throw new Error('Failed to find existing products');
            }
            
            const products = await productsResponse.json();
            if (!products || products.length === 0) {
                throw new Error('No products found in the system. Please create a product first.');
            }
            
            const product = products[0];
            console.log('Using product:', product);
            
            // Step 2: Add item to cart
            console.log('Adding item to cart...');
            const addItemResponse = await fetch(`/api/cart/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: product.id,
                    quantity: 1,
                    customization: {
                        color: 'Red',
                        size: 'Medium',
                        design: 'Test'
                    }
                })
            });
            
            if (!addItemResponse.ok) {
                const errorText = await addItemResponse.text();
                console.error('Cart error:', errorText);
                throw new Error(`Failed to add item to cart: ${errorText}`);
            }
            
            const cartItem = await addItemResponse.json();
            console.log('Item added to cart:', cartItem);
            
            // Step 3: Create order
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
                total: 59.98,
                subtotal: 49.98,
                shipping: 10.00,
                discount: 0
            };
            
            console.log('Order data:', orderData);
            
            const orderResponse = await fetch(`/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });
            
            if (!orderResponse.ok) {
                const errorText = await orderResponse.text();
                console.error('Order error:', errorText);
                throw new Error(`Failed to create order: ${errorText}`);
            }
            
            const orderResult = await orderResponse.json();
            console.log('Order created successfully:', orderResult);
            
            if (typeof showToast === 'function') {
                showToast('success', 'Test order created successfully!');
            } else {
                alert('Test order created successfully!');
            }
            
            // Reload orders if the function exists
            if (typeof loadOrders === 'function') {
                loadOrders();
            } else {
                console.log('loadOrders function not found - refresh the page to see the new order');
            }
            
        } catch (error) {
            console.error('Error creating test order:', error);
            if (typeof showToast === 'function') {
                showToast('error', error.message);
            } else {
                alert('Error: ' + error.message);
            }
        }
    };
    
    // Add to body
    document.body.appendChild(testButton);
    console.log('Manual test order button added to page');
    
    // Add a message to the page
    const message = document.createElement('div');
    message.textContent = 'Test Order button added';
    message.style.position = 'fixed';
    message.style.bottom = '80px';
    message.style.right = '20px';
    message.style.backgroundColor = 'black';
    message.style.color = 'white';
    message.style.padding = '10px';
    message.style.borderRadius = '5px';
    message.style.zIndex = '9999';
    document.body.appendChild(message);
    
    // Remove the message after 3 seconds
    setTimeout(() => {
        message.remove();
    }, 3000);
})(); 