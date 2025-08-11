# Web Monitor SDK

A comprehensive web monitoring SDK for tracking errors, performance metrics, user behavior, and network requests in web applications.

## Features

- 🚨 **Error Tracking**: JavaScript errors, Promise rejections, and resource loading failures
- 📊 **Performance Monitoring**: Page load times, Core Web Vitals (LCP, FID, CLS), and custom metrics
- 🌐 **Network Monitoring**: Fetch and XMLHttpRequest tracking with timing and size metrics
- 📄 **Page Tracking**: Page views, SPA navigation, and user sessions
- 🎯 **Custom Events**: Track user interactions and business metrics
- 📦 **Smart Queuing**: Event batching, retry logic, and offline support
- 🔧 **TypeScript**: Full TypeScript support with comprehensive type definitions

## Quick Start

### Installation

```bash
npm install @web-monitor/log
```

### Basic Usage

```typescript
import { createWebMonitor } from '@web-monitor/log';

// Initialize the SDK
const monitor = createWebMonitor({
  appId: 'your-app-id',
  serverUrl: 'https://your-api-endpoint.com/events',
  enableAutoTrack: true,
  enableConsoleLog: false, // Set to true for debugging
});

// Start monitoring
monitor.init();
```

### Configuration Options

```typescript
interface LoggerConfig {
  appId: string;              // Your application identifier
  serverUrl: string;          // Endpoint to send events to
  maxQueueSize?: number;      // Maximum events in queue (default: 100)
  flushInterval?: number;     // Auto-flush interval in ms (default: 10000)
  enableConsoleLog?: boolean; // Enable debug logging (default: false)
  enableAutoTrack?: boolean;  // Enable automatic tracking (default: true)
}
```

## Usage Examples

### Manual Error Tracking

```typescript
try {
  // Your code here
} catch (error) {
  monitor.trackError(error, {
    context: 'user-checkout',
    userId: 'user123',
    step: 'payment-processing'
  });
}
```

### Custom Events

```typescript
// Track user interactions
monitor.trackCustomEvent({
  eventType: 'user-action',
  action: 'button-click',
  category: 'navigation',
  label: 'header-menu',
  value: 1
});

// Track business metrics
monitor.trackCustomEvent({
  eventType: 'conversion',
  action: 'purchase-completed',
  value: orderTotal,
  currency: 'USD'
});
```

### Performance Tracking

```typescript
// Custom performance marks and measures
monitor.mark('feature-start');
// ... your code ...
monitor.mark('feature-end');
monitor.measure('feature-duration', 'feature-start', 'feature-end');
```

### User Identification

```typescript
// Set user ID for session tracking
monitor.setUserId('user-12345');

// Get current session and user info
const sessionId = monitor.getSessionId();
const userId = monitor.getUserId();
```

## Event Types

The SDK automatically tracks the following events:

### Error Events
- JavaScript runtime errors
- Unhandled Promise rejections
- Resource loading failures (images, scripts, stylesheets)

### Page Events
- Page views and navigation
- SPA route changes
- Page load and unload times

### Network Events
- Fetch API requests
- XMLHttpRequest calls
- Request/response timing and sizes
- HTTP status codes

### Performance Events
- Navigation timing metrics
- Core Web Vitals (LCP, FID, CLS)
- Resource loading performance
- Custom performance marks and measures

## Advanced Usage

### Manual Queue Control

```typescript
// Force immediate flush
await monitor.flush();

// Update configuration
monitor.updateConfig({
  flushInterval: 5000,
  enableConsoleLog: true
});
```

### Cleanup

```typescript
// Clean up when component unmounts or page unloads
monitor.destroy();
```

## Development

### Running the Demo

```bash
npm run dev
```

Open http://localhost:5173 to see the interactive demo page.

### Building the Library

```bash
npm run build:lib
```

### Type Checking

```bash
npm run typecheck
```

## Event Data Structure

All events follow a consistent structure:

```typescript
interface BaseEvent {
  eventType: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  url: string;
  userAgent: string;
  appId: string;
}
```

Specific event types extend this base structure with additional properties.

## Browser Support

- Modern browsers with ES2020 support
- Automatic fallbacks for older browsers where possible
- Uses native APIs: Performance Observer, Intersection Observer, etc.

## License

MIT License