import { ArchiveBoxArrowDownIcon, ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ReturnsPolicyPage = () => {
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Page Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Returns Policy</h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    We want you to be completely satisfied with your purchase. Here's everything you need to know about our returns process.
                </p>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Overview Section */}
                <div className="p-8 border-b border-gray-200">
                    <div className="flex items-center mb-6">
                        <ArchiveBoxArrowDownIcon className="h-8 w-8 text-blue-600 mr-3" />
                        <h2 className="text-2xl font-bold text-gray-900">Return Policy Overview</h2>
                    </div>

                    <div className="prose prose-lg text-gray-600 max-w-none">
                        <p>
                            At UniQVerse, we stand behind the quality of our products. If you're not completely satisfied with your purchase, we're here to help. Please review our return policy details below:
                        </p>

                        <ul className="mt-4 space-y-2">
                            <li>Returns are accepted within <strong>30 days</strong> of the delivery date.</li>
                            <li>Items must be <strong>unworn, unwashed, and in their original condition</strong> with all tags attached.</li>
                            <li>Original shipping costs are <strong>non-refundable</strong>.</li>
                            <li>Return shipping costs are the responsibility of the customer unless the return is due to our error.</li>
                            <li>Refunds will be issued to the original payment method within 5-7 business days after we receive and process your return.</li>
                        </ul>
                    </div>
                </div>

                {/* Returns Process Section */}
                <div className="p-8 border-b border-gray-200">
                    <div className="flex items-center mb-6">
                        <ArrowPathIcon className="h-8 w-8 text-blue-600 mr-3" />
                        <h2 className="text-2xl font-bold text-gray-900">Returns Process</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 mb-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 1: Request a Return</h3>
                            <p className="text-gray-600 mb-4">
                                To initiate a return, log into your account and visit the "Order History" section, or contact our customer service team.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-gray-700">Provide your order number and reasons for return</span>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-gray-700">Select whether you want a refund or exchange</span>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-gray-700">You'll receive a return authorization and instructions</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 2: Pack & Ship Your Return</h3>
                            <p className="text-gray-600 mb-4">
                                Ensure your return is packaged securely to prevent damage during transit.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-gray-700">Place items in their original packaging if possible</span>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-gray-700">Include the return form with your package</span>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-gray-700">Ship to the address provided in your return instructions</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 3: Return Processing</h3>
                            <p className="text-gray-600 mb-4">
                                Once we receive your return, our team will inspect the items and process your refund or exchange.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-gray-700">We'll verify the condition of your returned items</span>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-gray-700">You'll receive email updates on your return status</span>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-gray-700">Processing typically takes 3-5 business days</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 4: Refund or Exchange</h3>
                            <p className="text-gray-600 mb-4">
                                The final step of our returns process is completing your refund or exchange.
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-gray-700">Refunds are issued to your original payment method</span>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-gray-700">Exchanges will be shipped once processed</span>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="ml-2 text-gray-700">You'll receive confirmation when your refund or exchange is complete</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Special Circumstances Section */}
                <div className="p-8 border-b border-gray-200">
                    <div className="flex items-center mb-6">
                        <ExclamationTriangleIcon className="h-8 w-8 text-blue-600 mr-3" />
                        <h2 className="text-2xl font-bold text-gray-900">Special Circumstances</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Custom-Designed Products</h3>
                            <p className="text-gray-600">
                                Due to the personalized nature of custom-designed products, they can only be returned if there is a manufacturing defect or if the product received differs significantly from what was ordered. We recommend carefully reviewing your design before finalizing your order.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Defective or Damaged Items</h3>
                            <p className="text-gray-600">
                                If you receive a defective or damaged item, please contact our customer service team immediately with photos of the damage. We'll expedite the return process and cover the return shipping costs for defective or damaged merchandise.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Sale or Clearance Items</h3>
                            <p className="text-gray-600">
                                Items purchased at a discounted rate from our "Sale" or "Clearance" sections are final sale and cannot be returned unless they arrive damaged or defective. Please check sizing and details carefully before purchasing sale items.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Wrong Items Received</h3>
                            <p className="text-gray-600">
                                If you receive an item that does not match what you ordered, please contact us immediately. We'll send you the correct item and provide a return label for the incorrect merchandise at no cost to you.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="p-8">
                    <div className="flex items-center mb-6">
                        <CheckCircleIcon className="h-8 w-8 text-blue-600 mr-3" />
                        <h2 className="text-2xl font-bold text-gray-900">Returns FAQ</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Can I exchange an item for a different size or color?</h3>
                            <p className="text-gray-600">
                                Yes! When initiating your return, select "Exchange" and specify the size or color you'd like instead. If the desired replacement is in stock, we'll process the exchange once we receive your return.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">How long will it take to receive my refund?</h3>
                            <p className="text-gray-600">
                                Once we receive and process your return, refunds are typically issued within 3-5 business days. It may take an additional 5-10 business days for the funds to appear in your account, depending on your financial institution.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">What if my return is outside the 30-day window?</h3>
                            <p className="text-gray-600">
                                Returns initiated after 30 days from delivery are reviewed on a case-by-case basis and may only be eligible for store credit if approved. Please contact our customer service team to discuss your situation.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Do I need the original packaging to return an item?</h3>
                            <p className="text-gray-600">
                                While we prefer returns in their original packaging, we understand this isn't always possible. The most important requirement is that items are unworn, unwashed, and in their original condition with all tags attached.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact CTA */}
            <div className="mt-12 text-center">
                <p className="text-gray-600 mb-4">
                    Need help with a return or have additional questions?
                </p>
                <div className="inline-flex space-x-4">
                    <a
                        href="/contact-us"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Contact Us
                    </a>
                    <a
                        href="mailto:returns@uniqverse.com"
                        className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Email Returns Department
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ReturnsPolicyPage; 