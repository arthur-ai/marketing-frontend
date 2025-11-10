'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import ErrorIcon from '@mui/icons-material/Error'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { OrchestratorControls } from '@/components/orchestrator/orchestrator-controls'
import { ContentSelector } from '@/components/orchestrator/content-selector'
import { PipelineSettings } from '@/components/pipeline/pipeline-settings'
import { usePipelineStats } from '@/hooks/useApi'

export default function PipelinePage() {
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const { data: statsData, isLoading: statsLoading } = usePipelineStats()

  const pipelineStats = statsData?.data

  const stats = [
    {
      label: 'Completed',
      value: pipelineStats?.completed || 0,
      color: 'success' as const,
      icon: <CheckCircleIcon />,
      change: pipelineStats?.completed_change_percent 
        ? `${pipelineStats.completed_change_percent > 0 ? '+' : ''}${pipelineStats.completed_change_percent.toFixed(0)}%`
        : 'N/A',
      changeColor: 'success.main',
    },
    {
      label: 'In Progress',
      value: pipelineStats?.in_progress || 0,
      color: 'warning' as const,
      icon: <HourglassEmptyIcon />,
      change: `${pipelineStats?.in_progress || 0} active`,
      changeColor: 'warning.main',
    },
    {
      label: 'Failed',
      value: pipelineStats?.failed || 0,
      color: 'error' as const,
      icon: <ErrorIcon />,
      change: pipelineStats ? `${Math.round(pipelineStats.success_rate * 100)}% success` : 'N/A',
      changeColor: 'success.main',
    },
    {
      label: 'Total Runs',
      value: pipelineStats?.total_runs || 0,
      color: 'primary' as const,
      icon: <PlayArrowIcon />,
      change: pipelineStats?.total_change_percent 
        ? `${pipelineStats.total_change_percent > 0 ? '+' : ''}${pipelineStats.total_change_percent.toFixed(0)}%`
        : 'N/A',
      changeColor: 'primary.main',
    },
  ]

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
          Marketing Pipeline
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and control your content processing pipeline
        </Typography>
      </Box>

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
              <Card elevation={0} sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 2, 
                      bgcolor: `${stat.color}.50`,
                      color: `${stat.color}.main`,
                    }}>
                      {stat.icon}
                    </Box>
                    <Chip
                      label={stat.change}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        bgcolor: 'transparent',
                        color: stat.changeColor,
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

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Orchestrator Controls */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <OrchestratorControls selectedContent={selectedContent} />
          </Paper>
        </Grid>

        {/* Pipeline Approval Settings */}
        <Grid size={{ xs: 12 }}>
          <PipelineSettings />
        </Grid>

        {/* Content Selection */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Select Content
            </Typography>
            <ContentSelector 
              onContentSelect={setSelectedContent}
              selectedContent={selectedContent}
            />
          </Paper>
        </Grid>

        {/* Pipeline Status */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Active Pipeline
            </Typography>
            
            <Paper 
              elevation={0} 
              sx={{ 
                mb: 3, 
                p: 2.5, 
                bgcolor: 'success.50', 
                borderRadius: 2,
                border: 1,
                borderColor: 'success.200'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 22 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Pipeline Ready
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                All systems operational • Last run: 2 minutes ago
              </Typography>
            </Paper>

            {/* Recent Jobs */}
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
              Recent Jobs
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { title: 'Blog Post Processing', status: 'completed', progress: 100, color: 'success' },
                { title: 'SEO Optimization', status: 'in_progress', progress: 65, color: 'warning' },
                { title: 'Content Analysis', status: 'queued', progress: 0, color: 'info' },
              ].map((job, index) => (
                <Paper 
                  key={index} 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: job.progress > 0 ? 1.5 : 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {job.title}
                    </Typography>
                    <Chip
                      label={job.status.replace('_', ' ')}
                      size="small"
                      color={job.color as any}
                      sx={{ textTransform: 'capitalize', height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                    />
                  </Box>
                  {job.progress > 0 && (
                    <LinearProgress
                      variant="determinate"
                      value={job.progress}
                      color={job.color as any}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                      }}
                    />
                  )}
                </Paper>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

