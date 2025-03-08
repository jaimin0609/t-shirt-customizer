import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import ProductCustomizer3D from '../components/Designer/ProductCustomizer3D';
import { toast } from 'react-toastify';

const CustomDesignStudioPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const productId = searchParams.get('product');
    const productType = searchParams.get('type');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Log product information for debugging
    useEffect(() => {
        console.log('Product ID from URL:', productId);
        console.log('Product Type from URL:', productType);
    }, [productId, productType]);

    const [savedDesigns, setSavedDesigns] = useState([]);

    // Handle saving a design
    const handleSaveDesign = (designData) => {
        setSavedDesigns(prev => [designData, ...prev]);

        // In a real app, you would save this to a database
        console.log('Design saved:', designData);
    };

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 }
        }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    // Sample designs for inspiration section
    const inspirationDesigns = [
        {
            title: "Summer Vibes",
            image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=871&q=80",
            description: "Bright, cheerful designs for the summer season."
        },
        {
            title: "Minimalist",
            image: "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=387&q=80",
            description: "Clean, simple designs with powerful impact."
        },
        {
            title: "Artistic",
            image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
            description: "Expressive, creative designs that make a statement."
        },
        {
            title: "Retro",
            image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=387&q=80",
            description: "Vintage-inspired designs with a modern twist."
        }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-b from-gray-50 to-white">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-16"
            >
                {/* Hero Section */}
                <motion.div variants={fadeIn} className="text-center">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
                        Custom Design <span className="text-blue-600">Studio</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Unleash your creativity and design custom apparel that's uniquely yours.
                        Our intuitive design tools make it easy to bring your vision to life.
                    </p>
                </motion.div>

                {/* Designer Section */}
                <motion.div variants={fadeIn}>
                    <ProductCustomizer3D
                        onSaveDesign={handleSaveDesign}
                        initialProductType={productType || 'tshirt'}
                    />
                </motion.div>

                {/* Saved Designs Section - Only shown if there are saved designs */}
                {savedDesigns.length > 0 && (
                    <motion.div variants={fadeIn} className="pt-8">
                        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
                            Your Saved Designs
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {savedDesigns.map((design, index) => (
                                <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
                                    <div className="h-52 relative">
                                        <img
                                            src={design.modelImage}
                                            alt={`Design ${index + 1}`}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <p className="text-gray-600 text-sm">
                                            Created: {new Date(design.timestamp).toLocaleString()}
                                        </p>
                                        <p className="text-gray-800 text-sm font-medium mt-1">
                                            {design.productType.charAt(0).toUpperCase() + design.productType.slice(1)} - {design.productColor}
                                        </p>
                                        <div className="mt-3 flex justify-between">
                                            <button
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                                                onClick={() => toast.info("Edit functionality coming soon!")}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                                                onClick={() => toast.info("Order functionality coming soon!")}
                                            >
                                                Order
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Design Process Section */}
                <motion.div variants={fadeIn} className="py-12">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        The Design Process
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "1. Create",
                                description: "Use our intuitive tools to design your perfect t-shirt. Add text, upload images, or use our design elements.",
                                icon: (
                                    <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                )
                            },
                            {
                                title: "2. Preview",
                                description: "See your design from different angles on various product types, and make adjustments until it's perfect.",
                                icon: (
                                    <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )
                            },
                            {
                                title: "3. Order",
                                description: "When you're happy with your design, select your size and quantity, and place your order.",
                                icon: (
                                    <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                )
                            }
                        ].map((step, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -10 }}
                                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center"
                            >
                                <div className="mb-6 flex justify-center">{step.icon}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                <p className="text-gray-600">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Design Inspiration */}
                <motion.div variants={fadeIn} className="py-12">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Design Inspiration
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {inspirationDesigns.map((design, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -10 }}
                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                            >
                                <div className="relative h-64">
                                    <img
                                        src={design.image}
                                        alt={design.title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{design.title}</h3>
                                    <p className="text-gray-600">{design.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    variants={fadeIn}
                    className="bg-gray-900 rounded-2xl shadow-xl p-8 md:p-12 text-center text-white"
                >
                    <h2 className="text-3xl font-bold mb-6">Need Inspiration?</h2>
                    <p className="text-xl mb-8 max-w-3xl mx-auto text-gray-300">
                        Check out our design gallery for ideas or browse our collection of ready-made designs.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/designs"
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold transition-colors duration-300 shadow-lg"
                        >
                            Visit Design Gallery
                        </Link>
                        <Link
                            to="/"
                            className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-lg font-bold transition-colors duration-300 shadow-lg"
                        >
                            Shop Ready-Made Designs
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default CustomDesignStudioPage; 