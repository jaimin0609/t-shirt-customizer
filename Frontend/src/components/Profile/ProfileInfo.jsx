import React from 'react';
import { FaUser, FaPhone, FaMapMarkerAlt, FaEnvelope } from 'react-icons/fa';

/**
 * Displays the current profile information
 */
const ProfileInfo = ({ userData, formatFullAddress, onRefresh, isLoading }) => {
    return (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Current Profile Information</h2>
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded text-sm flex items-center"
                >
                    {isLoading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h3 className="font-medium text-gray-700 mb-2">Personal Information</h3>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <FaUser className="text-gray-500 mr-2" />
                            <span className="text-gray-800">{userData?.name || 'Not set'}</span>
                        </div>
                        <div className="flex items-center">
                            <FaEnvelope className="text-gray-500 mr-2" />
                            <span className="text-gray-800">{userData?.email || 'Not set'}</span>
                        </div>
                        <div className="flex items-center">
                            <FaPhone className="text-gray-500 mr-2" />
                            <span className="text-gray-800">{userData?.customer?.phone || 'Not set'}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-medium text-gray-700 mb-2">
                        {(userData?.customer?.isDefaultShippingAddress !== false)
                            ? 'Default Shipping Address'
                            : 'Shipping Address'}
                    </h3>
                    <div className="flex items-start">
                        <FaMapMarkerAlt className="text-gray-500 mr-2 mt-1" />
                        <span className="text-gray-800">{formatFullAddress()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileInfo; 