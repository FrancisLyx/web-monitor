import { SDKConfig, BaseData, ErrorData, BehaviorData, ResourceData, PerformanceMetrics } from './types'

// 定义网络连接类型
interface NetworkConnection {
  type?: string
  effectiveType?: string
  rtt?: number
  downlink?: number
  saveData?: boolean
}

// 定义内存使用类型
interface MemoryInfo {
  jsHeapSizeLimit: number
  totalJSHeapSize: number
  usedJSHeapSize: number
}

// 定义布局偏移类型
interface LayoutShift extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}

// 定义资源计时类型
interface ResourceTiming extends PerformanceEntry {
  initiatorType: string
  transferSize: number
  encodedBodySize: number
}

export class WebMonitor {
  private config: SDKConfig
  private errorCount: number = 0
  private queue: BaseData[] = []
  private isSending: boolean = false

  constructor(config: SDKConfig) {
    this.config = {
      debug: false,
      maxErrors: 10,
      sampleRate: 1,
      autoTrack: true,
      enablePerformance: true,
      enableError: true,
      enableBehavior: true,
      enableResource: true,
      ...config
    }

    this.init()
  }

  private init() {
    if (this.config.enableError) {
      this.initErrorMonitor()
    }
    if (this.config.enablePerformance) {
      this.initPerformanceMonitor()
    }
    if (this.config.enableBehavior) {
      this.initBehaviorMonitor()
    }
    if (this.config.enableResource) {
      this.initResourceMonitor()
    }
  }

