'use client'

import { useParams, useRouter } from 'next/navigation'
import { Box, Container, Typography, Card, CardContent, Button, Chip, CircularProgress, Alert, Stack, TextField, Accordion, AccordionSummary, AccordionDetails, Paper } from '@mui/material'
import { ArrowBack, CheckCircle, Cancel, Edit, Save, ExpandMore } from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useApproval, useDecideApproval, useCancelJob } from '@/hooks/useApi'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import type { ApprovalDecisionRequest } from '@/types/api'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json'
import { vs2015 } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import { StepEditor } from '@/components/approvals/StepEditor'
import { MarkdownSection } from '@/components/approvals/sections/shared/MarkdownSection'
import { formatApprovalOutput } from '@/lib/approval-formatter'

SyntaxHighlighter.registerLanguage('json', json)

const STEP_NAME = 'content_formatting'
const STEP_DISPLAY = 'Content Formatting'
const STEP_COLOR = 'info' as const

export default function ContentFormattingApprovalPage() {
  const params = useParams()
  const router = useRouter()
  const approvalId = params.approvalId as string
  
  const { data, isLoading, error } = useApproval(approvalId)
  const decideApprovalMutation = useDecideApproval()
  const cancelJobMutation = useCancelJob()
  
  const [comment, setComment] = useState('')
  const [modifiedOutput, setModifiedOutput] = useState('')
  const [decision, setDecision] = useState<'approve' | 'reject' | 'modify' | null>(null)
  const [editedData, setEditedData] = useState<any>(null)
  const [hasEditorChanges, setHasEditorChanges] = useState(false)
  const [expandedOutput, setExpandedOutput] = useState(false)
  const [expandedInput, setExpandedInput] = useState(false)
  const [expandedRawJson, setExpandedRawJson] = useState(false)

  const approval = data?.data

  useEffect(() => {
    if (approval && approval.pipeline_step !== STEP_NAME) {
      router.push(`/approvals/${approvalId}`)
    }
  }, [approval, approvalId, router])

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading {STEP_DISPLAY} approval...</Typography>
      </Container>
    )
  }

  if (error || !approval) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error ? `Failed to load approval: ${error.message}` : 'Approval not found'}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/approvals')} sx={{ mt: 2 }}>
          Back to Approvals
        </Button>
      </Container>
    )
  }

  const isAlreadyDecided = approval.status !== 'pending'

  const handleDecision = async (selectedDecision: 'approve' | 'reject' | 'modify', editedDataOverride?: any) => {
    if (isAlreadyDecided) {
      showErrorToast('Already Decided', `This approval has already been ${approval.status}.`)
      return
    }

    try {
      let modifiedOutputData = undefined
      if (selectedDecision === 'modify') {
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

      const decisionRequest: ApprovalDecisionRequest = {
        decision: selectedDecision,
        comment: comment || undefined,
        modified_output: modifiedOutputData,
        reviewed_by: 'current_user',
      }

      await decideApprovalMutation.mutateAsync({
        approvalId: approval.id,
        decision: decisionRequest,
      })

      showSuccessToast(`Approval ${selectedDecision}d`, `${STEP_DISPLAY} has been ${selectedDecision}d`)
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/approvals')} sx={{ mb: 2 }}>
          Back to Approvals
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              {STEP_DISPLAY} Approval
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Chip label={STEP_DISPLAY.toUpperCase()} color={STEP_COLOR} sx={{ textTransform: 'uppercase' }} />
              <Chip label={approval.status} color={approval.status === 'pending' ? 'warning' : approval.status === 'approved' ? 'success' : 'error'} />
            </Box>
          </Box>
        </Box>
      </Box>

      {approval.confidence_score !== undefined && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="body2">
              <strong>Confidence Score:</strong> {(approval.confidence_score * 100).toFixed(0)}%
            </Typography>
            <Box sx={{ width: 200, height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ width: `${approval.confidence_score * 100}%`, height: '100%', bgcolor: 'primary.main' }} />
            </Box>
          </Box>
        </Alert>
      )}

      {isAlreadyDecided && (
        <Alert severity={approval.status === 'approved' ? 'success' : approval.status === 'rejected' ? 'error' : 'info'} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>This approval has already been {approval.status}.</Typography>
          {approval.reviewed_at && <Typography variant="body2" sx={{ mt: 1 }}>Reviewed: {new Date(approval.reviewed_at).toLocaleString()}</Typography>}
          {approval.reviewed_by && <Typography variant="body2">Reviewed by: {approval.reviewed_by}</Typography>}
          {approval.user_comment && <Typography variant="body2" sx={{ mt: 1 }}>Comment: {approval.user_comment}</Typography>}
        </Alert>
      )}

      {approval.suggestions && approval.suggestions.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Suggestions for Reviewer:</Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
            {approval.suggestions.map((suggestion, i) => (
              <li key={i}><Typography variant="body2">{suggestion}</Typography></li>
            ))}
          </Box>
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Accordion expanded={expandedOutput} onChange={(_, isExpanded) => setExpandedOutput(isExpanded)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Generated Output</Typography>
            </AccordionSummary>
            <AccordionDetails>
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
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expandedInput} onChange={(_, isExpanded) => setExpandedInput(isExpanded)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Input Data</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper elevation={0} sx={{ p: 0, bgcolor: 'grey.900', borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'auto', maxHeight: '600px' }}>
                <SyntaxHighlighter language="json" style={vs2015} customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '0.875rem', padding: '1.5rem', background: 'transparent' }}>
                  {JSON.stringify(approval.input_data, null, 2)}
                </SyntaxHighlighter>
              </Paper>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={expandedRawJson} onChange={(_, isExpanded) => setExpandedRawJson(isExpanded)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Raw JSON Output</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper elevation={0} sx={{ p: 0, bgcolor: 'grey.900', borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'auto', maxHeight: '600px' }}>
                <SyntaxHighlighter language="json" style={vs2015} customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '0.875rem', padding: '1.5rem', background: 'transparent' }}>
                  {JSON.stringify(approval.output_data, null, 2)}
                </SyntaxHighlighter>
              </Paper>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Comment (Optional)</Typography>
          <TextField fullWidth multiline rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add your feedback or reason for this decision..." sx={{ mt: 2 }} />
        </CardContent>
      </Card>

      {decision === 'modify' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Modified Output (JSON)</Typography>
            <TextField fullWidth multiline rows={10} value={modifiedOutput} onChange={(e) => setModifiedOutput(e.target.value)} placeholder={JSON.stringify(approval.output_data, null, 2)} sx={{ mt: 2 }} inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.875rem' } }} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={() => router.push('/approvals')} disabled={decideApprovalMutation.isPending}>Cancel</Button>
            <Button variant="outlined" color="error" startIcon={<Cancel />} onClick={handleCancelJob} disabled={cancelJobMutation.isPending || isAlreadyDecided}>Cancel Job</Button>
            <Button variant="outlined" startIcon={<Edit />} onClick={() => { if (decision === 'modify') { setDecision(null); setModifiedOutput(''); setEditedData(null); setHasEditorChanges(false) } else { setDecision('modify'); if (editedData && hasEditorChanges) setModifiedOutput(JSON.stringify(editedData, null, 2)) } }} disabled={decideApprovalMutation.isPending || isAlreadyDecided || (!hasEditorChanges && !comment.trim() && decision !== 'modify')} color={hasEditorChanges ? 'primary' : comment.trim() ? 'primary' : 'inherit'}>
              {decision === 'modify' ? 'Cancel Modify' : hasEditorChanges ? 'Modify (Changes Made)' : comment.trim() ? 'Modify (With Comments)' : 'Modify'}
            </Button>
            <Button variant="contained" color="error" startIcon={<Cancel />} onClick={() => handleDecision('reject')} disabled={decideApprovalMutation.isPending || decision !== null || isAlreadyDecided}>Reject</Button>
            <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleDecision('approve')} disabled={decideApprovalMutation.isPending || (decision === 'modify' && !hasEditorChanges) || isAlreadyDecided}>Approve</Button>
            {decision === 'modify' && (
              <Button variant="contained" color="primary" startIcon={<Save />} onClick={() => { if (editedData && hasEditorChanges) handleDecision('modify', editedData); else handleDecision('modify') }} disabled={decideApprovalMutation.isPending || (!hasEditorChanges && !modifiedOutput && !comment.trim()) || isAlreadyDecided}>
                Submit Modified
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}

