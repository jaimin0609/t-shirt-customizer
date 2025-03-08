import { TruckIcon, GlobeAmericasIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

const ShippingInfoPage = () => {
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Page Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Information</h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Everything you need to know about shipping times, delivery options, and tracking your order.
                </p>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Processing Times Section */}
                <div className="p-8 border-b border-gray-200">
                    <div className="flex items-center mb-4">
                        <ClockIcon className="h-8 w-8 text-blue-600 mr-3" />
                        <h2 className="text-2xl font-bold text-gray-900">Processing Times</h2>
                    </div>
                    <p className="text-gray-600 mb-4">
                        All orders go through our quality production process before shipping. Here's what to expect:
                    </p>
                    <ul className="space-y-2 text-gray-700 mb-6">
                        <li className="flex items-start">
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mr-2 mt-0.5">1</span>
                            <span><strong>Standard Orders:</strong> 2-3 business days for production</span>
                        </li>
                        <li className="flex items-start">
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mr-2 mt-0.5">2</span>
                            <span><strong>Custom Design Orders:</strong> 3-5 business days for production</span>
                        </li>
                        <li className="flex items-start">
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mr-2 mt-0.5">3</span>
                            <span><strong>Bulk Orders (10+ items):</strong> 5-7 business days for production</span>
                        </li>
                    </ul>
                    <p className="text-sm text-gray-500 italic">
                        Note: Processing times are estimates and may vary during peak seasons or promotional periods.
                    </p>
                </div>

                {/* Shipping Options Section */}
                <div className="p-8 border-b border-gray-200">
                    <div className="flex items-center mb-4">
                        <TruckIcon className="h-8 w-8 text-blue-600 mr-3" />
                        <h2 className="text-2xl font-bold text-gray-900">Shipping Options</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 mb-6">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Method</th>
                                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Delivery</th>
                                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Standard Shipping</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">5-7 business days</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">$4.99 (Free on orders over $50)</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Expedited Shipping</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">2-3 business days</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">$9.99</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Express Shipping</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">1-2 business days</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">$14.99</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">International Shipping</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">7-14 business days</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">Varies by country (calculated at checkout)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-sm text-gray-500 italic">
                        Delivery times are estimated from the ship date, not the order date. Please add processing time to calculate the total time until delivery.
                    </p>
                </div>

                {/* International Shipping Section */}
                <div className="p-8 border-b border-gray-200">
                    <div className="flex items-center mb-4">
                        <GlobeAmericasIcon className="h-8 w-8 text-blue-600 mr-3" />
                        <h2 className="text-2xl font-bold text-gray-900">International Shipping</h2>
                    </div>

                    <p className="text-gray-600 mb-4">
                        We ship to over 100 countries worldwide. International shipping costs and delivery times vary by location. Here's what you need to know:
                    </p>

                    <div className="space-y-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-gray-900 mb-2">Customs & Import Duties</h3>
                            <p className="text-gray-700">
                                International orders may be subject to customs fees, import duties, or taxes imposed by the destination country. These fees are the responsibility of the recipient and are not included in our shipping charges.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-gray-900 mb-2">Delivery Times</h3>
                            <p className="text-gray-700">
                                Standard international delivery typically takes 7-14 business days after shipping, but may take longer depending on customs processing in your country. Expedited international shipping options are available for select countries at checkout.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-gray-900 mb-2">Tracking</h3>
                            <p className="text-gray-700">
                                All international orders include tracking information. However, tracking detail availability may vary by country once the package enters the local postal system.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Tracking Section */}
                <div className="p-8 border-b border-gray-200">
                    <div className="flex items-center mb-4">
                        <CurrencyDollarIcon className="h-8 w-8 text-blue-600 mr-3" />
                        <h2 className="text-2xl font-bold text-gray-900">Order Tracking</h2>
                    </div>

                    <p className="text-gray-600 mb-4">
                        Stay updated on your order's journey from our facility to your doorstep:
                    </p>

                    <ul className="space-y-3 text-gray-700 mb-6">
                        <li className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="ml-3">
                                <strong>Shipping Confirmation Email:</strong> You'll receive an email with tracking information once your order ships.
                            </p>
                        </li>
                        <li className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="ml-3">
                                <strong>Order History:</strong> Track your order by logging into your account and visiting the "Order History" section.
                            </p>
                        </li>
                        <li className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="ml-3">
                                <strong>Direct Tracking:</strong> Use the tracking number provided to track your package directly on the carrier's website.
                            </p>
                        </li>
                    </ul>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    If you have any questions about your shipment or are experiencing delays, please contact our customer service team at support@uniqverse.com or call us at +1 (555) 123-4567.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shipping Policies Section */}
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Shipping Policies</h2>

                    <div className="space-y-6 text-gray-700">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Address Accuracy</h3>
                            <p>
                                Customers are responsible for providing accurate shipping information. We are not responsible for orders shipped to incorrect addresses provided by customers. Please review your shipping address carefully before completing your purchase.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Shipping Delays</h3>
                            <p>
                                While we strive to meet all estimated delivery times, occasional delays may occur due to weather conditions, carrier issues, or other circumstances beyond our control. We appreciate your understanding in these situations.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Lost or Damaged Packages</h3>
                            <p>
                                In the rare event that your package is lost or damaged during transit, please contact our customer service team within 14 days of the estimated delivery date. We'll work with the shipping carrier to resolve the issue as quickly as possible.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Undeliverable Packages</h3>
                            <p>
                                If a package is returned to us as undeliverable due to an incorrect address, refusal of delivery, or failure to pick up, customers may be responsible for the cost of reshipping the order.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact CTA */}
            <div className="mt-12 text-center">
                <p className="text-gray-600 mb-4">
                    Have questions about shipping or need assistance with your order?
                </p>
                <a
                    href="/contact-us"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Contact Our Support Team
                </a>
            </div>
        </div>
    );
};

export default ShippingInfoPage; 