import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaEye, FaEyeSlash, FaUser, FaPhone, FaMapMarkerAlt, FaEnvelope } from 'react-icons/fa';
import AddressAutocomplete from '../Common/AddressAutocomplete';

const schema = yup.object().shape({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    phone: yup.string().nullable(),
    address: yup.string().nullable(),
    city: yup.string().nullable(),
    state: yup.string().nullable(),
    zipCode: yup.string().nullable(),
    country: yup.string().nullable(),
    isDefaultShippingAddress: yup.boolean(),
    currentPassword: yup.string()
        .test('password-required', 'Current password is required when changing password', function (value) {
            const { newPassword, confirmNewPassword } = this.parent;
            if (newPassword || confirmNewPassword) {
                return !!value;
            }
            return true;
        })
        .test('min-length', 'Password must be at least 6 characters', function (value) {
            if (value) {
                return value.length >= 6;
            }
            return true;
        }),
    newPassword: yup.string()
        .test('password-required', 'New password must be at least 6 characters', function (value) {
            if (value) {
                return value.length >= 6;
            }
            return true;
        }),
    confirmNewPassword: yup.string()
        .test('passwords-match', 'Passwords must match', function (value) {
            const { newPassword } = this.parent;
            if (newPassword) {
                return value === newPassword;
            }
            return true;
        }),
});

