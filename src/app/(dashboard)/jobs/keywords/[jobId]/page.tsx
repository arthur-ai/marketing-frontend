'use client'

import { useParams, useRouter } from 'next/navigation'
import { Box, Container, Card, CardContent, Alert, Button, Typography, Chip } from '@mui/material'
import { Edit } from '@mui/icons-material'
import { useState, useMemo } from 'react'
import { useJob, useStepResult, useJobApprovals } from '@/hooks/useApi'
import { getApprovalRoute } from '@/lib/approval-routing'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingErrorState } from '@/components/shared/LoadingErrorState'
import { AccordionSection } from '@/components/shared/AccordionSection'
import { JsonDisplay } from '@/components/shared/JsonDisplay'
import { ApprovalStatusAlert } from '@/components/shared/ApprovalStatusAlert'
import { SEOAnalysisMetrics } from '@/components/approvals/sections/seo/SEOAnalysisMetrics'
import type { SelectedKeywords } from '@/components/approvals/seo/SEOKeywordsSelection'

export default function SEOKeywordsJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const { data: jobData, isLoading: jobLoading, error: jobError } = useJob(jobId)
  const { data: stepResultData, isLoading: stepLoading, error: stepError } = useStepResult(jobId, 'seo_keywords')
  const { data: approvalsData } = useJobApprovals(jobId)

  const [expandedOutput, setExpandedOutput] = useState(false)
  const [expandedInput, setExpandedInput] = useState(false)

  const job = jobData?.data
  const stepResult = stepResultData?.data
  const approvals = approvalsData?.data?.approvals || []

  const keywordApproval = useMemo(() => {
    return approvals.find((a: any) => a.agent_name === 'seo_keywords' || a.pipeline_step === 'seo_keywords')
  }, [approvals])

  const displayData = useMemo(() => {
    if (keywordApproval?.modified_output && typeof keywordApproval.modified_output === 'object') {
      return keywordApproval.modified_output
    }
    if (keywordApproval?.output_data) {
      return keywordApproval.output_data
    }
    return stepResult
  }, [keywordApproval, stepResult])

  const selectedKeywords: SelectedKeywords = useMemo(() => {
    if (!displayData) {
      return {
        main_keyword: '',
        primary: [],
        secondary: [],
        lsi: [],
        long_tail: [],
      }
    }

    if (keywordApproval?.modified_output && typeof keywordApproval.modified_output === 'object') {
      const modified = keywordApproval.modified_output as any
      return {
        main_keyword: modified.main_keyword || displayData.main_keyword || '',
        primary: modified.primary_keywords || displayData.primary_keywords || [],
        secondary: modified.secondary_keywords || displayData.secondary_keywords || [],
        lsi: modified.lsi_keywords || displayData.lsi_keywords || [],
        long_tail: modified.long_tail_keywords || displayData.long_tail_keywords || [],
      }
    }

    const primaryKeywords = displayData.primary_keywords || []
    const mainKeyword = displayData.main_keyword || (primaryKeywords.length > 0 ? primaryKeywords[0] : '')
    return {
      main_keyword: mainKeyword,
      primary: primaryKeywords,
      secondary: displayData.secondary_keywords || [],
      lsi: displayData.lsi_keywords || [],
      long_tail: displayData.long_tail_keywords || [],
    }
  }, [displayData, keywordApproval])

  const isLoading = jobLoading || stepLoading
  const error = jobError || stepError

  const chips = [
    { label: 'SEO KEYWORDS', color: 'success' as const },
    {
      label: job?.status || 'unknown',
      color: (job?.status === 'completed' ? 'success' : job?.status === 'failed' ? 'error' : 'warning') as const,
    },
    ...(keywordApproval
      ? [
          {
            label: `Approval: ${keywordApproval.status}`,
            color: (keywordApproval.status === 'approved'
              ? 'success'
              : keywordApproval.status === 'pending'
              ? 'warning'
              : 'error') as const,
          },
        ]
      : []),
  ]

  const actions = keywordApproval ? (
    <Button
      variant="outlined"
      startIcon={<Edit />}
      onClick={() => router.push(getApprovalRoute('seo_keywords', keywordApproval.id))}
    >
      Manage Approval
    </Button>
  ) : undefined

  return (
    <LoadingErrorState
      loading={isLoading}
      error={error || !job ? (error || new Error('Job not found')) : undefined}
      loadingText="Loading SEO Keywords content..."
      errorText={error ? `Failed to load job: ${error instanceof Error ? error.message : String(error)}` : 'Job not found'}
      backPath="/results"
      backLabel="Back to Results"
    >
      {!displayData ? (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="warning">No SEO Keywords content found for this job.</Alert>
          <Button onClick={() => router.push('/results')} sx={{ mt: 2 }}>
            Back to Results
          </Button>
        </Container>
      ) : (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <PageHeader
            title="SEO Keywords"
            backPath="/results"
            backLabel="Back to Results"
            chips={chips}
            actions={actions}
          />

          {keywordApproval && <ApprovalStatusAlert approval={keywordApproval} showAlreadyDecided={false} />}

          {keywordApproval?.modified_output && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Showing approved/modified content. Original generated content is available in the JSON view below.
            </Alert>
          )}

          {displayData && <SEOAnalysisMetrics outputData={displayData} />}

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
                  <Chip label={selectedKeywords.main_keyword || 'Not selected'} color="primary" sx={{ mb: 2 }} />

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

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <AccordionSection
                title="Generated Output (JSON)"
                defaultExpanded={false}
                onChange={(expanded) => setExpandedOutput(expanded)}
              >
                <JsonDisplay data={displayData} />
              </AccordionSection>

              {stepResult && (
                <AccordionSection
                  title="Input Data"
                  defaultExpanded={false}
                  onChange={(expanded) => setExpandedInput(expanded)}
                >
                  <JsonDisplay data={stepResult.input_data || stepResult.input || {}} />
                </AccordionSection>
              )}
            </CardContent>
          </Card>
        </Container>
      )}
    </LoadingErrorState>
  )
}
