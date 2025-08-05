# Error Pages Documentation

This directory contains comprehensive error handling components for the Resume Screener application. Each error page is designed with consistent theming, smooth animations, and user-friendly messaging.

## Components

### 1. ErrorHandler
A unified error handler that automatically renders the appropriate error component based on status code.

```tsx
import { ErrorHandler } from '@/components/errors';

<ErrorHandler 
  statusCode={401}
  message="Please sign in to continue"
  redirectUrl="/auth/signin"
/>
```

### 2. ErrorBoundary
A React error boundary that catches JavaScript errors and displays a fallback UI.

```tsx
import { ErrorBoundary } from '@/components/errors';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 3. Individual Error Components

#### UnauthorizedError (401)
- **Theme**: Blue gradient with lock icon
- **Animation**: Pulsing lock with spinning border
- **Features**: Sign-in redirect, security information

```tsx
import { UnauthorizedError } from '@/components/errors';

<UnauthorizedError 
  message="You need to sign in to access this page"
  redirectUrl="/auth/signin"
/>
```

#### ForbiddenError (403)
- **Theme**: Purple gradient with shield-x icon
- **Animation**: Pulsing shield with bouncing warning
- **Features**: Role requirements, permission info

```tsx
import { ForbiddenError } from '@/components/errors';

<ForbiddenError 
  message="You don't have permission to access this resource"
  requiredRole="Admin"
/>
```

#### ServerError (500, 502, 503, 504)
- **Theme**: Orange/red gradient with server icon
- **Animation**: Pulsing server with spinning border
- **Features**: Retry mechanism, error ID tracking

```tsx
import { ServerError } from '@/components/errors';

<ServerError 
  statusCode={500}
  message="Internal server error"
  errorId="ERR_123456"
/>
```

#### NotFound (404)
- **Theme**: Yellow gradient with search icon
- **Animation**: Bouncing search icon
- **Features**: Search functionality, navigation options

```tsx
// Automatically used by Next.js for 404 errors
// Located at: /app/not-found.tsx
```

#### MaintenancePage
- **Theme**: Yellow/orange gradient with wrench icon
- **Animation**: Pulsing wrench with spinning border
- **Features**: Estimated time, feature list, live clock

```tsx
import { MaintenancePage } from '@/components/errors';

<MaintenancePage 
  estimatedTime="2 hours"
  message="We're performing scheduled maintenance"
  features={["Security updates", "Performance improvements"]}
/>
```

## Hook: useErrorHandler

A custom hook for managing error states throughout your application.

```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { error, handleError, clearError, isError } = useErrorHandler();

  const fetchData = async () => {
    try {
      const response = await api.getData();
      // Handle success
    } catch (err) {
      handleError(err); // Automatically sets appropriate error state
    }
  };

  if (isError) {
    return <ErrorHandler {...error} />;
  }

  return <div>Your component content</div>;
}
```

## Features

### Consistent Theming
- **Colors**: Matches project's yellow/orange primary theme
- **Typography**: Uses project's font stack and sizing
- **Spacing**: Consistent with design system

### Animations
- **Entrance**: Staggered fade-in with slide-up effects
- **Icons**: Pulsing, bouncing, and spinning animations
- **Floating Elements**: Ambient particle effects
- **Hover States**: Scale and shadow transitions

### Responsive Design
- **Mobile-first**: Optimized for all screen sizes
- **Touch-friendly**: Large buttons and touch targets
- **Readable**: Appropriate text sizes and contrast

### Accessibility
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Screen reader friendly
- **Keyboard Navigation**: Full keyboard support
- **Color Contrast**: WCAG compliant contrast ratios

### User Experience
- **Clear Messaging**: User-friendly error descriptions
- **Action Buttons**: Clear next steps for users
- **Help Information**: Context about why errors occur
- **Recovery Options**: Multiple ways to resolve issues

## Usage Patterns

### 1. API Error Handling
```tsx
const handleApiError = (error) => {
  if (error.response?.status === 401) {
    return <UnauthorizedError redirectUrl="/login" />;
  }
  if (error.response?.status === 403) {
    return <ForbiddenError requiredRole="Admin" />;
  }
  return <ServerError statusCode={error.response?.status} />;
};
```

### 2. Route Protection
```tsx
function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  
  if (!user) {
    return <UnauthorizedError />;
  }
  
  if (!user.roles.includes(requiredRole)) {
    return <ForbiddenError requiredRole={requiredRole} />;
  }
  
  return children;
}
```

### 3. Global Error Boundary
```tsx
// In your root layout or app component
<ErrorBoundary>
  <Router>
    <Routes>
      {/* Your routes */}
    </Routes>
  </Router>
</ErrorBoundary>
```

## Customization

All components accept optional props for customization:

- `className`: Additional CSS classes
- `message`: Custom error messages
- `redirectUrl`: Custom redirect URLs
- `requiredRole`: Role requirements
- `errorId`: Error tracking IDs

## Best Practices

1. **Use ErrorHandler** for most cases - it automatically selects the right component
2. **Wrap components** with ErrorBoundary to catch unexpected errors
3. **Provide context** in error messages to help users understand what happened
4. **Include recovery options** so users can resolve issues themselves
5. **Log errors** for monitoring and debugging purposes
6. **Test error states** to ensure good user experience during failures