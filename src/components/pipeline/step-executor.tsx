'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import type { StepInfo, StepRequirementsResponse, StepExecutionRequest, JobStatusResponse } from '@/types/api'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Divider from '@mui/material/Divider'
import InfoIcon from '@mui/icons-material/Info'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DownloadIcon from '@mui/icons-material/Download'
import { AccordionSection } from '@/components/shared/AccordionSection'
import { JsonDisplay } from '@/components/shared/JsonDisplay'
import { CopyButton } from '@/components/shared/CopyButton'

interface ContentInput {
  id?: string
  title: string
  content: string
  snippet?: string
  [key: string]: any
}

export function StepExecutor() {
  const searchParams = useSearchParams()
  const [selectedStep, setSelectedStep] = useState<string>('')
  const [contentInput, setContentInput] = useState<ContentInput>({
    id: '',
    title: '',
    content: '',
    snippet: '',
  })
  const [contextInputs, setContextInputs] = useState<Record<string, string>>({})
  const [jobId, setJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadedFromPastRun, setLoadedFromPastRun] = useState(false)

  // Fetch available steps
  const { data: stepsData, isLoading: stepsLoading } = useQuery({
    queryKey: ['pipeline-steps'],
    queryFn: async () => {
      const response = await api.getPipelineSteps()
      return response.data
    },
  })

  // Get query params for pre-filling from past results
  const queryJobId = searchParams.get('jobId')
  const queryStepName = searchParams.get('stepName')

  // Fetch step result from past run if query params are present
  const { data: pastStepResult, isLoading: loadingPastResult } = useQuery({
    queryKey: ['step-result', queryJobId, queryStepName],
    queryFn: async () => {
      if (!queryJobId || !queryStepName) return null
      const response = await api.getStepResult(queryJobId, queryStepName)
      return response.data
    },
    enabled: !!queryJobId && !!queryStepName,
  })

  // Fetch step requirements when step is selected
  const { data: requirements, isLoading: requirementsLoading } = useQuery({
    queryKey: ['step-requirements', selectedStep],
    queryFn: async () => {
      if (!selectedStep) return null
      const response = await api.getStepRequirements(selectedStep)
      return response.data
    },
    enabled: !!selectedStep,
  })

  // Poll job status
  const { data: jobStatus, refetch: refetchJobStatus } = useQuery({
    queryKey: ['job-status', jobId],
    queryFn: async () => {
      if (!jobId) return null
      const response = await api.getJobStatus(jobId)
      return response.data
    },
    enabled: !!jobId,
    refetchInterval: (data) => {
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false
      }
      return 2000 // Poll every 2 seconds
    },
  })

  // Fetch step result when job completes to get input snapshot and output
  const { data: stepResultData } = useQuery({
    queryKey: ['step-result-detail', jobId, selectedStep],
    queryFn: async () => {
      if (!jobId || !selectedStep || jobStatus?.status !== 'completed') return null
      try {
        const response = await api.getStepResult(jobId, selectedStep)
        return response.data
      } catch (e) {
        return null
      }
    },
    enabled: !!jobId && !!selectedStep && jobStatus?.status === 'completed',
  })

  // Execute step mutation
  const executeMutation = useMutation({
    mutationFn: async (request: StepExecutionRequest) => {
      if (!selectedStep) throw new Error('No step selected')
      const response = await api.executePipelineStep(selectedStep, request)
      return response.data
    },
    onSuccess: (data) => {
      setJobId(data.job_id)
      setError(null)
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || err.message || 'Failed to execute step')
    },
  })

  // Initialize context inputs when requirements change
  useEffect(() => {
    if (requirements?.required_context_keys) {
      const newContextInputs: Record<string, string> = {}
      requirements.required_context_keys.forEach((key) => {
        if (key !== 'input_content' && !newContextInputs[key]) {
          newContextInputs[key] = ''
        }
      })
      setContextInputs(newContextInputs)
    }
  }, [requirements])

  // Pre-fill from past result when available
  useEffect(() => {
    if (queryStepName && pastStepResult && requirements) {
      setSelectedStep(queryStepName)
      setLoadedFromPastRun(true)
      
      // Extract result data from past step result
      const resultData = pastStepResult.result || pastStepResult
      
      // Pre-fill context inputs
      const preFilledContext: Record<string, string> = {}
      requirements.required_context_keys.forEach((key) => {
        if (key !== 'input_content' && resultData[key] !== undefined) {
          // Convert to JSON string if it's an object
          if (typeof resultData[key] === 'object') {
            preFilledContext[key] = JSON.stringify(resultData[key], null, 2)
          } else {
            preFilledContext[key] = String(resultData[key])
          }
        }
      })
      setContextInputs(preFilledContext)
    }
  }, [queryStepName, pastStepResult, requirements])

  const handleExecute = () => {
    setError(null)

    // Validate content input
    if (!contentInput.title || !contentInput.content) {
      setError('Title and content are required')
      return
    }

    // Build context from inputs
    const context: Record<string, any> = {}
    
    // Add content_type if provided
    if (contentInput.content_type) {
      context.content_type = contentInput.content_type
    }

    // Add all context inputs (parse JSON if needed)
    requirements?.required_context_keys.forEach((key) => {
      if (key !== 'input_content' && contextInputs[key]) {
        try {
          // Try to parse as JSON, if it fails, use as string
          context[key] = JSON.parse(contextInputs[key])
        } catch {
          context[key] = contextInputs[key]
        }
      }
    })

    // Create request
    const request: StepExecutionRequest = {
      content: {
        id: contentInput.id || `step_${selectedStep}_${Date.now()}`,
        title: contentInput.title,
        content: contentInput.content,
        snippet: contentInput.snippet || '',
        ...(contentInput.content_type && { content_type: contentInput.content_type }),
      },
      context,
    }

    executeMutation.mutate(request)
  }

  // Get example value for a field
  const getExampleValue = (key: string): string => {
    const examples: Record<string, any> = {
      content_type: 'blog_post',
      seo_keywords: JSON.stringify({
        primary_keywords: ['example', 'keywords'],
        secondary_keywords: ['secondary', 'terms'],
        lsi_keywords: ['related', 'concepts']
      }, null, 2),
      marketing_brief: JSON.stringify({
        target_audience: 'Example audience',
        key_messages: ['Message 1', 'Message 2'],
        tone: 'professional'
      }, null, 2),
      article_generation: JSON.stringify({
        article_content: 'Example article content...',
        structure: 'introduction, body, conclusion'
      }, null, 2),
      seo_optimization: JSON.stringify({
        meta_title: 'Example Meta Title',
        meta_description: 'Example meta description',
        seo_score: 85
      }, null, 2),
      content_formatting: JSON.stringify({
        formatted_html: '<h1>Example</h1><p>Content</p>',
        structure: 'formatted'
      }, null, 2),
    }
    return examples[key] || (key.includes('_') ? `"example_${key}"` : `"example${key}"`)
  }

  const renderContextInput = (key: string) => {
    const description = requirements?.descriptions[key] || key
    const isStepOutput = requirements?.descriptions[key]?.includes('Output from')
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    const exampleValue = getExampleValue(key)

    if (key === 'content_type') {
      return (
        <Box key={key} sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select
              value={contextInputs[key] || 'blog_post'}
              onChange={(e) =>
                setContextInputs({ ...contextInputs, [key]: e.target.value })
              }
              label={label}
            >
              <MenuItem value="blog_post">Blog Post</MenuItem>
              <MenuItem value="release_notes">Release Notes</MenuItem>
              <MenuItem value="transcript">Transcript</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {description}
          </Typography>
        </Box>
      )
    }

    return (
      <Box key={key} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label={label}
          helperText={description}
          value={contextInputs[key] || ''}
          onChange={(e) =>
            setContextInputs({ ...contextInputs, [key]: e.target.value })
          }
          multiline={isStepOutput}
          rows={isStepOutput ? 8 : 1}
          placeholder={isStepOutput ? `Enter JSON for ${key}...` : `Enter value for ${key}...`}
          sx={{
            '& .MuiInputBase-input': isStepOutput ? {
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            } : {},
          }}
        />
        <AccordionSection
          title={<Typography variant="caption" color="text.secondary">Show Example</Typography>}
          defaultExpanded={false}
        >
          <Box
            component="pre"
            sx={{
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {exampleValue}
          </Box>
          <Button
            size="small"
            variant="outlined"
            sx={{ mt: 1 }}
            onClick={() => {
              setContextInputs({ ...contextInputs, [key]: exampleValue })
            }}
          >
            Use Example
          </Button>
        </AccordionSection>
      </Box>
    )
  }

  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: 3 }}>
      {/* Step Selector */}
      <Box sx={{ mb: 4 }}>
        <FormControl fullWidth>
          <InputLabel>Select Step</InputLabel>
          <Select
            value={selectedStep}
            onChange={(e) => {
              setSelectedStep(e.target.value)
              setJobId(null)
              setError(null)
            }}
            label="Select Step"
            disabled={stepsLoading}
          >
            <MenuItem value="">
              <em>-- Select a step --</em>
            </MenuItem>
            {stepsData?.steps.map((step: StepInfo) => (
              <MenuItem key={step.step_name} value={step.step_name}>
                {step.step_number}. {step.step_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {stepsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>

      {selectedStep && (
        <>
          {/* Banner for content loaded from past run */}
          {loadedFromPastRun && queryJobId && (
            <Alert 
              severity="info" 
              sx={{ mb: 3 }}
              icon={<CheckCircleIcon />}
            >
              <Typography variant="body2">
                Content loaded from past run (Job: {queryJobId.substring(0, 8)}...). 
                You can modify the pre-filled values before executing.
              </Typography>
            </Alert>
          )}

          {/* Requirements Info */}
          {requirementsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <CircularProgress />
            </Box>
          ) : requirements && (
            <Card 
              elevation={0} 
              sx={{ 
                mb: 4, 
                p: 3, 
                bgcolor: 'info.50', 
                borderRadius: 2,
                border: 1,
                borderColor: 'info.200'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InfoIcon sx={{ color: 'info.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Step Requirements
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Step {requirements.step_number}:</strong> {requirements.step_name.replace(/_/g, ' ')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Required context keys:</strong> {requirements.required_context_keys.join(', ')}
              </Typography>
            </Card>
          )}

          {/* Content Input */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Content Input
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <TextField
                  label="ID (optional)"
                  value={contentInput.id || ''}
                  onChange={(e) =>
                    setContentInput({ ...contentInput, id: e.target.value })
                  }
                  fullWidth
                  helperText="Unique identifier for the content"
                />
                <AccordionSection
                  title={<Typography variant="caption" color="text.secondary">Show Example</Typography>}
                  defaultExpanded={false}
                >
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    "content-123"
                  </Box>
                </AccordionSection>
              </Box>
              <Box>
                <TextField
                  label="Title"
                  value={contentInput.title}
                  onChange={(e) =>
                    setContentInput({ ...contentInput, title: e.target.value })
                  }
                  required
                  fullWidth
                  helperText="Title of the content"
                />
                <AccordionSection
                  title={<Typography variant="caption" color="text.secondary">Show Example</Typography>}
                  defaultExpanded={false}
                >
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    "Example Blog Post Title"
                  </Box>
                </AccordionSection>
              </Box>
              <Box>
                <TextField
                  label="Content"
                  value={contentInput.content}
                  onChange={(e) =>
                    setContentInput({ ...contentInput, content: e.target.value })
                  }
                  required
                  multiline
                  rows={6}
                  fullWidth
                  helperText="Main content text"
                />
                <AccordionSection
                  title={<Typography variant="caption" color="text.secondary">Show Example</Typography>}
                  defaultExpanded={false}
                >
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    "This is example content for the blog post. It can contain multiple paragraphs and should provide context for the pipeline step to process."
                  </Box>
                </AccordionSection>
              </Box>
              <Box>
                <TextField
                  label="Snippet (optional)"
                  value={contentInput.snippet || ''}
                  onChange={(e) =>
                    setContentInput({ ...contentInput, snippet: e.target.value })
                  }
                  multiline
                  rows={2}
                  fullWidth
                  helperText="Short excerpt or summary"
                />
                <AccordionSection
                  title={<Typography variant="caption" color="text.secondary">Show Example</Typography>}
                  defaultExpanded={false}
                >
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    "A brief summary of the content..."
                  </Box>
                </AccordionSection>
              </Box>
              <FormControl fullWidth>
                <InputLabel>Content Type (optional)</InputLabel>
                <Select
                  value={contentInput.content_type || 'blog_post'}
                  onChange={(e) =>
                    setContentInput({ ...contentInput, content_type: e.target.value })
                  }
                  label="Content Type (optional)"
                >
                  <MenuItem value="blog_post">Blog Post</MenuItem>
                  <MenuItem value="release_notes">Release Notes</MenuItem>
                  <MenuItem value="transcript">Transcript</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Context Inputs */}
          {requirements && requirements.required_context_keys.filter((key) => key !== 'input_content').length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Context Inputs
              </Typography>
              <Box>
                {requirements.required_context_keys
                  .filter((key) => key !== 'input_content')
                  .map((key) => renderContextInput(key))}
              </Box>
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Execute Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<PlayArrowIcon />}
            onClick={handleExecute}
            disabled={executeMutation.isPending || !selectedStep}
            sx={{ mb: 4 }}
          >
            {executeMutation.isPending ? 'Executing...' : 'Execute Step'}
          </Button>

          {/* Job Status */}
          {jobId && jobStatus && (
            <Card elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Job Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Job ID:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {jobId}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Status:
                  </Typography>
                  <Chip
                    label={jobStatus.status}
                    size="small"
                    color={
                      jobStatus.status === 'completed'
                        ? 'success'
                        : jobStatus.status === 'processing'
                        ? 'warning'
                        : jobStatus.status === 'failed'
                        ? 'error'
                        : 'default'
                    }
                    sx={{ textTransform: 'capitalize', height: 24 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Progress:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {jobStatus.progress}%
                  </Typography>
                </Box>
                {jobStatus.current_step && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Current Step:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {jobStatus.current_step}
                    </Typography>
                  </Box>
                )}
                {jobStatus.error && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Error:
                    </Typography>
                    {jobStatus.error}
                  </Alert>
                )}
              </Box>
              {jobStatus.progress > 0 && jobStatus.progress < 100 && (
                <LinearProgress
                  variant="determinate"
                  value={jobStatus.progress}
                  sx={{ mb: 2, height: 8, borderRadius: 4 }}
                />
              )}
              {jobStatus.status === 'completed' && (
                <>
                  {/* Inputs Used Section */}
                  {stepResultData?.input_snapshot && (
                    <Box sx={{ mt: 3 }}>
                      <AccordionSection
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Inputs Used
                            </Typography>
                            {stepResultData.context_keys_used && stepResultData.context_keys_used.length > 0 && (
                              <Chip label={`${stepResultData.context_keys_used.length} context keys`} size="small" sx={{ ml: 2 }} />
                            )}
                          </Box>
                        }
                        defaultExpanded={false}
                      >
                        <Box sx={{ position: 'relative' }}>
                          <JsonDisplay data={stepResultData.input_snapshot} maxHeight={400} />
                          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <CopyButton text={JSON.stringify(stepResultData.input_snapshot, null, 2)} label="Input" />
                          </Box>
                        </Box>
                        {stepResultData.context_keys_used && stepResultData.context_keys_used.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Context keys used: {stepResultData.context_keys_used.join(', ')}
                            </Typography>
                          </Box>
                        )}
                      </AccordionSection>
                    </Box>
                  )}

                  {/* Output Generated Section */}
                  {(stepResultData?.result || jobStatus.result) && (
                    <Box sx={{ mt: 3 }}>
                      <AccordionSection title="Output Generated" defaultExpanded={true}>
                        <Box sx={{ position: 'relative' }}>
                          <JsonDisplay data={stepResultData?.result || jobStatus.result} maxHeight={400} />
                          <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                            <CopyButton
                              text={JSON.stringify(stepResultData?.result || jobStatus.result, null, 2)}
                              label="Output"
                            />
                            <Button
                              size="small"
                              startIcon={<DownloadIcon />}
                              onClick={() => {
                                const blob = new Blob(
                                  [JSON.stringify(stepResultData?.result || jobStatus.result, null, 2)],
                                  { type: 'application/json' }
                                )
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `${selectedStep}_output_${jobId}.json`
                                a.click()
                                URL.revokeObjectURL(url)
                              }}
                              sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                            >
                              Download
                            </Button>
                          </Box>
                        </Box>
                      </AccordionSection>
                    </Box>
                  )}
                </>
              )}
            </Card>
          )}
        </>
      )}
    </Paper>
  )
}

