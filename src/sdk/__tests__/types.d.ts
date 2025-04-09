declare global {
  interface Window {
    location: Location;
    navigator: Navigator;
    screen: Screen;
    addEventListener: Window['addEventListener'];
    removeEventListener: Window['removeEventListener'];
    dispatchEvent: Window['dispatchEvent'];
    performance: Performance;
    XMLHttpRequest: typeof XMLHttpRequest;
    PerformanceObserver: typeof PerformanceObserver;
    fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  }

  interface Navigator {
    deviceMemory?: number;
    connection?: {
      type: string;
      effectiveType: string;
      rtt: number;
      downlink: number;
    };
  }

  interface Performance {
    getEntriesByType: jest.Mock;
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
    timing?: {
      navigationStart: number;
      loadEventEnd: number;
      domComplete: number;
      domInteractive: number;
      responseEnd: number;
      requestStart: number;
      connectEnd: number;
      connectStart: number;
      domainLookupEnd: number;
      domainLookupStart: number;
    };
  }
}

export {}; 