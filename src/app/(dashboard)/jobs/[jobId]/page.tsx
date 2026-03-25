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
  LinearProgress,
} from '@mui/material'
import {
  ArrowBack,
  ChevronRight,
  CheckCircle,
  Warning,
} from '@mui/icons-material'
import { useMemo, useEffect, useRef, useState } from 'react'
import { useJob, useJobApprovals, useJobQuality } from '@/hooks/useApi'
import { getJobRoute } from '@/lib/job-routing'
import { InlineApprovalPanel } from '@/components/results/inline-approval-panel'

export default function GenericJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  // SSE state
  const [sseConnected, setSseConnected] = useState(false)
  const [sseStep, setSseStep] = useState<string | undefined>(undefined)
  const [ssePct, setSsePct] = useState<number | undefined>(undefined)
  const eventSourceRef = useRef<EventSource | null>(null)

  const { data: jobData, isLoading: jobLoading, error: jobError } = useJob(
    jobId,
    // Poll at 3s when SSE is not connected and job is still active
    sseConnected ? false : 3000
  )
  const { data: approvalsData, refetch: refetchApprovals } = useJobApprovals(jobId)

  const job = jobData?.data?.job
  const approvals = approvalsData?.data?.approvals || []

  const isTerminal = job?.status === 'completed' || job?.status === 'failed' || job?.status === 'cancelled'
  const isWaitingForApproval = job?.status === 'waiting_for_approval'
  const isCompleted = job?.status === 'completed'

  const pendingApproval = approvals.find((a: any) => a.status === 'pending') ?? (approvals.length > 0 ? approvals[0] : null)

  // Quality data — only fetch when job is completed
  const { data: qualityData } = useJobQuality(jobId, isCompleted)
  const quality = qualityData?.data

  // SSE connection: open when job is active, close when terminal
  useEffect(() => {
    if (!jobId) return
    if (isTerminal) {
      // Clean up on terminal state
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
        setSseConnected(false)
      }
      return
    }

    // Don't re-open if already connected
    if (eventSourceRef.current) return

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    const es = new EventSource(`${apiBase}/v1/jobs/${jobId}/progress`)
    eventSourceRef.current = es

    es.onopen = () => setSseConnected(true)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'progress') {
          if (data.step) setSseStep(data.step)
          if (data.pct !== undefined) setSsePct(data.pct)
        } else if (data.type === 'done') {
          setSsePct(100)
          es.close()
          eventSourceRef.current = null
          setSseConnected(false)
        } else if (data.type === 'error') {
          es.close()
          eventSourceRef.current = null
          setSseConnected(false)
        }
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      es.close()
      eventSourceRef.current = null
      setSseConnected(false)
    }

    return () => {
      es.close()
      eventSourceRef.current = null
      setSseConnected(false)
    }
  }, [jobId, isTerminal])

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

  const displayProgress = sseConnected && ssePct !== undefined ? ssePct : (job?.progress || 0)
  const displayStep = sseConnected && sseStep ? sseStep : job?.current_step

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
            {sseConnected && (
              <Chip label="Live" color="info" size="small" />
            )}
          </Box>
        </Box>
      </Box>

      {/* Live progress bar — shown while processing */}
      {!isTerminal && !isWaitingForApproval && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {displayStep
                  ? displayStep.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                  : 'Processing…'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {displayProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={displayProgress}
              aria-label={displayStep ? `${displayStep}: ${displayProgress}%` : `Progress: ${displayProgress}%`}
            />
          </CardContent>
        </Card>
      )}

      {/* Brand badge + quality checklist — shown after completion */}
      {isCompleted && (
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'success.light', bgcolor: 'success.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckCircle color="success" />
              <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                Content Generated
              </Typography>
            </Box>

            {quality ? (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Quality Metrics
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Word Count</Typography>
                    <Typography variant="body2" fontWeight={600}>{quality.word_count?.toLocaleString() ?? '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Reading Grade</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {quality.flesch_kincaid_grade != null ? `Grade ${quality.flesch_kincaid_grade.toFixed(1)}` : '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Keyword Match</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {quality.keyword_match_pct != null ? `${(quality.keyword_match_pct * 100).toFixed(1)}%` : '—'}
                    </Typography>
                  </Box>
                </Box>
                {quality.warnings && quality.warnings.length > 0 && (
                  <Box>
                    {quality.warnings.map((w: string, i: number) => (
                      <Alert key={i} severity="warning" icon={<Warning />} sx={{ mb: 0.5, py: 0.25 }}>
                        <Typography variant="caption">{w}</Typography>
                      </Alert>
                    ))}
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Quality metrics loading…
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

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
            {isTerminal && job.completed_at && (
              <Typography variant="body2" gutterBottom>
                <strong>Completed:</strong> {new Date(job.completed_at).toLocaleString()}
              </Typography>
            )}
            {!isWaitingForApproval && job.progress !== undefined && (
              <Typography variant="body2" gutterBottom>
                <strong>Progress:</strong> {job.progress}%
              </Typography>
            )}
            {!isWaitingForApproval && job.current_step && (
              <Typography variant="body2" gutterBottom>
                <strong>Current Step:</strong> {job.current_step}
              </Typography>
            )}
            {(job.metadata?.triggered_by_user_id || job.metadata?.triggered_by_username || job.metadata?.triggered_by_email) && (
              <Typography variant="body2" gutterBottom>
                <strong>Triggered By:</strong> {job.metadata.triggered_by_username || job.metadata.triggered_by_email || job.metadata.triggered_by_user_id}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Available Steps */}
      {availableSteps.length > 0 && (
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
      )}

      {/* Inline Approval Panel — show pending approval if available */}
      {pendingApproval && (
        <Box sx={{ mt: 3 }}>
          <InlineApprovalPanel
            approval={pendingApproval}
            onDecisionMade={() => refetchApprovals()}
          />
        </Box>
      )}
    </Container>
  )
}
