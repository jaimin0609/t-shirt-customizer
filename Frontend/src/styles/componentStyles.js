/**
 * Component Style Generator
 * 
 * This utility generates optimized and consistent styles for components
 * using the style system. It provides pre-built style collections for common UI elements.
 */

import styles from './styleSystem';

// =============================================================================
// Button Styles
// =============================================================================

export const createButtonStyles = (variant = 'primary', size = 'md') => {
  // Base button styles
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: styles.typography.fontFamily.primary,
    fontWeight: styles.typography.fontWeight.medium,
    borderRadius: styles.borders.radius.md,
    cursor: 'pointer',
    transition: styles.transition('all', 'fast'),
    border: 'none',
    outline: 'none',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };
  
  // Size variations
  const sizeStyles = {
    sm: {
      fontSize: styles.typography.fontSize.sm,
      padding: `${styles.spacing[1.5]} ${styles.spacing[3]}`,
      height: '32px',
    },
    md: {
      fontSize: styles.typography.fontSize.md,
      padding: `${styles.spacing[2]} ${styles.spacing[4]}`,
      height: '40px',
    },
    lg: {
      fontSize: styles.typography.fontSize.lg,
      padding: `${styles.spacing[2.5]} ${styles.spacing[5]}`,
      height: '48px',
    },
  };
  
  // Variant styles
  const variantStyles = {
    primary: {
      backgroundColor: styles.colors.primary.main,
      color: styles.colors.common.white,
      '&:hover': {
        backgroundColor: styles.colors.primary.dark,
      },
      '&:focus': {
        boxShadow: `0 0 0 2px ${styles.colors.primary[100]}`,
      },
      '&:active': {
        backgroundColor: styles.colors.primary[800],
      },
      '&:disabled': {
        backgroundColor: styles.colors.gray[300],
        color: styles.colors.gray[500],
        cursor: 'not-allowed',
      },
    },
    secondary: {
      backgroundColor: styles.colors.secondary.main,
      color: styles.colors.common.white,
      '&:hover': {
        backgroundColor: styles.colors.secondary.dark,
      },
      '&:focus': {
        boxShadow: `0 0 0 2px ${styles.colors.secondary[100]}`,
      },
      '&:active': {
        backgroundColor: styles.colors.secondary[800],
      },
      '&:disabled': {
        backgroundColor: styles.colors.gray[300],
        color: styles.colors.gray[500],
        cursor: 'not-allowed',
      },
    },
    outline: {
      backgroundColor: 'transparent',
      color: styles.colors.primary.main,
      border: `1px solid ${styles.colors.primary.main}`,
      '&:hover': {
        backgroundColor: styles.colors.primary[50],
      },
      '&:focus': {
        boxShadow: `0 0 0 2px ${styles.colors.primary[100]}`,
      },
      '&:active': {
        backgroundColor: styles.colors.primary[100],
      },
      '&:disabled': {
        color: styles.colors.gray[400],
        borderColor: styles.colors.gray[300],
        cursor: 'not-allowed',
      },
    },
    text: {
      backgroundColor: 'transparent',
      color: styles.colors.primary.main,
      padding: `${styles.spacing[1]} ${styles.spacing[2]}`,
      '&:hover': {
        backgroundColor: styles.colors.primary[50],
      },
      '&:focus': {
        backgroundColor: styles.colors.primary[100],
      },
      '&:active': {
        backgroundColor: styles.colors.primary[200],
      },
      '&:disabled': {
        color: styles.colors.gray[400],
        cursor: 'not-allowed',
        backgroundColor: 'transparent',
      },
    },
    danger: {
      backgroundColor: styles.colors.error.main,
      color: styles.colors.common.white,
      '&:hover': {
        backgroundColor: styles.colors.error.dark,
      },
      '&:focus': {
        boxShadow: `0 0 0 2px ${styles.colors.error.light}`,
      },
      '&:active': {
        backgroundColor: styles.colors.error.dark,
      },
      '&:disabled': {
        backgroundColor: styles.colors.gray[300],
        color: styles.colors.gray[500],
        cursor: 'not-allowed',
      },
    },
  };
  
  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

