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

  const linksApproval = useMemo(() => {
    return approvals.find((a: any) => a.agent_name === 'suggested_links' || a.pipeline_step === 'suggested_links')
  }, [approvals])

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

  const chips = [
    { label: 'SUGGESTED LINKS', color: 'info' as const },
    {
      label: job?.status || 'unknown',
      color: (job?.status === 'completed' ? 'success' : job?.status === 'failed' ? 'error' : 'warning') as const,
    },
    ...(linksApproval
      ? [
          {
            label: `Approval: ${linksApproval.status}`,
            color: (linksApproval.status === 'approved'
              ? 'success'
              : linksApproval.status === 'pending'
              ? 'warning'
              : 'error') as const,
          },
        ]
      : []),
  ]

  const actions = linksApproval ? (
    <Button
      variant="outlined"
      startIcon={<Edit />}
      onClick={() => router.push(getApprovalRoute('suggested_links', linksApproval.id))}
    >
      Manage Approval
    </Button>
  ) : undefined

  return (
    <LoadingErrorState
      loading={isLoading}
      error={error || !job ? (error || new Error('Job not found')) : undefined}
      loadingText="Loading Suggested Links content..."
      errorText={error ? `Failed to load job: ${error instanceof Error ? error.message : String(error)}` : 'Job not found'}
      backPath="/results"
      backLabel="Back to Results"
    >
      {!displayData ? (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="warning">No Suggested Links content found for this job.</Alert>
          <Button onClick={() => router.push('/results')} sx={{ mt: 2 }}>
            Back to Results
          </Button>
        </Container>
      ) : (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <PageHeader
            title="Suggested Links"
            backPath="/results"
            backLabel="Back to Results"
            chips={chips}
            actions={actions}
          />

          {linksApproval && <ApprovalStatusAlert approval={linksApproval} showAlreadyDecided={false} />}

          {linksApproval?.modified_output && (
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
                  <MarkdownSection content={formatApprovalOutput(displayData, 'suggested_links')} />
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
