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
  CircularProgress,
  Alert,
  Stack,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material'
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  ExpandMore,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useApproval, useDecideApproval, useCancelJob } from '@/hooks/useApi'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import type { ApprovalRequest, ApprovalDecisionRequest } from '@/types/api'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json'
import { vs2015 } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import { SEOKeywordsSelection, SelectedKeywords } from '@/components/approvals/seo/SEOKeywordsSelection'
import { SEOAnalysisMetrics } from '@/components/approvals/sections/seo/SEOAnalysisMetrics'
import { getJobRoute } from '@/lib/job-routing'

SyntaxHighlighter.registerLanguage('json', json)

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
    long_tail: []
  })
  const [expandedOutput, setExpandedOutput] = useState(false)
  const [expandedInput, setExpandedInput] = useState(false)
  const [expandedRawJson, setExpandedRawJson] = useState(false)

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

  // Redirect if this is not a seo_keywords approval
  useEffect(() => {
    if (approval && approval.pipeline_step !== 'seo_keywords') {
      router.push(`/approvals/${approvalId}`)
    }
  }, [approval, approvalId, router])

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading SEO Keywords approval...</Typography>
      </Container>
    )
  }

  if (error || !approval) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error ? `Failed to load approval: ${error.message}` : 'Approval not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/approvals')}
          sx={{ mt: 2 }}
        >
          Back to Approvals
        </Button>
      </Container>
    )
  }

  const isAlreadyDecided = approval.status !== 'pending'

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
        reviewed_by: 'current_user',
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/approvals')}
          sx={{ mb: 2 }}
        >
          Back to Approvals
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              SEO Keywords Approval
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Chip
                label="SEO KEYWORDS"
                color="success"
                sx={{ textTransform: 'uppercase' }}
              />
              <Chip
                label={approval.status}
                color={approval.status === 'pending' ? 'warning' : approval.status === 'approved' ? 'success' : 'error'}
              />
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={() => router.push(getJobRoute('seo_keywords', approval.job_id))}
          >
            View in Job
          </Button>
        </Box>
      </Box>

      {/* Confidence Score */}
      {approval.confidence_score !== undefined && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="body2">
              <strong>Confidence Score:</strong> {(approval.confidence_score * 100).toFixed(0)}%
            </Typography>
            <Box sx={{ width: 200, height: 8, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
              <Box
                sx={{
                  width: `${approval.confidence_score * 100}%`,
                  height: '100%',
                  bgcolor: 'primary.main',
                }}
              />
            </Box>
          </Box>
        </Alert>
      )}

      {/* Already Decided Alert */}
      {isAlreadyDecided && (
        <Alert severity={approval.status === 'approved' ? 'success' : approval.status === 'rejected' ? 'error' : 'info'} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            This approval has already been {approval.status}.
          </Typography>
          {approval.reviewed_at && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Reviewed: {new Date(approval.reviewed_at).toLocaleString()}
            </Typography>
          )}
          {approval.reviewed_by && (
            <Typography variant="body2">
              Reviewed by: {approval.reviewed_by}
            </Typography>
          )}
          {approval.user_comment && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Comment: {approval.user_comment}
            </Typography>
          )}
        </Alert>
      )}

      {/* SEO Analysis Metrics */}
      {approval.output_data && (
        <SEOAnalysisMetrics outputData={approval.output_data} />
      )}

      {/* Keyword Selection UI */}
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

      {/* Additional Details - Collapsible Sections */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {/* Generated Output */}
          <Accordion expanded={expandedOutput} onChange={(_, isExpanded) => setExpandedOutput(isExpanded)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Generated Output (JSON)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 0, 
                  bgcolor: 'grey.900', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'auto',
                  maxHeight: '600px'
                }}
              >
                <SyntaxHighlighter 
                  language="json" 
                  style={vs2015}
                  customStyle={{ 
                    margin: 0, 
                    borderRadius: '0.5rem', 
                    fontSize: '0.875rem',
                    padding: '1.5rem',
                    background: 'transparent'
                  }}
                >
                  {JSON.stringify(approval.output_data, null, 2)}
                </SyntaxHighlighter>
              </Paper>
            </AccordionDetails>
          </Accordion>

          {/* Input Data */}
          <Accordion expanded={expandedInput} onChange={(_, isExpanded) => setExpandedInput(isExpanded)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Input Data
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 0, 
                  bgcolor: 'grey.900', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'auto',
                  maxHeight: '600px'
                }}
              >
                <SyntaxHighlighter 
                  language="json" 
                  style={vs2015}
                  customStyle={{ 
                    margin: 0, 
                    borderRadius: '0.5rem', 
                    fontSize: '0.875rem',
                    padding: '1.5rem',
                    background: 'transparent'
                  }}
                >
                  {JSON.stringify(approval.input_data, null, 2)}
                </SyntaxHighlighter>
              </Paper>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

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
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}

