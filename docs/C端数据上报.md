### 用户意图分析
- 你要先聚焦前端部分，设计一套 H5 埋点工具（Web/H5 SDK），输出功能点与需求清单，便于后续实现与验收。

### 任务分流
- 通道: 快速通道（B）
- 定义成功: 输出一份结构化、可执行的 H5 埋点 SDK 功能与需求清单，并给出 TypeScript API/模型草案与验收标准。

---

## 范围与目标
- **范围**: 纯前端 H5（含 SPA、多页、WebView）埋点采集与上报，不含后端实现。
- **目标**:
  - 低侵入集成，自动采集核心信号（错误、性能、网络、页面）。
  - 统一事件模型与类型，保障数据质量与可扩展性。
  - 体积小、对性能影响极低；隐私合规可控；可灰度远程开关。

## 核心功能清单

### 初始化与配置
- **必需**
  - DSN/ProjectKey、`env`、`release`、`appId`、采样率、开关项（错误/性能/网络/页面/交互）。
  - 按环境/渠道的默认配置与覆盖策略（页面内配置优先级 < 远程配置 < 代码显式传参）。
- **可选**
  - 远程配置拉取（灰度/AB 分流、动态采样回执）。
  - 自定义传输器（Beacon/Fetch/XHR 可切换；失败回退策略）。

### 上下文与用户态
- **用户标识**: 匿名 ID（首启生成持久化）与可选登录用户 ID，`identify(userId, traits)`。
- **设备/环境**: UA 解析、语言/时区、屏幕尺寸、网络类型、是否 PWA/WebView。
- **会话**: `session_id` 管理（过期与续期），会话级属性（渠道、活动）。
- **全局上下文**: `setContext/mergeContext` 附加业务维度（如 `channel`, `bizLine`）。

### 自动采集
- **错误**
  - `error` 与 `unhandledrejection`，资源加载错误（`<img/script/link>`）。
  - SourceMap 反解上报所需 `stack`, `filename`, `lineno`, `colno`。
  - 错误去重（指纹），错误采样与保护阈值。
- **性能**
  - Web Vitals：FCP/LCP/CLS/INP/TTFB；TTI 可选。
  - `PerformanceResourceTiming` 采样与白名单（脚本/接口/图片）。
  - 首屏/可交互耗时采集（SPA 路由切换的首屏判定）。
- **网络**
  - XHR/Fetch 拦截：URL、方法、状态码、耗时、请求/响应大小。
  - 支持请求体/响应体脱敏；配置化忽略名单。
- **页面与交互**
  - `pageview`（首个与路由切换），`referrer`、`utm_*`、hash/router 模式兼容。
  - 可选曝光（IntersectionObserver）与点击（`data-track`）自动化。

### 手动埋点
- `track(eventName, properties?, options?)`
- `trackPageView(options?)`（支持自定义页面名/分组）
- `trackExposure(target, properties?)`（或传 rect/区域）
- 事件去重与节流（防抖/采样）

### 队列与上报
- **批量与压缩**: 批大小与时间窗口（如 20 条或 5s），gzip/deflate 可选。
- **传输策略**: `navigator.sendBeacon` 优先，退化至 Fetch → XHR。
- **离线缓存**: IndexedDB（主）+ localStorage（兜底）；断网重试，指数退避。
- **可靠性**: 至少一次投递、事件去重（`event_id`），页面卸载前 flush。

### 采样与动态控制
- 全局采样率与分事件采样（异常默认全量兜底）。
- 远程命中日志与调试开关（仅限特定用户/会话）。

### 隐私与合规
- 默认不采集 PII；字段白名单；可配置脱敏/截断（key 长度/值大小/属性数上限）。
- 同意管理（可接入站点的 consent 状态）；可关闭采集与清除本地缓存。
- URL/请求体关键字段掩码；错误堆栈路径去标识化。

### 插件与可扩展
- 插件机制：`use(plugin)`，生命周期钩子（init/beforeSend/afterSend）。
- 常用插件：热图/会话回放（非默认）、A/B 标签同步、渠道打点。

### 调试与自监控
- 调试面板（控制台日志分级）、本地镜像上报端点。
- SDK 自监控事件（丢包、上报耗时、错误）与健康心跳。
- 版本与配置上报（便于排查）。

