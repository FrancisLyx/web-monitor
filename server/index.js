const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

// 连接MongoDB数据库
mongoose.connect('mongodb://localhost:27017/web-monitor', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// 定义监控数据模型
const MonitorDataSchema = new mongoose.Schema({
  type: String,
  appId: String,
  timestamp: Number,
  uuid: String,
  deviceInfo: {
    userAgent: String,
    screenWidth: Number,
    screenHeight: Number,
    language: String,
    platform: String
  },
  data: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const MonitorData = mongoose.model('MonitorData', MonitorDataSchema);

// 接收监控数据的路由
app.post('/api/monitor/report', async (req, res) => {
  try {
    const monitorDataArray = req.body;
    
    // 批量插入监控数据
    await MonitorData.insertMany(monitorDataArray);
    
    res.status(200).json({ message: 'Data received successfully' });
  } catch (error) {
    console.error('Error saving monitor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取监控数据的路由
app.get('/api/monitor/data', async (req, res) => {
  try {
    const { type, appId, startTime, endTime } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (appId) query.appId = appId;
    if (startTime || endTime) {
      query.timestamp = {};
      if (startTime) query.timestamp.$gte = parseInt(startTime);
      if (endTime) query.timestamp.$lte = parseInt(endTime);
    }
    
    const data = await MonitorData.find(query)
      .sort({ timestamp: -1 })
      .limit(1000);
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching monitor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取统计数据的路由
app.get('/api/monitor/stats', async (req, res) => {
  try {
    const { appId, type, timeRange } = req.query;
    const endTime = Date.now();
    const startTime = endTime - (parseInt(timeRange) || 24 * 60 * 60 * 1000); // 默认24小时
    
    const query = {
      appId,
      timestamp: { $gte: startTime, $lte: endTime }
    };
    if (type) query.type = type;
    
    const stats = await MonitorData.aggregate([
      { $match: query },
      { $group: {
        _id: {
          type: '$type',
          hour: { $hour: { $toDate: '$timestamp' } }
        },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.hour': 1 } }
    ]);
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching monitor stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Monitor server is running on port ${port}`);
});