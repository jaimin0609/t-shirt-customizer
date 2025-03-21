import React from 'react';
import { Link } from 'react-router-dom';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const SearchResults = ({
    loading,
    hasExactMatches,
    products,
    searchQuery,
    didYouMean,
    suggestedProducts,
    searchWithCorrectedTerm,
    renderProductCard
}) => {
    if (loading) {
        return (
            <div className="w-full flex-1 flex items-center justify-center">
                <div className="animate-pulse flex flex-col space-y-4 w-full">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, index) => (
                            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
                                <div className="h-48 bg-gray-200"></div>
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-10 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!hasExactMatches) {
        return (
            <div className="w-full flex-1">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                No exact matches found for "{searchQuery}".
                                {didYouMean && (
                                    <span className="ml-1">
                                        Did you mean{' '}
                                        <button
                                            onClick={searchWithCorrectedTerm}
                                            className="text-blue-600 hover:text-blue-800 underline font-medium"
                                        >
                                            "{didYouMean}"
                                        </button>
                                        ?
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {suggestedProducts.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">You might be interested in these products</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {suggestedProducts.map(product => renderProductCard(product))}
                        </div>
                    </div>
                )}

                <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Can't find what you're looking for?</h3>
                    <p className="text-gray-600 mb-4">
                        Browse our full product catalog or try a different search term.
                    </p>
                    <Link
                        to="/products"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Browse All Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex-1">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
                {products.length} result{products.length !== 1 ? 's' : ''} for "{searchQuery}"
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => renderProductCard(product))}
            </div>

            {products.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No products found with the applied filters.</p>
                    <Link
                        to="/products"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Browse All Products
                    </Link>
                </div>
            )}
        </div>
    );
};

export default SearchResults; 