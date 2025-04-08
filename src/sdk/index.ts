/**
 * 前端监控SDK核心文件
 * 负责收集各类监控指标并上报
 */

// 定义监控配置接口
export interface MonitorConfig {
  // 应用ID，用于区分不同应用
  appId: string;
  // 上报接口地址
  reportUrl: string;
  // 是否自动上报
  autoReport?: boolean;
  // 上报间隔(ms)
  reportInterval?: number;
  // 是否收集性能指标
  enablePerformance?: boolean;
  // 是否收集错误信息
  enableError?: boolean;
  // 是否收集用户行为
  enableBehavior?: boolean;
  // 是否收集资源加载信息
  enableResource?: boolean;
}

// 定义监控数据类型
export enum MonitorDataType {
  PERFORMANCE = 'performance', // 性能指标
  ERROR = 'error',            // 错误信息
  BEHAVIOR = 'behavior',      // 用户行为
  RESOURCE = 'resource',      // 资源加载
}

// 定义监控数据接口
export interface MonitorData {
  type: MonitorDataType;      // 数据类型
  appId: string;              // 应用ID
  timestamp: number;          // 时间戳
  uuid: string;               // 唯一标识
  deviceInfo: DeviceInfo;     // 设备信息
  data: any;                  // 具体数据
}

// 设备信息接口
export interface DeviceInfo {
  userAgent: string;          // 用户代理
  screenWidth: number;        // 屏幕宽度
  screenHeight: number;       // 屏幕高度
  language: string;           // 语言
  platform: string;           // 平台
}

// 监控SDK类
export class Monitor {
  private config: MonitorConfig;
  private dataQueue: MonitorData[] = [];
  private timer: number | null = null;
  private deviceInfo: DeviceInfo;

  constructor(config: MonitorConfig) {
    // 合并默认配置
    this.config = {
      autoReport: true,
      reportInterval: 10000, // 10秒上报一次
      enablePerformance: true,
      enableError: true,
      enableBehavior: true,
      enableResource: true,
      ...config
    };

    // 初始化设备信息
    this.deviceInfo = this.getDeviceInfo();

    // 初始化各类监控
    this.initMonitor();

    // 如果配置了自动上报，则启动定时上报
    if (this.config.autoReport) {
      this.startAutoReport();
    }
  }

