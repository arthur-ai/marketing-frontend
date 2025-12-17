'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ArticleIcon from '@mui/icons-material/Article'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AssessmentIcon from '@mui/icons-material/Assessment'
import { PostPerformance } from '@/components/analytics/post-performance'
import { 
  useDashboardStats, 
  usePipelineStats, 
  useContentStats, 
  useTrends 
} from '@/hooks/useApi'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { format } from 'date-fns'
import { getSourceDisplayName } from '@/utils/contentFormatters'

const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

export default function AnalyticsPage() {
  const [trendDays, setTrendDays] = useState<number>(7)
  const [activeTab, setActiveTab] = useState<number>(0)
  
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardStats()
  const { data: pipelineData, isLoading: pipelineLoading } = usePipelineStats()
  const { data: contentData, isLoading: contentLoading } = useContentStats()
  const { data: trendsData, isLoading: trendsLoading } = useTrends(trendDays)

  const dashboardStats = dashboardData?.data
  const pipelineStats = pipelineData?.data
  const contentStats = contentData?.data
  const trends = trendsData?.data

  const summaryCards = [
    {
      label: 'Total Content',
      value: dashboardStats?.total_content || 0,
      icon: <ArticleIcon />,
      color: 'primary',
      change: dashboardStats?.content_change_percent,
    },
    {
      label: 'Pipeline Runs',
      value: dashboardStats?.total_jobs || 0,
      icon: <AccountTreeIcon />,
      color: 'success',
      change: dashboardStats?.jobs_change_percent,
    },
    {
      label: 'Processing',
      value: dashboardStats?.jobs_processing || 0,
      icon: <AssessmentIcon />,
      color: 'warning',
      change: null,
    },
    {
      label: 'Success Rate',
      value: dashboardStats ? `${Math.round(dashboardStats.success_rate * 100)}%` : '0%',
      icon: <TrendingUpIcon />,
      color: 'info',
      change: dashboardStats?.success_rate_change_percent,
    },
  ]

  // Prepare chart data
  const trendChartData = trends?.data_points?.map(point => ({
    date: format(new Date(point.date), 'MMM dd'),
    total: point.total_jobs,
    completed: point.completed,
    failed: point.failed,
    successRate: Math.round(point.success_rate * 100),
  })) || []

  const statusDistributionData = pipelineStats ? [
    { name: 'Completed', value: pipelineStats.completed },
    { name: 'In Progress', value: pipelineStats.in_progress },
    { name: 'Failed', value: pipelineStats.failed },
    { name: 'Queued', value: pipelineStats.queued },
  ].filter(item => item.value > 0) : []

  const contentSourceData = contentStats?.by_source?.filter(source => source.active && source.total_items > 0).map(source => ({
    name: getSourceDisplayName(source.source_name),
    value: source.total_items,
  })) || []

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive analytics and performance insights
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="General Analytics" />
          <Tab label="Social Media Performance" />
        </Tabs>
      </Box>

      {/* Social Media Performance Tab */}
      {activeTab === 1 && (
        <PostPerformance />
      )}

      {/* General Analytics Tab */}
      {activeTab === 0 && (
        <>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardLoading ? (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          </Grid>
        ) : (
          summaryCards.map((card) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
              <Card elevation={0}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: `${card.color}.50`,
                      color: `${card.color}.main`,
                    }}>
                      {card.icon}
                    </Box>
                    {card.change !== null && card.change !== undefined && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: card.change >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 600 
                        }}
                      >
                        {card.change > 0 ? '+' : ''}{card.change.toFixed(1)}%
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Trends Over Time */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Pipeline Performance Trends
              </Typography>
              <ToggleButtonGroup
                value={trendDays}
                exclusive
                onChange={(_, newValue) => newValue && setTrendDays(newValue)}
                size="small"
              >
                <ToggleButton value={7}>7 Days</ToggleButton>
                <ToggleButton value={14}>14 Days</ToggleButton>
                <ToggleButton value={30}>30 Days</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            {trendsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendChartData}>
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
                    stroke="#2563eb" 
                    name="Total Jobs"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10b981" 
                    name="Completed"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="failed" 
                    stroke="#ef4444" 
                    name="Failed"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="successRate" 
                    stroke="#8b5cf6" 
                    name="Success Rate (%)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No trend data available
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Job Status Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Job Status Distribution
            </Typography>
            
            {pipelineLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : statusDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No job data available
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Content Sources Breakdown */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Content by Source
            </Typography>
            
            {contentLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : contentSourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contentSourceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" name="Content Items" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No content source data available
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Pipeline Performance Metrics */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Pipeline Performance Metrics
            </Typography>
            
            {pipelineLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : pipelineStats ? (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                      {Math.round(pipelineStats.success_rate * 100)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                      {pipelineStats.total_runs}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Runs
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main', mb: 1 }}>
                      {pipelineStats.avg_duration_seconds 
                        ? `${(pipelineStats.avg_duration_seconds / 60).toFixed(1)}m`
                        : 'N/A'
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Duration
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                      {pipelineStats.in_progress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Currently Processing
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No pipeline metrics available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
        </>
      )}
    </Box>
  )
}

