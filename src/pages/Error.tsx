/**
 * 错误监控页面
 * 展示应用中捕获的各类错误信息
 */

import { useEffect, useState } from 'react';
import { Card, Table, Spin, Alert, Tabs, Row, Col, Statistic, Tag, Badge, Space, Tooltip } from 'antd';
import { WarningOutlined, BugOutlined, ApiOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import { mockApi } from '../mock/server';
import dayjs from 'dayjs';

// 错误数据接口
interface ErrorItem {
  id: string;
  type: 'js_error' | 'promise_error' | 'console_error' | 'xhr_error' | 'fetch_error';
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  url?: string;
  method?: string;
  status?: number;
  timestamp: number;
}

// 错误统计数据接口
interface ErrorStats {
  total: number;
  js_error: number;
  promise_error: number;
  console_error: number;
  xhr_error: number;
  fetch_error: number;
}

const Error = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    list: ErrorItem[];
    stats: ErrorStats;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await mockApi.getErrorData();
        setData(response);
        setError(null);
      } catch (err) {
        setError('获取错误数据失败');
        console.error('获取错误数据失败:', err);
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

    // 错误类型分布图
    const errorTypeChart = document.getElementById('errorTypeChart');
    if (errorTypeChart) {
      const chart = echarts.init(errorTypeChart);
      
      const option = {
        title: {
          text: '错误类型分布'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: ['JS异常', 'Promise异常', 'Console错误', 'XHR请求错误', 'Fetch请求错误']
        },
        series: [
          {
            name: '错误类型',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: data.stats.js_error, name: 'JS异常' },
              { value: data.stats.promise_error, name: 'Promise异常' },
              { value: data.stats.console_error, name: 'Console错误' },
              { value: data.stats.xhr_error, name: 'XHR请求错误' },
              { value: data.stats.fetch_error, name: 'Fetch请求错误' }
            ]
          }
        ]
      };
      
      chart.setOption(option);
      window.addEventListener('resize', () => chart.resize());
    }

    // 错误趋势图
    const errorTrendChart = document.getElementById('errorTrendChart');
    if (errorTrendChart) {
      const chart = echarts.init(errorTrendChart);
      
      // 按小时统计错误数量
      const hourlyData: Record<string, Record<string, number>> = {};
      const now = dayjs();
      const hours = Array.from({ length: 24 }, (_, i) => {
        const hour = now.subtract(i, 'hour').format('MM-DD HH:00');
        hourlyData[hour] = {
          js_error: 0,
          promise_error: 0,
          console_error: 0,
          xhr_error: 0,
          fetch_error: 0
        };
        return hour;
      }).reverse();

      // 统计每小时的错误数量
      data.list.forEach(item => {
        const hour = dayjs(item.timestamp).format('MM-DD HH:00');
        if (hourlyData[hour] && hourlyData[hour][item.type] !== undefined) {
          hourlyData[hour][item.type]++;
        }
      });

      const option = {
        title: {
          text: '24小时错误趋势'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['JS异常', 'Promise异常', 'Console错误', 'XHR请求错误', 'Fetch请求错误']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: hours
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'JS异常',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: hours.map(hour => hourlyData[hour].js_error)
          },
          {
            name: 'Promise异常',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: hours.map(hour => hourlyData[hour].promise_error)
          },
          {
            name: 'Console错误',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: hours.map(hour => hourlyData[hour].console_error)
          },
          {
            name: 'XHR请求错误',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: hours.map(hour => hourlyData[hour].xhr_error)
          },
          {
            name: 'Fetch请求错误',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: hours.map(hour => hourlyData[hour].fetch_error)
          }
        ]
      };
      
      chart.setOption(option);
      window.addEventListener('resize', () => chart.resize());
    }
  };

  // 获取错误类型标签
  const getErrorTypeTag = (type: string) => {
    switch (type) {
      case 'js_error':
        return <Tag color="red" icon={<BugOutlined />}>JS异常</Tag>;
      case 'promise_error':
        return <Tag color="orange" icon={<ExclamationCircleOutlined />}>Promise异常</Tag>;
      case 'console_error':
        return <Tag color="gold" icon={<WarningOutlined />}>Console错误</Tag>;
      case 'xhr_error':
        return <Tag color="purple" icon={<ApiOutlined />}>XHR请求错误</Tag>;
      case 'fetch_error':
        return <Tag color="blue" icon={<ApiOutlined />}>Fetch请求错误</Tag>;
      default:
        return <Tag color="default">未知类型</Tag>;
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
      title: '错误类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getErrorTypeTag(type),
      filters: [
        { text: 'JS异常', value: 'js_error' },
        { text: 'Promise异常', value: 'promise_error' },
        { text: 'Console错误', value: 'console_error' },
        { text: 'XHR请求错误', value: 'xhr_error' },
        { text: 'Fetch请求错误', value: 'fetch_error' }
      ],
      onFilter: (value: string, record: ErrorItem) => record.type === value
    },
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: {
        showTitle: false
      },
      render: (message: string) => (
        <Tooltip placement="topLeft" title={message}>
          <span>{message}</span>
        </Tooltip>
      )
    },
    {
      title: '文件',
      dataIndex: 'filename',
      key: 'filename',
      ellipsis: true,
      render: (filename: string, record: ErrorItem) => {
        if (!filename) return '-';
        return `${filename}:${record.lineno || 0}:${record.colno || 0}`;
      }
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (url: string) => url || '-'
    },
    {
      title: '状态码',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => status || '-'
    }
  ];

  const expandedRowRender = (record: ErrorItem) => {
    return (
      <div>
        {record.stack && (
          <div>
            <h4>错误堆栈:</h4>
            <pre style={{ maxHeight: '200px', overflow: 'auto', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
              {record.stack}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="error-page">
      <h2>错误监控</h2>
      
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      
      <Spin spinning={loading}>
        {data && (
          <>
            <Row gutter={[16, 16]}>
              <Col span={4}>
                <Card>
                  <Statistic 
                    title="总错误数" 
                    value={data.stats.total} 
                    prefix={<ExclamationCircleOutlined />}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic 
                    title="JS异常" 
                    value={data.stats.js_error} 
                    prefix={<BugOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic 
                    title="Promise异常" 
                    value={data.stats.promise_error} 
                    prefix={<ExclamationCircleOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic 
                    title="Console错误" 
                    value={data.stats.console_error} 
                    prefix={<WarningOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic 
                    title="XHR请求错误" 
                    value={data.stats.xhr_error} 
                    prefix={<ApiOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic 
                    title="Fetch请求错误" 
                    value={data.stats.fetch_error} 
                    prefix={<ApiOutlined />}
                    valueStyle={{ color: '#1890ff' }}
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
                      <Col span={12}>
                        <Card>
                          <div id="errorTypeChart" style={{ height: 400 }}></div>
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card>
                          <div id="errorTrendChart" style={{ height: 400 }}></div>
                        </Card>
                      </Col>
                    </Row>
                  )
                },
                {
                  key: 'table',
                  label: '错误列表',
                  children: (
                    <Card>
                      <Table 
                        columns={columns} 
                        dataSource={data.list.map(item => ({ ...item, key: item.id }))} 
                        expandable={{ expandedRowRender }}
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

export default Error;