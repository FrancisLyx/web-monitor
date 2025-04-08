// 监控数据类型定义

// 统计数据的类型
export interface MonitorStats {
  _id: {
    type: MonitorDataType
    hour: number
  }
  count: number
}

// 图表统计数据类型
export interface StatsData {
  hour: number
  performance: number
  error: number
  behavior: number
  resource: number
}

// 监控数据类型
export type MonitorDataType = 'error' | 'performance' | 'behavior' | 'resource'

// 错误数据类型
export type ErrorType = 'js_error' | 'promise_error' | 'console_error' | 'xhr_error' | 'fetch_error'

// 性能数据类型
export interface PerformanceData {
  loadTime: number
  duration: number
  dnsTime: number
  tcpTime: number
  requestTime: number
  domParseTime: number
  whiteScreenTime: number
  timeToInteractive: number
  'first-paint': number
  'first-contentful-paint': number
}

// 错误数据类型
export interface ErrorData {
  type?: ErrorType
  message?: string
  stack?: string
  filename?: string
  lineno?: number
  colno?: number
  url?: string
  method?: string
  status?: number
}

// 用户行为数据类型
export interface BehaviorData {
  eventType: string
  eventTarget: string
}

// 资源数据类型
export interface ResourceData {
  resourceUrl: string
  resourceType: string
}

// 基础监控数据接口
interface BaseMonitorData {
  appId: string
  uuid: string
  timestamp: number
  deviceInfo: {
    userAgent: string
    screenWidth: number
    screenHeight: number
    language: string
    platform: string
  }
}

// 错误监控数据接口
export interface ErrorMonitorData extends BaseMonitorData {
  type: 'error'
  data: ErrorData
}

// 性能监控数据接口
export interface PerformanceMonitorData extends BaseMonitorData {
  type: 'performance'
  data: PerformanceData
}

// 用户行为监控数据接口
export interface BehaviorMonitorData extends BaseMonitorData {
  type: 'behavior'
  data: BehaviorData
}

// 资源监控数据接口
export interface ResourceMonitorData extends BaseMonitorData {
  type: 'resource'
  data: ResourceData
}

// 监控数据联合类型
export type MonitorData = ErrorMonitorData | PerformanceMonitorData | BehaviorMonitorData | ResourceMonitorData
