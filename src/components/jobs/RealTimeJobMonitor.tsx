/**
 * Real-Time Job Monitor Component
 *
 * Displays live job status updates via WebSocket.
 * Shows active jobs with real-time progress tracking.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
  Stack,
  Badge,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as PlayArrowIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Pause as PauseIcon,
} from '@mui/icons-material'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useListJobs } from '@/hooks/useApi'

export interface ActiveJob {
  id: string
  type: string
  status: 'pending' | 'processing' | 'waiting_approval' | 'completed' | 'failed'
  progress: number
  current_step?: string
  total_steps?: number
  completed_steps?: number
  started_at: string
  error?: string
}

export function RealTimeJobMonitor() {
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)
  const [activeJobs, setActiveJobs] = useState<Map<string, ActiveJob>>(new Map())

  // Fetch initial jobs list
  const { data: jobsData } = useListJobs()

  // WebSocket connection for real-time job updates
  const { lastMessage, isConnected } = useWebSocket('/ws/jobs', {
    autoReconnect: true,
  })

  // Initialize active jobs from API
  useEffect(() => {
    if (jobsData?.data?.jobs) {
      const jobs = new Map<string, ActiveJob>()
      jobsData.data.jobs
        .filter((job: any) => ['pending', 'processing', 'waiting_approval'].includes(job.status))
        .forEach((job: any) => {
          jobs.set(job.id, {
            id: job.id,
            type: job.type || 'Unknown',
            status: job.status,
            progress: job.progress || 0,
            current_step: job.current_step,
            total_steps: job.metadata?.total_steps,
            completed_steps: job.metadata?.completed_steps,
            started_at: job.created_at || new Date().toISOString(),
            error: job.error,
          })
        })
      setActiveJobs(jobs)
    }
  }, [jobsData])

  // Handle WebSocket updates
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== 'job_update') return

    const jobData = lastMessage.data
    if (!jobData?.job_id) return

    setActiveJobs((prev) => {
      const updated = new Map(prev)

      // Remove completed or failed jobs after a delay
      if (['completed', 'failed'].includes(jobData.status)) {
        setTimeout(() => {
          setActiveJobs((current) => {
            const next = new Map(current)
            next.delete(jobData.job_id)
            return next
          })
        }, 5000) // Remove after 5 seconds
      }

      // Update or add job
      updated.set(jobData.job_id, {
        id: jobData.job_id,
        type: jobData.job_type || 'Unknown',
        status: jobData.status,
        progress: jobData.progress || 0,
        current_step: jobData.current_step,
        total_steps: jobData.total_steps,
        completed_steps: jobData.completed_steps,
        started_at: jobData.started_at || new Date().toISOString(),
        error: jobData.error,
      })

      return updated
    })
  }, [lastMessage])

  const handleJobClick = (jobId: string) => {
    router.push(`/jobs/${jobId}`)
  }

  const activeJobsArray = Array.from(activeJobs.values())

  if (activeJobsArray.length === 0) {
    return null // Don't show if no active jobs
  }

  return (
    <Card
      elevation={2}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 400,
        maxHeight: 600,
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: expanded ? 2 : 0 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" fontWeight={600}>
              Active Jobs
            </Typography>
            <Badge badgeContent={activeJobsArray.length} color="primary" max={99}>
              <Box />
            </Badge>
            {!isConnected && (
              <Chip
                label="Disconnected"
                size="small"
                color="error"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Stack>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>

        <Collapse in={expanded}>
          <Stack spacing={2} sx={{ maxHeight: 500, overflow: 'auto' }}>
            {activeJobsArray.map((job) => (
              <Card
                key={job.id}
                elevation={0}
                sx={{
                  cursor: 'pointer',
                  border: 1,
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 1,
                  },
                }}
                onClick={() => handleJobClick(job.id)}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  {/* Job Header */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ color: getStatusColor(job.status) }}>
                        {getStatusIcon(job.status)}
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {job.type.replace(/_/g, ' ')}
                      </Typography>
                    </Stack>
                    <Chip
                      label={job.status.replace(/_/g, ' ')}
                      size="small"
                      color={getStatusChipColor(job.status)}
                      sx={{ height: 20, fontSize: '0.7rem', textTransform: 'capitalize' }}
                    />
                  </Stack>

                  {/* Job ID */}
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    ID: {job.id.substring(0, 8)}...
                  </Typography>

                  {/* Current Step */}
                  {job.current_step && (
                    <Typography variant="caption" color="text.primary" sx={{ display: 'block', mb: 1 }}>
                      <strong>Step:</strong> {job.current_step}
                      {job.total_steps && job.completed_steps && (
                        <span> ({job.completed_steps}/{job.total_steps})</span>
                      )}
                    </Typography>
                  )}

                  {/* Progress Bar */}
                  {job.status === 'processing' && job.progress > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={job.progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'action.hover',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {job.progress}% complete
                      </Typography>
                    </Box>
                  )}

                  {/* Error Message */}
                  {job.error && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{
                        display: 'block',
                        p: 1,
                        bgcolor: 'error.50',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      {job.error}
                    </Typography>
                  )}

                  {/* Timestamp */}
                  <Typography variant="caption" color="text.disabled">
                    Started {formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  )
}

// Helper functions
function getStatusIcon(status: string) {
  switch (status) {
    case 'processing':
      return <PlayArrowIcon fontSize="small" />
    case 'completed':
      return <CheckIcon fontSize="small" />
    case 'failed':
      return <ErrorIcon fontSize="small" />
    case 'waiting_approval':
      return <PauseIcon fontSize="small" />
    default:
      return <PlayArrowIcon fontSize="small" />
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'processing':
      return 'info.main'
    case 'completed':
      return 'success.main'
    case 'failed':
      return 'error.main'
    case 'waiting_approval':
      return 'warning.main'
    default:
      return 'text.secondary'
  }
}

function getStatusChipColor(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  switch (status) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'error'
    case 'processing':
      return 'info'
    case 'waiting_approval':
      return 'warning'
    default:
      return 'default'
  }
}
