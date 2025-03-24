import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Component for displaying and submitting product reviews
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.reviews - Array of product reviews
 * @param {number} props.averageRating - Average product rating
 * @param {Function} props.onSubmitReview - Function to handle review submission
 * @param {boolean} props.isSubmitting - Whether a review submission is in progress
 * @param {string} props.error - Error message if submission failed
 */
const ProductReviews = ({
    reviews = [],
    averageRating = 0,
    onSubmitReview,
    isSubmitting = false,
    error = null
}) => {
    const { user, isAuthenticated } = useAuth();
    const [reviewText, setReviewText] = useState('');
    const [rating, setRating] = useState(5);

    const handleReviewChange = (e) => {
        setReviewText(e.target.value);
    };

    const handleRatingChange = (newRating) => {
        setRating(newRating);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmitReview({ text: reviewText, rating });

        // Only clear form if not showing loading state to prevent UI flickering
        if (!isSubmitting) {
            setReviewText('');
            setRating(5);
        }
    };

    // Calculate review statistics
    const reviewCount = reviews.length;
    const reviewStats = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length,
    };

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Customer Reviews</h3>

            {/* Review Summary */}
            <div className="flex items-center mb-4">
                <div className="flex items-center mr-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                            key={star}
                            className={`w-5 h-5 ${star <= Math.round(averageRating)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                        />
                    ))}
                </div>
                <span className="text-lg font-medium">
                    {averageRating.toFixed(1)} out of 5
                </span>
                <span className="text-gray-500 ml-2">
                    ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2 mb-6">
                {[5, 4, 3, 2, 1].map(rating => {
                    const count = reviewStats[rating];
                    const percentage = reviewCount ? Math.round((count / reviewCount) * 100) : 0;

                    return (
                        <div key={rating} className="flex items-center">
                            <span className="w-10 text-sm text-gray-600">{rating} star</span>
                            <div className="flex-1 h-4 mx-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-400"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                            <span className="w-10 text-sm text-gray-600">{percentage}%</span>
                        </div>
                    );
                })}
            </div>

            {/* Write a Review */}
            {isAuthenticated ? (
                <div className="mt-6 border rounded-md p-4">
                    <h4 className="text-lg font-medium mb-2">Write a Review</h4>
                    <form onSubmit={handleSubmit}>
                        {/* Star Rating Input */}
                        <div className="flex items-center mb-3">
                            <span className="text-sm text-gray-600 mr-2">Your rating:</span>
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleRatingChange(star)}
                                        className="focus:outline-none"
                                    >
                                        <StarIcon
                                            className={`w-6 h-6 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Review Text Input */}
                        <textarea
                            value={reviewText}
                            onChange={handleReviewChange}
                            placeholder="Share your experience with this product..."
                            className="w-full p-3 border rounded-md resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />

                        {error && (
                            <p className="mt-2 text-red-600 text-sm">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`mt-3 w-full md:w-auto px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                                }`}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="mt-6 border rounded-md p-4 bg-gray-50">
                    <p className="text-center text-gray-600">
                        Please <a href="/login" className="text-blue-600 hover:underline">log in</a> to write a review
                    </p>
                </div>
            )}

            {/* Review List */}
            <div className="mt-8 space-y-6">
                {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                        <div key={index} className="border-b pb-4">
                            <div className="flex items-center mb-2">
                                <div className="flex mr-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <StarIcon
                                            key={star}
                                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="font-medium">{review.userName || 'Anonymous'}</span>
                                <span className="text-gray-500 text-sm ml-2">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-700">{review.text}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 italic">No reviews yet. Be the first to review this product!</p>
                )}
            </div>
        </div>
    );
};

export default ProductReviews; 