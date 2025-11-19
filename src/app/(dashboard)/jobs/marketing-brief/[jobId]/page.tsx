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

export default function MarketingBriefJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  
  const { data: jobData, isLoading: jobLoading, error: jobError } = useJob(jobId)
  const { data: stepResultData, isLoading: stepLoading, error: stepError } = useStepResult(jobId, 'marketing_brief')
  const { data: approvalsData } = useJobApprovals(jobId)
  
  const [expandedOutput, setExpandedOutput] = useState(true)
  const [expandedInput, setExpandedInput] = useState(false)
  const [expandedRawJson, setExpandedRawJson] = useState(false)

  const job = jobData?.data
  const stepResult = stepResultData?.data
  const approvals = approvalsData?.data?.approvals || []

  // Find approval for marketing_brief step
  const briefApproval = useMemo(() => {
    return approvals.find((a: any) => a.agent_name === 'marketing_brief' || a.pipeline_step === 'marketing_brief')
  }, [approvals])

  // Determine which content to show: approved content if available, otherwise step result
  const displayData = useMemo(() => {
    if (briefApproval?.modified_output && typeof briefApproval.modified_output === 'object') {
      return briefApproval.modified_output
    }
    if (briefApproval?.output_data) {
      return briefApproval.output_data
    }
    return stepResult
  }, [briefApproval, stepResult])

  const isLoading = jobLoading || stepLoading
  const error = jobError || stepError

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading Marketing Brief content...</Typography>
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
          No Marketing Brief content found for this job.
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
              Marketing Brief
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Chip
                label="MARKETING BRIEF"
                color="error"
                sx={{ textTransform: 'uppercase' }}
              />
              <Chip
                label={job.status}
                color={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'warning'}
              />
              {briefApproval && (
                <Chip
                  label={`Approval: ${briefApproval.status}`}
                  color={briefApproval.status === 'approved' ? 'success' : briefApproval.status === 'pending' ? 'warning' : 'error'}
                />
              )}
            </Box>
          </Box>
          {briefApproval && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => router.push(getApprovalRoute('marketing_brief', briefApproval.id))}
            >
              Manage Approval
            </Button>
          )}
        </Box>
      </Box>

      {/* Approval Status Alert */}
      {briefApproval && (
        <Alert 
          severity={briefApproval.status === 'approved' ? 'success' : briefApproval.status === 'pending' ? 'warning' : 'info'} 
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {briefApproval.status === 'approved' 
              ? 'This content has been approved.' 
              : briefApproval.status === 'pending'
              ? 'This content is pending approval.'
              : 'This content was rejected or modified.'}
          </Typography>
          {briefApproval.reviewed_at && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Reviewed: {new Date(briefApproval.reviewed_at).toLocaleString()}
            </Typography>
          )}
          {briefApproval.reviewed_by && (
            <Typography variant="body2">
              Reviewed by: {briefApproval.reviewed_by}
            </Typography>
          )}
          {briefApproval.user_comment && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Comment: {briefApproval.user_comment}
            </Typography>
          )}
        </Alert>
      )}

      {/* Content Source Info */}
      {briefApproval?.modified_output && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Showing approved/modified content. Original generated content is available in the JSON view below.
          </Typography>
        </Alert>
      )}

      {/* Confidence Score */}
      {briefApproval?.confidence_score !== undefined && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="body2">
              <strong>Confidence Score:</strong> {(briefApproval.confidence_score * 100).toFixed(0)}%
            </Typography>
            <Box sx={{ width: 200, height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
              <Box
                sx={{
                  width: `${briefApproval.confidence_score * 100}%`,
                  height: '100%',
                  bgcolor: 'primary.main',
                }}
              />
            </Box>
          </Box>
        </Alert>
      )}

      {/* Suggestions */}
      {briefApproval?.suggestions && briefApproval.suggestions.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Suggestions for Reviewer:
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
            {briefApproval.suggestions.map((suggestion: string, i: number) => (
              <li key={i}>
                <Typography variant="body2">{suggestion}</Typography>
              </li>
            ))}
          </Box>
        </Alert>
      )}

      {/* Content - Marketing Brief Display */}
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
                  content={formatApprovalOutput(displayData, 'marketing_brief')}
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