### 兼容与降级策略
- 现代浏览器（ES2018+），自动降级无 PerformanceObserver/Beacon 的环境。
- SPA 框架适配（Vue/React/Router 钩子）；WebView（iOS/Android）URL 白名单。
- CORS/同源限制与 Cookie 不依赖；不强制第三方 cookie。

### 体积与性能预算
- 核心包 ≤ 20KB gzip（不含可选插件）。
- 初始化对首屏阻塞≈0；主线程占用 < 2ms/帧；监听器常驻开销可观测。

---

## TypeScript API 与模型（草案）

```ts
export type Environment = 'production' | 'staging' | 'development';

export interface SdkInitOptions {
  dsn: string;               // ingest 端点（含 key）
  appId: string;             // 应用唯一标识
  env: Environment;
  release?: string;          // web@1.2.3
  sampleRate?: number;       // 0..1
  enable?: {
    error?: boolean;
    performance?: boolean;
    network?: boolean;
    page?: boolean;
    interaction?: boolean;
  };
  transport?: TransportOptions;
  limits?: {
    maxPropsPerEvent?: number;     // 默认 50
    maxValueBytes?: number;        // 默认 1KB
    maxBatchSize?: number;         // 默认 20
    maxQueueBytes?: number;        // 默认 512KB
  };
  privacy?: {
    allowPII?: boolean;            // 默认 false
    maskFields?: string[];         // 属性路径白/黑名单
    urlMaskPatterns?: RegExp[];    // URL 掩码
  };
  context?: Partial<GlobalContext>;
}

export interface TransportOptions {
  useBeacon?: boolean;       // 默认 true
  flushIntervalMs?: number;  // 默认 5000
  retryBackoffMs?: [number, number, number]; // 指数退避步长
}

export interface GlobalContext {
  channel?: string;
  bizLine?: string;
  campaign?: string;
  device: {
    ua: string;
    language: string;
    timezone: string;
    screen: { width: number; height: number; dpr: number };
    network?: 'wifi' | '4g' | '5g' | 'unknown';
  };
  app: { platform: 'web'; version?: string };
}

export type Primitive = string | number | boolean | null;
export type ScalarOrArray = Primitive | Primitive[];

// 统一事件模型
export interface EventBase {
  eventId: string;
  type: 'error' | 'performance' | 'network' | 'biz' | 'pageview';
  name: string;                           // 事件名，如 js_error / page_view
  timestamp: number;                      // ms
  sessionId: string;
  userId?: string;
  anonymousId: string;
  env: Environment;
  release?: string;
  page?: { url: string; referrer?: string; title?: string };
  context?: Record<string, ScalarOrArray>;
  properties?: Record<string, ScalarOrArray>;
}

export interface ErrorEvent extends EventBase {
  type: 'error';
  name: 'js_error' | 'resource_error' | 'unhandled_rejection';
  properties: {
    message: string;
    stack?: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    fingerprint?: string;
    handled?: boolean;
  };
}

export interface PerformanceEvent extends EventBase {
  type: 'performance';
  name: 'web_vitals' | 'resource_timing' | 'first_screen';
  properties: Record<'FCP' | 'LCP' | 'CLS' | 'INP' | 'TTFB' | 'TTI', number> &
    { resource?: { name: string; type: string; duration: number } };
}

export interface NetworkEvent extends EventBase {
  type: 'network';
  name: 'http';
  properties: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    status: number;
    duration: number;
    requestSize?: number;
    responseSize?: number;
    ok: boolean;
    errorCategory?: '4xx' | '5xx' | 'network' | 'timeout' | 'abort';
  };
}

export interface PageviewEvent extends EventBase {
  type: 'pageview';
  name: 'page_view';
  properties: {
    pageName?: string;
    route?: string;
    isFirstPage?: boolean;
  };
}

export interface BizEvent extends EventBase {
  type: 'biz';
  name: string; // 业务命名：小写下划线，如 biz_order_submit
  properties?: Record<string, ScalarOrArray>;
}

export interface TrackOptions {
  dedupeKey?: string;     // 去重标识
  throttleMs?: number;    // 节流
  sampleRateOverride?: number;
}

// 公共 API
export interface WebMonitorSDK {
  init(options: SdkInitOptions): void;
  identify(userId: string, traits?: Record<string, ScalarOrArray>): void;
  setContext(ctx: Partial<GlobalContext>): void;
  mergeContext(ctx: Record<string, ScalarOrArray>): void;
  track(name: string, properties?: Record<string, ScalarOrArray>, options?: TrackOptions): void;
  trackPageView(properties?: PageviewEvent['properties']): void;
  flush(): Promise<void>;
  use(plugin: SdkPlugin): void;
  destroy(): void;
}

export interface SdkPlugin {
  name: string;
  setup(sdk: WebMonitorSDK): void;
  beforeSend?(event: EventBase): EventBase | null;  // null 表示丢弃
  afterSend?(result: { ok: boolean; code?: number }): void;
}
```

