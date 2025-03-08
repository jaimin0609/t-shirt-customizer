import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const AddressAutocomplete = ({
    onPlaceSelected,
    defaultValue = '',
    placeholder = 'Enter your address',
    className = '',
    disabled = false,
    required = false,
    error = false
}) => {
    const autocompleteInputRef = useRef(null);
    const autocompleteRef = useRef(null);

    useEffect(() => {
        // Load Google Maps API script
        const loadGoogleMapsAPI = () => {
            // Check if API is already loaded
            if (window.google && window.google.maps && window.google.maps.places) {
                initAutocomplete();
                return;
            }

            // Get API key from environment
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

            // If no API key provided, use a fallback input
            if (!apiKey) {
                console.warn('Google Maps API key not found. Address autocomplete disabled.');
                return;
            }

            // Load the Google Maps API script
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = initAutocomplete;
            script.onerror = () => console.error('Failed to load Google Maps API script');
            document.head.appendChild(script);

            return () => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            };
        };

        loadGoogleMapsAPI();
    }, []);

    const initAutocomplete = () => {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            return;
        }

        // Initialize the Google Places Autocomplete
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
            autocompleteInputRef.current,
            { types: ['address'] }
        );

        // Add listener for place changed
        autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    };

    const handlePlaceSelect = () => {
        if (!autocompleteRef.current) return;

        const place = autocompleteRef.current.getPlace();

        if (!place || !place.address_components) {
            return;
        }

        // Extract address components
        let address = '';
        let city = '';
        let state = '';
        let zipCode = '';
        let country = '';

        for (const component of place.address_components) {
            const componentType = component.types[0];

            switch (componentType) {
                case 'street_number':
                    address = `${component.long_name} `;
                    break;
                case 'route':
                    address += component.long_name;
                    break;
                case 'locality':
                    city = component.long_name;
                    break;
                case 'administrative_area_level_1':
                    state = component.short_name;
                    break;
                case 'postal_code':
                    zipCode = component.long_name;
                    break;
                case 'country':
                    country = component.long_name;
                    break;
                default:
                    break;
            }
        }

        // Call callback with place data
        onPlaceSelected({
            address,
            city,
            state,
            zipCode,
            country,
            formattedAddress: place.formatted_address
        });
    };

    return (
        <input
            ref={autocompleteInputRef}
            type="text"
            placeholder={placeholder}
            className={`${className} ${error ? 'border-red-500' : ''}`}
            defaultValue={defaultValue}
            disabled={disabled}
            required={required}
        />
    );
};

AddressAutocomplete.propTypes = {
    onPlaceSelected: PropTypes.func.isRequired,
    defaultValue: PropTypes.string,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    error: PropTypes.bool
};

export default AddressAutocomplete; 