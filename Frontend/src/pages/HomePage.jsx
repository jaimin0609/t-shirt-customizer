import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import productService from '../services/productService';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const HomePage = () => {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFeaturedProducts = async () => {
            try {
                setLoading(true);
                // Get featured/popular products from your API
                const products = await productService.getFeaturedProducts();
                setFeaturedProducts(products);
                setError(null);
            } catch (err) {
                console.error('Error fetching featured products:', err);
                setError('Failed to load featured products. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedProducts();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 p-4 rounded-md text-red-600">
                    <p>{error}</p>
                    <button
                        className="mt-2 text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <section className="mb-16">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl overflow-hidden shadow-xl">
                    <div className="container mx-auto px-6 py-16 flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-8 md:mb-0">
                            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                                Custom T-Shirts That Define Your Style
                            </h1>
                            <p className="text-lg md:text-xl text-blue-100 mb-8">
                                Express yourself with premium quality custom t-shirts. Design your own or choose from our collections.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    to="/products"
                                    className="bg-white text-blue-600 font-bold rounded-full px-8 py-3 hover:bg-blue-50 transition duration-300"
                                >
                                    Shop Now
                                </Link>
                                <Link
                                    to="/custom-design-studio"
                                    className="bg-transparent border-2 border-white text-white font-bold rounded-full px-8 py-3 hover:bg-white hover:bg-opacity-10 transition duration-300"
                                >
                                    Design Your Own
                                </Link>
                            </div>
                        </div>
                        <div className="md:w-1/2">
                            <img
                                src="/images/hero-tshirt.webp"
                                alt="Custom T-Shirt Showcase"
                                className="rounded-lg shadow-2xl"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/images/fallback-hero.jpg";
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products Section */}
            <section className="mb-16">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Featured Products</h2>
                    <p className="text-gray-600 mt-2">Our most popular designs</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {featuredProducts.length > 0 ? (
                        featuredProducts.map((product) => (
                            <Link
                                to={`/products/${product._id || product.id}`}
                                key={product._id || product.id}
                                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="relative pb-[100%] overflow-hidden">
                                    <img
                                        src={product.images[0] || '/images/product-placeholder.jpg'}
                                        alt={product.name}
                                        className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                    />
                                    {product.discountPercentage > 0 && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white text-sm font-bold rounded-full px-3 py-1">
                                            {product.discountPercentage}% OFF
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                                        {product.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm mt-1">{product.category}</p>
                                    <div className="flex justify-between items-center mt-3">
                                        <div className="flex items-center">
                                            {product.discountPercentage > 0 ? (
                                                <>
                                                    <span className="text-gray-800 font-semibold">${product.discountedPrice.toFixed(2)}</span>
                                                    <span className="text-gray-500 line-through text-sm ml-2">${product.price.toFixed(2)}</span>
                                                </>
                                            ) : (
                                                <span className="text-gray-800 font-semibold">${product.price.toFixed(2)}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center text-yellow-400">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                            </svg>
                                            <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-10">
                            <p className="text-gray-500">No featured products available at the moment.</p>
                        </div>
                    )}
                </div>

                <div className="text-center mt-8">
                    <Link
                        to="/products"
                        className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300"
                    >
                        View All Products
                    </Link>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="mb-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-800">How It Works</h2>
                    <p className="text-gray-600 mt-2">Create your custom t-shirt in just a few steps</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 rounded-full p-6 mb-4">
                            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Choose Your Style</h3>
                        <p className="text-gray-600">Select from various t-shirt styles, colors, and sizes that suit your preferences.</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 rounded-full p-6 mb-4">
                            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">2. Add Your Design</h3>
                        <p className="text-gray-600">Upload your artwork or use our design tool to create something unique.</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="bg-blue-100 rounded-full p-6 mb-4">
                            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Order & Receive</h3>
                        <p className="text-gray-600">Place your order and receive your custom t-shirt delivered to your doorstep.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage; 