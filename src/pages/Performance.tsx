/**
 * 性能监控页面
 * 展示详细的性能指标数据
 */

import { useEffect, useState } from 'react';
import { Card, Table, Spin, Alert, Tabs, Row, Col, Statistic } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import { mockApi } from '../mock/server';
import dayjs from 'dayjs';

// 性能数据接口
interface PerformanceItem {
  loadTime: number;
  dnsTime: number;
  tcpTime: number;
  requestTime: number;
  domParseTime: number;
  whiteScreenTime: number;
  timeToInteractive: number;
  'first-paint'?: number;
  'first-contentful-paint'?: number;
  timestamp: number;
}

// 性能统计数据接口
interface PerformanceStats {
  loadTime?: number;
  dnsTime?: number;
  tcpTime?: number;
  requestTime?: number;
  domParseTime?: number;
  whiteScreenTime?: number;
  timeToInteractive?: number;
  'first-paint'?: number;
  'first-contentful-paint'?: number;
}

const Performance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    list: PerformanceItem[];
    stats: PerformanceStats;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await mockApi.getPerformanceData();
        setData(response);
        setError(null);
      } catch (err) {
        setError('获取性能数据失败');
        console.error('获取性能数据失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (data?.list && data.list.length > 0) {
      initCharts();
    }
  }, [data]);

  // 初始化图表
  const initCharts = () => {
    if (!data?.list) return;

    // 加载时间趋势图
    const loadTimeChart = document.getElementById('loadTimeChart');
    if (loadTimeChart) {
      const chart = echarts.init(loadTimeChart as HTMLElement);
      
      // 准备数据
      const sortedData = [...data.list].sort((a, b) => a.timestamp - b.timestamp);
      const timestamps = sortedData.map(item => dayjs(item.timestamp).format('MM-DD HH:mm'));
      const loadTimes = sortedData.map(item => item.loadTime);
      
      const option = {
        title: {
          text: '页面加载时间趋势'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: timestamps
        },
        yAxis: {
          type: 'value',
          name: '时间(ms)'
        },
        series: [
          {
            name: '加载时间',
            type: 'line',
            data: loadTimes,
            smooth: true,
            markLine: {
              data: [
                { type: 'average', name: '平均值' }
              ]
            }
          }
        ]
      };
      
      chart.setOption(option);
      window.addEventListener('resize', () => chart.resize());
    }

    // 关键性能指标对比图
    const metricsChart = document.getElementById('metricsChart');
    if (metricsChart) {
      const chart = echarts.init(metricsChart as HTMLElement);
      
      // 计算平均值
      const metrics = [
        { name: 'DNS解析', value: data.stats.dnsTime || 0 },
        { name: 'TCP连接', value: data.stats.tcpTime || 0 },
        { name: '请求响应', value: data.stats.requestTime || 0 },
        { name: 'DOM解析', value: data.stats.domParseTime || 0 },
        { name: '白屏时间', value: data.stats.whiteScreenTime || 0 },
        { name: '首次可交互', value: data.stats.timeToInteractive || 0 },
        { name: '首次绘制', value: data.stats['first-paint'] || 0 },
        { name: '首次内容绘制', value: data.stats['first-contentful-paint'] || 0 }
      ];
      
      const option = {
        title: {
          text: '关键性能指标对比'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'value',
          name: '时间(ms)'
        },
        yAxis: {
          type: 'category',
          data: metrics.map(item => item.name)
        },
        series: [
          {
            name: '平均耗时',
            type: 'bar',
            data: metrics.map(item => item.value)
          }
        ]
      };
      
      chart.setOption(option);
      window.addEventListener('resize', () => chart.resize());
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '页面加载时间',
      dataIndex: 'loadTime',
      key: 'loadTime',
      sorter: (a: PerformanceItem, b: PerformanceItem) => a.loadTime - b.loadTime,
      render: (time: number) => `${time} ms`
    },
    {
      title: 'DNS解析时间',
      dataIndex: 'dnsTime',
      key: 'dnsTime',
      render: (time: number) => `${time} ms`
    },
    {
      title: 'TCP连接时间',
      dataIndex: 'tcpTime',
      key: 'tcpTime',
      render: (time: number) => `${time} ms`
    },
    {
      title: '请求响应时间',
      dataIndex: 'requestTime',
      key: 'requestTime',
      render: (time: number) => `${time} ms`
    },
    {
      title: 'DOM解析时间',
      dataIndex: 'domParseTime',
      key: 'domParseTime',
      render: (time: number) => `${time} ms`
    },
    {
      title: '白屏时间',
      dataIndex: 'whiteScreenTime',
      key: 'whiteScreenTime',
      render: (time: number) => `${time} ms`
    },
    {
      title: '首次可交互时间',
      dataIndex: 'timeToInteractive',
      key: 'timeToInteractive',
      render: (time: number) => `${time} ms`
    }
  ];

  return (
    <div className="performance-page">
      <h2>性能监控</h2>
      
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      
      <Spin spinning={loading}>
        {data && (
          <>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="平均加载时间" 
                    value={data.stats.loadTime || 0} 
                    suffix="ms"
                    precision={0}
                    prefix={<LineChartOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="平均白屏时间" 
                    value={data.stats.whiteScreenTime || 0} 
                    suffix="ms"
                    precision={0}
                    prefix={<LineChartOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="平均首次绘制" 
                    value={data.stats['first-paint'] || 0} 
                    suffix="ms"
                    precision={0}
                    prefix={<LineChartOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="平均首次内容绘制" 
                    value={data.stats['first-contentful-paint'] || 0} 
                    suffix="ms"
                    precision={0}
                    prefix={<LineChartOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Tabs
              defaultActiveKey="charts"
              items={[
                {
                  key: 'charts',
                  label: '图表分析',
                  children: (
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Card>
                          <div id="loadTimeChart" style={{ height: 400 }}></div>
                        </Card>
                      </Col>
                      <Col span={24}>
                        <Card>
                          <div id="metricsChart" style={{ height: 400 }}></div>
                        </Card>
                      </Col>
                    </Row>
                  )
                },
                {
                  key: 'table',
                  label: '详细数据',
                  children: (
                    <Card>
                      <Table 
                        columns={columns} 
                        dataSource={data.list.map((item, index) => ({ ...item, key: index }))} 
                        scroll={{ x: 1200 }}
                        pagination={{ pageSize: 10 }}
                      />
                    </Card>
                  )
                }
              ]}
            />
          </>
        )}
      </Spin>
    </div>
  );
};

export default Performance;