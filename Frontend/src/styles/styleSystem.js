/**
 * T-Shirt Customizer Style System
 * 
 * This module provides a centralized system for managing styles across the application.
 * It includes:
 * - CSS custom properties (variables) for consistent theming
 * - Utility functions for common styling patterns
 * - Theme configuration for light/dark mode
 * - Integration with styled-components (if used)
 * - Media query breakpoints for responsive design
 */

// =============================================================================
// Color System
// =============================================================================

export const colors = {
  // Primary palette
  primary: {
    50: 'var(--color-primary-50)',
    100: 'var(--color-primary-100)',
    200: 'var(--color-primary-200)',
    300: 'var(--color-primary-300)',
    400: 'var(--color-primary-400)',
    500: 'var(--color-primary-500)',
    600: 'var(--color-primary-600)',
    700: 'var(--color-primary-700)',
    800: 'var(--color-primary-800)',
    900: 'var(--color-primary-900)',
    main: 'var(--color-primary-500)',
    light: 'var(--color-primary-300)',
    dark: 'var(--color-primary-700)',
  },

  // Secondary palette
  secondary: {
    50: 'var(--color-secondary-50)',
    100: 'var(--color-secondary-100)',
    200: 'var(--color-secondary-200)',
    300: 'var(--color-secondary-300)',
    400: 'var(--color-secondary-400)',
    500: 'var(--color-secondary-500)',
    600: 'var(--color-secondary-600)',
    700: 'var(--color-secondary-700)',
    800: 'var(--color-secondary-800)',
    900: 'var(--color-secondary-900)',
    main: 'var(--color-secondary-500)',
    light: 'var(--color-secondary-300)',
    dark: 'var(--color-secondary-700)',
  },

  // Semantic colors
  success: {
    light: 'var(--color-success-light)',
    main: 'var(--color-success-main)',
    dark: 'var(--color-success-dark)',
  },
  warning: {
    light: 'var(--color-warning-light)',
    main: 'var(--color-warning-main)',
    dark: 'var(--color-warning-dark)',
  },
  error: {
    light: 'var(--color-error-light)',
    main: 'var(--color-error-main)',
    dark: 'var(--color-error-dark)',
  },
  info: {
    light: 'var(--color-info-light)',
    main: 'var(--color-info-main)',
    dark: 'var(--color-info-dark)',
  },

  // Grays
  gray: {
    50: 'var(--color-gray-50)',
    100: 'var(--color-gray-100)',
    200: 'var(--color-gray-200)',
    300: 'var(--color-gray-300)',
    400: 'var(--color-gray-400)',
    500: 'var(--color-gray-500)',
    600: 'var(--color-gray-600)',
    700: 'var(--color-gray-700)',
    800: 'var(--color-gray-800)',
    900: 'var(--color-gray-900)',
  },

  // Common colors
  common: {
    white: 'var(--color-white)',
    black: 'var(--color-black)',
    transparent: 'transparent',
  },

  // Text colors
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    disabled: 'var(--text-disabled)',
    hint: 'var(--text-hint)',
  },

  // Background colors
  background: {
    default: 'var(--bg-default)',
    paper: 'var(--bg-paper)',
    elevated: 'var(--bg-elevated)',
  },

  // Action colors
  action: {
    active: 'var(--action-active)',
    hover: 'var(--action-hover)',
    selected: 'var(--action-selected)',
    disabled: 'var(--action-disabled)',
    disabledBackground: 'var(--action-disabled-bg)',
    focus: 'var(--action-focus)',
  },
};

// =============================================================================
// Typography System
// =============================================================================

