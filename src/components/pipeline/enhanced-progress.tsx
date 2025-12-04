'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { Job, PipelineStepInfo } from '@/types/api'

interface EnhancedProgressProps {
  job: Job
  stepInfo?: PipelineStepInfo[]
}

export function EnhancedProgress({ job, stepInfo = [] }: EnhancedProgressProps) {
  const progressData = useMemo(() => {
    const currentStep = job.current_step
    const progress = job.progress || 0
    const status = job.status

    // Calculate ETA if we have step info
    let estimatedTimeRemaining: number | null = null
    if (stepInfo.length > 0 && status === 'processing') {
      const completedSteps = stepInfo.filter((s) => s.status === 'success')
      if (completedSteps.length > 0) {
        const avgStepTime =
          completedSteps.reduce((sum, s) => sum + (s.execution_time || 0), 0) /
          completedSteps.length
        const remainingSteps = stepInfo.length - completedSteps.length
        estimatedTimeRemaining = Math.round(avgStepTime * remainingSteps)
      }
    }

    // Find current step info
    const currentStepInfo = stepInfo.find((s) => s.step_name === currentStep)

    return {
      currentStep,
      progress,
      status,
      estimatedTimeRemaining,
      currentStepInfo,
      totalSteps: stepInfo.length,
      completedSteps: stepInfo.filter((s) => s.status === 'success').length,
    }
  }, [job, stepInfo])

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
  }

  const getStatusIcon = () => {
    switch (progressData.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing':
      case 'queued':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-600">{progressData.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressData.progress}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          {progressData.currentStep && (
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {progressData.currentStep.replace(/_/g, ' ').replace(/\b\w/g, (l) =>
                    l.toUpperCase()
                  )}
                </div>
                {progressData.totalSteps > 0 && (
                  <div className="text-xs text-gray-500">
                    Step {progressData.completedSteps + 1} of {progressData.totalSteps}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ETA */}
          {progressData.estimatedTimeRemaining !== null && progressData.status === 'processing' && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Estimated time remaining: ~{formatTime(progressData.estimatedTimeRemaining)}</span>
            </div>
          )}

          {/* Step Execution Time */}
          {progressData.currentStepInfo?.execution_time && (
            <div className="text-xs text-gray-500">
              Current step execution time: {progressData.currentStepInfo.execution_time.toFixed(2)}s
            </div>
          )}

          {/* Model Used */}
          {job.metadata?.pipeline_config && (
            <div className="text-xs text-gray-500">
              Model: {job.metadata.pipeline_config.default_model || 'gpt-5.1'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

