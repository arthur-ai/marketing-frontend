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
  Paper,
  Stack,
  TextField,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material'
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Edit,
  Save,
  ExpandMore,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useApproval, useDecideApproval, useCancelJob } from '@/hooks/useApi'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import { formatApprovalOutput } from '@/lib/approval-formatter'
import type { ApprovalRequest, ApprovalDecisionRequest } from '@/types/api'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json'
import { vs2015 } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import { StepEditor } from '@/components/approvals/StepEditor'
import { MarkdownSection } from '@/components/approvals/sections/shared/MarkdownSection'
import { SEOAnalysisMetrics } from '@/components/approvals/sections/seo/SEOAnalysisMetrics'

SyntaxHighlighter.registerLanguage('json', json)

interface SelectedKeywords {
  main_keyword: string  // Required: Single main keyword
  primary: string[]
  secondary: string[]
  lsi: string[]
  long_tail: string[]
}

export default function ApprovalDetailPage() {
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

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading approval...</Typography>
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

  const isKeywordSelectionStep = approval.pipeline_step === 'seo_keywords'
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

  const handleDecision = async (selectedDecision: 'approve' | 'reject' | 'modify' | 'rerun', editedDataOverride?: any) => {
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
        reviewed_by: 'current_user',
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

  const getStepBadgeColor = (stepName: string) => {
    const colors: Record<string, "success" | "error" | "warning" | "info" | "default"> = {
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
              Review Approval
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Chip
                label={(approval.pipeline_step || 'Unknown Step').replace(/_/g, ' ').toUpperCase()}
                color={getStepBadgeColor(approval.pipeline_step || '')}
                sx={{ textTransform: 'uppercase' }}
              />
              <Chip
                label={approval.status}
                color={approval.status === 'pending' ? 'warning' : approval.status === 'approved' ? 'success' : 'error'}
              />
            </Box>
          </Box>
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

      {/* Content - Collapsible Sections */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {/* Generated Output */}
          <Accordion expanded={expandedOutput} onChange={(_, isExpanded) => setExpandedOutput(isExpanded)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Generated Output
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* Use StepEditor for steps that have specialized editors, fallback to markdown for others */}
              {approval.pipeline_step && approval.pipeline_step !== 'seo_keywords' ? (
                <Box>
                  <StepEditor
                    stepName={approval.pipeline_step}
                    initialData={approval.output_data}
                    onDataChange={(data, hasChanges) => {
                      setEditedData(data)
                      setHasEditorChanges(hasChanges)
                      // Update modifiedOutput for modify decision
                      if (hasChanges) {
                        setModifiedOutput(JSON.stringify(data, null, 2))
                      }
                    }}
                  />
                  {/* Fallback to markdown if StepEditor returns null */}
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

          {/* Raw JSON */}
          <Accordion expanded={expandedRawJson} onChange={(_, isExpanded) => setExpandedRawJson(isExpanded)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Raw JSON Output
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
        </CardContent>
      </Card>

      {/* Analysis Metrics for seo_keywords step */}
      {isKeywordSelectionStep && approval.output_data && (
        <SEOAnalysisMetrics outputData={approval.output_data} />
      )}

      {/* Keyword Selection UI for seo_keywords step */}
      {isKeywordSelectionStep && approval.output_data && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select Keywords to Keep
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              <strong>Required:</strong> Select ONE main keyword that will be the primary focus. Then select any additional supporting keywords.
            </Typography>
            
            {/* Keyword Category Explanations */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Keyword Categories Explained
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                <li>
                  <Typography variant="body2" component="span" fontWeight="bold">Primary Keywords:</Typography>
                  <Typography variant="body2" component="span"> Used in title, headings, and main content focus. These are your core SEO targets.</Typography>
                </li>
                <li>
                  <Typography variant="body2" component="span" fontWeight="bold">Secondary Keywords:</Typography>
                  <Typography variant="body2" component="span"> Supporting content, natural variations. Used throughout the article to provide context and depth.</Typography>
                </li>
                <li>
                  <Typography variant="body2" component="span" fontWeight="bold">LSI Keywords:</Typography>
                  <Typography variant="body2" component="span"> Semantic depth, related concepts. Help search engines understand topic context and improve relevance.</Typography>
                </li>
                <li>
                  <Typography variant="body2" component="span" fontWeight="bold">Long-tail Keywords:</Typography>
                  <Typography variant="body2" component="span"> Specific sections, FAQ-style content. Used in detailed explanations and answer specific user queries.</Typography>
                </li>
              </Box>
              <Typography variant="caption" display="block" sx={{ mt: 1.5, fontStyle: 'italic' }}>
                <strong>Downstream Usage:</strong> All selected keywords will be used in the article generation step to create comprehensive, SEO-optimized content. The main keyword will be emphasized in the title and headings, while other categories will be naturally integrated throughout the content.
              </Typography>
            </Alert>

            {(() => {
              const output = approval.output_data as any
              const primaryKeywords = output.primary_keywords || []
              const secondaryKeywords = output.secondary_keywords || []
              const lsiKeywords = output.lsi_keywords || []
              const longTailKeywords = output.long_tail_keywords || []

              return (
                <Stack spacing={3}>
                  {/* Main Keyword Selection (Required) */}
                  {primaryKeywords.length > 0 && (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="bold">
                          Select Main Keyword (Required)
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                          Choose the single most important keyword that will be the primary focus for this content.
                        </Typography>
                      </Alert>
                      <FormControl component="fieldset" required fullWidth>
                        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Main Keyword
                        </FormLabel>
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
                                    <Typography variant="body1">{keyword}</Typography>
                                    {isAISuggested && (
                                      <Chip
                                        label="AI Suggested"
                                        size="small"
                                        color="primary"
                                        sx={{ height: 20 }}
                                      />
                                    )}
                                    {keywordDensity !== null && keywordDensity !== undefined && (
                                      <Chip
                                        label={`${keywordDensity.toFixed(1)}% density`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 20 }}
                                      />
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

                  {/* Supporting Primary Keywords */}
                  {primaryKeywords.length > 0 && (
                    <Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Additional Primary Keywords (Optional)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={`${selectedKeywords.primary.length} of ${primaryKeywords.length}`}
                            size="small"
                            color="primary"
                          />
                          <Button size="small" onClick={() => handleSelectAll('primary')}>
                            Select All
                          </Button>
                          <Button size="small" onClick={() => handleDeselectAll('primary')}>
                            Deselect All
                          </Button>
                        </Box>
                      </Box>
                      <FormGroup>
                        {primaryKeywords.map((keyword: string) => (
                          <FormControlLabel
                            key={keyword}
                            control={
                              <Checkbox
                                checked={selectedKeywords.primary.includes(keyword)}
                                onChange={() => handleKeywordToggle('primary', keyword)}
                                disabled={keyword === selectedKeywords.main_keyword} // Main keyword is always selected
                              />
                            }
                            label={keyword}
                          />
                        ))}
                      </FormGroup>
                    </Box>
                  )}

                  {/* Secondary Keywords */}
                  {secondaryKeywords.length > 0 && (
                    <Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Secondary Keywords
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={`${selectedKeywords.secondary.length} of ${secondaryKeywords.length}`}
                            size="small"
                            color="secondary"
                          />
                          <Button size="small" onClick={() => handleSelectAll('secondary')}>
                            Select All
                          </Button>
                          <Button size="small" onClick={() => handleDeselectAll('secondary')}>
                            Deselect All
                          </Button>
                        </Box>
                      </Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="caption">
                          <strong>Usage:</strong> Supporting content, natural variations. Used throughout the article to provide context and depth.
                        </Typography>
                      </Alert>
                      <FormGroup>
                        {secondaryKeywords.map((keyword: string) => (
                          <FormControlLabel
                            key={keyword}
                            control={
                              <Checkbox
                                checked={selectedKeywords.secondary.includes(keyword)}
                                onChange={() => handleKeywordToggle('secondary', keyword)}
                                disabled={keyword === selectedKeywords.main_keyword}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Typography variant="body2">{keyword}</Typography>
                                {keyword === selectedKeywords.main_keyword && (
                                  <Chip label="Main" size="small" color="primary" sx={{ height: 20 }} />
                                )}
                                {keyword !== selectedKeywords.main_keyword && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePromoteToMain(keyword, 'secondary')
                                    }}
                                    sx={{ ml: 'auto', height: 24, fontSize: '0.7rem' }}
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
                  )}

                  {/* LSI Keywords */}
                  {lsiKeywords.length > 0 && (
                    <Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          LSI Keywords
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={`${selectedKeywords.lsi.length} of ${lsiKeywords.length}`}
                            size="small"
                            color="info"
                          />
                          <Button size="small" onClick={() => handleSelectAll('lsi')}>
                            Select All
                          </Button>
                          <Button size="small" onClick={() => handleDeselectAll('lsi')}>
                            Deselect All
                          </Button>
                        </Box>
                      </Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="caption">
                          <strong>Usage:</strong> Semantic depth, related concepts. Help search engines understand topic context and improve relevance.
                        </Typography>
                      </Alert>
                      <FormGroup>
                        {lsiKeywords.map((keyword: string) => (
                          <FormControlLabel
                            key={keyword}
                            control={
                              <Checkbox
                                checked={selectedKeywords.lsi.includes(keyword)}
                                onChange={() => handleKeywordToggle('lsi', keyword)}
                                disabled={keyword === selectedKeywords.main_keyword}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Typography variant="body2">{keyword}</Typography>
                                {keyword === selectedKeywords.main_keyword && (
                                  <Chip label="Main" size="small" color="primary" sx={{ height: 20 }} />
                                )}
                                {keyword !== selectedKeywords.main_keyword && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePromoteToMain(keyword, 'lsi')
                                    }}
                                    sx={{ ml: 'auto', height: 24, fontSize: '0.7rem' }}
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
                  )}

                  {/* Long-tail Keywords */}
                  {longTailKeywords.length > 0 && (
                    <Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Long-tail Keywords
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip 
                            label={`${selectedKeywords.long_tail.length} of ${longTailKeywords.length}`}
                            size="small"
                            color="success"
                          />
                          <Button size="small" onClick={() => handleSelectAll('long_tail')}>
                            Select All
                          </Button>
                          <Button size="small" onClick={() => handleDeselectAll('long_tail')}>
                            Deselect All
                          </Button>
                        </Box>
                      </Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="caption">
                          <strong>Usage:</strong> Specific sections, FAQ-style content. Used in detailed explanations and answer specific user queries.
                        </Typography>
                      </Alert>
                      <FormGroup>
                        {longTailKeywords.map((keyword: string) => (
                          <FormControlLabel
                            key={keyword}
                            control={
                              <Checkbox
                                checked={selectedKeywords.long_tail.includes(keyword)}
                                onChange={() => handleKeywordToggle('long_tail', keyword)}
                                disabled={keyword === selectedKeywords.main_keyword}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Typography variant="body2">{keyword}</Typography>
                                {keyword === selectedKeywords.main_keyword && (
                                  <Chip label="Main" size="small" color="primary" sx={{ height: 20 }} />
                                )}
                                {keyword !== selectedKeywords.main_keyword && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePromoteToMain(keyword, 'long_tail')
                                    }}
                                    sx={{ ml: 'auto', height: 24, fontSize: '0.7rem' }}
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
                  )}

                  {/* Summary */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Main Keyword:</strong> {selectedKeywords.main_keyword || 'Not selected'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total Supporting Keywords Selected:</strong>{' '}
                      {selectedKeywords.primary.length + selectedKeywords.secondary.length + selectedKeywords.lsi.length + selectedKeywords.long_tail.length} keyword(s)
                    </Typography>
                    {!selectedKeywords.main_keyword && (
                      <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                        Error: Main keyword is required. Please select a main keyword above.
                      </Typography>
                    )}
                  </Box>
                </Stack>
              )
            })()}
          </CardContent>
        </Card>
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
  )
}

