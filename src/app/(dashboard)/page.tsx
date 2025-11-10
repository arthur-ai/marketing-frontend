'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ArticleIcon from '@mui/icons-material/Article'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AssessmentIcon from '@mui/icons-material/Assessment'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import { useRouter } from 'next/navigation'
import { useDashboardStats, useRecentActivity } from '@/hooks/useApi'
import { formatDistanceToNow } from 'date-fns'

export default function DashboardPage() {
  const router = useRouter()
  const { data: statsData, isLoading: statsLoading } = useDashboardStats()
  const { data: activityData, isLoading: activityLoading } = useRecentActivity(7)

  const dashboardStats = statsData?.data
  const recentActivities = activityData?.data?.activities || []

  const stats = [
    {
      label: 'Total Content',
      value: dashboardStats?.total_content?.toString() || '0',
      change: dashboardStats?.content_change_percent 
        ? `${dashboardStats.content_change_percent > 0 ? '+' : ''}${dashboardStats.content_change_percent.toFixed(0)}%`
        : 'N/A',
      changePositive: (dashboardStats?.content_change_percent || 0) >= 0,
      icon: <ArticleIcon />,
      color: 'primary',
    },
    {
      label: 'Pipeline Runs',
      value: dashboardStats?.total_jobs?.toString() || '0',
      change: dashboardStats?.jobs_change_percent 
        ? `${dashboardStats.jobs_change_percent > 0 ? '+' : ''}${dashboardStats.jobs_change_percent.toFixed(0)}%`
        : 'N/A',
      changePositive: (dashboardStats?.jobs_change_percent || 0) >= 0,
      icon: <AccountTreeIcon />,
      color: 'success',
    },
    {
      label: 'Processing',
      value: dashboardStats?.jobs_processing?.toString() || '0',
      change: `${dashboardStats?.jobs_processing || 0} active`,
      changePositive: true,
      icon: <AssessmentIcon />,
      color: 'warning',
    },
    {
      label: 'Success Rate',
      value: dashboardStats ? `${Math.round(dashboardStats.success_rate * 100)}%` : '0%',
      change: dashboardStats?.success_rate_change_percent 
        ? `${dashboardStats.success_rate_change_percent > 0 ? '+' : ''}${dashboardStats.success_rate_change_percent.toFixed(0)}%`
        : 'N/A',
      changePositive: (dashboardStats?.success_rate_change_percent || 0) >= 0,
      icon: <TrendingUpIcon />,
      color: 'info',
    },
  ]

  const quickActions = [
    {
      title: 'Upload Content',
      description: 'Upload files or extract from URLs',
      icon: <CloudUploadIcon sx={{ fontSize: 40 }} />,
      color: 'primary',
      path: '/upload',
    },
    {
      title: 'Run Pipeline',
      description: 'Process content through pipeline',
      icon: <RocketLaunchIcon sx={{ fontSize: 40 }} />,
      color: 'success',
      path: '/pipeline',
    },
    {
      title: 'Browse Content',
      description: 'View and manage your content',
      icon: <ArticleIcon sx={{ fontSize: 40 }} />,
      color: 'info',
      path: '/content',
    },
  ]

  return (
    <Box>
      {/* Welcome Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome to Marketing Tool
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
          Transform your marketing content with AI-powered automation and intelligent workflows
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<RocketLaunchIcon />}
          onClick={() => router.push('/pipeline')}
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            fontWeight: 600,
            '&:hover': {
              bgcolor: 'grey.100',
            },
          }}
        >
          Start Processing
        </Button>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsLoading ? (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          </Grid>
        ) : (
          stats.map((stat) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
              <Card elevation={0}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: `${stat.color}.50`,
                        color: `${stat.color}.main`,
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Chip
                      label={stat.change}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        bgcolor: stat.changePositive ? 'success.50' : 'error.50',
                        color: stat.changePositive ? 'success.main' : 'error.main',
                        border: 'none',
                      }}
                    />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {quickActions.map((action) => (
                <Card
                  key={action.title}
                  elevation={0}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    bgcolor: `${action.color}.50`,
                    border: '2px solid transparent',
                    '&:hover': {
                      borderColor: `${action.color}.main`,
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                  onClick={() => router.push(action.path)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ color: `${action.color}.main` }}>{action.icon}</Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {action.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Recent Activity
            </Typography>
            {activityLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : recentActivities.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No recent activity
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentActivities.slice(0, 4).map((activity) => (
                  <Box key={activity.job_id} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {activity.title || `${activity.job_type.replace(/_/g, ' ')}: ${activity.job_id.substring(0, 8)}...`}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={activity.status}
                          size="small"
                          color={
                            activity.status === 'completed'
                              ? 'success'
                              : activity.status === 'processing'
                              ? 'warning'
                              : activity.status === 'failed'
                              ? 'error'
                              : 'default'
                          }
                          sx={{ textTransform: 'capitalize', height: 24, fontSize: '0.75rem' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </Typography>
                      </Box>
                    </Box>
                    {activity.progress > 0 && activity.progress < 100 && (
                      <LinearProgress
                        variant="determinate"
                        value={activity.progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'action.hover',
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

