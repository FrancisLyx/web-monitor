# Web Monitor 服务端

这是Web Monitor项目的后端服务，负责接收、存储和分析前端监控数据。

## 功能特性

- 接收并存储前端监控数据
- 提供数据查询和统计分析API
- 支持多应用监控数据隔离
- 提供时间范围和类型过滤

## 技术栈

- Node.js
- Express
- MongoDB

## 安装要求

- Node.js 14.0+
- MongoDB 4.0+

## 快速开始

1. 安装依赖
```bash
cd server
npm install
```

2. 配置MongoDB

确保MongoDB服务已启动，默认连接地址为：`mongodb://localhost:27017/web-monitor`

3. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务默认运行在 http://localhost:3000

## API接口

### 1. 上报监控数据
- POST `/api/monitor/report`
- 请求体：监控数据数组

### 2. 获取监控数据
- GET `/api/monitor/data`
- 查询参数：
  - type: 数据类型
  - appId: 应用ID
  - startTime: 开始时间戳
  - endTime: 结束时间戳

### 3. 获取统计数据
- GET `/api/monitor/stats`
- 查询参数：
  - appId: 应用ID
  - type: 数据类型
  - timeRange: 时间范围（毫秒）

## 注意事项

1. 生产环境部署时请修改MongoDB连接配置
2. 建议配置数据库索引以提升查询性能
3. 考虑添加身份验证和访问控制