// =============================================================================
// Input Styles
// =============================================================================

export const createInputStyles = (variant = 'default', size = 'md', state = 'default') => {
  // Base input styles
  const baseStyles = {
    fontFamily: styles.typography.fontFamily.primary,
    color: styles.colors.text.primary,
    borderRadius: styles.borders.radius.md,
    transition: styles.transition('all', 'fast'),
    width: '100%',
    boxSizing: 'border-box',
  };
  
  // Size variations
  const sizeStyles = {
    sm: {
      fontSize: styles.typography.fontSize.sm,
      padding: `${styles.spacing[1.5]} ${styles.spacing[2]}`,
      height: '32px',
    },
    md: {
      fontSize: styles.typography.fontSize.md,
      padding: `${styles.spacing[2]} ${styles.spacing[3]}`,
      height: '40px',
    },
    lg: {
      fontSize: styles.typography.fontSize.lg,
      padding: `${styles.spacing[2.5]} ${styles.spacing[4]}`,
      height: '48px',
    },
  };
  
  // Variant styles
  const variantStyles = {
    default: {
      border: `1px solid ${styles.colors.gray[300]}`,
      backgroundColor: styles.colors.common.white,
      '&:hover': {
        borderColor: styles.colors.gray[400],
      },
      '&:focus': {
        outline: 'none',
        borderColor: styles.colors.primary.main,
        boxShadow: `0 0 0 1px ${styles.colors.primary[300]}`,
      },
      '&:disabled': {
        backgroundColor: styles.colors.gray[100],
        color: styles.colors.text.disabled,
        cursor: 'not-allowed',
      },
    },
    filled: {
      border: 'none',
      backgroundColor: styles.colors.gray[100],
      '&:hover': {
        backgroundColor: styles.colors.gray[200],
      },
      '&:focus': {
        outline: 'none',
        backgroundColor: styles.colors.gray[200],
        boxShadow: `0 0 0 1px ${styles.colors.primary[300]}`,
      },
      '&:disabled': {
        backgroundColor: styles.colors.gray[100],
        color: styles.colors.text.disabled,
        cursor: 'not-allowed',
      },
    },
    flushed: {
      border: 'none',
      borderBottom: `1px solid ${styles.colors.gray[300]}`,
      borderRadius: 0,
      padding: `${styles.spacing[2]} 0`,
      '&:hover': {
        borderBottomColor: styles.colors.gray[400],
      },
      '&:focus': {
        outline: 'none',
        borderBottomColor: styles.colors.primary.main,
        boxShadow: `0 1px 0 0 ${styles.colors.primary.main}`,
      },
      '&:disabled': {
        backgroundColor: 'transparent',
        color: styles.colors.text.disabled,
        cursor: 'not-allowed',
      },
    },
  };
  
  // State styles
  const stateStyles = {
    default: {},
    error: {
      borderColor: `${styles.colors.error.main} !important`,
      '&:focus': {
        boxShadow: `0 0 0 1px ${styles.colors.error.main}`,
      },
    },
    success: {
      borderColor: `${styles.colors.success.main} !important`,
      '&:focus': {
        boxShadow: `0 0 0 1px ${styles.colors.success.main}`,
      },
    },
  };
  
  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...stateStyles[state],
  };
};

// =============================================================================
// Card Styles
// =============================================================================

