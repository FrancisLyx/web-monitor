/**
 * 前端监控SDK核心文件
 * 负责收集各类监控指标并上报
 */

import type { SDKConfig } from './types'
import {
  MonitorData,
  MonitorDataType,
  ErrorData,
  ResourceData,
  PerformanceData,
  BehaviorData,
  ErrorMonitorData,
  PerformanceMonitorData,
  BehaviorMonitorData,
  ResourceMonitorData
} from '../types/monitor'

// 定义监控配置接口
interface MonitorConfig {
  appId: string
  reportUrl: string
  autoReport?: boolean
  reportInterval?: number
  enablePerformance?: boolean
  enableError?: boolean
  enableBehavior?: boolean
  enableResource?: boolean
  ignoreErrors?: (string | RegExp)[]
  ignoreUrls?: (string | RegExp)[]
  reportCallback?: (data: MonitorData[]) => void
}

// 定义设备信息接口
interface DeviceInfo {
  userAgent: string
  screenWidth: number
  screenHeight: number
  language: string
  platform: string
}

// 定义监控数据类型
type MonitorDataPayload = ErrorData | PerformanceData | BehaviorData | ResourceData

let instance: Monitor | null = null

export function init(config: SDKConfig) {
  if (instance) {
    console.warn('Monitor has already been initialized')
    return instance
  }
  const monitorConfig: MonitorConfig = {
    appId: config.appId,
    reportUrl: config.serverUrl,
    autoReport: config.autoTrack,
    reportInterval: 5000,
    enablePerformance: config.enablePerformance,
    enableError: config.enableError,
    enableBehavior: config.enableBehavior,
    enableResource: config.enableResource,
    ignoreErrors: config.ignoreErrors,
    ignoreUrls: config.ignoreUrls
  }
  instance = new Monitor(monitorConfig)
  return instance
}

export function getInstance() {
  if (!instance) {
    throw new Error('Monitor has not been initialized')
  }
  return instance
}

export * from './types'

const defaultConfig: MonitorConfig = {
  appId: '',
  reportUrl: '',
  autoReport: true,
  reportInterval: 5000,
  enablePerformance: true,
  enableError: true,
  enableBehavior: true,
  enableResource: true,
  ignoreErrors: [],
  ignoreUrls: []
}

// 定义监控基类
export abstract class BaseMonitor {
  protected abstract shouldIgnoreError(message: string): boolean
  protected abstract shouldIgnoreUrl(url: string): boolean
  protected abstract reportError(data: ErrorData): void
  protected abstract reportResource(data: ResourceData): void
  protected abstract addMonitorData(type: MonitorDataType, data: MonitorDataPayload): void
  public abstract addCustomData(type: MonitorDataType, data: MonitorDataPayload): void
  public abstract report(): void
}

// 监控SDK类
export class Monitor extends BaseMonitor {
  protected config: MonitorConfig
  private dataQueue: MonitorData[] = []
  private timer: number | null = null
  private deviceInfo: DeviceInfo

  constructor(config: MonitorConfig) {
    super()
    this.config = {
      ...defaultConfig,
      ...config
    }
    this.deviceInfo = this.getDeviceInfo()
    this.init()
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      platform: navigator.platform
    }
  }

  private init(): void {
    if (this.config.autoReport) {
      this.timer = window.setInterval(() => this.report(), this.config.reportInterval)
    }
  }

  protected shouldIgnoreError(message: string): boolean {
    return (
      this.config.ignoreErrors?.some((pattern: string | RegExp) => (pattern instanceof RegExp ? pattern.test(message) : message.includes(pattern))) ??
      false
    )
  }

  protected shouldIgnoreUrl(url: string): boolean {
    return (
      this.config.ignoreUrls?.some((pattern: string | RegExp) => (pattern instanceof RegExp ? pattern.test(url) : url.includes(pattern))) ?? false
    )
  }

  protected reportError(data: ErrorData): void {
    this.addMonitorData('error', data)
  }

  protected reportResource(data: ResourceData): void {
    this.addMonitorData('resource', data)
  }

  protected addMonitorData(type: MonitorDataType, data: MonitorDataPayload): void {
    const baseData = {
      appId: this.config.appId,
      timestamp: Date.now(),
      uuid: Math.random().toString(36).substring(2),
      deviceInfo: this.deviceInfo
    }

    let monitorData: MonitorData
    switch (type) {
      case 'error':
        monitorData = {
          ...baseData,
          type: 'error',
          data: data as ErrorData
        } as ErrorMonitorData
        break
      case 'performance':
        monitorData = {
          ...baseData,
          type: 'performance',
          data: data as PerformanceData
        } as PerformanceMonitorData
        break
      case 'behavior':
        monitorData = {
          ...baseData,
          type: 'behavior',
          data: data as BehaviorData
        } as BehaviorMonitorData
        break
      case 'resource':
        monitorData = {
          ...baseData,
          type: 'resource',
          data: data as ResourceData
        } as ResourceMonitorData
        break
      default:
        throw new Error(`Invalid monitor data type: ${type}`)
    }

    this.dataQueue.push(monitorData)
  }

  public addCustomData(type: MonitorDataType, data: MonitorDataPayload): void {
    this.addMonitorData(type, data)
  }

  public report(): void {
    if (this.dataQueue.length === 0) return

    const data = [...this.dataQueue]
    this.dataQueue = []

    // 发送数据到服务器
    this.config.reportCallback?.(data)
  }
}

// 添加自定义监控数据
export function addCustomData(type: MonitorDataType, data: MonitorDataPayload): void {
  const monitor = getInstance()
  monitor.addCustomData(type, data)
}

// 手动上报数据
export function report(): void {
  const monitor = getInstance()
  monitor.report()
}