export const typography = {
  fontFamily: {
    primary: 'var(--font-family-primary)',
    secondary: 'var(--font-family-secondary)',
    mono: 'var(--font-family-mono)',
  },
  fontWeight: {
    light: 'var(--font-weight-light)',
    regular: 'var(--font-weight-regular)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
    bold: 'var(--font-weight-bold)',
  },
  fontSize: {
    xs: 'var(--font-size-xs)',
    sm: 'var(--font-size-sm)',
    md: 'var(--font-size-md)',
    lg: 'var(--font-size-lg)',
    xl: 'var(--font-size-xl)',
    '2xl': 'var(--font-size-2xl)',
    '3xl': 'var(--font-size-3xl)',
    '4xl': 'var(--font-size-4xl)',
  },
  lineHeight: {
    none: 'var(--line-height-none)',
    tight: 'var(--line-height-tight)',
    snug: 'var(--line-height-snug)',
    normal: 'var(--line-height-normal)',
    relaxed: 'var(--line-height-relaxed)',
    loose: 'var(--line-height-loose)',
  },
  letterSpacing: {
    tighter: 'var(--letter-spacing-tighter)',
    tight: 'var(--letter-spacing-tight)',
    normal: 'var(--letter-spacing-normal)',
    wide: 'var(--letter-spacing-wide)',
    wider: 'var(--letter-spacing-wider)',
    widest: 'var(--letter-spacing-widest)',
  },
};

// Utility function to get complete text style
export const textStyle = (size, weight = 'regular', family = 'primary') => ({
  fontFamily: typography.fontFamily[family],
  fontSize: typography.fontSize[size],
  fontWeight: typography.fontWeight[weight],
});

// =============================================================================
// Spacing System
// =============================================================================

export const spacing = {
  px: 'var(--spacing-px)',
  0: 'var(--spacing-0)',
  0.5: 'var(--spacing-0-5)',
  1: 'var(--spacing-1)',
  1.5: 'var(--spacing-1-5)',
  2: 'var(--spacing-2)',
  2.5: 'var(--spacing-2-5)',
  3: 'var(--spacing-3)',
  3.5: 'var(--spacing-3-5)',
  4: 'var(--spacing-4)',
  5: 'var(--spacing-5)',
  6: 'var(--spacing-6)',
  7: 'var(--spacing-7)',
  8: 'var(--spacing-8)',
  9: 'var(--spacing-9)',
  10: 'var(--spacing-10)',
  12: 'var(--spacing-12)',
  14: 'var(--spacing-14)',
  16: 'var(--spacing-16)',
  20: 'var(--spacing-20)',
  24: 'var(--spacing-24)',
  28: 'var(--spacing-28)',
  32: 'var(--spacing-32)',
  36: 'var(--spacing-36)',
  40: 'var(--spacing-40)',
  44: 'var(--spacing-44)',
  48: 'var(--spacing-48)',
  52: 'var(--spacing-52)',
  56: 'var(--spacing-56)',
  60: 'var(--spacing-60)',
  64: 'var(--spacing-64)',
  72: 'var(--spacing-72)',
  80: 'var(--spacing-80)',
  96: 'var(--spacing-96)',
};

// Utility function to get spacing value
export const space = (value) => spacing[value] || `${value}px`;

// =============================================================================
// Border & Shadow System
// =============================================================================

export const borders = {
  radius: {
    none: 'var(--radius-none)',
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    '2xl': 'var(--radius-2xl)',
    '3xl': 'var(--radius-3xl)',
    full: 'var(--radius-full)',
  },
  width: {
    0: 'var(--border-width-0)',
    1: 'var(--border-width-1)',
    2: 'var(--border-width-2)',
    4: 'var(--border-width-4)',
    8: 'var(--border-width-8)',
  },
  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double',
    none: 'none',
  },
};

export const shadows = {
  none: 'var(--shadow-none)',
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  '2xl': 'var(--shadow-2xl)',
  inner: 'var(--shadow-inner)',
};

// Utility function to get complete box shadow
export const boxShadow = (size = 'none') => shadows[size];

// =============================================================================
// Z-Index System
// =============================================================================