export const createCardStyles = (elevation = 'md', padding = 'md') => {
  // Base card styles
  const baseStyles = {
    backgroundColor: styles.colors.background.paper,
    borderRadius: styles.borders.radius.md,
    overflow: 'hidden',
  };
  
  // Elevation (shadow) variations
  const elevationStyles = {
    none: {
      boxShadow: 'none',
      border: `1px solid ${styles.colors.gray[200]}`,
    },
    xs: {
      boxShadow: styles.shadows.xs,
    },
    sm: {
      boxShadow: styles.shadows.sm,
    },
    md: {
      boxShadow: styles.shadows.md,
    },
    lg: {
      boxShadow: styles.shadows.lg,
    },
    xl: {
      boxShadow: styles.shadows.xl,
    },
  };
  
  // Padding variations
  const paddingStyles = {
    none: {
      padding: 0,
    },
    sm: {
      padding: styles.spacing[3],
    },
    md: {
      padding: styles.spacing[5],
    },
    lg: {
      padding: styles.spacing[8],
    },
  };
  
  return {
    ...baseStyles,
    ...elevationStyles[elevation],
    ...paddingStyles[padding],
  };
};

// =============================================================================
// FormControl Styles
// =============================================================================

export const createFormControlStyles = (spacing = 'md') => {
  // Base form control styles
  const baseStyles = {
    marginBottom: styles.spacing[6],
    display: 'flex',
    flexDirection: 'column',
  };
  
  // Spacing variations
  const spacingStyles = {
    sm: {
      '& > label': {
        marginBottom: styles.spacing[1],
      },
      '& > .helper-text': {
        marginTop: styles.spacing[1],
      },
    },
    md: {
      '& > label': {
        marginBottom: styles.spacing[2],
      },
      '& > .helper-text': {
        marginTop: styles.spacing[2],
      },
    },
    lg: {
      '& > label': {
        marginBottom: styles.spacing[3],
      },
      '& > .helper-text': {
        marginTop: styles.spacing[3],
      },
    },
  };
  
  // Label styles
  const labelStyles = {
    '& > label': {
      fontSize: styles.typography.fontSize.sm,
      fontWeight: styles.typography.fontWeight.medium,
      color: styles.colors.text.secondary,
    },
  };
  
  // Helper text styles
  const helperTextStyles = {
    '& > .helper-text': {
      fontSize: styles.typography.fontSize.sm,
      color: styles.colors.text.hint,
    },
    '& > .error-text': {
      fontSize: styles.typography.fontSize.sm,
      color: styles.colors.error.main,
    },
  };
  
  return {
    ...baseStyles,
    ...spacingStyles[spacing],
    ...labelStyles,
    ...helperTextStyles,
  };
};

// =============================================================================
// Text Styles
// =============================================================================

export const createTextStyles = (variant = 'body1', align = 'left', color = 'primary') => {
  // Base text styles
  const baseStyles = {
    fontFamily: styles.typography.fontFamily.primary,
    margin: 0,
    textAlign: align,
  };
  
  // Variant styles
  const variantStyles = {
    h1: {
      fontSize: styles.typography.fontSize['4xl'],
      fontWeight: styles.typography.fontWeight.bold,
      lineHeight: styles.typography.lineHeight.tight,
      letterSpacing: styles.typography.letterSpacing.tight,
      marginBottom: styles.spacing[6],
    },
    h2: {
      fontSize: styles.typography.fontSize['3xl'],
      fontWeight: styles.typography.fontWeight.bold,
      lineHeight: styles.typography.lineHeight.tight,
      letterSpacing: styles.typography.letterSpacing.tight,
      marginBottom: styles.spacing[5],
    },
    h3: {
      fontSize: styles.typography.fontSize['2xl'],
      fontWeight: styles.typography.fontWeight.semibold,
      lineHeight: styles.typography.lineHeight.tight,
      marginBottom: styles.spacing[4],
    },
    h4: {
      fontSize: styles.typography.fontSize.xl,
      fontWeight: styles.typography.fontWeight.semibold,
      lineHeight: styles.typography.lineHeight.tight,
      marginBottom: styles.spacing[3],
    },
    h5: {
      fontSize: styles.typography.fontSize.lg,
      fontWeight: styles.typography.fontWeight.semibold,
      lineHeight: styles.typography.lineHeight.tight,
      marginBottom: styles.spacing[2],
    },
    h6: {
      fontSize: styles.typography.fontSize.md,
      fontWeight: styles.typography.fontWeight.semibold,
      lineHeight: styles.typography.lineHeight.normal,
      marginBottom: styles.spacing[2],
    },
    body1: {
      fontSize: styles.typography.fontSize.md,
      lineHeight: styles.typography.lineHeight.normal,
      marginBottom: styles.spacing[4],
    },
    body2: {
      fontSize: styles.typography.fontSize.sm,
      lineHeight: styles.typography.lineHeight.normal,
      marginBottom: styles.spacing[3],
    },
    caption: {
      fontSize: styles.typography.fontSize.xs,
      lineHeight: styles.typography.lineHeight.normal,
      color: styles.colors.text.secondary,
    },
    overline: {
      fontSize: styles.typography.fontSize.xs,
      lineHeight: styles.typography.lineHeight.normal,
      letterSpacing: styles.typography.letterSpacing.widest,
      textTransform: 'uppercase',
      fontWeight: styles.typography.fontWeight.medium,
    },
  };
  
  // Color styles
  const colorStyles = {
    primary: {
      color: styles.colors.text.primary,
    },
    secondary: {
      color: styles.colors.text.secondary,
    },
    brand: {
      color: styles.colors.primary.main,
    },
    success: {
      color: styles.colors.success.main,
    },
    warning: {
      color: styles.colors.warning.main,
    },
    error: {
      color: styles.colors.error.main,
    },
    info: {
      color: styles.colors.info.main,
    },
  };
  
  return {
    ...baseStyles,
    ...variantStyles[variant],
    ...colorStyles[color],
  };
};

