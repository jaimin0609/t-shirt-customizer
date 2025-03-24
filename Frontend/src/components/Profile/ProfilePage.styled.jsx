import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import withStyles from '../../styles/withStyles.jsx';
import styleSystem from '../../styles/styleSystem';
import { Link } from 'react-router-dom';
import { FiUser, FiShoppingBag, FiHeart, FiLogOut, FiBell, FiSettings } from 'react-icons/fi';

// Import our components
import ProfileInfo from './ProfileInfo.styled';
import ProfileNotification from './ProfileNotification.styled';
import PersonalInfoForm from './PersonalInfoForm';
import PasswordSection from './PasswordSection';
import ShippingAddressForm from './ShippingAddressForm';

// Import utilities
import {
    formatFullAddress,
    hasProfileDataChanged,
    createProfileUpdateData,
    createDisplayData
} from './profileUtils';

// Validation schema
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

const ProfilePageBase = ({ styles }) => {
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

    // Form submission handler
    const onSubmit = async (data) => {
        setIsLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            // Update profile information if changed
            if (hasProfileDataChanged(data, user)) {
                const updateData = createProfileUpdateData(data);

                try {
                    // Do the profile update
                    await updateProfile(updateData);

                    // Update display data without awaiting refresh
                    // This provides immediate feedback
                    const updatedDisplayData = createDisplayData(user, data);
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

    // Format the full address using our utility
    const getFormattedAddress = () => {
        // Try to get data from displayData first, then fall back to user
        const customer = displayData?.customer || user?.customer;
        return formatFullAddress(customer);
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
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Profile Settings</h1>

            {/* Profile Information */}
            <ProfileInfo
                userData={displayData || user}
                formatFullAddress={getFormattedAddress}
                onRefresh={forceRefresh}
                isLoading={isLoading}
            />

            {/* Notifications */}
            <ProfileNotification
                successMessage={successMessage}
                errorMessage={errorMessage}
            />

            {/* Profile Form */}
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                {/* Personal Information */}
                <PersonalInfoForm
                    register={register}
                    errors={errors}
                />

                {/* Password Section */}
                <PasswordSection
                    register={register}
                    errors={errors}
                    showPasswordSection={showPasswordSection}
                    setShowPasswordSection={setShowPasswordSection}
                    showCurrentPassword={showCurrentPassword}
                    setShowCurrentPassword={setShowCurrentPassword}
                    showNewPassword={showNewPassword}
                    setShowNewPassword={setShowNewPassword}
                    showConfirmPassword={showConfirmPassword}
                    setShowConfirmPassword={setShowConfirmPassword}
                />

                {/* Shipping Address Form */}
                <ShippingAddressForm
                    register={register}
                    errors={errors}
                    setValue={setValue}
                    user={user}
                />

                {/* Submit Button */}
                <div className={styles.formActions}>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={styles.submitButton}
                    >
                        {isLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default withStyles(ProfilePageBase, (theme) => ({
    container: `
    max-w-2xl 
    mx-auto 
    p-4
  `,
    pageTitle: `
    text-3xl 
    font-bold 
    mb-8
  `,
    form: `
    space-y-6
  `,
    formActions: `
    flex 
    items-center 
    justify-between
  `,
    submitButton: `
    bg-blue-500 
    hover:bg-blue-700 
    text-white 
    font-bold 
    py-2 
    px-4 
    rounded 
    focus:outline-none 
    focus:shadow-outline
    disabled:opacity-50 
    disabled:cursor-not-allowed
  `,
})); 