import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const PrivacyPolicyPage = () => {
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Page Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                <div className="flex justify-center mb-4">
                    <ShieldCheckIcon className="h-16 w-16 text-blue-600" />
                </div>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    At UniQVerse, we're committed to protecting your privacy and ensuring you have a positive experience on our website.
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
                            This Privacy Policy explains how UniQVerse ("we," "us," or "our") collects, uses, shares, and protects information in relation to our website, services, and your choices about the collection and use of your information.
                        </p>
                        <p>
                            By using our website, you agree to the collection and use of information in accordance with this policy. We collect and use personal information solely for providing and improving our services. We will not use or share your information with anyone except as described in this Privacy Policy.
                        </p>
                    </div>
                </div>

                {/* Information We Collect Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            We collect several different types of information for various purposes to provide and improve our service to you:
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Personal Information</h3>
                        <p>
                            When you create an account, place an order, subscribe to our newsletter, or contact us, we may ask for your:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Name</li>
                            <li>Email address</li>
                            <li>Shipping and billing address</li>
                            <li>Phone number</li>
                            <li>Payment information (credit card numbers, PayPal email, etc.)</li>
                            <li>Custom design files and preferences</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Usage Data</h3>
                        <p>
                            We may also collect information on how you access and use our website, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Your computer's Internet Protocol address (IP address)</li>
                            <li>Browser type and version</li>
                            <li>The pages you visit on our website</li>
                            <li>The time and date of your visit</li>
                            <li>Time spent on pages</li>
                            <li>Device information</li>
                            <li>Unique device identifiers</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Cookies and Tracking Technologies</h3>
                        <p>
                            We use cookies and similar tracking technologies to track activity on our website and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
                        </p>
                        <p>
                            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
                        </p>
                    </div>
                </div>

                {/* How We Use Your Information Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            We use the information we collect for various purposes, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To provide and maintain our service</li>
                            <li>To process and fulfill your orders</li>
                            <li>To notify you about changes to our service</li>
                            <li>To provide customer support</li>
                            <li>To process payments and prevent fraud</li>
                            <li>To personalize your experience</li>
                            <li>To gather analysis or valuable information so that we can improve our service</li>
                            <li>To monitor the usage of our service</li>
                            <li>To detect, prevent, and address technical issues</li>
                            <li>To communicate with you about products, services, offers, promotions, and events</li>
                        </ul>
                    </div>
                </div>

                {/* Sharing Your Information Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Sharing Your Information</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            We may share your personal information in the following situations:
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">With Service Providers</h3>
                        <p>
                            We may share your information with third-party service providers to facilitate our service, provide the service on our behalf, perform service-related activities, or assist us in analyzing how our service is used. These third parties have access to your personal information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                        </p>
                        <p>
                            Examples include payment processors, shipping carriers, and email service providers.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">For Business Transfers</h3>
                        <p>
                            If we are involved in a merger, acquisition, or asset sale, your personal information may be transferred. We will provide notice before your personal information is transferred and becomes subject to a different Privacy Policy.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">With Your Consent</h3>
                        <p>
                            We may disclose your personal information for any other purpose with your consent.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">For Legal Requirements</h3>
                        <p>
                            We may disclose your information where required to do so by law or subpoena or if we believe that such action is necessary to comply with the law and the reasonable requests of law enforcement or to protect the security or integrity of our service.
                        </p>
                    </div>
                </div>

                {/* Data Security Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
                        </p>
                        <p>
                            We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>All sensitive information is transmitted via Secure Socket Layer (SSL) technology</li>
                            <li>All payment information is encrypted through the Payment Card Industry Data Security Standard (PCI-DSS)</li>
                            <li>We regularly update our systems and practices to enhance security</li>
                            <li>We restrict access to personal information to employees, contractors, and agents who need to know that information to process it for us</li>
                        </ul>
                    </div>
                </div>

                {/* Your Rights and Choices Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights and Choices</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            You have certain rights regarding your personal information, including:
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Access and Update</h3>
                        <p>
                            You can review and update your account information by logging into your account settings.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Data Deletion</h3>
                        <p>
                            You may request deletion of your personal information by contacting us. We will respond to your request within a reasonable timeframe. Please note that we may retain certain information as required by law or for legitimate business purposes.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Marketing Communications</h3>
                        <p>
                            You can opt out of receiving marketing emails from us by clicking the "unsubscribe" link in the emails. Even if you opt out of marketing communications, we will still send you transactional emails—such as order confirmations and customer service notifications.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Cookies</h3>
                        <p>
                            Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our website.
                        </p>
                    </div>
                </div>

                {/* Children's Privacy Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            Our service is not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us. If we become aware that we have collected personal information from children without verification of parental consent, we take steps to remove that information from our servers.
                        </p>
                    </div>
                </div>

                {/* Changes to Privacy Policy Section */}
                <div className="p-8 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy.
                        </p>
                        <p>
                            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                        </p>
                    </div>
                </div>

                {/* Contact Us Section */}
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                    <div className="prose prose-lg max-w-none text-gray-600">
                        <p>
                            If you have any questions about this Privacy Policy, please contact us:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>By email: privacy@uniqverse.com</li>
                            <li>By mail: 123 Fashion Avenue, Suite 456, New York, NY 10001, United States</li>
                            <li>By phone: +1 (555) 123-4567</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage; 