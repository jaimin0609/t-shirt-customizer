import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL;

const PromotionManagement = () => {
    const { user } = useAuth();
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPromotionId, setSelectedPromotionId] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        startDate: '',
        endDate: '',
        isActive: false,
        promotionType: 'store_wide',
        applicableCategories: [],
        applicableProducts: [],
        minimumPurchase: '',
        usageLimit: '',
        priority: '0',
        highlightColor: '#FF5722'
    });

    useEffect(() => {
        fetchPromotions();
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchPromotions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('Authentication required');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/promotions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch promotions');
            }

            const data = await response.json();
            setPromotions(data);
        } catch (error) {
            console.error('Error fetching promotions:', error);
            toast.error('Failed to load promotions');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_URL}/products`);

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/products/categories/all`);

            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        }
    };

    const openAddModal = () => {
        setSelectedPromotionId(null);
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = async (promotionId) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('Authentication required');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/promotions/${promotionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch promotion details');
            }

            const promotion = await response.json();
            setSelectedPromotionId(promotionId);

            // Format dates for the form
            const startDate = new Date(promotion.startDate);
            const endDate = new Date(promotion.endDate);

            setFormData({
                name: promotion.name,
                description: promotion.description || '',
                discountType: promotion.discountType,
                discountValue: promotion.discountValue.toString(),
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                isActive: promotion.isActive,
                promotionType: promotion.promotionType,
                applicableCategories: promotion.applicableCategories || [],
                applicableProducts: promotion.applicableProducts || [],
                minimumPurchase: promotion.minimumPurchase ? promotion.minimumPurchase.toString() : '',
                usageLimit: promotion.usageLimit ? promotion.usageLimit.toString() : '',
                priority: promotion.priority.toString(),
                highlightColor: promotion.highlightColor || '#FF5722'
            });

            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching promotion details:', error);
            toast.error('Failed to load promotion details');
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            discountType: 'percentage',
            discountValue: '',
            startDate: '',
            endDate: '',
            isActive: false,
            promotionType: 'store_wide',
            applicableCategories: [],
            applicableProducts: [],
            minimumPurchase: '',
            usageLimit: '',
            priority: '0',
            highlightColor: '#FF5722'
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleMultiSelect = (e, field) => {
        const options = Array.from(e.target.selectedOptions, option => option.value);
        setFormData({
            ...formData,
            [field]: options
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('Authentication required');
                setIsSubmitting(false);
                return;
            }

            // Prepare form data for submission
            const promotionData = new FormData();

            // Add all form fields
            for (const key in formData) {
                if (key === 'applicableCategories' || key === 'applicableProducts') {
                    if (formData[key].length > 0) {
                        promotionData.append(key, JSON.stringify(formData[key]));
                    }
                } else {
                    promotionData.append(key, formData[key]);
                }
            }

            // Determine if this is a create or update operation
            const method = selectedPromotionId ? 'PUT' : 'POST';
            const url = selectedPromotionId
                ? `${API_URL}/promotions/${selectedPromotionId}`
                : `${API_URL}/promotions`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: promotionData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save promotion');
            }

            toast.success(selectedPromotionId ? 'Promotion updated successfully' : 'Promotion created successfully');

            // Refresh the promotions list
            fetchPromotions();

            // Close the modal
            closeModal();
        } catch (error) {
            console.error('Error saving promotion:', error);
            toast.error(error.message || 'Failed to save promotion');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePromotion = async (promotionId) => {
        if (!confirm('Are you sure you want to delete this promotion? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('Authentication required');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/promotions/${promotionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete promotion');
            }

            toast.success('Promotion deleted successfully');

            // Refresh the promotions list
            fetchPromotions();
        } catch (error) {
            console.error('Error deleting promotion:', error);
            toast.error('Failed to delete promotion');
        } finally {
            setLoading(false);
        }
    };

    const checkPromotionStatus = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('Authentication required');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/promotions/check-status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to update promotion statuses');
            }

            toast.success('Promotion statuses updated successfully');

            // Refresh the promotions list
            fetchPromotions();
        } catch (error) {
            console.error('Error checking promotion statuses:', error);
            toast.error('Failed to update promotion statuses');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Promotion Management</h1>
                <div className="flex space-x-4">
                    <button
                        onClick={checkPromotionStatus}
                        className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition"
                        disabled={loading}
                    >
                        Update Promotion Status
                    </button>
                    <button
                        onClick={openAddModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                        disabled={loading}
                    >
                        Add New Promotion
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="mt-2">Loading promotions...</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Discount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dates
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {promotions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                        No promotions found. Create a new promotion to get started.
                                    </td>
                                </tr>
                            ) : (
                                promotions.map((promotion) => (
                                    <tr key={promotion.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {promotion.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {promotion.description?.substring(0, 50) || ''}
                                                {promotion.description?.length > 50 ? '...' : ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {promotion.promotionType.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {promotion.discountType === 'percentage'
                                                ? `${promotion.discountValue}%`
                                                : `$${parseFloat(promotion.discountValue).toFixed(2)}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>
                                                Start: {formatDate(promotion.startDate)}
                                            </div>
                                            <div>
                                                End: {formatDate(promotion.endDate)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${promotion.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {promotion.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openEditModal(promotion.id)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeletePromotion(promotion.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                {selectedPromotionId ? 'Edit Promotion' : 'Add New Promotion'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Promotion Name
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
                                        Promotion Type
                                    </label>
                                    <select
                                        name="promotionType"
                                        value={formData.promotionType}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    >
                                        <option value="store_wide">Store Wide</option>
                                        <option value="category">Category Specific</option>
                                        <option value="product_specific">Product Specific</option>
                                        <option value="clearance">Clearance</option>
                                    </select>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    rows="3"
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Discount Type
                                    </label>
                                    <select
                                        name="discountType"
                                        value={formData.discountType}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed_amount">Fixed Amount ($)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Discount Value
                                    </label>
                                    <input
                                        type="number"
                                        name="discountValue"
                                        value={formData.discountValue}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        step={formData.discountType === 'percentage' ? '1' : '0.01'}
                                        min="0"
                                        max={formData.discountType === 'percentage' ? '100' : ''}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priority (Higher = More Important)
                                    </label>
                                    <input
                                        type="number"
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Highlight Color
                                    </label>
                                    <input
                                        type="color"
                                        name="highlightColor"
                                        value={formData.highlightColor}
                                        onChange={handleInputChange}
                                        className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Minimum Purchase Amount ($)
                                    </label>
                                    <input
                                        type="number"
                                        name="minimumPurchase"
                                        value={formData.minimumPurchase}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Usage Limit (0 = unlimited)
                                    </label>
                                    <input
                                        type="number"
                                        name="usageLimit"
                                        value={formData.usageLimit}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {formData.promotionType === 'category' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Applicable Categories (hold Ctrl/Cmd to select multiple)
                                    </label>
                                    <select
                                        multiple
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md h-32"
                                        onChange={(e) => handleMultiSelect(e, 'applicableCategories')}
                                        value={formData.applicableCategories}
                                    >
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.promotionType === 'product_specific' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Applicable Products (hold Ctrl/Cmd to select multiple)
                                    </label>
                                    <select
                                        multiple
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md h-32"
                                        onChange={(e) => handleMultiSelect(e, 'applicableProducts')}
                                        value={formData.applicableProducts.map(id => id.toString())}
                                    >
                                        {products.map(product => (
                                            <option key={product.id} value={product.id.toString()}>
                                                {product.name} - ${parseFloat(product.price).toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Active (immediately apply this promotion)
                                    </span>
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : (selectedPromotionId ? 'Update Promotion' : 'Create Promotion')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromotionManagement; 