  // 获取设备信息
  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      platform: navigator.platform
    };
  }

  // 初始化各类监控
  private initMonitor(): void {
    if (this.config.enablePerformance) {
      this.initPerformanceMonitor();
    }

    if (this.config.enableError) {
      this.initErrorMonitor();
    }

    if (this.config.enableBehavior) {
      this.initBehaviorMonitor();
    }

    if (this.config.enableResource) {
      this.initResourceMonitor();
    }
  }

  // 初始化性能监控
  private initPerformanceMonitor(): void {
    // 监听页面加载完成事件
    window.addEventListener('load', () => {
      // 延迟收集性能数据，确保数据准确
      setTimeout(() => {
        const performanceData = this.collectPerformanceData();
        this.addMonitorData(MonitorDataType.PERFORMANCE, performanceData);
      }, 1000);
    });
  }

  // 收集性能数据
  private collectPerformanceData(): any {
    if (!window.performance) {
      return {};
    }

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    // 计算关键性能指标
    const performanceData: any = {
      // 页面加载总时间
      loadTime: timing.loadEventEnd - timing.navigationStart,
      // DNS解析时间
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
      // TCP连接时间
      tcpTime: timing.connectEnd - timing.connectStart,
      // 请求响应时间
      requestTime: timing.responseEnd - timing.requestStart,
      // DOM解析时间
      domParseTime: timing.domComplete - timing.domLoading,
      // 白屏时间
      whiteScreenTime: timing.responseStart - timing.navigationStart,
      // 首次可交互时间
      timeToInteractive: timing.domInteractive - timing.navigationStart,
      // 导航类型
      navigationType: navigation.type
    };

    // 收集Paint指标
    if (window.performance && window.performance.getEntriesByType) {
      // 收集FCP（首次内容绘制）
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcpEntry) {
        performanceData.fcp = fcpEntry.startTime;
      }

      // 收集LCP（最大内容绘制）
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        performanceData.lcp = lastEntry.startTime;
        this.addMonitorData(MonitorDataType.PERFORMANCE, { type: 'lcp', value: lastEntry.startTime });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // 收集FID（首次输入延迟）
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          const fidData = {
            type: 'fid',
            value: entry.processingStart - entry.startTime,
            name: entry.name,
            timestamp: entry.startTime
          };
          this.addMonitorData(MonitorDataType.PERFORMANCE, fidData);
        });
      }).observe({ type: 'first-input', buffered: true });

      // 收集CLS（累积布局偏移）
      let clsValue = 0;
      let clsEntries: any[] = [];

      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = clsEntries[0];
            const lastSessionEntry = clsEntries[clsEntries.length - 1];
            if (firstSessionEntry && entry.startTime - lastSessionEntry.startTime < 1000 && entry.startTime - firstSessionEntry.startTime < 5000) {
              clsEntries.push(entry);
              clsValue += entry.value;
            } else {
              clsEntries = [entry];
              clsValue = entry.value;
            }
            this.addMonitorData(MonitorDataType.PERFORMANCE, { type: 'cls', value: clsValue });
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });

      // 收集TTFB（首字节时间）
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        performanceData.ttfb = navigationEntry.responseStart;
      }
    }

    return performanceData;
  }

  // 初始化错误监控
  private initErrorMonitor(): void {
    // 监听全局错误
    window.addEventListener('error', (event) => {
      const errorData = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.stack : null,
        type: 'js_error'
      };
      this.addMonitorData(MonitorDataType.ERROR, errorData);
    }, true);

    // 监听Promise未捕获异常
    window.addEventListener('unhandledrejection', (event) => {
      const errorData = {
        message: event.reason instanceof Error ? event.reason.message : String(event.reason),
        stack: event.reason instanceof Error ? event.reason.stack : null,
        type: 'promise_error'
      };
      this.addMonitorData(MonitorDataType.ERROR, errorData);
    });

    // 重写console.error
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const errorData = {
        message: args.map(arg => String(arg)).join(' '),
        type: 'console_error'
      };
      this.addMonitorData(MonitorDataType.ERROR, errorData);
      originalConsoleError.apply(console, args);
    };

    // 监听接口请求错误
    this.monitorXHR();
    this.monitorFetch();
  }

  // 监控XMLHttpRequest
  private monitorXHR(): void {
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    const self = this;

    XMLHttpRequest.prototype.open = function(...args: any[]) {
      // @ts-ignore
      this._monitor_xhr_info = {
        method: args[0],
        url: args[1],
        startTime: Date.now()
      };
      originalXHROpen.apply(this, args);
    };

    XMLHttpRequest.prototype.send = function(...args: any[]) {
      // @ts-ignore
      const xhrInfo = this._monitor_xhr_info;

      this.addEventListener('loadend', function() {
        // @ts-ignore
        if (this.status >= 400) {
          const errorData = {
            // @ts-ignore
            url: xhrInfo.url,
            // @ts-ignore
            method: xhrInfo.method,
            // @ts-ignore
            status: this.status,
            // @ts-ignore
            duration: Date.now() - xhrInfo.startTime,
            type: 'xhr_error'
          };
          self.addMonitorData(MonitorDataType.ERROR, errorData);
        }
      });

      originalXHRSend.apply(this, args);
    };
  }

  // 监控Fetch
  private monitorFetch(): void {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = function(...args: any[]) {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const method = args[1]?.method || 'GET';

      return originalFetch.apply(window, args).then(
        (response) => {
          if (!response.ok) {
            const errorData = {
              url,
              method,
              status: response.status,
              statusText: response.statusText,
              duration: Date.now() - startTime,
              type: 'fetch_error'
            };
            self.addMonitorData(MonitorDataType.ERROR, errorData);
          }
          return response;
        },
        (error) => {
          const errorData = {
            url,
            method,
            message: error.message,
            stack: error.stack,
            duration: Date.now() - startTime,
            type: 'fetch_error'
          };
          self.addMonitorData(MonitorDataType.ERROR, errorData);
          throw error;
        }
      );
    };
  }

  // 初始化用户行为监控
  private initBehaviorMonitor(): void {
    // 监听点击事件
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const behaviorData = {
        type: 'click',
        path: this.getElementPath(target),
        tagName: target.tagName.toLowerCase(),
        className: target.className,
        id: target.id,
        innerText: target.innerText?.substring(0, 50) || '',
        timestamp: Date.now()
      };
      this.addMonitorData(MonitorDataType.BEHAVIOR, behaviorData);
    }, true);

    // 监听页面路由变化
    this.monitorRouteChange();
  }

  // 获取元素路径
  private getElementPath(element: HTMLElement): string {
    if (!element || element === document.documentElement) {
      return '';
    }

    let path = '';
    let currentElement: HTMLElement | null = element;
    const maxDepth = 5; // 限制路径深度
    let depth = 0;

    while (currentElement && currentElement !== document.documentElement && depth < maxDepth) {
      let elementSelector = currentElement.tagName.toLowerCase();
      if (currentElement.id) {
        elementSelector += `#${currentElement.id}`;
      } else if (currentElement.className) {
        const className = currentElement.className.split(' ')[0];
        if (className) {
          elementSelector += `.${className}`;
        }
      }

      path = path ? `${elementSelector} > ${path}` : elementSelector;
      currentElement = currentElement.parentElement;
      depth++;
    }

    return path;
  }

  // 监控路由变化
  private monitorRouteChange(): void {
    // 监听 history 模式路由变化
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const self = this;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      self.recordRouteChange('pushState');
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      self.recordRouteChange('replaceState');
    };

    // 监听 popstate 事件
    window.addEventListener('popstate', () => {
      this.recordRouteChange('popstate');
    });

    // 监听 hashchange 事件
    window.addEventListener('hashchange', () => {
      this.recordRouteChange('hashchange');
    });
  }

  // 记录路由变化
  private recordRouteChange(changeType: string): void {
    const behaviorData = {
      type: 'route_change',
      changeType,
      url: location.href,
      path: location.pathname,
      timestamp: Date.now()
    };
    this.addMonitorData(MonitorDataType.BEHAVIOR, behaviorData);
  }

  // 初始化资源加载监控
  private initResourceMonitor(): void {
    // 使用 PerformanceObserver 监控资源加载
    if (window.PerformanceObserver) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            // 只关注资源加载
            if (entry.entryType === 'resource') {
              const resourceData = {
                name: entry.name,
                initiatorType: entry.initiatorType,
                duration: entry.duration,
                transferSize: (entry as PerformanceResourceTiming).transferSize,
                size: (entry as PerformanceResourceTiming).decodedBodySize,
                protocol: (entry as PerformanceResourceTiming).nextHopProtocol,
                timestamp: Date.now()
              };
              this.addMonitorData(MonitorDataType.RESOURCE, resourceData);
            }
          });
        });

        observer.observe({ entryTypes: ['resource'] });
      } catch (e) {
        console.error('PerformanceObserver error:', e);
      }
    }
  }

  // 添加监控数据到队列
  private addMonitorData(type: MonitorDataType, data: any): void {
    const monitorData: MonitorData = {
      type,
      appId: this.config.appId,
      timestamp: Date.now(),
      uuid: this.generateUUID(),
      deviceInfo: this.deviceInfo,
      data
    };

    this.dataQueue.push(monitorData);

    // 如果队列长度超过10，立即上报
    if (this.dataQueue.length >= 10) {
      this.report();
    }
  }

  // 生成UUID
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // 启动自动上报
  private startAutoReport(): void {
    if (this.timer !== null) {
      return;
    }

    this.timer = window.setInterval(() => {
      this.report();
    }, this.config.reportInterval);
  }

  // 停止自动上报
  public stopAutoReport(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // 手动上报数据
  public report(): void {
    if (this.dataQueue.length === 0) {
      return;
    }

    const data = [...this.dataQueue];
    this.dataQueue = [];

    // 使用 sendBeacon 上报数据，不阻塞页面卸载
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const success = navigator.sendBeacon(this.config.reportUrl, blob);
      if (success) {
        return;
      }
    }

    // 如果 sendBeacon 不可用或失败，使用 fetch 上报
    fetch(this.config.reportUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      // 使用 keepalive 确保数据在页面卸载时也能发送
      keepalive: true
    }).catch(err => {
      console.error('Monitor report error:', err);
    });
  }

  // 手动添加自定义监控数据
  public addCustomData(type: MonitorDataType, data: any): void {
    this.addMonitorData(type, data);
  }
}

// 导出单例实例
let instance: Monitor | null = null;

// 初始化监控SDK
export function init(config: MonitorConfig): Monitor {
  if (!instance) {
    instance = new Monitor(config);
  }
  return instance;
}

// 获取监控实例
export function getInstance(): Monitor | null {
  return instance;
}

// 添加自定义监控数据
export function addCustomData(type: MonitorDataType, data: any): void {
  if (instance) {
    instance.addCustomData(type, data);
  }
}

// 手动上报数据
export function report(): void {
  if (instance) {
    instance.report();
  }
}