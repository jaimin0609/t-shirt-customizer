# Deprecated Features

This document tracks deprecated features, APIs, and components in the T-Shirt Customizer application, along with migration paths for developers.

## Overview

Features listed in this document are considered deprecated and will be removed in future versions. Developers should migrate to the recommended alternatives as soon as possible.

## Deprecation Policy

1. Features are first marked as deprecated with warnings in the code and documentation
2. Deprecated features remain functional for at least one major version after deprecation
3. Removal of deprecated features is announced at least one minor version before removal

## Currently Deprecated Features

### Legacy Deployment Scripts (Deprecated in v1.2.0)

**Description:** The original deployment scripts located in the root directory are now deprecated.

**Replacement:** Use the new deployment scripts located in the dedicated directories:
- Backend deployment scripts: `Backend/scripts/deployment/`
- Frontend deployment scripts: `Frontend/scripts/deployment/`

**Migration Path:** Update any CI/CD pipelines or manual deployment processes to use the new script locations. Wrapper scripts have been provided in the root directory for backward compatibility, but these will be removed in v2.0.0.

**Removal Timeline:** Planned for removal in v2.0.0 (Q3 2023)

### Direct Database Access API (Deprecated in v1.1.0)

**Description:** The direct database access endpoints (`/api/db/*`) are deprecated due to security concerns.

**Replacement:** Use the model-specific endpoints:
- Products: `/api/products/*`
- Orders: `/api/orders/*`
- Users: `/api/users/*`

**Migration Path:** Update all client code to use the model-specific endpoints. Authentication and proper authorization are required for these endpoints.

**Removal Timeline:** Planned for removal in v1.5.0 (Q1 2023)

### Legacy Image Upload Component (Deprecated in v1.0.5)

**Description:** The `LegacyImageUploader` component is deprecated due to performance issues and lack of modern features.

**Replacement:** Use the new `ImageUploader` component which supports:
- Drag and drop
- Image preview
- Progress indicators
- Better error handling

**Migration Path:**
```jsx
// Old usage
<LegacyImageUploader onUpload={handleUpload} />

// New usage
<ImageUploader 
  onUpload={handleUpload}
  allowMultiple={false}
  maxSize={5242880} // 5MB
  acceptedTypes={['image/jpeg', 'image/png']}
/>
```

**Removal Timeline:** Planned for removal in v1.3.0 (Q4 2022)

### Old Theme Configuration (Deprecated in v1.0.0)

**Description:** The theme configuration in `src/styles/oldTheme.js` is deprecated.

**Replacement:** Use the new theme system in `src/styles/theme.js` which supports:
- Dark/light mode
- Better accessibility
- More consistent spacing and typography

**Migration Path:**
```jsx
// Old usage
import { colors, spacing } from '../styles/oldTheme';

// New usage
import { useTheme } from '../hooks/useTheme';

function MyComponent() {
  const { theme } = useTheme();
  
  return (
    <div style={{ 
      color: theme.colors.text,
      padding: theme.spacing.medium 
    }}>
      Content
    </div>
  );
}
```

**Removal Timeline:** Removed in v1.2.0

## Upcoming Deprecations

### jQuery Dependencies (To be deprecated in v1.3.0)

**Description:** All jQuery dependencies will be deprecated in favor of modern JavaScript and React patterns.

**Replacement:** Use React hooks and native DOM APIs.

**Migration Path:** Documentation will be provided in v1.3.0.

**Planned Removal:** v2.0.0 (Q3 2023)

## Contacting Support

If you have questions about deprecated features or need assistance with migration, please contact the development team at dev-support@tshirtcustomizer.example.com or open an issue on our GitHub repository. 