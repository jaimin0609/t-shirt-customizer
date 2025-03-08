import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const DesignGalleryPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // State for filters and search
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Categories for filtering
    const categories = [
        { id: 'all', name: 'All Designs' },
        { id: 'trending', name: 'Trending' },
        { id: 'new', name: 'New Arrivals' },
        { id: 'minimalist', name: 'Minimalist' },
        { id: 'graphic', name: 'Graphic Art' },
        { id: 'typography', name: 'Typography' },
        { id: 'retro', name: 'Retro' }
    ];

    // Sample designs data
    const allDesigns = [
        {
            id: 1,
            title: "Mountain Explorer",
            image: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=869&q=80",
            category: ["trending", "graphic"],
            designer: "Alex Morgan",
            price: 29.99,
            colors: ["black", "navy", "forest"]
        },
        {
            id: 2,
            title: "Abstract Waves",
            image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=764&q=80",
            category: ["new", "minimalist"],
            designer: "Jordan Lee",
            price: 27.99,
            colors: ["white", "gray", "blue"]
        },
        {
            id: 3,
            title: "Vintage Vibes",
            image: "https://images.unsplash.com/photo-1533280385001-c62322a6f327?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=873&q=80",
            category: ["retro", "typography"],
            designer: "Riley Smith",
            price: 31.99,
            colors: ["cream", "burgundy", "brown"]
        },
        {
            id: 4,
            title: "Urban Life",
            image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=387&q=80",
            category: ["trending", "graphic"],
            designer: "Taylor Kim",
            price: 25.99,
            colors: ["black", "white", "gray"]
        },
        {
            id: 5,
            title: "Geometric Patterns",
            image: "https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=883&q=80",
            category: ["minimalist", "new"],
            designer: "Jamie Wilson",
            price: 24.99,
            colors: ["white", "black", "teal"]
        },
        {
            id: 6,
            title: "Sunset Silhouette",
            image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=873&q=80",
            category: ["graphic", "trending"],
            designer: "Casey Barnes",
            price: 32.99,
            colors: ["blue", "orange", "black"]
        },
        {
            id: 7,
            title: "Minimal Typography",
            image: "https://images.unsplash.com/photo-1569326513265-82f7742e12c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=387&q=80",
            category: ["typography", "minimalist"],
            designer: "Morgan White",
            price: 26.99,
            colors: ["white", "black", "gray"]
        },
        {
            id: 8,
            title: "90's Throwback",
            image: "https://images.unsplash.com/photo-1577460551100-904a6fddff15?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=408&q=80",
            category: ["retro", "trending"],
            designer: "Quinn Johnson",
            price: 29.99,
            colors: ["purple", "teal", "pink"]
        },
    ];

    // Filter designs based on selected category and search query
    const filteredDesigns = allDesigns.filter(design => {
        const matchesCategory = selectedCategory === 'all' || design.category.includes(selectedCategory);
        const matchesSearch = design.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            design.designer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Animation variants
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
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-b from-gray-50 to-white">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-12"
            >
                {/* Hero Section */}
                <motion.div variants={fadeIn} className="text-center">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
                        Design <span className="text-blue-600">Gallery</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Browse our collection of premium t-shirt designs created by talented designers from around the world.
                    </p>
                </motion.div>

                {/* Search and Filter Section */}
                <motion.div variants={fadeIn} className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="w-full md:w-1/2">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Search designs by name or designer..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-auto flex overflow-x-auto py-2 hide-scrollbar">
                            <div className="flex space-x-2">
                                {categories.map(category => (
                                    <button
                                        key={category.id}
                                        className={`px-4 py-2 rounded-full whitespace-nowrap ${selectedCategory === category.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                            } transition-colors duration-200`}
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Design Grid */}
                <div>
                    <motion.div
                        variants={staggerContainer}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {filteredDesigns.length > 0 ? (
                            filteredDesigns.map(design => (
                                <motion.div
                                    key={design.id}
                                    variants={fadeIn}
                                    whileHover={{ y: -8 }}
                                    className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl"
                                >
                                    <div className="relative h-60 overflow-hidden">
                                        <img
                                            src={design.image}
                                            alt={design.title}
                                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                                ${design.price}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{design.title}</h3>
                                        <p className="text-gray-500 text-sm mb-3">by {design.designer}</p>
                                        <div className="flex justify-between items-center">
                                            <div className="flex space-x-1">
                                                {design.colors.map(color => (
                                                    <div
                                                        key={color}
                                                        className="w-5 h-5 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: color === 'white' ? 'white' : color === 'forest' ? 'darkgreen' : color === 'navy' ? 'navy' : color === 'cream' ? '#F5F5DC' : color }}
                                                        title={color}
                                                    ></div>
                                                ))}
                                            </div>
                                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                                                View
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center">
                                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="mt-4 text-xl font-medium text-gray-900">No designs found</h3>
                                <p className="mt-2 text-gray-500">
                                    Try adjusting your search or filter to find what you're looking for.
                                </p>
                                <button
                                    onClick={() => {
                                        setSelectedCategory('all');
                                        setSearchQuery('');
                                    }}
                                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Featured Designer Section */}
                <motion.div variants={fadeIn} className="bg-gray-900 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="p-8 md:p-12 flex flex-col justify-center text-white">
                            <span className="text-sm font-medium text-blue-400 mb-2">FEATURED DESIGNER</span>
                            <h2 className="text-3xl font-bold mb-4">Alex Morgan</h2>
                            <p className="text-gray-300 mb-6 text-lg">
                                "My designs are inspired by nature and urban landscapes. I believe in creating art that connects people to the world around them."
                            </p>
                            <ul className="space-y-2 mb-8">
                                <li className="flex items-center">
                                    <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-300">15+ exclusive designs</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-300">Award-winning graphic artist</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-gray-300">Specialized in mountain landscapes</span>
                                </li>
                            </ul>
                            <button className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium">
                                View All Designs
                            </button>
                        </div>
                        <div className="hidden lg:block">
                            <img
                                src="https://images.unsplash.com/photo-1531384441138-2736e62e0919?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80"
                                alt="Featured Designer"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* How It Works Section */}
                <motion.div variants={fadeIn} className="py-12">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        How It Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "1. Browse & Choose",
                                description: "Explore our collection of unique designs and select the one that speaks to you.",
                                icon: (
                                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                )
                            },
                            {
                                title: "2. Customize",
                                description: "Select your preferred t-shirt style, size, and color to personalize your purchase.",
                                icon: (
                                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                )
                            },
                            {
                                title: "3. Wear & Share",
                                description: "Receive your high-quality printed t-shirt and share your style with the world.",
                                icon: (
                                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )
                            }
                        ].map((step, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -8 }}
                                className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center"
                            >
                                <div className="flex justify-center mb-4">{step.icon}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                <p className="text-gray-600">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    variants={fadeIn}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 md:p-12 text-center text-white"
                >
                    <h2 className="text-3xl font-bold mb-6">Create Your Own Design</h2>
                    <p className="text-xl mb-8 max-w-3xl mx-auto text-blue-100">
                        Have a vision for your perfect t-shirt? Use our design studio to create something totally unique!
                    </p>
                    <Link
                        to="/custom-design"
                        className="inline-block bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-bold transition-colors duration-300 shadow-lg"
                    >
                        Start Designing Now
                    </Link>
                </motion.div>
            </motion.div>

            {/* Add custom scrollbar styles */}
            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default DesignGalleryPage; 