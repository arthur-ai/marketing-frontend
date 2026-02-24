'use client'

import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Stack,
  TextField,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Divider,
} from '@mui/material'
import { CheckCircle, Cancel, Edit, Save } from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useDecideApproval, useCancelJob } from '@/hooks/useApi'
import type { PendingApprovalSummary } from '@/types/api'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import { formatApprovalOutput } from '@/lib/approval-formatter'
import type { ApprovalDecisionRequest } from '@/types/api'
import { StepEditor } from '@/components/approvals/StepEditor'
import { MarkdownSection } from '@/components/approvals/sections/shared/MarkdownSection'
import { SEOAnalysisMetrics } from '@/components/approvals/sections/seo/SEOAnalysisMetrics'
import { AccordionSection } from '@/components/shared/AccordionSection'
import { ConfidenceScore } from '@/components/shared/ConfidenceScore'

interface SelectedKeywords {
  main_keyword: string
  primary: string[]
  secondary: string[]
  lsi: string[]
  long_tail: string[]
}

interface InlineApprovalPanelProps {
  approval: PendingApprovalSummary
  onDecisionMade: (decision: string) => void
}

export function InlineApprovalPanel({ approval, onDecisionMade }: InlineApprovalPanelProps) {
  const decideApprovalMutation = useDecideApproval()
  const cancelJobMutation = useCancelJob()

  const [comment, setComment] = useState('')
  const [modifiedOutput, setModifiedOutput] = useState('')
  const [decision, setDecision] = useState<'approve' | 'reject' | 'modify' | 'rerun' | null>(null)
  const [selectedKeywords, setSelectedKeywords] = useState<SelectedKeywords>({
    main_keyword: '',
    primary: [],
    secondary: [],
    lsi: [],
    long_tail: [],
  })
  const [editedData, setEditedData] = useState<any>(null)
  const [hasEditorChanges, setHasEditorChanges] = useState(false)

  const isKeywordSelectionStep = approval.pipeline_step === 'seo_keywords'
  const isAlreadyDecided = approval.status !== 'pending'

  useEffect(() => {
    if (approval.pipeline_step === 'seo_keywords' && approval.output_data) {
      const output = approval.output_data as any
      const primaryKeywords = output.primary_keywords || []
      const mainKeyword = output.main_keyword || (primaryKeywords.length > 0 ? primaryKeywords[0] : '')
      setSelectedKeywords({
        main_keyword: mainKeyword,
        primary: primaryKeywords,
        secondary: output.secondary_keywords || [],
        lsi: output.lsi_keywords || [],
        long_tail: output.long_tail_keywords || [],
      })
    }
  }, [approval])

  const handleMainKeywordChange = (keyword: string) => {
    setSelectedKeywords((prev) => ({
      ...prev,
      main_keyword: keyword,
      primary: prev.primary.includes(keyword)
        ? prev.primary
        : [keyword, ...prev.primary.filter((k) => k !== keyword)],
    }))
  }

  const handlePromoteToMain = (keyword: string, fromCategory: 'primary' | 'secondary' | 'lsi' | 'long_tail') => {
    setSelectedKeywords((prev) => {
      const updated = { ...prev }
      if (fromCategory === 'primary') updated.primary = prev.primary.filter((k) => k !== keyword)
      else if (fromCategory === 'secondary') updated.secondary = prev.secondary.filter((k) => k !== keyword)
      else if (fromCategory === 'lsi') updated.lsi = prev.lsi.filter((k) => k !== keyword)
      else if (fromCategory === 'long_tail') updated.long_tail = prev.long_tail.filter((k) => k !== keyword)
      if (prev.main_keyword && prev.main_keyword !== keyword) {
        if (!updated.primary.includes(prev.main_keyword)) {
          updated.primary = [prev.main_keyword, ...updated.primary]
        }
      }
      updated.main_keyword = keyword
      if (!updated.primary.includes(keyword)) {
        updated.primary = [keyword, ...updated.primary]
      }
      return updated
    })
  }

  const handleKeywordToggle = (type: 'primary' | 'secondary' | 'lsi' | 'long_tail', keyword: string) => {
    setSelectedKeywords((prev) => {
      const current = prev[type]
      const isSelected = current.includes(keyword)
      return { ...prev, [type]: isSelected ? current.filter((k) => k !== keyword) : [...current, keyword] }
    })
  }

  const handleSelectAll = (type: 'primary' | 'secondary' | 'lsi' | 'long_tail') => {
    if (!approval?.output_data) return
    const output = approval.output_data as any
    const allKeywords = output[`${type}_keywords`] || []
    setSelectedKeywords((prev) => {
      if (type === 'primary') {
        return {
          ...prev,
          primary: prev.main_keyword
            ? [prev.main_keyword, ...allKeywords.filter((k: string) => k !== prev.main_keyword)]
            : allKeywords,
        }
      }
      return { ...prev, [type]: allKeywords }
    })
  }

  const handleDeselectAll = (type: 'primary' | 'secondary' | 'lsi' | 'long_tail') => {
    setSelectedKeywords((prev) => {
      if (type === 'primary') {
        return { ...prev, primary: prev.main_keyword ? [prev.main_keyword] : [] }
      }
      return { ...prev, [type]: [] }
    })
  }

  const handleKeywordSelection = async () => {
    if (!approval) return
    if (isAlreadyDecided) {
      showErrorToast('Already Decided', `This approval has already been ${approval.status}.`)
      return
    }
    if (!selectedKeywords.main_keyword) {
      showErrorToast('Main Keyword Required', 'Please select a main keyword to continue.')
      return
    }
    const totalSelected =
      selectedKeywords.primary.length +
      selectedKeywords.secondary.length +
      selectedKeywords.lsi.length +
      selectedKeywords.long_tail.length
    try {
      const decisionRequest: ApprovalDecisionRequest = {
        decision: 'modify',
        comment: comment || undefined,
        main_keyword: selectedKeywords.main_keyword,
        selected_keywords: {
          primary: selectedKeywords.primary,
          secondary: selectedKeywords.secondary,
          lsi: selectedKeywords.lsi,
          long_tail: selectedKeywords.long_tail,
        },
        reviewed_by: 'current_user',
      }
      await decideApprovalMutation.mutateAsync({ approvalId: approval.id, decision: decisionRequest })
      showSuccessToast('Keywords Selected', `Selected ${totalSelected} keyword(s) successfully`)
      onDecisionMade('modify')
    } catch (error) {
      showErrorToast('Selection failed', error instanceof Error ? error.message : 'Failed to submit keyword selection')
    }
  }

  const handleDecision = async (selectedDecision: 'approve' | 'reject' | 'modify' | 'rerun', editedDataOverride?: any) => {
    if (!approval) return
    if (isAlreadyDecided) {
      showErrorToast('Already Decided', `This approval has already been ${approval.status}.`)
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
      await decideApprovalMutation.mutateAsync({ approvalId: approval.id, decision: decisionRequest })
      const actionText = actualDecision === 'rerun' ? 'rerun' : `${actualDecision}d`
      showSuccessToast(`Approval ${actionText}`, `Content from ${approval.pipeline_step || 'step'} has been ${actionText}`)
      onDecisionMade(actualDecision)
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
      onDecisionMade('cancel')
    } catch (error) {
      showErrorToast('Cancel Failed', error instanceof Error ? error.message : 'Failed to cancel job')
    }
  }

  const getStepBadgeColor = (stepName: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    const colors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      seo_keywords: 'success',
      marketing_brief: 'error',
      article_generation: 'warning',
      seo_optimization: 'warning',
      suggested_links: 'info',
      content_formatting: 'info',
      design_kit: 'info',
    }
    return colors[stepName] || 'default'
  }

  return (
    <Box>
      <Divider sx={{ my: 3 }} />

      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6">Review Approval</Typography>
        <Chip
          label={(approval.pipeline_step || 'Unknown Step').replace(/_/g, ' ').toUpperCase()}
          size="small"
          color={getStepBadgeColor(approval.pipeline_step || '')}
        />
        <Chip
          label={approval.status}
          size="small"
          color={approval.status === 'pending' ? 'warning' : approval.status === 'approved' ? 'success' : 'error'}
        />
      </Box>

      {approval.confidence_score !== undefined && <ConfidenceScore score={approval.confidence_score} />}

      {approval.suggestions && approval.suggestions.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Suggestions for Reviewer:</Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
            {approval.suggestions.map((suggestion, i) => (
              <li key={i}><Typography variant="body2">{suggestion}</Typography></li>
            ))}
          </Box>
        </Alert>
      )}

      {/* Generated Output */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <AccordionSection title="Generated Output" defaultExpanded={true}>
            {approval.pipeline_step && approval.pipeline_step !== 'seo_keywords' ? (
              <Box>
                <StepEditor
                  stepName={approval.pipeline_step}
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
                      content={formatApprovalOutput(approval.output_data, approval.pipeline_step || 'unknown')}
                    />
                  </Box>
                )}
              </Box>
            ) : (
              <MarkdownSection
                content={formatApprovalOutput(approval.output_data, approval.pipeline_step || 'unknown')}
              />
            )}
          </AccordionSection>
        </CardContent>
      </Card>

      {/* SEO Analysis Metrics */}
      {isKeywordSelectionStep && approval.output_data && (
        <SEOAnalysisMetrics outputData={approval.output_data} />
      )}

      {/* SEO Keyword Selection */}
      {isKeywordSelectionStep && approval.output_data && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Select Keywords to Keep</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Required:</strong> Select ONE main keyword that will be the primary focus. Then select any additional supporting keywords.
            </Typography>

            {(() => {
              const output = approval.output_data as any
              const primaryKeywords = output.primary_keywords || []
              const secondaryKeywords = output.secondary_keywords || []
              const lsiKeywords = output.lsi_keywords || []
              const longTailKeywords = output.long_tail_keywords || []

              return (
                <Stack spacing={3}>
                  {primaryKeywords.length > 0 && (
                    <Box>
                      <FormControl component="fieldset" required fullWidth>
                        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>Main Keyword (Required)</FormLabel>
                        <RadioGroup
                          value={selectedKeywords.main_keyword}
                          onChange={(e) => handleMainKeywordChange(e.target.value)}
                        >
                          {primaryKeywords.map((keyword: string) => {
                            const keywordDensity = output.keyword_density?.[keyword]
                            const isAISuggested = output.main_keyword === keyword
                            return (
                              <FormControlLabel
                                key={keyword}
                                value={keyword}
                                control={<Radio />}
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2">{keyword}</Typography>
                                    {isAISuggested && <Chip label="AI Suggested" size="small" color="primary" sx={{ height: 20 }} />}
                                    {keywordDensity != null && (
                                      <Chip label={`${keywordDensity.toFixed(1)}% density`} size="small" variant="outlined" sx={{ height: 20 }} />
                                    )}
                                  </Box>
                                }
                              />
                            )
                          })}
                        </RadioGroup>
                      </FormControl>
                      {!selectedKeywords.main_keyword && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                          Please select a main keyword to continue.
                        </Typography>
                      )}
                    </Box>
                  )}

                  {[
                    { type: 'primary' as const, keywords: primaryKeywords, label: 'Additional Primary Keywords' },
                    { type: 'secondary' as const, keywords: secondaryKeywords, label: 'Secondary Keywords' },
                    { type: 'lsi' as const, keywords: lsiKeywords, label: 'LSI Keywords' },
                    { type: 'long_tail' as const, keywords: longTailKeywords, label: 'Long-tail Keywords' },
                  ].map(({ type, keywords, label }) =>
                    keywords.length > 0 ? (
                      <Box key={type}>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">{label}</Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip label={`${selectedKeywords[type].length}/${keywords.length}`} size="small" />
                            <Button size="small" onClick={() => handleSelectAll(type)}>All</Button>
                            <Button size="small" onClick={() => handleDeselectAll(type)}>None</Button>
                          </Box>
                        </Box>
                        <FormGroup>
                          {keywords.map((keyword: string) => (
                            <FormControlLabel
                              key={keyword}
                              control={
                                <Checkbox
                                  checked={selectedKeywords[type].includes(keyword)}
                                  onChange={() => handleKeywordToggle(type, keyword)}
                                  disabled={keyword === selectedKeywords.main_keyword}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2">{keyword}</Typography>
                                  {keyword === selectedKeywords.main_keyword && (
                                    <Chip label="Main" size="small" color="primary" sx={{ height: 20 }} />
                                  )}
                                  {keyword !== selectedKeywords.main_keyword && type !== 'primary' && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={(e) => { e.stopPropagation(); handlePromoteToMain(keyword, type) }}
                                      sx={{ height: 22, fontSize: '0.65rem' }}
                                    >
                                      Promote to Main
                                    </Button>
                                  )}
                                </Box>
                              }
                            />
                          ))}
                        </FormGroup>
                      </Box>
                    ) : null
                  )}

                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>Main Keyword:</strong> {selectedKeywords.main_keyword || 'Not selected'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Supporting Keywords:</strong>{' '}
                      {selectedKeywords.primary.length + selectedKeywords.secondary.length + selectedKeywords.lsi.length + selectedKeywords.long_tail.length}
                    </Typography>
                  </Box>
                </Stack>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Comment */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Comment (Optional)</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your feedback or reason for this decision..."
            size="small"
          />
        </CardContent>
      </Card>

      {/* Raw JSON modify input */}
      {!isKeywordSelectionStep && decision === 'modify' && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Modified Output (JSON)</Typography>
            <TextField
              fullWidth
              multiline
              rows={8}
              value={modifiedOutput}
              onChange={(e) => setModifiedOutput(e.target.value)}
              placeholder={JSON.stringify(approval.output_data, null, 2)}
              size="small"
              inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
            />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
        {isKeywordSelectionStep ? (
          <>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={handleCancelJob}
              disabled={cancelJobMutation.isPending || isAlreadyDecided}
              size="small"
            >
              Cancel Job
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={handleKeywordSelection}
              disabled={decideApprovalMutation.isPending || isAlreadyDecided}
              size="small"
            >
              Submit Selection
            </Button>
          </>
        ) : (
          <>
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
              disabled={decideApprovalMutation.isPending || isAlreadyDecided || (!comment.trim() && decision !== 'modify')}
              size="small"
            >
              {decision === 'modify' ? 'Cancel Modify' : hasEditorChanges ? 'Modify (Changes Made)' : comment.trim() ? 'Rerun with Comments' : 'Modify'}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Cancel />}
              onClick={() => handleDecision('reject')}
              disabled={decideApprovalMutation.isPending || decision !== null || isAlreadyDecided}
              size="small"
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => handleDecision(hasEditorChanges ? 'modify' : 'approve', hasEditorChanges ? editedData : undefined)}
              disabled={decideApprovalMutation.isPending || (decision === 'modify' && !hasEditorChanges) || isAlreadyDecided}
              size="small"
            >
              {hasEditorChanges ? 'Submit Modified' : 'Approve'}
            </Button>
            {decision === 'modify' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={() => {
                  if (hasEditorChanges && editedData) handleDecision('modify', editedData)
                  else if (comment.trim()) handleDecision('modify')
                }}
                disabled={decideApprovalMutation.isPending || (!hasEditorChanges && !comment.trim()) || isAlreadyDecided}
                size="small"
              >
                {hasEditorChanges ? 'Submit Modified' : 'Rerun with Comments'}
              </Button>
            )}
          </>
        )}
      </Stack>
    </Box>
  )
}
