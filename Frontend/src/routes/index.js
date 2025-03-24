import { lazy } from 'react';

/**
 * Route Configuration
 * 
 * This file centralizes all route definitions for better organization and code splitting.
 * Routes are grouped into logical chunks based on user flow and related functionality.
 * 
 * Each route has:
 * - path: URL path for the route
 * - component: Lazy-loaded component to render
 * - exact: Whether route should match exactly
 * - auth: Whether authentication is required (none, required)
 * - preload: Whether component should be preloaded
 * - chunk: Bundle chunk name for better code splitting
 */

// Create error component to show when loading fails
const ErrorLoadingComponent = ({ error }) => (
  <div className="error-boundary p-4 bg-red-50 text-red-700 rounded my-4" role="alert">
    <h3 className="font-semibold text-lg mb-2">Failed to load page</h3>
    <p>{error?.message || 'An unexpected error occurred'}</p>
    <button 
      onClick={() => window.location.reload()}
      className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Retry
    </button>
  </div>
);

// Loading placeholder
const LoadingPlaceholder = () => (
  <div className="loading-placeholder animate-pulse my-4 max-w-4xl mx-auto">
    <div className="h-8 bg-gray-200 rounded-md w-1/3 mb-6"></div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded-md w-full"></div>
      <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded-md w-4/6"></div>
    </div>
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-48 bg-gray-200 rounded-md"></div>
      ))}
    </div>
  </div>
);

// Route groups - each group will be bundled together
const createRouteConfig = () => ({
  // Core routes - these are preloaded for performance
  core: [
    {
      path: '/',
      component: lazy(() => import(/* webpackChunkName: "home" */ '../pages/HomePage')),
      exact: true,
      auth: 'none',
      preload: true,
      chunk: 'home'
    },
    {
      path: '/products',
      component: lazy(() => import(/* webpackChunkName: "products" */ '../pages/ProductsPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'products'
    },
    {
      path: '/product/:productId',
      component: lazy(() => import(/* webpackChunkName: "product-detail" */ '../pages/ProductDetailPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'product-detail'
    }
  ],
  
  // Authentication routes
  auth: [
    {
      path: '/login',
      component: lazy(() => import(/* webpackChunkName: "auth" */ '../pages/LoginPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'auth'
    },
    {
      path: '/signup',
      component: lazy(() => import(/* webpackChunkName: "auth" */ '../pages/SignupPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'auth'
    }
  ],
  
  // User account routes - require authentication
  account: [
    {
      path: '/profile',
      component: lazy(() => import(/* webpackChunkName: "profile" */ '../pages/ProfilePage')),
      exact: true,
      auth: 'required',
      preload: false,
      chunk: 'account'
    },
    {
      path: '/cart',
      component: lazy(() => import(/* webpackChunkName: "cart" */ '../pages/CartPage')),
      exact: true,
      auth: 'required',
      preload: false,
      chunk: 'account'
    },
    {
      path: '/orders',
      component: lazy(() => import(/* webpackChunkName: "orders" */ '../pages/OrdersPage')),
      exact: true,
      auth: 'required',
      preload: false,
      chunk: 'account'
    },
    {
      path: '/orders/:orderId',
      component: lazy(() => import(/* webpackChunkName: "order-detail" */ '../pages/OrderDetailPage')),
      exact: true,
      auth: 'required',
      preload: false,
      chunk: 'account'
    },
    {
      path: '/wishlist',
      component: lazy(() => import(/* webpackChunkName: "wishlist" */ '../pages/WishlistPage')),
      exact: true,
      auth: 'required',
      preload: false,
      chunk: 'account'
    },
    {
      path: '/notifications',
      component: lazy(() => import(/* webpackChunkName: "notifications" */ '../pages/NotificationsPage')),
      exact: true,
      auth: 'required',
      preload: false,
      chunk: 'account'
    }
  ],
  
  // Checkout flow
  checkout: [
    {
      path: '/checkout',
      component: lazy(() => import(/* webpackChunkName: "checkout" */ '../pages/CheckoutPage')),
      exact: true,
      auth: 'required',
      preload: false,
      chunk: 'checkout'
    }
  ],
  
  // Design studio features
  studio: [
    {
      path: '/custom-design-studio',
      component: lazy(() => import(/* webpackChunkName: "design-studio" */ '../pages/CustomDesignStudioPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'design'
    },
    {
      path: '/designs',
      component: lazy(() => import(/* webpackChunkName: "design-gallery" */ '../pages/DesignGalleryPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'design'
    },
    {
      path: '/3d-designer',
      component: lazy(() => import(/* webpackChunkName: "product-designer" */ '../pages/CustomProductDesignerPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'design-3d'
    }
  ],
  
  // Static pages - low priority for code splitting
  staticPages: [
    {
      path: '/about',
      component: lazy(() => import(/* webpackChunkName: "static-pages" */ '../pages/AboutPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'static'
    },
    {
      path: '/contact-us',
      component: lazy(() => import(/* webpackChunkName: "static-pages" */ '../pages/ContactPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'static'
    },
    {
      path: '/faq',
      component: lazy(() => import(/* webpackChunkName: "static-pages" */ '../pages/FAQPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'static'
    },
    {
      path: '/shipping-info',
      component: lazy(() => import(/* webpackChunkName: "static-pages" */ '../pages/ShippingInfoPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'static'
    },
    {
      path: '/returns-policy',
      component: lazy(() => import(/* webpackChunkName: "static-pages" */ '../pages/ReturnsPolicyPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'static'
    },
    {
      path: '/privacy-policy',
      component: lazy(() => import(/* webpackChunkName: "static-pages" */ '../pages/PrivacyPolicyPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'static'
    },
    {
      path: '/terms-of-service',
      component: lazy(() => import(/* webpackChunkName: "static-pages" */ '../pages/TermsOfServicePage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'static'
    },
    {
      path: '/sitemap',
      component: lazy(() => import(/* webpackChunkName: "static-pages" */ '../pages/SitemapPage')),
      exact: true,
      auth: 'none',
      preload: false,
      chunk: 'static'
    }
  ],
  
  // Catch-all route - must be last
  notFound: [
    {
      path: '*',
      component: lazy(() => import(/* webpackChunkName: "not-found" */ '../pages/NotFoundPage')),
      exact: false,
      auth: 'none',
      preload: false,
      chunk: 'error'
    }
  ]
});

// Flattened routes for easier consumption by the router
export const routes = Object.values(createRouteConfig()).flat();

// Export error and loading components for use with Suspense
export const errorComponent = ErrorLoadingComponent;
export const loadingComponent = LoadingPlaceholder;

// Export default routes configuration
export default createRouteConfig; 