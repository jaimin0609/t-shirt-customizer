import React from 'react';
import { Link } from 'react-router-dom';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { withStyles } from '../../../styles/withStyles';
import styleSystem from '../../../styles/styleSystem';

const SearchResultsBase = ({
  loading,
  hasExactMatches,
  products,
  searchQuery,
  didYouMean,
  suggestedProducts,
  searchWithCorrectedTerm,
  renderProductCard,
  styles
}) => {
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingPulse}>
          <div className={styles.loadingHeading}></div>
          <div className={styles.loadingGrid}>
            {[...Array(6)].map((_, index) => (
              <div key={index} className={styles.loadingCard}>
                <div className={styles.loadingImage}></div>
                <div className={styles.loadingContent}>
                  <div className={styles.loadingTitle}></div>
                  <div className={styles.loadingDescription}></div>
                  <div className={styles.loadingButton}></div>
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
      <div className={styles.container}>
        <div className={styles.noMatchesAlert}>
          <div className={styles.alertIconContainer}>
            <InformationCircleIcon className={styles.alertIcon} />
          </div>
          <div className={styles.alertContent}>
            <p className={styles.alertText}>
              No exact matches found for "{searchQuery}".
              {didYouMean && (
                <span className={styles.didYouMeanContainer}>
                  Did you mean{' '}
                  <button
                    onClick={searchWithCorrectedTerm}
                    className={styles.didYouMeanButton}
                  >
                    "{didYouMean}"
                  </button>
                  ?
                </span>
              )}
            </p>
          </div>
        </div>

        {suggestedProducts.length > 0 && (
          <div className={styles.suggestedProductsContainer}>
            <h2 className={styles.suggestedProductsHeading}>You might be interested in these products</h2>
            <div className={styles.productsGrid}>
              {suggestedProducts.map(product => renderProductCard(product))}
            </div>
          </div>
        )}

        <div className={styles.fallbackContent}>
          <h3 className={styles.fallbackHeading}>Can't find what you're looking for?</h3>
          <p className={styles.fallbackDescription}>
            Browse our full product catalog or try a different search term.
          </p>
          <Link
            to="/products"
            className={styles.browseButton}
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.resultsHeading}>
        {products.length} result{products.length !== 1 ? 's' : ''} for "{searchQuery}"
      </h2>

      <div className={styles.productsGrid}>
        {products.map(product => renderProductCard(product))}
      </div>

      {products.length === 0 && (
        <div className={styles.fallbackContent}>
          <p className={styles.fallbackDescription}>No products found with the applied filters.</p>
          <Link
            to="/products"
            className={styles.browseButton}
          >
            Browse All Products
          </Link>
        </div>
      )}
    </div>
  );
};

// Define component-specific styles
const searchResultsStyles = styleSystem.createStyles({
  container: `
    w-full 
    flex-1
  `,
  loadingContainer: `
    w-full 
    flex-1 
    flex 
    items-center 
    justify-center
  `,
  loadingPulse: `
    animate-pulse 
    flex 
    flex-col 
    space-y-4 
    w-full
  `,
  loadingHeading: `
    h-8 
    bg-gray-200 
    rounded 
    w-1/4
  `,
  loadingGrid: `
    grid 
    grid-cols-1 
    md:grid-cols-2 
    lg:grid-cols-3 
    gap-6
  `,
  loadingCard: `
    bg-white 
    rounded-lg 
    overflow-hidden 
    shadow-sm 
    border 
    border-gray-100
  `,
  loadingImage: `
    h-48 
    bg-gray-200
  `,
  loadingContent: `
    p-4 
    space-y-3
  `,
  loadingTitle: `
    h-4 
    bg-gray-200 
    rounded 
    w-3/4
  `,
  loadingDescription: `
    h-4 
    bg-gray-200 
    rounded 
    w-1/2
  `,
  loadingButton: `
    h-10 
    bg-gray-200 
    rounded
  `,
  noMatchesAlert: `
    bg-yellow-50 
    border-l-4 
    border-yellow-400 
    p-4 
    mb-6
  `,
  alertIconContainer: `
    flex-shrink-0
  `,
  alertIcon: `
    h-5 
    w-5 
    text-yellow-400
  `,
  alertContent: `
    ml-3
  `,
  alertText: `
    text-sm 
    text-yellow-700
  `,
  didYouMeanContainer: `
    ml-1
  `,
  didYouMeanButton: `
    text-blue-600 
    hover:text-blue-800 
    underline 
    font-medium
  `,
  suggestedProductsContainer: `
    mb-8
  `,
  suggestedProductsHeading: `
    text-xl 
    font-bold 
    mb-4 
    text-gray-800
  `,
  productsGrid: `
    grid 
    grid-cols-1 
    md:grid-cols-2 
    lg:grid-cols-3 
    gap-6
  `,
  fallbackContent: `
    text-center 
    py-8
  `,
  fallbackHeading: `
    text-lg 
    font-medium 
    text-gray-900 
    mb-2
  `,
  fallbackDescription: `
    text-gray-600 
    mb-4
  `,
  browseButton: `
    inline-flex 
    items-center 
    px-4 
    py-2 
    border 
    border-transparent 
    text-sm 
    font-medium 
    rounded-md 
    shadow-sm 
    text-white 
    bg-blue-600 
    hover:bg-blue-700 
    focus:outline-none 
    focus:ring-2 
    focus:ring-offset-2 
    focus:ring-blue-500
  `,
  resultsHeading: `
    text-xl 
    font-bold 
    mb-4 
    text-gray-800
  `,
});

// Create the styled component
const SearchResults = withStyles(SearchResultsBase, searchResultsStyles);

export default SearchResults; 