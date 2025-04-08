const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// 告警规则模型
const AlertRuleSchema = new mongoose.Schema({
  name: String,
  appId: String,
  metricType: String,  // performance, error, behavior, resource
  condition: {
    metric: String,    // 具体指标：loadTime, errorCount, etc.
    operator: String,  // >, <, >=, <=, ==
    value: Number     // 阈值
  },
  duration: Number,   // 持续时间（分钟）
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  notification: {
    type: String,     // email, webhook
    target: String    // 邮箱地址或webhook URL
  }
}, { timestamps: true });

const AlertRule = mongoose.model('AlertRule', AlertRuleSchema);

// 告警记录模型
const AlertHistorySchema = new mongoose.Schema({
  ruleId: mongoose.Schema.Types.ObjectId,
  appId: String,
  metricType: String,
  metricValue: Number,
  status: {
    type: String,
    enum: ['triggered', 'resolved'],
    default: 'triggered'
  },
  notificationSent: Boolean,
  message: String
}, { timestamps: true });

const AlertHistory = mongoose.model('AlertHistory', AlertHistorySchema);

// 邮件发送配置
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',  // 替换为实际的SMTP服务器
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@example.com',  // 替换为实际的邮箱账号
    pass: 'your-password'            // 替换为实际的密码或授权码
  }
});

// 检查指标是否触发告警
async function checkMetricAlert(appId, metricType, metricData) {
  try {
    // 获取相关的告警规则
    const rules = await AlertRule.find({
      appId,
      metricType,
      status: 'active'
    });

    for (const rule of rules) {
      const { condition, duration } = rule;
      const currentValue = extractMetricValue(metricData, condition.metric);

      // 检查是否满足告警条件
      if (checkCondition(currentValue, condition.operator, condition.value)) {
        // 检查是否持续超过指定时间
        const alertHistory = await AlertHistory.findOne({
          ruleId: rule._id,
          status: 'triggered',
          createdAt: { $gte: new Date(Date.now() - duration * 60 * 1000) }
        });

        if (!alertHistory) {
          // 创建新的告警记录
          const alert = new AlertHistory({
            ruleId: rule._id,
            appId,
            metricType,
            metricValue: currentValue,
            message: generateAlertMessage(rule, currentValue)
          });
          await alert.save();

          // 发送通知
          await sendNotification(rule, alert);
        }
      } else {
        // 检查是否需要解除告警
        const activeAlert = await AlertHistory.findOne({
          ruleId: rule._id,
          status: 'triggered'
        });

        if (activeAlert) {
          activeAlert.status = 'resolved';
          await activeAlert.save();
          // 可以选择发送告警解除通知
        }
      }
    }
  } catch (error) {
    console.error('Error checking metric alert:', error);
  }
}

// 从监控数据中提取特定指标的值
function extractMetricValue(metricData, metric) {
  switch (metric) {
    case 'loadTime':
      return metricData.loadTime;
    case 'errorCount':
      return metricData.length;
    case 'lcp':
      return metricData.lcp;
    case 'fid':
      return metricData.fid;
    case 'cls':
      return metricData.cls;
    default:
      return null;
  }
}

// 检查条件是否满足
function checkCondition(value, operator, threshold) {
  switch (operator) {
    case '>':
      return value > threshold;
    case '<':
      return value < threshold;
    case '>=':
      return value >= threshold;
    case '<=':
      return value <= threshold;
    case '==':
      return value === threshold;
    default:
      return false;
  }
}

// 生成告警消息
function generateAlertMessage(rule, value) {
  return `Alert: ${rule.name}\nMetric: ${rule.condition.metric}\nCurrent Value: ${value}\nThreshold: ${rule.condition.operator} ${rule.condition.value}`;
}

// 发送通知
async function sendNotification(rule, alert) {
  try {
    if (rule.notification.type === 'email') {
      await sendEmailNotification(rule.notification.target, alert.message);
    } else if (rule.notification.type === 'webhook') {
      await sendWebhookNotification(rule.notification.target, alert);
    }

    alert.notificationSent = true;
    await alert.save();
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// 发送邮件通知
async function sendEmailNotification(email, message) {
  const mailOptions = {
    from: 'web-monitor@example.com',
    to: email,
    subject: 'Web Monitor Alert',
    text: message
  };

  await transporter.sendMail(mailOptions);
}

// 发送Webhook通知
async function sendWebhookNotification(webhookUrl, alert) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(alert)
  });
}

module.exports = {
  AlertRule,
  AlertHistory,
  checkMetricAlert
};