// =============================================================================
// Layout Styles
// =============================================================================

export const createLayoutStyles = {
  container: (maxWidth = 'lg', padding = true) => {
    const maxWidthMap = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    };
    
    return {
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto',
      maxWidth: maxWidthMap[maxWidth] || maxWidth,
      padding: padding ? `0 ${styles.spacing[4]}` : 0,
      
      [styles.media.md]: {
        padding: padding ? `0 ${styles.spacing[6]}` : 0,
      },
    };
  },
  
  // Flex row layout
  row: (gap = 4, wrap = true, align = 'stretch', justify = 'flex-start') => ({
    display: 'flex',
    flexDirection: 'row',
    flexWrap: wrap ? 'wrap' : 'nowrap',
    alignItems: align,
    justifyContent: justify,
    ...(gap && { gap: styles.spacing[gap] }),
  }),
  
  // Flex column layout
  column: (gap = 4, align = 'stretch', justify = 'flex-start') => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: align,
    justifyContent: justify,
    ...(gap && { gap: styles.spacing[gap] }),
  }),
  
  // Grid layout
  grid: (columns = 1, gap = 4) => {
    const gridStyles = {
      display: 'grid',
      gap: styles.spacing[gap],
    };
    
    // If columns is a number, use the same number for all breakpoints
    if (typeof columns === 'number') {
      return {
        ...gridStyles,
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      };
    }
    
    // If columns is an object, apply responsive columns
    return {
      ...gridStyles,
      gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
      ...(columns.sm && {
        [styles.media.sm]: {
          gridTemplateColumns: `repeat(${columns.sm}, minmax(0, 1fr))`,
        },
      }),
      ...(columns.md && {
        [styles.media.md]: {
          gridTemplateColumns: `repeat(${columns.md}, minmax(0, 1fr))`,
        },
      }),
      ...(columns.lg && {
        [styles.media.lg]: {
          gridTemplateColumns: `repeat(${columns.lg}, minmax(0, 1fr))`,
        },
      }),
      ...(columns.xl && {
        [styles.media.xl]: {
          gridTemplateColumns: `repeat(${columns.xl}, minmax(0, 1fr))`,
        },
      }),
    };
  },
};

// =============================================================================
// Export Component Styles
// =============================================================================

const componentStyles = {
  button: createButtonStyles,
  input: createInputStyles,
  card: createCardStyles,
  formControl: createFormControlStyles,
  text: createTextStyles,
  layout: createLayoutStyles,
};

export default componentStyles; 