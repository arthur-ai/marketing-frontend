'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import SearchIcon from '@mui/icons-material/Search'
import BoltIcon from '@mui/icons-material/Bolt'
import { 
  useAnalyzeContent,
  useProcessBlog,
  useProcessReleaseNotes,
  useProcessTranscript,
  useJobStatus
} from '@/hooks/useApi'
import { PipelineVisualizer, usePipelineSteps } from '@/components/pipeline/pipeline-visualizer'
import type { PipelineStep } from '@/components/pipeline/pipeline-visualizer'
import { ResultViewer } from '@/components/results/result-viewer'
import { showProcessingToast, showSuccessToast } from '@/lib/toast-utils'
import { motion, AnimatePresence } from 'framer-motion'
import { getPlatformConfig } from '@/lib/platform-config'
import { loadPipelineSettings } from '@/lib/pipeline-settings'
import InfoIcon from '@mui/icons-material/Info'
import Paper from '@mui/material/Paper'
import { UnifiedContentInput } from '@/components/orchestrator/unified-content-input'
import type { ContentItem } from '@/types/api'

interface OrchestratorControlsProps {
  selectedContent?: ContentItem | null
  onContentSelect?: (content: ContentItem | null) => void
}

// Social media pipeline steps (constant, defined outside component)
const socialMediaSteps: PipelineStep[] = [
  { id: 'seo_keywords', name: 'SEO Keywords', status: 'pending', requiresApproval: true },
  { id: 'social_media_marketing_brief', name: 'Marketing Brief', status: 'pending', requiresApproval: true },
  { id: 'social_media_angle_hook', name: 'Angle & Hook', status: 'pending', requiresApproval: true },
  { id: 'social_media_post_generation', name: 'Post Generation', status: 'pending', requiresApproval: true },
]

export function OrchestratorControls({ selectedContent, onContentSelect }: OrchestratorControlsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [results, setResults] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualTitle, setManualTitle] = useState('')
  const [manualContent, setManualContent] = useState('')
  const [manualInputData, setManualInputData] = useState<{ title: string; content: string; contentType: 'blog_post' | 'transcript' | 'release_notes' } | null>(null)
  const [contentType, setContentType] = useState<'blog_post' | 'transcript' | 'release_notes'>('blog_post')
  const [outputContentType, setOutputContentType] = useState<'blog_post' | 'press_release' | 'case_study' | 'social_media_post'>('blog_post')
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<'linkedin' | 'hackernews' | 'email' | ''>('')
  const [socialMediaPlatforms, setSocialMediaPlatforms] = useState<string[]>([])
  const [emailType, setEmailType] = useState<'newsletter' | 'promotional' | ''>('')
  const [variationsCount, setVariationsCount] = useState<number>(1)
  const { steps: pipelineVisualizerSteps } = usePipelineSteps()
  
  const [currentPipelineSteps, setCurrentPipelineSteps] = useState<PipelineStep[]>(
    outputContentType === 'social_media_post' ? socialMediaSteps : pipelineVisualizerSteps
  )
  
  // Update steps when output type changes
  useEffect(() => {
    if (outputContentType === 'social_media_post') {
      setCurrentPipelineSteps(socialMediaSteps.map(s => ({ ...s, status: 'pending' as const })))
    } else {
      setCurrentPipelineSteps(pipelineVisualizerSteps.map(s => ({ ...s, status: 'pending' as const })))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputContentType])
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  const analyzeContentMutation = useAnalyzeContent()
  
  // Deterministic processor hooks (direct routing - faster)
  const processBlogMutation = useProcessBlog()
  const processReleaseNotesMutation = useProcessReleaseNotes()
  const processTranscriptMutation = useProcessTranscript()
  
  // Job status polling (only polls if jobId is set)
  const { data: jobStatus } = useJobStatus(currentJobId || '', !!currentJobId)

  // Handle job status updates
  useEffect(() => {
    if (!jobStatus?.data) return

    const status = jobStatus.data.status
    const progress = jobStatus.data.progress
    const currentStep = jobStatus.data.current_step

    // Update processing step message
    if (currentStep) {
      setProcessingStep(currentStep)
    }

    // Handle job completion
    if (status === 'completed') {
      setIsProcessing(false)
      const result = jobStatus.data.result || {}
      setResults(result)
      setProcessingStep('Processing completed successfully!')
      
      // Update pipeline visualizer with completed steps from result
      if (result.pipeline_result || result.result) {
        const pipelineResult = result.pipeline_result || result.result
        const stepInfo = pipelineResult.metadata?.step_info || []
        
        if (stepInfo.length > 0) {
          setCurrentPipelineSteps(prev =>
            prev.map((step) => {
              const stepInfoEntry = stepInfo.find((si: any) => 
                si.step_name === step.id || 
                si.step_name?.replace('_', ' ') === step.name.toLowerCase()
              )
              if (stepInfoEntry) {
                return {
                  ...step,
                  status: stepInfoEntry.status === 'success' ? 'completed' as const :
                         stepInfoEntry.status === 'failed' ? 'failed' as const :
                         'completed' as const
                }
              }
              return step
            })
          )
        } else {
          // Mark all steps as completed if no step_info available
          setCurrentPipelineSteps(prev =>
            prev.map(step => ({ ...step, status: 'completed' as const }))
          )
        }
      } else {
        // Mark all steps as completed
        setCurrentPipelineSteps(prev =>
          prev.map(step => ({ ...step, status: 'completed' as const }))
        )
      }
      
      setCurrentJobId(null) // Stop polling
      
      const effectiveContentType = manualInputData ? manualInputData.contentType : contentType
      showSuccessToast(
        'Content processed successfully!',
        `Your ${effectiveContentType.replace('_', ' ')} is ready for review`
      )
    }

    // Handle job failure
    if (status === 'failed') {
      setIsProcessing(false)
      setError(jobStatus.data.error || 'Processing failed')
      setProcessingStep('Processing failed')
      setCurrentJobId(null) // Stop polling
      
      showSuccessToast(
        'Processing failed',
        jobStatus.data.error || 'An error occurred during processing'
      )
    }

    // Update progress on pipeline visualizer
    if (status === 'processing' && progress > 0) {
      // Try to map current_step to pipeline steps
      if (currentStep) {
        // Map step names to pipeline step IDs
        const stepNameMap: Record<string, string> = {
          'seo_keywords': 'seo_keywords',
          'social_media_marketing_brief': 'social_media_marketing_brief',
          'social_media_angle_hook': 'social_media_angle_hook',
          'social_media_post_generation': 'social_media_post_generation',
          // Also handle step descriptions
          'Step 1/4: seo keywords': 'seo_keywords',
          'Step 2/4: marketing brief': 'social_media_marketing_brief',
          'Step 3/4: angle hook': 'social_media_angle_hook',
          'Step 4/4: post generation': 'social_media_post_generation',
        }
        
        // Find matching step
        const currentStepId = stepNameMap[currentStep.toLowerCase()] || 
          currentPipelineSteps.find(step => 
            currentStep.toLowerCase().includes(step.id.toLowerCase()) ||
            step.id.toLowerCase().includes(currentStep.toLowerCase())
          )?.id
        
        if (currentStepId) {
          setCurrentPipelineSteps(prev => {
            const currentStepIndex = prev.findIndex(s => s.id === currentStepId)
            return prev.map((step, index) => {
              if (step.id === currentStepId) {
                return { ...step, status: 'in-progress' as const }
              } else if (index < currentStepIndex) {
                return { ...step, status: 'completed' as const }
              } else {
                return { ...step, status: 'pending' as const }
              }
            })
          })
        } else {
          // Fallback to progress-based calculation
          const stepIndex = Math.floor((progress / 100) * currentPipelineSteps.length)
          setCurrentPipelineSteps(prev =>
            prev.map((step, index) => ({
              ...step,
              status: index < stepIndex ? 'completed' : index === stepIndex ? 'in-progress' : 'pending'
            }))
          )
        }
      } else {
        // Calculate which step we're on based on progress
        const stepIndex = Math.floor((progress / 100) * currentPipelineSteps.length)
        setCurrentPipelineSteps(prev =>
          prev.map((step, index) => ({
            ...step,
            status: index < stepIndex ? 'completed' : index === stepIndex ? 'in-progress' : 'pending'
          }))
        )
      }
    }
  }, [jobStatus, contentType, currentPipelineSteps.length, manualInputData])

  const getContentForProcessing = () => {
    // Determine if we're using manual input or selected content
    const useManualInput = !!manualInputData
    
    const baseContent = useManualInput && manualInputData
      ? {
          id: `manual-${Date.now()}`,
          title: manualInputData.title,
          content: manualInputData.content,
          snippet: manualInputData.content.substring(0, 200) + (manualInputData.content.length > 200 ? '...' : ''),
        }
      : {
          id: selectedContent?.id || '',
          title: selectedContent?.title || '',
          content: selectedContent?.content || '',
          snippet: selectedContent?.content?.substring(0, 200) + (selectedContent?.content && selectedContent.content.length > 200 ? '...' : ''),
        }

    if (!baseContent.title.trim() || !baseContent.content.trim()) {
      throw new Error('Please provide both title and content')
    }

    const currentDate = new Date().toISOString()
    
    // Use contentType from manual input if available, otherwise from state
    const effectiveContentType = useManualInput && manualInputData ? manualInputData.contentType : contentType

    // Build content object based on type with all required fields
    switch (effectiveContentType) {
      case 'blog_post':
        return {
          id: baseContent.id,
          type: 'blog_post' as const,
          title: baseContent.title,
          content: baseContent.content,
          snippet: baseContent.snippet,
          author: 'User',
          tags: [],
          category: 'General',
          word_count: baseContent.content.split(/\s+/).length,
          metadata: {},
          created_at: currentDate,
          source_url: undefined,
        }
      
      case 'transcript':
        return {
          id: baseContent.id,
          type: 'transcript' as const,
          title: baseContent.title,
          content: baseContent.content,
          snippet: baseContent.snippet,
          speakers: [],
          duration: 0,
          transcript_type: 'podcast',
          metadata: {},
          created_at: currentDate,
          source_url: undefined,
        }
      
      case 'release_notes':
        return {
          id: baseContent.id,
          type: 'release_notes' as const,
          title: baseContent.title,
          content: baseContent.content,
          snippet: baseContent.snippet,
          version: '1.0.0',
          release_date: currentDate,
          changes: [],
          features: [],
          bug_fixes: [],
          metadata: {},
          created_at: currentDate,
        }
      
      default:
        throw new Error('Invalid content type')
    }
  }

  const handleRunFullPipeline = async () => {
    setIsProcessing(true)
    setError(null)
    setResults(null)

    // Initialize pipeline steps based on output type
    if (outputContentType === 'social_media_post') {
      setCurrentPipelineSteps(socialMediaSteps)
    } else {
      setCurrentPipelineSteps(pipelineVisualizerSteps)
    }

    try {
      const contentData = getContentForProcessing()
      const effectiveContentType = manualInputData ? manualInputData.contentType : contentType

      // Show processing toast
      const processingToast = showProcessingToast(`Processing ${effectiveContentType.replace('_', ' ')}...`)

      // Update steps as we process
      const updateStep = (stepId: string, status: 'in-progress' | 'completed') => {
        setCurrentPipelineSteps(prev => 
          prev.map(step => step.id === stepId ? { ...step, status } : step)
        )
      }

      // Validate
      updateStep('validate', 'in-progress')
      await new Promise(resolve => setTimeout(resolve, 300))
      updateStep('validate', 'completed')
      
      // Route to appropriate deterministic processor
      updateStep('analyze', 'in-progress')
      setProcessingStep(`Submitting ${effectiveContentType.replace('_', ' ')} for processing...`)
      
      let jobResponse: { data: { job_id: string } }
      switch (effectiveContentType) {
        case 'blog_post': {
          // Load pipeline config from settings
          const settings = loadPipelineSettings()
          
          const blogRequest: Record<string, unknown> = { 
            content: contentData,
            output_content_type: outputContentType
          }
          
          // Add pipeline config if available (models must be configured in settings)
          if (settings.pipeline_config) {
            blogRequest.pipeline_config = settings.pipeline_config
          }
          
          // Add social media parameters if output type is social_media_post
          if (outputContentType === 'social_media_post') {
            if (socialMediaPlatforms.length === 0 && !socialMediaPlatform) {
              throw new Error('Please select at least one social media platform')
            }
            // Use multi-platform if multiple selected, otherwise single platform (backward compatibility)
            if (socialMediaPlatforms.length > 1) {
              blogRequest.social_media_platforms = socialMediaPlatforms
            } else if (socialMediaPlatforms.length === 1) {
              blogRequest.social_media_platform = socialMediaPlatforms[0]
            } else {
              blogRequest.social_media_platform = socialMediaPlatform
            }
            if ((socialMediaPlatforms.includes('email') || socialMediaPlatform === 'email') && emailType) {
              blogRequest.email_type = emailType
            }
            if (variationsCount > 1) {
              blogRequest.variations_count = variationsCount
            }
          }
          jobResponse = await processBlogMutation.mutateAsync(blogRequest)
          break
        }
        case 'release_notes':
          jobResponse = await processReleaseNotesMutation.mutateAsync({ 
            content: contentData,
            output_content_type: outputContentType
          })
          break
        case 'transcript':
          jobResponse = await processTranscriptMutation.mutateAsync({ 
            content: contentData,
            output_content_type: outputContentType
          })
          break
        default:
          throw new Error('Invalid content type')
      }
      
      // Extract job ID and start polling
      const jobId = jobResponse.data.job_id
      if (!jobId) {
        throw new Error('No job ID returned from server')
      }
      
      setCurrentJobId(jobId)
      setProcessingStep('Job submitted, processing in background...')
      
      // Update toast to show it's queued
      processingToast.success(
        'Job submitted successfully!',
        `Your ${effectiveContentType.replace('_', ' ')} is being processed. Job ID: ${jobId.substring(0, 8)}...`
      )
      
      // Don't set isProcessing to false here - let the job status handler do it
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed'
      setError(errorMessage)
      setProcessingStep('Processing failed')
      
      // Mark current step as failed
      setCurrentPipelineSteps(prev => 
        prev.map(step => 
          step.status === 'in-progress' ? { ...step, status: 'failed' as const } : step
        )
      )
      
      // Show error toast with retry option
      processingToast.error(
        'Processing failed',
        errorMessage,
        () => handleRunFullPipeline()
      )
      
      setIsProcessing(false)
    }
  }

  const handleAnalyzeContent = async () => {
    setIsProcessing(true)
    setError(null)
    setResults(null)

    try {
      const contentData = getContentForProcessing()

      setProcessingStep('Analyzing content...')
      const result = await analyzeContentMutation.mutateAsync({ content: contentData })
      
      setResults(result.data as unknown as Record<string, unknown>)
      setProcessingStep('Analysis completed!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Content analysis failed')
      setProcessingStep('Analysis failed')
    } finally {
      setIsProcessing(false)
    }
  }

  // Update contentType when manual input changes
  useEffect(() => {
    if (manualInputData) {
      setContentType(manualInputData.contentType)
    }
  }, [manualInputData])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Unified Content Input */}
      <UnifiedContentInput
        onContentSelect={(content) => {
          if (onContentSelect) {
            onContentSelect(content)
          }
        }}
        onManualInputChange={(data) => {
          setManualInputData(data)
          if (data) {
            setManualTitle(data.title)
            setManualContent(data.content)
            setContentType(data.contentType)
          } else {
            setManualTitle('')
            setManualContent('')
          }
        }}
        selectedContent={selectedContent}
        manualTitle={manualTitle}
        manualContent={manualContent}
        contentType={contentType}
      />

      {/* Pipeline Controls */}
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <BoltIcon sx={{ color: 'warning.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Content Processor
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Direct deterministic processing - routes to specialized processor based on content type (faster & more predictable)
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Content Type Selectors */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 2,
              p: 2, 
              borderRadius: 2, 
              bgcolor: 'primary.50',
              border: 1,
              borderColor: 'primary.200'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <BoltIcon sx={{ color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.dark' }}>
                  Processing Configuration
                </Typography>
                <Chip
                  label="Deterministic"
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700, ml: 'auto' }}
                />
              </Box>
              
              <FormControl fullWidth size="small">
                <InputLabel>Input Content Type</InputLabel>
                <Select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as 'blog_post' | 'transcript' | 'release_notes')}
                  label="Input Content Type"
                >
                  <MenuItem value="blog_post">Blog Post</MenuItem>
                  <MenuItem value="transcript">Transcript</MenuItem>
                  <MenuItem value="release_notes">Release Notes</MenuItem>
                </Select>
                <Typography variant="caption" color="primary.main" sx={{ mt: 0.5, display: 'block' }}>
                  Will route to: /api/v1/process/{contentType.replace('_', '-')}
                </Typography>
              </FormControl>
              
              <FormControl fullWidth size="small">
                <InputLabel>Output Content Type</InputLabel>
                <Select
                  value={outputContentType}
                  onChange={(e) => {
                    const newType = e.target.value as 'blog_post' | 'press_release' | 'case_study' | 'social_media_post'
                    setOutputContentType(newType)
                    // Reset social media fields if not social media post
                    if (newType !== 'social_media_post') {
                      setSocialMediaPlatform('')
                      setEmailType('')
                    } else if (!socialMediaPlatform) {
                      // Set default platform if switching to social media post
                      setSocialMediaPlatform('linkedin')
                    }
                  }}
                  label="Output Content Type"
                >
                  <MenuItem value="blog_post">Blog Post</MenuItem>
                  <MenuItem value="press_release">Press Release</MenuItem>
                  <MenuItem value="case_study">Case Study</MenuItem>
                  <MenuItem value="social_media_post">Social Media Post</MenuItem>
                </Select>
                <Typography variant="caption" color="secondary.main" sx={{ mt: 0.5, display: 'block' }}>
                  Generated content will be formatted as: {outputContentType.replace('_', ' ')}
                </Typography>
              </FormControl>
              
              {outputContentType === 'social_media_post' && (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Social Media Platforms</InputLabel>
                    <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Select one or more platforms (up to 5)
                      </Typography>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={socialMediaPlatforms.includes('linkedin')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSocialMediaPlatforms([...socialMediaPlatforms, 'linkedin'])
                                  setSocialMediaPlatform('linkedin') // Keep for backward compatibility
                                } else {
                                  setSocialMediaPlatforms(socialMediaPlatforms.filter(p => p !== 'linkedin'))
                                  if (socialMediaPlatforms.length === 1) {
                                    setSocialMediaPlatform('')
                                  }
                                }
                              }}
                            />
                          }
                          label="LinkedIn"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={socialMediaPlatforms.includes('hackernews')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSocialMediaPlatforms([...socialMediaPlatforms, 'hackernews'])
                                  setSocialMediaPlatform('hackernews')
                                } else {
                                  setSocialMediaPlatforms(socialMediaPlatforms.filter(p => p !== 'hackernews'))
                                  if (socialMediaPlatforms.length === 1) {
                                    setSocialMediaPlatform('')
                                  }
                                }
                              }}
                            />
                          }
                          label="HackerNews"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={socialMediaPlatforms.includes('email')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSocialMediaPlatforms([...socialMediaPlatforms, 'email'])
                                  setSocialMediaPlatform('email')
                                  if (!emailType) {
                                    setEmailType('newsletter')
                                  }
                                } else {
                                  setSocialMediaPlatforms(socialMediaPlatforms.filter(p => p !== 'email'))
                                  if (socialMediaPlatforms.length === 1) {
                                    setSocialMediaPlatform('')
                                    setEmailType('')
                                  }
                                }
                              }}
                            />
                          }
                          label="Email"
                        />
                      </FormGroup>
                      {socialMediaPlatforms.length > 5 && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          Maximum 5 platforms allowed. Please deselect some platforms.
                        </Alert>
                      )}
                    </Box>
                  </FormControl>
                  
                  {socialMediaPlatforms.includes('email') && (
                    <FormControl fullWidth size="small">
                      <InputLabel>Email Type</InputLabel>
                      <Select
                        value={emailType}
                        onChange={(e) => setEmailType(e.target.value as 'newsletter' | 'promotional')}
                        label="Email Type"
                      >
                        <MenuItem value="newsletter">Newsletter</MenuItem>
                        <MenuItem value="promotional">Promotional</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  {/* Variations Count Selector */}
                  <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                    <InputLabel>Generate Variations</InputLabel>
                    <Select
                      value={variationsCount}
                      onChange={(e) => setVariationsCount(Number(e.target.value))}
                      label="Generate Variations"
                    >
                      <MenuItem value={1}>1 (Single Version)</MenuItem>
                      <MenuItem value={2}>2 Variations</MenuItem>
                      <MenuItem value={3}>3 Variations</MenuItem>
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Generate multiple versions for A/B testing (increases processing time)
                    </Typography>
                  </FormControl>

                  {/* Platform-Specific Hints - Show for first selected platform or all if multiple */}
                  {socialMediaPlatforms.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      {socialMediaPlatforms.length === 1 ? (
                        <PlatformHints 
                          platform={socialMediaPlatforms[0]} 
                          emailType={socialMediaPlatforms[0] === 'email' ? emailType || undefined : undefined}
                        />
                      ) : (
                        <Alert severity="info" sx={{ mb: 1 }}>
                          Generating posts for {socialMediaPlatforms.length} platforms in parallel
                        </Alert>
                      )}
                    </Box>
                  )}
                </>
              )}
            </Box>

            {/* Pipeline Visualizer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <PipelineVisualizer steps={currentPipelineSteps} />
            </motion.div>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleRunFullPipeline}
                disabled={isProcessing || (!manualInputData && !selectedContent)}
                startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                sx={{ py: 1.5, fontWeight: 600 }}
              >
                {isProcessing ? 'Processing...' : 'Process Content'}
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={handleAnalyzeContent}
                disabled={isProcessing || (!manualInputData && !selectedContent)}
                sx={{ minWidth: 56, px: 2 }}
              >
                {isProcessing ? (
                  <CircularProgress size={20} />
                ) : (
                  <SearchIcon />
                )}
              </Button>
            </Box>

            {/* Processing Status */}
            {isProcessing && processingStep && (
              <Alert 
                severity="info" 
                icon={<CircularProgress size={20} />}
                sx={{ borderRadius: 2 }}
              >
                {processingStep}
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <Alert 
                severity="error"
                icon={<ErrorIcon />}
                sx={{ borderRadius: 2 }}
              >
                {error}
              </Alert>
            )}

            {/* Success Display */}
            {results && !isProcessing && (
              <Alert 
                severity="success"
                icon={<CheckCircleIcon />}
                sx={{ borderRadius: 2 }}
              >
                Processing completed successfully!
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Results Display */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <ResultViewer result={results} />
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}

// Platform-specific hints component
function PlatformHints({ 
  platform, 
  emailType 
}: { 
  platform: string
  emailType?: string 
}) {
  const config = getPlatformConfig(platform, emailType)
  
  if (!config) return null

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 2, 
        mt: 2, 
        bgcolor: 'background.default',
        borderColor: 'primary.light'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <InfoIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
        <Typography variant="subtitle2" fontWeight="bold">
          {config.name} Guidelines
        </Typography>
        <Chip 
          label={`${config.characterLimit} char limit`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ ml: 'auto', fontSize: '0.75rem' }}
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Character Limit: <strong>{config.characterLimit.toLocaleString()}</strong> characters
        {config.characterLimitWarning && (
          <> (warning at {config.characterLimitWarning.toLocaleString()})</>
        )}
      </Typography>

      <Box sx={{ mb: 1.5 }}>
        <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
          Best Practices:
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {config.bestPractices.map((practice, idx) => (
            <li key={idx}>
              <Typography variant="caption" color="text.secondary">
                {practice}
              </Typography>
            </li>
          ))}
        </Box>
      </Box>

      {config.features.length > 0 && (
        <Box>
          <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
            Supported Features:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {config.features.map((feature) => (
              <Chip
                key={feature}
                label={feature.replace('_', ' ')}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  )
}
