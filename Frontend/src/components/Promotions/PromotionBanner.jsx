import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../config/api';
import { XMarkIcon } from '@heroicons/react/24/solid';
import './PromotionBanner.css';

const PromotionBanner = () => {
    const [publicCoupons, setPublicCoupons] = useState([]);
    const [currentCouponIndex, setCurrentCouponIndex] = useState(0);
    const [isBannerVisible, setIsBannerVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState(false);

    // Set to false to use real coupons from database (default for production)
    const DEV_MODE = false;

    // Ref to store the banner element
    const bannerRef = useRef(null);

    useEffect(() => {
        const checkDismissalState = () => {
            const dismissedUntil = localStorage.getItem('promotionBannerDismissedUntil');
            if (dismissedUntil && new Date(dismissedUntil) > new Date()) {
                return false;
            }
            return true;
        };

        const fetchPublicCoupons = async () => {
            try {
                const response = await fetch(`${API_URL}/coupons/public`);

                if (response.status === 404) {
                    setPublicCoupons([]);
                    setIsLoading(false);
                    return;
                }

                if (!response.ok) {
                    throw new Error(`Status: ${response.status}`);
                }

                const data = await response.json();

                if (Array.isArray(data) && data.length > 0) {
                    setPublicCoupons(data);
                    setIsBannerVisible(checkDismissalState());
                } else {
                    setPublicCoupons([]);
                }
            } catch (error) {
                console.error('Error fetching public coupons:', error);

                // Try debug endpoint as fallback
                try {
                    const debugResponse = await fetch(`${API_URL}/debug/coupons/public`);
                    if (debugResponse.ok) {
                        const debugData = await debugResponse.json();
                        if (Array.isArray(debugData) && debugData.length > 0) {
                            setPublicCoupons(debugData);
                            setIsBannerVisible(checkDismissalState());
                            return;
                        }
                    }
                } catch (debugError) {
                    console.error('Debug endpoints failed:', debugError);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchPublicCoupons();
    }, []);

    // Debug mode effect to force showing a test coupon only in development mode
    useEffect(() => {
        if (DEV_MODE) {
            const testCoupon = {
                id: 'dev-test',
                code: 'TEST20',
                discountValue: 20,
                bannerColor: '#ff4081',
                bannerText: '🔥 DEV MODE: Test banner with 20% discount. Use code TEST20!'
            };
            setPublicCoupons([testCoupon]);
            setIsBannerVisible(true);
            setIsLoading(false);
        }
    }, [DEV_MODE]);

    // Reset copied state after 2 seconds
    useEffect(() => {
        if (copiedCode) {
            const timer = setTimeout(() => setCopiedCode(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copiedCode]);

    // Rotate coupons if there are multiple
    useEffect(() => {
        if (publicCoupons.length > 1) {
            const rotationInterval = setInterval(() => {
                setCurrentCouponIndex((prevIndex) =>
                    (prevIndex + 1) % publicCoupons.length
                );
            }, 5000);

            return () => clearInterval(rotationInterval);
        }
    }, [publicCoupons]);

    const copyCodeToClipboard = (code) => {
        if (!code) return;

        navigator.clipboard.writeText(code)
            .then(() => {
                setCopiedCode(true);
            })
            .catch(err => {
                console.error('Failed to copy code:', err);
            });
    };

    const dismissBanner = () => {
        setIsBannerVisible(false);

        // Store dismissal in localStorage for 24 hours
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);
        localStorage.setItem('promotionBannerDismissedUntil', tomorrow.toISOString());
    };

    if (isLoading || !isBannerVisible || publicCoupons.length === 0) {
        return null;
    }

    const currentCoupon = publicCoupons[currentCouponIndex];

    // Fix any missing banner text or replace {code} placeholder
    if (!currentCoupon.bannerText) {
        currentCoupon.bannerText = `🎁 Special offer! Use code ${currentCoupon.code} for a discount on your order!`;
    } else if (currentCoupon.bannerText.includes('{code}')) {
        currentCoupon.bannerText = currentCoupon.bannerText.replace('{code}', currentCoupon.code);
    }

    const bannerStyle = {
        backgroundColor: currentCoupon.bannerColor || '#4caf50'
    };

    return (
        <div
            ref={bannerRef}
            className="promotion-banner"
            style={bannerStyle}
            data-testid="promotion-banner"
        >
            <div className="banner-content">
                <span className="banner-text">{currentCoupon.bannerText}</span>
                <span
                    className="coupon-code"
                    onClick={() => copyCodeToClipboard(currentCoupon.code)}
                    title="Click to copy to clipboard"
                >
                    {copiedCode ? "✓ Copied!" : (currentCoupon.code && `Code: ${currentCoupon.code}`)}
                </span>
            </div>
            <button
                className="dismiss-button"
                onClick={dismissBanner}
                aria-label="Dismiss promotion"
            >
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

export default PromotionBanner; 