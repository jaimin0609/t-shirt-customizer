import { Link } from 'react-router-dom';

const Navigation = ({ mobile }) => {
    const navClasses = mobile
        ? "flex flex-col space-y-4"
        : "flex space-x-6";

    return (
        <nav className={navClasses}>
            <Link to="/" className="text-gray-700 hover:text-gray-900">
                Home
            </Link>
            <Link to="/orders" className="text-gray-700 hover:text-gray-900">
                Orders
            </Link>
            <a href="#" className="text-gray-700 hover:text-primary">
                Design
            </a>
            <a href="#" className="text-gray-700 hover:text-primary">
                Gallery
            </a>
            <a href="#" className="text-gray-700 hover:text-primary">
                Contact
            </a>
        </nav>
    );
};

export default Navigation; 