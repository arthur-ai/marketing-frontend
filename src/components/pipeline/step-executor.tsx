'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { StepInfo, StepRequirementsResponse, StepExecutionRequest, JobStatusResponse } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ContentInput {
  id?: string
  title: string
  content: string
  snippet?: string
  [key: string]: any
}

export function StepExecutor() {
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

  // Fetch available steps
  const { data: stepsData, isLoading: stepsLoading } = useQuery({
    queryKey: ['pipeline-steps'],
    queryFn: async () => {
      const response = await api.getPipelineSteps()
      return response.data
    },
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

  const renderContextInput = (key: string) => {
    const description = requirements?.descriptions[key] || key
    const isStepOutput = requirements?.descriptions[key]?.includes('Output from')

    return (
      <div key={key} className="mb-4">
        <label className="block text-sm font-medium mb-2">
          {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </label>
        <p className="text-xs text-gray-500 mb-2">{description}</p>
        {isStepOutput ? (
          <textarea
            className="w-full p-2 border rounded font-mono text-sm"
            rows={8}
            placeholder={`Enter JSON for ${key}...`}
            value={contextInputs[key] || ''}
            onChange={(e) =>
              setContextInputs({ ...contextInputs, [key]: e.target.value })
            }
          />
        ) : key === 'content_type' ? (
          <select
            className="w-full p-2 border rounded"
            value={contextInputs[key] || 'blog_post'}
            onChange={(e) =>
              setContextInputs({ ...contextInputs, [key]: e.target.value })
            }
          >
            <option value="blog_post">Blog Post</option>
            <option value="release_notes">Release Notes</option>
            <option value="transcript">Transcript</option>
          </select>
        ) : (
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder={`Enter value for ${key}...`}
            value={contextInputs[key] || ''}
            onChange={(e) =>
              setContextInputs({ ...contextInputs, [key]: e.target.value })
            }
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Execute Pipeline Step</h2>
        <p className="text-gray-600 mb-6">
          Execute individual pipeline steps independently with custom inputs.
        </p>

        {/* Step Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Step</label>
          {stepsLoading ? (
            <p>Loading steps...</p>
          ) : (
            <select
              className="w-full p-2 border rounded"
              value={selectedStep}
              onChange={(e) => {
                setSelectedStep(e.target.value)
                setJobId(null)
                setError(null)
              }}
            >
              <option value="">-- Select a step --</option>
              {stepsData?.steps.map((step: StepInfo) => (
                <option key={step.step_name} value={step.step_name}>
                  {step.step_number}. {step.step_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedStep && (
          <>
            {/* Requirements Info */}
            {requirementsLoading ? (
              <p>Loading requirements...</p>
            ) : requirements && (
              <div className="mb-6 p-4 bg-blue-50 rounded">
                <h3 className="font-semibold mb-2">Step Requirements</h3>
                <p className="text-sm mb-2">
                  Step {requirements.step_number}: {requirements.step_name.replace(/_/g, ' ')}
                </p>
                <p className="text-sm text-gray-600">
                  Required context keys: {requirements.required_context_keys.join(', ')}
                </p>
              </div>
            )}

            {/* Content Input */}
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Content Input</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ID (optional)</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={contentInput.id || ''}
                    onChange={(e) =>
                      setContentInput({ ...contentInput, id: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={contentInput.title}
                    onChange={(e) =>
                      setContentInput({ ...contentInput, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content *</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows={6}
                    value={contentInput.content}
                    onChange={(e) =>
                      setContentInput({ ...contentInput, content: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Snippet (optional)</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows={2}
                    value={contentInput.snippet || ''}
                    onChange={(e) =>
                      setContentInput({ ...contentInput, snippet: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content Type (optional)</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={contentInput.content_type || 'blog_post'}
                    onChange={(e) =>
                      setContentInput({ ...contentInput, content_type: e.target.value })
                    }
                  >
                    <option value="blog_post">Blog Post</option>
                    <option value="release_notes">Release Notes</option>
                    <option value="transcript">Transcript</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Context Inputs */}
            {requirements && requirements.required_context_keys.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Context Inputs</h3>
                <div className="space-y-4">
                  {requirements.required_context_keys
                    .filter((key) => key !== 'input_content')
                    .map((key) => renderContextInput(key))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
                {error}
              </div>
            )}

            {/* Execute Button */}
            <Button
              onClick={handleExecute}
              disabled={executeMutation.isPending || !selectedStep}
              className="w-full"
            >
              {executeMutation.isPending ? 'Executing...' : 'Execute Step'}
            </Button>

            {/* Job Status */}
            {jobId && jobStatus && (
              <div className="mt-6 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Job Status</h3>
                <p className="text-sm">
                  <strong>Job ID:</strong> {jobId}
                </p>
                <p className="text-sm">
                  <strong>Status:</strong> {jobStatus.status}
                </p>
                <p className="text-sm">
                  <strong>Progress:</strong> {jobStatus.progress}%
                </p>
                {jobStatus.current_step && (
                  <p className="text-sm">
                    <strong>Current Step:</strong> {jobStatus.current_step}
                  </p>
                )}
                {jobStatus.error && (
                  <p className="text-sm text-red-600">
                    <strong>Error:</strong> {jobStatus.error}
                  </p>
                )}
                {jobStatus.status === 'completed' && jobStatus.result && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Result</h4>
                    <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-96">
                      {JSON.stringify(jobStatus.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

