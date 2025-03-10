import React, { useState, useEffect, useRef } from 'react';
import { productService } from '../../services/productService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const ProductManagement = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        gender: '',
        ageGroup: '',
        isCustomizable: true,
        isFeatured: false,
        availableSizes: ["S", "M", "L", "XL"],
        availableColors: ["black", "white", "gray"],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    // State for filter options from backend
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [genderOptions, setGenderOptions] = useState([]);
    const [ageGroupOptions, setAgeGroupOptions] = useState([]);

    // Get the image URL, handling both backend and frontend image paths
    const getImageUrl = (imagePath) => {
        if (!imagePath) return '/assets/placeholder-product.jpg';

        // If it's a Cloudinary URL, return it as is
        if (imagePath.includes('cloudinary.com')) {
            return imagePath;
        }

        // If it's a backend image path (starts with /uploads)
        if (imagePath.startsWith('/uploads')) {
            return `http://localhost:5002${imagePath}`;
        }

        // Otherwise, use the path as is (for frontend static images)
        return imagePath;
    };

    // Fetch products on component mount
    useEffect(() => {
        fetchProducts();
    }, []);

    // Fetch filter options from backend
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                // Fetch categories
                try {
                    const categories = await productService.getCategories();
                    if (categories && categories.length > 0) {
                        setCategoryOptions(categories);
                    } else {
                        // Fallback to default categories
                        setCategoryOptions([
                            { id: 't-shirt', name: 'T-Shirt' },
                            { id: 'hoodie', name: 'Hoodie' },
                            { id: 'sweatshirt', name: 'Sweatshirt' }
                        ]);
                    }
                } catch (catError) {
                    console.error('Failed to fetch categories, using defaults:', catError);
                    // Use default categories if fetch fails
                    setCategoryOptions([
                        { id: 't-shirt', name: 'T-Shirt' },
                        { id: 'hoodie', name: 'Hoodie' },
                        { id: 'sweatshirt', name: 'Sweatshirt' }
                    ]);
                }

                // Fetch genders
                try {
                    const genders = await productService.getGenders();
                    if (genders && genders.length > 0) {
                        setGenderOptions(genders);
                    } else {
                        // Fallback to default genders
                        setGenderOptions([
                            { id: 'men', name: 'Men' },
                            { id: 'women', name: 'Women' },
                            { id: 'unisex', name: 'Unisex' }
                        ]);
                    }
                } catch (genderError) {
                    console.error('Failed to fetch genders, using defaults:', genderError);
                    // Use default genders if fetch fails
                    setGenderOptions([
                        { id: 'men', name: 'Men' },
                        { id: 'women', name: 'Women' },
                        { id: 'unisex', name: 'Unisex' }
                    ]);
                }

                // Fetch age groups
                try {
                    const ageGroups = await productService.getAgeGroups();
                    if (ageGroups && ageGroups.length > 0) {
                        setAgeGroupOptions(ageGroups);
                    } else {
                        // Fallback to default age groups
                        setAgeGroupOptions([
                            { id: 'adult', name: 'Adult' },
                            { id: 'kids', name: 'Kids' },
                            { id: 'youth', name: 'Youth' }
                        ]);
                    }
                } catch (ageError) {
                    console.error('Failed to fetch age groups, using defaults:', ageError);
                    // Use default age groups if fetch fails
                    setAgeGroupOptions([
                        { id: 'adult', name: 'Adult' },
                        { id: 'kids', name: 'Kids' },
                        { id: 'youth', name: 'Youth' }
                    ]);
                }
            } catch (error) {
                console.error('Error fetching filter options:', error);
                // Continue using default data if error
            }
        };

        fetchFilterOptions();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await productService.getAllProducts();
            setProducts(data);
            setError(null);
        } catch (err) {
            setError('Failed to load products. Please try again later.');
            toast.error('Failed to load products');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            // Edit mode
            setSelectedProduct(product);
            setFormData({
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category,
                gender: product.gender,
                ageGroup: product.ageGroup,
                isCustomizable: product.isCustomizable || true,
                isFeatured: product.isFeatured || false,
                availableSizes: product.availableSizes || ["S", "M", "L", "XL"],
                availableColors: product.availableColors || ["black", "white", "gray"],
            });
        } else {
            // Add mode
            setSelectedProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                gender: '',
                ageGroup: '',
                isCustomizable: true,
                isFeatured: false,
                availableSizes: ["S", "M", "L", "XL"],
                availableColors: ["black", "white", "gray"],
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Create FormData object for file uploads
            const productFormData = new FormData();

            // Add all form fields to FormData
            Object.keys(formData).forEach(key => {
                productFormData.append(key, formData[key]);
            });

            // Add files if they exist
            if (fileInputRef.current && fileInputRef.current.files.length > 0) {
                for (let i = 0; i < fileInputRef.current.files.length; i++) {
                    productFormData.append('images', fileInputRef.current.files[i]);
                }
            }

            let result;
            if (selectedProduct) {
                // Update existing product
                result = await productService.updateProduct(selectedProduct.id, productFormData);
                toast.success('Product updated successfully!');

                // Update the product in the local state
                setProducts(products.map(p =>
                    p.id === selectedProduct.id ? result : p
                ));
            } else {
                // Create new product
                result = await productService.createProduct(productFormData);
                toast.success('Product created successfully!');

                // Add the new product to the local state
                setProducts([...products, result]);
            }

            handleCloseModal();
        } catch (err) {
            toast.error(err.message || 'An error occurred while saving the product');
            console.error('Error saving product:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                setLoading(true);
                await productService.deleteProduct(productId);

                // Remove the product from the local state
                setProducts(products.filter(p => p.id !== productId));

                toast.success('Product deleted successfully!');
            } catch (err) {
                toast.error(err.message || 'An error occurred while deleting the product');
                console.error('Error deleting product:', err);
            } finally {
                setLoading(false);
            }
        }
    };

    if (!user || user.role !== 'admin') {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                    Access Denied
                </h1>
                <p className="text-gray-600">
                    You do not have permission to access this page.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Product Management
                </h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    Add New Product
                </button>
            </div>

            {loading && !isSubmitting ? (
                <div className="text-center py-4">
                    <p className="text-gray-600">Loading products...</p>
                </div>
            ) : error ? (
                <div className="text-center py-4">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={fetchProducts}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    {products.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600">No products found. Add your first product!</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Image
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <img
                                                src={getImageUrl(product.mainImage || product.image || product.images?.[0])}
                                                alt={product.name}
                                                className="h-10 w-10 rounded-full object-cover"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {product.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                ${parseFloat(product.price).toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {product.category}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenModal(product)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Product Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                {selectedProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Price
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categoryOptions.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        {genderOptions.map(gender => (
                                            <option key={gender.id} value={gender.id}>
                                                {gender.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Age Group
                                    </label>
                                    <select
                                        name="ageGroup"
                                        value={formData.ageGroup}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    >
                                        <option value="">Select Age Group</option>
                                        {ageGroupOptions.map(ageGroup => (
                                            <option key={ageGroup.id} value={ageGroup.id}>
                                                {ageGroup.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="isCustomizable"
                                            checked={formData.isCustomizable}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">
                                            Customizable
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="isFeatured"
                                            checked={formData.isFeatured}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 text-sm text-gray-700">
                                            Featured
                                        </label>
                                    </div>
                                </div>

                                {/* Sizes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Available Sizes
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.availableSizes && formData.availableSizes.map((size, index) => (
                                            <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center">
                                                <span>{size}</span>
                                                <button
                                                    type="button"
                                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                                    onClick={() => {
                                                        const newSizes = [...formData.availableSizes];
                                                        newSizes.splice(index, 1);
                                                        setFormData({ ...formData, availableSizes: newSizes });
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            id="newSize"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-l-md"
                                            placeholder="Add size (e.g. S, M, L, XL)"
                                        />
                                        <button
                                            type="button"
                                            className="bg-blue-600 text-white px-3 py-2 rounded-r-md"
                                            onClick={() => {
                                                const newSize = document.getElementById('newSize').value.trim();
                                                if (newSize && !formData.availableSizes.includes(newSize)) {
                                                    setFormData({
                                                        ...formData,
                                                        availableSizes: [...formData.availableSizes, newSize]
                                                    });
                                                    document.getElementById('newSize').value = '';
                                                }
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Colors */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Available Colors
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.availableColors && formData.availableColors.map((color, index) => (
                                            <div key={index} className="bg-gray-100 px-2 py-1 rounded flex items-center">
                                                <div
                                                    className="w-4 h-4 rounded-full mr-1"
                                                    style={{ backgroundColor: color }}
                                                ></div>
                                                <span>{color}</span>
                                                <button
                                                    type="button"
                                                    className="ml-1 text-gray-600 hover:text-gray-800"
                                                    onClick={() => {
                                                        const newColors = [...formData.availableColors];
                                                        newColors.splice(index, 1);
                                                        setFormData({ ...formData, availableColors: newColors });
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            id="newColor"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-l-md"
                                            placeholder="Add color (e.g. black, white, red)"
                                        />
                                        <button
                                            type="button"
                                            className="bg-blue-600 text-white px-3 py-2 rounded-r-md"
                                            onClick={() => {
                                                const newColor = document.getElementById('newColor').value.trim();
                                                if (newColor && !formData.availableColors.includes(newColor)) {
                                                    setFormData({
                                                        ...formData,
                                                        availableColors: [...formData.availableColors, newColor]
                                                    });
                                                    document.getElementById('newColor').value = '';
                                                }
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Images
                                </label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    multiple
                                    accept="image/*"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    You can select multiple images. The first image will be used as the main product image.
                                </p>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : selectedProduct ? 'Update Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;