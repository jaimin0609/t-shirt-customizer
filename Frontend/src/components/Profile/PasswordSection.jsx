import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

/**
 * Section for changing the user's password
 */
const PasswordSection = ({
    register,
    errors,
    showPasswordSection,
    setShowPasswordSection,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword
}) => {
    return (
        <div className="border-t pt-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Change Password</h2>
                <button
                    type="button"
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded text-sm"
                >
                    {showPasswordSection ? 'Hide' : 'Show'}
                </button>
            </div>

            {showPasswordSection && (
                <>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                {...register('currentPassword')}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type={showCurrentPassword ? 'text' : 'password'}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {errors.currentPassword && (
                            <p className="text-red-500 text-xs italic">{errors.currentPassword.message}</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                {...register('newPassword')}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type={showNewPassword ? 'text' : 'password'}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {errors.newPassword && (
                            <p className="text-red-500 text-xs italic">{errors.newPassword.message}</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                {...register('confirmNewPassword')}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type={showConfirmPassword ? 'text' : 'password'}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {errors.confirmNewPassword && (
                            <p className="text-red-500 text-xs italic">{errors.confirmNewPassword.message}</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default PasswordSection; 