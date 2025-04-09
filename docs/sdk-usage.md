# Web Monitor SDK 使用文档

## 简介

Web Monitor SDK 是一个用于监控网页性能、错误、用户行为和资源加载的JavaScript库。它可以帮助开发者收集和分析网站的运行状况，从而优化用户体验。

## 安装

```bash
npm install web-monitor
# 或
yarn add web-monitor
```

## 快速开始

```typescript
import { WebMonitor } from 'web-monitor';

const monitor = new WebMonitor({
  appId: 'your-app-id',
  serverUrl: 'your-server-url',
  debug: true, // 开发环境建议开启
  autoTrack: true, // 自动追踪
  enablePerformance: true, // 启用性能监控
  enableError: true, // 启用错误监控
  enableBehavior: true, // 启用行为监控
  enableResource: true // 启用资源监控
});
```

## 配置选项

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| appId | string | 是 | - | 应用唯一标识 |
| serverUrl | string | 是 | - | 数据上报服务器地址 |
| debug | boolean | 否 | false | 是否开启调试模式 |
| maxErrors | number | 否 | 10 | 最大错误上报数量 |
| sampleRate | number | 否 | 1 | 采样率，0-1之间 |
| ignoreErrors | (string\|RegExp)[] | 否 | [] | 忽略的错误类型 |
| ignoreUrls | (string\|RegExp)[] | 否 | [] | 忽略的URL |
| autoTrack | boolean | 否 | true | 是否自动追踪 |
| enablePerformance | boolean | 否 | true | 是否启用性能监控 |
| enableError | boolean | 否 | true | 是否启用错误监控 |
| enableBehavior | boolean | 否 | true | 是否启用行为监控 |
| enableResource | boolean | 否 | true | 是否启用资源监控 |

## 功能特性

### 1. 性能监控

自动收集以下性能指标：
- 页面加载时间
- DNS解析时间
- TCP连接时间
- 请求响应时间
- DOM解析时间
- 白屏时间
- 首次可交互时间
- Core Web Vitals (LCP, FID, CLS, TTFB, INP)
- 资源加载指标
- 内存使用情况
- 网络信息

### 2. 错误监控

自动捕获以下错误：
- JavaScript运行时错误
- Promise未捕获错误
- 控制台错误
- XHR请求错误
- Fetch请求错误
- 资源加载错误

### 3. 用户行为监控

自动追踪以下用户行为：
- 点击事件
- 输入事件
- 滚动事件
- 路由变化
- 自定义事件

### 4. 资源监控

自动监控以下资源：
- 图片
- 脚本
- 样式表
- 字体
- 其他资源

## API 方法

### trackError

手动上报错误信息：

```typescript
monitor.trackError(new Error('自定义错误'));
// 或
monitor.trackError('错误信息');
```

### trackBehavior

手动上报用户行为：

```typescript
monitor.trackBehavior('custom', {
  action: 'button_click',
  page: 'home'
});
```

## 数据格式

### 基础数据

```typescript
interface BaseData {
  appId: string;          // 应用ID
  timestamp: number;      // 时间戳
  uuid: string;          // 唯一标识
  deviceInfo: {          // 设备信息
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    language: string;
    platform: string;
    networkType?: string;
    memory?: number;
  };
  url: string;           // 当前URL
  userAgent: string;     // 用户代理
}
```

## 注意事项

1. 在生产环境中，建议将 `debug` 设置为 `false`
2. 可以通过 `ignoreErrors` 和 `ignoreUrls` 过滤不需要监控的错误和URL
3. 使用 `sampleRate` 可以控制数据上报的频率，避免产生过多数据
4. 确保 `serverUrl` 配置正确，否则数据将无法上报

## 最佳实践

1. 在应用初始化时尽早初始化SDK
2. 合理配置采样率，避免产生过多数据
3. 使用 `ignoreErrors` 过滤已知的、不影响用户体验的错误
4. 定期检查性能指标，及时优化性能问题
5. 结合用户行为数据，优化关键用户路径

## 示例代码

```typescript
import { WebMonitor } from 'web-monitor';

// 初始化SDK
const monitor = new WebMonitor({
  appId: 'your-app-id',
  serverUrl: 'https://your-server.com/api/monitor',
  debug: process.env.NODE_ENV === 'development',
  maxErrors: 20,
  sampleRate: 0.5,
  ignoreErrors: [
    'Script error',
    /Network Error/i
  ],
  ignoreUrls: [
    /localhost/,
    /127.0.0.1/
  ]
});

// 手动上报错误
try {
  // 你的代码
} catch (error) {
  monitor.trackError(error);
}

// 手动上报用户行为
monitor.trackBehavior('custom', {
  action: 'purchase',
  amount: 100,
  productId: '123'
});
``` 