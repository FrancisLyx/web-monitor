import dayjs from 'dayjs';

// 生成随机数据
const generateRandomData = (count: number) => {
  const data = [];
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const timestamp = now - (Math.random() * 24 * hourMs);
    data.push({
      type: ['performance', 'error', 'behavior', 'resource'][Math.floor(Math.random() * 4)],
      appId: 'your-app-id',
      timestamp,
      uuid: Math.random().toString(36).substring(2),
      deviceInfo: {
        userAgent: 'Mozilla/5.0',
        screenWidth: 1920,
        screenHeight: 1080,
        language: 'zh-CN',
        platform: 'MacIntel'
      },
      data: {
        loadTime: Math.round(Math.random() * 2000 + 500),
        dnsTime: Math.round(Math.random() * 100 + 10),
        tcpTime: Math.round(Math.random() * 100 + 20),
        requestTime: Math.round(Math.random() * 500 + 100),
        domParseTime: Math.round(Math.random() * 300 + 50),
        whiteScreenTime: Math.round(Math.random() * 200 + 100),
        timeToInteractive: Math.round(Math.random() * 1000 + 200),
        'first-paint': Math.round(Math.random() * 800 + 100),
        'first-contentful-paint': Math.round(Math.random() * 1000 + 200),
        duration: Math.round(Math.random() * 2000 + 100)
      }
    });
  }
  return data;
};

// 模拟API服务
export const mockApi = {
  // 获取性能数据
  async getPerformanceData() {
    const list = generateRandomData(50);
    const stats = {
      loadTime: Math.round(list.reduce((sum, item) => sum + item.data.loadTime, 0) / list.length),
      dnsTime: Math.round(list.reduce((sum, item) => sum + item.data.dnsTime, 0) / list.length),
      tcpTime: Math.round(list.reduce((sum, item) => sum + item.data.tcpTime, 0) / list.length),
      requestTime: Math.round(list.reduce((sum, item) => sum + item.data.requestTime, 0) / list.length),
      domParseTime: Math.round(list.reduce((sum, item) => sum + item.data.domParseTime, 0) / list.length),
      whiteScreenTime: Math.round(list.reduce((sum, item) => sum + item.data.whiteScreenTime, 0) / list.length),
      timeToInteractive: Math.round(list.reduce((sum, item) => sum + item.data.timeToInteractive, 0) / list.length),
      'first-paint': Math.round(list.reduce((sum, item) => sum + item.data['first-paint'], 0) / list.length),
      'first-contentful-paint': Math.round(list.reduce((sum, item) => sum + item.data['first-contentful-paint'], 0) / list.length)
    };
    return { list, stats };
  },

  // 获取监控统计数据
  async getMonitorStats() {
    const data = generateRandomData(100);
    const stats = [];
    
    // 按小时和类型分组统计
    for (let hour = 0; hour < 24; hour++) {
      ['performance', 'error', 'behavior', 'resource'].forEach(type => {
        stats.push({
          _id: { hour, type },
          count: Math.floor(Math.random() * 50)
        });
      });
    }
    
    return stats;
  },

  // 获取监控数据
  async getMonitorData() {
    return generateRandomData(100);
  }
};