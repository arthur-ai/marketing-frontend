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
  Link,
} from '@mui/material'
import {
  ArrowBack,
  ExpandMore,
  Edit,
} from '@mui/icons-material'
import { useState, useEffect, useMemo } from 'react'
import { useJob, useStepResult, useJobApprovals } from '@/hooks/useApi'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json'
import { vs2015 } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import { SEOKeywordsSelection, SelectedKeywords } from '@/components/approvals/seo/SEOKeywordsSelection'
import { SEOAnalysisMetrics } from '@/components/approvals/sections/seo/SEOAnalysisMetrics'
import { getApprovalRoute } from '@/lib/approval-routing'

SyntaxHighlighter.registerLanguage('json', json)

export default function SEOKeywordsJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  
  const { data: jobData, isLoading: jobLoading, error: jobError } = useJob(jobId)
  const { data: stepResultData, isLoading: stepLoading, error: stepError } = useStepResult(jobId, 'seo_keywords')
  const { data: approvalsData } = useJobApprovals(jobId)
  
  const [expandedOutput, setExpandedOutput] = useState(false)
  const [expandedInput, setExpandedInput] = useState(false)
  const [expandedRawJson, setExpandedRawJson] = useState(false)

  const job = jobData?.data
  const stepResult = stepResultData?.data
  const approvals = approvalsData?.data?.approvals || []

  // Find approval for seo_keywords step
  const keywordApproval = useMemo(() => {
    return approvals.find((a: any) => a.agent_name === 'seo_keywords' || a.pipeline_step === 'seo_keywords')
  }, [approvals])

  // Determine which content to show: approved content if available, otherwise step result
  const displayData = useMemo(() => {
    if (keywordApproval?.modified_output && typeof keywordApproval.modified_output === 'object') {
      return keywordApproval.modified_output
    }
    if (keywordApproval?.output_data) {
      return keywordApproval.output_data
    }
    return stepResult
  }, [keywordApproval, stepResult])

  // Initialize keyword selection for display (read-only)
  const selectedKeywords: SelectedKeywords = useMemo(() => {
    if (!displayData) {
      return {
        main_keyword: '',
        primary: [],
        secondary: [],
        lsi: [],
        long_tail: []
      }
    }

    // If approval has selected keywords, use those
    if (keywordApproval?.modified_output && typeof keywordApproval.modified_output === 'object') {
      const modified = keywordApproval.modified_output as any
      return {
        main_keyword: modified.main_keyword || displayData.main_keyword || '',
        primary: modified.primary_keywords || displayData.primary_keywords || [],
        secondary: modified.secondary_keywords || displayData.secondary_keywords || [],
        lsi: modified.lsi_keywords || displayData.lsi_keywords || [],
        long_tail: modified.long_tail_keywords || displayData.long_tail_keywords || []
      }
    }

    // Otherwise use all from display data
    const primaryKeywords = displayData.primary_keywords || []
    const mainKeyword = displayData.main_keyword || (primaryKeywords.length > 0 ? primaryKeywords[0] : '')
    return {
      main_keyword: mainKeyword,
      primary: primaryKeywords,
      secondary: displayData.secondary_keywords || [],
      lsi: displayData.lsi_keywords || [],
      long_tail: displayData.long_tail_keywords || []
    }
  }, [displayData, keywordApproval])

  const isLoading = jobLoading || stepLoading
  const error = jobError || stepError

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading SEO Keywords content...</Typography>
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
          No SEO Keywords content found for this job.
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
              SEO Keywords
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Chip
                label="SEO KEYWORDS"
                color="success"
                sx={{ textTransform: 'uppercase' }}
              />
              <Chip
                label={job.status}
                color={job.status === 'completed' ? 'success' : job.status === 'failed' ? 'error' : 'warning'}
              />
              {keywordApproval && (
                <Chip
                  label={`Approval: ${keywordApproval.status}`}
                  color={keywordApproval.status === 'approved' ? 'success' : keywordApproval.status === 'pending' ? 'warning' : 'error'}
                />
              )}
            </Box>
          </Box>
          {keywordApproval && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => router.push(getApprovalRoute('seo_keywords', keywordApproval.id))}
            >
              Manage Approval
            </Button>
          )}
        </Box>
      </Box>

      {/* Approval Status Alert */}
      {keywordApproval && (
        <Alert 
          severity={keywordApproval.status === 'approved' ? 'success' : keywordApproval.status === 'pending' ? 'warning' : 'info'} 
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {keywordApproval.status === 'approved' 
              ? 'This content has been approved.' 
              : keywordApproval.status === 'pending'
              ? 'This content is pending approval.'
              : 'This content was rejected or modified.'}
          </Typography>
          {keywordApproval.reviewed_at && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Reviewed: {new Date(keywordApproval.reviewed_at).toLocaleString()}
            </Typography>
          )}
          {keywordApproval.reviewed_by && (
            <Typography variant="body2">
              Reviewed by: {keywordApproval.reviewed_by}
            </Typography>
          )}
          {keywordApproval.user_comment && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Comment: {keywordApproval.user_comment}
            </Typography>
          )}
        </Alert>
      )}

      {/* Content Source Info */}
      {keywordApproval?.modified_output && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Showing approved/modified content. Original generated content is available in the JSON view below.
          </Typography>
        </Alert>
      )}

      {/* SEO Analysis Metrics */}
      {displayData && (
        <SEOAnalysisMetrics outputData={displayData} />
      )}

      {/* Keyword Display (Read-only) */}
      {displayData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Selected Keywords
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Main Keyword
              </Typography>
              <Chip
                label={selectedKeywords.main_keyword || 'Not selected'}
                color="primary"
                sx={{ mb: 2 }}
              />
              
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                Primary Keywords ({selectedKeywords.primary.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedKeywords.primary.map((kw) => (
                  <Chip key={kw} label={kw} color="primary" variant="outlined" />
                ))}
              </Box>

              <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                Secondary Keywords ({selectedKeywords.secondary.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedKeywords.secondary.map((kw) => (
                  <Chip key={kw} label={kw} color="secondary" variant="outlined" />
                ))}
              </Box>

              <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                LSI Keywords ({selectedKeywords.lsi.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedKeywords.lsi.map((kw) => (
                  <Chip key={kw} label={kw} color="info" variant="outlined" />
                ))}
              </Box>

              <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
                Long-tail Keywords ({selectedKeywords.long_tail.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedKeywords.long_tail.map((kw) => (
                  <Chip key={kw} label={kw} color="success" variant="outlined" />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Additional Details - Collapsible Sections */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {/* Generated Output */}
          <Accordion expanded={expandedOutput} onChange={(_, isExpanded) => setExpandedOutput(isExpanded)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Generated Output (JSON)
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
        </CardContent>
      </Card>
    </Container>
  )
}

