import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProductCustomizer3D from '../components/Designer/ProductCustomizer3D';
import { toast } from 'react-toastify';

const CustomProductDesignerPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [savedDesigns, setSavedDesigns] = useState([]);

    // Handle saving a design
    const handleSaveDesign = (designData) => {
        setSavedDesigns(prev => [designData, ...prev]);

        // In a real app, you would save this to a database
        console.log('Design saved:', designData);
        toast.success("Your design has been saved!");
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

    // Available product types
    const productTypes = [
        { id: 'tshirt', name: 'T-Shirt', image: '/assets/products/tshirt-thumbnail.jpg' },
        { id: 'hoodie', name: 'Hoodie', image: '/assets/products/hoodie-thumbnail.jpg' },
        { id: 'cap', name: 'Cap', image: '/assets/products/cap-thumbnail.jpg' },
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
                        3D Product <span className="text-blue-600">Designer</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Design your custom products in 3D! Rotate, zoom, and see your designs from every angle.
                        Create unique apparel that perfectly matches your vision.
                    </p>
                </motion.div>

                {/* Product Type Selection */}
                <motion.div variants={fadeIn}>
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                        Choose Your Product
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {productTypes.map((product) => (
                            <div
                                key={product.id}
                                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => toast.info(`${product.name} selection coming soon!`)}
                            >
                                <div className="h-48 relative">
                                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                                        <span className="text-lg font-medium text-gray-500">{product.name}</span>
                                    </div>
                                </div>
                                <div className="p-4 text-center">
                                    <h3 className="font-bold">{product.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">Customize to your style</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Designer Section */}
                <motion.div variants={fadeIn}>
                    <ProductCustomizer3D onSaveDesign={handleSaveDesign} />
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
                                            src={design.image}
                                            alt={`Design ${index + 1}`}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <p className="text-gray-600 text-sm">
                                            Created: {new Date(design.timestamp).toLocaleString()}
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

                {/* 3D Design Features */}
                <motion.div variants={fadeIn} className="py-12">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Advanced 3D Design Features
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "360° Rotation",
                                description: "See your design from every angle to ensure it looks perfect from all perspectives.",
                                icon: (
                                    <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )
                            },
                            {
                                title: "Multiple Design Areas",
                                description: "Customize front, back, and sleeves with different designs for a truly personalized product.",
                                icon: (
                                    <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                )
                            },
                            {
                                title: "Real-time Preview",
                                description: "See exactly how your design will look on the final product with realistic 3D rendering.",
                                icon: (
                                    <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                )
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -10 }}
                                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-center"
                            >
                                <div className="mb-6 flex justify-center">{feature.icon}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    variants={fadeIn}
                    className="bg-gray-900 rounded-2xl shadow-xl p-8 md:p-12 text-center text-white"
                >
                    <h2 className="text-3xl font-bold mb-6">Ready to Create?</h2>
                    <p className="text-xl mb-8 max-w-3xl mx-auto text-gray-300">
                        Design your perfect custom product now or explore our curated collection of ready-made designs.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/designs"
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold transition-colors duration-300 shadow-lg"
                        >
                            Start Designing
                        </Link>
                        <Link
                            to="/"
                            className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-lg font-bold transition-colors duration-300 shadow-lg"
                        >
                            Browse Ready-Made Designs
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default CustomProductDesignerPage; 