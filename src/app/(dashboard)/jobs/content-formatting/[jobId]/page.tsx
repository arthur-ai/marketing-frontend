'use client'

import { useParams, useRouter } from 'next/navigation'
import { Box, Container, Card, CardContent, Alert, Button } from '@mui/material'
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

export default function ContentFormattingJobPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const { data: jobData, isLoading: jobLoading, error: jobError } = useJob(jobId)
  const { data: stepResultData, isLoading: stepLoading, error: stepError } = useStepResult(jobId, 'content_formatting')
  const { data: approvalsData } = useJobApprovals(jobId)

  const [expandedOutput, setExpandedOutput] = useState(true)
  const [expandedInput, setExpandedInput] = useState(false)
  const [expandedRawJson, setExpandedRawJson] = useState(false)

  const job = jobData?.data
  const stepResult = stepResultData?.data
  const approvals = approvalsData?.data?.approvals || []

  const formattingApproval = useMemo(() => {
    return approvals.find((a: any) => a.agent_name === 'content_formatting' || a.pipeline_step === 'content_formatting')
  }, [approvals])

  const displayData = useMemo(() => {
    if (formattingApproval?.modified_output && typeof formattingApproval.modified_output === 'object') {
      return formattingApproval.modified_output
    }
    if (formattingApproval?.output_data) {
      return formattingApproval.output_data
    }
    return stepResult
  }, [formattingApproval, stepResult])

  const isLoading = jobLoading || stepLoading
  const error = jobError || stepError

  const chips = [
    { label: 'CONTENT FORMATTING', color: 'info' as const },
    {
      label: job?.status || 'unknown',
      color: (job?.status === 'completed' ? 'success' : job?.status === 'failed' ? 'error' : 'warning') as const,
    },
    ...(formattingApproval
      ? [
          {
            label: `Approval: ${formattingApproval.status}`,
            color: (formattingApproval.status === 'approved'
              ? 'success'
              : formattingApproval.status === 'pending'
              ? 'warning'
              : 'error') as const,
          },
        ]
      : []),
  ]

  const actions = formattingApproval ? (
    <Button
      variant="outlined"
      startIcon={<Edit />}
      onClick={() => router.push(getApprovalRoute('content_formatting', formattingApproval.id))}
    >
      Manage Approval
    </Button>
  ) : undefined

  return (
    <LoadingErrorState
      loading={isLoading}
      error={error || !job ? (error || new Error('Job not found')) : undefined}
      loadingText="Loading Content Formatting content..."
      errorText={error ? `Failed to load job: ${error instanceof Error ? error.message : String(error)}` : 'Job not found'}
      backPath="/results"
      backLabel="Back to Results"
    >
      {!displayData ? (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="warning">No Content Formatting content found for this job.</Alert>
          <Button onClick={() => router.push('/results')} sx={{ mt: 2 }}>
            Back to Results
          </Button>
        </Container>
      ) : (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <PageHeader
            title="Content Formatting"
            backPath="/results"
            backLabel="Back to Results"
            chips={chips}
            actions={actions}
          />

          {formattingApproval && <ApprovalStatusAlert approval={formattingApproval} showAlreadyDecided={false} />}

          {formattingApproval?.modified_output && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Showing approved/modified content. Original generated content is available in the JSON view below.
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
                  <MarkdownSection content={formatApprovalOutput(displayData, 'content_formatting')} />
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
