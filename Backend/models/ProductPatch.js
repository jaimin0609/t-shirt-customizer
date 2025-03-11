// This file adds backward compatibility support for both image and images fields
// as well as fixes for PostgreSQL vs MySQL JSON handling

export default function applyProductPatches(Product) {
    // Save the original toJSON method
    const originalToJSON = Product.prototype.toJSON;
    
    // Override the toJSON method to ensure both image and images are available
    Product.prototype.toJSON = function() {
        // Call the original toJSON method first
        const values = originalToJSON ? originalToJSON.call(this) : { ...this.get() };
        
        // Ensure images is always an array, even if it came from PostgreSQL as a string
        if (values.images) {
            if (typeof values.images === 'string') {
                try {
                    values.images = JSON.parse(values.images);
                } catch (e) {
                    console.warn('Failed to parse images JSON string:', e);
                    values.images = [];
                }
            } else if (!Array.isArray(values.images)) {
                values.images = [];
            }
        } else {
            values.images = [];
        }
        
        // If image exists but images is empty, copy image to images
        if (values.image && values.images.length === 0) {
            values.images = [values.image];
        }
        
        // If images exists but image is empty, set image to the first image
        if (!values.image && values.images.length > 0) {
            values.image = values.images[0];
        }
        
        // Ensure customizationOptions is an array
        if (values.customizationOptions) {
            if (typeof values.customizationOptions === 'string') {
                try {
                    values.customizationOptions = JSON.parse(values.customizationOptions);
                } catch (e) {
                    console.warn('Failed to parse customizationOptions JSON string:', e);
                    values.customizationOptions = [];
                }
            } else if (!Array.isArray(values.customizationOptions)) {
                values.customizationOptions = [];
            }
        } else {
            values.customizationOptions = [];
        }
        
        // Ensure tags is an array
        if (values.tags) {
            if (typeof values.tags === 'string') {
                try {
                    values.tags = JSON.parse(values.tags);
                } catch (e) {
                    console.warn('Failed to parse tags JSON string:', e);
                    values.tags = [];
                }
            } else if (!Array.isArray(values.tags)) {
                values.tags = [];
            }
        } else {
            values.tags = [];
        }
        
        return values;
    };
    
    console.log('Product model patch applied - image/images compatibility added');
    return Product;
}
