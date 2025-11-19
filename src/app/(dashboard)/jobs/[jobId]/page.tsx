'use client'

import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from '@mui/material'
import {
  ArrowBack,
  ChevronRight,
} from '@mui/icons-material'
import { useMemo } from 'react'
import { useJob, useJobApprovals } from '@/hooks/useApi'
import { getJobRoute } from '@/lib/job-routing'

export default function GenericJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  
  const { data: jobData, isLoading: jobLoading, error: jobError } = useJob(jobId)
  const { data: approvalsData } = useJobApprovals(jobId)

  const job = jobData?.data
  const approvals = approvalsData?.data?.approvals || []

  // Map of pipeline steps to their display names
  const stepDisplayMap: Record<string, string> = {
    seo_keywords: 'SEO Keywords',
    marketing_brief: 'Marketing Brief',
    article_generation: 'Article Generation',
    seo_optimization: 'SEO Optimization',
    suggested_links: 'Suggested Links',
    content_formatting: 'Content Formatting',
  }

  // Get unique pipeline steps from approvals
  const availableSteps = useMemo(() => {
    const steps = new Set<string>()
    approvals.forEach((approval: any) => {
      const step = approval.pipeline_step || approval.agent_name
      if (step && stepDisplayMap[step]) {
        steps.add(step)
      }
    })
    return Array.from(steps)
  }, [approvals])

  if (jobLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading job...</Typography>
      </Container>
    )
  }

  if (jobError || !job) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {jobError ? `Failed to load job: ${jobError.message}` : 'Job not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/results')}
          sx={{ mt: 2 }}
        >
          Back to Results
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/results')}
          sx={{ mb: 2 }}
        >
          Back to Results
        </Button>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Job Details
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
            <Chip
              label={job.status}
              color={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'warning'}
            />
            <Typography variant="body2" color="text.secondary">
              Job ID: {jobId}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Job Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Job Information
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Type:</strong> {job.type}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Status:</strong> {job.status}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Content ID:</strong> {job.content_id}
            </Typography>
            {job.created_at && (
              <Typography variant="body2" gutterBottom>
                <strong>Created:</strong> {new Date(job.created_at).toLocaleString()}
              </Typography>
            )}
            {job.completed_at && (
              <Typography variant="body2" gutterBottom>
                <strong>Completed:</strong> {new Date(job.completed_at).toLocaleString()}
              </Typography>
            )}
            {job.progress !== undefined && (
              <Typography variant="body2" gutterBottom>
                <strong>Progress:</strong> {job.progress}%
              </Typography>
            )}
            {job.current_step && (
              <Typography variant="body2" gutterBottom>
                <strong>Current Step:</strong> {job.current_step}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Available Steps */}
      {availableSteps.length > 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              View Content by Step
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click on a step to view its generated content:
            </Typography>
            <List>
              {availableSteps.map((step) => (
                <ListItem key={step} disablePadding>
                  <ListItemButton onClick={() => router.push(getJobRoute(step, jobId))}>
                    <ListItemText
                      primary={stepDisplayMap[step]}
                      secondary={`Pipeline step: ${step}`}
                    />
                    <ChevronRight />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">
          No step-specific content available for this job. The job may still be processing or no approvals have been created yet.
        </Alert>
      )}

      {/* Approvals Link */}
      {approvals.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Approvals
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This job has {approvals.length} approval(s). Visit the approvals page to manage them.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/approvals')}
            >
              View Approvals
            </Button>
          </CardContent>
        </Card>
      )}
    </Container>
  )
}

