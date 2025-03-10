// This file patches the Product model to handle legacy 'image' field
// It ensures that 'images' is always populated even for older products
// that only have the 'image' field

export function applyProductModelPatch(Product) {
    // Store the original toJSON method
    const originalToJSON = Product.prototype.toJSON;
    
    // Override toJSON to handle image/images compatibility
    Product.prototype.toJSON = function() {
        // Call the original method to get the base values
        const values = originalToJSON ? originalToJSON.call(this) : {...this.get()};
        
        // Ensure images is always an array
        if (!values.images) {
            values.images = [];
        }
        
        // If images array is empty but image exists, use image
        if (values.images.length === 0 && values.image) {
            values.images = [values.image];
        }
        
        return values;
    };
    
    console.log('Product model patch applied - image/images compatibility added');
} 