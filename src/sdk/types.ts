// SDK 配置类型
export interface SDKConfig {
  appId: string
  serverUrl: string
  debug?: boolean
  maxErrors?: number
  sampleRate?: number
  ignoreErrors?: (string | RegExp)[]
  ignoreUrls?: (string | RegExp)[]
  autoTrack?: boolean
  enablePerformance?: boolean
  enableError?: boolean
  enableBehavior?: boolean
  enableResource?: boolean
}

// 性能指标类型
export interface PerformanceMetrics {
  // 基本指标
  loadTime: number
  dnsTime: number
  tcpTime: number
  requestTime: number
  domParseTime: number
  whiteScreenTime: number
  timeToInteractive: number
  'first-paint'?: number
  'first-contentful-paint'?: number
  duration: number

  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
  inp?: number // Interaction to Next Paint

  // 资源加载指标
  resourceLoadTime?: number
  resourceCount?: number
  resourceSize?: number
  resourceTypes?: Record<string, number>

  // 内存指标
  memoryUsage?: {
    jsHeapSizeLimit: number
    totalJSHeapSize: number
    usedJSHeapSize: number
  }

  // 网络指标
  networkInfo?: {
    effectiveType: string
    rtt: number
    downlink: number
    saveData: boolean
  }

  // 自定义指标
  customMetrics?: Record<string, number>
}

// 错误类型
export type ErrorType = 'js_error' | 'promise_error' | 'console_error' | 'xhr_error' | 'fetch_error' | 'resource_error'

// 错误数据
export interface ErrorData {
  type: ErrorType
  message: string
  stack?: string
  filename?: string
  lineno?: number
  colno?: number
  url?: string
  method?: string
  status?: number
}

// 用户行为类型
export type BehaviorType = 'click' | 'input' | 'scroll' | 'route' | 'custom'

// 用户行为数据
export interface BehaviorData {
  type: BehaviorType
  element?: string
  value?: string
  url: string
  timestamp: number
}

// 资源数据
export interface ResourceData {
  name: string
  type: string
  duration: number
  size: number
  url: string
  timestamp: number
}

// 设备信息
export interface DeviceInfo {
  userAgent: string
  screenWidth: number
  screenHeight: number
  language: string
  platform: string
  networkType?: string
  memory?: number
}

// 基础数据
export interface BaseData {
  appId: string
  timestamp: number
  uuid: string
  deviceInfo: DeviceInfo
  url: string
  userAgent: string
}
