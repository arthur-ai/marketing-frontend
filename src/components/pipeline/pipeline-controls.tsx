'use client'

import { useState } from 'react'
import { useRunPipeline, useAnalyzeContent } from '@/hooks/useApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { ContentItem } from '@/types/api'

interface PipelineControlsProps {
  selectedContent?: ContentItem
}

export function PipelineControls({ selectedContent }: PipelineControlsProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  
  const runPipelineMutation = useRunPipeline()
  const analyzeContentMutation = useAnalyzeContent()

  const handleAnalyzeContent = async () => {
    if (!selectedContent) return

    try {
      setIsRunning(true)
      const result = await analyzeContentMutation.mutateAsync({
        content: {
          id: selectedContent.id,
          title: selectedContent.title,
          content: selectedContent.content,
          snippet: selectedContent.snippet,
          type: 'blog_post' // Default type, could be dynamic
        }
      })
      setLastResult({ type: 'analysis', data: result.data })
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const handleRunPipeline = async () => {
    if (!selectedContent) return

    try {
      setIsRunning(true)
      const result = await runPipelineMutation.mutateAsync({
        content: {
          id: selectedContent.id,
          title: selectedContent.title,
          content: selectedContent.content,
          snippet: selectedContent.snippet,
          type: 'blog_post' // Default type, could be dynamic
        }
      })
      setLastResult({ type: 'pipeline', data: result.data })
    } catch (error) {
      console.error('Pipeline failed:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = () => {
    if (isRunning) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    if (lastResult?.type === 'pipeline') {
      return lastResult.data.success ? 
        <CheckCircle className="h-4 w-4 text-green-500" /> : 
        <XCircle className="h-4 w-4 text-red-500" />
    }
    return <Play className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (isRunning) return 'Running...'
    if (lastResult?.type === 'pipeline') {
      return lastResult.data.success ? 'Completed' : 'Failed'
    }
    return 'Ready'
  }

  const getStatusVariant = () => {
    if (isRunning) return 'warning'
    if (lastResult?.type === 'pipeline') {
      return lastResult.data.success ? 'success' : 'destructive'
    }
    return 'default'
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Pipeline Controls</span>
          </CardTitle>
          <CardDescription>
            Analyze content or run the complete marketing pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedContent ? (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm text-gray-900">Selected Content:</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedContent.title}</p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={handleAnalyzeContent}
                  disabled={isRunning}
                  variant="outline"
                  className="flex-1"
                >
                  {analyzeContentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Analyze Content
                </Button>
                
                <Button
                  onClick={handleRunPipeline}
                  disabled={isRunning}
                  className="flex-1"
                >
                  {runPipelineMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Pipeline
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <Badge variant={getStatusVariant()}>
                  {getStatusText()}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Select content to run pipeline</p>
            </div>
          )}
        </CardContent>
      </Card>

      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Last {lastResult.type === 'analysis' ? 'Analysis' : 'Pipeline'} Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status:</span>
                <Badge variant={lastResult.data.success ? 'success' : 'destructive'}>
                  {lastResult.data.success ? 'Success' : 'Failed'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Message:</span>
                <span className="text-xs text-gray-600">{lastResult.data.message}</span>
              </div>
              {lastResult.data.content_id && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Content ID:</span>
                  <span className="text-xs text-gray-600 font-mono">{lastResult.data.content_id}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
