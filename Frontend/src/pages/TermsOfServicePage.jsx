import { DocumentTextIcon } from '@heroicons/react/24/outline';

const TermsOfServicePage = () => {
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Page Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
                <div className="flex justify-center mb-4">
                    <DocumentTextIcon className="h-16 w-16 text-blue-600" />
                </div>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Please read these terms and conditions carefully before using our website and services.
                </p>
                <p className="text-gray-500 mt-2">Last Updated: June 15, 2023</p>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Introduction Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            These Terms of Service ("Terms") govern your use of the UniQVerse website and services (collectively referred to as the "Service") operated by UniQVerse LLC ("we," "us," or "our").
                        </p>
                        <p>
                            By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
                        </p>
                    </div>
                </div>

                {/* Account Terms Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Terms</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            When you create an account with us, you must provide accurate, complete, and up-to-date information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
                        </p>
                        <p>
                            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
                        </p>
                        <p>
                            You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
                        </p>
                        <p>
                            You may not use as a username the name of another person or entity that is not lawfully available for use, a name or trademark that is subject to any rights of another person or entity without appropriate authorization, or a name that is offensive, vulgar, or obscene.
                        </p>
                    </div>
                </div>

                {/* Purchases and Payments Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Purchases and Payments</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Product Descriptions</h3>
                        <p>
                            We strive to accurately describe our products and services. However, we do not warrant that product descriptions or other content on this site are accurate, complete, reliable, current, or error-free. If a product offered by UniQVerse is not as described, your sole remedy is to return it in unused condition.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Pricing and Availability</h3>
                        <p>
                            All prices are shown in U.S. dollars unless otherwise indicated. We reserve the right to modify prices at any time. We do not guarantee the availability of any particular product. Any orders placed for products that are unavailable will be canceled.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Payment Terms</h3>
                        <p>
                            You agree to pay all charges at the prices then in effect for your purchases, including applicable taxes and shipping fees. By providing a payment method, you represent and warrant that you are authorized to use the designated payment method and that you authorize us to charge your payment method for the total amount of your order (including taxes and shipping fees). If the payment method cannot be verified, is invalid, or is not otherwise acceptable, your order may be suspended or canceled.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Custom Orders</h3>
                        <p>
                            For custom-designed products, you must confirm your design before finalizing your purchase. Once a custom order is submitted, you acknowledge that it may not be canceled, refunded, or exchanged unless the final product differs significantly from the approved design or contains manufacturing defects.
                        </p>
                    </div>
                </div>

                {/* Intellectual Property Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Our Content</h3>
                        <p>
                            The Service and its original content, features, and functionality are and will remain the exclusive property of UniQVerse LLC and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of UniQVerse LLC.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">User Content</h3>
                        <p>
                            By uploading or otherwise providing any designs, images, text, or other content to our Service for customization of products ("User Content"), you:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Represent and warrant that you own or have the necessary licenses, rights, consents, and permissions to use and authorize us to use the User Content as necessary to provide the Service to you.</li>
                            <li>Grant UniQVerse a non-exclusive, royalty-free, transferable, sub-licensable, worldwide license to use, reproduce, modify, publish, and display such User Content on our Service solely for the purpose of providing the Service to you.</li>
                            <li>Represent and warrant that your User Content does not violate any third-party intellectual property rights, including copyright, trademark, patent, trade secret, moral rights, privacy rights, rights of publicity, or any other intellectual property or proprietary rights.</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Prohibited Content</h3>
                        <p>
                            You may not upload or submit content that:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Infringes on any third-party intellectual property or other rights</li>
                            <li>Is unlawful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable</li>
                            <li>Contains hateful, discriminatory, or racially offensive material</li>
                            <li>Promotes illegal activities</li>
                            <li>Advertises or solicits business for products or services other than our own</li>
                        </ul>
                        <p>
                            We reserve the right, but have no obligation, to monitor, edit, or remove content that we determine in our sole discretion to be unlawful, offensive, threatening, libelous, defamatory, pornographic, obscene, or otherwise objectionable or violates any party's intellectual property or these Terms of Service.
                        </p>
                    </div>
                </div>

                {/* Prohibited Uses Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Prohibited Uses</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            You agree not to use the Service:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
                            <li>To impersonate or attempt to impersonate UniQVerse, a UniQVerse employee, another user, or any other person or entity</li>
                            <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which may harm UniQVerse or users of the Service or expose them to liability</li>
                            <li>To attempt to circumvent any security measures implemented on our website</li>
                            <li>To use any robot, spider, or other automatic device, process, or means to access the Service for any purpose, including monitoring or copying any of the material on the Service</li>
                            <li>To use the Service in any manner that could disable, overburden, damage, or impair the site or interfere with any other party's use of the Service</li>
                        </ul>
                    </div>
                </div>

                {/* Limitation of Liability Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            In no event shall UniQVerse, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Your access to or use of or inability to access or use the Service;</li>
                            <li>Any conduct or content of any third party on the Service;</li>
                            <li>Any content obtained from the Service; and</li>
                            <li>Unauthorized access, use or alteration of your transmissions or content,</li>
                        </ul>
                        <p>
                            whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.
                        </p>
                    </div>
                </div>

                {/* Disclaimer Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimer</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
                        </p>
                        <p>
                            UniQVerse, its subsidiaries, affiliates, and its licensors do not warrant that:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>The Service will function uninterrupted, secure, or available at any particular time or location;</li>
                            <li>Any errors or defects will be corrected;</li>
                            <li>The Service is free of viruses or other harmful components;</li>
                            <li>The results of using the Service will meet your requirements.</li>
                        </ul>
                    </div>
                </div>

                {/* Governing Law Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            These Terms shall be governed and construed in accordance with the laws of New York, United States, without regard to its conflict of law provisions.
                        </p>
                        <p>
                            Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service, and supersede and replace any prior agreements we might have between us regarding the Service.
                        </p>
                    </div>
                </div>

                {/* Changes to Terms Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                        </p>
                        <p>
                            By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
                        </p>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            If you have any questions about these Terms, please contact us:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>By email: legal@uniqverse.com</li>
                            <li>By mail: 123 Fashion Avenue, Suite 456, New York, NY 10001, United States</li>
                            <li>By phone: +1 (555) 123-4567</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfServicePage;