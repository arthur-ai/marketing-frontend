'use client'

import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ArticleIcon from '@mui/icons-material/Article'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import SearchIcon from '@mui/icons-material/Search'
import BoltIcon from '@mui/icons-material/Bolt'
import EditIcon from '@mui/icons-material/Edit'
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
import { Dropzone, FilePreview } from '@/components/upload/dropzone'
import { showProcessingToast, showSuccessToast } from '@/lib/toast-utils'
import { motion, AnimatePresence } from 'framer-motion'

interface OrchestratorControlsProps {
  selectedContent?: {
    id: string
    title: string
    content: string
    type: string
  }
}

export function OrchestratorControls({ selectedContent }: OrchestratorControlsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [results, setResults] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualTitle, setManualTitle] = useState('')
  const [manualContent, setManualContent] = useState('')
  const [contentType, setContentType] = useState<'blog_post' | 'transcript' | 'release_notes'>('blog_post')
  const [outputContentType, setOutputContentType] = useState<'blog_post' | 'press_release' | 'case_study' | 'social_media_post'>('blog_post')
  const [socialMediaPlatform, setSocialMediaPlatform] = useState<'linkedin' | 'hackernews' | 'email' | ''>('')
  const [emailType, setEmailType] = useState<'newsletter' | 'promotional' | ''>('')
  const [useManualInput, setUseManualInput] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const { steps: pipelineVisualizerSteps } = usePipelineSteps()
  
  // Social media pipeline steps
  const socialMediaSteps: PipelineStep[] = [
    { id: 'seo_keywords', name: 'SEO Keywords', status: 'pending', requiresApproval: true },
    { id: 'social_media_marketing_brief', name: 'Marketing Brief', status: 'pending', requiresApproval: true },
    { id: 'social_media_angle_hook', name: 'Angle & Hook', status: 'pending', requiresApproval: true },
    { id: 'social_media_post_generation', name: 'Post Generation', status: 'pending', requiresApproval: true },
  ]
  
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
  }, [outputContentType, pipelineVisualizerSteps])
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
      setResults(jobStatus.data.result || {})
      setProcessingStep('Processing completed successfully!')
      setCurrentJobId(null) // Stop polling
      
      showSuccessToast(
        'Content processed successfully!',
        `Your ${contentType.replace('_', ' ')} is ready for review`
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
      // Calculate which step we're on based on progress
      const stepIndex = Math.floor((progress / 100) * currentPipelineSteps.length)
      setCurrentPipelineSteps(prev =>
        prev.map((step, index) => ({
          ...step,
          status: index < stepIndex ? 'completed' : index === stepIndex ? 'in-progress' : 'pending'
        }))
      )
    }
  }, [jobStatus, contentType, currentPipelineSteps.length])

  const getContentForProcessing = () => {
    const baseContent = useManualInput 
      ? {
          id: `manual-${Date.now()}`,
          title: manualTitle,
          content: manualContent,
          snippet: manualContent.substring(0, 200) + (manualContent.length > 200 ? '...' : ''),
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

    // Build content object based on type with all required fields
    switch (contentType) {
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

    // Show processing toast
    const processingToast = showProcessingToast(`Processing ${contentType.replace('_', ' ')}...`)

    try {
      const contentData = getContentForProcessing()

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
      setProcessingStep(`Submitting ${contentType.replace('_', ' ')} for processing...`)
      
      let jobResponse: { data: { job_id: string } }
      switch (contentType) {
        case 'blog_post':
          const blogRequest: any = { 
            content: contentData,
            output_content_type: outputContentType
          }
          // Add social media parameters if output type is social_media_post
          if (outputContentType === 'social_media_post') {
            if (!socialMediaPlatform) {
              throw new Error('Please select a social media platform')
            }
            blogRequest.social_media_platform = socialMediaPlatform
            if (socialMediaPlatform === 'email' && emailType) {
              blogRequest.email_type = emailType
            }
          }
          jobResponse = await processBlogMutation.mutateAsync(blogRequest)
          break
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
        `Your ${contentType.replace('_', ' ')} is being processed. Job ID: ${jobId.substring(0, 8)}...`
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

  const getContentTypeColor = (type: string): 'primary' | 'success' | 'secondary' | 'default' => {
    switch (type) {
      case 'transcript':
        return 'primary'
      case 'blog_post':
        return 'success'
      case 'release_notes':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Manual Content Input */}
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <EditIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Content Input
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setUseManualInput(!useManualInput)}
              startIcon={useManualInput ? <ArticleIcon /> : <EditIcon />}
            >
              {useManualInput ? 'Use Selected Content' : 'Paste Content'}
            </Button>
          </Box>
          
          {useManualInput ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Dropzone */}
              {!uploadedFile && !manualContent && (
                <Dropzone 
                  onUpload={(file) => {
                    setUploadedFile(file)
                    // Read file content
                    const reader = new FileReader()
                    reader.onload = (e) => {
                      const content = e.target?.result as string
                      setManualContent(content)
                      setManualTitle(file.name.replace(/\.[^/.]+$/, ''))
                      showSuccessToast('File uploaded', `${file.name} loaded successfully`)
                    }
                    reader.readAsText(file)
                  }}
                />
              )}
              
              {/* File Preview */}
              <AnimatePresence>
                {uploadedFile && (
                  <FilePreview 
                    file={uploadedFile}
                    onRemove={() => {
                      setUploadedFile(null)
                      setManualContent('')
                      setManualTitle('')
                    }}
                  />
                )}
              </AnimatePresence>
              
              <TextField
                label="Title"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Enter content title..."
                fullWidth
                variant="outlined"
                size="medium"
              />
              
              <FormControl fullWidth>
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
              </FormControl>
              
              <FormControl fullWidth>
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
              </FormControl>
              
              {outputContentType === 'social_media_post' && (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Social Media Platform</InputLabel>
                    <Select
                      value={socialMediaPlatform}
                      onChange={(e) => {
                        const platform = e.target.value as 'linkedin' | 'hackernews' | 'email'
                        setSocialMediaPlatform(platform)
                        // Reset email type if not email platform
                        if (platform !== 'email') {
                          setEmailType('')
                        } else if (!emailType) {
                          // Set default email type if switching to email
                          setEmailType('newsletter')
                        }
                      }}
                      label="Social Media Platform"
                    >
                      <MenuItem value="linkedin">LinkedIn</MenuItem>
                      <MenuItem value="hackernews">Hackernews</MenuItem>
                      <MenuItem value="email">Email</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {socialMediaPlatform === 'email' && (
                    <FormControl fullWidth>
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
                </>
              )}
              
              {(uploadedFile || manualContent) && (
                <Box>
                  <TextField
                    label="Content"
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    placeholder="Paste your content here or upload a file..."
                    multiline
                    rows={10}
                    fullWidth
                    variant="outlined"
                    sx={{ fontFamily: 'monospace' }}
                  />
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {manualContent.length} characters
                  </Typography>
                </Box>
              )}
            </motion.div>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ArticleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Select content from below or click &quot;Paste Content&quot; to enter manually
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Selected Content Display */}
      {!useManualInput && selectedContent && (
        <Card elevation={2}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <ArticleIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Selected Content
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {selectedContent.title}
                </Typography>
                <Chip
                  label={String(selectedContent.type).replace('_', ' ')}
                  color={getContentTypeColor(selectedContent.type)}
                  size="small"
                  sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}>
                {selectedContent.content.substring(0, 300)}...
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {selectedContent.content.length} characters
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

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
            {/* Content Type Indicator */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 1.5,
              p: 2, 
              borderRadius: 2, 
              bgcolor: 'primary.50',
              border: 1,
              borderColor: 'primary.200'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
                <ArticleIcon sx={{ color: 'primary.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.dark' }}>
                    Input Type: <span style={{ textTransform: 'capitalize' }}>{contentType.replace('_', ' ')}</span>
                  </Typography>
                  <Typography variant="caption" color="primary.main">
                    Will route to: /api/v1/process/{contentType.replace('_', '-')}
                  </Typography>
                </Box>
                <Chip
                  label="Deterministic"
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ArticleIcon sx={{ color: 'secondary.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'secondary.dark' }}>
                    Output Type: <span style={{ textTransform: 'capitalize' }}>{outputContentType.replace('_', ' ')}</span>
                    {outputContentType === 'social_media_post' && socialMediaPlatform && (
                      <span> - {socialMediaPlatform.charAt(0).toUpperCase() + socialMediaPlatform.slice(1)}
                      {socialMediaPlatform === 'email' && emailType && ` (${emailType})`}
                      </span>
                    )}
                  </Typography>
                  <Typography variant="caption" color="secondary.main">
                    Generated content will be formatted as: {outputContentType.replace('_', ' ')}
                    {outputContentType === 'social_media_post' && socialMediaPlatform && ` for ${socialMediaPlatform}`}
                  </Typography>
                </Box>
              </Box>
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
                disabled={isProcessing || (!useManualInput && !selectedContent)}
                startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                sx={{ py: 1.5, fontWeight: 600 }}
              >
                {isProcessing ? 'Processing...' : 'Process Content'}
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={handleAnalyzeContent}
                disabled={isProcessing || (!useManualInput && !selectedContent)}
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
