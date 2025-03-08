import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

const FAQPage = () => {
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (index) => {
        setOpenSection(openSection === index ? null : index);
    };

    const faqItems = [
        {
            question: 'How do I customize my t-shirt?',
            answer: 'Our user-friendly customization tool allows you to upload your own designs, add text, and choose from a variety of fonts, colors, and placements. Simply select a product, click the "Customize" button, and follow the on-screen instructions to create your unique piece.'
        },
        {
            question: 'What file formats do you accept for custom designs?',
            answer: 'We accept most common image formats including PNG, JPG, JPEG, and SVG. For best results, we recommend using high-resolution images (at least 300 DPI) with transparent backgrounds (PNG or SVG).'
        },
        {
            question: 'How long does it take to receive my order?',
            answer: 'Processing time is typically 2-3 business days for standard orders. Shipping times vary depending on your location and the shipping method selected at checkout. Standard shipping usually takes 3-5 business days domestically, while expedited shipping options are available at an additional cost.'
        },
        {
            question: 'What is your return policy?',
            answer: 'We offer a 30-day return policy for unworn, unwashed items in their original condition. Custom-designed products can only be returned if there is a manufacturing defect or if the product received differs significantly from what was ordered. Please visit our Returns Policy page for more detailed information.'
        },
        {
            question: 'What t-shirt brands and materials do you offer?',
            answer: 'We offer a variety of premium brands including Bella+Canvas, Next Level, and American Apparel. Our materials range from 100% cotton to tri-blend fabrics (cotton, polyester, and rayon mix) for different feels and fits. Each product page specifies the exact material composition and fit details.'
        },
        {
            question: 'Do you offer bulk or wholesale discounts?',
            answer: 'Yes, we offer volume discounts starting at orders of 10+ items. For larger wholesale inquiries, please contact our sales team at sales@uniqverse.com with details about your order requirements for a custom quote.'
        },
        {
            question: 'How do I track my order?',
            answer: 'Once your order ships, you\'ll receive a confirmation email with tracking information. You can also view your order status and tracking details by logging into your account and visiting the "Order History" section.'
        },
        {
            question: 'What sizes do you offer?',
            answer: 'We offer a wide range of sizes from XS to 4XL, depending on the specific product. Each product page contains a detailed size chart with measurements to help you select the right size. If you\'re between sizes, we generally recommend sizing up for a more comfortable fit.'
        },
        {
            question: 'Can I modify or cancel my order after it\'s been placed?',
            answer: 'We begin processing orders quickly, so there\'s a limited window for modifications or cancellations. Please contact our customer service team immediately at support@uniqverse.com if you need to make changes. Once an order has entered the production phase, we cannot make changes or cancel it.'
        },
        {
            question: 'Do you ship internationally?',
            answer: 'Yes, we ship to most countries worldwide. International shipping rates and delivery times vary by location. Customs fees, import duties, or taxes may apply depending on your country\'s regulations and are the responsibility of the recipient.'
        }
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Page Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Find answers to common questions about our products, customization options, ordering process, and more.
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-10">
                <div className="relative max-w-xl mx-auto">
                    <input
                        type="text"
                        className="w-full py-3 px-4 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Search for a question..."
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
                {faqItems.map((item, index) => (
                    <div
                        key={index}
                        className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200"
                    >
                        <button
                            className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none bg-white hover:bg-gray-50"
                            onClick={() => toggleSection(index)}
                        >
                            <span className="text-lg font-medium text-gray-900">{item.question}</span>
                            {openSection === index ? (
                                <ChevronUpIcon className="h-5 w-5 text-blue-500" />
                            ) : (
                                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                            )}
                        </button>
                        {openSection === index && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <p className="text-gray-700">{item.answer}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Contact Section */}
            <div className="mt-16 text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Still Have Questions?</h2>
                <p className="text-gray-600 mb-6">
                    Our customer support team is here to help. Get in touch with us and we'll get back to you as soon as possible.
                </p>
                <div className="inline-flex space-x-4">
                    <a
                        href="/contact-us"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Contact Us
                    </a>
                    <a
                        href="mailto:support@uniqverse.com"
                        className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Email Support
                    </a>
                </div>
            </div>
        </div>
    );
};

export default FAQPage; 