'use client'

import { useParams, useRouter } from 'next/navigation'
import { Container, Card, CardContent, Button, Stack, TextField, Typography } from '@mui/material'
import { CheckCircle, Cancel, Refresh } from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useApproval, useDecideApproval, useCancelJob } from '@/hooks/useApi'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import type { ApprovalDecisionRequest } from '@/types/api'
import { SEOKeywordsSelection, SelectedKeywords } from '@/components/approvals/seo/SEOKeywordsSelection'
import { SEOAnalysisMetrics } from '@/components/approvals/sections/seo/SEOAnalysisMetrics'
import { getJobRoute } from '@/lib/job-routing'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingErrorState } from '@/components/shared/LoadingErrorState'
import { AccordionSection } from '@/components/shared/AccordionSection'
import { JsonDisplay } from '@/components/shared/JsonDisplay'
import { ConfidenceScore } from '@/components/shared/ConfidenceScore'
import { ApprovalStatusAlert } from '@/components/shared/ApprovalStatusAlert'

export default function SEOKeywordsApprovalPage() {
  const params = useParams()
  const router = useRouter()
  const approvalId = params.approvalId as string

  const { data, isLoading, error } = useApproval(approvalId)
  const decideApprovalMutation = useDecideApproval()
  const cancelJobMutation = useCancelJob()

  const [comment, setComment] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<SelectedKeywords>({
    main_keyword: '',
    primary: [],
    secondary: [],
    lsi: [],
    long_tail: [],
  })
  const [expandedOutput, setExpandedOutput] = useState(false)
  const [expandedInput, setExpandedInput] = useState(false)

  const approval = data?.data

  useEffect(() => {
    if (approval?.pipeline_step === 'seo_keywords' && approval.output_data) {
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

  useEffect(() => {
    if (approval && approval.pipeline_step !== 'seo_keywords') {
      router.push(`/approvals/${approvalId}`)
    }
  }, [approval, approvalId, router])

  const isAlreadyDecided = approval?.status !== 'pending'

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
      if (fromCategory === 'primary') {
        updated.primary = prev.primary.filter((k) => k !== keyword)
      } else if (fromCategory === 'secondary') {
        updated.secondary = prev.secondary.filter((k) => k !== keyword)
      } else if (fromCategory === 'lsi') {
        updated.lsi = prev.lsi.filter((k) => k !== keyword)
      } else if (fromCategory === 'long_tail') {
        updated.long_tail = prev.long_tail.filter((k) => k !== keyword)
      }

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
      return {
        ...prev,
        [type]: isSelected ? current.filter((k) => k !== keyword) : [...current, keyword],
      }
    })
  }

  const handleSelectAll = (type: 'primary' | 'secondary' | 'lsi' | 'long_tail') => {
    const output = approval?.output_data as any
    const allKeywords = output?.[`${type}_keywords`] || []
    setSelectedKeywords((prev) => {
      if (type === 'primary') {
        return {
          ...prev,
          primary: prev.main_keyword
            ? [prev.main_keyword, ...allKeywords.filter((k: string) => k !== prev.main_keyword)]
            : allKeywords,
        }
      }
      return {
        ...prev,
        [type]: allKeywords,
      }
    })
  }

  const handleDeselectAll = (type: 'primary' | 'secondary' | 'lsi' | 'long_tail') => {
    setSelectedKeywords((prev) => {
      if (type === 'primary') {
        return {
          ...prev,
          primary: prev.main_keyword ? [prev.main_keyword] : [],
        }
      }
      return {
        ...prev,
        [type]: [],
      }
    })
  }

  const handleKeywordSelection = async () => {
    if (!approval || isAlreadyDecided) {
      showErrorToast('Already Decided', `This approval has already been ${approval?.status}.`)
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

      await decideApprovalMutation.mutateAsync({
        approvalId: approval.id,
        decision: decisionRequest,
      })

      showSuccessToast('Keywords Selected', `Selected ${totalSelected} keyword(s) successfully`)

      router.push('/approvals')
    } catch (error) {
      showErrorToast('Selection failed', error instanceof Error ? error.message : 'Failed to submit keyword selection')
    }
  }

  const handleCancelJob = async () => {
    if (!approval) return

    if (!confirm('Are you sure you want to cancel this job? This action cannot be undone.')) {
      return
    }

    try {
      await cancelJobMutation.mutateAsync(approval.job_id)
      showSuccessToast('Job Cancelled', 'The job has been cancelled successfully.')
      router.push('/approvals')
    } catch (error) {
      showErrorToast('Cancel Failed', error instanceof Error ? error.message : 'Failed to cancel job')
    }
  }

  const handleRerun = async () => {
    if (!approval || isAlreadyDecided) {
      showErrorToast('Already Decided', `This approval has already been ${approval?.status}.`)
      return
    }

    if (!comment.trim()) {
      showErrorToast('Comment Required', 'Please add a comment to provide guidance for the rerun.')
      return
    }

    try {
      const decisionRequest: ApprovalDecisionRequest = {
        decision: 'rerun',
        comment: comment,
        reviewed_by: 'current_user',
      }

      await decideApprovalMutation.mutateAsync({
        approvalId: approval.id,
        decision: decisionRequest,
      })

      showSuccessToast(
        'Rerun Initiated',
        'SEO Keywords step will be rerun with your comments. A new approval will be created for the regenerated output.'
      )
      router.push('/approvals')
    } catch (error) {
      showErrorToast('Rerun Failed', error instanceof Error ? error.message : 'Failed to initiate rerun')
    }
  }

  const chips = approval
    ? [
        { label: 'SEO KEYWORDS', color: 'success' as const },
        {
          label: approval.status,
          color: (approval.status === 'pending' ? 'warning' : approval.status === 'approved' ? 'success' : 'error') as const,
        },
      ]
    : []

  const actions = approval ? (
    <Button variant="outlined" onClick={() => router.push(getJobRoute('seo_keywords', approval.job_id))}>
      View in Job
    </Button>
  ) : undefined

  return (
    <LoadingErrorState
      loading={isLoading}
      error={error || !approval ? (error || new Error('Approval not found')) : undefined}
      loadingText="Loading SEO Keywords approval..."
      errorText={error ? `Failed to load approval: ${error instanceof Error ? error.message : String(error)}` : 'Approval not found'}
      backPath="/approvals"
      backLabel="Back to Approvals"
    >
      {approval && (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <PageHeader
            title="SEO Keywords Approval"
            backPath="/approvals"
            backLabel="Back to Approvals"
            chips={chips}
            actions={actions}
          />

          {approval.confidence_score !== undefined && <ConfidenceScore score={approval.confidence_score} />}

          <ApprovalStatusAlert approval={approval} />

          {approval.output_data && <SEOAnalysisMetrics outputData={approval.output_data} />}

          {approval.output_data && (
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

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <AccordionSection
                title="Generated Output (JSON)"
                defaultExpanded={false}
                onChange={(expanded) => setExpandedOutput(expanded)}
              >
                <JsonDisplay data={approval.output_data} />
              </AccordionSection>

              <AccordionSection
                title="Input Data"
                defaultExpanded={false}
                onChange={(expanded) => setExpandedInput(expanded)}
              >
                <JsonDisplay data={approval.input_data} />
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
                  color="primary"
                  startIcon={<Refresh />}
                  onClick={handleRerun}
                  disabled={decideApprovalMutation.isPending || isAlreadyDecided || !comment.trim()}
                >
                  Rerun with Comments
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
              </Stack>
            </CardContent>
          </Card>
        </Container>
      )}
    </LoadingErrorState>
  )
}
