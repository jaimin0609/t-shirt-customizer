import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const AboutPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
                staggerChildren: 0.3
            }
        }
    };

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
                        About <span className="text-blue-600">UniQVerse</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Your premier destination for custom t-shirts and apparel.
                        Express your unique style with our innovative design platform and quality products.
                    </p>
                </motion.div>

                {/* Our Story Section */}
                <motion.div
                    variants={fadeIn}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="p-8 md:p-12 flex flex-col justify-center">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="w-10 h-1 bg-blue-600 mr-4 rounded-full hidden sm:block"></span>
                                Our Story
                            </h2>
                            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                                UniQVerse was founded in 2023 with a simple mission: to make custom apparel accessible to everyone.
                                We believe that personal expression through clothing should be easy, affordable, and fun.
                            </p>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                We're proud to offer high-quality products with fast turnaround times, exceptional customer service,
                                and a user-friendly design tool that makes customization a breeze.
                            </p>
                        </div>
                        <div className="relative h-96 lg:h-auto overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80"
                                alt="Our team"
                                className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Values Section */}
                <motion.div variants={fadeIn} className="py-12">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Core Values</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Quality",
                                description: "We use premium materials and advanced printing techniques to ensure your designs look amazing and last longer.",
                                icon: (
                                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                )
                            },
                            {
                                title: "Creativity",
                                description: "We empower you to express your unique style with our intuitive design tools and customization options.",
                                icon: (
                                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                )
                            },
                            {
                                title: "Sustainability",
                                description: "We're committed to eco-friendly practices, using sustainable materials and reducing waste in our production process.",
                                icon: (
                                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )
                            }
                        ].map((value, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -10 }}
                                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <div className="mb-6">{value.icon}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                                <p className="text-gray-600">{value.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Team Section */}
                <motion.div variants={fadeIn} className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Meet Our Team</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                name: "Jaimin Prajapati",
                                role: "Founder & CEO",
                                image: "./src/assets/222.jpg"
                            },
                            {
                                name: "Shruti Prajapati",
                                role: "Co-founder",
                                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=387&q=80"
                            },
                            {
                                name: "Michael Rodriguez",
                                role: "Head of Production",
                                image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=387&q=80"
                            },
                            {
                                name: "Emily Taylor",
                                role: "Customer Experience",
                                image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=461&q=80"
                            }
                        ].map((member, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.05 }}
                                className="text-center"
                            >
                                <div className="relative w-48 h-48 mx-auto mb-4 overflow-hidden rounded-full">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                                <p className="text-blue-600">{member.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    variants={fadeIn}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 md:p-12 text-center text-white"
                >
                    <h2 className="text-3xl font-bold mb-6">Ready to Create Your Custom Design?</h2>
                    <p className="text-xl mb-8 max-w-3xl mx-auto">
                        Join thousands of satisfied customers who have brought their creative visions to life with UniQVerse.
                    </p>
                    <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg">
                        Start Designing Now
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default AboutPage;
