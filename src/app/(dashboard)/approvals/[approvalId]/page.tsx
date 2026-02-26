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
  Alert,
  Stack,
  TextField,
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  Edit,
  Save,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useApproval, useDecideApproval, useCancelJob } from '@/hooks/useApi'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import { formatApprovalOutput } from '@/lib/approval-formatter'
import type { ApprovalRequest, ApprovalDecisionRequest } from '@/types/api'
import { StepEditor } from '@/components/approvals/StepEditor'
import { MarkdownSection } from '@/components/approvals/sections/shared/MarkdownSection'
import { SEOAnalysisMetrics } from '@/components/approvals/sections/seo/SEOAnalysisMetrics'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingErrorState } from '@/components/shared/LoadingErrorState'
import { AccordionSection } from '@/components/shared/AccordionSection'
import { ConfidenceScore } from '@/components/shared/ConfidenceScore'
import { ApprovalStatusAlert } from '@/components/shared/ApprovalStatusAlert'
import { useAuth } from '@/hooks/useAuth'
import { SEOKeywordsSelection, SelectedKeywords } from '@/components/approvals/seo/SEOKeywordsSelection'

export default function ApprovalDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const approvalId = params.approvalId as string
  
  const { data, isLoading, error } = useApproval(approvalId)
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
    long_tail: []
  })
  const [editedData, setEditedData] = useState<any>(null)
  const [hasEditorChanges, setHasEditorChanges] = useState(false)
  const [expandedOutput, setExpandedOutput] = useState(true)

  const approval = data?.data

  // Initialize keyword selection for seo_keywords step
  useEffect(() => {
    if (approval?.pipeline_step === 'seo_keywords' && approval.output_data) {
      const output = approval.output_data as any
      // Auto-select main_keyword if available (first primary keyword as default)
      const primaryKeywords = output.primary_keywords || []
      const mainKeyword = output.main_keyword || (primaryKeywords.length > 0 ? primaryKeywords[0] : '')
      setSelectedKeywords({
        main_keyword: mainKeyword,
        primary: primaryKeywords,
        secondary: output.secondary_keywords || [],
        lsi: output.lsi_keywords || [],
        long_tail: output.long_tail_keywords || []
      })
    }
  }, [approval])


  const isKeywordSelectionStep = approval?.pipeline_step === 'seo_keywords'
  const isAlreadyDecided = approval?.status !== 'pending'

  const handleMainKeywordChange = (keyword: string) => {
    setSelectedKeywords(prev => ({
      ...prev,
      main_keyword: keyword,
      // Ensure main keyword is in primary keywords list
      primary: prev.primary.includes(keyword) 
        ? prev.primary 
        : [keyword, ...prev.primary.filter(k => k !== keyword)]
    }))
  }

  const handlePromoteToMain = (keyword: string, fromCategory: 'primary' | 'secondary' | 'lsi' | 'long_tail') => {
    setSelectedKeywords(prev => {
      // Remove keyword from its original category
      const updated = { ...prev }
      if (fromCategory === 'primary') {
        updated.primary = prev.primary.filter(k => k !== keyword)
      } else if (fromCategory === 'secondary') {
        updated.secondary = prev.secondary.filter(k => k !== keyword)
      } else if (fromCategory === 'lsi') {
        updated.lsi = prev.lsi.filter(k => k !== keyword)
      } else if (fromCategory === 'long_tail') {
        updated.long_tail = prev.long_tail.filter(k => k !== keyword)
      }
      
      // Move old main keyword back to primary if it exists
      if (prev.main_keyword && prev.main_keyword !== keyword) {
        if (!updated.primary.includes(prev.main_keyword)) {
          updated.primary = [prev.main_keyword, ...updated.primary]
        }
      }
      
      // Set new main keyword and add to primary
      updated.main_keyword = keyword
      if (!updated.primary.includes(keyword)) {
        updated.primary = [keyword, ...updated.primary]
      }
      
      return updated
    })
  }

  const handleKeywordToggle = (type: 'primary' | 'secondary' | 'lsi' | 'long_tail', keyword: string) => {
    setSelectedKeywords(prev => {
      const current = prev[type]
      const isSelected = current.includes(keyword)
      return {
        ...prev,
        [type]: isSelected
          ? current.filter(k => k !== keyword)
          : [...current, keyword]
      }
    })
  }

  const handleSelectAll = (type: 'primary' | 'secondary' | 'lsi' | 'long_tail') => {
    if (!approval?.output_data) return
    const output = approval.output_data as any
    const allKeywords = output[`${type}_keywords`] || []
    setSelectedKeywords(prev => {
      if (type === 'primary') {
        // For primary, ensure main_keyword is included
        return {
          ...prev,
          primary: prev.main_keyword 
            ? [prev.main_keyword, ...allKeywords.filter(k => k !== prev.main_keyword)]
            : allKeywords
        }
      }
      return {
        ...prev,
        [type]: allKeywords
      }
    })
  }

  const handleDeselectAll = (type: 'primary' | 'secondary' | 'lsi' | 'long_tail') => {
    setSelectedKeywords(prev => {
      if (type === 'primary') {
        // For primary, keep main_keyword even when deselecting all
        return {
          ...prev,
          primary: prev.main_keyword ? [prev.main_keyword] : []
        }
      }
      return {
        ...prev,
        [type]: []
      }
    })
  }

  const handleKeywordSelection = async () => {
    if (!approval) return
    if (isAlreadyDecided) {
      showErrorToast(
        'Already Decided',
        `This approval has already been ${approval.status}.`
      )
      return
    }

    // Validate main keyword is selected
    if (!selectedKeywords.main_keyword) {
      showErrorToast(
        'Main Keyword Required',
        'Please select a main keyword to continue.'
      )
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
          long_tail: selectedKeywords.long_tail
        },
        reviewed_by: user?.email ?? user?.id ?? 'unknown',
      }

      await decideApprovalMutation.mutateAsync({
        approvalId: approval.id,
        decision: decisionRequest,
      })

      showSuccessToast(
        'Keywords Selected',
        `Selected ${totalSelected} keyword(s) successfully`
      )
      
      router.push('/approvals')
    } catch (error) {
      showErrorToast(
        'Selection failed',
        error instanceof Error ? error.message : 'Failed to submit keyword selection'
      )
    }
  }

  const handleDecision = async (selectedDecision: 'approve' | 'reject' | 'modify' | 'rerun', editedDataOverride?: any) => {
    if (!approval) return
    if (isAlreadyDecided) {
      showErrorToast(
        'Already Decided',
        `This approval has already been ${approval.status}.`
      )
      return
    }

    try {
      // Use editedDataOverride if provided, otherwise parse modifiedOutput
      let modifiedOutputData = undefined
      // Determine actual decision: if rerun was selected or if modify with only comment (no edits)
      let actualDecision = selectedDecision
      if (selectedDecision === 'modify') {
        // If modify is clicked with only comment (no output edits), treat as rerun
        if (!hasEditorChanges && !editedDataOverride && comment.trim()) {
          actualDecision = 'rerun'
        } else {
          // Normal modify with output edits
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
        reviewed_by: user?.email ?? user?.id ?? 'unknown',
      }

      await decideApprovalMutation.mutateAsync({
        approvalId: approval.id,
        decision: decisionRequest,
      })

      const actionText = actualDecision === 'rerun' ? 'rerun' : `${actualDecision}d`
      showSuccessToast(
        `Approval ${actionText}`,
        `Content from ${approval.pipeline_step || 'step'} has been ${actionText}`
      )
      
      router.push('/approvals')
    } catch (error) {
      showErrorToast(
        'Decision failed',
        error instanceof Error ? error.message : 'Failed to submit decision'
      )
    }
  }

  const handleCancelJob = async () => {
    if (!approval) return
    
    if (!confirm('Are you sure you want to cancel this job? This action cannot be undone.')) {
      return
    }

    try {
      await cancelJobMutation.mutateAsync(approval.job_id)
      showSuccessToast(
        'Job Cancelled',
        'The job has been cancelled successfully.'
      )
      router.push('/approvals')
    } catch (error) {
      showErrorToast(
        'Cancel Failed',
        error instanceof Error ? error.message : 'Failed to cancel job'
      )
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

  const chips = approval
    ? [
        {
          label: (approval.pipeline_step || 'Unknown Step').replace(/_/g, ' ').toUpperCase(),
          color: getStepBadgeColor(approval.pipeline_step || ''),
        },
        {
          label: approval.status,
          color: (approval.status === 'pending' ? 'warning' : approval.status === 'approved' ? 'success' : 'error') as const,
        },
      ]
    : []

  return (
    <LoadingErrorState
      loading={isLoading}
      error={error || !approval ? (error || new Error('Approval not found')) : undefined}
      loadingText="Loading approval..."
      errorText={error ? `Failed to load approval: ${error instanceof Error ? error.message : String(error)}` : 'Approval not found'}
      backPath="/approvals"
      backLabel="Back to Approvals"
    >
      {approval && (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <PageHeader
            title="Review Approval"
            backPath="/approvals"
            backLabel="Back to Approvals"
            chips={chips}
          />

          {approval.confidence_score !== undefined && <ConfidenceScore score={approval.confidence_score} />}

          <ApprovalStatusAlert approval={approval} />

      {/* Suggestions */}
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
                defaultExpanded={true}
                onChange={(expanded) => setExpandedOutput(expanded)}
              >
                {approval.pipeline_step && approval.pipeline_step !== 'seo_keywords' ? (
                  <Box>
                    <StepEditor
                      stepName={approval.pipeline_step}
                      initialData={approval.output_data}
                      onDataChange={(data, hasChanges) => {
                        setEditedData(data)
                        setHasEditorChanges(hasChanges)
                        if (hasChanges) {
                          setModifiedOutput(JSON.stringify(data, null, 2))
                        }
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

      {/* Analysis Metrics for seo_keywords step */}
      {isKeywordSelectionStep && approval.output_data && (
        <SEOAnalysisMetrics outputData={approval.output_data} />
      )}

      {/* Keyword Selection UI for seo_keywords step */}
      {isKeywordSelectionStep && approval.output_data && (
        <SEOKeywordsSelection
          outputData={approval.output_data}
          selectedKeywords={selectedKeywords}
          onMainKeywordChange={handleMainKeywordChange}
          onKeywordToggle={handleKeywordToggle}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onPromoteToMain={handlePromoteToMain}
        />
      )}

      {/* Comment Section */}
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

      {/* Modify Section */}
      {!isKeywordSelectionStep && decision === 'modify' && (
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
              inputProps={{
                style: { fontFamily: 'monospace', fontSize: '0.875rem' }
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
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

            {isKeywordSelectionStep ? (
              <>
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
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={handleKeywordSelection}
                  disabled={decideApprovalMutation.isPending || isAlreadyDecided}
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
                      // If editor has changes, use that data
                      if (editedData && hasEditorChanges) {
                        setModifiedOutput(JSON.stringify(editedData, null, 2))
                      }
                    }
                  }}
                  disabled={decideApprovalMutation.isPending || isAlreadyDecided || !comment.trim() || decision === 'modify'}
                  color={hasEditorChanges ? 'primary' : comment.trim() ? 'primary' : 'inherit'}
                >
                  {decision === 'modify' ? 'Cancel Modify' : hasEditorChanges ? 'Modify (Changes Made)' : comment.trim() ? 'Rerun with Comments' : 'Modify'}
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
                      // Use edited data if available, otherwise trigger rerun if comment exists
                      if (hasEditorChanges && editedData) {
                        handleDecision('modify', editedData)
                      } else if (comment.trim()) {
                        handleDecision('modify') // Will trigger rerun if no edits
                      }
                    }}
                    disabled={decideApprovalMutation.isPending || (!hasEditorChanges && !comment.trim()) || isAlreadyDecided}
                  >
                    {hasEditorChanges ? 'Submit Modified' : 'Rerun with Comments'}
                  </Button>
                )}
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
        </Container>
      )}
    </LoadingErrorState>
  )
}

