'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
} from '@mui/material'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface PostPerformanceProps {
  days?: number
  platform?: string
}

interface PerformanceData {
  total_posts: number
  completed_posts: number
  failed_posts: number
  success_rate: number
  average_quality_scores: Record<string, number>
  platform_breakdown: Record<string, {
    total: number
    completed: number
    failed: number
  }>
}

interface TrendData {
  trend_points: Array<{
    date: string
    total: number
    completed: number
    failed: number
    success_rate: number
    average_quality: number
  }>
  start_date: string
  end_date: string
}

export function PostPerformance({ days: initialDays = 30, platform: initialPlatform }: PostPerformanceProps) {
  const [days, setDays] = useState(initialDays)
  const [platform, setPlatform] = useState<string>(initialPlatform || '')
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [trendData, setTrendData] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [days, platform])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        days: days.toString(),
      })
      if (platform) {
        params.append('platform', platform)
      }

      const [performanceRes, trendsRes] = await Promise.all([
        fetch(`/api/v1/analytics/social-media/posts?${params}`),
        fetch(`/api/v1/analytics/social-media/trends?${params}`),
      ])

      const performance = await performanceRes.json()
      const trends = await trendsRes.json()

      setPerformanceData(performance)
      setTrendData(trends)
    } catch (error) {
      console.error('Failed to load performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!performanceData || !trendData) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Failed to load performance data</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Social Media Post Performance</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Days</InputLabel>
            <Select
              value={days}
              label="Days"
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <MenuItem value={7}>7 days</MenuItem>
              <MenuItem value={30}>30 days</MenuItem>
              <MenuItem value={60}>60 days</MenuItem>
              <MenuItem value={90}>90 days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Platform</InputLabel>
            <Select
              value={platform}
              label="Platform"
              onChange={(e) => setPlatform(e.target.value)}
            >
              <MenuItem value="">All Platforms</MenuItem>
              <MenuItem value="linkedin">LinkedIn</MenuItem>
              <MenuItem value="hackernews">HackerNews</MenuItem>
              <MenuItem value="email">Email</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Posts
              </Typography>
              <Typography variant="h4">{performanceData.total_posts}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">
                {performanceData.completed_posts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h4">
                {(performanceData.success_rate * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Failed
              </Typography>
              <Typography variant="h4" color="error.main">
                {performanceData.failed_posts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quality Scores */}
      {Object.keys(performanceData.average_quality_scores).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Average Quality Scores
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(performanceData.average_quality_scores).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${key.replace('_', ' ')}: ${value.toFixed(1)}`}
                  color={value > 80 ? 'success' : value > 60 ? 'warning' : 'default'}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Platform Breakdown */}
      {Object.keys(performanceData.platform_breakdown).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Platform Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(performanceData.platform_breakdown).map(([platform, data]) => ({
                platform: platform.charAt(0).toUpperCase() + platform.slice(1),
                completed: data.completed,
                failed: data.failed,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#4caf50" />
                <Bar dataKey="failed" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Trends Chart */}
      {trendData.trend_points.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Trends
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData.trend_points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="total"
                  stroke="#2196f3"
                  name="Total Posts"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="completed"
                  stroke="#4caf50"
                  name="Completed"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="failed"
                  stroke="#f44336"
                  name="Failed"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="success_rate"
                  stroke="#ff9800"
                  name="Success Rate"
                  strokeDasharray="5 5"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="average_quality"
                  stroke="#9c27b0"
                  name="Avg Quality"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