export const zIndex = {
  hide: 'var(--z-hide)',
  auto: 'var(--z-auto)',
  base: 'var(--z-base)',
  dropdown: 'var(--z-dropdown)',
  sticky: 'var(--z-sticky)',
  fixed: 'var(--z-fixed)',
  overlay: 'var(--z-overlay)',
  modal: 'var(--z-modal)',
  popover: 'var(--z-popover)',
  toast: 'var(--z-toast)',
  tooltip: 'var(--z-tooltip)',
};

// =============================================================================
// Breakpoints & Media Queries
// =============================================================================

export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Media query helper for mobile-first design
export const media = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
};

// =============================================================================
// Transitions
// =============================================================================

export const transitions = {
  duration: {
    fastest: 'var(--duration-fastest)',
    faster: 'var(--duration-faster)',
    fast: 'var(--duration-fast)',
    normal: 'var(--duration-normal)',
    slow: 'var(--duration-slow)',
    slower: 'var(--duration-slower)',
    slowest: 'var(--duration-slowest)',
  },
  easing: {
    easeInOut: 'var(--ease-in-out)',
    easeOut: 'var(--ease-out)',
    easeIn: 'var(--ease-in)',
    linear: 'var(--ease-linear)',
  },
};

// Utility function to get transition
export const transition = (property = 'all', duration = 'normal', easing = 'easeInOut') => {
  return `${property} ${transitions.duration[duration]} ${transitions.easing[easing]}`;
};

// =============================================================================
// Theme Variants & Dark Mode Support
// =============================================================================

// Set theme (could be called on app init or theme toggle)
export const setTheme = (theme = 'light') => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

// Get current theme
export const getTheme = () => {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    return storedTheme;
  }
  
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
};

// Initialize theme
export const initializeTheme = () => {
  setTheme(getTheme());
};

// Toggle theme
export const toggleTheme = () => {
  const currentTheme = getTheme();
  setTheme(currentTheme === 'light' ? 'dark' : 'light');
};

// =============================================================================
// Utility Classes & Helper Functions
// =============================================================================

// Flexbox utilities
export const flex = {
  row: { display: 'flex', flexDirection: 'row' },
  column: { display: 'flex', flexDirection: 'column' },
  center: { justifyContent: 'center', alignItems: 'center' },
  between: { justifyContent: 'space-between' },
  around: { justifyContent: 'space-around' },
  start: { justifyContent: 'flex-start' },
  end: { justifyContent: 'flex-end' },
  stretch: { alignItems: 'stretch' },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  wrap: { flexWrap: 'wrap' },
  nowrap: { flexWrap: 'nowrap' },
};

// Grid utilities
export const grid = {
  container: { display: 'grid' },
  cols1: { gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' },
  cols2: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  cols3: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  cols4: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
  cols5: { gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' },
  cols6: { gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' },
  gap1: { gap: 'var(--spacing-1)' },
  gap2: { gap: 'var(--spacing-2)' },
  gap3: { gap: 'var(--spacing-3)' },
  gap4: { gap: 'var(--spacing-4)' },
  gap5: { gap: 'var(--spacing-5)' },
};

// Common style mixins
export const mixins = {
  absoluteFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    width: '1px',
    whiteSpace: 'nowrap',
  },
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  scrollable: {
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  noScrollbar: {
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
};

// =============================================================================
// Style System
// =============================================================================

export const styleSystem = {
  createStyles: (styles) => {
    return Object.entries(styles).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }
};

// =============================================================================
// Export All Styles
// =============================================================================

const styleSystem = {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  zIndex,
  breakpoints,
  media,
  transitions,
  flex,
  grid,
  mixins,
  // Helper functions
  space,
  textStyle,
  boxShadow,
  transition,
  // Theme functions
  setTheme,
  getTheme,
  initializeTheme,
  toggleTheme,
  // Style System
  createStyles,
};

export default styleSystem; 