const ProfilePage = () => {
    const { user, updateProfile, updatePassword, refreshUser } = useAuth();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [displayData, setDisplayData] = useState(null);

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.customer?.phone || '',
            address: user?.customer?.address || '',
            city: user?.customer?.city || '',
            state: user?.customer?.state || '',
            zipCode: user?.customer?.zipCode || '',
            country: user?.customer?.country || '',
            isDefaultShippingAddress: user?.customer?.isDefaultShippingAddress !== false,
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
        },
    });

    // Update form when user data changes
    useEffect(() => {
        if (user) {
            console.log('User data in ProfilePage useEffect:', user);
            setDisplayData(user);
            reset({
                name: user.name || '',
                email: user.email || '',
                phone: user?.customer?.phone || '',
                address: user?.customer?.address || '',
                city: user?.customer?.city || '',
                state: user?.customer?.state || '',
                zipCode: user?.customer?.zipCode || '',
                country: user?.customer?.country || '',
                isDefaultShippingAddress: user?.customer?.isDefaultShippingAddress !== false,
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            });
        }
    }, [user, reset]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        console.log('Form data being submitted:', data);
        console.log('Current user data before update:', user);

        try {
            // Store original user data for fallback
            const originalUserData = user;

            // Update profile information first
            if (data.name !== user?.name ||
                data.email !== user?.email ||
                data.phone !== user?.customer?.phone ||
                data.address !== user?.customer?.address ||
                data.city !== user?.customer?.city ||
                data.state !== user?.customer?.state ||
                data.zipCode !== user?.customer?.zipCode ||
                data.country !== user?.customer?.country ||
                data.isDefaultShippingAddress !== user?.customer?.isDefaultShippingAddress) {

                const updateData = {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    zipCode: data.zipCode,
                    country: data.country,
                    isDefaultShippingAddress: data.isDefaultShippingAddress
                };

                console.log('Sending update with data:', updateData);

                try {
                    // Do the profile update
                    await updateProfile(updateData);

                    // Update display data without awaiting refresh
                    // This provides immediate feedback
                    const updatedDisplayData = {
                        ...user,
                        name: data.name,
                        email: data.email,
                        customer: {
                            ...(user?.customer || {}),
                            phone: data.phone,
                            address: data.address,
                            city: data.city,
                            state: data.state,
                            zipCode: data.zipCode,
                            country: data.country,
                            isDefaultShippingAddress: data.isDefaultShippingAddress
                        }
                    };
                    setDisplayData(updatedDisplayData);

                    // Set success message for profile
                    setSuccessMessage('Profile updated successfully');

                    // Try to refresh user data in the background
                    setTimeout(() => {
                        refreshUser().catch(err => {
                            console.error('Background refresh error:', err);
                            // Don't show this error to the user
                        });
                    }, 500);
                } catch (updateError) {
                    console.error('Profile update error:', updateError);
                    setErrorMessage(updateError.message || 'Failed to update profile');
                    setIsLoading(false);
                    return; // Don't proceed with password update if profile failed
                }
            }

            // Handle password update separately
            if (data.currentPassword && data.newPassword && data.confirmNewPassword) {
                try {
                    await updatePassword(data.currentPassword, data.newPassword);

                    // Reset password fields after successful update
                    setValue('currentPassword', '');
                    setValue('newPassword', '');
                    setValue('confirmNewPassword', '');

                    setSuccessMessage(prev =>
                        prev ? `${prev}. Password updated successfully.` : 'Password updated successfully'
                    );
                } catch (passwordError) {
                    console.error('Password update error:', passwordError);
                    setErrorMessage(passwordError.message || 'Failed to update password');
                }
            }
        } catch (error) {
            console.error('General form error:', error);
            setErrorMessage(error.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Format the full address for display
    const formatFullAddress = () => {
        // Try to get data from displayData first, then fall back to user
        const customer = displayData?.customer || user?.customer;

        if (!customer) return 'No address on file';

        const parts = [
            customer.address,
            customer.city,
            customer.state,
            customer.zipCode,
            customer.country
        ].filter(Boolean);

        return parts.length ? parts.join(', ') : 'No address on file';
    };

    // Complete refresh function to force reload user data
    const forceRefresh = async () => {
        setIsLoading(true);
        try {
            const refreshedUser = await refreshUser();
            setDisplayData(refreshedUser);
            setSuccessMessage('Profile data refreshed');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setErrorMessage('Failed to refresh profile data');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

            {/* Display current profile information */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Current Profile Information</h2>
                    <button
                        onClick={forceRefresh}
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
                                <span className="text-gray-800">{displayData?.name || user?.name || 'Not set'}</span>
                            </div>
                            <div className="flex items-center">
                                <FaEnvelope className="text-gray-500 mr-2" />
                                <span className="text-gray-800">{displayData?.email || user?.email || 'Not set'}</span>
                            </div>
                            <div className="flex items-center">
                                <FaPhone className="text-gray-500 mr-2" />
                                <span className="text-gray-800">{displayData?.customer?.phone || user?.customer?.phone || 'Not set'}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-700 mb-2">
                            {(displayData?.customer?.isDefaultShippingAddress !== false || user?.customer?.isDefaultShippingAddress !== false)
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

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Name
                    </label>
                    <input
                        {...register('name')}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                    />
                    {errors.name && (
                        <p className="text-red-500 text-xs italic">{errors.name.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Email
                    </label>
                    <input
                        {...register('email')}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type="email"
                    />
                    {errors.email && (
                        <p className="text-red-500 text-xs italic">{errors.email.message}</p>
                    )}
                </div>

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

                <div className="border-t pt-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Phone Number
                        </label>
                        <input
                            {...register('phone')}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="tel"
                        />
                        {errors.phone && (
                            <p className="text-red-500 text-xs italic">{errors.phone.message}</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Address
                        </label>
                        <AddressAutocomplete
                            defaultValue={user?.customer?.address || ''}
                            placeholder="Enter your address"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            onPlaceSelected={(place) => {
                                // Update form values with selected address data
                                setValue('address', place.address || place.formattedAddress);
                                setValue('city', place.city);
                                setValue('state', place.state);
                                setValue('zipCode', place.zipCode);
                                setValue('country', place.country);
                            }}
                            error={!!errors.address}
                        />
                        {/* Hidden input to register the address field with React Hook Form */}
                        <input type="hidden" {...register('address')} />
                        {errors.address && (
                            <p className="text-red-500 text-xs italic">{errors.address.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                City
                            </label>
                            <input
                                {...register('city')}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="text"
                            />
                            {errors.city && (
                                <p className="text-red-500 text-xs italic">{errors.city.message}</p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                State/Province
                            </label>
                            <input
                                {...register('state')}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="text"
                            />
                            {errors.state && (
                                <p className="text-red-500 text-xs italic">{errors.state.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Zip/Postal Code
                            </label>
                            <input
                                {...register('zipCode')}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="text"
                            />
                            {errors.zipCode && (
                                <p className="text-red-500 text-xs italic">{errors.zipCode.message}</p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Country
                            </label>
                            <input
                                {...register('country')}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="text"
                            />
                            {errors.country && (
                                <p className="text-red-500 text-xs italic">{errors.country.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                {...register('isDefaultShippingAddress')}
                                className="mr-2"
                            />
                            <span className="text-gray-700">Use as default shipping address</span>
                        </label>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {isLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage; 