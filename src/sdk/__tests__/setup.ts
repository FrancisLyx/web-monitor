import '@testing-library/jest-dom';

// 模拟XMLHttpRequest
interface MockXMLHttpRequestInstance {
  open: jest.Mock;
  send: jest.Mock;
  setRequestHeader: jest.Mock;
  readyState: number;
  status: number;
  response: string;
  responseText: string;
  onreadystatechange: null | (() => void);
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
}

function MockXMLHttpRequest(this: MockXMLHttpRequestInstance) {
  this.open = jest.fn();
  this.send = jest.fn();
  this.setRequestHeader = jest.fn();
  this.readyState = 4;
  this.status = 200;
  this.response = '';
  this.responseText = '';
  this.onreadystatechange = null;
  this.addEventListener = jest.fn();
  this.removeEventListener = jest.fn();
}

// 保存原始的XMLHttpRequest
const originalXHR = window.XMLHttpRequest;

// 模拟window对象
const mockWindow = {
  location: {
    href: 'https://test.com'
  },
  navigator: {
    userAgent: 'Mozilla/5.0',
    language: 'zh-CN',
    platform: 'MacIntel',
    deviceMemory: 8,
    connection: {
      type: '4g',
      effectiveType: '4g',
      rtt: 50,
      downlink: 10
    }
  },
  screen: {
    width: 1920,
    height: 1080
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  performance: {
    getEntriesByType: jest.fn().mockReturnValue([]),
    memory: {
      jsHeapSizeLimit: 1000000000,
      totalJSHeapSize: 500000000,
      usedJSHeapSize: 300000000
    }
  }
};

// 模拟document对象
const mockDocument = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  createElement: jest.fn((tagName: string) => ({
    tagName: tagName.toUpperCase(),
    textContent: '',
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
};

// 模拟PerformanceObserver
class MockPerformanceObserver implements PerformanceObserver {
  static readonly supportedEntryTypes: readonly string[] = ['resource', 'navigation', 'paint'];

  constructor(callback: PerformanceObserverCallback) {
    this.callback = callback;
  }

  callback: PerformanceObserverCallback;

  observe(options: PerformanceObserverInit): void {
    const entryTypes = options.entryTypes || [];
    const entries: PerformanceResourceTiming[] = [{
      name: 'test-resource',
      entryType: 'resource',
      startTime: 0,
      duration: 100,
      initiatorType: 'fetch',
      nextHopProtocol: 'http/1.1',
      workerStart: 0,
      redirectStart: 0,
      redirectEnd: 0,
      fetchStart: 0,
      domainLookupStart: 0,
      domainLookupEnd: 0,
      connectStart: 0,
      connectEnd: 0,
      secureConnectionStart: 0,
      requestStart: 0,
      responseStart: 0,
      responseEnd: 100,
      transferSize: 1000,
      encodedBodySize: 1000,
      decodedBodySize: 1000,
      serverTiming: [],
      responseStatus: 200,
      toJSON: () => ({})
    }];

    const filteredEntries = entries.filter(entry => entryTypes.includes(entry.entryType));
    const entryList: PerformanceObserverEntryList = {
      getEntries: () => filteredEntries,
      getEntriesByName: (name: string) => filteredEntries.filter(entry => entry.name === name),
      getEntriesByType: (type: string) => filteredEntries.filter(entry => entry.entryType === type)
    };

    this.callback(entryList, this);
  }

  disconnect(): void {}
  takeRecords(): PerformanceEntryList {
    return [];
  }
}

// 模拟fetch
const mockFetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  })
);

// 在每个测试之前设置模拟
beforeEach(() => {
  // 模拟XMLHttpRequest
  Object.defineProperty(global, 'XMLHttpRequest', {
    value: MockXMLHttpRequest,
    writable: true
  });

  // 使用Object.defineProperty设置全局对象
  Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true
  });

  Object.defineProperty(global, 'document', {
    value: mockDocument,
    writable: true
  });

  Object.defineProperty(global, 'navigator', {
    value: mockWindow.navigator,
    writable: true
  });

  Object.defineProperty(global, 'PerformanceObserver', {
    value: MockPerformanceObserver,
    writable: true
  });

  Object.defineProperty(global, 'fetch', {
    value: mockFetch,
    writable: true
  });

  // 重置所有模拟函数
  jest.clearAllMocks();
});

// 在每个测试之后恢复原始的对象
afterEach(() => {
  window.XMLHttpRequest = originalXHR;
  window.PerformanceObserver = undefined as unknown as typeof PerformanceObserver;
  window.fetch = undefined as unknown as typeof fetch;
});