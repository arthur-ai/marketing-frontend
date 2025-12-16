'use client'

import { useParams, useRouter } from 'next/navigation'
import { Box, Container, Card, CardContent, Button, Stack, TextField, Typography, Alert } from '@mui/material'
import { CheckCircle, Cancel, Edit, Save } from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useApproval, useDecideApproval, useCancelJob } from '@/hooks/useApi'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import type { ApprovalDecisionRequest } from '@/types/api'
import { StepEditor } from '@/components/approvals/StepEditor'
import { MarkdownSection } from '@/components/approvals/sections/shared/MarkdownSection'
import { formatApprovalOutput } from '@/lib/approval-formatter'
import { getJobRoute } from '@/lib/job-routing'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingErrorState } from '@/components/shared/LoadingErrorState'
import { AccordionSection } from '@/components/shared/AccordionSection'
import { JsonDisplay } from '@/components/shared/JsonDisplay'
import { ConfidenceScore } from '@/components/shared/ConfidenceScore'
import { ApprovalStatusAlert } from '@/components/shared/ApprovalStatusAlert'

const STEP_NAME = 'blog_post_preprocessing_approval'
const STEP_DISPLAY = 'Blog Post Preprocessing'
const STEP_COLOR = 'info' as const

export default function BlogPostPreprocessingApprovalPage() {
  const params = useParams()
  const router = useRouter()
  const approvalId = params.approvalId as string

  const { data, isLoading, error } = useApproval(approvalId)
  const decideApprovalMutation = useDecideApproval()
  const cancelJobMutation = useCancelJob()

  const [comment, setComment] = useState('')
  const [modifiedOutput, setModifiedOutput] = useState('')
  const [decision, setDecision] = useState<'approve' | 'reject' | 'modify' | 'rerun' | null>(null)
  const [editedData, setEditedData] = useState<unknown>(null)
  const [hasEditorChanges, setHasEditorChanges] = useState(false)
  const [_expandedOutput, setExpandedOutput] = useState(false)
  const [_expandedInput, setExpandedInput] = useState(false)
  const [_expandedRawJson, setExpandedRawJson] = useState(false)

  const approval = data?.data

  useEffect(() => {
    if (approval && approval.pipeline_step !== STEP_NAME) {
      router.push(`/approvals/${approvalId}`)
    }
  }, [approval, approvalId, router])

  const isAlreadyDecided = approval?.status !== 'pending'

  const handleDecision = async (selectedDecision: 'approve' | 'reject' | 'modify' | 'rerun', editedDataOverride?: unknown) => {
    if (!approval || isAlreadyDecided) {
      showErrorToast('Already Decided', `This approval has already been ${approval?.status}.`)
      return
    }

    try {
      let modifiedOutputData = undefined
      let actualDecision = selectedDecision
      if (selectedDecision === 'modify') {
        if (!hasEditorChanges && !editedDataOverride && comment.trim()) {
          actualDecision = 'rerun'
        } else {
          if (editedDataOverride) {
            modifiedOutputData = editedDataOverride
          } else if (modifiedOutput) {
            try {
              modifiedOutputData = JSON.parse(modifiedOutput)
            } catch {
              showErrorToast('Invalid JSON', 'The modified output contains invalid JSON')
              return
            }
          }
        }
      }

      const decisionRequest: ApprovalDecisionRequest = {
        decision: actualDecision,
        comment: comment || undefined,
        modified_output: modifiedOutputData,
        reviewed_by: 'current_user',
      }

      await decideApprovalMutation.mutateAsync({
        approvalId: approval.id,
        decision: decisionRequest,
      })

      const actionText = actualDecision === 'rerun' ? 'rerun' : `${actualDecision}d`
      showSuccessToast(`Approval ${actionText}`, `${STEP_DISPLAY} has been ${actionText}`)
      router.push('/approvals')
    } catch (error) {
      showErrorToast('Decision failed', error instanceof Error ? error.message : 'Failed to submit decision')
    }
  }

  const handleCancelJob = async () => {
    if (!approval) return
    if (!confirm('Are you sure you want to cancel this job? This action cannot be undone.')) return

    try {
      await cancelJobMutation.mutateAsync(approval.job_id)
      showSuccessToast('Job Cancelled', 'The job has been cancelled successfully.')
      router.push('/approvals')
    } catch (error) {
      showErrorToast('Cancel Failed', error instanceof Error ? error.message : 'Failed to cancel job')
    }
  }

  const chips = approval
    ? [
        { label: STEP_DISPLAY.toUpperCase(), color: STEP_COLOR },
        {
          label: approval.status,
          color: (approval.status === 'pending' ? 'warning' : approval.status === 'approved' ? 'success' : 'error') as const,
        },
      ]
    : []

  const actions = approval ? (
    <Button variant="outlined" onClick={() => router.push(getJobRoute(STEP_NAME, approval.job_id))}>
      View in Job
    </Button>
  ) : undefined

  return (
    <LoadingErrorState
      loading={isLoading}
      error={error || !approval ? (error || new Error('Approval not found')) : undefined}
      loadingText={`Loading ${STEP_DISPLAY} approval...`}
      errorText={error ? `Failed to load approval: ${error instanceof Error ? error.message : String(error)}` : 'Approval not found'}
      backPath="/approvals"
      backLabel="Back to Approvals"
    >
      {approval && (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <PageHeader
            title={`${STEP_DISPLAY} Approval`}
            backPath="/approvals"
            backLabel="Back to Approvals"
            chips={chips}
            actions={actions}
          />

          {approval.confidence_score !== undefined && <ConfidenceScore score={approval.confidence_score} />}

          <ApprovalStatusAlert approval={approval} />

          {approval.suggestions && approval.suggestions.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Suggestions for Reviewer:
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
                {approval.suggestions.map((suggestion) => (
                  <li key={suggestion}>
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
                defaultExpanded={false}
                onChange={(expanded) => setExpandedOutput(expanded)}
              >
                <Box>
                  <StepEditor
                    stepName={approval.pipeline_step || STEP_NAME}
                    initialData={approval.output_data}
                    onDataChange={(data, hasChanges) => {
                      setEditedData(data)
                      setHasEditorChanges(hasChanges)
                      if (hasChanges) setModifiedOutput(JSON.stringify(data, null, 2))
                    }}
                  />
                  {!editedData && (
                    <Box sx={{ mt: 2 }}>
                      <MarkdownSection content={formatApprovalOutput(approval.output_data, approval.pipeline_step || STEP_NAME)} />
                    </Box>
                  )}
                </Box>
              </AccordionSection>

              <AccordionSection
                title="Input Data"
                defaultExpanded={false}
                onChange={(expanded) => setExpandedInput(expanded)}
              >
                <JsonDisplay data={approval.input_data} />
              </AccordionSection>

              <AccordionSection
                title="Raw JSON Output"
                defaultExpanded={false}
                onChange={(expanded) => setExpandedRawJson(expanded)}
              >
                <JsonDisplay data={approval.output_data} />
              </AccordionSection>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Comment (Optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your feedback or reason for this decision..."
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>

          {decision === 'modify' && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Modified Output (JSON)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  value={modifiedOutput}
                  onChange={(e) => setModifiedOutput(e.target.value)}
                  placeholder={JSON.stringify(approval.output_data, null, 2)}
                  sx={{ mt: 2 }}
                  inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.875rem' } }}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => router.push('/approvals')}
                  disabled={decideApprovalMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={handleCancelJob}
                  disabled={cancelJobMutation.isPending || isAlreadyDecided}
                >
                  Cancel Job
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => {
                    if (decision === 'modify') {
                      setDecision(null)
                      setModifiedOutput('')
                      setEditedData(null)
                      setHasEditorChanges(false)
                    } else {
                      setDecision('modify')
                      if (editedData && hasEditorChanges) setModifiedOutput(JSON.stringify(editedData, null, 2))
                    }
                  }}
                  disabled={decideApprovalMutation.isPending || isAlreadyDecided || !comment.trim() || decision === 'modify'}
                  color={hasEditorChanges ? 'primary' : comment.trim() ? 'primary' : 'inherit'}
                >
                  {decision === 'modify'
                    ? 'Cancel Modify'
                    : hasEditorChanges
                    ? 'Modify (Changes Made)'
                    : comment.trim()
                    ? 'Rerun with Comments'
                    : 'Modify'}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => handleDecision('reject')}
                  disabled={decideApprovalMutation.isPending || decision !== null || isAlreadyDecided}
                >
                  Reject
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => handleDecision('approve')}
                  disabled={decideApprovalMutation.isPending || (decision === 'modify' && !hasEditorChanges) || isAlreadyDecided}
                >
                  {hasEditorChanges ? 'Submit Modified' : 'Approve'}
                </Button>
                {decision === 'modify' && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Save />}
                    onClick={() => {
                      if (hasEditorChanges && editedData) {
                        handleDecision('modify', editedData)
                      } else if (comment.trim()) {
                        handleDecision('modify')
                      }
                    }}
                    disabled={decideApprovalMutation.isPending || (!hasEditorChanges && !comment.trim()) || isAlreadyDecided}
                  >
                    {hasEditorChanges ? 'Submit Modified' : 'Rerun with Comments'}
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Container>
      )}
    </LoadingErrorState>
  )
}