---

## 需求与约束清单（可实施）

- 集成方式
  - 提供 ESM 与 UMD 构建；`createWmSdk()` 工厂返回 `WebMonitorSDK`。
  - 单实例与多实例（不同项目/DSN）支持，默认单例。
- 自动采集能力开关
  - 可单独关闭错误/性能/网络/页面；插件按需加载。
- 队列与持久化
  - IndexedDB 表结构：`events(event_id, ts, type, payload_bytes)`；容量与淘汰策略（LRU）。
  - 每次 flush 限制批大小与总字节，避免阻塞。
- 可靠性与降级
  - 页面卸载 `visibilitychange/pagehide` 主动 flush；卸载失败自动 fallback。
  - Beacon 不可用时自动切换 Fetch/XHR；跨域 CORS header 要求由服务端满足。
- 采样与速率限制
  - 支持 per-event 的采样表达式（如按 URL、状态码）；异常事件全量兜底。
  - 全局速率限制（每分钟最大事件数）。
- 安全
  - 上报签名（可选）与时间戳/nonce，防重放（与后端配合）。
  - 属性白/黑名单，在 `beforeSend` 执行掩码。
- 兼容性
  - 现代浏览器：Chrome ≥ 61、Safari ≥ 12、iOS ≥ 12、Android ≥ 7；IE 不支持。
- 可观测性
  - 暴露内部日志级别与状态查看（队列长度、最后上报时间）。
- 性能
  - Observer 复用（Performance/Mutation/Intersection），避免监听器泛滥。
  - 资源性能采样率（避免大站资源过多）。

---

## 命名规范建议
- 事件名：小写下划线，业务事件以 `biz_` 前缀，如 `biz_order_submit`。
- 属性 key：小写下划线；避免嵌套超过 2 层；值类型遵循 `ScalarOrArray`。

---

## 验收标准（MVP）
- 体积 gzip ≤ 20KB；初始化 ≤ 10ms（冷启动命中缓存情况下）。
- 自动采集：JS 错误、UnhandledRejection、FCP/LCP/CLS/INP、XHR/Fetch（含状态码/耗时）、首个 `page_view`。
- 队列/上报：离线缓存可用；断网→恢复后投递成功率 ≥ 99%；卸载 flush 成功率 ≥ 98%。
- 采样：全局与 per-event 生效；错误事件默认全量。
- 隐私：超出限制属性被截断；敏感字段按配置掩码；URL 参数掩码支持。
- API：`init/identify/setContext/mergeContext/track/trackPageView/flush/use/destroy` 全部可用。
- 观测：可打印调试日志；可获取队列状态。

---

## 分阶段交付建议
- M1（核心通路，1–1.5 周）
  - 核心 SDK（初始化、队列、传输、错误/页面/网络/性能基础）。
  - TS 类型与最小文档（README 示例）；Demo 页面验证。
- M2（增强与治理，1 周）
  - 远程配置、属性治理（截断/掩码/限额）、分事件采样。
  - 插件机制与 1–2 个示例插件（曝光/交互）。
- M3（可观测与优化，1 周）
  - 自监控、调试面板、性能优化与体积预算达标。

---

## 非目标（当前不做）
- 会话回放/热图
- APM 级深度网络 Trace（端到端链路）
- 老旧浏览器（IE 系）适配

---

- 状态更新
  - 已输出 H5 埋点 SDK 的功能点与需求清单，并给出 TS API/数据模型草案与验收标准。下一步我可以基于此清单出一版任务分解与开发顺序（M1/M2/M3 的 issue 颗粒度），或直接起草最小可用的 SDK 目录结构与骨架代码。

- 变更摘要
  - 明确了 H5 SDK 的能力边界与优先级。
  - 提供了完整 API/事件类型定义草案（无 any）。
  - 给出性能/隐私/可靠性/兼容性等 NFR 与验收标准。