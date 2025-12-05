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
import { ListDisplay } from '@/components/approvals/sections/shared/ListDisplay'
import { getJobRoute } from '@/lib/job-routing'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingErrorState } from '@/components/shared/LoadingErrorState'
import { AccordionSection } from '@/components/shared/AccordionSection'
import { JsonDisplay } from '@/components/shared/JsonDisplay'
import { ConfidenceScore } from '@/components/shared/ConfidenceScore'
import { ApprovalStatusAlert } from '@/components/shared/ApprovalStatusAlert'

export default function ArticleGenerationApprovalPage() {
  const params = useParams()
  const router = useRouter()
  const approvalId = params.approvalId as string

  const { data, isLoading, error } = useApproval(approvalId)
  const decideApprovalMutation = useDecideApproval()
  const cancelJobMutation = useCancelJob()

  const [comment, setComment] = useState('')
  const [modifiedOutput, setModifiedOutput] = useState('')
  const [decision, setDecision] = useState<'approve' | 'reject' | 'modify' | 'rerun' | null>(null)
  const [editedData, setEditedData] = useState<any>(null)
  const [hasEditorChanges, setHasEditorChanges] = useState(false)
  const [expandedOutput, setExpandedOutput] = useState(false)
  const [expandedInput, setExpandedInput] = useState(false)
  const [expandedRawJson, setExpandedRawJson] = useState(false)

  const approval = data?.data

  useEffect(() => {
    if (approval && approval.pipeline_step !== 'article_generation') {
      router.push(`/approvals/${approvalId}`)
    }
  }, [approval, approvalId, router])

  const isAlreadyDecided = approval?.status !== 'pending'

  const handleDecision = async (selectedDecision: 'approve' | 'reject' | 'modify' | 'rerun', editedDataOverride?: any) => {
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
            } catch (e) {
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
      showSuccessToast(`Approval ${actionText}`, `Article Generation has been ${actionText}`)
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
        { label: 'ARTICLE GENERATION', color: 'warning' as const },
        {
          label: approval.status,
          color: (approval.status === 'pending' ? 'warning' : approval.status === 'approved' ? 'success' : 'error') as const,
        },
      ]
    : []

  const actions = approval ? (
    <Button variant="outlined" onClick={() => router.push(getJobRoute('article_generation', approval.job_id))}>
      View in Job
    </Button>
  ) : undefined

  return (
    <LoadingErrorState
      loading={isLoading}
      error={error || !approval ? (error || new Error('Approval not found')) : undefined}
      loadingText="Loading Article Generation approval..."
      errorText={error ? `Failed to load approval: ${error instanceof Error ? error.message : String(error)}` : 'Approval not found'}
      backPath="/approvals"
      backLabel="Back to Approvals"
    >
      {approval && (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <PageHeader
            title="Article Generation Approval"
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
                {approval.suggestions.map((suggestion, i) => (
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
                defaultExpanded={false}
                onChange={(expanded) => setExpandedOutput(expanded)}
              >
                <Box>
                  <StepEditor
                    stepName={approval.pipeline_step || 'article_generation'}
                    initialData={approval.output_data}
                    onDataChange={(data, hasChanges) => {
                      setEditedData(data)
                      setHasEditorChanges(hasChanges)
                      if (hasChanges) setModifiedOutput(JSON.stringify(data, null, 2))
                    }}
                  />
                  {!editedData && (
                    <Box sx={{ mt: 2 }}>
                      <MarkdownSection
                        content={formatApprovalOutput(approval.output_data, approval.pipeline_step || 'article_generation')}
                      />
                    </Box>
                  )}
                </Box>
              </AccordionSection>

              <AccordionSection
                title="Input Data (SEO Keywords + Marketing Brief)"
                defaultExpanded={false}
                onChange={(expanded) => setExpandedInput(expanded)}
              >
                <Stack spacing={2}>
                  {approval.input_data?.seo_keywords && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                        From Step 1: SEO Keywords
                      </Typography>
                      <Paper
                        elevation={0}
                        sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                      >
                        <Box>
                          <Typography variant="body2" component="div" sx={{ mb: 2 }}>
                            <strong>Main Keyword:</strong> {approval.input_data.seo_keywords.main_keyword || 'N/A'}
                          </Typography>
                          {Array.isArray(approval.input_data.seo_keywords.primary_keywords) &&
                            approval.input_data.seo_keywords.primary_keywords.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                  Primary Keywords:
                                </Typography>
                                <ListDisplay items={approval.input_data.seo_keywords.primary_keywords} />
                              </Box>
                            )}
                          {approval.input_data.seo_keywords.secondary_keywords &&
                            Array.isArray(approval.input_data.seo_keywords.secondary_keywords) &&
                            approval.input_data.seo_keywords.secondary_keywords.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                  Secondary Keywords:
                                </Typography>
                                <ListDisplay items={approval.input_data.seo_keywords.secondary_keywords} />
                              </Box>
                            )}
                          {approval.input_data.seo_keywords.search_intent && (
                            <Typography variant="body2" component="div">
                              <strong>Search Intent:</strong> {approval.input_data.seo_keywords.search_intent}
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    </Box>
                  )}
                  {approval.input_data?.marketing_brief && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                        From Step 2: Marketing Brief
                      </Typography>
                      <Paper
                        elevation={0}
                        sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                      >
                        <Box>
                          {approval.input_data.marketing_brief.target_audience && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                Target Audience:
                              </Typography>
                              {Array.isArray(approval.input_data.marketing_brief.target_audience) ? (
                                <ListDisplay items={approval.input_data.marketing_brief.target_audience} />
                              ) : (
                                <Typography variant="body2">{approval.input_data.marketing_brief.target_audience}</Typography>
                              )}
                            </Box>
                          )}
                          {approval.input_data.marketing_brief.key_messages && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                Key Messages:
                              </Typography>
                              {Array.isArray(approval.input_data.marketing_brief.key_messages) ? (
                                <ListDisplay items={approval.input_data.marketing_brief.key_messages} />
                              ) : (
                                <Typography variant="body2">{approval.input_data.marketing_brief.key_messages}</Typography>
                              )}
                            </Box>
                          )}
                          {approval.input_data.marketing_brief.content_strategy && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" component="div">
                                <strong>Content Strategy:</strong> {approval.input_data.marketing_brief.content_strategy}
                              </Typography>
                            </Box>
                          )}
                          {approval.input_data.marketing_brief.tone_and_voice && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" component="div">
                                <strong>Tone and Voice:</strong> {approval.input_data.marketing_brief.tone_and_voice}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Full Input Data (JSON)
                    </Typography>
                    <JsonDisplay data={approval.input_data} />
                  </Box>
                </Stack>
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
