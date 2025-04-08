/**
 * 错误监控页面
 * 展示应用中捕获的各类错误信息
 */

import React, { useEffect, useState, useRef } from 'react'
import { Card, Table, Spin, Alert, Tabs, Row, Col, Statistic, Tag, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table/interface.js'
import { WarningOutlined, BugOutlined, ApiOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { ErrorMonitorData, ErrorType } from '../types/monitor.js'

// 错误数据接口
interface ErrorItem {
  key: string
  type: ErrorType
  message: string
  stack?: string
  filename?: string
  lineno?: number
  colno?: number
  url?: string
  method?: string
  status?: number
  timestamp: number
}

// 错误统计数据接口
interface ErrorStats {
  total: number
  js_error: number
  promise_error: number
  console_error: number
  xhr_error: number
  fetch_error: number
}

const Error = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorData, setErrorData] = useState<ErrorItem[]>([])
  const [errorStats, setErrorStats] = useState<ErrorStats>({
    total: 0,
    js_error: 0,
    promise_error: 0,
    console_error: 0,
    xhr_error: 0,
    fetch_error: 0
  })
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/monitor/data')
        const data: ErrorMonitorData[] = await response.json()

        // 过滤出错误数据并转换为 ErrorItem
        const errorItems = data.map((item) => ({
          key: item.uuid,
          type: item.data.type || 'js_error',
          message: item.data.message || 'Unknown error',
          stack: item.data.stack,
          filename: item.data.filename,
          lineno: item.data.lineno,
          colno: item.data.colno,
          url: item.data.url,
          method: item.data.method,
          status: item.data.status,
          timestamp: item.timestamp
        }))

        setErrorData(errorItems)

        // 计算错误统计
        const stats: ErrorStats = {
          total: errorItems.length,
          js_error: errorItems.filter((item) => item.type === 'js_error').length,
          promise_error: errorItems.filter((item) => item.type === 'promise_error').length,
          console_error: errorItems.filter((item) => item.type === 'console_error').length,
          xhr_error: errorItems.filter((item) => item.type === 'xhr_error').length,
          fetch_error: errorItems.filter((item) => item.type === 'fetch_error').length
        }
        setErrorStats(stats)

        // 初始化图表
        if (chartRef.current) {
          const myChart = echarts.init(chartRef.current)
          const option = {
            title: {
              text: '错误类型分布'
            },
            tooltip: {
              trigger: 'item'
            },
            legend: {
              orient: 'vertical',
              left: 'left'
            },
            series: [
              {
                name: '错误类型',
                type: 'pie',
                radius: '50%',
                data: [
                  { value: stats.js_error, name: 'JS错误' },
                  { value: stats.promise_error, name: 'Promise错误' },
                  { value: stats.console_error, name: 'Console错误' },
                  { value: stats.xhr_error, name: 'XHR错误' },
                  { value: stats.fetch_error, name: 'Fetch错误' }
                ],
                emphasis: {
                  itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                  }
                }
              }
            ]
          }
          myChart.setOption(option)
        }
      } catch (error) {
        setError('获取错误数据失败')
        console.error('获取错误数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (errorData.length > 0) {
      initCharts()
    }
  }, [errorData])

  // 初始化图表
  const initCharts = () => {
    if (errorData.length === 0) return

    // 错误类型分布图
    if (chartRef.current) {
      const chart = echarts.init(chartRef.current)

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
              { value: errorStats.js_error, name: 'JS异常' },
              { value: errorStats.promise_error, name: 'Promise异常' },
              { value: errorStats.console_error, name: 'Console错误' },
              { value: errorStats.xhr_error, name: 'XHR请求错误' },
              { value: errorStats.fetch_error, name: 'Fetch请求错误' }
            ]
          }
        ]
      }

      chart.setOption(option)
      window.addEventListener('resize', () => chart.resize())
    }

    // 错误趋势图
    const errorTrendChart = document.getElementById('errorTrendChart')
    if (errorTrendChart) {
      const chart = echarts.init(errorTrendChart)

      // 按小时统计错误数量
      const hourlyData: Record<string, Record<string, number>> = {}
      const now = dayjs()
      const hours = Array.from({ length: 24 }, (_, i) => {
        const hour = now.subtract(i, 'hour').format('MM-DD HH:00')
        hourlyData[hour] = {
          js_error: 0,
          promise_error: 0,
          console_error: 0,
          xhr_error: 0,
          fetch_error: 0
        }
        return hour
      }).reverse()

      // 统计每小时的错误数量
      errorData.forEach((item) => {
        const hour = dayjs(item.timestamp).format('MM-DD HH:00')
        if (hourlyData[hour] && hourlyData[hour][item.type] !== undefined) {
          hourlyData[hour][item.type]++
        }
      })

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
            data: hours.map((hour) => hourlyData[hour].js_error)
          },
          {
            name: 'Promise异常',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: hours.map((hour) => hourlyData[hour].promise_error)
          },
          {
            name: 'Console错误',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: hours.map((hour) => hourlyData[hour].console_error)
          },
          {
            name: 'XHR请求错误',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: hours.map((hour) => hourlyData[hour].xhr_error)
          },
          {
            name: 'Fetch请求错误',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: hours.map((hour) => hourlyData[hour].fetch_error)
          }
        ]
      }

      chart.setOption(option)
      window.addEventListener('resize', () => chart.resize())
    }
  }

  // 表格列定义
  const columns: ColumnsType<ErrorItem> = [
    {
      title: '错误类型',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'JS错误', value: 'js_error' },
        { text: 'Promise错误', value: 'promise_error' },
        { text: 'Console错误', value: 'console_error' },
        { text: 'XHR错误', value: 'xhr_error' },
        { text: 'Fetch错误', value: 'fetch_error' }
      ],
      onFilter: (value, record) => record.type === String(value),
      render: (type: ErrorType) => {
        const colorMap: Record<ErrorType, string> = {
          js_error: 'red',
          promise_error: 'orange',
          console_error: 'yellow',
          xhr_error: 'blue',
          fetch_error: 'purple'
        }
        return <Tag color={colorMap[type]}>{type}</Tag>
      }
    },
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    },
    {
      title: '文件',
      dataIndex: 'filename',
      key: 'filename',
      ellipsis: true
    },
    {
      title: '行号',
      dataIndex: 'lineno',
      key: 'lineno'
    },
    {
      title: '列号',
      dataIndex: 'colno',
      key: 'colno'
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => console.log('查看详情', record)}>查看详情</a>
        </Space>
      )
    }
  ]

  const expandedRowRender = (record: ErrorItem) => {
    return (
      <div>
        {record.stack && (
          <div>
            <h4>错误堆栈:</h4>
            <pre style={{ maxHeight: '200px', overflow: 'auto', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>{record.stack}</pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="error-page">
      <h2>错误监控</h2>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      <Spin spinning={loading}>
        {errorData.length > 0 && (
          <>
            <Row gutter={[16, 16]}>
              <Col span={4}>
                <Card>
                  <Statistic title="总错误数" value={errorStats.total} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#cf1322' }} />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic title="JS异常" value={errorStats.js_error} prefix={<BugOutlined />} valueStyle={{ color: '#ff4d4f' }} />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="Promise异常"
                    value={errorStats.promise_error}
                    prefix={<ExclamationCircleOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic title="Console错误" value={errorStats.console_error} prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic title="XHR请求错误" value={errorStats.xhr_error} prefix={<ApiOutlined />} valueStyle={{ color: '#722ed1' }} />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic title="Fetch请求错误" value={errorStats.fetch_error} prefix={<ApiOutlined />} valueStyle={{ color: '#1890ff' }} />
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
                          <div ref={chartRef} style={{ height: 400 }}></div>
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
                        dataSource={errorData}
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
  )
}

export default Error
