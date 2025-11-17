'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import ErrorIcon from '@mui/icons-material/Error'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications'
import { OrchestratorControls } from '@/components/orchestrator/orchestrator-controls'
import { ContentSelector } from '@/components/orchestrator/content-selector'
import { PipelineSettings } from '@/components/pipeline/pipeline-settings'
import { usePipelineStats } from '@/hooks/useApi'
import { useRouter } from 'next/navigation'
import Button from '@mui/material/Button'

export default function PipelinePage() {
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const { data: statsData, isLoading: statsLoading } = usePipelineStats()
  const router = useRouter()

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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            Marketing Pipeline
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and control your content processing pipeline
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<SettingsApplicationsIcon />}
          onClick={() => router.push('/pipeline/steps')}
          sx={{ mt: 1 }}
        >
          Execute Individual Steps
        </Button>
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
        <Grid size={{ xs: 12 }}>
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

      </Grid>
    </Box>
  )
}

