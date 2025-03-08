import { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AddressAutocomplete from '../Common/AddressAutocomplete';

// Replace with your Stripe publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_sample');

const addressSchema = yup.object().shape({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    phone: yup.string().required('Phone number is required'),
    address: yup.string().required('Address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    zipCode: yup.string().required('Zip code is required'),
    country: yup.string().required('Country is required'),
    useDefaultAddress: yup.boolean(),
    saveAsDefault: yup.boolean()
});

const CheckoutForm = ({ totalAmount, shippingAddress, finalizeCheckout }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const { cart, clearCart, createOrder } = useCart();
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        if (!stripe || !elements) {
            return;
        }

        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: elements.getElement(CardElement),
            billing_details: {
                email: shippingAddress.email,
                name: shippingAddress.name,
                phone: shippingAddress.phone,
                address: {
                    line1: shippingAddress.address,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    postal_code: shippingAddress.zipCode,
                    country: shippingAddress.country
                }
            },
        });

        if (error) {
            setError(error.message);
            setProcessing(false);
            return;
        }

        try {
            // Call the passed in finalize checkout function
            await finalizeCheckout(paymentMethod);
        } catch (err) {
            setError('An error occurred while processing your payment.');
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border rounded-md p-4">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                    }}
                />
            </div>

            {error && (
                <div className="text-red-600 text-sm">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || processing}
                className={`w-full py-2 px-4 rounded-md text-white font-medium
                    ${processing || !stripe
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {processing ? 'Processing...' : `Pay $${parseFloat(totalAmount).toFixed(2)}`}
            </button>
        </form>
    );
};

const CheckoutPage = () => {
    const { cart, appliedCoupon, clearCart, createOrder } = useCart();
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [useDefaultAddress, setUseDefaultAddress] = useState(true);
    const [saveAsDefault, setSaveAsDefault] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
        resolver: yupResolver(addressSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.customer?.phone || '',
            address: user?.customer?.address || '',
            city: user?.customer?.city || '',
            state: user?.customer?.state || '',
            zipCode: user?.customer?.zipCode || '',
            country: user?.customer?.country || '',
            useDefaultAddress: true,
            saveAsDefault: false
        }
    });

    // Update form when user data changes or when useDefaultAddress changes
    useEffect(() => {
        if (user && useDefaultAddress) {
            reset({
                name: user.name || '',
                email: user.email || '',
                phone: user?.customer?.phone || '',
                address: user?.customer?.address || '',
                city: user?.customer?.city || '',
                state: user?.customer?.state || '',
                zipCode: user?.customer?.zipCode || '',
                country: user?.customer?.country || '',
                useDefaultAddress: true,
                saveAsDefault: saveAsDefault
            });
        }
    }, [user, useDefaultAddress, reset, saveAsDefault]);

    // Watch the useDefaultAddress field
    const watchUseDefaultAddress = watch('useDefaultAddress');

    // Update state when the checkbox changes
    useEffect(() => {
        setUseDefaultAddress(watchUseDefaultAddress);
    }, [watchUseDefaultAddress]);

    const watchSaveAsDefault = watch('saveAsDefault');

    // Handle save as default address
    useEffect(() => {
        setSaveAsDefault(watchSaveAsDefault);
    }, [watchSaveAsDefault]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (cart.length === 0) {
            navigate('/');
            return;
        }
    }, [user, cart, navigate]);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const shipping = 5.99;

    // Apply coupon discount if available
    const discountAmount = appliedCoupon ? parseFloat(appliedCoupon.discountAmount) : 0;
    const discountedSubtotal = appliedCoupon ? parseFloat(appliedCoupon.newTotal) : subtotal;

    // Calculate final total with tax and shipping
    const total = discountedSubtotal + tax + shipping;

    const finalizeCheckout = async (stripePaymentMethod) => {
        // 1. Get shipping address data
        const shippingAddress = useDefaultAddress ? {
            name: user?.name,
            email: user?.email,
            phone: user?.customer?.phone,
            address: user?.customer?.address,
            city: user?.customer?.city,
            state: user?.customer?.state,
            zipCode: user?.customer?.zipCode,
            country: user?.customer?.country
        } : {
            name: watch('name'),
            email: watch('email'),
            phone: watch('phone'),
            address: watch('address'),
            city: watch('city'),
            state: watch('state'),
            zipCode: watch('zipCode'),
            country: watch('country')
        };

        // 2. Create the order with shipping address
        const order = createOrder(shippingAddress);

        // 3. Save as default if selected and not using default address
        if (!useDefaultAddress && saveAsDefault) {
            try {
                // Update user profile with new address as default
                await updateProfile({
                    name: user.name,
                    email: user.email,
                    phone: shippingAddress.phone,
                    address: shippingAddress.address,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    zipCode: shippingAddress.zipCode,
                    country: shippingAddress.country,
                    isDefaultShippingAddress: true
                });
            } catch (error) {
                console.error("Failed to save address as default", error);
                // Continue with checkout even if saving fails
            }
        }

        // 4. Clear cart and navigate to order confirmation
        clearCart();
        navigate('/orders', {
            state: {
                success: true,
                message: 'Payment successful! Your order has been placed.'
            }
        });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-8">Checkout</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                            <div className="space-y-4">
                                {cart.map((item) => (
                                    <div key={`${item.productId}-${item.color}-${item.size}`}
                                        className="flex items-center gap-4 border-b pb-4">
                                        <div className="w-20 h-20 bg-gray-100 rounded">
                                            {item.thumbnail && (
                                                <img
                                                    src={item.thumbnail}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover rounded"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium">{item.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                Color: {item.color}, Size: {item.size}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Quantity: {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">
                                                ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                <div className="space-y-2 pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal</span>
                                        <span>${parseFloat(subtotal).toFixed(2)}</span>
                                    </div>

                                    {/* Show coupon discount if applied */}
                                    {appliedCoupon && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Discount ({appliedCoupon.code})</span>
                                            <span>-${discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-sm">
                                        <span>Tax</span>
                                        <span>${parseFloat(tax).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Shipping</span>
                                        <span>${parseFloat(shipping).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-2 border-t">
                                        <span>Total</span>
                                        <span>${parseFloat(total).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Section */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>

                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        {...register('useDefaultAddress')}
                                        className="mr-2"
                                    />
                                    <span className="text-gray-700">Use default shipping address</span>
                                </label>
                            </div>

                            {useDefaultAddress && (
                                <div className="bg-gray-50 p-4 border rounded mb-4">
                                    <h3 className="font-medium text-gray-700 mb-2">Default Address</h3>
                                    <div className="space-y-1">
                                        <p className="text-gray-800">{user?.name}</p>
                                        <p className="text-gray-800">{user?.email}</p>
                                        <p className="text-gray-800">{user?.customer?.phone || 'No phone number'}</p>
                                        <p className="text-gray-800">{user?.customer?.address || 'No address'}</p>
                                        <p className="text-gray-800">
                                            {[
                                                user?.customer?.city,
                                                user?.customer?.state,
                                                user?.customer?.zipCode
                                            ].filter(Boolean).join(', ')}
                                        </p>
                                        <p className="text-gray-800">{user?.customer?.country}</p>
                                    </div>
                                </div>
                            )}

                            {!useDefaultAddress && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                                Full Name
                                            </label>
                                            <input
                                                {...register('name')}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                type="text"
                                                disabled={useDefaultAddress}
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
                                                disabled={useDefaultAddress}
                                            />
                                            {errors.email && (
                                                <p className="text-red-500 text-xs italic">{errors.email.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            {...register('phone')}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            type="tel"
                                            disabled={useDefaultAddress}
                                        />
                                        {errors.phone && (
                                            <p className="text-red-500 text-xs italic">{errors.phone.message}</p>
                                        )}
                                    </div>

                                    <div>
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
                                            disabled={useDefaultAddress}
                                            error={!!errors.address}
                                        />
                                        {/* Hidden input to register the address field with React Hook Form */}
                                        <input type="hidden" {...register('address')} />
                                        {errors.address && (
                                            <p className="text-red-500 text-xs italic">{errors.address.message}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                                City
                                            </label>
                                            <input
                                                {...register('city')}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                type="text"
                                                disabled={useDefaultAddress}
                                            />
                                            {errors.city && (
                                                <p className="text-red-500 text-xs italic">{errors.city.message}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                                State/Province
                                            </label>
                                            <input
                                                {...register('state')}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                type="text"
                                                disabled={useDefaultAddress}
                                            />
                                            {errors.state && (
                                                <p className="text-red-500 text-xs italic">{errors.state.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                                Zip/Postal Code
                                            </label>
                                            <input
                                                {...register('zipCode')}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                type="text"
                                                disabled={useDefaultAddress}
                                            />
                                            {errors.zipCode && (
                                                <p className="text-red-500 text-xs italic">{errors.zipCode.message}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                                Country
                                            </label>
                                            <input
                                                {...register('country')}
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                type="text"
                                                disabled={useDefaultAddress}
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
                                                {...register('saveAsDefault')}
                                                className="mr-2"
                                                disabled={useDefaultAddress}
                                            />
                                            <span className="text-gray-700">Save as default shipping address</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
                            <Elements stripe={stripePromise}>
                                <CheckoutForm
                                    totalAmount={total}
                                    shippingAddress={useDefaultAddress ? {
                                        name: user?.name,
                                        email: user?.email,
                                        phone: user?.customer?.phone,
                                        address: user?.customer?.address,
                                        city: user?.customer?.city,
                                        state: user?.customer?.state,
                                        zipCode: user?.customer?.zipCode,
                                        country: user?.customer?.country
                                    } : {
                                        name: watch('name'),
                                        email: watch('email'),
                                        phone: watch('phone'),
                                        address: watch('address'),
                                        city: watch('city'),
                                        state: watch('state'),
                                        zipCode: watch('zipCode'),
                                        country: watch('country')
                                    }}
                                    finalizeCheckout={finalizeCheckout}
                                />
                            </Elements>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage; 