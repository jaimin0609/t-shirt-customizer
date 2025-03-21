import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaEye, FaEyeSlash, FaUser, FaPhone, FaMapMarkerAlt, FaEnvelope } from 'react-icons/fa';
import AddressAutocomplete from '../Common/AddressAutocomplete';
import ProfilePageStyled from './ProfilePage.styled';

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

// This is a forwarding component that uses the styled ProfilePage
const ProfilePage = () => {
    return <ProfilePageStyled />;
};

export default ProfilePage; 