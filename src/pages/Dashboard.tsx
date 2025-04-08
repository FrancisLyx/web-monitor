import React, { useEffect, useState } from 'react'
import { Card, Typography, Box, CircularProgress, useTheme } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

import { MonitorStats, StatsData, MonitorData, MonitorDataType } from '../types/monitor.js'
import { mockApi } from '../mock/server.js'

const Dashboard: React.FC = () => {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statsData, setStatsData] = useState<StatsData[]>([])
  const [summary, setSummary] = useState({
    totalErrors: 0,
    avgLoadTime: 0,
    userActions: 0,
    resourceIssues: 0
  })

  useEffect(() => {
    fetchMonitorData()
  }, [])

  const fetchMonitorData = async () => {
    try {
      // 使用mock数据服务获取统计数据
      const stats = await mockApi.getMonitorStats()

      // 处理统计数据
      const hourlyData: StatsData[] = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        performance: 0,
        error: 0,
        behavior: 0,
        resource: 0
      }))

      stats.forEach((stat: MonitorStats) => {
        const hour = stat._id.hour
        const type = stat._id.type.toLowerCase()
        const validTypes = ['performance', 'error', 'behavior', 'resource']
        if (hourlyData[hour] && validTypes.includes(type)) {
          hourlyData[hour][type as keyof Omit<StatsData, 'hour'>] = stat.count
        }
      })

      setStatsData(hourlyData)

      // 使用mock数据服务获取监控数据
      const summaryData = await mockApi.getMonitorData()

      // 计算汇总指标
      const newSummary = {
        totalErrors: summaryData.filter((item) => (item.type as MonitorDataType) === 'error').length,
        avgLoadTime: calculateAverageLoadTime(summaryData as MonitorData[]),
        userActions: summaryData.filter((item) => (item.type as MonitorDataType) === 'behavior').length,
        resourceIssues: summaryData.filter((item) => (item.type as MonitorDataType) === 'resource' && item.data.duration && item.data.duration > 1000)
          .length
      }

      setSummary(newSummary)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const calculateAverageLoadTime = (data: MonitorData[]) => {
    const performanceData = data.filter((item) => item.type === 'performance')
    if (performanceData.length === 0) return 0

    const totalLoadTime = performanceData.reduce((sum, item) => sum + (item.data.loadTime || 0), 0)
    return Math.round(totalLoadTime / performanceData.length)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box p={3} sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        监控数据概览
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        <Card
          sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            backgroundColor: 'primary.light',
            color: 'white'
          }}
        >
          <Typography variant="subtitle1" sx={{ opacity: 0.8, mb: 2 }}>
            错误总数
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {summary.totalErrors}
          </Typography>
        </Card>
        <Card
          sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            backgroundColor: 'warning.light',
            color: 'white'
          }}
        >
          <Typography variant="subtitle1" sx={{ opacity: 0.8, mb: 2 }}>
            平均加载时间
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {summary.avgLoadTime}ms
          </Typography>
        </Card>
        <Card
          sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            backgroundColor: 'success.light',
            color: 'white'
          }}
        >
          <Typography variant="subtitle1" sx={{ opacity: 0.8, mb: 2 }}>
            用户行为数
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {summary.userActions}
          </Typography>
        </Card>
        <Card
          sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            backgroundColor: 'secondary.light',
            color: 'white'
          }}
        >
          <Typography variant="subtitle1" sx={{ opacity: 0.8, mb: 2 }}>
            资源异常数
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {summary.resourceIssues}
          </Typography>
        </Card>
      </Box>

      <Card sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 3 }}>
          24小时监控数据趋势
        </Typography>
        <Box
          height={400}
          sx={{
            '& .recharts-cartesian-grid-horizontal line, & .recharts-cartesian-grid-vertical line': {
              stroke: '#e0e0e0'
            },
            '& .recharts-tooltip-wrapper': {
              outline: 'none'
            }
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fill: 'text.secondary' }} axisLine={{ stroke: '#e0e0e0' }} />
              <YAxis tick={{ fill: 'text.secondary' }} axisLine={{ stroke: '#e0e0e0' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'background.paper',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px'
                }}
              />
              <Bar dataKey="performance" name="性能指标" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
              <Bar dataKey="error" name="错误数" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
              <Bar dataKey="behavior" name="用户行为" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
              <Bar dataKey="resource" name="资源加载" fill={theme.palette.warning.main} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </Box>
  )
}

export default Dashboard
