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

export default function SuggestedLinksJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  
  const { data: jobData, isLoading: jobLoading, error: jobError } = useJob(jobId)
  const { data: stepResultData, isLoading: stepLoading, error: stepError } = useStepResult(jobId, 'suggested_links')
  const { data: approvalsData } = useJobApprovals(jobId)
  
  const [expandedOutput, setExpandedOutput] = useState(true)
  const [expandedInput, setExpandedInput] = useState(false)
  const [expandedRawJson, setExpandedRawJson] = useState(false)

  const job = jobData?.data
  const stepResult = stepResultData?.data
  const approvals = approvalsData?.data?.approvals || []

  // Find approval for suggested_links step
  const linksApproval = useMemo(() => {
    return approvals.find((a: any) => a.agent_name === 'suggested_links' || a.pipeline_step === 'suggested_links')
  }, [approvals])

  // Determine which content to show: approved content if available, otherwise step result
  const displayData = useMemo(() => {
    if (linksApproval?.modified_output && typeof linksApproval.modified_output === 'object') {
      return linksApproval.modified_output
    }
    if (linksApproval?.output_data) {
      return linksApproval.output_data
    }
    return stepResult
  }, [linksApproval, stepResult])

  const isLoading = jobLoading || stepLoading
  const error = jobError || stepError

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading Suggested Links content...</Typography>
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
          No Suggested Links content found for this job.
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
              Suggested Links
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Chip
                label="SUGGESTED LINKS"
                color="info"
                sx={{ textTransform: 'uppercase' }}
              />
              <Chip
                label={job.status}
                color={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'warning'}
              />
              {linksApproval && (
                <Chip
                  label={`Approval: ${linksApproval.status}`}
                  color={linksApproval.status === 'approved' ? 'success' : linksApproval.status === 'pending' ? 'warning' : 'error'}
                />
              )}
            </Box>
          </Box>
          {linksApproval && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => router.push(getApprovalRoute('suggested_links', linksApproval.id))}
            >
              Manage Approval
            </Button>
          )}
        </Box>
      </Box>

      {/* Approval Status Alert */}
      {linksApproval && (
        <Alert 
          severity={linksApproval.status === 'approved' ? 'success' : linksApproval.status === 'pending' ? 'warning' : 'info'} 
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {linksApproval.status === 'approved' 
              ? 'This content has been approved.' 
              : linksApproval.status === 'pending'
              ? 'This content is pending approval.'
              : 'This content was rejected or modified.'}
          </Typography>
          {linksApproval.reviewed_at && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Reviewed: {new Date(linksApproval.reviewed_at).toLocaleString()}
            </Typography>
          )}
          {linksApproval.reviewed_by && (
            <Typography variant="body2">
              Reviewed by: {linksApproval.reviewed_by}
            </Typography>
          )}
          {linksApproval.user_comment && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Comment: {linksApproval.user_comment}
            </Typography>
          )}
        </Alert>
      )}

      {/* Content Source Info */}
      {linksApproval?.modified_output && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Showing approved/modified content. Original generated content is available in the JSON view below.
          </Typography>
        </Alert>
      )}

      {/* Content - Suggested Links Display */}
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
                  content={formatApprovalOutput(displayData, 'suggested_links')}
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

