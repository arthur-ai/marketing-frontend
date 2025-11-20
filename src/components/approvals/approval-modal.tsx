'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  Edit,
  Clock,
  AlertCircle,
  Sparkles,
  Code,
  FileText,
  RotateCcw
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json'
import { vs2015 } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import {
  Checkbox,
  FormGroup,
  FormControlLabel,
  Typography,
  Box,
  Chip,
  Paper,
  Divider,
  Button as MuiButton,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Alert,
  Stack
} from '@mui/material'
import type { ApprovalRequest, ApprovalDecisionRequest } from '@/types/api'
import { useDecideApproval, useRetryStep } from '@/hooks/useApi'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'
import { formatApprovalOutput } from '@/lib/approval-formatter'
import { StepEditor } from './StepEditor'

SyntaxHighlighter.registerLanguage('json', json)

interface ApprovalModalProps {
  approval: ApprovalRequest | null
  isOpen: boolean
  onClose: () => void
  onRetry?: (approvalId: string) => void
}

interface SelectedKeywords {
  main_keyword: string  // Required: Single main keyword
  primary: string[]
  secondary: string[]
  lsi: string[]
}

export function ApprovalModal({ approval, isOpen, onClose, onRetry }: ApprovalModalProps) {
  const [comment, setComment] = useState('')
  const [modifiedOutput, setModifiedOutput] = useState('')
  const [decision, setDecision] = useState<'approve' | 'reject' | 'modify' | null>(null)
  const [showRetryOption, setShowRetryOption] = useState(false)
  const [selectedKeywords, setSelectedKeywords] = useState<SelectedKeywords>({
    main_keyword: '',
    primary: [],
    secondary: [],
    lsi: []
  })
  const [editedData, setEditedData] = useState<any>(null)
  const [hasEditorChanges, setHasEditorChanges] = useState(false)
  const decideApprovalMutation = useDecideApproval()
  const retryStepMutation = useRetryStep()

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
        lsi: output.lsi_keywords || []
      })
    }
    // Reset state when modal closes or approval changes
    if (!approval) {
      setComment('')
      setModifiedOutput('')
      setDecision(null)
      setShowRetryOption(false)
    }
  }, [approval])

  // Don't render if not open
  if (!isOpen) return null

  const isKeywordSelectionStep = approval?.pipeline_step === 'seo_keywords'
  
  // Ensure DialogTitle is always rendered for accessibility
  const dialogTitle = approval 
    ? `Review AI Output - ${(approval.pipeline_step || 'Unknown Step').replace(/_/g, ' ')}`
    : 'Loading Approval'

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

  const handleKeywordToggle = (type: 'primary' | 'secondary' | 'lsi', keyword: string) => {
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

  const handleSelectAll = (type: 'primary' | 'secondary' | 'lsi') => {
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

  const handleDeselectAll = (type: 'primary' | 'secondary' | 'lsi') => {
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
      selectedKeywords.lsi.length

    try {
      setDecision('modify')

      const decisionRequest: ApprovalDecisionRequest = {
        decision: 'modify',
        comment: comment || undefined,
        main_keyword: selectedKeywords.main_keyword,
        selected_keywords: {
          primary: selectedKeywords.primary,
          secondary: selectedKeywords.secondary,
          lsi: selectedKeywords.lsi
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
      
      // Reset state and close
      setComment('')
      setSelectedKeywords({ main_keyword: '', primary: [], secondary: [], lsi: [] })
      setDecision(null)
      onClose()
    } catch (error) {
      showErrorToast(
        'Selection failed',
        error instanceof Error ? error.message : 'Failed to submit keyword selection'
      )
      setDecision(null)
    }
  }

  const handleDecision = async (selectedDecision: 'approve' | 'reject' | 'modify', editedDataOverride?: any) => {
    try {
      setDecision(selectedDecision)

      // Use editedDataOverride if provided, otherwise parse modifiedOutput
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
        reviewed_by: 'current_user', // Replace with actual user ID
      }

      await decideApprovalMutation.mutateAsync({
        approvalId: approval.id,
        decision: decisionRequest,
      })

      if (selectedDecision === 'reject') {
        // Show retry option for rejected approvals
        setShowRetryOption(true)
        showErrorToast(
          'Content Rejected',
          `Content from ${approval.pipeline_step} was rejected. You can retry processing or close this dialog.`,
          onRetry ? {
            label: 'Retry',
            onClick: () => {
              onRetry(approval.id)
              setShowRetryOption(false)
              onClose()
            }
          } : undefined
        )
      } else {
        showSuccessToast(
          `Approval ${selectedDecision}d`,
          `Content from ${approval.pipeline_step || 'step'} has been ${selectedDecision}d`
        )
        
        // Reset state and close
        setComment('')
        setModifiedOutput('')
        setDecision(null)
        setShowRetryOption(false)
        onClose()
      }
    } catch (error) {
      showErrorToast(
        'Decision failed',
        error instanceof Error ? error.message : 'Failed to submit decision'
      )
      setDecision(null)
    }
  }

  const handleRetry = async () => {
    try {
      const result = await retryStepMutation.mutateAsync(approval.id)
      
      showSuccessToast(
        'Step Retry Initiated',
        `Step "${approval.pipeline_step || 'step'}" is being retried. Job ID: ${result.data.job_id.substring(0, 8)}...`
      )
      
      setShowRetryOption(false)
      setComment('')
      setModifiedOutput('')
      setDecision(null)
      onClose()
      
      // Call the optional callback if provided
      if (onRetry) {
        onRetry(approval.id)
      }
    } catch (error) {
      showErrorToast(
        'Retry Failed',
        error instanceof Error ? error.message : 'Failed to initiate step retry'
      )
    }
  }

  const getStepBadgeColor = (stepName: string) => {
    const colors: Record<string, string> = {
      transcript_preprocessing_approval: 'bg-teal-500',
      seo_keywords: 'bg-green-500',
      marketing_brief: 'bg-red-500',
      article_generation: 'bg-purple-500',
      seo_optimization: 'bg-yellow-500',
      suggested_links: 'bg-pink-500',
      content_formatting: 'bg-indigo-500',
      design_kit: 'bg-blue-500',
    }
    return colors[stepName] || 'bg-gray-500'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {approval ? 'Review AI Output' : 'Loading Approval'}
            </DialogTitle>
            {approval && (
              <Badge className={`${getStepBadgeColor(approval.pipeline_step || 'unknown')} text-white`}>
                {(approval.pipeline_step || 'Unknown Step').replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
          <DialogDescription>
            {approval 
              ? 'Review and approve the output from this pipeline step'
              : 'Loading approval details...'}
          </DialogDescription>
        </DialogHeader>

        {!approval ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3">Loading approval details...</span>
          </div>
        ) : (
          <>

        {/* Confidence Score */}
        {approval.confidence_score !== undefined && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Confidence Score
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${approval.confidence_score * 100}%` }}
                    />
                  </div>
                  <span className="font-bold text-blue-900">
                    {(approval.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggestions */}
        {approval.suggestions && approval.suggestions.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" />
                Review Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-900">
                {approval.suggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="output" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="output" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Generated Output</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {/* Use StepEditor for steps that have specialized editors, fallback to markdown for others */}
                  {approval.pipeline_step && approval.pipeline_step !== 'seo_keywords' ? (
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
                  ) : approval.pipeline_step === 'seo_keywords' ? (
                    <ReactMarkdown>
                      {formatApprovalOutput(approval.output_data, approval.pipeline_step || 'unknown')}
                    </ReactMarkdown>
                  ) : (
                    <ReactMarkdown>
                      {formatApprovalOutput(approval.output_data, approval.pipeline_step || 'unknown')}
                    </ReactMarkdown>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="input" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Input Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(approval.input_data, null, 2)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raw" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Raw JSON
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SyntaxHighlighter 
                  language="json" 
                  style={vs2015}
                  customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '0.75rem' }}
                >
                  {JSON.stringify(approval.output_data, null, 2)}
                </SyntaxHighlighter>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Analysis Metrics for seo_keywords step */}
        {isKeywordSelectionStep && approval.output_data && (() => {
          const output = approval.output_data as any
          const searchIntent = output.search_intent
          const keywordDifficulty = output.keyword_difficulty
          const relevanceScore = output.relevance_score
          const confidenceScore = output.confidence_score
          const keywordDensity = output.keyword_density || {}
          const primaryKeywords = output.primary_keywords || []
          
          // Handle keyword_difficulty: can be string (legacy) or dict (new format)
          const getDifficultyDisplay = () => {
            if (!keywordDifficulty) return null
            
            // New format: dictionary of keyword -> score
            if (typeof keywordDifficulty === 'object' && !Array.isArray(keywordDifficulty) && keywordDifficulty !== null) {
              const scores = Object.values(keywordDifficulty) as number[]
              if (scores.length === 0) return null
              const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
              const difficultyLevel = avgScore > 70 ? 'Hard' : avgScore > 40 ? 'Medium' : 'Easy'
              return {
                label: `Avg Difficulty: ${difficultyLevel} (${avgScore.toFixed(0)})`,
                color: avgScore > 70 ? 'error' : avgScore > 40 ? 'warning' : 'success'
              }
            }
            
            // Legacy format: string
            if (typeof keywordDifficulty === 'string') {
              const difficultyStr = keywordDifficulty.charAt(0).toUpperCase() + keywordDifficulty.slice(1)
              const difficultyLower = keywordDifficulty.toLowerCase()
              return {
                label: `Difficulty: ${difficultyStr}`,
                color: difficultyLower === 'easy' ? 'success' : difficultyLower === 'medium' ? 'warning' : 'error'
              }
            }
            
            return null
          }
          
          const difficultyDisplay = getDifficultyDisplay()
          
          return (
            <Box sx={{ mt: 3, mb: 3 }}>
              <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  SEO Analysis Metrics
                </Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {/* Key Metrics Row */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {searchIntent && (
                      <Chip
                        label={`Search Intent: ${searchIntent.charAt(0).toUpperCase() + searchIntent.slice(1)}`}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {difficultyDisplay && (
                      <Chip
                        label={difficultyDisplay.label}
                        color={difficultyDisplay.color as any}
                        variant="outlined"
                      />
                    )}
                    {relevanceScore !== null && relevanceScore !== undefined && (
                      <Chip
                        label={`Relevance: ${relevanceScore.toFixed(1)}%`}
                        color={relevanceScore >= 70 ? 'success' : relevanceScore >= 50 ? 'warning' : 'error'}
                        variant="outlined"
                      />
                    )}
                    {confidenceScore !== null && confidenceScore !== undefined && (
                      <Chip
                        label={`Confidence: ${(confidenceScore * 100).toFixed(1)}%`}
                        color={confidenceScore >= 0.7 ? 'success' : confidenceScore >= 0.5 ? 'warning' : 'error'}
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {/* Score Bars */}
                  {(relevanceScore !== null && relevanceScore !== undefined) || 
                   (confidenceScore !== null && confidenceScore !== undefined) ? (
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                      {relevanceScore !== null && relevanceScore !== undefined && (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" fontWeight="medium">
                              Relevance Score
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {relevanceScore.toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              width: '100%',
                              height: 8,
                              bgcolor: 'grey.200',
                              borderRadius: 1,
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              sx={{
                                width: `${relevanceScore}%`,
                                height: '100%',
                                bgcolor: relevanceScore >= 70 ? 'success.main' : relevanceScore >= 50 ? 'warning.main' : 'error.main',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </Box>
                        </Box>
                      )}
                      {confidenceScore !== null && confidenceScore !== undefined && (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" fontWeight="medium">
                              Confidence Score
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(confidenceScore * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              width: '100%',
                              height: 8,
                              bgcolor: 'grey.200',
                              borderRadius: 1,
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              sx={{
                                width: `${confidenceScore * 100}%`,
                                height: '100%',
                                bgcolor: confidenceScore >= 0.7 ? 'success.main' : confidenceScore >= 0.5 ? 'warning.main' : 'error.main',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ) : null}

                  {/* Keyword Density Table */}
                  {Object.keys(keywordDensity).length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                        Keyword Density Analysis
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Stack spacing={1}>
                          {primaryKeywords.map((keyword: string) => {
                            const density = keywordDensity[keyword]
                            if (density === null || density === undefined) return null
                            return (
                              <Box
                                key={keyword}
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  py: 0.5
                                }}
                              >
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                  {keyword}
                                  {output.main_keyword === keyword && (
                                    <Chip
                                      label="Main"
                                      size="small"
                                      color="primary"
                                      sx={{ ml: 1, height: 20 }}
                                    />
                                  )}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, ml: 2 }}>
                                  <Box
                                    sx={{
                                      flex: 1,
                                      height: 6,
                                      bgcolor: 'grey.200',
                                      borderRadius: 1,
                                      overflow: 'hidden',
                                      mr: 1
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: `${Math.min(density * 10, 100)}%`,
                                        height: '100%',
                                        bgcolor: density >= 2 ? 'success.main' : density >= 1 ? 'warning.main' : 'info.main'
                                      }}
                                    />
                                  </Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 50, textAlign: 'right' }}>
                                    {density.toFixed(2)}%
                                  </Typography>
                                </Box>
                              </Box>
                            )
                          })}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Optimal density: 1-2% per keyword. Higher density may indicate keyword stuffing.
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Box>
          )
        })()}

        {/* Keyword Selection UI for seo_keywords step */}
        {isKeywordSelectionStep && approval.output_data && (
          <Box sx={{ mt: 3, mb: 3 }}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Select Keywords to Keep
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                <strong>Required:</strong> Select ONE main keyword that will be the primary focus. Then select any additional supporting keywords.
              </Typography>

              {(() => {
                const output = approval.output_data as any
                const primaryKeywords = output.primary_keywords || []
                const secondaryKeywords = output.secondary_keywords || []
                const lsiKeywords = output.lsi_keywords || []

                return (
                  <>
                    {/* Main Keyword Selection (Required) */}
                    {primaryKeywords.length > 0 && (
                      <Box sx={{ mb: 3 }}>
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
                      <Box sx={{ mb: 3 }}>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Additional Primary Keywords (Optional)
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                              label={`${selectedKeywords.primary.length} of ${primaryKeywords.length}`}
                              size="small"
                              color="primary"
                            />
                            <MuiButton
                              size="small"
                              onClick={() => handleSelectAll('primary')}
                              disabled={selectedKeywords.primary.length === primaryKeywords.length}
                            >
                              Select All
                            </MuiButton>
                            <MuiButton
                              size="small"
                              onClick={() => handleDeselectAll('primary')}
                              disabled={selectedKeywords.primary.length === 0}
                            >
                              Deselect All
                            </MuiButton>
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
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Secondary Keywords
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip 
                                label={`${selectedKeywords.secondary.length} of ${secondaryKeywords.length}`}
                                size="small"
                                color="secondary"
                              />
                              <MuiButton
                                size="small"
                                onClick={() => handleSelectAll('secondary')}
                                disabled={selectedKeywords.secondary.length === secondaryKeywords.length}
                              >
                                Select All
                              </MuiButton>
                              <MuiButton
                                size="small"
                                onClick={() => handleDeselectAll('secondary')}
                                disabled={selectedKeywords.secondary.length === 0}
                              >
                                Deselect All
                              </MuiButton>
                            </Box>
                          </Box>
                          <FormGroup>
                            {secondaryKeywords.map((keyword: string) => (
                              <FormControlLabel
                                key={keyword}
                                control={
                                  <Checkbox
                                    checked={selectedKeywords.secondary.includes(keyword)}
                                    onChange={() => handleKeywordToggle('secondary', keyword)}
                                  />
                                }
                                label={keyword}
                              />
                            ))}
                          </FormGroup>
                        </Box>
                      </>
                    )}

                    {/* LSI Keywords */}
                    {lsiKeywords.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              LSI Keywords
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip 
                                label={`${selectedKeywords.lsi.length} of ${lsiKeywords.length}`}
                                size="small"
                                color="info"
                              />
                              <MuiButton
                                size="small"
                                onClick={() => handleSelectAll('lsi')}
                                disabled={selectedKeywords.lsi.length === lsiKeywords.length}
                              >
                                Select All
                              </MuiButton>
                              <MuiButton
                                size="small"
                                onClick={() => handleDeselectAll('lsi')}
                                disabled={selectedKeywords.lsi.length === 0}
                              >
                                Deselect All
                              </MuiButton>
                            </Box>
                          </Box>
                          <FormGroup>
                            {lsiKeywords.map((keyword: string) => (
                              <FormControlLabel
                                key={keyword}
                                control={
                                  <Checkbox
                                    checked={selectedKeywords.lsi.includes(keyword)}
                                    onChange={() => handleKeywordToggle('lsi', keyword)}
                                  />
                                }
                                label={keyword}
                              />
                            ))}
                          </FormGroup>
                        </Box>
                      </>
                    )}

                    {/* Summary */}
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Main Keyword:</strong> {selectedKeywords.main_keyword || 'Not selected'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Total Supporting Keywords Selected:</strong>{' '}
                        {selectedKeywords.primary.length + selectedKeywords.secondary.length + selectedKeywords.lsi.length} keyword(s)
                      </Typography>
                      {!selectedKeywords.main_keyword && (
                        <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                          Error: Main keyword is required. Please select a main keyword above.
                        </Typography>
                      )}
                    </Box>
                  </>
                )
              })()}
            </Paper>
          </Box>
        )}

        {/* Comment Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your feedback or reason for this decision..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[80px] text-sm"
          />
        </div>

        {/* Modify Section */}
        {!isKeywordSelectionStep && decision === 'modify' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <label className="text-sm font-medium">
              Modified Output (JSON)
            </label>
            <textarea
              value={modifiedOutput}
              onChange={(e) => setModifiedOutput(e.target.value)}
              placeholder={JSON.stringify(approval.output_data, null, 2)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[200px] font-mono text-xs"
            />
          </motion.div>
        )}

        {/* Action Buttons */}
        <DialogFooter className="flex gap-2">
          {showRetryOption && onRetry ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Retry Processing
              </Button>
            </>
          ) : isKeywordSelectionStep ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={decideApprovalMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleKeywordSelection}
                disabled={decideApprovalMutation.isPending || decision !== null}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Submit Selection
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={decideApprovalMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={() => handleDecision('reject')}
                disabled={decideApprovalMutation.isPending || decision !== null}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>

              <Button
                variant="outline"
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
                disabled={decideApprovalMutation.isPending || (!hasEditorChanges && decision !== 'modify')}
                className={`flex items-center gap-2 ${hasEditorChanges ? 'border-blue-600 text-blue-600' : ''}`}
              >
                <Edit className="h-4 w-4" />
                {decision === 'modify' ? 'Cancel Modify' : hasEditorChanges ? 'Modify (Changes Made)' : 'Modify'}
              </Button>

              <Button
                onClick={() => handleDecision('approve')}
                disabled={decideApprovalMutation.isPending || (decision === 'modify' && !hasEditorChanges) || decision !== null}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>

              {decision === 'modify' && (
                <Button
                  onClick={() => {
                    if (editedData && hasEditorChanges) {
                      handleDecision('modify', editedData)
                    } else {
                      handleDecision('modify')
                    }
                  }}
                  disabled={decideApprovalMutation.isPending || (!hasEditorChanges && !modifiedOutput)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Submit Modified
                </Button>
              )}
            </>
          )}
        </DialogFooter>

        {/* Loading State */}
        {decideApprovalMutation.isPending && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

