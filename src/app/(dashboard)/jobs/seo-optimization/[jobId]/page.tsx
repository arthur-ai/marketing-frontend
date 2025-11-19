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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material'
import {
  ArrowBack,
  ExpandMore,
  Edit,
} from '@mui/icons-material'
import { useState, useMemo } from 'react'
import { useJob, useStepResult, useJobApprovals } from '@/hooks/useApi'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json'
import { vs2015 } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import { MarkdownSection } from '@/components/approvals/sections/shared/MarkdownSection'
import { formatApprovalOutput } from '@/lib/approval-formatter'
import { getApprovalRoute } from '@/lib/approval-routing'

SyntaxHighlighter.registerLanguage('json', json)

export default function SEOOptimizationJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  
  const { data: jobData, isLoading: jobLoading, error: jobError } = useJob(jobId)
  const { data: stepResultData, isLoading: stepLoading, error: stepError } = useStepResult(jobId, 'seo_optimization')
  const { data: approvalsData } = useJobApprovals(jobId)
  
  const [expandedOutput, setExpandedOutput] = useState(true)
  const [expandedInput, setExpandedInput] = useState(false)
  const [expandedRawJson, setExpandedRawJson] = useState(false)

  const job = jobData?.data
  const stepResult = stepResultData?.data
  const approvals = approvalsData?.data?.approvals || []

  // Find approval for seo_optimization step
  const optimizationApproval = useMemo(() => {
    return approvals.find((a: any) => a.agent_name === 'seo_optimization' || a.pipeline_step === 'seo_optimization')
  }, [approvals])

  // Determine which content to show: approved content if available, otherwise step result
  const displayData = useMemo(() => {
    if (optimizationApproval?.modified_output && typeof optimizationApproval.modified_output === 'object') {
      return optimizationApproval.modified_output
    }
    if (optimizationApproval?.output_data) {
      return optimizationApproval.output_data
    }
    return stepResult
  }, [optimizationApproval, stepResult])

  const isLoading = jobLoading || stepLoading
  const error = jobError || stepError

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading SEO Optimization content...</Typography>
      </Container>
    )
  }

  if (error || !job) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error ? `Failed to load job: ${error.message}` : 'Job not found'}
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

  if (!displayData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          No SEO Optimization content found for this job.
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              SEO Optimization
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Chip
                label="SEO OPTIMIZATION"
                color="warning"
                sx={{ textTransform: 'uppercase' }}
              />
              <Chip
                label={job.status}
                color={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'warning'}
              />
              {optimizationApproval && (
                <Chip
                  label={`Approval: ${optimizationApproval.status}`}
                  color={optimizationApproval.status === 'approved' ? 'success' : optimizationApproval.status === 'pending' ? 'warning' : 'error'}
                />
              )}
            </Box>
          </Box>
          {optimizationApproval && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => router.push(getApprovalRoute('seo_optimization', optimizationApproval.id))}
            >
              Manage Approval
            </Button>
          )}
        </Box>
      </Box>

      {/* Approval Status Alert */}
      {optimizationApproval && (
        <Alert 
          severity={optimizationApproval.status === 'approved' ? 'success' : optimizationApproval.status === 'pending' ? 'warning' : 'info'} 
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {optimizationApproval.status === 'approved' 
              ? 'This content has been approved.' 
              : optimizationApproval.status === 'pending'
              ? 'This content is pending approval.'
              : 'This content was rejected or modified.'}
          </Typography>
          {optimizationApproval.reviewed_at && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Reviewed: {new Date(optimizationApproval.reviewed_at).toLocaleString()}
            </Typography>
          )}
          {optimizationApproval.reviewed_by && (
            <Typography variant="body2">
              Reviewed by: {optimizationApproval.reviewed_by}
            </Typography>
          )}
          {optimizationApproval.user_comment && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Comment: {optimizationApproval.user_comment}
            </Typography>
          )}
        </Alert>
      )}

      {/* Content Source Info */}
      {optimizationApproval?.modified_output && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Showing approved/modified content. Original generated content is available in the JSON view below.
          </Typography>
        </Alert>
      )}

      {/* Content - SEO Optimization Display */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Accordion expanded={expandedOutput} onChange={(_, isExpanded) => setExpandedOutput(isExpanded)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Generated Output
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <MarkdownSection
                  content={formatApprovalOutput(displayData, 'seo_optimization')}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Input Data */}
          {stepResult && (
            <Accordion expanded={expandedInput} onChange={(_, isExpanded) => setExpandedInput(isExpanded)}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Input Data
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 0, 
                    bgcolor: 'grey.900', 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'auto',
                    maxHeight: '600px'
                  }}
                >
                  <SyntaxHighlighter 
                    language="json" 
                    style={vs2015}
                    customStyle={{ 
                      margin: 0, 
                      borderRadius: '0.5rem', 
                      fontSize: '0.875rem',
                      padding: '1.5rem',
                      background: 'transparent'
                    }}
                  >
                    {JSON.stringify(stepResult.input_data || stepResult.input || {}, null, 2)}
                  </SyntaxHighlighter>
                </Paper>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Raw JSON */}
          <Accordion expanded={expandedRawJson} onChange={(_, isExpanded) => setExpandedRawJson(isExpanded)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Raw JSON Output
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 0, 
                  bgcolor: 'grey.900', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'auto',
                  maxHeight: '600px'
                }}
              >
                <SyntaxHighlighter 
                  language="json" 
                  style={vs2015}
                  customStyle={{ 
                    margin: 0, 
                    borderRadius: '0.5rem', 
                    fontSize: '0.875rem',
                    padding: '1.5rem',
                    background: 'transparent'
                  }}
                >
                  {JSON.stringify(displayData, null, 2)}
                </SyntaxHighlighter>
              </Paper>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    </Container>
  )
}

