'use client'

import { useParams, useRouter } from 'next/navigation'
import { Box, Container, Card, CardContent, Alert, Button, Typography } from '@mui/material'
import { Edit } from '@mui/icons-material'
import { useState, useMemo } from 'react'
import { useJob, useStepResult, useJobApprovals } from '@/hooks/useApi'
import { MarkdownSection } from '@/components/approvals/sections/shared/MarkdownSection'
import { formatApprovalOutput } from '@/lib/approval-formatter'
import { getApprovalRoute } from '@/lib/approval-routing'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingErrorState } from '@/components/shared/LoadingErrorState'
import { AccordionSection } from '@/components/shared/AccordionSection'
import { JsonDisplay } from '@/components/shared/JsonDisplay'
import { ApprovalStatusAlert } from '@/components/shared/ApprovalStatusAlert'
import { ConfidenceScore } from '@/components/shared/ConfidenceScore'

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

  const briefApproval = useMemo(() => {
    return approvals.find((a: any) => a.agent_name === 'marketing_brief' || a.pipeline_step === 'marketing_brief')
  }, [approvals])

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

  const chips = [
    { label: 'MARKETING BRIEF', color: 'error' as const },
    {
      label: job?.status || 'unknown',
      color: (job?.status === 'completed' ? 'success' : job?.status === 'failed' ? 'error' : 'warning') as const,
    },
    ...(briefApproval
      ? [
          {
            label: `Approval: ${briefApproval.status}`,
            color: (briefApproval.status === 'approved'
              ? 'success'
              : briefApproval.status === 'pending'
              ? 'warning'
              : 'error') as const,
          },
        ]
      : []),
  ]

  const actions = briefApproval ? (
    <Button
      variant="outlined"
      startIcon={<Edit />}
      onClick={() => router.push(getApprovalRoute('marketing_brief', briefApproval.id))}
    >
      Manage Approval
    </Button>
  ) : undefined

  return (
    <LoadingErrorState
      loading={isLoading}
      error={error || !job ? (error || new Error('Job not found')) : undefined}
      loadingText="Loading Marketing Brief content..."
      errorText={error ? `Failed to load job: ${error instanceof Error ? error.message : String(error)}` : 'Job not found'}
      backPath="/results"
      backLabel="Back to Results"
    >
      {!displayData ? (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="warning">No Marketing Brief content found for this job.</Alert>
          <Button onClick={() => router.push('/results')} sx={{ mt: 2 }}>
            Back to Results
          </Button>
        </Container>
      ) : (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <PageHeader
            title="Marketing Brief"
            backPath="/results"
            backLabel="Back to Results"
            chips={chips}
            actions={actions}
          />

          {briefApproval && <ApprovalStatusAlert approval={briefApproval} showAlreadyDecided={false} />}

          {briefApproval?.modified_output && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Showing approved/modified content. Original generated content is available in the JSON view below.
            </Alert>
          )}

          {briefApproval?.confidence_score !== undefined && (
            <ConfidenceScore score={briefApproval.confidence_score} />
          )}

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

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <AccordionSection
                title="Generated Output"
                defaultExpanded={true}
                onChange={(expanded) => setExpandedOutput(expanded)}
              >
                <Box>
                  <MarkdownSection content={formatApprovalOutput(displayData, 'marketing_brief')} />
                </Box>
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

              <AccordionSection
                title="Raw JSON Output"
                defaultExpanded={false}
                onChange={(expanded) => setExpandedRawJson(expanded)}
              >
                <JsonDisplay data={displayData} />
              </AccordionSection>
            </CardContent>
          </Card>
        </Container>
      )}
    </LoadingErrorState>
  )
}
