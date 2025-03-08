import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
                        <p>Email: support@tshirtcustomizer.com</p>
                        <p>Phone: (555) 123-4567</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
                        <div className="flex space-x-4">
                            <FaFacebook size={24} />
                            <FaTwitter size={24} />
                            <FaInstagram size={24} />
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-gray-400">
                            © 2024 T-Shirt Customizer. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 