  private getBaseData(): BaseData {
    return {
      appId: this.config.appId,
      timestamp: Date.now(),
      uuid: Math.random().toString(36).substring(2),
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        platform: navigator.platform,
        networkType: (navigator as { connection?: NetworkConnection }).connection?.type,
        memory: (navigator as { deviceMemory?: number }).deviceMemory
      },
      url: window.location.href,
      userAgent: navigator.userAgent
    }
  }

  private initErrorMonitor() {
    // JS错误监控
    window.addEventListener(
      'error',
      (event) => {
        if (this.shouldIgnoreError(event.message)) return

        const errorData: ErrorData = {
          type: 'js_error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
        this.reportError(errorData)
      },
      true
    )

    // Promise错误监控
    window.addEventListener('unhandledrejection', (event) => {
      if (this.shouldIgnoreError(event.reason?.message || event.reason)) return

      const errorData: ErrorData = {
        type: 'promise_error',
        message: event.reason?.message || event.reason
      }
      this.reportError(errorData)
    })

    // 重写console.error
    const originalConsoleError = console.error
    console.error = (...args) => {
      if (this.shouldIgnoreError(args[0])) return

      const errorData: ErrorData = {
        type: 'console_error',
        message: args.map((arg) => String(arg)).join(' ')
      }
      this.reportError(errorData)
      originalConsoleError.apply(console, args)
    }

    // XHR错误监控
    const originalXHR = window.XMLHttpRequest
    const boundShouldIgnoreUrl = this.shouldIgnoreUrl.bind(this)
    const boundReportError = this.reportError.bind(this)

    function createXHRWrapper() {
      function XMLHttpRequestWrapper() {
        const xhr = new originalXHR()
        const originalOpen = xhr.open.bind(xhr)

        xhr.open = function(method: string, url: string, async = true, username?: string | null, password?: string | null) {
          if (boundShouldIgnoreUrl(url)) return originalOpen(method, url, Boolean(async), username, password)

          xhr.addEventListener('error', () => {
            const errorData: ErrorData = {
              type: 'xhr_error',
              message: `XHR request failed: ${method} ${url}`,
              url,
              method,
              status: xhr.status
            }
            boundReportError(errorData)
          })
          return originalOpen(method, url, Boolean(async), username, password)
        }

        return xhr
      }

      return XMLHttpRequestWrapper as unknown as typeof XMLHttpRequest
    }

    window.XMLHttpRequest = createXHRWrapper()

    // Fetch错误监控
    const originalFetch = window.fetch
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      return originalFetch(input, init).catch((error) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
        if (boundShouldIgnoreUrl(url)) throw error

        const errorData: ErrorData = {
          type: 'fetch_error',
          message: `Fetch request failed: ${url}`,
          url,
          method: init?.method || 'GET'
        }
        boundReportError(errorData)
        throw error
      })
    }
  }

  private initPerformanceMonitor() {
    if (!window.performance) return

    // 监听页面加载完成
    window.addEventListener('load', () => {
      const timing = window.performance.timing
      const metrics: PerformanceMetrics = {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
        tcpTime: timing.connectEnd - timing.connectStart,
        requestTime: timing.responseEnd - timing.requestStart,
        domParseTime: timing.domComplete - timing.domLoading,
        whiteScreenTime: timing.domLoading - timing.navigationStart,
        timeToInteractive: timing.domInteractive - timing.navigationStart,
        duration: timing.loadEventEnd - timing.navigationStart
      }

      // 获取首次绘制时间
      const paint = performance.getEntriesByType('paint')
      if (paint.length) {
        metrics['first-paint'] = paint[0].startTime
        metrics['first-contentful-paint'] = paint[1]?.startTime
      }

      // 收集 Core Web Vitals
      this.collectCoreWebVitals(metrics)

      // 收集资源加载指标
      this.collectResourceMetrics(metrics)

      // 收集内存指标
      this.collectMemoryMetrics(metrics)

      // 收集网络指标
      this.collectNetworkMetrics(metrics)

      this.reportPerformance(metrics)
    })

    // 监听用户交互
    this.initInteractionMonitoring()
  }

  private collectCoreWebVitals(metrics: PerformanceMetrics) {
    // LCP (Largest Contentful Paint)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      metrics.lcp = lastEntry.startTime
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // FID (First Input Delay)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach((entry) => {
        const firstInput = entry as PerformanceEventTiming
        metrics.fid = firstInput.processingStart - firstInput.startTime
      })
    }).observe({ type: 'first-input', buffered: true })

    // CLS (Cumulative Layout Shift)
    let clsValue = 0
    let clsEntries: LayoutShift[] = []

    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as LayoutShift[]
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = clsEntries[0]
          const lastSessionEntry = clsEntries[clsEntries.length - 1]
          if (firstSessionEntry && entry.startTime - lastSessionEntry.startTime < 1000 && entry.startTime - firstSessionEntry.startTime < 5000) {
            clsEntries.push(entry)
            clsValue += entry.value
          } else {
            clsEntries = [entry]
            clsValue = entry.value
          }
          metrics.cls = clsValue
        }
      })
    }).observe({ entryTypes: ['layout-shift'] })

    // TTFB (Time to First Byte)
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      metrics.ttfb = navigationEntry.responseStart
    }
  }

  private collectResourceMetrics(metrics: PerformanceMetrics) {
    const resources = performance.getEntriesByType('resource') as ResourceTiming[]
    metrics.resourceCount = resources.length
    metrics.resourceLoadTime = resources.reduce((sum, entry) => sum + entry.duration, 0)
    metrics.resourceSize = resources.reduce((sum, entry) => sum + entry.transferSize || 0, 0)

    const resourceTypes: Record<string, number> = {}
    resources.forEach((entry) => {
      const type = entry.initiatorType
      resourceTypes[type] = (resourceTypes[type] || 0) + 1
    })
    metrics.resourceTypes = resourceTypes
  }

  private collectMemoryMetrics(metrics: PerformanceMetrics) {
    const memory = (performance as { memory?: MemoryInfo }).memory
    if (memory) {
      metrics.memoryUsage = {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize
      }
    }
  }

  private collectNetworkMetrics(metrics: PerformanceMetrics) {
    const connection = (navigator as { connection?: NetworkConnection }).connection
    if (connection) {
      metrics.networkInfo = {
        effectiveType: connection.effectiveType || '',
        rtt: connection.rtt || 0,
        downlink: connection.downlink || 0,
        saveData: connection.saveData || false
      }
    }
  }

  private initInteractionMonitoring() {
    let lastInteractionTime = 0
    let interactionCount = 0

    const handleInteraction = () => {
      const now = Date.now()
      if (now - lastInteractionTime > 1000) {
        interactionCount++
        lastInteractionTime = now
      }
    }

    document.addEventListener('keydown', handleInteraction)
    document.addEventListener('scroll', handleInteraction)

    // 定期报告交互指标
    setInterval(() => {
      if (interactionCount > 0) {
        const baseMetrics = this.getBasePerformanceMetrics()
        this.reportPerformance({
          ...baseMetrics,
          customMetrics: {
            interactionCount,
            interactionRate: interactionCount / 60 // 每分钟的交互次数
          }
        })
        interactionCount = 0
      }
    }, 60000)
  }

  private getBasePerformanceMetrics(): PerformanceMetrics {
    const timing = window.performance.timing
    return {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
      tcpTime: timing.connectEnd - timing.connectStart,
      requestTime: timing.responseEnd - timing.requestStart,
      domParseTime: timing.domComplete - timing.domLoading,
      whiteScreenTime: timing.domLoading - timing.navigationStart,
      timeToInteractive: timing.domInteractive - timing.navigationStart,
      duration: timing.loadEventEnd - timing.navigationStart
    }
  }

  private initBehaviorMonitor() {
    if (!this.config.autoTrack) return

    // 点击事件监控
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const behaviorData: BehaviorData = {
        type: 'click',
        element: target.tagName.toLowerCase(),
        url: window.location.href,
        timestamp: Date.now()
      }
      this.reportBehavior(behaviorData)
    })

    // 输入事件监控
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement
      const behaviorData: BehaviorData = {
        type: 'input',
        element: target.tagName.toLowerCase(),
        value: target.value,
        url: window.location.href,
        timestamp: Date.now()
      }
      this.reportBehavior(behaviorData)
    })

    // 滚动事件监控
    let scrollTimer: number
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(() => {
        const behaviorData: BehaviorData = {
          type: 'scroll',
          url: window.location.href,
          timestamp: Date.now()
        }
        this.reportBehavior(behaviorData)
      }, 100)
    })

    // 路由变化监控
    const originalPushState = history.pushState
    const boundReportBehavior = this.reportBehavior.bind(this)
    history.pushState = (data: unknown, unused: string, url?: string | URL | null) => {
      const behaviorData: BehaviorData = {
        type: 'route',
        url: window.location.href,
        timestamp: Date.now()
      }
      boundReportBehavior(behaviorData)
      return originalPushState.apply(history, [data, unused, url])
    }
  }

  private initResourceMonitor() {
    if (!window.performance) return

    // 监听资源加载
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (this.shouldIgnoreUrl(entry.name)) return

        const resourceData: ResourceData = {
          name: entry.name,
          type: (entry as ResourceTiming).initiatorType,
          duration: entry.duration,
          size: (entry as ResourceTiming).encodedBodySize || 0,
          url: entry.name,
          timestamp: Date.now()
        }
        this.reportResource(resourceData)
      })
    })

    observer.observe({ entryTypes: ['resource'] })
  }

  private shouldIgnoreError(message: string): boolean {
    if (!this.config.ignoreErrors) return false
    return this.config.ignoreErrors.some((pattern) => {
      if (typeof pattern === 'string') {
        return message.includes(pattern)
      }
      return pattern.test(message)
    })
  }

  private shouldIgnoreUrl(url: string): boolean {
    if (!this.config.ignoreUrls) return false
    return this.config.ignoreUrls.some((pattern) => {
      if (typeof pattern === 'string') {
        return url.includes(pattern)
      }
      return pattern.test(url)
    })
  }

  private reportError(errorData: ErrorData) {
    if (this.errorCount >= this.config.maxErrors!) return
    this.errorCount++

    const data = {
      ...this.getBaseData(),
      type: 'error',
      data: errorData
    }

    this.sendData(data)
  }

  private reportPerformance(metrics: PerformanceMetrics) {
    const data = {
      ...this.getBaseData(),
      type: 'performance',
      data: metrics
    }

    this.sendData(data)
  }

  private reportBehavior(behaviorData: BehaviorData) {
    const data = {
      ...this.getBaseData(),
      type: 'behavior',
      data: behaviorData
    }

    this.sendData(data)
  }

  private reportResource(resourceData: ResourceData) {
    const data = {
      ...this.getBaseData(),
      type: 'resource',
      data: resourceData
    }

    this.sendData(data)
  }

  private async sendData(data: BaseData) {
    if (Math.random() > this.config.sampleRate!) return

    this.queue.push(data)
    if (this.isSending) return

    this.isSending = true
    while (this.queue.length) {
      const item = this.queue.shift()
      try {
        await fetch(this.config.serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item)
        })
      } catch (error) {
        if (this.config.debug) {
          console.error('Failed to send data:', error)
        }
        // 发送失败时重新加入队列
        this.queue.unshift(item!)
        break
      }
    }
    this.isSending = false
  }

  // 手动上报错误
  public trackError(error: Error | string) {
    const errorData: ErrorData = {
      type: 'js_error',
      message: typeof error === 'string' ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined
    }
    this.reportError(errorData)
  }

  // 手动上报行为
  public trackBehavior(type: string, data?: Record<string, unknown>) {
    const behaviorData: BehaviorData = {
      type: 'custom',
      element: type,
      value: data ? JSON.stringify(data) : undefined,
      url: window.location.href,
      timestamp: Date.now()
    }
    this.reportBehavior(behaviorData)
  }
}
