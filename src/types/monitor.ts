// 监控数据类型定义

// 统计数据的类型
export interface MonitorStats {
  _id: {
    type: MonitorDataType;
    hour: number;
  };
  count: number;
}

// 图表统计数据类型
export interface StatsData {
  hour: number;
  performance: number;
  error: number;
  behavior: number;
  resource: number;
}

// 监控数据类型
export type MonitorDataType = 'error' | 'performance' | 'behavior' | 'resource';

// 监控数据接口
export interface MonitorData {
  type: MonitorDataType;
  data: {
    // 性能相关
    loadTime?: number;
    duration?: number;
    dnsTime?: number;
    tcpTime?: number;
    requestTime?: number;
    domParseTime?: number;
    whiteScreenTime?: number;
    timeToInteractive?: number;
    'first-paint'?: number;
    'first-contentful-paint'?: number;
    
    // 错误相关
    message?: string;
    stack?: string;
    
    // 用户行为相关
    eventType?: string;
    eventTarget?: string;
    
    // 资源相关
    resourceUrl?: string;
    resourceType?: string;
  };
  timestamp: number;
}